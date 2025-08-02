import { app, InvocationContext, StorageBlobHandler } from '@azure/functions';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { saveReceiptResult } from '../lib/table-storage';
import { 
  GeminiResponseSchema,
  BlobTriggerMetadataSchema,
  extractUserIdFromContainerPath,
  extractMetadataFromBlobName,
  ValidationError,
  type ProcessedItem,
  type GeminiResponse
} from '../schemas/validation';
import { 
  validateBlobData,
  validateMimeType,
  executeWithRetry,
  logError,
  logMemoryUsage,
  formatProcessingResult
} from '../lib/validation-helpers';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const GEMINI_PROMPT = `
あなたは日本の税務に詳しい会計士です。レシート画像を解析して、以下の情報を抽出してください：

1. レシートの合計金額
2. レシートの日付
3. 各商品の詳細（品目名、金額、推奨勘定科目、税务上の注意点）

以下のJSON形式で正確に回答してください：

{
  "totalAmount": 合計金額（数値）,
  "receiptDate": "YYYY-MM-DD形式の日付",
  "items": [
    {
      "name": "品目名",
      "price": 金額（数値）,
      "accountSuggestion": "推奨勘定科目（例：消耗品費、交通費、会議費等）",
      "taxNote": "税務上の注意点（簡潔に）"
    }
  ]
}

注意事項：
- 金額は税込み価格を使用
- 勘定科目は一般的な事業用途を想定
- 税務上の注意点は簡潔で実用的な内容に
- 文字が不明確な場合は推測して記載
- JSONフォーマットを厳密に守る
`;

async function analyzeReceiptWithGemini(imageBuffer: Buffer, mimeType: string): Promise<GeminiResponse> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const imageParts = [
      {
        inlineData: {
          data: imageBuffer.toString('base64'),
          mimeType: mimeType
        }
      }
    ];

    const result = await model.generateContent([GEMINI_PROMPT, ...imageParts]);
    const response = await result.response;
    const text = response.text();
    
    // JSONレスポンスをパース
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Valid JSON response not found in Gemini response');
    }
    
    const rawResponse = JSON.parse(jsonMatch[0]);
    
    // zodスキーマでのデータ検証
    const validationResult = GeminiResponseSchema.safeParse(rawResponse);
    if (!validationResult.success) {
      console.error('Gemini APIレスポンスのバリデーションエラー:', validationResult.error.issues);
      throw new Error(`Gemini APIレスポンスの形式が不正です: ${validationResult.error.issues.map(i => i.message).join(', ')}`);
    }
    
    return validationResult.data;
  } catch (error: any) {
    console.error('Error analyzing receipt with Gemini:', error);
    throw new Error(`Gemini API analysis failed: ${error.message}`);
  }
}

export const processReceiptBlob: StorageBlobHandler = async (blob: unknown, context: InvocationContext): Promise<void> => {
  // メモリ使用量のログ（開始時）
  logMemoryUsage(context, 'start');

  let userId = '';
  let receiptId = '';
  let blobName = '';

  try {
    // トリガーメタデータのバリデーション
    const metadata = BlobTriggerMetadataSchema.safeParse(context.triggerMetadata);
    if (!metadata.success) {
      throw new ValidationError(metadata.error.issues, 'Blobメタデータが不正です');
    }

    blobName = metadata.data.name;
    const containerUri = metadata.data.uri;
    context.log(`Processing receipt: ${blobName}`);

    // ユーザーIDとレシートIDの抽出
    userId = extractUserIdFromContainerPath(containerUri);
    const extractedData = extractMetadataFromBlobName(blobName);
    receiptId = extractedData.receiptId;

    if (!userId) {
      throw new ValidationError([], 'ユーザーIDを特定できません');
    }

    // Blobデータのバリデーション
    const imageBuffer = validateBlobData(blob);
    const mimeType = validateMimeType(blobName);

    context.log(`Analyzing receipt with Gemini API...`);
    
    // Gemini APIで解析（リトライ付き）
    const analysisResult = await executeWithRetry(
      () => analyzeReceiptWithGemini(imageBuffer, mimeType),
      context,
      'Gemini API解析',
      { maxAttempts: 3, delayMs: 2000, backoffMultiplier: 2 }
    );
    
    context.log(`Analysis completed. Found ${analysisResult.items.length} items.`);

    // 結果をTable Storageに保存（リトライ付き）
    await executeWithRetry(
      () => saveReceiptResult(userId, receiptId, {
        receiptImageUrl: blobName,
        status: 'completed',
        items: JSON.stringify(analysisResult.items),
        totalAmount: analysisResult.totalAmount,
        receiptDate: analysisResult.receiptDate,
        createdAt: new Date(),
        updatedAt: new Date()
      }),
      context,
      'Table Storage保存',
      { maxAttempts: 3, delayMs: 1000, backoffMultiplier: 1.5 }
    );

    // 処理完了ログ
    const result = formatProcessingResult(receiptId, 'completed', {
      itemCount: analysisResult.items.length,
      totalAmount: analysisResult.totalAmount
    });
    context.log(`Receipt processing completed: ${result}`);

  } catch (error: unknown) {
    logError(context, `レシート処理エラー (${receiptId})`, error);
    
    // エラー情報をTable Storageに保存
    try {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      await saveReceiptResult(userId, receiptId, {
        status: 'failed',
        errorMessage: errorMessage.substring(0, 500), // 長さ制限
        receiptImageUrl: blobName,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    } catch (saveError: unknown) {
      logError(context, 'エラーステータスの保存に失敗', saveError);
    }
  } finally {
    // メモリ使用量のログ（終了時）
    logMemoryUsage(context, 'end');
  }
}

app.storageBlob('processReceiptBlob', {
  path: 'receipts/{name}',
  connection: 'AZURE_STORAGE_CONNECTION_STRING',  
  handler: processReceiptBlob,
});
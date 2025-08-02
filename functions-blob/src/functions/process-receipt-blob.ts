import { app, InvocationContext, StorageBlobHandler } from '@azure/functions';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { saveReceiptResult } from '../lib/table-storage';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

interface ProcessedItem {
  name: string;
  price: number;
  category?: string;
  accountSuggestion?: string;
  taxNote?: string;
}

interface GeminiResponse {
  totalAmount: number;
  receiptDate: string;
  items: ProcessedItem[];
}

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
    
    const parsedResponse = JSON.parse(jsonMatch[0]) as GeminiResponse;
    
    // データ検証
    if (!parsedResponse.totalAmount || !parsedResponse.items || !Array.isArray(parsedResponse.items)) {
      throw new Error('Invalid response structure from Gemini API');
    }
    
    return parsedResponse;
  } catch (error: any) {
    console.error('Error analyzing receipt with Gemini:', error);
    throw new Error(`Gemini API analysis failed: ${error.message}`);
  }
}

export const processReceiptBlob: StorageBlobHandler = async (blob: unknown, context: InvocationContext): Promise<void> => {
  const blobName = context.triggerMetadata?.name as string;
  const containerName = context.triggerMetadata?.uri as string;
  
  if (!blobName || !containerName) {
    context.error('Missing blob metadata');
    return;
  }

  context.log(`Processing receipt: ${blobName} in container: ${containerName}`);

  // Blob名からreceiptIdとユーザー情報を抽出
  const receiptId = blobName.split('.')[0]; // ファイル名（拡張子なし）をreceiptIdとして使用
  // ファイル名からユーザーIDを抽出（例: user123_receipt1.jpg -> user123）
  const userId = blobName.split('_')[0];

  if (!userId) {
    context.error('Unable to extract user ID from blob name');
    return;
  }

  try {
    // ファイル形式を推定
    const extension = blobName.split('.').pop()?.toLowerCase();
    let mimeType = 'image/jpeg';
    
    switch (extension) {
      case 'png':
        mimeType = 'image/png';
        break;
      case 'jpg':
      case 'jpeg':
        mimeType = 'image/jpeg';
        break;
      case 'webp':
        mimeType = 'image/webp';
        break;
      default:
        mimeType = 'image/jpeg';
    }

    context.log(`Analyzing receipt with Gemini API...`);
    
    // Gemini APIで解析
    const analysisResult = await analyzeReceiptWithGemini(blob as Buffer, mimeType);
    
    context.log(`Analysis completed. Found ${analysisResult.items.length} items.`);

    // 結果をTable Storageに保存
    await saveReceiptResult(userId, receiptId, {
      receiptImageUrl: blobName,
      status: 'completed',
      items: JSON.stringify(analysisResult.items),
      totalAmount: analysisResult.totalAmount,
      receiptDate: analysisResult.receiptDate,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    context.log(`Receipt processing completed successfully: ${receiptId}`);
  } catch (error: any) {
    context.log(`Error processing receipt ${receiptId}:`, error);
    
    // エラー情報をTable Storageに保存
    try {
      await saveReceiptResult(userId, receiptId, {
        status: 'failed',
        errorMessage: error.message || 'Unknown error occurred',
        receiptImageUrl: blobName,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    } catch (saveError: any) {
      context.log('Error saving error status:', saveError);
    }
  }
}

app.storageBlob('processReceiptBlob', {
  path: 'receipts/{name}',
  connection: 'AZURE_STORAGE_CONNECTION_STRING',  
  handler: processReceiptBlob,
});
import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from '@azure/functions';
import { BlobServiceClient } from '@azure/storage-blob';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { saveReceiptResult } from '../lib/table-storage';
import {
  ProcessReceiptSchema,
  GeminiResponseSchema,
  type ProcessedItem,
  type GeminiResponse,
} from '../schemas/validation';
import {
  validateRequestBody,
  createErrorResponse,
  createSuccessResponse,
  performSecurityChecks,
} from '../lib/validation-helpers';
import { UserId } from '../domain/value-objects/UserId';

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

async function analyzeReceiptWithGemini(
  imageBuffer: Buffer,
  mimeType: string
): Promise<GeminiResponse> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const imageParts = [
      {
        inlineData: {
          data: imageBuffer.toString('base64'),
          mimeType: mimeType,
        },
      },
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
      console.error(
        'Gemini APIレスポンスのバリデーションエラー:',
        validationResult.error.issues
      );
      throw new Error(
        `Gemini APIレスポンスの形式が不正です: ${validationResult.error.issues
          .map((i) => i.message)
          .join(', ')}`
      );
    }

    return validationResult.data;
  } catch (error: any) {
    console.error('Error analyzing receipt with Gemini:', error);
    throw new Error(`Gemini API analysis failed: ${error.message}`);
  }
}

export async function processReceipt(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  try {
    // セキュリティチェック
    performSecurityChecks(request, context, 20); // レシート処理は重い処理なので制限を厳しく

    // リクエストボディのバリデーション
    const { blobName, userId } = await validateRequestBody(
      request,
      ProcessReceiptSchema,
      context
    );

    context.log(`Processing receipt: ${blobName} for user: ${userId}`);

    // Azure Blob Storageからファイルを取得
    const blobServiceClient = BlobServiceClient.fromConnectionString(
      process.env.AZURE_STORAGE_CONNECTION_STRING || ''
    );
    const containerClient = blobServiceClient.getContainerClient(
      process.env.RECEIPT_CONTAINER_NAME || 'receipts'
    );
    const blobClient = containerClient.getBlobClient(blobName);

    // Blobが存在するかチェック
    const exists = await blobClient.exists();
    if (!exists) {
      return {
        status: 404,
        jsonBody: { error: 'Receipt image not found' },
      };
    }

    // ファイルをダウンロード
    const downloadResponse = await blobClient.download();
    const streamToBuffer = async (
      readableStream: NodeJS.ReadableStream
    ): Promise<Buffer> => {
      return new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];
        readableStream.on('data', (data) => {
          chunks.push(data instanceof Buffer ? data : Buffer.from(data));
        });
        readableStream.on('end', () => {
          resolve(Buffer.concat(chunks));
        });
        readableStream.on('error', reject);
      });
    };

    const imageBuffer = await streamToBuffer(
      downloadResponse.readableStreamBody!
    );

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
    const analysisResult = await analyzeReceiptWithGemini(
      imageBuffer,
      mimeType
    );

    context.log(
      `Analysis completed. Found ${analysisResult.items.length} items.`
    );

    const receiptId = blobName.split('.')[0];

    // UserIdを値オブジェクトに変換
    const userIdObj = UserId.create(userId);

    // 結果をTable Storageに保存
    await saveReceiptResult(userIdObj, receiptId, {
      receiptImageUrl: blobName,
      status: 'completed',
      items: JSON.stringify(analysisResult.items),
      totalAmount: analysisResult.totalAmount,
      receiptDate: analysisResult.receiptDate,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    context.log(`Receipt processing completed successfully: ${receiptId}`);

    return createSuccessResponse({
      message: 'Receipt processed successfully',
      receiptId,
      itemCount: analysisResult.items.length,
      totalAmount: analysisResult.totalAmount,
      receiptDate: analysisResult.receiptDate,
    });
  } catch (error: unknown) {
    return createErrorResponse(error, context, 500);
  }
}

app.http('processReceipt', {
  methods: ['POST'],
  authLevel: 'anonymous',
  handler: processReceipt,
});

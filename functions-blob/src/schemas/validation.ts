import { z } from 'zod';

// OWASP準拠のセキュリティ定数（apiプロジェクトと共通）
const SECURITY_LIMITS = {
  MAX_STRING_LENGTH: 1000,
  MAX_FILENAME_LENGTH: 255,
  MAX_USER_ID_LENGTH: 100,
  MIN_USER_ID_LENGTH: 1,
  MAX_BLOB_NAME_LENGTH: 1024,
  UUID_REGEX: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  SAFE_FILENAME_REGEX: /^[a-zA-Z0-9._-]+$/,
  ISO_DATE_REGEX: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/,
  CONTAINER_NAME_REGEX: /^receipts\/[a-zA-Z0-9._-]+\.(jpg|jpeg|png|webp)$/i
} as const;

// 共通バリデーション関数
export const CommonValidations = {
  // サニタイズされた文字列（XSS攻撃防止）
  sanitizedString: (maxLength: number = SECURITY_LIMITS.MAX_STRING_LENGTH) =>
    z.string()
      .trim()
      .max(maxLength, `文字列の長さは${maxLength}文字以下である必要があります`)
      .refine(
        (val) => !/<script|javascript:|on\w+=/i.test(val),
        'スクリプトタグまたはイベントハンドラーは許可されていません'
      ),

  // ユーザーID（Blob名から抽出）
  userId: z.string()
    .trim()
    .min(SECURITY_LIMITS.MIN_USER_ID_LENGTH, 'ユーザーIDは必須です')
    .max(SECURITY_LIMITS.MAX_USER_ID_LENGTH, `ユーザーIDは${SECURITY_LIMITS.MAX_USER_ID_LENGTH}文字以下である必要があります`)
    .regex(/^[a-zA-Z0-9._-]+$/, '不正な文字が含まれています'),

  // Blob名（Azure Blob Storage用）
  blobName: z.string()
    .trim()
    .min(1, 'Blob名は必須です')
    .max(SECURITY_LIMITS.MAX_BLOB_NAME_LENGTH, `Blob名は${SECURITY_LIMITS.MAX_BLOB_NAME_LENGTH}文字以下である必要があります`)
    .refine(
      (val) => /^[a-zA-Z0-9._-]+\.(jpg|jpeg|png|webp)$/i.test(val),
      'サポートされていないファイル形式です'
    ),

  // レシートID
  receiptId: z.string()
    .trim()
    .min(1, 'レシートIDは必須です')
    .max(255, 'レシートIDは255文字以下である必要があります')
    .regex(/^[a-zA-Z0-9._-]+$/, '不正な文字が含まれています'),

  // 正の数値
  positiveNumber: z.number()
    .positive('値は正の数である必要があります')
    .finite('無限大値は使用できません'),

  // 非負の数値
  nonNegativeNumber: z.number()
    .nonnegative('値は0以上である必要があります')
    .finite('無限大値は使用できません')
} as const;

// Blobトリガーメタデータのスキーマ
export const BlobTriggerMetadataSchema = z.object({
  name: CommonValidations.blobName,
  uri: z.string().url('有効なURIである必要があります'),
  properties: z.object({
    contentLength: z.number().int().positive().optional(),
    contentType: z.string().optional(),
    eTag: z.string().optional(),
    lastModified: z.string().optional()
  }).optional()
}).strict();

export type BlobTriggerMetadata = z.infer<typeof BlobTriggerMetadataSchema>;

// レシート解析結果のスキーマ（apiプロジェクトと共通）
export const ProcessedItemSchema = z.object({
  name: CommonValidations.sanitizedString(200),
  price: CommonValidations.nonNegativeNumber,
  category: CommonValidations.sanitizedString(100).optional(),
  accountSuggestion: CommonValidations.sanitizedString(100).optional(),
  taxNote: CommonValidations.sanitizedString(500).optional()
}).strict();

export const GeminiResponseSchema = z.object({
  totalAmount: CommonValidations.positiveNumber,
  receiptDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD形式である必要があります'),
  items: z.array(ProcessedItemSchema)
    .min(1, '最低1つのアイテムが必要です')
    .max(100, '最大100アイテムまで処理可能です')
}).strict();

export type ProcessedItem = z.infer<typeof ProcessedItemSchema>;
export type GeminiResponse = z.infer<typeof GeminiResponseSchema>;

// Table Storage保存データのスキーマ
export const ReceiptResultSchema = z.object({
  receiptImageUrl: CommonValidations.blobName,
  status: z.enum(['completed', 'failed', 'processing']),
  items: z.string().optional(), // JSON文字列
  totalAmount: CommonValidations.positiveNumber.optional(),
  receiptDate: z.string().optional(),
  errorMessage: CommonValidations.sanitizedString(500).optional(),
  createdAt: z.date(),
  updatedAt: z.date()
}).strict();

export type ReceiptResult = z.infer<typeof ReceiptResultSchema>;

// バリデーションエラーの処理
export class ValidationError extends Error {
  constructor(
    public readonly issues: z.ZodIssue[],
    message: string = 'バリデーションエラーが発生しました'
  ) {
    super(message);
    this.name = 'ValidationError';
  }

  toString(): string {
    return this.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`).join(', ');
  }
}

// Blob名からユーザーIDとレシートIDを抽出する関数
export function extractMetadataFromBlobName(blobName: string): { userId: string; receiptId: string } {
  // バリデーション
  const validatedBlobName = CommonValidations.blobName.parse(blobName);
  
  // ファイル名（拡張子なし）を取得
  const nameWithoutExt = validatedBlobName.split('.')[0];
  
  // 想定されるフォーマット: receipt-{timestamp}-{uuid}
  // コンテナ名がユーザーごとに分かれているため、ユーザーIDはコンテナ名から取得する必要がある
  const receiptId = nameWithoutExt;
  
  // この関数では実際にはユーザーIDを抽出できないため、
  // 呼び出し元でコンテナ名から取得する必要がある
  return {
    userId: '', // 呼び出し元で設定
    receiptId: CommonValidations.receiptId.parse(receiptId)
  };
}

// コンテナ名からユーザーIDを抽出する関数
export function extractUserIdFromContainerPath(uri: string): string {
  // URIからコンテナ名を抽出
  // 例: https://storage.blob.core.windows.net/user-12345-receipts/receipt.jpg
  const match = uri.match(/\/user-([a-zA-Z0-9._-]+)-receipts\//);
  
  if (!match || !match[1]) {
    throw new ValidationError([], 'コンテナパスからユーザーIDを抽出できません');
  }
  
  return CommonValidations.userId.parse(match[1]);
}
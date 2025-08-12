import { z } from 'zod';

// OWASP準拠のセキュリティ定数
const SECURITY_LIMITS = {
  MAX_STRING_LENGTH: 1000,
  MAX_FILENAME_LENGTH: 255,
  MAX_USER_ID_LENGTH: 100,
  MIN_USER_ID_LENGTH: 1,
  MAX_BLOB_NAME_LENGTH: 1024,
  UUID_REGEX: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  SAFE_FILENAME_REGEX: /^[a-zA-Z0-9._-]+$/,
  ISO_DATE_REGEX: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/
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

  // ユーザーID（認証済みユーザーから取得）
  userId: z.string()
    .trim()
    .min(SECURITY_LIMITS.MIN_USER_ID_LENGTH, 'ユーザーIDは必須です')
    .max(SECURITY_LIMITS.MAX_USER_ID_LENGTH, `ユーザーIDは${SECURITY_LIMITS.MAX_USER_ID_LENGTH}文字以下である必要があります`)
    .regex(/^[a-zA-Z0-9._-]+$/, '不正な文字が含まれています'),

  // ファイル名（パストラバーサル攻撃防止）
  safeFilename: z.string()
    .trim()
    .min(1, 'ファイル名は必須です')
    .max(SECURITY_LIMITS.MAX_FILENAME_LENGTH, `ファイル名は${SECURITY_LIMITS.MAX_FILENAME_LENGTH}文字以下である必要があります`)
    .regex(SECURITY_LIMITS.SAFE_FILENAME_REGEX, '不正なファイル名です')
    .refine(
      (val) => !val.includes('..') && !val.includes('/') && !val.includes('\\'),
      'パス文字は使用できません'
    ),

  // Blob名（Azure Blob Storage用）
  blobName: z.string()
    .trim()
    .min(1, 'Blob名は必須です')
    .max(SECURITY_LIMITS.MAX_BLOB_NAME_LENGTH, `Blob名は${SECURITY_LIMITS.MAX_BLOB_NAME_LENGTH}文字以下である必要があります`)
    .refine(
      (val) => /^[a-zA-Z0-9._-]+\.(jpg|jpeg|png|webp|pdf)$/i.test(val),
      'サポートされていないファイル形式です'
    ),

  // UUID
  uuid: z.string()
    .regex(SECURITY_LIMITS.UUID_REGEX, '不正なUUID形式です'),

  // ISO日付文字列
  isoDateString: z.string()
    .regex(SECURITY_LIMITS.ISO_DATE_REGEX, '不正な日付形式です'),

  // 正の数値
  positiveNumber: z.number()
    .positive('値は正の数である必要があります')
    .finite('無限大値は使用できません'),

  // 非負の数値
  nonNegativeNumber: z.number()
    .nonnegative('値は0以上である必要があります')
    .finite('無限大値は使用できません')
} as const;

// レシート処理用のスキーマ
export const ProcessReceiptSchema = z.object({
  blobName: CommonValidations.blobName,
  userId: CommonValidations.userId
}).strict(); // 未知のプロパティを拒否

export type ProcessReceiptRequest = z.infer<typeof ProcessReceiptSchema>;

// SASトークン発行用のスキーマ
export const IssueSasTokenSchema = z.object({
  fileName: CommonValidations.safeFilename.optional() // オプションのファイル名
}).strict();

export type IssueSasTokenRequest = z.infer<typeof IssueSasTokenSchema>;

// レシート結果取得用のスキーマ（クエリパラメータ用）
export const GetReceiptResultsSchema = z.object({
  limit: z.coerce.number()
    .int('整数である必要があります')
    .min(1, '最小値は1です')
    .max(100, '最大値は100です')
    .optional()
    .default(50),
  offset: z.coerce.number()
    .int('整数である必要があります')
    .min(0, '最小値は0です')
    .optional()
    .default(0)
}).strict();

export type GetReceiptResultsQuery = z.infer<typeof GetReceiptResultsSchema>;

// レシート解析結果のスキーマ
export const ProcessedItemSchema = z.object({
  name: CommonValidations.sanitizedString(200),
  price: CommonValidations.nonNegativeNumber,
  category: CommonValidations.sanitizedString(100).optional(),
  accountSuggestion: CommonValidations.sanitizedString(100).optional(),
  taxNote: CommonValidations.sanitizedString(500).optional()
}).strict();

export const GeminiResponseSchema = z.object({
  totalAmount: CommonValidations.positiveNumber,
  receiptDate: CommonValidations.isoDateString,
  items: z.array(ProcessedItemSchema)
    .min(1, '最低1つのアイテムが必要です')
    .max(100, '最大100アイテムまで処理可能です')
}).strict();

export type ProcessedItem = z.infer<typeof ProcessedItemSchema>;
export type GeminiResponse = z.infer<typeof GeminiResponseSchema>;

// エラーレスポンスのスキーマ
export const ErrorResponseSchema = z.object({
  error: CommonValidations.sanitizedString(200),
  message: CommonValidations.sanitizedString(500).optional(),
  code: z.string().optional()
}).strict();

export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;

// バリデーションエラーの処理
export class ValidationError extends Error {
  constructor(
    public readonly issues: z.ZodIssue[],
    message: string = 'バリデーションエラーが発生しました'
  ) {
    super(message);
    this.name = 'ValidationError';
  }

  toResponse(): ErrorResponse {
    return {
      error: 'バリデーションエラー',
      message: this.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`).join(', ')
    };
  }
}
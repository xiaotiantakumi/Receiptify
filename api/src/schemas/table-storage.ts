import { z } from 'zod';
import { CommonValidations } from './validation';

// Azure Table Storageのステータス
export const ReceiptStatusSchema = z.enum(['processing', 'completed', 'failed']);
export type ReceiptStatus = z.infer<typeof ReceiptStatusSchema>;

// レシート項目のスキーマ
export const ReceiptItemSchema = z.object({
  name: CommonValidations.sanitizedString(200),
  price: CommonValidations.nonNegativeNumber,
  category: CommonValidations.sanitizedString(100).optional(),
  accountSuggestion: CommonValidations.sanitizedString(100).optional(),
  taxNote: CommonValidations.sanitizedString(500).optional()
}).strict();

export type ReceiptItem = z.infer<typeof ReceiptItemSchema>;

// Azure Table Storageエンティティの基本プロパティ
export const TableEntityBaseSchema = z.object({
  partitionKey: CommonValidations.userId,
  rowKey: CommonValidations.uuid,
  etag: z.string().optional(),
  timestamp: z.string().optional()
});

// レシート結果のスキーマ
export const ReceiptResultSchema = TableEntityBaseSchema.extend({
  receiptImageUrl: z.string().url('有効なURLである必要があります'),
  status: ReceiptStatusSchema,
  items: z.string().optional(), // JSON文字列として保存
  totalAmount: CommonValidations.positiveNumber.optional(),
  receiptDate: CommonValidations.isoDateString.optional(),
  accountSuggestions: z.string().optional(), // JSON文字列として保存
  taxNotes: z.string().optional(), // JSON文字列として保存
  errorMessage: CommonValidations.sanitizedString(1000).optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date()
}).strict();

export type ReceiptResult = z.infer<typeof ReceiptResultSchema>;

// データ保存用のスキーマ（部分的な更新を許可）
export const ReceiptResultUpdateSchema = ReceiptResultSchema.partial().required({
  partitionKey: true,
  rowKey: true
});

export type ReceiptResultUpdate = z.infer<typeof ReceiptResultUpdateSchema>;

// レシート項目配列のバリデーション
export const ReceiptItemsArraySchema = z.array(ReceiptItemSchema)
  .min(0)
  .max(100, '最大100アイテムまで処理可能です');

// JSON文字列をパースしてバリデーションするヘルパー関数
export function parseAndValidateItems(itemsJson: string | undefined): ReceiptItem[] | null {
  if (!itemsJson) return null;
  
  try {
    const parsed = JSON.parse(itemsJson);
    const result = ReceiptItemsArraySchema.safeParse(parsed);
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

// レシート結果をJSON安全な形式に変換
export function serializeReceiptResult(data: {
  items?: ReceiptItem[];
  accountSuggestions?: string[];
  taxNotes?: string[];
  [key: string]: any;
}): Partial<ReceiptResult> {
  const serialized: Partial<ReceiptResult> = { ...data };
  
  if (data.items) {
    serialized.items = JSON.stringify(data.items);
  }
  
  if (data.accountSuggestions) {
    serialized.accountSuggestions = JSON.stringify(data.accountSuggestions);
  }
  
  if (data.taxNotes) {
    serialized.taxNotes = JSON.stringify(data.taxNotes);
  }
  
  return serialized;
}

// Table Storage接続設定のスキーマ
export const TableStorageConfigSchema = z.object({
  connectionString: z.string().min(1, 'Azure Storage接続文字列は必須です'),
  tableName: z.string()
    .min(3, 'テーブル名は3文字以上である必要があります')
    .max(63, 'テーブル名は63文字以下である必要があります')
    .regex(/^[a-zA-Z][a-zA-Z0-9]*$/, 'テーブル名は英字で始まり、英数字のみを含む必要があります')
}).strict();

export type TableStorageConfig = z.infer<typeof TableStorageConfigSchema>;

// 環境変数からTable Storage設定を取得してバリデーション
export function getValidatedTableConfig(): TableStorageConfig {
  const config = {
    connectionString: process.env.AZURE_STORAGE_CONNECTION_STRING || '',
    tableName: process.env.RESULTS_TABLE_NAME || 'receiptresults'
  };
  
  const result = TableStorageConfigSchema.safeParse(config);
  if (!result.success) {
    throw new Error(`Table Storage設定が無効です: ${result.error.message}`);
  }
  
  return result.data;
}
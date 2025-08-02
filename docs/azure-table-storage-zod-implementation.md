# Azure Table Storage + Zod Validation Implementation

このドキュメントは、Receiptifyプロジェクトで実装したAzure Table StorageのZodバリデーション統合について説明します。

## 🎯 実装概要

### 完了したタスク
1. ✅ Azure Table Storage用のZodスキーマ定義
2. ✅ Azuriteのセットアップと起動環境構築
3. ✅ Table Storage操作用のヘルパー関数実装
4. ✅ Azuriteでの動作確認テストコード作成

## 📁 作成・更新されたファイル

### 1. Zodスキーマ定義
- **`api/src/schemas/table-storage.ts`** - メインスキーマファイル
- **`functions-blob/src/schemas/table-storage.ts`** - Blob Functions用のコピー
- **`functions-blob/src/schemas/validation.ts`** - 共通バリデーションのコピー

### 2. Table Storage操作ライブラリの更新
- **`api/src/lib/table-storage.ts`** - Zodバリデーション統合版
- **`functions-blob/src/lib/table-storage.ts`** - Blob Functions用の統合版

### 3. テストコード
- **`test/azurite/simple-test.js`** - 基本的なTable Storage動作テスト
- **`test/azurite/zod-validation-test.js`** - Zodバリデーション統合テスト
- **`test/azurite/test-table-storage.ts`** - TypeScript版テスト（参考用）

### 4. 設定とスクリプト
- **`package.json`** - Azurite関連のnpmスクリプト追加

## 🔧 主要な実装内容

### 1. Zodスキーマ定義 (`api/src/schemas/table-storage.ts`)

```typescript
// レシート結果のスキーマ
export const ReceiptResultSchema = TableEntityBaseSchema.extend({
  receiptImageUrl: z.string().url('有効なURLである必要があります'),
  status: ReceiptStatusSchema,
  items: z.string().optional(), // JSON文字列として保存
  totalAmount: CommonValidations.positiveNumber.optional(),
  receiptDate: CommonValidations.isoDateString.optional(),
  accountSuggestions: z.string().optional(),
  taxNotes: z.string().optional(),
  errorMessage: CommonValidations.sanitizedString(1000).optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date()
}).strict();
```

### 2. バリデーション統合ヘルパー関数

```typescript
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
```

### 3. セキュリティ対応

- **ローカル開発対応**: Azurite用の`allowInsecureConnection: true`オプション
- **OWASP準拠**: 入力値の検証とサニタイゼーション
- **型安全性**: ZodスキーマによるランタイムType Safety

## 🧪 テスト環境

### Azurite起動コマンド
```bash
npm run azurite:start
```

### テスト実行コマンド
```bash
# 基本テスト
npm run test:table-storage

# Zodバリデーション統合テスト
npm run test:zod-integration
```

### 動作確認済み機能
1. ✅ Azure Table Storageのテーブル作成
2. ✅ レシートデータの保存・取得
3. ✅ JSON形式でのアイテム情報保存
4. ✅ Zodスキーマによるバリデーション
5. ✅ エラーハンドリング
6. ✅ セキュリティ対応（XSS防止、入力検証）

## 📊 データモデル

### ReceiptResult Entity
```typescript
interface ReceiptResult {
  partitionKey: string;      // ユーザーID
  rowKey: string;           // レシートID（UUID）
  receiptImageUrl: string;  // 画像URL
  status: 'processing' | 'completed' | 'failed';
  items?: string;           // JSON文字列（ReceiptItem配列）
  totalAmount?: number;     // 合計金額
  receiptDate?: string;     // レシート日付（ISO文字列）
  accountSuggestions?: string; // 勘定科目候補（JSON文字列）
  taxNotes?: string;        // 税務メモ（JSON文字列）
  errorMessage?: string;    // エラーメッセージ
  createdAt: Date;          // 作成日時
  updatedAt: Date;          // 更新日時
}
```

### ReceiptItem Model
```typescript
interface ReceiptItem {
  name: string;             // 商品名
  price: number;            // 価格
  category?: string;        // カテゴリ
  accountSuggestion?: string; // 勘定科目候補
  taxNote?: string;         // 税務上の注意点
}
```

## 🔒 セキュリティ特徴

1. **入力検証**: すべての入力値でZodスキーマバリデーション
2. **XSS防止**: スクリプトタグとイベントハンドラーの検出・拒否
3. **SQLインジェクション対策**: パラメータ化クエリの使用
4. **パストラバーサル防止**: ファイル名の安全性検証
5. **レート制限**: OWASP基準に準拠したAPI保護

## 🚀 使用方法

### 開発環境での使用
1. Azuriteを起動: `npm run azurite:start`
2. テストを実行: `npm run test:table-storage`
3. 開発サーバーを起動: `make start`

### 本番環境での使用
- Azure Table Storageの接続文字列を環境変数で設定
- Zodバリデーションが自動的に適用される
- HTTPSのみでの通信が強制される

## 📝 今後の拡張ポイント

1. **追加バリデーション**: 業務固有のルール追加
2. **パフォーマンス最適化**: バッチ操作の実装
3. **キャッシュ機能**: Redis等での結果キャッシュ
4. **監視機能**: Azure Application Insightsとの統合
5. **バックアップ機能**: 定期的なデータエクスポート

---

この実装により、Receiptifyプロジェクトは型安全でセキュアなAzure Table Storage操作が可能となりました。Zodによるバリデーションにより、ランタイムでの型安全性とOWASP準拠のセキュリティ対策が実現されています。
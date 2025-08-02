# Receiptify API

Azure Functions を使用した Receiptify のバックエンドAPIです。

## エンドポイント一覧

### 1. ヘルスチェック
```
GET /api/health
GET /api/health?detailed=true
```
- APIの稼働状態を確認
- `detailed=true`で詳細情報を取得

**レスポンス例:**
```json
{
  "status": "healthy",
  "timestamp": "2025-01-08T12:00:00.000Z",
  "service": "Receiptify API",
  "version": "1.0.0",
  "uptime": 123.456,
  "environment": "development",
  "checks": {
    "api": "ok",
    "storage": "configured",
    "geminiApi": "configured"
  }
}
```

### 2. SASトークン発行
```
POST /api/issue-sas-token
```
- 画像アップロード用のSASトークンを発行
- 認証必須

### 3. レシート解析結果取得
```
GET /api/get-receipt-results
```
- 解析済みレシートの一覧を取得
- 認証必須

### 4. レシート処理（Blob Trigger）
- Blob Storageへのアップロードで自動実行
- Gemini APIで画像解析を実行

## 開発環境セットアップ

1. 依存関係のインストール
```bash
npm install
```

2. 環境変数の設定
```bash
cp local.settings.json.example local.settings.json
```

必要な環境変数:
- `AZURE_STORAGE_CONNECTION_STRING`: Azure Storage接続文字列
- `GEMINI_API_KEY`: Google Gemini APIキー
- `RESULTS_TABLE_NAME`: Table Storage名（デフォルト: receiptresults）

3. 開発サーバーの起動
```bash
npm run start
```

## ビルド

```bash
npm run build
```

## デバッグ

ヘルスチェックエンドポイントで接続確認:
```bash
curl http://localhost:7071/api/health
```
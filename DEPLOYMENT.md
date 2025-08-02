# Receiptify デプロイメントガイド

## 前提条件

- Azure アカウント
- GitHub アカウント
- Google Cloud Platform アカウント（Gemini API用）

## Azure リソースの作成

### 1. Azure Static Web Apps の作成

1. Azure Portal にログイン
2. 「リソースの作成」→「Static Web Apps」を選択
3. 基本設定：
   - **サブスクリプション**: 適切なサブスクリプションを選択
   - **リソースグループ**: 新規作成または既存のものを選択
   - **名前**: `receiptify-app`（任意）
   - **リージョン**: `East Asia` または最寄りのリージョン
   - **デプロイメントの詳細**:
     - **ソース**: GitHub
     - **GitHub アカウント**: 認証してリポジトリを接続
     - **組織**: あなたのGitHub組織/ユーザー名
     - **リポジトリ**: `Receiptify`
     - **ブランチ**: `main`
   - **ビルドの詳細**:
     - **ビルドプリセット**: `Next.js`
     - **アプリの場所**: `/`
     - **API の場所**: `api`
     - **出力場所**: `out`

### 2. Azure Storage Account の作成

1. Azure Portal で「リソースの作成」→「ストレージアカウント」
2. 基本設定：
   - **ストレージアカウント名**: `receiptifystorage`（グローバルに一意な名前）
   - **リージョン**: Static Web Apps と同じリージョン
   - **パフォーマンス**: `Standard`
   - **冗長性**: `LRS`（ローカル冗長ストレージ）
3. 作成後、接続文字列をコピーして保存

## 環境変数の設定

### Azure Static Web Apps での環境変数設定

1. Azure Portal の Static Web Apps リソースに移動
2. 「構成」セクションを選択
3. 以下の環境変数を追加：

```
AZURE_STORAGE_CONNECTION_STRING=<Azure Storage接続文字列>
GEMINI_API_KEY=<Google Gemini APIキー>
RECEIPT_CONTAINER_NAME=receipts
RESULTS_TABLE_NAME=receiptresults
```

### Google Gemini API キーの取得

1. [Google AI Studio](https://makersuite.google.com/app/apikey) にアクセス
2. 「Create API Key」をクリック
3. 生成されたAPIキーをコピー
4. Azure Static Web Apps の環境変数として設定

## ローカル開発環境の設定

### 1. 環境変数ファイルの作成

#### `.env.local`
```env
# このファイルは .gitignore に含まれています
NEXT_PUBLIC_API_URL=http://localhost:7071/api
```

#### `api/local.settings.json`
```json
{
  "IsEncrypted": false,
  "Values": {
    "AzureWebJobsStorage": "UseDevelopmentStorage=true",
    "FUNCTIONS_WORKER_RUNTIME": "node",
    "AzureWebJobsFeatureFlags": "EnableWorkerIndexing",
    "AZURE_STORAGE_CONNECTION_STRING": "your-azure-storage-connection-string",
    "GEMINI_API_KEY": "your-gemini-api-key",
    "RECEIPT_CONTAINER_NAME": "receipts",
    "RESULTS_TABLE_NAME": "receiptresults"
  },
  "Host": {
    "LocalHttpPort": 7071,
    "CORS": "http://localhost:3000,http://localhost:4280",
    "CORSCredentials": true
  }
}
```

### 2. Azure Storage Emulator のセットアップ（オプション）

ローカル開発では Azure Storage Emulator または Azurite を使用できます：

```bash
# Azurite のインストール
npm install -g azurite

# Azurite の起動
azurite --silent --location c:\azurite --debug c:\azurite\debug.log
```

## デプロイメント手順

### 1. GitHub にコードをプッシュ

```bash
git add .
git commit -m "Production ready deployment"
git push origin main
```

### 2. 自動デプロイメント

GitHub Actions が自動的に実行され、以下の処理が行われます：
- Next.js アプリケーションのビルド
- Azure Functions のビルド
- Azure Static Web Apps へのデプロイ

### 3. デプロイメント状況の確認

1. GitHub の「Actions」タブでビルド状況を確認
2. Azure Portal の Static Web Apps リソースで「GitHub Actions の実行」を確認

## 本番環境での確認事項

### 1. 認証設定の確認

1. Azure Portal の Static Web Apps リソース
2. 「認証」セクションで以下を確認：
   - Google プロバイダーが有効
   - Microsoft プロバイダーが有効
   - 適切なリダイレクト URL が設定

### 2. CORS 設定の確認

API が適切にフロントエンドと通信できることを確認：
- Static Web Apps の URL からの API アクセスが可能
- 認証が正常に動作

### 3. 機能テスト

1. **認証テスト**:
   - Google ログイン
   - Microsoft ログイン
   - ログアウト

2. **アップロード機能テスト**:
   - レシート画像のアップロード
   - SAS トークンの生成
   - Blob Storage への保存

3. **AI 解析機能テスト**:
   - 画像解析の実行
   - 結果の Table Storage への保存
   - フロントエンドでの結果表示

4. **PWA 機能テスト**:
   - オフライン動作
   - アプリのインストール
   - プッシュ通知（設定されている場合）

## トラブルシューティング

### よくある問題と解決方法

1. **API エラー**:
   - 環境変数が正しく設定されているか確認
   - Azure Storage の接続文字列を確認
   - Gemini API キーが有効か確認

2. **認証エラー**:
   - Static Web Apps の認証設定を確認
   - リダイレクト URL が正しいか確認

3. **ビルドエラー**:
   - package.json の依存関係を確認
   - Next.js の設定を確認
   - TypeScript エラーがないか確認

## パフォーマンス最適化

### 1. Azure Functions の最適化

- 適切なタイムアウト設定
- メモリ使用量の最適化
- 同期実行数の調整

### 2. Storage の最適化

- Blob Storage のアクセス層設定
- Table Storage のパーティション戦略
- 適切な命名規則の使用

### 3. CDN の活用

Azure Static Web Apps は自動的に CDN を使用しますが、カスタム設定も可能です。

## セキュリティ考慮事項

1. **API キーの管理**:
   - 環境変数での安全な管理
   - 定期的なローテーション

2. **アクセス制御**:
   - 適切な認証の実装
   - ユーザーデータの分離

3. **HTTPS の強制**:
   - すべての通信で HTTPS を使用

## 監視とログ

### Application Insights の設定

1. Azure Portal で Application Insights リソースを作成
2. Static Web Apps と Functions に接続
3. カスタムメトリクスとログの設定

これでReceiptifyアプリケーションのデプロイメントが完了します。
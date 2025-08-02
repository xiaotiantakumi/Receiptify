# Receiptify

レシートをAIで解析して確定申告を効率化するPWA（Progressive Web App）

## 概要

Receiptifyは、レシート画像を自動で解析し、経費仕訳を効率化するWebアプリケーションです。Google Gemini APIを使用して、アップロードされたレシート画像から品目・金額・勘定科目・税務上の注意点を自動抽出し、CSV形式でエクスポートできます。

## 主要機能

### 🔐 セキュアな認証
- Azure Static Web Apps による認証
- Google・Microsoft ソーシャルログイン対応
- ユーザーごとのデータ分離

### 📄 レシート解析
- 複数レシート画像の一括アップロード
- Google Gemini API による高精度な画像解析
- 品目名・金額の自動抽出
- 勘定科目の候補提案
- 税務上の注意点の自動生成

### 💾 データ管理
- Azure Blob Storage による安全な画像保存
- Azure Table Storage による解析結果の永続化
- ユーザーごとのデータ分離とプライバシー保護

### 📊 結果の活用
- 解析結果のリアルタイム表示
- CSVエクスポート機能
- 税務申告に適した形式での出力

### 📱 PWA機能
- オフライン対応
- アプリのインストール可能
- 自動アップデート通知
- レスポンシブデザイン

## 技術スタック

### フロントエンド
- **Next.js 14** - React フレームワーク（App Router）
- **TypeScript** - 型安全性
- **Tailwind CSS** - スタイリング
- **PWA** - Progressive Web App 機能

### バックエンド
- **Azure Functions** - サーバーレス API
- **Azure Blob Storage** - 画像ファイルストレージ
- **Azure Table Storage** - 構造化データストレージ
- **Google Gemini API** - AI画像解析

### インフラ
- **Azure Static Web Apps** - ホスティング・認証
- **GitHub Actions** - CI/CD

## セットアップ

### 前提条件
- Node.js 18以上
- Azure アカウント
- Google Cloud Platform アカウント（Gemini API用）

### インストール
```bash
# リポジトリのクローン
git clone <repository-url>
cd Receiptify

# 依存関係のインストール
make install
```

### 環境変数の設定

#### フロントエンド（`.env.local`）
```env
NEXT_PUBLIC_API_URL=http://localhost:7071/api
```

#### API（`api/local.settings.json`）
```json
{
  "IsEncrypted": false,
  "Values": {
    "AzureWebJobsStorage": "UseDevelopmentStorage=true",
    "FUNCTIONS_WORKER_RUNTIME": "node",
    "AzureWebJobsFeatureFlags": "EnableWorkerIndexing",
    "AZURE_STORAGE_CONNECTION_STRING": "your-connection-string",
    "GEMINI_API_KEY": "your-gemini-api-key",
    "RECEIPT_CONTAINER_NAME": "receipts",
    "RESULTS_TABLE_NAME": "receiptresults"
  }
}
```

## 開発

### 開発サーバーの起動
```bash
# 統合開発環境（推奨）
make start

# フロントエンドのみ
make dev
```

### ビルド
```bash
# フロントエンドとAPIの両方をビルド
make build
```

### その他のコマンド
```bash
# ビルド成果物の削除
make clean

# 利用可能なコマンドの表示
make help
```

## アーキテクチャ

### データフロー
1. ユーザーがレシート画像をアップロード
2. フロントエンドがSASトークンを取得
3. 画像を直接Azure Blob Storageにアップロード
4. Blob Triggerがレシート解析関数を起動
5. Gemini APIでレシート画像を解析
6. 解析結果をAzure Table Storageに保存
7. フロントエンドが結果を取得・表示

### API エンドポイント
- `POST /api/issue-sas-token` - SASトークン発行
- `GET /api/get-receipt-results` - 解析結果取得
- `process-receipt` - Blob Trigger関数（内部使用）

## デプロイ

詳細なデプロイ手順は [DEPLOYMENT.md](./DEPLOYMENT.md) を参照してください。

### 簡単デプロイ手順
1. Azure Static Web Apps リソースを作成
2. GitHub リポジトリと接続
3. 環境変数を設定
4. main ブランチにプッシュして自動デプロイ

## プロジェクト構造

```
├── app/                    # Next.js アプリケーション
│   ├── components/         # Reactコンポーネント
│   ├── contexts/          # React Context
│   ├── hooks/             # カスタムフック
│   └── lib/               # ユーティリティ
├── api/                   # Azure Functions
│   └── src/
│       ├── functions/     # Function定義
│       └── lib/           # 共通ライブラリ
├── public/                # 静的ファイル
├── tmp/                   # 開発進捗記録
└── out/                   # ビルド出力（静的エクスポート）
```

## 開発進捗

実装は6つのフェーズに分けて実行されました：

1. **フェーズ1**: 開発環境構築
2. **フェーズ2**: 認証とストレージ基盤
3. **フェーズ3**: フロントエンドUI
4. **フェーズ4**: AI解析機能
5. **フェーズ5**: 高度な機能（CSVエクスポート、PWA）
6. **フェーズ6**: テストとデプロイ準備

詳細な進捗記録は `tmp/` ディレクトリ内の各フェーズのREADMEファイルを参照してください。

## ライセンス

このプロジェクトはMITライセンスの下で提供されています。

## 貢献

プルリクエストや Issue の報告を歓迎します！

## サポート

問題が発生した場合は：
1. [DEPLOYMENT.md](./DEPLOYMENT.md) のトラブルシューティングセクションを確認
2. GitHub Issues で報告
3. Azure リソースのログを確認
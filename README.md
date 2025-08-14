# Receiptify

レシートを AI で解析して確定申告を効率化する PWA（Progressive Web App）

## 概要

Receiptify は、レシート画像を自動で解析し、経費仕訳を効率化する Web アプリケーションです。Google Gemini API を使用して、アップロードされたレシート画像から品目・金額・勘定科目・税務上の注意点を自動抽出し、CSV 形式でエクスポートできます。

本プロジェクトは、PWA スターターテンプレートから出発し、確定申告支援機能に特化したアプリケーションとして発展させました。Azure Static Web Apps と Azure Functions を組み合わせたモダンなサーバーレスアーキテクチャを採用しています。

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
- CSV エクスポート機能
- 税務申告に適した形式での出力

### 📱 PWA 機能

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

- **Azure Functions** - サーバーレス API（HTTP API と Blob Trigger）
- **Azure Blob Storage** - 画像ファイルストレージ
- **Azure Table Storage** - 構造化データストレージ
- **Google Gemini API** - AI 画像解析
- **Zod** - スキーマ定義とバリデーション

### インフラ

- **Azure Static Web Apps** - ホスティング・認証
- **Azurite** - ローカル開発用 Azure Storage エミュレーター
- **Docker** - Azurite 実行環境
- **GitHub Actions** - CI/CD

## セットアップ

### 前提条件

- Node.js 18 以上
- Docker（Azurite 用）
- Azure アカウント（本番デプロイ用）
- Google Cloud Platform アカウント（Gemini API 用）

### インストール

```bash
# リポジトリのクローン
git clone <repository-url>
cd Receiptify

# 全ての依存関係をインストール（フロントエンド、API、Blob Functions）
make install

# Azuriteセットアップ（Docker含む）
make install-azurite
```

### 環境変数の設定

#### フロントエンド（`.env.local`）

```env
NEXT_PUBLIC_API_URL=http://localhost:7071/api
```

#### HTTP API（`api/local.settings.json`）

```json
{
  "IsEncrypted": false,
  "Values": {
    "AzureWebJobsStorage": "UseDevelopmentStorage=true",
    "FUNCTIONS_WORKER_RUNTIME": "node",
    "AzureWebJobsFeatureFlags": "EnableWorkerIndexing",
    "AZURE_STORAGE_CONNECTION_STRING": "DefaultEndpointsProtocol=http;AccountName=devstoreaccount1;AccountKey=Eby8vdM02xNOcqFlqUwJPLlmEtlCDXJ1OUzFT50uSRZ6IFsuFq2UVErCz4I6tq/K1SZFPTOtr/KBHBeksoGMGw==;BlobEndpoint=http://127.0.0.1:10000/devstoreaccount1;QueueEndpoint=http://127.0.0.1:10001/devstoreaccount1;TableEndpoint=http://127.0.0.1:10002/devstoreaccount1;",
    "GEMINI_API_KEY": "your-gemini-api-key",
    "RECEIPT_CONTAINER_NAME": "receipts",
    "RESULTS_TABLE_NAME": "receiptresults"
  }
}
```

#### Blob Functions（`functions-blob/local.settings.json`）

```json
{
  "IsEncrypted": false,
  "Values": {
    "AzureWebJobsStorage": "DefaultEndpointsProtocol=http;AccountName=devstoreaccount1;AccountKey=Eby8vdM02xNOcqFlqUwJPLlmEtlCDXJ1OUzFT50uSRZ6IFsuFq2UVErCz4I6tq/K1SZFPTOtr/KBHBeksoGMGw==;BlobEndpoint=http://127.0.0.1:10000/devstoreaccount1;QueueEndpoint=http://127.0.0.1:10001/devstoreaccount1;TableEndpoint=http://127.0.0.1:10002/devstoreaccount1;",
    "FUNCTIONS_WORKER_RUNTIME": "node",
    "AzureWebJobsFeatureFlags": "EnableWorkerIndexing",
    "AZURE_STORAGE_CONNECTION_STRING": "DefaultEndpointsProtocol=http;AccountName=devstoreaccount1;AccountKey=Eby8vdM02xNOcqFlqUwJPLlmEtlCDXJ1OUzFT50uSRZ6IFsuFq2UVErCz4I6tq/K1SZFPTOtr/KBHBeksoGMGw==;BlobEndpoint=http://127.0.0.1:10000/devstoreaccount1;QueueEndpoint=http://127.0.0.1:10001/devstoreaccount1;TableEndpoint=http://127.0.0.1:10002/devstoreaccount1;",
    "GEMINI_API_KEY": "your-gemini-api-key",
    "RECEIPT_CONTAINER_NAME": "receipts",
    "RESULTS_TABLE_NAME": "receiptresults"
  }
}
```

## 開発

### 開発サーバーの起動

```bash
# 統合開発環境（SWA CLI + HTTP API）- 推奨
make start

# 全サービス起動（SWA + HTTP API + Blob Functions + Azurite）
make start-all

# 個別起動
make dev          # フロントエンドのみ
make api          # HTTP APIのみ
make start-blob   # Blob Functionsのみ
make start-azurite # Azuriteのみ
```

**⚠️ 重要：Azurite CORS設定**

`make start-azurite` や `make start-all` を使用する場合、CORS設定は**自動的に行われます。**

もし `docker compose up -d azurite` などで手動でAzuriteを起動した場合のみ、以下のスクリプトを実行してCORS設定を行う必要があります。

```bash
# AzuriteのCORS設定（手動起動時に必要）
./set-azurite-cors.sh
```

この設定を行わないと、いくつかのFunctionsでCORSエラーが発生します。

### ローカル開発環境

プロジェクトでは Azurite を使用してローカルで Azure Storage をエミュレートします：

```bash
# Azure Storage Explorer でデータを確認
make demo-storage

# ダミーデータの作成
make demo-data

# Table Storageのテスト
make test-table
```

### 実際のレシートテスト

実際のレシート画像を使用したエンドツーエンドテストが可能です：

```bash
# 1. レシートファイルを配置
# test/sample-receipts/ に以下の命名規則でファイルを配置
# receipt_YYYYMMDD_店舗名_金額.jpg

# 2. 前提条件の起動
make start-azurite  # Azure Storage エミュレーター
make start-blob     # Blob Functions (AI解析)

# 3. 単一レシートのテスト
make test-upload-receipt RECEIPT=receipt_20241201_コンビニ_1580.jpg

# 4. 全レシートの一括テスト
make test-real-receipts
```

**テスト内容:**
- レシート画像のBlob Storageアップロード
- Google Gemini APIによる自動AI解析
- 品目・金額・勘定科目・税務注意点の抽出
- Azure Table Storageへの結果保存
- リアルタイム解析状況の監視

**対応画像形式:** JPEG, PNG, WebP

### ビルド

```bash
# 全プロジェクトのビルド
make build

# 個別ビルド
make build-blob   # Blob Functionsのみ
```

### テスト

```bash
# 全テストの実行
make test

# 個別テスト
make test-frontend  # フロントエンドテスト
make test-api       # HTTP APIテスト
make test-blob      # Blob Functionsテスト

# テストカバレッジ付き
make test-coverage
```

### 品質チェック

```bash
# 型チェック、リント、テストを一括実行
make check

# リントのみ
make lint

# .gitignore設定確認
make check-git
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
2. フロントエンドが SAS トークンを取得
3. 画像を直接 Azure Blob Storage にアップロード
4. Blob Trigger がレシート解析関数を起動
5. Gemini API でレシート画像を解析
6. 解析結果を Azure Table Storage に保存
7. フロントエンドが結果を取得・表示

### API エンドポイント

#### HTTP API (port 7071)

- `POST /api/issue-sas-token` - SAS トークン発行
- `GET /api/get-receipt-results` - 解析結果取得
- `POST /api/process-receipt` - 手動レシート処理（開発用）
- `GET /api/health` - ヘルスチェック

#### Blob Functions (port 7072)

- `process-receipt-blob` - Blob Trigger 関数（自動 AI 解析）

### アーキテクチャの特徴

- **分離された Azure Functions**: HTTP API と Blob 処理を独立したサービスに分離
- **型安全性**: Zod によるスキーマ定義と厳密なバリデーション
- **ローカル開発**: Azurite を使用した完全なローカル開発環境
- **テスト充実**: フロントエンド、API、Blob Functions の包括的テスト

## デプロイ

詳細なデプロイ手順は [DEPLOYMENT.md](./DEPLOYMENT.md) を参照してください。

### 簡単デプロイ手順

1. Azure Static Web Apps リソースを作成
2. GitHub リポジトリと接続
3. 環境変数を設定
4. main ブランチにプッシュして自動デプロイ

## プロジェクト構造

```
receiptify/
├── app/                      # Next.js フロントエンド
│   ├── components/           # Reactコンポーネント
│   │   ├── ui/              # UIコンポーネント
│   │   ├── header.tsx       # ヘッダー
│   │   ├── receipt-uploader.tsx # アップロード機能
│   │   ├── results-table.tsx    # 結果表示テーブル
│   │   └── theme-toggle.tsx     # テーマ切り替え
│   ├── contexts/            # React Context
│   ├── hooks/               # カスタムフック
│   └── lib/                 # ユーティリティ
│
├── api/                     # HTTP API (Azure Functions)
│   ├── src/
│   │   ├── functions/       # HTTP API関数
│   │   │   ├── issue-sas-token.ts
│   │   │   ├── get-receipt-results.ts
│   │   │   ├── process-receipt.ts
│   │   │   └── health.ts
│   │   ├── lib/             # 共通ライブラリ
│   │   ├── schemas/         # Zodスキーマ
│   │   └── tests/           # APIテスト
│   └── package.json
│
├── functions-blob/          # Blob Trigger Functions
│   ├── src/
│   │   ├── functions/
│   │   │   └── process-receipt-blob.ts
│   │   ├── lib/             # 共通ライブラリ
│   │   ├── schemas/         # Zodスキーマ
│   │   └── tests/           # Blobテスト
│   └── package.json
│
├── __tests__/               # フロントエンドテスト
├── docs/                    # ドキュメント
├── test/                    # 統合テスト・デバッグ
│   ├── sample-receipts/    # 実際のレシートファイル（テスト用）
│   ├── integration/        # 実レシート統合テスト
│   ├── azurite/            # Azuriteテスト
│   ├── debug/              # デバッグスクリプト
│   └── dummy-data/         # ダミーデータ生成
├── receiptify-nx/           # NXバージョン（実験的）
├── public/                  # 静的ファイル
├── out/                     # ビルド出力
├── Makefile                 # 開発コマンド
├── docker-compose.yml       # Azurite設定
├── staticwebapp.config.json # Azure SWA設定
└── README.md               # このファイル
```

## 開発状況

### 実装済み機能

- ✅ **PWA 基盤**: Next.js 14 + PWA 対応
- ✅ **認証システム**: Azure Static Web Apps 認証（Google, Microsoft）
- ✅ **画像アップロード**: SAS トークンによる直接 Blob Storage アップロード
- ✅ **AI 解析**: Google Gemini API によるレシート解析
- ✅ **データ管理**: Azure Table Storage での結果永続化
- ✅ **リアルタイム更新**: 解析状況のポーリング表示
- ✅ **CSV エクスポート**: 確定申告用データ出力
- ✅ **レスポンシブデザイン**: ダークモード対応
- ✅ **ローカル開発環境**: Azurite 完全対応
- ✅ **テスト体制**: フロントエンド・API・Blob Functions
- ✅ **実レシートテスト**: エンドツーエンド統合テスト環境

### 技術的成果

- **型安全性**: Zod による厳密なスキーマ管理
- **アーキテクチャ分離**: HTTP API と Blob 処理の独立
- **開発効率**: Makefile によるコマンド統一
- **品質管理**: ESLint + TypeScript + Jest の統合

### 開発進捗記録

実装は 6 つのフェーズに分けて実行されました：

1. **フェーズ 1**: 開発環境構築
2. **フェーズ 2**: 認証とストレージ基盤
3. **フェーズ 3**: フロントエンド UI
4. **フェーズ 4**: AI 解析機能
5. **フェーズ 5**: 高度な機能（CSV エクスポート、PWA）
6. **フェーズ 6**: テストとデプロイ準備

詳細な進捗記録は `tmp/` ディレクトリ内の各フェーズの README ファイルを参照してください。

## トラブルシューティング

### よくある問題

#### 1. Azurite が起動しない

```bash
# Dockerが起動しているか確認
docker ps

# Azuriteコンテナを再起動
make stop-azurite
make start-azurite
```

#### 2. API 接続エラー

```bash
# ポートの競合を解決
make kill-ports

# 設定ファイルを確認
cat api/local.settings.json
cat functions-blob/local.settings.json
```

#### 3. テスト失敗

```bash
# 依存関係の再インストール
make clean
make install

# 型チェックの実行
make check
```

## 関連ドキュメント

- [DEPLOYMENT.md](./DEPLOYMENT.md) - デプロイメント詳細手順
- [DEVELOPMENT.md](./DEVELOPMENT.md) - 開発環境詳細
- [docs/TESTING.md](./docs/TESTING.md) - テスト戦略
- [CLAUDE.md](./CLAUDE.md) - プロジェクト開発ガイドライン

## サポート

問題が発生した場合は：

1. 上記のトラブルシューティングを確認
2. [DEPLOYMENT.md](./DEPLOYMENT.md) のトラブルシューティングセクションを確認
3. GitHub Issues で報告
4. Azure リソースのログを確認

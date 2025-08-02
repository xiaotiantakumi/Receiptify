このファイルは、このリポジトリ内のコードを扱う際にClaude Code（claude.ai/code）へのガイドラインを提供します。

## プロジェクトの概要

これは、Next.jsとAzure Functionsを使用して構築された**確定申告支援のためのPWA（Progressive Web App）です。ユーザーがアップロードした複数のレシート画像をGemini API**を利用して解析し、経費仕訳を効率化することを目的とします。このプロジェクトは、元々PWAスターターテンプレートとして設計されたものを、特定のアプリケーション開発用に具体化させたものです。

**主要機能:**

1.  **複数レシートのアップロード**: ユーザーは複数のレシート画像を一度にアップロードできます。
2.  **AIによる自動解析**: アップロードされた画像をGemini APIが解析し、品目・金額・購入日を抽出します。
3.  **付加情報の自動生成**: 各品目に対し、AIが「勘定科目の候補」と「税務上の注意点」を自動で追記します。
4.  **データの選択とエクスポート**: ユーザーは解析結果を確認・選択し、必要なデータのみをCSV形式でダウンロードできます。

## アーキテクチャ

### フロントエンド（Next.js アプリ）

  - **フレームワーク**: Next.js 14（App Router と TypeScript 対応）
  - **静的エクスポート**: Azure Static Web Apps 用の静的エクスポート設定（`output: 'export'`）
  - **PWA**: サービスワーカーとマニフェストによる Progressive Web App サポート (`next-pwa`)
  - **スタイリング**: UI コンポーネント用の Tailwind CSS
  - **テーマ**: ダークモード対応とテーマ切り替え機能

### バックエンド (Azure)

  - **HTTP API**: `api/` ディレクトリに TypeScript Azure Functions を配置。Azure Static Web Apps のManaged Functionsとして動作。
  - **Blob Processing**: `functions-blob/` ディレクトリに独立したAzure Functions App。BlobトリガーでAI解析を自動実行。
  - **画像ストレージ**: **Azure Blob Storage** を使用。ユーザー認証と連動し、ユーザーごとにコンテナを分離してプライバシーを確保。
  - **データストレージ**: **Azure Table Storage** を使用。AIによる解析結果（品目、金額、備考など）を保存。
  - **外部API**: **Google Gemini API** を利用し、画像解析とテキスト生成を実行。

## 主要コンポーネント

  - `app/page.tsx`: アプリケーションのメインページ。レシートアップローダーと結果表示テーブルを配置。
  - `app/components/header.tsx`: アプリケーションヘッダーコンポーネント。
  - `app/components/theme-toggle.tsx`: ダーク/ライトテーマ切り替えコンポーネント。
  - **`app/components/receipt-uploader.tsx`**: レシート画像のアップロードUIと処理を担当するコンポーネント。
  - **`app/components/results-table.tsx`**: 解析結果を表示し、ユーザーによる選択とCSVエクスポート機能を提供するテーブル。
  - **`api/src/functions/issue-sas-token.ts`**: フロントエンドがBlob Storageに直接画像をアップロードするためのSASトークンを発行するAPI。
  - **`api/src/functions/process-receipt.ts`**: HTTPトリガー型のレシート処理関数（手動実行用）。
  - **`api/src/functions/get-receipt-results.ts`**: Table Storageから解析済みのレシートデータを取得し、フロントエンドに返すAPI。
  - **`functions-blob/src/functions/process-receipt-blob.ts`**: Blob Storageへの画像アップロードで自動起動するBlobトリガー関数。Gemini APIを呼び出して解析を行い、結果をTable Storageに保存する。

## 開発コマンド
このプロジェクトでは、主要な開発コマンドを Makefile で管理しています。ターミナルで make コマンドを実行してください。

# セットアップ
make install      # 全ての依存関係（フロントエンド、API、Blob Functions）をインストールします
make install-blob # Blob Functions の依存関係のみをインストールします

# 開発
make start        # 統合開発環境（SWA CLI）を起動します（推奨）
make start-blob   # Blob Functions 開発サーバーを起動します
make start-all    # 全サービス（SWA + Blob Functions）を同時起動します
make dev          # フロントエンドの開発サーバーのみを起動します

# ビルド
make build        # フロントエンド、API、Blob Functions の全てをビルドします
make build-blob   # Blob Functions のみをビルドします

# その他
make clean        # ビルド成果物を削除します
make help         # 利用可能な全てのコマンドを表示します

主要コマンドの詳細
make install: 開発を始める前に、まずこのコマンドを実行して必要なパッケージを全てインストールします。フロントエンド、API、Blob Functionsの全ての依存関係を一括インストールします。

make start: フロントエンドとHTTP APIを連携させた統合環境で開発を行うためのメインコマンドです。Azure Static Web Apps CLI を使用し、実行前に関連ポートを自動でクリーンアップします。

make start-all: 全サービス（SWA統合環境 + Blob Functions）を同時起動します。完全なローカル開発環境を構築する際に使用します。

make build: Azureへのデプロイや本番環境での動作確認のために、全てのソースコードをビルドします。

## 主要な技術詳細

### Azure Functions API

  - **`POST /api/issue-sas-token`**:
      - 役割: 認証済みユーザーに対し、画像アップロード用のSASトークンを発行します。
      - 返却: Blob Storageコンテナ名とSASトークンを含むJSONレスポンス。
  - **`POST /api/process-receipt`** (HTTPトリガー、手動実行用):
      - 役割: ユーザーが手動でレシート解析を実行する際に使用する関数。
      - 入力: `{"blobName": "ファイル名", "userId": "ユーザーID"}`
  - **`process-receipt-blob` (Blobトリガー、自動実行)**:
      - 役割: 画像がBlob Storageにアップロードされると自動実行される非同期関数。Gemini APIと連携して画像解析・備考追記を行い、結果をTable Storageに保存します。
      - 場所: `functions-blob/` ディレクトリの独立したAzure Functions App
  - **`GET /api/get-receipt-results`**:
      - 役割: フロントエンドからの要求に応じて、Table Storageから解析済みデータを取得します。
      - 返却: レシートデータの一覧を含むJSONレスポンス。

### データフロー

1.  フロントエンドが `/api/issue-sas-token` を呼び出し、SASトークンを取得。
2.  フロントエンドがSASトークンを使い、画像を直接Blob Storageにアップロード。
3.  Blob Triggerにより `process-receipt-blob` 関数（独立したAzure Functions App）が起動し、非同期でAI解析を実行。結果をTable Storageに保存。
4.  フロントエンドは `/api/get-receipt-results` を定期的にポーリングし、解析完了したデータを取得して画面に表示。

## Azure Static Web Apps 設定

プロジェクトはデプロイメントに `staticwebapp.config.json` を使用しています:

  - API ランタイム: Node.js (バージョンは適宜指定)
  - `/api/*` エンドポイントのルーティング処理。
  - セキュリティのための CSP ヘッダー。
  - **認証**: ソーシャルログイン（Microsoft, Google等）を設定し、ユーザーデータの保護を有効化。

## 重要なファイルの場所

  - フロントエンドのエントリポイント: `app/page.tsx`
  - HTTP API: `api/src/functions/` 内の各ファイル (`issue-sas-token.ts`, `process-receipt.ts`, `get-receipt-results.ts`)
  - Blob Functions: `functions-blob/src/functions/` 内のファイル (`process-receipt-blob.ts`)
  - 共通ライブラリ: `api/src/lib/` と `functions-blob/src/lib/` に個別管理
  - ビルド出力: `out/` (フロントエンド)、`api/dist/` (HTTP API)、`functions-blob/dist/` (Blob Functions)
  - 設定ファイル: `next.config.mjs`、`staticwebapp.config.json`、`tailwind.config.ts`
  - PWA 設定: `public/manifest.json`

## 開始手順 (開発者向け)

1.  このリポジトリをクローンする。
2.  依存関係をインストール: `make install`
3.  設定ファイルを作成:
    - `api/local.settings.json`: Azure Storageの接続文字列やGemini APIキーを設定
    - `functions-blob/local.settings.json`: 同様の設定をBlob Functions用にも作成
    - `.env.local`: フロントエンド用の環境変数
4.  統合環境でローカル実行: `make start` (SWA統合環境のみ) または `make start-all` (全サービス)
5.  ブラウザで `http://localhost:4280` を開く。
6.  API: `http://localhost:7071`、Blob Functions: `http://localhost:7072` で利用可能。

## カスタマイズガイド

### 新しい解析機能の追加

1.  `functions-blob/src/functions/process-receipt-blob.ts` を修正し、Gemini APIに渡すプロンプトを調整します。
2.  新しいデータを保存するために、Table Storageのスキーマを拡張します（`api/src/lib/table-storage.ts` と `functions-blob/src/lib/table-storage.ts` の両方）。
3.  フロントエンド (`app/components/results-table.tsx`) を更新し、新しいデータを表示します。

### フロントエンドの修正

1.  `app/page.tsx` をメインコンテンツ用に更新します。
2.  `app/components/` に新しいコンポーネントを追加します。
3.  `tailwind.config.ts` でテーマを修正します。

## デプロイメント

このプロジェクトは 2つのAzureリソースに分離してデプロイします:

### 1. Azure Static Web Apps (フロントエンド + HTTP API)
1.  リポジトリをGitHubにプッシュする。
2.  Azureポータルで新しいAzure Static Web Appリソースを作成し、GitHubリポジトリと接続する。
3.  アプリケーション設定に、Azure Storageの接続文字列やGemini APIキーを環境変数として登録する。
4.  Azureが自動的にCI/CDパイプラインを構築し、ビルドとデプロイを実行します。

### 2. Azure Functions App (Blob トリガー処理)
1.  別途 Azure Functions App (Consumption/Premium/Standard) を作成する。
2.  `functions-blob/` ディレクトリの内容をデプロイする。
3.  同じAzure Storageアカウントを参照するよう環境変数を設定する。
4.  Blob Storage と Functions App が同じリージョンに配置されることを推奨。

## 開発時の注意点

  - **セキュリティ**: APIキーや接続文字列などの機密情報は、`local.settings.json` や Azure のアプリケーション設定で管理し、絶対にコードにハードコーディングしないでください。
  - **コスト**: Gemini APIのコール回数やAzure Functionsの実行時間に注意してください。特に、`process-receipt-blob` 関数での処理内容がコストに直結します。
  - **共通ライブラリの管理**: 現在は `api/src/lib/` と `functions-blob/src/lib/` で個別管理しています。どちらかを変更した場合は、必要に応じて他方にも反映してください。
  - コミット前に必ず `make check` を実行してください（全プロジェクトの型チェック + リント）。
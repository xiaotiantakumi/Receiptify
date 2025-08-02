# Receiptify 開発ガイド

## 🚀 クイックスタート

### 1. 依存関係のインストール
```bash
make install
```

### 2. 開発環境の起動

#### 方法1: 2つのターミナルで起動（推奨）
```bash
# ターミナル1: フロントエンド
make dev

# ターミナル2: API
make api
```

#### 方法2: SWA CLI統合環境（本番環境に近い）
```bash
make start
```

### 3. アクセス
- フロントエンド: http://localhost:3000
- API: http://localhost:7071
- SWA統合環境: http://localhost:4280

## 🛠️ 利用可能なコマンド

```bash
# セットアップ
make install     # 全依存関係をインストール

# 開発
make dev         # フロントエンド開発サーバー
make api         # API開発サーバー
make start       # SWA統合環境

# ビルド・検証
make build       # 本番ビルド
make check       # 型チェック + リンティング
make lint        # ESLintチェック

# デプロイ
make deploy      # Azure Static Web Appsへデプロイ

# その他
make clean       # ビルド成果物削除
make help        # ヘルプ表示
```

## 📝 環境変数の設定

### フロントエンド（.env.local）
```bash
cp .env.local.example .env.local
# 必要に応じて編集
```

### API（local.settings.json）
```bash
cp api/local.settings.json.example api/local.settings.json
# 必要な環境変数を設定:
# - AZURE_STORAGE_CONNECTION_STRING
# - GEMINI_API_KEY
```

## 🔧 トラブルシューティング

### ポートが使用中の場合
```bash
make kill-ports  # ポートをクリア
```

### SWA CLIでワーカーランタイム選択が表示される場合
- 「3」（node）を選択してください

### ビルドエラーが発生した場合
```bash
make clean       # キャッシュクリア
make install     # 依存関係再インストール
make check       # 型チェック実行
```

## 📚 プロジェクト構造

```
Receiptify/
├── app/              # Next.jsフロントエンド
│   ├── components/   # Reactコンポーネント
│   ├── contexts/     # React Context
│   ├── lib/          # ユーティリティ
│   └── page.tsx      # メインページ
├── api/              # Azure Functions API
│   └── src/
│       ├── functions/  # APIエンドポイント
│       └── lib/        # 共通ライブラリ
├── public/           # 静的ファイル
├── out/              # ビルド出力（フロントエンド）
└── api/dist/         # ビルド出力（API）
```

## 🎯 開発フロー

1. **機能開発**
   - フロントエンド: `app/`ディレクトリで作業
   - API: `api/src/functions/`で新しいエンドポイント作成

2. **テスト**
   - `make dev` + `make api`で動作確認
   - `make check`で型チェック

3. **ビルド確認**
   - `make build`で本番ビルド
   - `make start`で統合環境テスト

4. **デプロイ**
   - `make deploy`でAzureへデプロイ
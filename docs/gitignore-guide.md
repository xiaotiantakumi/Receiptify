# .gitignore Configuration Guide

このドキュメントでは、Receiptifyプロジェクトで使用している`.gitignore`の設定内容と、各項目の理由について説明します。

## 🎯 概要

`.gitignore`ファイルは、Gitリポジトリに含めるべきでないファイルやディレクトリを指定するためのファイルです。このプロジェクトでは以下のカテゴリでファイルを除外しています。

## 📋 除外対象カテゴリ

### 1. Node.js & Package Managers
```gitignore
**/node_modules/
/.pnp
.pnp.js
.yarn/install-state.gz
package-lock.json.bak
```
**理由**: 
- `node_modules/`: 依存関係のファイル（容量が大きく、package.jsonから再生成可能）
- Yarn PnP関連ファイル: パッケージマネージャーの内部ファイル

### 2. Next.js & React
```gitignore
/.next/
/out/
next-env.d.ts
```
**理由**:
- `.next/`: Next.jsのビルドキャッシュ（自動生成される）
- `out/`: 静的エクスポートの出力ディレクトリ
- `next-env.d.ts`: Next.jsの型定義ファイル（自動生成）

### 3. Build & Distribution
```gitignore
**/build/
**/dist/
```
**理由**: 
- ビルド成果物は自動生成されるため、ソースコードのみを管理

### 4. TypeScript
```gitignore
*.tsbuildinfo
*.d.ts.map
```
**理由**: 
- TypeScriptの増分ビルド情報とソースマップファイル

### 5. Environment & Configuration
```gitignore
.env*
**/local.settings.json
.azure/
```
**理由**: 
- **セキュリティ重要**: APIキー、接続文字列等の機密情報を含む
- 環境固有の設定のため、リポジトリに含めるべきでない

### 6. Azure & Cloud Services
```gitignore
# Azurite (local Azure Storage emulator)
azurite-data/
test/azurite/__azurite_db_*.json
test/azurite/*.log
azurite-debug.log
__azurite_*

# Azure Functions
bin
obj
appsettings.json

# Static Web Apps
.swa/
```
**理由**: 
- Azuriteのデータベースファイル: ローカル開発用の一時データ
- Azure Functionsのビルド成果物
- Azure Static Web Appsの設定キャッシュ

### 7. Development Tools & IDEs
```gitignore
# VS Code
.vscode/settings.json
.vscode/tasks.json

# IntelliJ / WebStorm
.idea/
*.iml
```
**理由**: 
- 個人のIDE設定は開発者ごとに異なるため
- プロジェクト固有でない個人設定は除外

### 8. Operating System
```gitignore
# macOS
.DS_Store
._*

# Windows
Thumbs.db
[Dd]esktop.ini

# Linux
*~
.Trash-*
```
**理由**: 
- OS固有のメタデータファイル
- 開発環境に依存するファイル

### 9. Security & Secrets
```gitignore
*.pem
*.key
*.p12
secrets.json
.secrets
```
**理由**: 
- **セキュリティ重要**: 秘密鍵、証明書、API秘密情報
- これらが漏洩すると重大なセキュリティ問題となる

### 10. PWA & Service Workers
```gitignore
**/sw.js
**/sw.js.map
**/workbox-*.js
```
**理由**: 
- Service Workerは`next-pwa`によって自動生成される
- 手動で編集すべきでないファイル

### 11. Project Specific
```gitignore
# Receipt image uploads (for testing)
uploads/
receipts/
test-images/

# Generated documentation
docs/api/
docs/build/
```
**理由**: 
- テスト用画像ファイル: 容量が大きく、一時的なもの
- 自動生成されるドキュメント

## ⚠️ 重要な注意点

### セキュリティ関連
以下のファイルは**絶対に**リポジトリにコミットしてはいけません：

1. **`local.settings.json`** - Azure Functions の接続文字列とAPIキー
2. **`.env*`** - 環境変数ファイル（APIキー、データベース接続情報）
3. **`*.pem, *.key`** - 秘密鍵ファイル
4. **`secrets.json`** - 秘密情報設定ファイル

### パフォーマンス関連
以下のファイルは容量が大きいため除外：

1. **`node_modules/`** - 依存関係（package.jsonから復元可能）
2. **`uploads/`, `test-images/`** - テスト用画像ファイル
3. **`azurite-data/`** - ローカルストレージエミュレータのデータ

## 🔄 Keep Files (.gitkeep)

空のディレクトリをGitで管理するため、以下のファイルは除外対象から**除外**しています：

```gitignore
!tmp/.gitkeep
!public/.gitkeep
!uploads/.gitkeep
```

これにより、必要なディレクトリ構造は維持されます。

## 🛠️ カスタマイズ

### 追加すべき場合
- 新しいビルドツールを導入した場合のキャッシュファイル
- 新しいクラウドサービスを使用した場合の設定ファイル
- 開発者固有のツール設定ファイル

### 除外すべきでない場合
- プロジェクト共通の設定ファイル（ESLint, Prettier等の設定）
- チーム共通のVS Code設定（`.vscode/settings.json`を共有したい場合）
- サンプルデータ（小容量で共有したいもの）

## 📚 参考リソース

- [GitHub公式 .gitignore テンプレート](https://github.com/github/gitignore)
- [Node.js .gitignore テンプレート](https://github.com/github/gitignore/blob/main/Node.gitignore)
- [Azure Functions .gitignore ベストプラクティス](https://docs.microsoft.com/ja-jp/azure/azure-functions/functions-run-local)

---

このガイドラインに従うことで、セキュリティを保ちながら効率的な開発環境を維持できます。
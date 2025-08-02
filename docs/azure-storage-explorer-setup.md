# Azure Storage Explorer Setup Guide

このガイドでは、Azurite（ローカルAzure Storage エミュレータ）とAzure Storage Explorerを使用してTable Storageのデータを可視化する方法を説明します。

## 🎯 概要

- **Azurite**: ローカルでAzure Storageサービスをエミュレートするツール
- **Azure Storage Explorer**: Table Storage、Blob Storage等のデータを視覚的に管理できるGUIツール
- **ダミーデータ**: レシート解析結果を模擬したテストデータ

## 📋 準備手順

### 1. Azure Storage Explorerのインストール

Azure Storage ExplorerをMicrosoftの公式サイトからダウンロード・インストールしてください：
https://azure.microsoft.com/ja-jp/products/storage/storage-explorer/

### 2. Azuriteの起動

```bash
# Azuriteをバックグラウンドで起動
npm run azurite:start

# または直接起動
npx azurite --location ./test/azurite --tableHost 127.0.0.1 --queueHost 127.0.0.1 --blobHost 127.0.0.1
```

### 3. ダミーデータの作成

```bash
# Azurite起動 + ダミーデータ作成を一括実行
npm run demo:storage-explorer

# またはダミーデータのみ作成（Azuriteが既に起動済みの場合）
npm run create-dummy-data
```

## 🔌 Azure Storage Explorerへの接続

### 接続情報
- **接続文字列**: 
  ```
  DefaultEndpointsProtocol=http;AccountName=devstoreaccount1;AccountKey=Eby8vdM02xNOcqFlqUwJPLlmEtlCDXJ1OUzFT50uSRZ6IFsuFq2UVErCz4I6tq/K1SZFPTOtr/KBHBeksoGMGw==;TableEndpoint=http://127.0.0.1:10002/devstoreaccount1;
  ```
- **テーブル名**: `receiptresults`
- **エンドポイント**: `http://127.0.0.1:10002`

### 接続手順

1. **Azure Storage Explorerを起動**

2. **「Connect to Azure Storage」をクリック**
   - メイン画面の左上の接続アイコンをクリック

3. **「Storage account or service」を選択**

4. **「Connection string」を選択**

5. **接続文字列を貼り付け**
   - 上記の接続文字列をコピー＆ペースト
   - Display nameは「Azurite Local」などの分かりやすい名前を設定

6. **「Next」→「Connect」をクリック**

7. **データの確認**
   - 左サイドバーで「Azurite Local」を展開
   - 「Tables」→「receiptresults」をクリック
   - テーブルデータが表示される

## 📊 作成されるダミーデータ

### サンプルレシートデータ（5件）

| ユーザー | ステータス | 合計金額 | 内容 |
|---------|-----------|---------|------|
| user-yamada-taro | completed | ¥380 | コンビニ（おにぎり、お茶、ボールペン） |
| user-suzuki-hanako | completed | ¥4,500 | ガソリンスタンド（燃料費） |
| user-tanaka-ichiro | completed | ¥1,140 | レストラン（ランチセット、コーヒー） |
| user-yamada-taro | processing | ¥2,000 | 電器店（USBケーブル、マウスパッド） |
| user-sato-kenji | failed | - | 処理失敗（画像不鮮明エラー） |

### データ構造の特徴

1. **PartitionKey**: ユーザーID（データの分散キー）
2. **RowKey**: レシートID（UUID）
3. **JSON形式データ**: 
   - `items`: 購入アイテムの詳細
   - `accountSuggestions`: 勘定科目の候補
   - `taxNotes`: 税務上の注意点
4. **ステータス管理**: `processing`、`completed`、`failed`
5. **エラーハンドリング**: 失敗ケースも含む

## 🔍 Azure Storage Explorerでの確認ポイント

### 基本的な操作

1. **テーブル全体の確認**
   - 全レコードの一覧表示
   - PartitionKey（ユーザー）ごとのグループ化

2. **個別レコードの詳細確認**
   - レコードをダブルクリックで詳細表示
   - JSON文字列として保存されたitemsフィールドの内容
   - createdAt、updatedAtタイムスタンプ

3. **フィルタリング**
   - ステータス別の絞り込み
   - ユーザー別の絞り込み
   - 日付範囲での絞り込み

4. **データの編集・削除**
   - レコードの手動編集
   - テストデータの削除

### 確認すべきデータ項目

```json
{
  "partitionKey": "user-yamada-taro",
  "rowKey": "12345678-1234-1234-1234-123456789abc",
  "receiptImageUrl": "https://example.com/receipts/...",
  "status": "completed",
  "items": "[{\"name\":\"おにぎり（鮭）\",\"price\":120,...}]",
  "totalAmount": 380,
  "receiptDate": "2025-08-01T12:30:00.000Z",
  "accountSuggestions": "[\"福利厚生費\",\"事務用品費\"]",
  "taxNotes": "[\"軽減税率と標準税率の混在\"]",
  "createdAt": "2025-08-01T12:35:00.000Z",
  "updatedAt": "2025-08-01T12:35:00.000Z"
}
```

## 🛠️ トラブルシューティング

### よくある問題

1. **Azuriteに接続できない**
   - Azuriteが起動しているか確認: `curl http://127.0.0.1:10002`
   - ポート10002が使用中でないか確認
   - ファイアウォールの設定確認

2. **テーブルが表示されない**
   - ダミーデータが正常に作成されたか確認
   - 接続文字列の確認（特にTableEndpoint部分）

3. **データが文字化けしている**
   - UTF-8エンコーディングの確認
   - Azure Storage Explorerの文字コード設定

### リセット方法

```bash
# Azuriteのデータをリセット
rm -rf ./test/azurite/

# Azuriteを再起動してダミーデータを再作成
npm run demo:storage-explorer
```

## 📚 参考情報

- **Azurite公式ドキュメント**: https://docs.microsoft.com/ja-jp/azure/storage/common/storage-use-azurite
- **Azure Storage Explorer**: https://azure.microsoft.com/ja-jp/products/storage/storage-explorer/
- **Azure Table Storage**: https://docs.microsoft.com/ja-jp/azure/storage/tables/

---

これで、ローカル環境でAzure Table Storageのデータを視覚的に確認・管理できるようになります。レシート解析アプリケーションの開発とデバッグに活用してください。
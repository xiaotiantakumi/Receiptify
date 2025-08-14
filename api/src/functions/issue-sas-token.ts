import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from '@azure/functions';
import {
  generateDirectorySASToken,
  getUserContainerName,
  getBlobServiceClient,
} from '../lib/storage';
import {
  extractUserFromAuth,
  createErrorResponse,
  createSuccessResponse,
  performSecurityChecks,
} from '../lib/validation-helpers';

export async function issueSasToken(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log('SAS token request received');

  try {
    // セキュリティチェック
    performSecurityChecks(request, context, 50); // SASトークン発行は制限を厳しく

    // 認証情報の安全な取得
    const { userId } = extractUserFromAuth(request, context, true);

    // 固定の receipts コンテナを使用（Blob Trigger対応）
    const containerName = 'receipts';

    // Blob Serviceクライアントを取得してコンテナを作成（存在しない場合）
    const blobServiceClient = getBlobServiceClient();
    const containerClient = blobServiceClient.getContainerClient(containerName);
    await containerClient.createIfNotExists();

    // 年度別ディレクトリ構造を生成（デフォルト：2025年度）
    const currentYear = new Date().getFullYear();
    const fiscalYear = currentYear; // 実際には会計年度の計算ロジックを実装可能
    const directoryPrefix = `${userId.toString()}/${fiscalYear}`;

    // ディレクトリ全体への書き込み権限を持つSASトークンを生成
    const sasToken = await generateDirectorySASToken(containerName);

    // コンテナのベースURLを構築
    const containerUrl = containerClient.url;

    return createSuccessResponse({
      containerName,
      directoryPrefix,
      fiscalYear,
      sasToken,
      containerUrl,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1時間後
    });
  } catch (error: unknown) {
    return createErrorResponse(error, context, 500);
  }
}

app.http('issue-sas-token', {
  methods: ['POST'],
  authLevel: 'anonymous',
  handler: issueSasToken,
});

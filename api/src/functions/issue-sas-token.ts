import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { generateSASToken, getUserContainerName, getBlobServiceClient } from '../lib/storage';
import { v4 as uuidv4 } from 'uuid';
import { IssueSasTokenSchema } from '../schemas/validation';
import { 
    extractUserFromAuth, 
    createErrorResponse, 
    createSuccessResponse, 
    performSecurityChecks,
    validateRequestBody
} from '../lib/validation-helpers';

export async function issueSasToken(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log('SAS token request received');

    try {
        // セキュリティチェック
        performSecurityChecks(request, context, 50); // SASトークン発行は制限を厳しく

        // リクエストボディのバリデーション
        const requestData = await validateRequestBody(request, IssueSasTokenSchema, context);

        // 認証情報の安全な取得
        const { userId } = extractUserFromAuth(request, context, true);

        // 固定の receipts コンテナを使用（Blob Trigger対応）
        const containerName = 'receipts';
        
        // Blob Serviceクライアントを取得してコンテナを作成（存在しない場合）
        const blobServiceClient = getBlobServiceClient();
        const containerClient = blobServiceClient.getContainerClient(containerName);
        await containerClient.createIfNotExists();

        // ユーザー別ディレクトリ構造でBlob名を生成
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const receiptId = uuidv4();
        const originalFileName = requestData.fileName || 'receipt.jpg'; // デフォルトファイル名
        const fileExtension = originalFileName.split('.').pop()?.toLowerCase() || 'jpg';
        const blobName = `${userId.toString()}/${receiptId}/receipt-${timestamp}.${fileExtension}`;

        // SASトークンを生成
        const sasToken = await generateSASToken(containerName, blobName);
        
        // Blob URLを構築
        const blobUrl = `${containerClient.url}/${blobName}`;
        const sasUrl = `${blobUrl}?${sasToken}`;

        return createSuccessResponse({
            containerName,
            blobName,
            receiptId,
            sasUrl,
            blobUrl,
            expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString() // 1時間後
        });

    } catch (error: unknown) {
        return createErrorResponse(error, context, 500);
    }
}

app.http('issue-sas-token', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: issueSasToken
});
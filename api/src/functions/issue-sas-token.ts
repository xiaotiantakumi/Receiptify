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

        // リクエストボディのバリデーション（空のボディでも可）
        if (request.method === 'POST') {
            await validateRequestBody(request, IssueSasTokenSchema, context);
        }

        // 認証情報の安全な取得
        const { userId } = extractUserFromAuth(request, context, true);

        // ユーザー専用のコンテナ名を生成
        const containerName = getUserContainerName(userId);
        
        // Blob Serviceクライアントを取得してコンテナを作成（存在しない場合）
        const blobServiceClient = getBlobServiceClient();
        const containerClient = blobServiceClient.getContainerClient(containerName);
        await containerClient.createIfNotExists();

        // ユニークなBlob名を生成
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const receiptId = uuidv4();
        const blobName = `receipt-${timestamp}-${receiptId}.jpg`;

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
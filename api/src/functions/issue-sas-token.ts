import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { generateSASToken, getUserContainerName, getBlobServiceClient } from '../lib/storage';
import { v4 as uuidv4 } from 'uuid';

export async function issueSasToken(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log('SAS token request received');

    try {
        // Azure Static Web Appsの認証情報を取得
        const clientPrincipalHeader = request.headers.get('x-ms-client-principal');
        
        let userId: string;
        
        if (!clientPrincipalHeader) {
            // ローカル開発用: 認証ヘッダーがない場合はテスト用ユーザーIDを使用
            context.log('No authentication header found, using test user for local development');
            userId = 'test-user-local';
        } else {
            // Base64デコードしてユーザー情報を取得
            const clientPrincipal = JSON.parse(Buffer.from(clientPrincipalHeader, 'base64').toString());
            userId = clientPrincipal.userId;

            if (!userId) {
                return {
                    status: 401,
                    jsonBody: { error: 'Unauthorized: User ID not found' }
                };
            }
        }

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

        return {
            status: 200,
            jsonBody: {
                containerName,
                blobName,
                receiptId,
                sasUrl,
                blobUrl,
                expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString() // 1時間後
            }
        };

    } catch (error: any) {
        context.log('Error generating SAS token:', error);
        return {
            status: 500,
            jsonBody: { 
                error: 'Internal server error',
                message: error.message 
            }
        };
    }
}

app.http('issue-sas-token', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: issueSasToken
});
import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';

export async function health(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log('Health check request received');

    // 基本的なヘルスチェック情報
    const healthStatus: any = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'Receiptify API',
        version: '1.0.0',
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        checks: {
            api: 'ok',
            // Azure Storage接続チェック（環境変数の存在確認）
            storage: process.env.AZURE_STORAGE_CONNECTION_STRING ? 'configured' : 'not configured',
            // Gemini API設定チェック
            geminiApi: process.env.GEMINI_API_KEY ? 'configured' : 'not configured',
        }
    };

    // 詳細なヘルスチェック（クエリパラメータで制御）
    const detailed = request.query.get('detailed') === 'true';
    
    if (detailed) {
        // より詳細な情報を追加
        healthStatus.system = {
            nodeVersion: process.version,
            platform: process.platform,
            memoryUsage: process.memoryUsage(),
            cpuUsage: process.cpuUsage()
        };
    }

    return {
        status: 200,
        headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate'
        },
        jsonBody: healthStatus
    };
}

app.http('health', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'health',
    handler: health
});
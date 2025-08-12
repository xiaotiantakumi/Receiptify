import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { getReceiptResults } from '../lib/table-storage';
import { GetReceiptResultsSchema } from '../schemas/validation';
import { 
    extractUserFromAuth, 
    createErrorResponse, 
    createSuccessResponse, 
    performSecurityChecks,
    validateQueryParams
} from '../lib/validation-helpers';

export async function getReceiptResultsHandler(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  context.log('Get receipt results request received');

  try {
    // セキュリティチェック
    performSecurityChecks(request, context, 200); // 読み取り操作なので制限を緩く

    // 認証情報の安全な取得
    const { userId } = extractUserFromAuth(request, context, true); // 開発環境では認証をスキップ

    // クエリパラメータのバリデーション
    const queryParams = validateQueryParams(request, GetReceiptResultsSchema, context);

    context.log(`Fetching receipt results for user: ${userId}`);

    // Table Storageからユーザーのレシート結果を取得
    const results = await getReceiptResults(userId);

    context.log(`Found ${results.length} receipt results for user ${userId}`);

    return createSuccessResponse({
      results,
      count: results.length,
      limit: queryParams.limit,
      offset: queryParams.offset
    }, 200, {
      'Cache-Control': 'no-cache'
    });

  } catch (error: unknown) {
    return createErrorResponse(error, context, 500);
  }
}

app.http('getReceiptResults', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'get-receipt-results',
  handler: getReceiptResultsHandler,
});
import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { getReceiptResults } from '../lib/table-storage';

export async function getReceiptResultsHandler(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  context.log('Get receipt results request received');

  try {
    // Azure Static Web Appsの認証情報を取得
    const clientPrincipalHeader = request.headers.get('x-ms-client-principal');
    
    if (!clientPrincipalHeader) {
      return {
        status: 401,
        jsonBody: {
          error: 'Authentication required'
        }
      };
    }

    // Base64デコードしてユーザー情報を取得
    const clientPrincipal = JSON.parse(
      Buffer.from(clientPrincipalHeader, 'base64').toString('utf-8')
    );

    const userId = clientPrincipal.userId;
    if (!userId) {
      return {
        status: 401,
        jsonBody: {
          error: 'User ID not found in authentication context'
        }
      };
    }

    context.log(`Fetching receipt results for user: ${userId}`);

    // Table Storageからユーザーのレシート結果を取得
    const results = await getReceiptResults(userId);

    context.log(`Found ${results.length} receipt results for user ${userId}`);

    return {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      },
      jsonBody: {
        results,
        count: results.length
      }
    };

  } catch (error: any) {
    context.log('Error fetching receipt results:', error);
    
    return {
      status: 500,
      jsonBody: {
        error: 'Internal server error',
        message: error.message
      }
    };
  }
}

app.http('getReceiptResults', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'get-receipt-results',
  handler: getReceiptResultsHandler,
});
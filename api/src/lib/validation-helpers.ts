import {
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from '@azure/functions';
import { z } from 'zod';
import { ValidationError, ErrorResponse } from '../schemas/validation';
import { UserId } from '../domain/value-objects/UserId';

// OWASP準拠のセキュリティヘッダー
export const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Content-Security-Policy': "default-src 'self'",
  'Cache-Control': 'no-cache, no-store, must-revalidate',
  Pragma: 'no-cache',
  Expires: '0',
} as const;

// レート制限のためのメモリキャッシュ（本番環境ではRedis等を使用推奨）
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

// レート制限チェック（OWASP準拠）
export function checkRateLimit(
  identifier: string,
  maxRequests: number = 100,
  windowMinutes: number = 15
): boolean {
  const now = Date.now();
  const windowMs = windowMinutes * 60 * 1000;

  const current = rateLimitMap.get(identifier);

  if (!current || now > current.resetTime) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (current.count >= maxRequests) {
    return false;
  }

  current.count++;
  return true;
}

// 認証情報の安全な取得
export function extractUserFromAuth(
  request: HttpRequest,
  context: InvocationContext,
  allowLocalDev: boolean = true
): { userId: UserId; isLocalDev: boolean } {
  // まずx-ms-client-principalヘッダーを確認（Azure Functions標準）
  let clientPrincipalHeader = request.headers.get('x-ms-client-principal');

  // x-ms-client-principalがない場合、Cookieから認証情報を取得
  if (!clientPrincipalHeader) {
    console.log('cookieHeaderから認証情報を取得');
    const cookieHeader = request.headers.get('cookie');
    if (cookieHeader) {
      const authCookieMatch = cookieHeader.match(
        /StaticWebAppsAuthCookie=([^;]+)/
      );
      if (authCookieMatch) {
        try {
          const authCookieValue = decodeURIComponent(authCookieMatch[1]);
          // Base64デコードしてからJSONパース
          const decodedValue = Buffer.from(authCookieValue, 'base64').toString(
            'utf-8'
          );
          const authData = JSON.parse(decodedValue);
          if (authData.userId) {
            context.log('Cookieから認証情報を取得:', authData.userId);
            const userId = UserId.create(authData.userId);
            return { userId, isLocalDev: false };
          }
        } catch (error) {
          context.log('Cookieの解析に失敗:', error);
        }
      }
    }

    // 認証情報が見つからない場合はエラー
    throw new ValidationError([], '認証が必要です');
  }

  try {
    const clientPrincipal = JSON.parse(
      Buffer.from(clientPrincipalHeader, 'base64').toString('utf-8')
    );

    if (!clientPrincipal.userId || typeof clientPrincipal.userId !== 'string') {
      throw new ValidationError([], 'ユーザーIDが見つかりません');
    }

    // UserId値オブジェクトを作成（バリデーション含む）
    try {
      const userId = UserId.create(clientPrincipal.userId);
      return { userId, isLocalDev: false };
    } catch (userIdError) {
      context.error('ユーザーIDの検証に失敗:', userIdError);
      throw new ValidationError(
        [],
        `無効なユーザーID: ${
          userIdError instanceof Error ? userIdError.message : 'Unknown error'
        }`
      );
    }
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }
    context.error('認証ヘッダーの解析に失敗:', error);
    throw new ValidationError([], '認証情報の解析に失敗しました');
  }
}

// リクエストボディの安全な解析とバリデーション
export async function validateRequestBody<T>(
  request: HttpRequest,
  schema: z.ZodSchema<T>,
  context: InvocationContext
): Promise<T> {
  try {
    // Content-Typeの検証
    const contentType = request.headers.get('content-type');
    if (contentType && !contentType.includes('application/json')) {
      throw new ValidationError(
        [],
        'Content-Typeはapplication/jsonである必要があります'
      );
    }

    // ボディサイズの制限（1MB）
    const bodyText = await request.text();
    if (bodyText.length > 1024 * 1024) {
      throw new ValidationError([], 'リクエストボディが大きすぎます');
    }

    // JSONパース
    let parsedBody: unknown;
    try {
      parsedBody = JSON.parse(bodyText);
    } catch (parseError) {
      throw new ValidationError([], '不正なJSON形式です');
    }

    // スキーマバリデーション
    const result = schema.safeParse(parsedBody);
    if (!result.success) {
      throw new ValidationError(result.error.issues);
    }

    return result.data;
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }
    context.error('リクエストボディの検証に失敗:', error);
    throw new ValidationError([], 'リクエストの処理に失敗しました');
  }
}

// クエリパラメータの安全な解析とバリデーション
export function validateQueryParams<T>(
  request: HttpRequest,
  schema: z.ZodSchema<T>,
  context: InvocationContext
): T {
  try {
    // URLからクエリパラメータを取得
    const url = new URL(request.url);
    const queryParams = Object.fromEntries(url.searchParams.entries());

    const result = schema.safeParse(queryParams);
    if (!result.success) {
      throw new ValidationError(result.error.issues);
    }

    return result.data;
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }
    context.error('クエリパラメータの検証に失敗:', error);
    throw new ValidationError([], 'クエリパラメータの処理に失敗しました');
  }
}

// 安全なエラーレスポンスの生成
export function createErrorResponse(
  error: unknown,
  context: InvocationContext,
  defaultStatus: number = 500
): HttpResponseInit {
  // セキュリティヘッダーを含める
  const headers = { ...SECURITY_HEADERS, 'Content-Type': 'application/json' };

  if (error instanceof ValidationError) {
    context.log('バリデーションエラー:', error.message);
    return {
      status: 400,
      headers,
      jsonBody: error.toResponse(),
    };
  }

  // 本番環境では詳細なエラー情報を隠す
  const isProduction = process.env.NODE_ENV === 'production';

  if (isProduction) {
    context.error('内部エラー:', error);
    return {
      status: defaultStatus,
      headers,
      jsonBody: {
        error: 'Internal Server Error',
        message: 'サーバー内部でエラーが発生しました',
      } satisfies ErrorResponse,
    };
  } else {
    // 開発環境では詳細を表示
    const message = error instanceof Error ? error.message : String(error);
    context.error('エラー:', error);
    return {
      status: defaultStatus,
      headers,
      jsonBody: {
        error: 'Internal Server Error',
        message: `開発環境: ${message}`,
      } satisfies ErrorResponse,
    };
  }
}

// 成功レスポンスの生成（セキュリティヘッダー付き）
export function createSuccessResponse<T>(
  data: T,
  status: number = 200,
  additionalHeaders: Record<string, string> = {}
): HttpResponseInit {
  return {
    status,
    headers: {
      ...SECURITY_HEADERS,
      'Content-Type': 'application/json',
      ...additionalHeaders,
    },
    jsonBody: data,
  };
}

// リクエストの基本セキュリティチェック
export function performSecurityChecks(
  request: HttpRequest,
  context: InvocationContext,
  maxRequestsPerWindow: number = 100
): void {
  // レート制限チェック
  const clientIp =
    request.headers.get('x-forwarded-for') ||
    request.headers.get('x-real-ip') ||
    'unknown';

  if (!checkRateLimit(clientIp, maxRequestsPerWindow)) {
    throw new ValidationError(
      [],
      'レート制限に達しました。しばらく待ってから再試行してください。'
    );
  }

  // User-Agentの基本チェック（自動化ツール検出）
  const userAgent = request.headers.get('user-agent');
  if (!userAgent || userAgent.length < 10) {
    context.log('疑わしいUser-Agent:', userAgent);
  }

  // Content-Lengthの妥当性チェック
  const contentLength = request.headers.get('content-length');
  if (contentLength && parseInt(contentLength) > 10 * 1024 * 1024) {
    // 10MB制限
    throw new ValidationError([], 'リクエストサイズが制限を超えています');
  }
}

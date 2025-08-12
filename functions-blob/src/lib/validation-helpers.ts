import { InvocationContext } from '@azure/functions';
import { z } from 'zod';
import { ValidationError } from '../schemas/validation';

// OWASP準拠のログサニタイズ
export function sanitizeLogData(data: unknown): string {
  if (typeof data === 'string') {
    // 機密情報のパターンを検出してマスク
    return data
      .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, 'Bearer [REDACTED]')
      .replace(/key["\s:=]+["']?[A-Za-z0-9._-]+["']?/gi, 'key=[REDACTED]')
      .replace(/password["\s:=]+["']?[^"'\s]+["']?/gi, 'password=[REDACTED]')
      .replace(/token["\s:=]+["']?[A-Za-z0-9._-]+["']?/gi, 'token=[REDACTED]');
  }
  
  if (typeof data === 'object' && data !== null) {
    return JSON.stringify(data, (key, value) => {
      // 機密情報の可能性があるキーをマスク
      if (/key|token|password|secret|credential/i.test(key)) {
        return '[REDACTED]';
      }
      return value;
    });
  }
  
  return String(data);
}

// 安全なエラーログ出力
export function logError(context: InvocationContext, message: string, error: unknown): void {
  if (error instanceof ValidationError) {
    context.error(`${message}: バリデーションエラー - ${error.toString()}`);
  } else if (error instanceof Error) {
    // エラーメッセージをサニタイズ
    const sanitizedMessage = sanitizeLogData(error.message);
    context.error(`${message}: ${error.name} - ${sanitizedMessage}`);
    
    // スタックトレースは開発環境のみ
    if (process.env.NODE_ENV !== 'production' && error.stack) {
      context.error(`Stack trace: ${sanitizeLogData(error.stack)}`);
    }
  } else {
    context.error(`${message}: ${sanitizeLogData(error)}`);
  }
}

// Blob処理のリトライ設定
export interface RetryOptions {
  maxAttempts: number;
  delayMs: number;
  backoffMultiplier: number;
}

export const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxAttempts: 3,
  delayMs: 1000,
  backoffMultiplier: 2
};

// リトライ付き処理実行
export async function executeWithRetry<T>(
  operation: () => Promise<T>,
  context: InvocationContext,
  operationName: string,
  options: RetryOptions = DEFAULT_RETRY_OPTIONS
): Promise<T> {
  let lastError: unknown;
  
  for (let attempt = 1; attempt <= options.maxAttempts; attempt++) {
    try {
      context.log(`${operationName}: 実行中 (試行 ${attempt}/${options.maxAttempts})`);
      return await operation();
    } catch (error) {
      lastError = error;
      
      if (attempt === options.maxAttempts) {
        logError(context, `${operationName}: 最大試行回数に達しました`, error);
        break;
      }
      
      const delay = options.delayMs * Math.pow(options.backoffMultiplier, attempt - 1);
      context.log(`${operationName}: ${delay}ms後にリトライします`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

// Blobデータのバリデーション
export function validateBlobData(blob: unknown): Buffer {
  if (!blob) {
    throw new ValidationError([], 'Blobデータが空です');
  }
  
  if (blob instanceof Buffer) {
    // 最大サイズチェック（10MB）
    if (blob.length > 10 * 1024 * 1024) {
      throw new ValidationError([], 'ファイルサイズが10MBを超えています');
    }
    
    // 最小サイズチェック（1KB）
    if (blob.length < 1024) {
      throw new ValidationError([], 'ファイルサイズが小さすぎます（1KB未満）');
    }
    
    return blob;
  }
  
  // Buffer以外のデータ型の場合
  if (typeof blob === 'string') {
    // Base64文字列の可能性
    try {
      const buffer = Buffer.from(blob, 'base64');
      return validateBlobData(buffer); // 再帰的にバリデーション
    } catch {
      throw new ValidationError([], 'Blobデータの形式が不正です');
    }
  }
  
  throw new ValidationError([], 'サポートされていないBlobデータ型です');
}

// MIME タイプの検証
export function validateMimeType(filename: string): string {
  const extension = filename.split('.').pop()?.toLowerCase();
  
  const mimeTypes: Record<string, string> = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'webp': 'image/webp',
    'pdf': 'application/pdf'
  };
  
  const mimeType = extension ? mimeTypes[extension] : null;
  
  if (!mimeType) {
    throw new ValidationError([], `サポートされていないファイル形式です: ${extension}`);
  }
  
  return mimeType;
}

// 処理結果の安全なフォーマット
export function formatProcessingResult(
  receiptId: string,
  status: 'completed' | 'failed',
  details?: Record<string, unknown>
): string {
  const result = {
    receiptId: sanitizeLogData(receiptId),
    status,
    timestamp: new Date().toISOString(),
    ...(details && { details: sanitizeLogData(details) })
  };
  
  return JSON.stringify(result, null, 2);
}

// メモリ使用量のモニタリング
export function logMemoryUsage(context: InvocationContext, phase: string): void {
  const usage = process.memoryUsage();
  const formatMB = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  
  context.log(`メモリ使用量 (${phase}):`);
  context.log(`  - RSS: ${formatMB(usage.rss)}`);
  context.log(`  - Heap Total: ${formatMB(usage.heapTotal)}`);
  context.log(`  - Heap Used: ${formatMB(usage.heapUsed)}`);
  context.log(`  - External: ${formatMB(usage.external)}`);
}
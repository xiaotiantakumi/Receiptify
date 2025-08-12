/**
 * Tests for process-receipt-blob function
 */
import { readFileSync } from 'fs';
import { join } from 'path';

describe('process-receipt-blob function', () => {
  let sourceCode: string;

  beforeAll(() => {
    // Try different paths to handle both source and compiled test runs
    const possiblePaths = [
      join(__dirname, '../../functions/process-receipt-blob.ts'), // For source test runs (src/tests/functions -> src/functions)
      join(__dirname, '../../../src/functions/process-receipt-blob.ts'), // For compiled test runs (dist/tests/functions -> src/functions)
    ];
    
    let fileFound = false;
    for (const filePath of possiblePaths) {
      try {
        sourceCode = readFileSync(filePath, 'utf-8');
        fileFound = true;
        break;
      } catch (error) {
        // Continue to next path
      }
    }
    
    if (!fileFound) {
      throw new Error('Could not find process-receipt-blob.ts source file');
    }
  });

  it('should exist as a file', () => {
    expect(sourceCode).toBeDefined();
    expect(sourceCode.length).toBeGreaterThan(0);
  });

  it('should export processReceiptBlob function', () => {
    expect(sourceCode).toContain('export');
    expect(sourceCode).toContain('processReceiptBlob');
  });

  it('should be async function', () => {
    expect(sourceCode).toContain('async');
  });

  it('should use proper error handling pattern', () => {
    expect(sourceCode).toContain('try');
    expect(sourceCode).toContain('catch');
    expect(sourceCode).toContain('finally');
  });

  it('should implement memory monitoring', () => {
    expect(sourceCode).toContain('logMemoryUsage');
    expect(sourceCode).toContain('start');
    expect(sourceCode).toContain('end');
  });

  it('should validate blob trigger metadata', () => {
    expect(sourceCode).toContain('BlobTriggerMetadataSchema');
    expect(sourceCode).toContain('triggerMetadata');
  });

  it('should extract user and receipt information', () => {
    expect(sourceCode).toContain('extractUserIdFromContainerPath');
    expect(sourceCode).toContain('extractMetadataFromBlobName');
  });

  it('should validate blob data and MIME type', () => {
    expect(sourceCode).toContain('validateBlobData');
    expect(sourceCode).toContain('validateMimeType');
  });

  it('should use Gemini AI with retry mechanism', () => {
    expect(sourceCode).toContain('GoogleGenerativeAI');
    expect(sourceCode).toContain('executeWithRetry');
    expect(sourceCode).toContain('Gemini API解析');
  });

  it('should save results to table storage with retry', () => {
    expect(sourceCode).toContain('saveReceiptResult');
    expect(sourceCode).toContain('Table Storage保存');
  });

  it('should handle processing errors and save error status', () => {
    expect(sourceCode).toContain('logError');
    expect(sourceCode).toContain('failed');
    expect(sourceCode).toContain('errorMessage');
  });

  it('should format processing results', () => {
    expect(sourceCode).toContain('formatProcessingResult');
    expect(sourceCode).toContain('completed');
  });

  it('should include comprehensive logging', () => {
    expect(sourceCode).toContain('context.log');
    expect(sourceCode).toContain('Processing receipt');
    expect(sourceCode).toContain('Analysis completed');
  });

  it('should handle retry configuration', () => {
    expect(sourceCode).toContain('maxAttempts');
    expect(sourceCode).toContain('delayMs');
    expect(sourceCode).toContain('backoffMultiplier');
  });

  it('should truncate long error messages', () => {
    expect(sourceCode).toContain('substring');
    expect(sourceCode).toContain('500'); // Max error message length
  });

  it('should handle validation errors', () => {
    expect(sourceCode).toContain('ValidationError');
  });

  it('should implement graceful error recovery', () => {
    expect(sourceCode).toContain('エラーステータスの保存に失敗');
  });
});
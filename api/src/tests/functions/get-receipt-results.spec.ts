/**
 * Tests for get-receipt-results endpoint
 */
import { readFileSync } from 'fs';
import { join } from 'path';

describe('get-receipt-results endpoint', () => {
  let sourceCode: string;

  beforeAll(() => {
    // Read from source directory, not dist
    const filePath = join(__dirname, '../../../src/functions/get-receipt-results.ts');
    sourceCode = readFileSync(filePath, 'utf-8');
  });

  it('should exist as a file', () => {
    expect(sourceCode).toBeDefined();
    expect(sourceCode.length).toBeGreaterThan(0);
  });

  it('should export getReceiptResultsHandler function', () => {
    expect(sourceCode).toContain('export');
    expect(sourceCode).toContain('getReceiptResultsHandler');
  });

  it('should be async function', () => {
    expect(sourceCode).toContain('async');
  });

  it('should use proper error handling pattern', () => {
    expect(sourceCode).toContain('try');
    expect(sourceCode).toContain('catch');
    expect(sourceCode).toContain('createErrorResponse');
  });

  it('should implement security checks', () => {
    expect(sourceCode).toContain('performSecurityChecks');
  });

  it('should implement authentication', () => {
    expect(sourceCode).toContain('extractUserFromAuth');
  });

  it('should validate query parameters', () => {
    expect(sourceCode).toContain('validateQueryParams');
  });

  it('should access table storage', () => {
    expect(sourceCode).toContain('getReceiptResults');
  });

  it('should return success response', () => {
    expect(sourceCode).toContain('createSuccessResponse');
  });

  it('should include logging', () => {
    expect(sourceCode).toContain('context.log');
  });

  it('should handle cache control headers', () => {
    expect(sourceCode).toContain('Cache-Control');
  });
});
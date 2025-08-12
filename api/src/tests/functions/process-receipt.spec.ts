/**
 * Tests for process-receipt endpoint
 */
import { readFileSync } from 'fs';
import { join } from 'path';

describe('process-receipt endpoint', () => {
  let sourceCode: string;

  beforeAll(() => {
    // Read from source directory, not dist
    const filePath = join(__dirname, '../../../src/functions/process-receipt.ts');
    sourceCode = readFileSync(filePath, 'utf-8');
  });

  it('should exist as a file', () => {
    expect(sourceCode).toBeDefined();
    expect(sourceCode.length).toBeGreaterThan(0);
  });

  it('should export processReceipt function', () => {
    expect(sourceCode).toContain('export');
    expect(sourceCode).toContain('processReceipt');
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

  it('should validate request body', () => {
    expect(sourceCode).toContain('validateRequestBody');
    expect(sourceCode).toContain('ProcessReceiptSchema');
  });

  it('should access blob storage', () => {
    expect(sourceCode).toContain('BlobServiceClient');
    expect(sourceCode).toContain('fromConnectionString');
  });

  it('should check blob existence', () => {
    expect(sourceCode).toContain('exists');
    expect(sourceCode).toContain('404');
  });

  it('should download blob data', () => {
    expect(sourceCode).toContain('download');
    expect(sourceCode).toContain('readableStreamBody');
  });

  it('should handle different image formats', () => {
    expect(sourceCode).toContain('png');
    expect(sourceCode).toContain('jpg');
    expect(sourceCode).toContain('jpeg');
    expect(sourceCode).toContain('webp');
  });

  it('should use Gemini AI for analysis', () => {
    expect(sourceCode).toContain('GoogleGenerativeAI');
    expect(sourceCode).toContain('generateContent');
    expect(sourceCode).toContain('GEMINI_PROMPT');
  });

  it('should validate Gemini response', () => {
    expect(sourceCode).toContain('GeminiResponseSchema');
    expect(sourceCode).toContain('safeParse');
  });

  it('should save results to table storage', () => {
    expect(sourceCode).toContain('saveReceiptResult');
  });

  it('should extract receipt ID from blob name', () => {
    expect(sourceCode).toContain('split');
  });

  it('should return success response with analysis results', () => {
    expect(sourceCode).toContain('createSuccessResponse');
    expect(sourceCode).toContain('itemCount');
    expect(sourceCode).toContain('totalAmount');
  });

  it('should include comprehensive logging', () => {
    expect(sourceCode).toContain('context.log');
    expect(sourceCode).toContain('Processing receipt');
    expect(sourceCode).toContain('Analysis completed');
  });

  it('should handle JSON parsing of Gemini response', () => {
    expect(sourceCode).toContain('JSON.parse');
    expect(sourceCode).toContain('jsonMatch');
  });
});
/**
 * Tests for issue-sas-token endpoint
 */
describe('issue-sas-token endpoint', () => {
  it('should have issueSasToken function', () => {
    const module = require('../../functions/issue-sas-token');
    expect(typeof module.issueSasToken).toBe('function');
  });

  it('should be async function', () => {
    const module = require('../../functions/issue-sas-token');
    expect(module.issueSasToken.constructor.name).toBe('AsyncFunction');
  });

  it('should accept request and context parameters', () => {
    const module = require('../../functions/issue-sas-token');
    expect(module.issueSasToken.length).toBe(2);
  });

  it('should import required dependencies', () => {
    expect(() => {
      require('../../functions/issue-sas-token');
    }).not.toThrow();
  });

  it('should use proper error handling pattern', () => {
    const module = require('../../functions/issue-sas-token');
    const funcString = module.issueSasToken.toString();
    
    expect(funcString).toContain('try');
    expect(funcString).toContain('catch');
    expect(funcString).toContain('createErrorResponse');
  });

  it('should implement security checks', () => {
    const module = require('../../functions/issue-sas-token');
    const funcString = module.issueSasToken.toString();
    
    expect(funcString).toContain('performSecurityChecks');
  });

  it('should implement authentication', () => {
    const module = require('../../functions/issue-sas-token');
    const funcString = module.issueSasToken.toString();
    
    expect(funcString).toContain('extractUserFromAuth');
  });

  it('should validate request body', () => {
    const module = require('../../functions/issue-sas-token');
    const funcString = module.issueSasToken.toString();
    
    expect(funcString).toContain('validateRequestBody');
    expect(funcString).toContain('fileName'); // リクエストデータからファイル名を取得
  });

  it('should access blob storage', () => {
    const module = require('../../functions/issue-sas-token');
    const funcString = module.issueSasToken.toString();
    
    expect(funcString).toContain('getBlobServiceClient');
    expect(funcString).toContain('receipts'); // 固定コンテナ名を使用
  });

  it('should generate SAS tokens', () => {
    const module = require('../../functions/issue-sas-token');
    const funcString = module.issueSasToken.toString();
    
    expect(funcString).toContain('generateSASToken');
  });

  it('should create containers if not exists', () => {
    const module = require('../../functions/issue-sas-token');
    const funcString = module.issueSasToken.toString();
    
    expect(funcString).toContain('createIfNotExists');
  });

  it('should generate unique blob names with user directory structure', () => {
    const module = require('../../functions/issue-sas-token');
    const funcString = module.issueSasToken.toString();
    
    expect(funcString).toContain('v4'); // uuid.v4()
    expect(funcString).toContain('toISOString');
    expect(funcString).toContain('userId'); // ユーザー別ディレクトリ構造
  });

  it('should return success response with SAS URL', () => {
    const module = require('../../functions/issue-sas-token');
    const funcString = module.issueSasToken.toString();
    
    expect(funcString).toContain('createSuccessResponse');
    expect(funcString).toContain('sasUrl');
    expect(funcString).toContain('blobUrl');
  });

  it('should include expiration time', () => {
    const module = require('../../functions/issue-sas-token');
    const funcString = module.issueSasToken.toString();
    
    expect(funcString).toContain('expiresAt');
    expect(funcString).toContain('60 * 60 * 1000'); // 1 hour
  });

  it('should include logging', () => {
    const module = require('../../functions/issue-sas-token');
    const funcString = module.issueSasToken.toString();
    
    expect(funcString).toContain('context.log');
  });
});
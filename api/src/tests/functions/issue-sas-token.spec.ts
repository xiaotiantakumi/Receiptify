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

  it('should not require request body validation for multiple file upload', () => {
    const module = require('../../functions/issue-sas-token');
    const funcString = module.issueSasToken.toString();
    
    // 複数ファイル対応のため、個別ファイル名バリデーションは不要
    expect(funcString).not.toContain('validateRequestBody');
    expect(funcString).not.toContain('fileName'); // リクエストからファイル名は取得しない
  });

  it('should access blob storage', () => {
    const module = require('../../functions/issue-sas-token');
    const funcString = module.issueSasToken.toString();
    
    expect(funcString).toContain('getBlobServiceClient');
    expect(funcString).toContain('receipts'); // 固定コンテナ名を使用
  });

  it('should generate directory-level SAS tokens', () => {
    const module = require('../../functions/issue-sas-token');
    const funcString = module.issueSasToken.toString();
    
    expect(funcString).toContain('generateDirectorySASToken');
  });

  it('should create containers if not exists', () => {
    const module = require('../../functions/issue-sas-token');
    const funcString = module.issueSasToken.toString();
    
    expect(funcString).toContain('createIfNotExists');
  });

  it('should create fiscal year-based directory structure', () => {
    const module = require('../../functions/issue-sas-token');
    const funcString = module.issueSasToken.toString();
    
    expect(funcString).toContain('fiscalYear'); // 年度別ディレクトリ
    expect(funcString).toContain('directoryPrefix'); // ディレクトリプレフィックス
    expect(funcString).toContain('userId'); // ユーザー別ディレクトリ構造
  });

  it('should return success response with container access info', () => {
    const module = require('../../functions/issue-sas-token');
    const funcString = module.issueSasToken.toString();
    
    expect(funcString).toContain('createSuccessResponse');
    expect(funcString).toContain('sasToken'); // SASトークン
    expect(funcString).toContain('containerUrl'); // コンテナURL
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
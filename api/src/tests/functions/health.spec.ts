import { mock } from 'jest-mock-extended';
import { HttpRequest, InvocationContext } from '@azure/functions';

// Simple test to verify Jest setup
describe('health function', () => {
  let httpRequestMock: HttpRequest;
  let invocationContextMock: InvocationContext;

  beforeEach(() => {
    httpRequestMock = mock<HttpRequest>();
    invocationContextMock = mock<InvocationContext>();
  });

  it('should create mock objects successfully', () => {
    expect(httpRequestMock).toBeDefined();
    expect(invocationContextMock).toBeDefined();
    expect(invocationContextMock.log).toBeDefined();
  });

  it('should test basic functionality', () => {
    const testData = {
      message: 'Health check passed',
      timestamp: new Date().toISOString()
    };

    expect(testData.message).toBe('Health check passed');
    expect(testData.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });
});
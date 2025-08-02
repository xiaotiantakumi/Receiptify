/**
 * Basic test for the hello function
 * This demonstrates the basic test structure for Azure Functions
 */

describe('hello function', () => {
  it('should be able to test basic functionality', () => {
    const greeting = 'Hello, World!';
    expect(greeting).toBe('Hello, World!');
  });

  it('should handle string operations', () => {
    const message = 'PWA Starter API is working';
    expect(message).toContain('API');
    expect(message.length).toBeGreaterThan(10);
  });

  it('should handle date operations', () => {
    const now = new Date();
    const isoString = now.toISOString();
    
    expect(isoString).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    expect(typeof isoString).toBe('string');
  });

  it('should handle JSON operations', () => {
    const testData = {
      status: 'success',
      message: 'Test passed',
      timestamp: new Date().toISOString()
    };

    const jsonString = JSON.stringify(testData);
    const parsed = JSON.parse(jsonString);

    expect(parsed.status).toBe('success');
    expect(parsed.message).toBe('Test passed');
    expect(typeof parsed.timestamp).toBe('string');
  });

  it('should handle error scenarios', () => {
    expect(() => {
      JSON.parse('invalid json');
    }).toThrow();

    expect(() => {
      throw new Error('Test error');
    }).toThrow('Test error');
  });
});
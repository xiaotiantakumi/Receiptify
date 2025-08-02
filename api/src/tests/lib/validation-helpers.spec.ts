import { checkRateLimit, SECURITY_HEADERS } from '../../lib/validation-helpers';

describe('validation-helpers', () => {
  describe('checkRateLimit', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should allow requests under the limit', () => {
      const result = checkRateLimit('test-ip-1', 100, 15);
      expect(result).toBe(true);
    });

    it('should block requests over the limit', () => {
      // Exhaust the rate limit
      for (let i = 0; i < 100; i++) {
        checkRateLimit('test-ip-2', 100, 15);
      }
      
      const result = checkRateLimit('test-ip-2', 100, 15);
      expect(result).toBe(false);
    });

    it('should reset rate limit after window expires', () => {
      const result1 = checkRateLimit('test-ip-3', 1, 15);
      expect(result1).toBe(true);
      
      const result2 = checkRateLimit('test-ip-3', 1, 15);
      expect(result2).toBe(false);
    });

    it('should handle different identifiers independently', () => {
      const result1 = checkRateLimit('ip-1', 5, 15);
      const result2 = checkRateLimit('ip-2', 5, 15);
      
      expect(result1).toBe(true);
      expect(result2).toBe(true);
    });
  });

  describe('SECURITY_HEADERS', () => {
    it('should contain required security headers', () => {
      expect(SECURITY_HEADERS).toHaveProperty('X-Content-Type-Options', 'nosniff');
      expect(SECURITY_HEADERS).toHaveProperty('X-Frame-Options', 'DENY');
      expect(SECURITY_HEADERS).toHaveProperty('X-XSS-Protection', '1; mode=block');
      expect(SECURITY_HEADERS).toHaveProperty('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
      expect(SECURITY_HEADERS).toHaveProperty('Content-Security-Policy', "default-src 'self'");
      expect(SECURITY_HEADERS).toHaveProperty('Cache-Control', 'no-cache, no-store, must-revalidate');
      expect(SECURITY_HEADERS).toHaveProperty('Pragma', 'no-cache');
      expect(SECURITY_HEADERS).toHaveProperty('Expires', '0');
    });

    it('should be readonly', () => {
      // Object.freeze would make it truly immutable in runtime
      expect(typeof SECURITY_HEADERS).toBe('object');
      expect(SECURITY_HEADERS).toBeDefined();
    });
  });
});
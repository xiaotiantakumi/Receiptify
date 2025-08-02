/**
 * Utility function tests
 * These test common utility patterns used throughout the application
 */

describe('utility functions', () => {
  describe('string utilities', () => {
    it('should handle string sanitization', () => {
      const input = '  Hello World  ';
      const sanitized = input.trim();
      
      expect(sanitized).toBe('Hello World');
      expect(sanitized.length).toBe(11);
    });

    it('should validate email-like patterns', () => {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      
      expect(emailPattern.test('user@example.com')).toBe(true);
      expect(emailPattern.test('invalid-email')).toBe(false);
      expect(emailPattern.test('@invalid.com')).toBe(false);
    });

    it('should handle base64 encoding/decoding', () => {
      const original = 'Hello, World!';
      const encoded = Buffer.from(original, 'utf-8').toString('base64');
      const decoded = Buffer.from(encoded, 'base64').toString('utf-8');
      
      expect(decoded).toBe(original);
      expect(encoded).not.toBe(original);
    });
  });

  describe('date utilities', () => {
    it('should format dates consistently', () => {
      const date = new Date('2023-01-15T10:30:00Z');
      const isoString = date.toISOString();
      
      expect(isoString).toBe('2023-01-15T10:30:00.000Z');
      expect(date.getFullYear()).toBe(2023);
      expect(date.getMonth()).toBe(0); // January is 0
    });

    it('should calculate time differences', () => {
      const date1 = new Date('2023-01-15T10:00:00Z');
      const date2 = new Date('2023-01-15T11:00:00Z');
      const diffMs = date2.getTime() - date1.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);
      
      expect(diffHours).toBe(1);
      expect(diffMs).toBe(3600000); // 1 hour in milliseconds
    });
  });

  describe('object utilities', () => {
    it('should merge objects correctly', () => {
      const obj1 = { a: 1, b: 2 };
      const obj2 = { b: 3, c: 4 };
      const merged = { ...obj1, ...obj2 };
      
      expect(merged).toEqual({ a: 1, b: 3, c: 4 });
      expect(merged.b).toBe(3); // obj2 should override obj1
    });

    it('should deep clone objects', () => {
      const original = { 
        name: 'test', 
        nested: { value: 42 },
        array: [1, 2, 3]
      };
      const cloned = JSON.parse(JSON.stringify(original));
      
      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
      expect(cloned.nested).not.toBe(original.nested);
    });

    it('should extract object keys and values', () => {
      const obj = { name: 'John', age: 30, city: 'Tokyo' };
      const keys = Object.keys(obj);
      const values = Object.values(obj);
      
      expect(keys).toEqual(['name', 'age', 'city']);
      expect(values).toEqual(['John', 30, 'Tokyo']);
      expect(keys.length).toBe(3);
    });
  });

  describe('array utilities', () => {
    it('should filter and map arrays', () => {
      const numbers = [1, 2, 3, 4, 5];
      const evenDoubled = numbers
        .filter(n => n % 2 === 0)
        .map(n => n * 2);
      
      expect(evenDoubled).toEqual([4, 8]);
      expect(evenDoubled.length).toBe(2);
    });

    it('should sort arrays', () => {
      const names = ['Charlie', 'Alice', 'Bob'];
      const sorted = [...names].sort();
      
      expect(sorted).toEqual(['Alice', 'Bob', 'Charlie']);
      expect(names).toEqual(['Charlie', 'Alice', 'Bob']); // Original unchanged
    });

    it('should reduce arrays', () => {
      const numbers = [1, 2, 3, 4, 5];
      const sum = numbers.reduce((acc, curr) => acc + curr, 0);
      const product = numbers.reduce((acc, curr) => acc * curr, 1);
      
      expect(sum).toBe(15);
      expect(product).toBe(120);
    });
  });

  describe('error handling', () => {
    it('should create custom errors', () => {
      class CustomError extends Error {
        constructor(message: string, public code: string) {
          super(message);
          this.name = 'CustomError';
        }
      }

      const error = new CustomError('Something went wrong', 'ERR_001');
      
      expect(error.message).toBe('Something went wrong');
      expect(error.code).toBe('ERR_001');
      expect(error.name).toBe('CustomError');
      expect(error instanceof Error).toBe(true);
    });

    it('should handle try-catch blocks', () => {
      const riskyOperation = (shouldThrow: boolean) => {
        if (shouldThrow) {
          throw new Error('Operation failed');
        }
        return 'Success';
      };

      expect(riskyOperation(false)).toBe('Success');
      expect(() => riskyOperation(true)).toThrow('Operation failed');
    });
  });
});
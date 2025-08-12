import { Money } from '../Money';

describe('Money Value Object', () => {
  describe('fromYen', () => {
    it('should create Money object with valid integer amount', () => {
      const money = Money.fromYen(1000);
      expect(money.amount).toBe(100000); // 1000円 = 100000銭
      expect(money.yenAmount).toBe(1000);
      expect(money.currency).toBe('JPY');
    });

    it('should create Money object with decimal amount', () => {
      const money = Money.fromYen(100.5);
      expect(money.amount).toBe(10050); // 100.5円 = 10050銭
      expect(money.yenAmount).toBe(100.5);
      expect(money.currency).toBe('JPY');
    });

    it('should handle two decimal places correctly', () => {
      const money = Money.fromYen(123.45);
      expect(money.amount).toBe(12345); // 123.45円 = 12345銭
      expect(money.yenAmount).toBe(123.45);
    });

    it('should truncate (floor) to nearest sen for more than 2 decimal places', () => {
      const money = Money.fromYen(100.456);
      expect(money.amount).toBe(10045); // 100.456円 → 100.45円 = 10045銭（切り捨て）
      expect(money.yenAmount).toBe(100.45);
    });

    it('should truncate correctly for edge cases', () => {
      const money1 = Money.fromYen(100.999);
      expect(money1.yenAmount).toBe(100.99); // 切り捨て

      const money2 = Money.fromYen(100.001);
      expect(money2.yenAmount).toBe(100.00); // 切り捨て
    });

    it('should create Money object with zero amount', () => {
      const money = Money.fromYen(0);
      expect(money.amount).toBe(0);
      expect(money.yenAmount).toBe(0);
      expect(money.currency).toBe('JPY');
    });

    it('should handle large amounts', () => {
      const money = Money.fromYen(999999999);
      expect(money.amount).toBe(99999999900); // 999999999円 = 99999999900銭
      expect(money.yenAmount).toBe(999999999);
      expect(money.currency).toBe('JPY');
    });

    it('should throw error for negative amount', () => {
      expect(() => Money.fromYen(-100)).toThrow('Amount cannot be negative.');
    });

    it('should throw error for infinite amount', () => {
      expect(() => Money.fromYen(Infinity)).toThrow('Amount must be a finite number.');
      expect(() => Money.fromYen(-Infinity)).toThrow('Amount must be a finite number.');
    });

    it('should throw error for NaN amount', () => {
      expect(() => Money.fromYen(NaN)).toThrow('Amount must be a finite number.');
    });
  });

  describe('equals', () => {
    it('should return true for same integer amounts', () => {
      const money1 = Money.fromYen(1000);
      const money2 = Money.fromYen(1000);
      expect(money1.equals(money2)).toBe(true);
    });

    it('should return true for same decimal amounts', () => {
      const money1 = Money.fromYen(100.5);
      const money2 = Money.fromYen(100.50);
      expect(money1.equals(money2)).toBe(true);
    });

    it('should return false for different amounts', () => {
      const money1 = Money.fromYen(1000);
      const money2 = Money.fromYen(500);
      expect(money1.equals(money2)).toBe(false);
    });

    it('should return false for different decimal amounts', () => {
      const money1 = Money.fromYen(100.5);
      const money2 = Money.fromYen(100.51);
      expect(money1.equals(money2)).toBe(false);
    });

    it('should return false for null/undefined', () => {
      const money = Money.fromYen(1000);
      expect(money.equals(null as any)).toBe(false);
      expect(money.equals(undefined as any)).toBe(false);
    });

    it('should return true for zero amounts', () => {
      const money1 = Money.fromYen(0);
      const money2 = Money.fromYen(0);
      expect(money1.equals(money2)).toBe(true);
    });
  });

  describe('add', () => {
    it('should add same currency integer amounts correctly', () => {
      const money1 = Money.fromYen(1000);
      const money2 = Money.fromYen(500);
      const result = money1.add(money2);
      expect(result.yenAmount).toBe(1500);
      expect(result.currency).toBe('JPY');
    });

    it('should add decimal amounts correctly', () => {
      const money1 = Money.fromYen(100.25);
      const money2 = Money.fromYen(50.75);
      const result = money1.add(money2);
      expect(result.yenAmount).toBe(151);
      expect(result.currency).toBe('JPY');
    });

    it('should add zero amounts correctly', () => {
      const money1 = Money.fromYen(1000.50);
      const money2 = Money.fromYen(0);
      const result = money1.add(money2);
      expect(result.yenAmount).toBe(1000.50);
    });

    it('should return new Money instance', () => {
      const money1 = Money.fromYen(1000);
      const money2 = Money.fromYen(500);
      const result = money1.add(money2);
      expect(result).not.toBe(money1);
      expect(result).not.toBe(money2);
    });

    it('should not mutate original Money objects', () => {
      const money1 = Money.fromYen(1000.50);
      const money2 = Money.fromYen(500.25);
      const originalYen1 = money1.yenAmount;
      const originalYen2 = money2.yenAmount;
      money1.add(money2);
      expect(money1.yenAmount).toBe(originalYen1);
      expect(money2.yenAmount).toBe(originalYen2);
    });
  });

  describe('subtract', () => {
    it('should subtract same currency amounts correctly', () => {
      const money1 = Money.fromYen(1000);
      const money2 = Money.fromYen(300);
      const result = money1.subtract(money2);
      expect(result.yenAmount).toBe(700);
      expect(result.currency).toBe('JPY');
    });

    it('should handle subtraction resulting in zero', () => {
      const money1 = Money.fromYen(1000);
      const money2 = Money.fromYen(1000);
      const result = money1.subtract(money2);
      expect(result.yenAmount).toBe(0);
    });

    it('should throw error when result is negative', () => {
      const money1 = Money.fromYen(100);
      const money2 = Money.fromYen(200);
      expect(() => money1.subtract(money2)).toThrow('Subtraction resulted in a negative amount.');
    });

    it('should return new Money instance', () => {
      const money1 = Money.fromYen(1000);
      const money2 = Money.fromYen(300);
      const result = money1.subtract(money2);
      expect(result).not.toBe(money1);
      expect(result).not.toBe(money2);
    });

    it('should not mutate original Money objects', () => {
      const money1 = Money.fromYen(1000);
      const money2 = Money.fromYen(300);
      const originalYen1 = money1.yenAmount;
      const originalYen2 = money2.yenAmount;
      money1.subtract(money2);
      expect(money1.yenAmount).toBe(originalYen1);
      expect(money2.yenAmount).toBe(originalYen2);
    });
  });

  describe('multiply', () => {
    it('should multiply amount correctly', () => {
      const money = Money.fromYen(100);
      const result = money.multiply(3);
      expect(result.yenAmount).toBe(300);
      expect(result.currency).toBe('JPY');
    });

    it('should handle multiplication with decimal factor using rounding', () => {
      const money = Money.fromYen(101);
      const result = money.multiply(1.5);
      expect(result.yenAmount).toBe(151.5); // 101 * 1.5 = 151.5円
    });

    it('should handle multiplication by zero', () => {
      const money = Money.fromYen(100);
      const result = money.multiply(0);
      expect(result.yenAmount).toBe(0);
    });

    it('should handle multiplication by one', () => {
      const money = Money.fromYen(100.50);
      const result = money.multiply(1);
      expect(result.yenAmount).toBe(100.50);
    });

    it('should throw error when factor is infinite', () => {
      const money = Money.fromYen(100);
      expect(() => money.multiply(Infinity)).toThrow('Multiplication factor must be a finite number.');
      expect(() => money.multiply(-Infinity)).toThrow('Multiplication factor must be a finite number.');
    });

    it('should throw error when factor is NaN', () => {
      const money = Money.fromYen(100);
      expect(() => money.multiply(NaN)).toThrow('Multiplication factor must be a finite number.');
    });

    it('should throw error when result is negative', () => {
      const money = Money.fromYen(100);
      expect(() => money.multiply(-2)).toThrow('Multiplication resulted in a negative amount.');
    });

    it('should return new Money instance', () => {
      const money = Money.fromYen(100);
      const result = money.multiply(2);
      expect(result).not.toBe(money);
    });

    it('should not mutate original Money object', () => {
      const money = Money.fromYen(100);
      const originalYen = money.yenAmount;
      money.multiply(2);
      expect(money.yenAmount).toBe(originalYen);
    });

    it('should round correctly for various decimal cases', () => {
      expect(Money.fromYen(100).multiply(1.4).yenAmount).toBe(140); // 140.0
      expect(Money.fromYen(100).multiply(1.45).yenAmount).toBe(145); // 145.0
      expect(Money.fromYen(100).multiply(1.46).yenAmount).toBe(146); // 146.0
      expect(Money.fromYen(100).multiply(1.44).yenAmount).toBe(144); // 144.0
    });
  });

  describe('format', () => {
    it('should format integer amount with currency', () => {
      const money = Money.fromYen(1000);
      expect(money.format()).toBe('1,000 JPY');
    });

    it('should format decimal amount with currency', () => {
      const money = Money.fromYen(1000.50);
      expect(money.format()).toBe('1,000.5 JPY');
    });

    it('should format zero amount', () => {
      const money = Money.fromYen(0);
      expect(money.format()).toBe('0 JPY');
    });

    it('should format large amounts with commas', () => {
      const money = Money.fromYen(1234567.89);
      expect(money.format()).toBe('1,234,567.88 JPY'); // 切り捨てで.89 → .88
    });
  });

  describe('Currency Operations - Error Cases', () => {
    it('should throw error when adding different currencies', () => {
      const yenMoney = Money.fromYen(1000);
      // Create a mock USD money for testing currency mismatch
      const usdMoney = { amount: 100, currency: 'USD' } as unknown as Money;
      expect(() => yenMoney.add(usdMoney)).toThrow('Cannot operate on Money of different currencies.');
    });

    it('should throw error when subtracting different currencies', () => {
      const yenMoney = Money.fromYen(1000);
      // Create a mock USD money for testing currency mismatch
      const usdMoney = { amount: 100, currency: 'USD' } as unknown as Money;
      expect(() => yenMoney.subtract(usdMoney)).toThrow('Cannot operate on Money of different currencies.');
    });
  });

  describe('Immutability', () => {
    it('should preserve amount property value (readonly enforced at compile time)', () => {
      const money = Money.fromYen(1000.50);
      const originalAmount = money.amount;
      
      // Operations should return new instances, not modify original
      const doubled = money.multiply(2);
      expect(money.amount).toBe(originalAmount); // Original unchanged
      expect(doubled.yenAmount).toBe(2001); // New instance: 1000.50 * 2 = 2001円
    });

    it('should preserve currency property value (readonly enforced at compile time)', () => {
      const money = Money.fromYen(1000.25);
      expect(money.currency).toBe('JPY');
      
      // Operations should return new instances with same currency
      const added = money.add(Money.fromYen(500.75));
      expect(money.currency).toBe('JPY'); // Original unchanged
      expect(added.currency).toBe('JPY'); // New instance has same currency
    });
  });
});
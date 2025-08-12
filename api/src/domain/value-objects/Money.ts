export class Money {
  public readonly amount: number; // 銭単位で保存（1円=100銭）
  public readonly currency: 'JPY';

  private constructor(amountInSen: number) {
    this.validateAmount(amountInSen);
    this.amount = amountInSen;
    this.currency = 'JPY';
  }

  public static fromYen(amount: number): Money {
    // 円を銭に変換（小数点以下は切り捨て - 日本の消費税計算に準拠）
    const amountInSen = Math.floor(amount * 100);
    return new Money(amountInSen);
  }

  private validateAmount(amountInSen: number): void {
    if (!Number.isFinite(amountInSen)) {
      throw new Error('Amount must be a finite number.');
    }
    if (!Number.isInteger(amountInSen)) {
      throw new Error('Amount in Sen must be an integer.');
    }
    if (amountInSen < 0) {
      throw new Error('Amount cannot be negative.');
    }
  }

  // 円単位での金額を取得
  public get yenAmount(): number {
    return this.amount / 100;
  }

  private ensureSameCurrency(other: Money): void {
    if (this.currency !== other.currency) {
      throw new Error('Cannot operate on Money of different currencies.');
    }
  }

  public equals(other: Money): boolean {
    if (other === null || other === undefined) {
      return false;
    }
    return this.currency === other.currency && this.amount === other.amount;
  }

  public add(other: Money): Money {
    this.ensureSameCurrency(other);
    return new Money(this.amount + other.amount);
  }

  public subtract(other: Money): Money {
    this.ensureSameCurrency(other);
    const newAmount = this.amount - other.amount;
    if (newAmount < 0) {
      throw new Error('Subtraction resulted in a negative amount.');
    }
    return new Money(newAmount);
  }

  public multiply(factor: number): Money {
    if (!Number.isFinite(factor)) {
      throw new Error('Multiplication factor must be a finite number.');
    }
    const newAmount = Math.round(this.amount * factor);
    if (newAmount < 0) {
      throw new Error('Multiplication resulted in a negative amount.');
    }
    return new Money(newAmount);
  }

  public format(): string {
    const yenAmount = this.yenAmount;
    return `${yenAmount.toLocaleString()} ${this.currency}`;
  }
}
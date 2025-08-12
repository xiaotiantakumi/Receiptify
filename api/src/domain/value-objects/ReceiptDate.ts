// api/src/domain/value-objects/ReceiptDate.ts
import { dayjs } from '../../lib/dayjs-config';

// 日本の税法では会計記録（領収書含む）は7年間保存が義務
// 企業によっては会社法の10年要件もあるため、設定可能にする
const DEFAULT_MAX_RECEIPT_AGE_YEARS = 7;
const DATE_FORMAT = 'YYYY-MM-DD';

export class ReceiptDate {
  // YYYY-MM-DD形式の文字列で保存（タイムゾーンの曖昧性を排除）
  public readonly value: string;

  private constructor(value: string) {
    this.value = value;
    Object.freeze(this);
  }

  /**
   * ReceiptDateを作成する
   * @param input YYYY-MM-DD 形式の文字列またはDateオブジェクト
   * @returns ReceiptDate インスタンス
   */
  public static create(input: string | Date): ReceiptDate {
    // 1. 入力を正規化してYYYY-MM-DD形式の文字列に変換
    const normalizedDateString = this.normalizeInput(input);
    
    // 2. 日付の妥当性検証（Day.jsの厳密パースを使用）
    this.validateDate(normalizedDateString);
    
    // 3. ビジネスルール検証
    this.validateBusinessRules(normalizedDateString);
    
    return new ReceiptDate(normalizedDateString);
  }

  private static normalizeInput(input: string | Date): string {
    if (typeof input === 'string') {
      // ISO形式の場合は日付部分のみを抽出
      const dateOnly = input.split('T')[0];
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOnly)) {
        throw new Error('Date string must be in YYYY-MM-DD format.');
      }
      return dateOnly;
    }
    
    if (input instanceof Date) {
      if (!dayjs(input).isValid()) {
        throw new Error('Invalid Date object provided.');
      }
      // Day.jsでUTCとして処理してYYYY-MM-DD形式で取得
      return dayjs(input).utc().format(DATE_FORMAT);
    }
    
    throw new Error('Input must be a Date object or YYYY-MM-DD string.');
  }

  private static validateDate(dateString: string): void {
    // Day.jsで厳密パース（第3引数true）
    const parsed = dayjs(dateString, DATE_FORMAT, true);
    
    if (!parsed.isValid()) {
      throw new Error('Invalid date provided.');
    }
    
    // パース後の値が元の文字列と一致することを確認
    // （例: 2023-02-30のような無効日付を検出）
    if (parsed.format(DATE_FORMAT) !== dateString) {
      throw new Error('Invalid date components (e.g., month or day out of range).');
    }
  }

  private static validateBusinessRules(dateString: string): void {
    const receiptDate = dayjs(dateString, DATE_FORMAT, true);
    
    // 日本における「今日」を取得（UTC+9時間、時差は固定）
    const todayInJapan = dayjs.utc().add(9, 'hours').format(DATE_FORMAT);
    
    // ビジネスルール1: 未来の日付は許可しない
    if (dateString > todayInJapan) {
      throw new Error('Receipt date cannot be in the future.');
    }

    // ビジネスルール2: 保存期間を超えた古い日付は許可しない
    const oldestAllowedDate = dayjs.utc().add(9, 'hours').subtract(DEFAULT_MAX_RECEIPT_AGE_YEARS, 'year').format(DATE_FORMAT);
    
    if (dateString < oldestAllowedDate) {
      throw new Error(
        `Receipt date cannot be older than ${DEFAULT_MAX_RECEIPT_AGE_YEARS} years.`
      );
    }
  }

  /**
   * 他のReceiptDateとの等価比較
   */
  public equals(other?: ReceiptDate): boolean {
    if (!other || !(other instanceof ReceiptDate)) {
      return false;
    }
    return this.value === other.value;
  }

  /**
   * 他の日付より前かどうか
   */
  public isBefore(other: ReceiptDate): boolean {
    const thisDate = dayjs(this.value, DATE_FORMAT, true);
    const otherDate = dayjs(other.value, DATE_FORMAT, true);
    return thisDate.isBefore(otherDate, 'day');
  }

  /**
   * 他の日付より後かどうか
   */
  public isAfter(other: ReceiptDate): boolean {
    const thisDate = dayjs(this.value, DATE_FORMAT, true);
    const otherDate = dayjs(other.value, DATE_FORMAT, true);
    return thisDate.isAfter(otherDate, 'day');
  }

  /**
   * Azure Table Storage用のISO形式文字列を返す
   * @returns YYYY-MM-DDTHH:mm:ss.sssZ 形式の文字列
   */
  public toISOStringForPersistence(): string {
    return `${this.value}T00:00:00.000Z`;
  }

  /**
   * 日本のユーザー向け表示フォーマット
   * @returns YYYY年M月D日 形式の文字列（ゼロ埋めなし）
   */
  public formatForDisplay(): string {
    return dayjs(this.value, DATE_FORMAT, true).format('YYYY年M月D日');
  }

  /**
   * カスタム形式での表示
   * @param format Day.jsフォーマット文字列
   * @returns フォーマット済み文字列
   */
  public format(format: string): string {
    return dayjs(this.value, DATE_FORMAT, true).format(format);
  }

  /**
   * ネイティブDateオブジェクトとして取得（必要時のみ）
   * @returns Date オブジェクト（UTC真夜中）
   */
  public asNativeDate(): Date {
    return new Date(`${this.value}T00:00:00.000Z`);
  }
}
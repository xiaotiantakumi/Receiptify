// api/src/domain/entities/Receipt.ts
import { UserId } from '../value-objects/UserId';
import { ReceiptDate } from '../value-objects/ReceiptDate';
import { Money } from '../value-objects/Money';

export interface ReceiptItem {
  name: string;
  price: Money;
  category?: string;
  accountSuggestion?: string;
  taxNote?: string;
}

export type ReceiptStatus = 'processing' | 'completed' | 'failed';

export interface ReceiptProps {
  id: string;
  userId: UserId;
  receiptImageUrl: string;
  status: ReceiptStatus;
  receiptDate?: ReceiptDate;
  items?: ReceiptItem[];
  totalAmount?: Money;
  accountSuggestions?: string[];
  taxNotes?: string[];
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Receiptアグリゲートルート
 * レシートに関連する全ての操作を管理し、ビジネスルールを強制する
 */
export class Receipt {
  private readonly _id: string;
  private readonly _userId: UserId;
  private _receiptImageUrl: string;
  private _status: ReceiptStatus;
  private _receiptDate?: ReceiptDate;
  private _items: ReceiptItem[];
  private _totalAmount?: Money;
  private _accountSuggestions: string[];
  private _taxNotes: string[];
  private _errorMessage?: string;
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  private constructor(props: ReceiptProps) {
    this._id = props.id;
    this._userId = props.userId;
    this._receiptImageUrl = props.receiptImageUrl;
    this._status = props.status;
    this._receiptDate = props.receiptDate;
    this._items = props.items || [];
    this._totalAmount = props.totalAmount;
    this._accountSuggestions = props.accountSuggestions || [];
    this._taxNotes = props.taxNotes || [];
    this._errorMessage = props.errorMessage;
    this._createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;

    this.validateBusinessRules();
    Object.freeze(this);
  }

  /**
   * 新しいReceiptを作成する（処理開始時）
   */
  public static create(
    id: string,
    userId: UserId,
    receiptImageUrl: string,
    createdAt?: Date
  ): Receipt {
    this.validateId(id);
    this.validateReceiptImageUrl(receiptImageUrl);

    const now = createdAt || new Date();
    
    return new Receipt({
      id,
      userId,
      receiptImageUrl,
      status: 'processing',
      items: [],
      accountSuggestions: [],
      taxNotes: [],
      createdAt: now,
      updatedAt: now
    });
  }

  /**
   * 既存データからReceiptを復元する
   */
  public static reconstitute(props: ReceiptProps): Receipt {
    return new Receipt(props);
  }

  private static validateId(id: string): void {
    if (!id || typeof id !== 'string' || id.trim().length === 0) {
      throw new Error('Receipt ID cannot be empty');
    }
    
    // UUID形式のチェック
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id.trim())) {
      throw new Error('Receipt ID must be a valid UUID');
    }
  }

  private static validateReceiptImageUrl(url: string): void {
    if (!url || typeof url !== 'string' || url.trim().length === 0) {
      throw new Error('Receipt image URL cannot be empty');
    }

    try {
      new URL(url);
    } catch {
      throw new Error('Receipt image URL must be a valid URL');
    }
  }

  private validateBusinessRules(): void {
    // ステータスが completed の場合は、レシート日付が必要
    if (this._status === 'completed' && !this._receiptDate) {
      throw new Error('Receipt date is required when status is completed');
    }

    // ステータスが failed の場合は、エラーメッセージが必要
    if (this._status === 'failed' && !this._errorMessage) {
      throw new Error('Error message is required when status is failed');
    }

    // アイテムがある場合は、合計金額も設定されているべき
    if (this._items.length > 0 && !this._totalAmount) {
      // 自動計算を試行
      this._totalAmount = this.calculateTotalAmount();
    }

    // 合計金額がアイテムの合計と一致するかチェック
    if (this._items.length > 0 && this._totalAmount) {
      const calculatedTotal = this.calculateTotalAmount();
      if (!this._totalAmount.equals(calculatedTotal)) {
        throw new Error('Total amount does not match the sum of item prices');
      }
    }
  }

  private calculateTotalAmount(): Money {
    if (this._items.length === 0) {
      return Money.fromYen(0);
    }

    return this._items.reduce(
      (total, item) => total.add(item.price),
      Money.fromYen(0)
    );
  }

  /**
   * 処理を完了状態に更新する
   */
  public markAsCompleted(
    receiptDate: ReceiptDate,
    items: ReceiptItem[],
    accountSuggestions: string[] = [],
    taxNotes: string[] = []
  ): Receipt {
    if (this._status === 'completed') {
      throw new Error('Receipt is already completed');
    }

    if (items.length === 0) {
      throw new Error('At least one item is required to complete the receipt');
    }

    const totalAmount = items.reduce(
      (total, item) => total.add(item.price),
      Money.fromYen(0)
    );

    return new Receipt({
      id: this._id,
      userId: this._userId,
      receiptImageUrl: this._receiptImageUrl,
      status: 'completed',
      receiptDate,
      items,
      totalAmount,
      accountSuggestions,
      taxNotes,
      createdAt: this._createdAt,
      updatedAt: new Date()
    });
  }

  /**
   * 処理を失敗状態に更新する
   */
  public markAsFailed(errorMessage: string): Receipt {
    if (this._status === 'completed') {
      throw new Error('Cannot mark completed receipt as failed');
    }

    if (!errorMessage || errorMessage.trim().length === 0) {
      throw new Error('Error message is required when marking receipt as failed');
    }

    return new Receipt({
      id: this._id,
      userId: this._userId,
      receiptImageUrl: this._receiptImageUrl,
      status: 'failed',
      receiptDate: this._receiptDate,
      items: this._items,
      totalAmount: this._totalAmount,
      accountSuggestions: this._accountSuggestions,
      taxNotes: this._taxNotes,
      errorMessage: errorMessage.trim(),
      createdAt: this._createdAt,
      updatedAt: new Date()
    });
  }

  /**
   * レシート項目を更新する（処理中のみ）
   */
  public updateItems(items: ReceiptItem[]): Receipt {
    if (this._status === 'completed') {
      throw new Error('Cannot update items of completed receipt');
    }

    if (this._status === 'failed') {
      throw new Error('Cannot update items of failed receipt');
    }

    const totalAmount = items.length > 0
      ? items.reduce((total, item) => total.add(item.price), Money.fromYen(0))
      : undefined;

    return new Receipt({
      id: this._id,
      userId: this._userId,
      receiptImageUrl: this._receiptImageUrl,
      status: this._status,
      receiptDate: this._receiptDate,
      items,
      totalAmount,
      accountSuggestions: this._accountSuggestions,
      taxNotes: this._taxNotes,
      errorMessage: this._errorMessage,
      createdAt: this._createdAt,
      updatedAt: new Date()
    });
  }

  // Getters
  public get id(): string {
    return this._id;
  }

  public get userId(): UserId {
    return this._userId;
  }

  public get receiptImageUrl(): string {
    return this._receiptImageUrl;
  }

  public get status(): ReceiptStatus {
    return this._status;
  }

  public get receiptDate(): ReceiptDate | undefined {
    return this._receiptDate;
  }

  public get items(): readonly ReceiptItem[] {
    return Object.freeze([...this._items]);
  }

  public get totalAmount(): Money | undefined {
    return this._totalAmount;
  }

  public get accountSuggestions(): readonly string[] {
    return Object.freeze([...this._accountSuggestions]);
  }

  public get taxNotes(): readonly string[] {
    return Object.freeze([...this._taxNotes]);
  }

  public get errorMessage(): string | undefined {
    return this._errorMessage;
  }

  public get createdAt(): Date {
    return new Date(this._createdAt.getTime());
  }

  public get updatedAt(): Date {
    return new Date(this._updatedAt.getTime());
  }

  /**
   * 他のReceiptとの等価比較
   */
  public equals(other?: Receipt): boolean {
    if (!other || !(other instanceof Receipt)) {
      return false;
    }
    return this._id === other._id && this._userId.equals(other._userId);
  }

  /**
   * 処理中かどうか
   */
  public isProcessing(): boolean {
    return this._status === 'processing';
  }

  /**
   * 完了済みかどうか
   */
  public isCompleted(): boolean {
    return this._status === 'completed';
  }

  /**
   * 失敗済みかどうか
   */
  public isFailed(): boolean {
    return this._status === 'failed';
  }

  /**
   * 合計金額を表示用フォーマットで取得
   */
  public getFormattedTotalAmount(): string | undefined {
    return this._totalAmount?.format();
  }

  /**
   * レシート日付を表示用フォーマットで取得
   */
  public getFormattedReceiptDate(): string | undefined {
    return this._receiptDate?.formatForDisplay();
  }

  /**
   * ドメインイベント用のスナップショット
   */
  public toSnapshot(): ReceiptProps {
    return {
      id: this._id,
      userId: this._userId,
      receiptImageUrl: this._receiptImageUrl,
      status: this._status,
      receiptDate: this._receiptDate,
      items: [...this._items],
      totalAmount: this._totalAmount,
      accountSuggestions: [...this._accountSuggestions],
      taxNotes: [...this._taxNotes],
      errorMessage: this._errorMessage,
      createdAt: new Date(this._createdAt.getTime()),
      updatedAt: new Date(this._updatedAt.getTime())
    };
  }
}
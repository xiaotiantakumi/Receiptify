// api/src/domain/entities/ReceiptItem.ts
import { Money } from '../value-objects/Money';
import { ReceiptDate } from '../value-objects/ReceiptDate';

/**
 * レシートアイテムID値オブジェクト
 * UUIDv4形式の一意識別子
 */
export class ReceiptItemId {
  public readonly value: string;

  private constructor(value: string) {
    this.value = value;
    Object.freeze(this);
  }

  public static create(id: string): ReceiptItemId {
    if (!id || typeof id !== 'string') {
      throw new Error('ReceiptItemId cannot be empty');
    }

    const trimmedId = id.trim();
    
    // UUIDv4形式の検証
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(trimmedId)) {
      throw new Error('ReceiptItemId must be a valid UUIDv4');
    }

    return new ReceiptItemId(trimmedId);
  }

  public static generate(): ReceiptItemId {
    // UUIDv4の生成（RFC4122準拠）
    const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
    
    return new ReceiptItemId(uuid);
  }

  public equals(other?: ReceiptItemId): boolean {
    if (!other || !(other instanceof ReceiptItemId)) {
      return false;
    }
    return this.value === other.value;
  }

  public toString(): string {
    return this.value;
  }
}

/**
 * 勘定科目値オブジェクト
 * 日本の会計基準に基づく勘定科目の管理
 */
export class AccountCategory {
  public readonly value: string;

  private constructor(value: string) {
    this.value = value;
    Object.freeze(this);
  }

  // 一般的な経費勘定科目
  private static readonly COMMON_CATEGORIES = [
    '消耗品費', '事務用品費', '交通費', '会議費', '接待交際費',
    '通信費', '水道光熱費', '賃借料', '保険料', '修繕費',
    '広告宣伝費', '研修費', '図書費', '旅費交通費', '雑費'
  ] as const;

  public static create(category: string): AccountCategory {
    if (!category || typeof category !== 'string') {
      throw new Error('Account category cannot be empty');
    }

    const trimmedCategory = category.trim();
    
    if (trimmedCategory.length === 0) {
      throw new Error('Account category cannot be empty');
    }

    if (trimmedCategory.length > 50) {
      throw new Error('Account category is too long (max 50 characters)');
    }

    // 日本語文字、英数字、一部記号のみ許可
    const validCharRegex = /^[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAFa-zA-Z0-9\s・ー（）()]+$/;
    if (!validCharRegex.test(trimmedCategory)) {
      throw new Error('Account category contains invalid characters');
    }

    return new AccountCategory(trimmedCategory);
  }

  public static getCommonCategories(): readonly string[] {
    return AccountCategory.COMMON_CATEGORIES;
  }

  public isCommonCategory(): boolean {
    return AccountCategory.COMMON_CATEGORIES.includes(this.value as any);
  }

  public equals(other?: AccountCategory): boolean {
    if (!other || !(other instanceof AccountCategory)) {
      return false;
    }
    return this.value === other.value;
  }

  public toString(): string {
    return this.value;
  }
}

/**
 * 税務上の注意点値オブジェクト
 * 税務申告時の注意事項やメモを管理
 */
export class TaxNote {
  public readonly value: string;

  private constructor(value: string) {
    this.value = value;
    Object.freeze(this);
  }

  public static create(note: string): TaxNote {
    if (!note || typeof note !== 'string') {
      throw new Error('Tax note cannot be empty');
    }

    const trimmedNote = note.trim();
    
    if (trimmedNote.length === 0) {
      throw new Error('Tax note cannot be empty');
    }

    if (trimmedNote.length > 500) {
      throw new Error('Tax note is too long (max 500 characters)');
    }

    // HTMLタグ、スクリプトの除去（XSS対策）
    if (/<script|javascript:|on\w+=/i.test(trimmedNote)) {
      throw new Error('Tax note contains unsafe content');
    }

    return new TaxNote(trimmedNote);
  }

  public static createOptional(note?: string): TaxNote | undefined {
    if (!note || note.trim().length === 0) {
      return undefined;
    }
    return TaxNote.create(note);
  }

  public equals(other?: TaxNote): boolean {
    if (!other || !(other instanceof TaxNote)) {
      return false;
    }
    return this.value === other.value;
  }

  public toString(): string {
    return this.value;
  }
}

/**
 * 商品名値オブジェクト
 * レシート上の商品・サービス名を管理
 */
export class ItemName {
  public readonly value: string;

  private constructor(value: string) {
    this.value = value;
    Object.freeze(this);
  }

  public static create(name: string): ItemName {
    if (!name || typeof name !== 'string') {
      throw new Error('Item name cannot be empty');
    }

    const trimmedName = name.trim();
    
    if (trimmedName.length === 0) {
      throw new Error('Item name cannot be empty');
    }

    if (trimmedName.length > 200) {
      throw new Error('Item name is too long (max 200 characters)');
    }

    // HTMLタグ、スクリプトの除去（XSS対策）
    if (/<script|javascript:|on\w+=/i.test(trimmedName)) {
      throw new Error('Item name contains unsafe content');
    }

    return new ItemName(trimmedName);
  }

  public equals(other?: ItemName): boolean {
    if (!other || !(other instanceof ItemName)) {
      return false;
    }
    return this.value === other.value;
  }

  public toString(): string {
    return this.value;
  }
}

/**
 * レシートアイテムエンティティ
 * 1つのレシート項目を表すドメインエンティティ
 */
export class ReceiptItem {
  public readonly id: ReceiptItemId;
  public readonly name: ItemName;
  public readonly price: Money;
  public readonly accountCategory?: AccountCategory;
  public readonly taxNote?: TaxNote;
  public readonly purchaseDate: ReceiptDate;
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  private constructor(props: {
    id: ReceiptItemId;
    name: ItemName;
    price: Money;
    accountCategory?: AccountCategory;
    taxNote?: TaxNote;
    purchaseDate: ReceiptDate;
    createdAt?: Date;
    updatedAt?: Date;
  }) {
    this.id = props.id;
    this.name = props.name;
    this.price = props.price;
    this.accountCategory = props.accountCategory;
    this.taxNote = props.taxNote;
    this.purchaseDate = props.purchaseDate;
    this._createdAt = props.createdAt || new Date();
    this._updatedAt = props.updatedAt || new Date();
    
    Object.freeze(this);
  }

  /**
   * 新しいReceiptItemを作成
   */
  public static create(props: {
    name: string;
    priceInYen: number;
    accountCategory?: string;
    taxNote?: string;
    purchaseDate: string | Date;
  }): ReceiptItem {
    return new ReceiptItem({
      id: ReceiptItemId.generate(),
      name: ItemName.create(props.name),
      price: Money.fromYen(props.priceInYen),
      accountCategory: props.accountCategory ? AccountCategory.create(props.accountCategory) : undefined,
      taxNote: TaxNote.createOptional(props.taxNote),
      purchaseDate: ReceiptDate.create(props.purchaseDate)
    });
  }

  /**
   * 既存のReceiptItemを復元（永続化層からの復元時に使用）
   */
  public static restore(props: {
    id: string;
    name: string;
    priceInYen: number;
    accountCategory?: string;
    taxNote?: string;
    purchaseDate: string | Date;
    createdAt: Date;
    updatedAt: Date;
  }): ReceiptItem {
    return new ReceiptItem({
      id: ReceiptItemId.create(props.id),
      name: ItemName.create(props.name),
      price: Money.fromYen(props.priceInYen),
      accountCategory: props.accountCategory ? AccountCategory.create(props.accountCategory) : undefined,
      taxNote: TaxNote.createOptional(props.taxNote),
      purchaseDate: ReceiptDate.create(props.purchaseDate),
      createdAt: props.createdAt,
      updatedAt: props.updatedAt
    });
  }

  public get createdAt(): Date {
    return this._createdAt;
  }

  public get updatedAt(): Date {
    return this._updatedAt;
  }

  /**
   * 勘定科目を更新（新しいインスタンスを返す）
   */
  public updateAccountCategory(category: string): ReceiptItem {
    return new ReceiptItem({
      id: this.id,
      name: this.name,
      price: this.price,
      accountCategory: AccountCategory.create(category),
      taxNote: this.taxNote,
      purchaseDate: this.purchaseDate,
      createdAt: this._createdAt,
      updatedAt: new Date()
    });
  }

  /**
   * 税務メモを更新（新しいインスタンスを返す）
   */
  public updateTaxNote(note: string): ReceiptItem {
    return new ReceiptItem({
      id: this.id,
      name: this.name,
      price: this.price,
      accountCategory: this.accountCategory,
      taxNote: TaxNote.create(note),
      purchaseDate: this.purchaseDate,
      createdAt: this._createdAt,
      updatedAt: new Date()
    });
  }

  /**
   * IDによる等価比較
   */
  public equals(other?: ReceiptItem): boolean {
    if (!other || !(other instanceof ReceiptItem)) {
      return false;
    }
    return this.id.equals(other.id);
  }

  /**
   * 経費として計上可能かチェック
   */
  public isDeductibleExpense(): boolean {
    // 基本的に全ての項目は経費として計上可能
    // ビジネスルールに応じて条件を追加
    return this.price.yenAmount > 0;
  }

  /**
   * 高額商品かチェック（10万円以上）
   */
  public isHighValueItem(): boolean {
    return this.price.yenAmount >= 100000;
  }

  /**
   * 表示用の文字列表現
   */
  public toString(): string {
    const categoryStr = this.accountCategory ? ` [${this.accountCategory.value}]` : '';
    return `${this.name.value}: ${this.price.format()}${categoryStr} (${this.purchaseDate.formatForDisplay()})`;
  }

  /**
   * 永続化用のプレーンオブジェクトに変換
   */
  public toPersistenceObject(): {
    id: string;
    name: string;
    price: number;
    accountCategory?: string;
    taxNote?: string;
    purchaseDate: string;
    createdAt: Date;
    updatedAt: Date;
  } {
    return {
      id: this.id.value,
      name: this.name.value,
      price: this.price.yenAmount,
      accountCategory: this.accountCategory?.value,
      taxNote: this.taxNote?.value,
      purchaseDate: this.purchaseDate.value,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt
    };
  }

  /**
   * CSV出力用のデータに変換
   */
  public toCsvData(): {
    購入日: string;
    商品名: string;
    金額: string;
    勘定科目: string;
    税務メモ: string;
  } {
    return {
      購入日: this.purchaseDate.formatForDisplay(),
      商品名: this.name.value,
      金額: this.price.format(),
      勘定科目: this.accountCategory?.value || '',
      税務メモ: this.taxNote?.value || ''
    };
  }
}
// api/src/tests/domain/entities/ReceiptItem.spec.ts
import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  ReceiptItem,
  ReceiptItemId,
  AccountCategory,
  TaxNote,
  ItemName
} from '../../../domain/entities/ReceiptItem';
import { Money } from '../../../domain/value-objects/Money';
import { ReceiptDate } from '../../../domain/value-objects/ReceiptDate';

describe('ReceiptItemId', () => {
  describe('create', () => {
    it('有効なUUIDv4からReceiptItemIdを作成できる', () => {
      const validUuid = '12345678-1234-4123-8123-123456789abc';
      const id = ReceiptItemId.create(validUuid);
      expect(id.value).toBe(validUuid);
    });

    it('無効なUUIDフォーマットでエラーが発生する', () => {
      expect(() => ReceiptItemId.create('invalid-uuid')).toThrow('ReceiptItemId must be a valid UUIDv4');
    });

    it('空文字列でエラーが発生する', () => {
      expect(() => ReceiptItemId.create('')).toThrow('ReceiptItemId cannot be empty');
    });

    it('nullでエラーが発生する', () => {
      expect(() => ReceiptItemId.create(null as any)).toThrow('ReceiptItemId cannot be empty');
    });
  });

  describe('generate', () => {
    it('新しいUUIDv4を生成できる', () => {
      const id = ReceiptItemId.generate();
      expect(id.value).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });

    it('生成される度に異なるIDになる', () => {
      const id1 = ReceiptItemId.generate();
      const id2 = ReceiptItemId.generate();
      expect(id1.value).not.toBe(id2.value);
    });
  });

  describe('equals', () => {
    it('同じ値の場合にtrueを返す', () => {
      const uuid = '12345678-1234-4123-8123-123456789abc';
      const id1 = ReceiptItemId.create(uuid);
      const id2 = ReceiptItemId.create(uuid);
      expect(id1.equals(id2)).toBe(true);
    });

    it('異なる値の場合にfalseを返す', () => {
      const id1 = ReceiptItemId.create('12345678-1234-4123-8123-123456789abc');
      const id2 = ReceiptItemId.create('87654321-4321-4321-8321-cba987654321');
      expect(id1.equals(id2)).toBe(false);
    });
  });
});

describe('AccountCategory', () => {
  describe('create', () => {
    it('有効な勘定科目を作成できる', () => {
      const category = AccountCategory.create('消耗品費');
      expect(category.value).toBe('消耗品費');
    });

    it('英数字を含む勘定科目を作成できる', () => {
      const category = AccountCategory.create('IT関連費');
      expect(category.value).toBe('IT関連費');
    });

    it('空文字列でエラーが発生する', () => {
      expect(() => AccountCategory.create('')).toThrow('Account category cannot be empty');
    });

    it('長すぎる文字列でエラーが発生する', () => {
      const longString = 'a'.repeat(51);
      expect(() => AccountCategory.create(longString)).toThrow('Account category is too long');
    });

    it('不正な文字でエラーが発生する', () => {
      expect(() => AccountCategory.create('科目<script>')).toThrow('Account category contains invalid characters');
    });
  });

  describe('getCommonCategories', () => {
    it('一般的な勘定科目一覧を取得できる', () => {
      const categories = AccountCategory.getCommonCategories();
      expect(categories).toContain('消耗品費');
      expect(categories).toContain('交通費');
      expect(categories.length).toBeGreaterThan(0);
    });
  });

  describe('isCommonCategory', () => {
    it('一般的な勘定科目の場合にtrueを返す', () => {
      const category = AccountCategory.create('消耗品費');
      expect(category.isCommonCategory()).toBe(true);
    });

    it('独自の勘定科目の場合にfalseを返す', () => {
      const category = AccountCategory.create('特別な経費');
      expect(category.isCommonCategory()).toBe(false);
    });
  });
});

describe('TaxNote', () => {
  describe('create', () => {
    it('有効な税務メモを作成できる', () => {
      const note = TaxNote.create('消費税10%適用');
      expect(note.value).toBe('消費税10%適用');
    });

    it('空文字列でエラーが発生する', () => {
      expect(() => TaxNote.create('')).toThrow('Tax note cannot be empty');
    });

    it('長すぎる文字列でエラーが発生する', () => {
      const longString = 'a'.repeat(501);
      expect(() => TaxNote.create(longString)).toThrow('Tax note is too long');
    });

    it('安全でないコンテンツでエラーが発生する', () => {
      expect(() => TaxNote.create('<script>alert("xss")</script>')).toThrow('Tax note contains unsafe content');
    });
  });

  describe('createOptional', () => {
    it('有効な値でTaxNoteを作成できる', () => {
      const note = TaxNote.createOptional('有効なメモ');
      expect(note).toBeDefined();
      expect(note!.value).toBe('有効なメモ');
    });

    it('空文字列でundefinedを返す', () => {
      const note = TaxNote.createOptional('');
      expect(note).toBeUndefined();
    });

    it('undefinedでundefinedを返す', () => {
      const note = TaxNote.createOptional(undefined);
      expect(note).toBeUndefined();
    });
  });
});

describe('ItemName', () => {
  describe('create', () => {
    it('有効な商品名を作成できる', () => {
      const name = ItemName.create('コーヒー豆500g');
      expect(name.value).toBe('コーヒー豆500g');
    });

    it('空文字列でエラーが発生する', () => {
      expect(() => ItemName.create('')).toThrow('Item name cannot be empty');
    });

    it('長すぎる文字列でエラーが発生する', () => {
      const longString = 'a'.repeat(201);
      expect(() => ItemName.create(longString)).toThrow('Item name is too long');
    });

    it('安全でないコンテンツでエラーが発生する', () => {
      expect(() => ItemName.create('<script>alert("xss")</script>')).toThrow('Item name contains unsafe content');
    });
  });
});

describe('ReceiptItem', () => {
  const validProps = {
    name: 'テストアイテム',
    priceInYen: 1000,
    accountCategory: '消耗品費',
    taxNote: '消費税10%',
    purchaseDate: '2024-01-15'
  };

  describe('create', () => {
    it('有効な値でReceiptItemを作成できる', () => {
      const item = ReceiptItem.create(validProps);
      
      expect(item.name.value).toBe('テストアイテム');
      expect(item.price.yenAmount).toBe(1000);
      expect(item.accountCategory!.value).toBe('消耗品費');
      expect(item.taxNote!.value).toBe('消費税10%');
      expect(item.purchaseDate.value).toBe('2024-01-15');
      expect(item.id).toBeDefined();
      expect(item.createdAt).toBeDefined();
      expect(item.updatedAt).toBeDefined();
    });

    it('オプショナルな値なしでReceiptItemを作成できる', () => {
      const item = ReceiptItem.create({
        name: 'シンプルアイテム',
        priceInYen: 500,
        purchaseDate: '2024-01-15'
      });
      
      expect(item.name.value).toBe('シンプルアイテム');
      expect(item.price.yenAmount).toBe(500);
      expect(item.accountCategory).toBeUndefined();
      expect(item.taxNote).toBeUndefined();
    });

    it('無効な値でエラーが発生する', () => {
      expect(() => ReceiptItem.create({
        ...validProps,
        name: ''
      })).toThrow();
    });
  });

  describe('restore', () => {
    it('永続化データからReceiptItemを復元できる', () => {
      const createdAt = new Date('2024-01-01');
      const updatedAt = new Date('2024-01-02');
      
      const item = ReceiptItem.restore({
        id: '12345678-1234-4123-8123-123456789abc',
        name: '復元アイテム',
        priceInYen: 1500,
        accountCategory: '交通費',
        taxNote: '領収書あり',
        purchaseDate: '2024-01-15',
        createdAt,
        updatedAt
      });
      
      expect(item.id.value).toBe('12345678-1234-4123-8123-123456789abc');
      expect(item.name.value).toBe('復元アイテム');
      expect(item.price.yenAmount).toBe(1500);
      expect(item.createdAt).toBe(createdAt);
      expect(item.updatedAt).toBe(updatedAt);
    });
  });

  describe('updateAccountCategory', () => {
    it('勘定科目を更新した新しいインスタンスを返す', async () => {
      const original = ReceiptItem.create(validProps);
      
      // 時間差を確保するために少し待機
      await new Promise(resolve => setTimeout(resolve, 1));
      
      const updated = original.updateAccountCategory('会議費');
      
      expect(updated.accountCategory!.value).toBe('会議費');
      expect(updated.id.equals(original.id)).toBe(true);
      expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(original.updatedAt.getTime());
      expect(original.accountCategory!.value).toBe('消耗品費'); // 元のオブジェクトは変更されない
    });
  });

  describe('updateTaxNote', () => {
    it('税務メモを更新した新しいインスタンスを返す', async () => {
      const original = ReceiptItem.create(validProps);
      
      // 時間差を確保するために少し待機
      await new Promise(resolve => setTimeout(resolve, 1));
      
      const updated = original.updateTaxNote('新しいメモ');
      
      expect(updated.taxNote!.value).toBe('新しいメモ');
      expect(updated.id.equals(original.id)).toBe(true);
      expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(original.updatedAt.getTime());
    });
  });

  describe('equals', () => {
    it('同じIDの場合にtrueを返す', () => {
      const item1 = ReceiptItem.create(validProps);
      const item2 = ReceiptItem.restore({
        id: item1.id.value,
        name: '異なる名前',
        priceInYen: 9999,
        purchaseDate: '2020-01-01',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      expect(item1.equals(item2)).toBe(true);
    });

    it('異なるIDの場合にfalseを返す', () => {
      const item1 = ReceiptItem.create(validProps);
      const item2 = ReceiptItem.create(validProps);
      
      expect(item1.equals(item2)).toBe(false);
    });
  });

  describe('isDeductibleExpense', () => {
    it('金額が0より大きい場合にtrueを返す', () => {
      const item = ReceiptItem.create(validProps);
      expect(item.isDeductibleExpense()).toBe(true);
    });

    it('金額が0の場合にfalseを返す', () => {
      const item = ReceiptItem.create({
        ...validProps,
        priceInYen: 0
      });
      expect(item.isDeductibleExpense()).toBe(false);
    });
  });

  describe('isHighValueItem', () => {
    it('10万円以上の場合にtrueを返す', () => {
      const item = ReceiptItem.create({
        ...validProps,
        priceInYen: 100000
      });
      expect(item.isHighValueItem()).toBe(true);
    });

    it('10万円未満の場合にfalseを返す', () => {
      const item = ReceiptItem.create({
        ...validProps,
        priceInYen: 99999
      });
      expect(item.isHighValueItem()).toBe(false);
    });
  });

  describe('toPersistenceObject', () => {
    it('永続化用のオブジェクトに変換できる', () => {
      const item = ReceiptItem.create(validProps);
      const obj = item.toPersistenceObject();
      
      expect(obj.id).toBe(item.id.value);
      expect(obj.name).toBe('テストアイテム');
      expect(obj.price).toBe(1000);
      expect(obj.accountCategory).toBe('消耗品費');
      expect(obj.taxNote).toBe('消費税10%');
      expect(obj.purchaseDate).toBe('2024-01-15');
      expect(obj.createdAt).toBe(item.createdAt);
      expect(obj.updatedAt).toBe(item.updatedAt);
    });

    it('オプショナルな値がundefinedの場合も正しく変換できる', () => {
      const item = ReceiptItem.create({
        name: 'シンプルアイテム',
        priceInYen: 500,
        purchaseDate: '2024-01-15'
      });
      const obj = item.toPersistenceObject();
      
      expect(obj.accountCategory).toBeUndefined();
      expect(obj.taxNote).toBeUndefined();
    });
  });

  describe('toCsvData', () => {
    it('CSV用のデータに変換できる', () => {
      const item = ReceiptItem.create(validProps);
      const csvData = item.toCsvData();
      
      expect(csvData.購入日).toBe('2024年1月15日');
      expect(csvData.商品名).toBe('テストアイテム');
      expect(csvData.金額).toBe('1,000 JPY');
      expect(csvData.勘定科目).toBe('消耗品費');
      expect(csvData.税務メモ).toBe('消費税10%');
    });

    it('オプショナルな値がない場合も正しく変換できる', () => {
      const item = ReceiptItem.create({
        name: 'シンプルアイテム',
        priceInYen: 500,
        purchaseDate: '2024-01-15'
      });
      const csvData = item.toCsvData();
      
      expect(csvData.勘定科目).toBe('');
      expect(csvData.税務メモ).toBe('');
    });
  });

  describe('toString', () => {
    it('適切な文字列表現を返す', () => {
      const item = ReceiptItem.create(validProps);
      const str = item.toString();
      
      expect(str).toContain('テストアイテム');
      expect(str).toContain('1,000 JPY');
      expect(str).toContain('消耗品費');
      expect(str).toContain('2024年1月15日');
    });
  });
});
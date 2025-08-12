// api/src/tests/domain/entities/Receipt.spec.ts
import { Receipt, ReceiptItem } from '../../../domain/entities/Receipt';
import { UserId } from '../../../domain/value-objects/UserId';
import { ReceiptDate } from '../../../domain/value-objects/ReceiptDate';
import { Money } from '../../../domain/value-objects/Money';

describe('Receipt', () => {
  const validUserId = UserId.create('test-user-123');
  const validId = '12345678-1234-1234-1234-123456789012';
  const validImageUrl = 'https://example.com/receipt.jpg';
  const validReceiptDate = ReceiptDate.create('2024-01-15');

  const createValidReceiptItem = (name = 'Test Item', priceInYen = 1000): ReceiptItem => ({
    name,
    price: Money.fromYen(priceInYen),
    category: 'Office Supplies',
    accountSuggestion: '消耗品費',
    taxNote: '課税対象'
  });

  describe('create', () => {
    it('新しいレシートを作成できる', () => {
      const receipt = Receipt.create(validId, validUserId, validImageUrl);

      expect(receipt.id).toBe(validId);
      expect(receipt.userId).toBe(validUserId);
      expect(receipt.receiptImageUrl).toBe(validImageUrl);
      expect(receipt.status).toBe('processing');
      expect(receipt.items).toHaveLength(0);
      expect(receipt.accountSuggestions).toHaveLength(0);
      expect(receipt.taxNotes).toHaveLength(0);
      expect(receipt.createdAt).toBeInstanceOf(Date);
      expect(receipt.updatedAt).toBeInstanceOf(Date);
    });

    it('カスタム作成日時を指定できる', () => {
      const customDate = new Date('2024-01-01T00:00:00Z');
      const receipt = Receipt.create(validId, validUserId, validImageUrl, customDate);

      expect(receipt.createdAt).toEqual(customDate);
      expect(receipt.updatedAt).toEqual(customDate);
    });

    it('無効なIDでエラーが発生する', () => {
      expect(() => Receipt.create('', validUserId, validImageUrl))
        .toThrow('Receipt ID cannot be empty');

      expect(() => Receipt.create('invalid-uuid', validUserId, validImageUrl))
        .toThrow('Receipt ID must be a valid UUID');
    });

    it('無効な画像URLでエラーが発生する', () => {
      expect(() => Receipt.create(validId, validUserId, ''))
        .toThrow('Receipt image URL cannot be empty');

      expect(() => Receipt.create(validId, validUserId, 'invalid-url'))
        .toThrow('Receipt image URL must be a valid URL');
    });
  });

  describe('reconstitute', () => {
    it('既存データからレシートを復元できる', () => {
      const props = {
        id: validId,
        userId: validUserId,
        receiptImageUrl: validImageUrl,
        status: 'completed' as const,
        receiptDate: validReceiptDate,
        items: [createValidReceiptItem()],
        totalAmount: Money.fromYen(1000),
        accountSuggestions: ['消耗品費'],
        taxNotes: ['課税対象'],
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-01T00:00:00Z')
      };

      const receipt = Receipt.reconstitute(props);

      expect(receipt.id).toBe(validId);
      expect(receipt.status).toBe('completed');
      expect(receipt.items).toHaveLength(1);
      expect(receipt.totalAmount?.yenAmount).toBe(1000);
    });

    it('完了ステータスでレシート日付が未設定の場合エラーが発生する', () => {
      const props = {
        id: validId,
        userId: validUserId,
        receiptImageUrl: validImageUrl,
        status: 'completed' as const,
        // receiptDate: undefined, // 未設定
        createdAt: new Date(),
        updatedAt: new Date()
      };

      expect(() => Receipt.reconstitute(props))
        .toThrow('Receipt date is required when status is completed');
    });

    it('失敗ステータスでエラーメッセージが未設定の場合エラーが発生する', () => {
      const props = {
        id: validId,
        userId: validUserId,
        receiptImageUrl: validImageUrl,
        status: 'failed' as const,
        // errorMessage: undefined, // 未設定
        createdAt: new Date(),
        updatedAt: new Date()
      };

      expect(() => Receipt.reconstitute(props))
        .toThrow('Error message is required when status is failed');
    });

    it('合計金額がアイテムの合計と一致しない場合エラーが発生する', () => {
      const props = {
        id: validId,
        userId: validUserId,
        receiptImageUrl: validImageUrl,
        status: 'completed' as const,
        receiptDate: validReceiptDate,
        items: [createValidReceiptItem('Item1', 1000), createValidReceiptItem('Item2', 500)],
        totalAmount: Money.fromYen(2000), // 正しくは1500
        createdAt: new Date(),
        updatedAt: new Date()
      };

      expect(() => Receipt.reconstitute(props))
        .toThrow('Total amount does not match the sum of item prices');
    });
  });

  describe('markAsCompleted', () => {
    it('レシートを完了状態に更新できる', () => {
      const receipt = Receipt.create(validId, validUserId, validImageUrl);
      const items = [createValidReceiptItem()];
      
      const completedReceipt = receipt.markAsCompleted(
        validReceiptDate,
        items,
        ['消耗品費'],
        ['課税対象']
      );

      expect(completedReceipt.status).toBe('completed');
      expect(completedReceipt.receiptDate).toBe(validReceiptDate);
      expect(completedReceipt.items).toHaveLength(1);
      expect(completedReceipt.totalAmount?.yenAmount).toBe(1000);
      expect(completedReceipt.accountSuggestions).toEqual(['消耗品費']);
      expect(completedReceipt.taxNotes).toEqual(['課税対象']);
      expect(completedReceipt.updatedAt.getTime()).toBeGreaterThanOrEqual(receipt.updatedAt.getTime());
    });

    it('既に完了済みの場合エラーが発生する', () => {
      const receipt = Receipt.create(validId, validUserId, validImageUrl);
      const items = [createValidReceiptItem()];
      const completedReceipt = receipt.markAsCompleted(validReceiptDate, items);

      expect(() => completedReceipt.markAsCompleted(validReceiptDate, items))
        .toThrow('Receipt is already completed');
    });

    it('アイテムが空の場合エラーが発生する', () => {
      const receipt = Receipt.create(validId, validUserId, validImageUrl);

      expect(() => receipt.markAsCompleted(validReceiptDate, []))
        .toThrow('At least one item is required to complete the receipt');
    });
  });

  describe('markAsFailed', () => {
    it('レシートを失敗状態に更新できる', () => {
      const receipt = Receipt.create(validId, validUserId, validImageUrl);
      const errorMessage = 'AI解析に失敗しました';
      
      const failedReceipt = receipt.markAsFailed(errorMessage);

      expect(failedReceipt.status).toBe('failed');
      expect(failedReceipt.errorMessage).toBe(errorMessage);
      expect(failedReceipt.updatedAt.getTime()).toBeGreaterThanOrEqual(receipt.updatedAt.getTime());
    });

    it('完了済みレシートは失敗状態にできない', () => {
      const receipt = Receipt.create(validId, validUserId, validImageUrl);
      const items = [createValidReceiptItem()];
      const completedReceipt = receipt.markAsCompleted(validReceiptDate, items);

      expect(() => completedReceipt.markAsFailed('エラー'))
        .toThrow('Cannot mark completed receipt as failed');
    });

    it('エラーメッセージが空の場合エラーが発生する', () => {
      const receipt = Receipt.create(validId, validUserId, validImageUrl);

      expect(() => receipt.markAsFailed(''))
        .toThrow('Error message is required when marking receipt as failed');

      expect(() => receipt.markAsFailed('   '))
        .toThrow('Error message is required when marking receipt as failed');
    });
  });

  describe('updateItems', () => {
    it('処理中のレシートのアイテムを更新できる', () => {
      const receipt = Receipt.create(validId, validUserId, validImageUrl);
      const items = [
        createValidReceiptItem('Item1', 1000),
        createValidReceiptItem('Item2', 500)
      ];

      const updatedReceipt = receipt.updateItems(items);

      expect(updatedReceipt.items).toHaveLength(2);
      expect(updatedReceipt.totalAmount?.yenAmount).toBe(1500);
      expect(updatedReceipt.updatedAt.getTime()).toBeGreaterThanOrEqual(receipt.updatedAt.getTime());
    });

    it('完了済みレシートのアイテムは更新できない', () => {
      const receipt = Receipt.create(validId, validUserId, validImageUrl);
      const items = [createValidReceiptItem()];
      const completedReceipt = receipt.markAsCompleted(validReceiptDate, items);

      expect(() => completedReceipt.updateItems([createValidReceiptItem('New Item', 2000)]))
        .toThrow('Cannot update items of completed receipt');
    });

    it('失敗済みレシートのアイテムは更新できない', () => {
      const receipt = Receipt.create(validId, validUserId, validImageUrl);
      const failedReceipt = receipt.markAsFailed('エラー');

      expect(() => failedReceipt.updateItems([createValidReceiptItem()]))
        .toThrow('Cannot update items of failed receipt');
    });

    it('空のアイテムリストで合計金額がundefinedになる', () => {
      const receipt = Receipt.create(validId, validUserId, validImageUrl);
      const updatedReceipt = receipt.updateItems([]);

      expect(updatedReceipt.items).toHaveLength(0);
      expect(updatedReceipt.totalAmount).toBeUndefined();
    });
  });

  describe('business logic validation', () => {
    it('アイテムがある場合に合計金額が自動計算される', () => {
      const props = {
        id: validId,
        userId: validUserId,
        receiptImageUrl: validImageUrl,
        status: 'processing' as const,
        items: [
          createValidReceiptItem('Item1', 1000),
          createValidReceiptItem('Item2', 500)
        ],
        // totalAmount: undefined, // 自動計算されるべき
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const receipt = Receipt.reconstitute(props);

      expect(receipt.totalAmount?.yenAmount).toBe(1500);
    });
  });

  describe('status check methods', () => {
    it('ステータスチェックメソッドが正しく動作する', () => {
      const processingReceipt = Receipt.create(validId, validUserId, validImageUrl);
      expect(processingReceipt.isProcessing()).toBe(true);
      expect(processingReceipt.isCompleted()).toBe(false);
      expect(processingReceipt.isFailed()).toBe(false);

      const completedReceipt = processingReceipt.markAsCompleted(
        validReceiptDate,
        [createValidReceiptItem()]
      );
      expect(completedReceipt.isProcessing()).toBe(false);
      expect(completedReceipt.isCompleted()).toBe(true);
      expect(completedReceipt.isFailed()).toBe(false);

      const failedReceipt = processingReceipt.markAsFailed('エラー');
      expect(failedReceipt.isProcessing()).toBe(false);
      expect(failedReceipt.isCompleted()).toBe(false);
      expect(failedReceipt.isFailed()).toBe(true);
    });
  });

  describe('formatting methods', () => {
    it('フォーマット済み合計金額を取得できる', () => {
      const receipt = Receipt.create(validId, validUserId, validImageUrl);
      const items = [createValidReceiptItem('Test', 1234)];
      const updatedReceipt = receipt.updateItems(items);

      expect(updatedReceipt.getFormattedTotalAmount()).toBe('1,234 JPY');
    });

    it('フォーマット済みレシート日付を取得できる', () => {
      const receipt = Receipt.create(validId, validUserId, validImageUrl);
      const items = [createValidReceiptItem()];
      const completedReceipt = receipt.markAsCompleted(validReceiptDate, items);

      expect(completedReceipt.getFormattedReceiptDate()).toBe('2024年1月15日');
    });

    it('合計金額が未設定の場合undefinedを返す', () => {
      const receipt = Receipt.create(validId, validUserId, validImageUrl);

      expect(receipt.getFormattedTotalAmount()).toBeUndefined();
    });

    it('レシート日付が未設定の場合undefinedを返す', () => {
      const receipt = Receipt.create(validId, validUserId, validImageUrl);

      expect(receipt.getFormattedReceiptDate()).toBeUndefined();
    });
  });

  describe('equals', () => {
    it('同じIDとUserIdのレシートは等価', () => {
      const receipt1 = Receipt.create(validId, validUserId, validImageUrl);
      const receipt2 = Receipt.create(validId, validUserId, 'https://example.com/other.jpg');

      expect(receipt1.equals(receipt2)).toBe(true);
    });

    it('異なるIDまたはUserIdのレシートは等価でない', () => {
      const otherUserId = UserId.create('other-user');
      const otherId = '87654321-4321-4321-4321-210987654321';
      
      const receipt1 = Receipt.create(validId, validUserId, validImageUrl);
      const receipt2 = Receipt.create(otherId, validUserId, validImageUrl);
      const receipt3 = Receipt.create(validId, otherUserId, validImageUrl);

      expect(receipt1.equals(receipt2)).toBe(false);
      expect(receipt1.equals(receipt3)).toBe(false);
    });

    it('nullやundefinedとの比較では等価でない', () => {
      const receipt = Receipt.create(validId, validUserId, validImageUrl);

      expect(receipt.equals(null as any)).toBe(false);
      expect(receipt.equals(undefined)).toBe(false);
    });
  });

  describe('toSnapshot', () => {
    it('完全なスナップショットを取得できる', () => {
      const receipt = Receipt.create(validId, validUserId, validImageUrl);
      const items = [createValidReceiptItem()];
      const completedReceipt = receipt.markAsCompleted(
        validReceiptDate,
        items,
        ['消耗品費'],
        ['課税対象']
      );

      const snapshot = completedReceipt.toSnapshot();

      expect(snapshot.id).toBe(validId);
      expect(snapshot.userId).toBe(validUserId);
      expect(snapshot.status).toBe('completed');
      expect(snapshot.items).toHaveLength(1);
      expect(snapshot.totalAmount?.yenAmount).toBe(1000);
      expect(snapshot.accountSuggestions).toEqual(['消耗品費']);
      expect(snapshot.taxNotes).toEqual(['課税対象']);
      expect(snapshot.createdAt).toBeInstanceOf(Date);
      expect(snapshot.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('immutability', () => {
    it('レシートオブジェクトはイミュータブル', () => {
      const receipt = Receipt.create(validId, validUserId, validImageUrl);

      expect(() => {
        (receipt as any)._status = 'completed';
      }).toThrow();
    });

    it('アイテム配列は読み取り専用', () => {
      const receipt = Receipt.create(validId, validUserId, validImageUrl);
      const items = receipt.items as any;

      expect(() => {
        items.push(createValidReceiptItem());
      }).toThrow();
    });

    it('日付オブジェクトは複製される', () => {
      const originalDate = new Date('2024-01-01T00:00:00Z');
      const receipt = Receipt.create(validId, validUserId, validImageUrl, originalDate);

      const createdAt = receipt.createdAt;
      createdAt.setFullYear(2025);

      expect(receipt.createdAt.getFullYear()).toBe(2024);
    });
  });
});
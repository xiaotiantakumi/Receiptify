// api/src/tests/domain/value-objects/UserId.spec.ts
import { UserId } from '../../../domain/value-objects/UserId';

describe('UserId', () => {
  describe('create', () => {
    it('有効な文字列からUserIdを作成する', () => {
      const result = UserId.create('valid-user-id-123');
      expect(result.value).toBe('valid-user-id-123');
    });

    it('UUIDからUserIdを作成する', () => {
      const uuid = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
      const result = UserId.create(uuid);
      expect(result.value).toBe(uuid);
    });

    it('数字のみのIDからUserIdを作成する', () => {
      const result = UserId.create('123456789');
      expect(result.value).toBe('123456789');
    });

    it('前後のスペースをトリムしてUserIdを作成する', () => {
      const result = UserId.create('  user-id  ');
      expect(result.value).toBe('user-id');
    });

    it('空文字列の場合エラーを投げる', () => {
      expect(() => UserId.create(''))
        .toThrow('UserId cannot be empty');
    });

    it('スペースのみの文字列の場合エラーを投げる', () => {
      expect(() => UserId.create('   '))
        .toThrow('UserId cannot be empty');
    });

    it('null/undefinedの場合エラーを投げる', () => {
      expect(() => UserId.create(null))
        .toThrow('UserId cannot be empty');
      expect(() => UserId.create(undefined))
        .toThrow('UserId cannot be empty');
    });

    it('数値型の場合エラーを投げる', () => {
      expect(() => UserId.create(123))
        .toThrow('UserId cannot be empty');
    });

    it('オブジェクト型の場合エラーを投げる', () => {
      expect(() => UserId.create({ id: 'test' }))
        .toThrow('UserId cannot be empty');
    });

    it('100文字を超える場合エラーを投げる', () => {
      const longId = 'a'.repeat(101);
      expect(() => UserId.create(longId))
        .toThrow('UserId is too long (max 100 characters)');
    });

    it('境界値：100文字ちょうどは許可される', () => {
      const exactId = 'a'.repeat(100);
      expect(() => UserId.create(exactId)).not.toThrow();
      const result = UserId.create(exactId);
      expect(result.value).toBe(exactId);
    });

    it('Azure禁止文字: フォワードスラッシュを含む場合エラーを投げる', () => {
      expect(() => UserId.create('user/id'))
        .toThrow('UserId contains invalid characters for Azure Table Storage');
    });

    it('Azure禁止文字: バックスラッシュを含む場合エラーを投げる', () => {
      expect(() => UserId.create('user\\id'))
        .toThrow('UserId contains invalid characters for Azure Table Storage');
    });

    it('Azure禁止文字: ナンバーサインを含む場合エラーを投げる', () => {
      expect(() => UserId.create('user#id'))
        .toThrow('UserId contains invalid characters for Azure Table Storage');
    });

    it('Azure禁止文字: クエスチョンマークを含む場合エラーを投げる', () => {
      expect(() => UserId.create('user?id'))
        .toThrow('UserId contains invalid characters for Azure Table Storage');
    });

    it('制御文字: タブ文字を含む場合エラーを投げる', () => {
      expect(() => UserId.create('user\tid'))
        .toThrow('UserId contains invalid control characters');
    });

    it('制御文字: 改行文字を含む場合エラーを投げる', () => {
      expect(() => UserId.create('user\nid'))
        .toThrow('UserId contains invalid control characters');
    });

    it('制御文字: キャリッジリターンを含む場合エラーを投げる', () => {
      expect(() => UserId.create('user\rid'))
        .toThrow('UserId contains invalid control characters');
    });

    it('制御文字: NULL文字を含む場合エラーを投げる', () => {
      expect(() => UserId.create('user\u0000id'))
        .toThrow('UserId contains invalid control characters');
    });

    it('制御文字: DEL文字を含む場合エラーを投げる', () => {
      expect(() => UserId.create('user\u007Fid'))
        .toThrow('UserId contains invalid control characters');
    });

    it('有効な特殊文字: ハイフンとアンダースコアは許可される', () => {
      expect(() => UserId.create('user-id_123')).not.toThrow();
      const result = UserId.create('user-id_123');
      expect(result.value).toBe('user-id_123');
    });

    it('有効な特殊文字: ドットは許可される', () => {
      expect(() => UserId.create('user.id@provider')).not.toThrow();
      const result = UserId.create('user.id@provider');
      expect(result.value).toBe('user.id@provider');
    });
  });

  describe('比較メソッド', () => {
    it('同じIDで等価性を判定する', () => {
      const id1 = UserId.create('test-user-id');
      const id2 = UserId.create('test-user-id');
      expect(id1.equals(id2)).toBe(true);
    });

    it('異なるIDで非等価性を判定する', () => {
      const id1 = UserId.create('test-user-id-1');
      const id2 = UserId.create('test-user-id-2');
      expect(id1.equals(id2)).toBe(false);
    });

    it('null/undefinedとの等価性チェック', () => {
      const id = UserId.create('test-user-id');
      expect(id.equals(null as any)).toBe(false);
      expect(id.equals(undefined as any)).toBe(false);
    });

    it('異なる型との等価性チェック', () => {
      const id = UserId.create('test-user-id');
      expect(id.equals('test-user-id' as any)).toBe(false);
      expect(id.equals({ value: 'test-user-id' } as any)).toBe(false);
    });

    it('同じインスタンスでの等価性チェック', () => {
      const id = UserId.create('test-user-id');
      expect(id.equals(id)).toBe(true);
    });
  });

  describe('表現メソッド', () => {
    it('toString()で文字列表現を返す', () => {
      const id = UserId.create('test-user-id');
      expect(id.toString()).toBe('test-user-id');
    });

    it('toPartitionKey()でpartitionKey用の値を返す', () => {
      const id = UserId.create('test-user-id');
      expect(id.toPartitionKey()).toBe('test-user-id');
    });

    it('toString()とtoPartitionKey()は同じ値を返す', () => {
      const id = UserId.create('test-user-id');
      expect(id.toString()).toBe(id.toPartitionKey());
    });

    it('valueプロパティで直接アクセス可能', () => {
      const id = UserId.create('test-user-id');
      expect(id.value).toBe('test-user-id');
    });
  });

  describe('不変性テスト', () => {
    it('オブジェクトが不変であることを確認', () => {
      const id = UserId.create('test-user-id');
      
      // Object.freeze()により変更不可
      expect(() => {
        (id as any).value = 'modified-id';
      }).toThrow();
      
      // 値が変更されていないことを確認
      expect(id.value).toBe('test-user-id');
    });

    it('新しいインスタンスが独立していることを確認', () => {
      const id1 = UserId.create('test-user-id-1');
      const id2 = UserId.create('test-user-id-2');
      
      expect(id1.value).toBe('test-user-id-1');
      expect(id2.value).toBe('test-user-id-2');
      expect(id1.equals(id2)).toBe(false);
    });
  });

  describe('実際のユースケーステスト', () => {
    it('Azure Static Web Apps形式のuserIdを処理する', () => {
      // Azure SWAでよく使われる形式
      const azureId = 'sid:f47ac10b58cc4372a5670e02b2c3d479';
      expect(() => UserId.create(azureId)).not.toThrow();
      const result = UserId.create(azureId);
      expect(result.value).toBe(azureId);
    });

    it('Google OAuth userIdを処理する', () => {
      // Google OAuth形式
      const googleId = '116807483320175043966';
      expect(() => UserId.create(googleId)).not.toThrow();
      const result = UserId.create(googleId);
      expect(result.value).toBe(googleId);
    });

    it('Microsoft OAuth userIdを処理する', () => {
      // Microsoft OAuth形式
      const msId = 'f8cdef31c10c4c69ac2b-b9b8c1c6eb33';
      expect(() => UserId.create(msId)).not.toThrow();
      const result = UserId.create(msId);
      expect(result.value).toBe(msId);
    });

    it('ローカル開発用テストuserIdを処理する', () => {
      const testId = 'test-user-local';
      expect(() => UserId.create(testId)).not.toThrow();
      const result = UserId.create(testId);
      expect(result.value).toBe(testId);
    });
  });
});
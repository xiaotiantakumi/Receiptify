// api/src/tests/domain/value-objects/ReceiptDate.spec.ts
import { ReceiptDate } from '../../../domain/value-objects/ReceiptDate';
import { dayjs } from '../../../lib/dayjs-config';

describe('ReceiptDate', () => {
  describe('create', () => {
    it('有効なYYYY-MM-DD文字列からReceiptDateを作成する', () => {
      const result = ReceiptDate.create('2024-01-15');
      expect(result.value).toBe('2024-01-15');
    });

    it('有効なDateオブジェクトからReceiptDateを作成する', () => {
      const date = new Date('2024-01-15T10:30:00Z');
      const result = ReceiptDate.create(date);
      expect(result.value).toBe('2024-01-15');
    });

    it('ISO形式文字列から日付部分を抽出してReceiptDateを作成する', () => {
      const result = ReceiptDate.create('2024-01-15T14:30:00.000Z');
      expect(result.value).toBe('2024-01-15');
    });

    it('無効な日付文字列の場合エラーを投げる', () => {
      expect(() => ReceiptDate.create('2024-02-30'))
        .toThrow('Invalid date provided');
    });

    it('不正なフォーマットの場合エラーを投げる', () => {
      expect(() => ReceiptDate.create('2024/01/15'))
        .toThrow('Date string must be in YYYY-MM-DD format');
    });

    it('未来の日付の場合エラーを投げる', () => {
      const futureDate = dayjs().utc().add(9, 'hours').add(1, 'day').format('YYYY-MM-DD');
      expect(() => ReceiptDate.create(futureDate))
        .toThrow('Receipt date cannot be in the future');
    });

    it('7年を超えて古い日付の場合エラーを投げる', () => {
      const oldDate = dayjs().subtract(8, 'year').format('YYYY-MM-DD');
      expect(() => ReceiptDate.create(oldDate))
        .toThrow('Receipt date cannot be older than 7 years');
    });

    it('境界値：今日の日付は許可される', () => {
      const today = dayjs().utc().add(9, 'hours').format('YYYY-MM-DD'); // JST
      expect(() => ReceiptDate.create(today)).not.toThrow();
    });

    it('境界値：ちょうど7年前の日付は許可される', () => {
      const sevenYearsAgo = dayjs().utc().add(9, 'hours').subtract(7, 'year').add(1, 'day').format('YYYY-MM-DD');
      expect(() => ReceiptDate.create(sevenYearsAgo)).not.toThrow();
    });

    it('無効なDateオブジェクトの場合エラーを投げる', () => {
      const invalidDate = new Date('invalid');
      expect(() => ReceiptDate.create(invalidDate))
        .toThrow('Invalid Date object provided');
    });

    it('nullやundefinedの場合エラーを投げる', () => {
      expect(() => ReceiptDate.create(null as any))
        .toThrow('Input must be a Date object or YYYY-MM-DD string');
      expect(() => ReceiptDate.create(undefined as any))
        .toThrow('Input must be a Date object or YYYY-MM-DD string');
    });
  });

  describe('比較メソッド', () => {
    it('同じ日付で等価性を判定する', () => {
      const date1 = ReceiptDate.create('2024-01-15');
      const date2 = ReceiptDate.create('2024-01-15');
      expect(date1.equals(date2)).toBe(true);
    });

    it('異なる日付で非等価性を判定する', () => {
      const date1 = ReceiptDate.create('2024-01-15');
      const date2 = ReceiptDate.create('2024-01-16');
      expect(date1.equals(date2)).toBe(false);
    });

    it('nullやundefinedとの等価性チェック', () => {
      const date = ReceiptDate.create('2024-01-15');
      expect(date.equals(null as any)).toBe(false);
      expect(date.equals(undefined as any)).toBe(false);
    });

    it('Day.jsのisBefore/isAfterを使用した日付比較', () => {
      const earlier = ReceiptDate.create('2024-01-14');
      const later = ReceiptDate.create('2024-01-15');
      
      expect(earlier.isBefore(later)).toBe(true);
      expect(later.isAfter(earlier)).toBe(true);
      expect(earlier.isAfter(later)).toBe(false);
      expect(later.isBefore(earlier)).toBe(false);
    });

    it('同じ日付での比較', () => {
      const date1 = ReceiptDate.create('2024-01-15');
      const date2 = ReceiptDate.create('2024-01-15');
      
      expect(date1.isBefore(date2)).toBe(false);
      expect(date1.isAfter(date2)).toBe(false);
    });
  });

  describe('フォーマット機能', () => {
    it('Azure Table Storage用のISO形式で出力する', () => {
      const date = ReceiptDate.create('2024-01-15');
      const result = date.toISOStringForPersistence();
      expect(result).toBe('2024-01-15T00:00:00.000Z');
    });

    it('日本語表示形式で出力する（ゼロ埋めなし）', () => {
      const date1 = ReceiptDate.create('2024-01-15');
      expect(date1.formatForDisplay()).toBe('2024年1月15日');

      const date2 = ReceiptDate.create('2024-10-05');
      expect(date2.formatForDisplay()).toBe('2024年10月5日');
    });

    it('カスタムフォーマットで出力する', () => {
      const date = ReceiptDate.create('2024-01-15');
      expect(date.format('MM/DD/YYYY')).toBe('01/15/2024');
      expect(date.format('YYYY年MM月DD日')).toBe('2024年01月15日');
      expect(date.format('YYYY-MM-DD')).toBe('2024-01-15');
    });
  });

  describe('ネイティブDate変換', () => {
    it('ネイティブDateオブジェクトとして正しく変換する', () => {
      const date = ReceiptDate.create('2024-01-15');
      const nativeDate = date.asNativeDate();
      
      expect(nativeDate).toBeInstanceOf(Date);
      expect(nativeDate.toISOString()).toBe('2024-01-15T00:00:00.000Z');
    });

    it('UTCの真夜中として変換される', () => {
      const date = ReceiptDate.create('2024-01-15');
      const nativeDate = date.asNativeDate();
      
      expect(nativeDate.getUTCHours()).toBe(0);
      expect(nativeDate.getUTCMinutes()).toBe(0);
      expect(nativeDate.getUTCSeconds()).toBe(0);
      expect(nativeDate.getUTCMilliseconds()).toBe(0);
    });
  });

  describe('不変性テスト', () => {
    it('オブジェクトが不変であることを確認', () => {
      const date = ReceiptDate.create('2024-01-15');
      
      // Object.freeze()により変更不可
      expect(() => {
        (date as any).value = '2024-01-16';
      }).toThrow();
      
      // 値が変更されていないことを確認
      expect(date.value).toBe('2024-01-15');
    });

    it('新しいインスタンスが独立していることを確認', () => {
      const date1 = ReceiptDate.create('2024-01-15');
      const date2 = ReceiptDate.create('2024-01-16');
      
      expect(date1.value).toBe('2024-01-15');
      expect(date2.value).toBe('2024-01-16');
      expect(date1.equals(date2)).toBe(false);
    });
  });

  describe('Day.js統合テスト', () => {
    it('Day.jsプラグインが正しく動作することを確認', () => {
      // UTC プラグインのテスト
      const utcNow = dayjs.utc();
      expect(utcNow.format()).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
      
      // customParseFormat プラグインのテスト
      const parsed = dayjs('2024-01-15', 'YYYY-MM-DD', true);
      expect(parsed.isValid()).toBe(true);
      expect(parsed.format('YYYY-MM-DD')).toBe('2024-01-15');
    });

    it('厳密パースが無効な日付を正しく検出する', () => {
      // 厳密パース（第3引数true）でのテスト
      const invalidParsed = dayjs('2024-02-30', 'YYYY-MM-DD', true);
      expect(invalidParsed.isValid()).toBe(false);
      
      const validParsed = dayjs('2024-02-29', 'YYYY-MM-DD', true); // うるう年
      expect(validParsed.isValid()).toBe(true);
    });

    it('日本時間の計算が正しく動作する', () => {
      const utcNow = dayjs.utc();
      const japanNow = utcNow.add(9, 'hours');
      
      // 日本時間がUTCより9時間進んでいることを確認（日付境界の場合は24で調整）
      const hourDiff = japanNow.hour() - utcNow.hour();
      const expectedDiff = hourDiff < 0 ? hourDiff + 24 : hourDiff;
      expect(expectedDiff).toBe(9);
    });
  });

  describe('エッジケース', () => {
    it('うるう年の2月29日を正しく処理する', () => {
      expect(() => ReceiptDate.create('2024-02-29')).not.toThrow(); // 2024はうるう年
      expect(() => ReceiptDate.create('2023-02-29')).toThrow(); // 2023は平年
    });

    it('月末日の境界値を正しく処理する', () => {
      expect(() => ReceiptDate.create('2024-01-31')).not.toThrow();
      expect(() => ReceiptDate.create('2024-04-30')).not.toThrow();
      expect(() => ReceiptDate.create('2024-04-31')).toThrow(); // 4月は30日まで
    });

    it('年の境界値を正しく処理する', () => {
      // 日本時間で今日の年を取得
      const thisYear = dayjs().utc().add(9, 'hours').year();
      expect(() => ReceiptDate.create(`${thisYear}-01-01`)).not.toThrow();
      
      // 今年の12/31が未来でない場合のみテスト
      const endOfYear = `${thisYear}-12-31`;
      const today = dayjs().utc().add(9, 'hours').format('YYYY-MM-DD');
      if (endOfYear <= today) {
        expect(() => ReceiptDate.create(endOfYear)).not.toThrow();
      }
    });

    it('タイムゾーンの影響を受けないことを確認', () => {
      // 異なるタイムゾーンのDateオブジェクトでも同じ結果になることを確認
      const utcDate = new Date('2024-01-15T00:00:00Z');
      const jstDate = new Date('2024-01-15T09:00:00+09:00');
      
      const receiptDate1 = ReceiptDate.create(utcDate);
      const receiptDate2 = ReceiptDate.create(jstDate);
      
      expect(receiptDate1.equals(receiptDate2)).toBe(true);
    });
  });
});
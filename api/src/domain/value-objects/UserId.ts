// api/src/domain/value-objects/UserId.ts

export class UserId {
  // ユーザーIDを文字列として保存
  public readonly value: string;

  private constructor(id: string) {
    this.value = id;
    Object.freeze(this);
  }

  /**
   * UserIdを作成する
   * @param id 認証プロバイダーからの生のID文字列
   * @returns UserId インスタンス
   * @throws Error バリデーションエラーの場合
   */
  public static create(id: unknown): UserId {
    // 基本検証
    if (typeof id !== 'string' || id.trim().length === 0) {
      throw new Error('UserId cannot be empty');
    }

    const trimmedId = id.trim();

    // 長さ制限（Azure制約: 最大1024文字、実用的には100文字制限を維持）
    if (trimmedId.length > 100) {
      throw new Error('UserId is too long (max 100 characters)');
    }

    // Azure Table Storage PartitionKey文字制限
    // 禁止文字: / \ # ?
    const invalidCharRegex = /[\/\\#?]/;
    if (invalidCharRegex.test(trimmedId)) {
      throw new Error(`UserId contains invalid characters for Azure Table Storage: ${trimmedId}`);
    }
    
    // 制御文字チェック（U+0000-U+001F, U+007F-U+009F）
    const controlCharRegex = /[\u0000-\u001F\u007F-\u009F]/;
    if (controlCharRegex.test(trimmedId)) {
      throw new Error(`UserId contains invalid control characters`);
    }

    return new UserId(trimmedId);
  }

  /**
   * 他のUserIdとの等価比較
   */
  public equals(other?: UserId): boolean {
    if (!other || !(other instanceof UserId)) {
      return false;
    }
    return this.value === other.value;
  }

  /**
   * 文字列表現を返す（Azure SDK等での使用）
   */
  public toString(): string {
    return this.value;
  }

  /**
   * Azure Table Storage用のpartitionKey値を返す
   */
  public toPartitionKey(): string {
    return this.value;
  }
}
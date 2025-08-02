import { BlobServiceClient, generateBlobSASQueryParameters, BlobSASPermissions, StorageSharedKeyCredential } from '@azure/storage-blob';

// Azure Storage接続文字列から情報を抽出
function parseConnectionString(connectionString: string) {
  const parts = connectionString.split(';');
  const accountName = parts.find(part => part.startsWith('AccountName='))?.split('=')[1];
  const accountKey = parts.find(part => part.startsWith('AccountKey='))?.split('=')[1];
  
  if (!accountName || !accountKey) {
    throw new Error('Invalid connection string');
  }
  
  return { accountName, accountKey };
}

export function getBlobServiceClient(): BlobServiceClient {
  const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
  if (!connectionString) {
    throw new Error('AZURE_STORAGE_CONNECTION_STRING is not set');
  }
  
  return BlobServiceClient.fromConnectionString(connectionString);
}

export async function generateSASToken(containerName: string, blobName: string): Promise<string> {
  const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
  if (!connectionString) {
    throw new Error('AZURE_STORAGE_CONNECTION_STRING is not set');
  }
  
  const { accountName, accountKey } = parseConnectionString(connectionString);
  const sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey);
  
  const permissions = new BlobSASPermissions();
  permissions.read = true;
  permissions.write = true;
  permissions.create = true;
  
  const startsOn = new Date();
  const expiresOn = new Date(startsOn);
  expiresOn.setHours(expiresOn.getHours() + 1); // 1時間の有効期限
  
  const sasToken = generateBlobSASQueryParameters({
    containerName,
    blobName,
    permissions,
    startsOn,
    expiresOn,
  }, sharedKeyCredential).toString();
  
  return sasToken;
}

export function getUserContainerName(userId: string): string {
  // ユーザーIDをハッシュ化してコンテナ名として使用（セキュリティ向上）
  const crypto = require('crypto');
  const hash = crypto.createHash('sha256').update(userId).digest('hex');
  return `user-${hash.substring(0, 16)}`;
}
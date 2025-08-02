import { TableClient, TableEntity } from '@azure/data-tables';

export interface ReceiptResult extends TableEntity {
  partitionKey: string; // ユーザーID
  rowKey: string; // レシートID（UUID）
  receiptImageUrl: string;
  status: 'processing' | 'completed' | 'failed';
  items?: string; // JSON文字列として保存
  totalAmount?: number;
  receiptDate?: string;
  accountSuggestions?: string; // JSON文字列として保存
  taxNotes?: string; // JSON文字列として保存
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReceiptItem {
  name: string;
  price: number;
  category?: string;
  accountSuggestion?: string;
  taxNote?: string;
}

export function getTableClient(): TableClient {
  const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
  const tableName = process.env.RESULTS_TABLE_NAME || 'receiptresults';
  
  if (!connectionString) {
    throw new Error('AZURE_STORAGE_CONNECTION_STRING is not set');
  }
  
  return TableClient.fromConnectionString(connectionString, tableName);
}

export async function saveReceiptResult(
  userId: string,
  receiptId: string,
  data: Partial<ReceiptResult>
): Promise<void> {
  const tableClient = getTableClient();
  
  const entity: ReceiptResult = {
    partitionKey: userId,
    rowKey: receiptId,
    receiptImageUrl: data.receiptImageUrl || '',
    status: data.status || 'processing',
    items: data.items,
    totalAmount: data.totalAmount,
    receiptDate: data.receiptDate,
    accountSuggestions: data.accountSuggestions,
    taxNotes: data.taxNotes,
    errorMessage: data.errorMessage,
    createdAt: data.createdAt || new Date(),
    updatedAt: new Date(),
  };
  
  await tableClient.upsertEntity(entity);
}

export async function getReceiptResults(userId: string): Promise<ReceiptResult[]> {
  const tableClient = getTableClient();
  
  const entities = tableClient.listEntities<ReceiptResult>({
    queryOptions: {
      filter: `PartitionKey eq '${userId}'`
    }
  });
  
  const results: ReceiptResult[] = [];
  for await (const entity of entities) {
    results.push(entity);
  }
  
  return results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export async function getReceiptResult(userId: string, receiptId: string): Promise<ReceiptResult | null> {
  const tableClient = getTableClient();
  
  try {
    const entity = await tableClient.getEntity<ReceiptResult>(userId, receiptId);
    return entity;
  } catch (error: any) {
    if (error.statusCode === 404) {
      return null;
    }
    throw error;
  }
}
import { TableClient } from '@azure/data-tables';
import { 
  ReceiptResult, 
  ReceiptItem, 
  ReceiptResultSchema,
  ReceiptResultUpdateSchema,
  getValidatedTableConfig,
  serializeReceiptResult,
  parseAndValidateItems
} from '../schemas/table-storage';
import { ValidationError } from '../schemas/validation';

export type { ReceiptResult, ReceiptItem } from '../schemas/table-storage';

export function getTableClient(): TableClient {
  const config = getValidatedTableConfig();
  const options = config.connectionString.includes('127.0.0.1') || config.connectionString.includes('localhost')
    ? { allowInsecureConnection: true }
    : {};
  
  return TableClient.fromConnectionString(config.connectionString, config.tableName, options);
}

export async function saveReceiptResult(
  userId: string,
  receiptId: string,
  data: Partial<ReceiptResult>
): Promise<void> {
  const tableClient = getTableClient();
  
  // 入力データのバリデーション
  const updateData = {
    partitionKey: userId,
    rowKey: receiptId,
    ...data,
    updatedAt: new Date()
  };
  
  const validationResult = ReceiptResultUpdateSchema.safeParse(updateData);
  if (!validationResult.success) {
    throw new ValidationError(validationResult.error.issues);
  }
  
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
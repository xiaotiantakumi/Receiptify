// api/src/domain/index.ts

// Value Objects
export { UserId } from './value-objects/UserId';
export { ReceiptDate } from './value-objects/ReceiptDate';
export { Money } from './value-objects/Money';

// Entities
export { Receipt } from './entities/Receipt';
export type { ReceiptItem, ReceiptStatus, ReceiptProps } from './entities/Receipt';
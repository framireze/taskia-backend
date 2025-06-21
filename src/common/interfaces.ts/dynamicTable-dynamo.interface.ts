export interface DynamicTableDynamoInterface {
  PK: string;
  SK: string;
  type: string;
  table: string;
  columns?: object[];
  recordId?: string;
  record?: object;
  created_at: string;
  updated_at: string;
}
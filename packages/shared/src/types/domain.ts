export type Role = 'admin' | 'manager' | 'operator' | 'vendor';

export interface AuditFields {
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  createdBy: string;
  updatedBy: string;
}

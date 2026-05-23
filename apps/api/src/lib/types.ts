export type UserRole = 'admin' | 'manager' | 'operator' | 'vendor';

export interface AuthContext {
  userId: string;
  orgId: string | null;
  role: UserRole;
}

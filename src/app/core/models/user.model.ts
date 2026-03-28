export type UserRole = 'admin' | 'member';
export type UserStatus = 'active' | 'disabled';

export interface User {
  id: string;
  organization_id: string;
  email: string;
  display_name: string;
  role: UserRole;
  status: UserStatus;
  last_login_at: string | null;
  created_at: string;
}

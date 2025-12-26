export type Role = 'ADMIN' | 'SALES' | 'TECH' | 'CUSTOMER';

export interface User {
  id: string;
  email: string;
  full_name: string;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  district?: string | null;
  ward?: string | null;
  role: Role;
  created_at: string | Date;
  updated_at: string | Date;
}

export interface User {
  userId: string;
  email: string;
  role: 'admin' | 'user';
  name?: string;
}

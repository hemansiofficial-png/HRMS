export type AppRole = 'ADMIN' | 'HR_MANAGER' | 'EMPLOYEE';

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

import { lazy } from 'react';

// Role-based panel components mapping
export const rolePanels = {
  admin: lazy(() => import('@/components/dashboard/AdminPanel')),
  judge: lazy(() => import('@/components/dashboard/JudgePanel')),
  attorney: lazy(() => import('@/components/dashboard/AttorneyPanel')),
  clerk: lazy(() => import('@/components/dashboard/ClerkPanel')),
  public: lazy(() => import('@/components/dashboard/PublicPanel'))
} as const;

export type UserRole = keyof typeof rolePanels;
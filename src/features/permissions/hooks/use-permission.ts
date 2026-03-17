import { useMemo } from 'react';
import type { BoardRole, Permission } from '../types';
import { ROLE_PERMISSIONS } from '../constants';

export function usePermission(role: BoardRole | null | undefined) {
  return useMemo(() => {
    const can = (permission: Permission): boolean => {
      if (!role) return false;
      return ROLE_PERMISSIONS[role].has(permission);
    };

    const canAny = (...permissions: Permission[]): boolean => {
      return permissions.some(can);
    };

    const canAll = (...permissions: Permission[]): boolean => {
      return permissions.every(can);
    };

    return { can, canAny, canAll, role };
  }, [role]);
}

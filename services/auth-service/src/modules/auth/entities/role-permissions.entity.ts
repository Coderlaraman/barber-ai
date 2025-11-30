import { UserRole } from './user.entity'
import { Permission } from './permission.entity'

const CLIENT_PERMISSIONS: Permission[] = [
  Permission.APPOINTMENTS_READ,
  Permission.APPOINTMENTS_CREATE,
  Permission.APPOINTMENTS_CANCEL,
  Permission.AVAILABILITY_READ,
  Permission.BARBERS_READ,
  Permission.PORTFOLIO_READ
]

const BARBER_PERMISSIONS: Permission[] = [
  // All client permissions
  ...CLIENT_PERMISSIONS,
  // Plus barber-specific permissions
  Permission.APPOINTMENTS_UPDATE,
  Permission.APPOINTMENTS_CONFIRM,
  Permission.APPOINTMENTS_COMPLETE,
  Permission.AVAILABILITY_CREATE,
  Permission.AVAILABILITY_UPDATE,
  Permission.AVAILABILITY_DELETE,
  Permission.PORTFOLIO_CREATE,
  Permission.PORTFOLIO_UPDATE,
  Permission.PORTFOLIO_DELETE,
  Permission.ANALYTICS_READ,
  Permission.REPORTS_READ
]

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.CLIENT]: CLIENT_PERMISSIONS,
  [UserRole.BARBER]: BARBER_PERMISSIONS,
  [UserRole.ADMIN]: Object.values(Permission)
}

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) || false
}

export function getRolePermissions(role: UserRole): Permission[] {
  return ROLE_PERMISSIONS[role] || []
}
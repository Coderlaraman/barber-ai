import { SetMetadata } from '@nestjs/common'
import { UserRole } from '../entities/user.entity'
import { Permission } from '../entities/permission.entity'

export const ROLES_KEY = 'roles'
export const PERMISSIONS_KEY = 'permissions'
export const OWNER_PARAM_KEY = 'ownerParam'

export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles)
export const Permissions = (...permissions: Permission[]) => SetMetadata(PERMISSIONS_KEY, permissions)
export const OwnerParam = (param: string) => SetMetadata(OWNER_PARAM_KEY, param)
import { UserRole } from '../entities/user.entity'
import { Permission } from '../entities/permission.entity'

export interface JwtPayload {
  sub: string // user ID
  email: string
  role: UserRole
  permissions: Permission[]
  iat?: number
  exp?: number
}
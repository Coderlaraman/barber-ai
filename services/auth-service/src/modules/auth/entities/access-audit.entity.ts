import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm'
import { UserRole } from './user.entity'

export enum AuditAction {
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  REGISTER = 'REGISTER',
  TOKEN_REFRESH = 'TOKEN_REFRESH',
  PASSWORD_RESET = 'PASSWORD_RESET',
  PROFILE_UPDATE = 'PROFILE_UPDATE',
  ROLE_CHANGE = 'ROLE_CHANGE',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',
  SOCIAL_LOGIN = 'SOCIAL_LOGIN'
}

export enum AuditStatus {
  SUCCESS = 'SUCCESS',
  FAILURE = 'FAILURE',
  PENDING = 'PENDING'
}

@Entity('access_audit')
@Index(['userId', 'createdAt'])
@Index(['action', 'createdAt'])
@Index(['ipAddress', 'createdAt'])
export class AccessAudit {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column()
  userId!: string

  @Column({ nullable: true })
  email?: string

  @Column({ type: 'enum', enum: UserRole, nullable: true })
  role?: UserRole

  @Column({ type: 'enum', enum: AuditAction })
  action!: AuditAction

  @Column({ type: 'enum', enum: AuditStatus })
  status!: AuditStatus

  @Column({ type: 'text', nullable: true })
  details?: string

  @Column({ nullable: true })
  ipAddress?: string

  @Column({ nullable: true })
  userAgent?: string

  @Column({ nullable: true })
  deviceInfo?: string

  @Column({ nullable: true })
  location?: string

  @Column({ nullable: true })
  failureReason?: string

  @CreateDateColumn()
  createdAt!: Date
}
import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, In } from 'typeorm'
import { AccessAudit, AuditAction, AuditStatus } from '../entities/access-audit.entity'
import { User } from '../entities/user.entity'

export interface AuditLogData {
  user?: User
  action: AuditAction
  status: AuditStatus
  details?: string
  ipAddress?: string
  userAgent?: string
  deviceInfo?: string
  location?: string
  failureReason?: string
}

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AccessAudit)
    private readonly auditRepository: Repository<AccessAudit>
  ) {}

  async logAccess(data: AuditLogData): Promise<AccessAudit> {
    const audit = this.auditRepository.create({
      userId: data.user?.id || 'anonymous',
      email: data.user?.email,
      role: data.user?.role,
      action: data.action,
      status: data.status,
      details: data.details,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      deviceInfo: data.deviceInfo,
      location: data.location,
      failureReason: data.failureReason
    })

    return this.auditRepository.save(audit)
  }

  async getUserAccessHistory(userId: string, limit: number = 50): Promise<AccessAudit[]> {
    return this.auditRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit
    })
  }

  async getFailedLoginAttempts(email: string, timeWindow: Date = new Date(Date.now() - 24 * 60 * 60 * 1000)): Promise<number> {
    return this.auditRepository.count({
      where: {
        email,
        action: AuditAction.LOGIN,
        status: AuditStatus.FAILURE,
        createdAt: timeWindow
      }
    })
  }

  async getSuspiciousActivity(ipAddress: string, timeWindow: Date = new Date(Date.now() - 1 * 60 * 60 * 1000)): Promise<AccessAudit[]> {
    return this.auditRepository.find({
      where: {
        ipAddress,
        status: AuditStatus.FAILURE,
        createdAt: timeWindow
      },
      order: { createdAt: 'DESC' }
    })
  }

  async queryAudits(filters: {
    userId?: string
    action?: AuditAction
    status?: AuditStatus
    startDate?: Date
    endDate?: Date
  }): Promise<AccessAudit[]> {
    const query = this.auditRepository.createQueryBuilder('audit')
    
    if (filters.userId) {
      query.andWhere('audit.userId = :userId', { userId: filters.userId })
    }
    
    if (filters.action) {
      query.andWhere('audit.action = :action', { action: filters.action })
    }
    
    if (filters.status) {
      query.andWhere('audit.status = :status', { status: filters.status })
    }
    
    if (filters.startDate) {
      query.andWhere('audit.createdAt >= :startDate', { startDate: filters.startDate })
    }
    
    if (filters.endDate) {
      query.andWhere('audit.createdAt <= :endDate', { endDate: filters.endDate })
    }
    
    query.orderBy('audit.createdAt', 'DESC')
    
    return query.getMany()
  }

  async getSecurityReport(userId: string, days: number = 30): Promise<{
    totalLogins: number
    failedLogins: number
    lastLogin: Date | null
    suspiciousActivities: number
    accountChanges: number
  }> {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    
    const [totalLogins, failedLogins, lastLogin, suspiciousActivities, accountChanges] = await Promise.all([
      this.auditRepository.count({
        where: { userId, action: AuditAction.LOGIN, status: AuditStatus.SUCCESS, createdAt: startDate }
      }),
      this.auditRepository.count({
        where: { userId, action: AuditAction.LOGIN, status: AuditStatus.FAILURE, createdAt: startDate }
      }),
      this.auditRepository.findOne({
        where: { userId, action: AuditAction.LOGIN, status: AuditStatus.SUCCESS },
        order: { createdAt: 'DESC' }
      }).then(audit => audit?.createdAt || null),
      this.auditRepository.count({
        where: { userId, action: AuditAction.PERMISSION_DENIED, createdAt: startDate }
      }),
      this.auditRepository.count({
        where: { userId, action: In([AuditAction.PROFILE_UPDATE, AuditAction.ROLE_CHANGE, AuditAction.PASSWORD_RESET]), createdAt: startDate }
      })
    ])

    return {
      totalLogins,
      failedLogins,
      lastLogin,
      suspiciousActivities,
      accountChanges
    }
  }
}
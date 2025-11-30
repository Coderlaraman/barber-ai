import { describe, it, expect } from '@jest/globals'
import { Test } from '@nestjs/testing'
import { JwtModule } from '@nestjs/jwt'
import { getRepositoryToken } from '@nestjs/typeorm'
import { AuthService } from '../src/modules/auth/auth.service'
import { AuditService } from '../src/modules/auth/services/audit.service'
import { SocialAuthService } from '../src/modules/auth/services/social-auth.service'
import { TokenBlacklistService } from '../src/modules/auth/services/token-blacklist.service'
import { GoogleAuthService } from '../src/modules/auth/services/google-auth.service'
import { User, UserRole } from '../src/modules/auth/entities/user.entity'
import { AccessAudit } from '../src/modules/auth/entities/access-audit.entity'
import { TokenBlacklist } from '../src/modules/auth/services/token-blacklist.service'

describe('AuthService', () => {
  it('registers a user and returns tokens', async () => {
    const store: User[] = []
    const repoMock = {
      findOne: async (opts: { where: { email?: string; id?: string } }) => {
        const { email, id } = opts.where
        return store.find((u) => (email ? u.email === email : true) && (id ? u.id === id : true)) || null
      },
      create: (data: Partial<User>) => ({ ...data } as User),
      save: async (user: User) => {
        if (!user.id) user.id = Math.random().toString(36).slice(2)
        const existingIdx = store.findIndex((u) => u.id === user.id)
        if (existingIdx >= 0) store[existingIdx] = user
        else store.push(user)
        return user
      }
    }

    const auditStore: AccessAudit[] = []
    const auditRepoMock = {
      create: (data: Partial<AccessAudit>) => ({ ...data } as AccessAudit),
      save: async (audit: AccessAudit) => {
        if (!audit.id) audit.id = Math.random().toString(36).slice(2)
        auditStore.push(audit)
        return audit
      }
    }

    const blacklistStore: TokenBlacklist[] = []
    const blacklistRepoMock = {
      create: (data: Partial<TokenBlacklist>) => ({ ...data } as TokenBlacklist),
      save: async (blacklist: TokenBlacklist) => {
        if (!blacklist.id) blacklist.id = Math.random().toString(36).slice(2)
        blacklistStore.push(blacklist)
        return blacklist
      },
      findOne: async (opts: { where: { token?: string } }) => {
        const { token } = opts.where
        return blacklistStore.find((b) => b.token === token) || null
      }
    }

    const moduleRef = await Test.createTestingModule({
      imports: [JwtModule.register({ secret: 'test', signOptions: { expiresIn: '1h' } })],
      providers: [
        AuthService,
        AuditService,
        SocialAuthService,
        TokenBlacklistService,
        GoogleAuthService,
        { provide: getRepositoryToken(User), useValue: repoMock },
        { provide: getRepositoryToken(AccessAudit), useValue: auditRepoMock },
        { provide: getRepositoryToken(TokenBlacklist), useValue: blacklistRepoMock }
      ]
    }).compile()

    const svc = moduleRef.get(AuthService)
    const res = await svc.register('unit@example.com', 'password123', UserRole.BARBER)
    expect(res.user.email).toBe('unit@example.com')
    expect(res.accessToken).toBeDefined()
    expect(res.refreshToken).toBeDefined()
  })
})
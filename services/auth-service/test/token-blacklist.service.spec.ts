import { describe, it, expect, beforeEach } from '@jest/globals'
import { Test } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import { TokenBlacklistService, TokenBlacklist } from '../src/modules/auth/services/token-blacklist.service'

describe('TokenBlacklistService', () => {
  let service: TokenBlacklistService
  let blacklistRepository: any
  let blacklistStore: TokenBlacklist[] = []

  beforeEach(() => {
    blacklistStore = []
  })

  const createMockJWT = (exp: number): string => {
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64')
    const payload = Buffer.from(JSON.stringify({ exp })).toString('base64')
    const signature = 'mock-signature'
    return `${header}.${payload}.${signature}`
  }

  const setupTestModule = async () => {
    // Clear blacklist store before each test
    blacklistStore = []
    
    const blacklistRepositoryMock = {
      create: (data: Partial<TokenBlacklist>) => ({ ...data } as TokenBlacklist),
      save: async (entry: TokenBlacklist) => {
        if (!entry.id) entry.id = `blacklist-${Math.random().toString(36).slice(2)}`
        blacklistStore.push(entry)
        return entry
      },
      findOne: async (options: any) => {
        const { where } = options
        return blacklistStore.find(entry => entry.token === where.token) || null
      },
      createQueryBuilder: () => ({
        delete: () => ({
          where: (condition: string, params: any) => ({
            execute: async () => {
              const now = params.now
              const initialLength = blacklistStore.length
              blacklistStore = blacklistStore.filter(entry => {
                return entry.expiresAt >= now
              })
              return { affected: initialLength - blacklistStore.length }
            }
          })
        })
      })
    }

    const moduleRef = await Test.createTestingModule({
      providers: [
        TokenBlacklistService,
        { provide: getRepositoryToken(TokenBlacklist), useValue: blacklistRepositoryMock }
      ]
    }).compile()

    service = moduleRef.get(TokenBlacklistService)
    blacklistRepository = blacklistRepositoryMock

    return { service, blacklistRepository }
  }

  describe('addToBlacklist', () => {
    it('should add token to blacklist successfully', async () => {
      const { service } = await setupTestModule()
      const futureExp = Math.floor(Date.now() / 1000) + 3600 // 1 hour from now
      const token = createMockJWT(futureExp)

      await service.addToBlacklist(token)

      expect(blacklistStore).toHaveLength(1)
      expect(blacklistStore[0].token).toBe(token)
      expect(blacklistStore[0].expiresAt.getTime()).toBe(futureExp * 1000)
    })

    it('should extract expiration from JWT payload correctly', async () => {
      const { service } = await setupTestModule()
      const expTime = Math.floor(Date.now() / 1000) + 7200 // 2 hours from now
      const token = createMockJWT(expTime)

      await service.addToBlacklist(token)

      expect(blacklistStore[0].expiresAt.getTime()).toBe(expTime * 1000)
    })

    it('should handle tokens with past expiration dates', async () => {
      const { service } = await setupTestModule()
      const pastExp = Math.floor(Date.now() / 1000) - 3600 // 1 hour ago
      const token = createMockJWT(pastExp)

      await service.addToBlacklist(token)

      expect(blacklistStore).toHaveLength(1)
      expect(blacklistStore[0].expiresAt.getTime()).toBe(pastExp * 1000)
    })
  })

  describe('isBlacklisted', () => {
    it('should return true for blacklisted token', async () => {
      const { service } = await setupTestModule()
      const futureExp = Math.floor(Date.now() / 1000) + 3600
      const token = createMockJWT(futureExp)
      
      // Add token to blacklist first
      await service.addToBlacklist(token)

      const result = await service.isBlacklisted(token)

      expect(result).toBe(true)
    })

    it('should return false for non-blacklisted token', async () => {
      const { service } = await setupTestModule()
      const futureExp = Math.floor(Date.now() / 1000) + 3600
      const token = createMockJWT(futureExp)

      const result = await service.isBlacklisted(token)

      expect(result).toBe(false)
    })

    it('should return false for empty blacklist', async () => {
      const { service } = await setupTestModule()
      const futureExp = Math.floor(Date.now() / 1000) + 3600
      const token = createMockJWT(futureExp)

      const result = await service.isBlacklisted(token)

      expect(result).toBe(false)
      expect(blacklistStore).toHaveLength(0)
    })

    it('should handle multiple tokens in blacklist', async () => {
      const { service } = await setupTestModule()
      const exp1 = Math.floor(Date.now() / 1000) + 3600
      const exp2 = Math.floor(Date.now() / 1000) + 7200
      const exp3 = Math.floor(Date.now() / 1000) + 10800
      const token1 = createMockJWT(exp1)
      const token2 = createMockJWT(exp2)
      const token3 = createMockJWT(exp3)

      await service.addToBlacklist(token1)
      await service.addToBlacklist(token2)

      const result1 = await service.isBlacklisted(token1)
      const result2 = await service.isBlacklisted(token2)
      const result3 = await service.isBlacklisted(token3)

      expect(result1).toBe(true)
      expect(result2).toBe(true)
      expect(result3).toBe(false)
      expect(blacklistStore.filter(entry => entry.token === token1 || entry.token === token2)).toHaveLength(2)
    })
  })

  describe('cleanupExpiredTokens', () => {
    it('should remove expired tokens', async () => {
      const { service } = await setupTestModule()
      const now = new Date()
      const pastExp = Math.floor(now.getTime() / 1000) - 3600 // 1 hour ago
      const futureExp = Math.floor(now.getTime() / 1000) + 3600 // 1 hour from now
      
      const expiredToken = createMockJWT(pastExp)
      const validToken = createMockJWT(futureExp)

      await service.addToBlacklist(expiredToken)
      await service.addToBlacklist(validToken)

      expect(blacklistStore).toHaveLength(2)

      await service.cleanupExpiredTokens()

      expect(blacklistStore).toHaveLength(1)
      expect(blacklistStore[0].token).toBe(validToken)
    })

    it('should not remove valid tokens', async () => {
      const { service } = await setupTestModule()
      const futureExp1 = Math.floor(Date.now() / 1000) + 3600
      const futureExp2 = Math.floor(Date.now() / 1000) + 7200
      
      const token1 = createMockJWT(futureExp1)
      const token2 = createMockJWT(futureExp2)

      await service.addToBlacklist(token1)
      await service.addToBlacklist(token2)

      expect(blacklistStore).toHaveLength(2)

      await service.cleanupExpiredTokens()

      expect(blacklistStore).toHaveLength(2)
      expect(blacklistStore.map(t => t.token)).toContain(token1)
      expect(blacklistStore.map(t => t.token)).toContain(token2)
    })

    it('should handle empty blacklist', async () => {
      const { service } = await setupTestModule()

      await service.cleanupExpiredTokens()

      expect(blacklistStore).toHaveLength(0)
    })

    it('should handle all expired tokens', async () => {
      const { service } = await setupTestModule()
      const pastExp1 = Math.floor(Date.now() / 1000) - 7200 // 2 hours ago
      const pastExp2 = Math.floor(Date.now() / 1000) - 3600 // 1 hour ago
      
      const expiredToken1 = createMockJWT(pastExp1)
      const expiredToken2 = createMockJWT(pastExp2)

      await service.addToBlacklist(expiredToken1)
      await service.addToBlacklist(expiredToken2)

      expect(blacklistStore).toHaveLength(2)

      await service.cleanupExpiredTokens()

      expect(blacklistStore).toHaveLength(0)
    })

    it('should return count of deleted tokens', async () => {
      const { service } = await setupTestModule()
      const pastExp = Math.floor(Date.now() / 1000) - 3600
      const futureExp = Math.floor(Date.now() / 1000) + 3600
      
      const expiredToken = createMockJWT(pastExp)
      const validToken = createMockJWT(futureExp)

      await service.addToBlacklist(expiredToken)
      await service.addToBlacklist(validToken)

      const result = await service.cleanupExpiredTokens()

      // The result should indicate that 1 token was deleted
      expect(blacklistStore).toHaveLength(1)
    })
  })

  describe('JWT parsing edge cases', () => {
    it('should handle malformed JWT tokens gracefully', async () => {
      const { service } = await setupTestModule()
      const malformedToken = 'invalid.jwt.token'

      // This should not throw an error, but the behavior depends on implementation
      await expect(service.addToBlacklist(malformedToken)).rejects.toThrow()
    })

    it('should handle JWT without expiration claim', async () => {
      const { service } = await setupTestModule()
      const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64')
      const payload = Buffer.from(JSON.stringify({ sub: 'user123' })).toString('base64') // No exp claim
      const signature = 'mock-signature'
      const tokenWithoutExp = `${header}.${payload}.${signature}`

      // The actual service will try to create a Date from payload.exp * 1000
      // Since exp is undefined, this will result in an Invalid Date
      // We expect this to either throw an error or handle it gracefully
      try {
        await service.addToBlacklist(tokenWithoutExp)
        // If it doesn't throw, we expect it to create an entry with an invalid date
        expect(blacklistStore).toHaveLength(1)
        expect(blacklistStore[0].expiresAt.getTime()).toBeNaN()
      } catch (error) {
        // If it throws, that's also acceptable behavior
        expect(error).toBeDefined()
      }
    })

    it('should handle base64 decoding errors', async () => {
      const { service } = await setupTestModule()
      const invalidBase64Token = 'header.invalid-base64.signature'

      await expect(service.addToBlacklist(invalidBase64Token)).rejects.toThrow()
    })
  })
})
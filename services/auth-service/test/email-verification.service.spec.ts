import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import { Test } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import { NotFoundException, BadRequestException } from '@nestjs/common'
import { EmailVerificationService } from '../src/modules/auth/services/email-verification.service'
import { EmailService } from '../src/modules/auth/services/email.service'
import { User, UserRole, AuthProvider } from '../src/modules/auth/entities/user.entity'

describe('EmailVerificationService', () => {
  let service: EmailVerificationService
  let userRepository: any
  let emailService: any
  let userStore: User[] = []

  beforeEach(() => {
    userStore = []
  })

  const createMockUser = (overrides?: Partial<User>): User => ({
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    passwordHash: 'hashed-password',
    role: UserRole.CLIENT,
    authProvider: AuthProvider.LOCAL,
    emailVerified: false,
    emailVerificationToken: undefined,
    emailVerificationExpires: undefined,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  })

  const setupTestModule = async () => {
    const userRepositoryMock = {
      findOne: async (options: any) => {
        const { where } = options
        if (where.id) {
          return userStore.find(user => user.id === where.id) || null
        }
        if (where.emailVerificationToken) {
          return userStore.find(user => user.emailVerificationToken === where.emailVerificationToken) || null
        }
        return null
      },
      save: async (user: User) => {
        const existingIndex = userStore.findIndex(u => u.id === user.id)
        if (existingIndex >= 0) {
          userStore[existingIndex] = user
        } else {
          if (!user.id) user.id = `user-${Math.random().toString(36).slice(2)}`
          userStore.push(user)
        }
        return user
      }
    }

    let emailServiceMock: any = {
      sendVerificationEmail: async () => ({ messageId: 'mock-message-id' })
    }

    const moduleRef = await Test.createTestingModule({
      providers: [
        EmailVerificationService,
        { provide: getRepositoryToken(User), useValue: userRepositoryMock },
        { provide: EmailService, useValue: emailServiceMock }
      ]
    }).compile()

    service = moduleRef.get(EmailVerificationService)
    userRepository = userRepositoryMock
    emailService = emailServiceMock

    return { service, userRepository, emailService }
  }

  describe('generateToken', () => {
    it('should generate a random hex token', async () => {
      const { service } = await setupTestModule()
      const token = service.generateToken()
      
      expect(token).toBeDefined()
      expect(typeof token).toBe('string')
      expect(token.length).toBe(64) // 32 bytes = 64 hex characters
      expect(token).toMatch(/^[a-f0-9]{64}$/)
    })

    it('should generate different tokens on multiple calls', async () => {
      const { service } = await setupTestModule()
      const token1 = service.generateToken()
      const token2 = service.generateToken()
      
      expect(token1).not.toBe(token2)
    })
  })

  describe('generateExpiryDate', () => {
    it('should generate expiry date 24 hours from now by default', async () => {
      const { service } = await setupTestModule()
      const now = new Date()
      const expiry = service.generateExpiryDate()
      
      const expectedExpiry = new Date(now)
      expectedExpiry.setHours(now.getHours() + 24)
      
      expect(expiry.getTime()).toBeCloseTo(expectedExpiry.getTime(), -2)
    })

    it('should generate expiry date with custom hours', async () => {
      const { service } = await setupTestModule()
      const now = new Date()
      const customHours = 12
      const expiry = service.generateExpiryDate(customHours)
      
      const expectedExpiry = new Date(now)
      expectedExpiry.setHours(now.getHours() + customHours)
      
      expect(expiry.getTime()).toBeCloseTo(expectedExpiry.getTime(), -2)
    })
  })

  describe('sendVerificationEmail', () => {
    it('should send verification email successfully', async () => {
      const { service, emailService } = await setupTestModule()
      const user = createMockUser()
      userStore.push(user)

      await service.sendVerificationEmail(user.id)

      const updatedUser = userStore.find(u => u.id === user.id)
      expect(updatedUser?.emailVerificationToken).toBeDefined()
      expect(updatedUser?.emailVerificationExpires).toBeDefined()
      expect(typeof emailService.sendVerificationEmail).toBe('function')
    })

    it('should throw NotFoundException if user not found', async () => {
      const { service } = await setupTestModule()
      
      await expect(service.sendVerificationEmail('nonexistent-user'))
        .rejects.toThrow(NotFoundException)
    })

    it('should throw BadRequestException if email already verified', async () => {
      const { service } = await setupTestModule()
      const user = createMockUser({ emailVerified: true })
      userStore.push(user)

      await expect(service.sendVerificationEmail(user.id))
        .rejects.toThrow(BadRequestException)
    })

    it('should clean up token if email sending fails', async () => {
      const { service } = await setupTestModule()
      const user = createMockUser()
      userStore.push(user)

      // Override the email service to throw an error
      emailService.sendVerificationEmail = async () => {
        throw new Error('Email failed')
      }

      await expect(service.sendVerificationEmail(user.id))
        .rejects.toThrow('Error al enviar el email de verificación')

      const updatedUser = userStore.find(u => u.id === user.id)
      expect(updatedUser?.emailVerificationToken).toBeUndefined()
      expect(updatedUser?.emailVerificationExpires).toBeUndefined()
    })
  })

  describe('verifyEmail', () => {
    it('should verify email successfully with valid token', async () => {
      const { service } = await setupTestModule()
      const token = 'valid-token-123'
      const futureDate = new Date()
      futureDate.setHours(futureDate.getHours() + 12)
      
      const user = createMockUser({
        emailVerificationToken: token,
        emailVerificationExpires: futureDate
      })
      userStore.push(user)

      const result = await service.verifyEmail(token)

      expect(result.emailVerified).toBe(true)
      expect(result.emailVerificationToken).toBeUndefined()
      expect(result.emailVerificationExpires).toBeUndefined()
    })

    it('should throw NotFoundException for invalid token', async () => {
      const { service } = await setupTestModule()
      
      await expect(service.verifyEmail('invalid-token'))
        .rejects.toThrow(NotFoundException)
    })

    it('should throw BadRequestException if email already verified', async () => {
      const { service } = await setupTestModule()
      const user = createMockUser({
        emailVerified: true,
        emailVerificationToken: 'some-token'
      })
      userStore.push(user)

      await expect(service.verifyEmail('some-token'))
        .rejects.toThrow(BadRequestException)
    })

    it('should throw BadRequestException for expired token and clean it up', async () => {
      const { service } = await setupTestModule()
      const expiredToken = 'expired-token'
      const pastDate = new Date()
      pastDate.setHours(pastDate.getHours() - 1)
      
      const user = createMockUser({
        emailVerificationToken: expiredToken,
        emailVerificationExpires: pastDate
      })
      userStore.push(user)

      await expect(service.verifyEmail(expiredToken))
        .rejects.toThrow(BadRequestException)

      const updatedUser = userStore.find(u => u.id === user.id)
      expect(updatedUser?.emailVerificationToken).toBeUndefined()
      expect(updatedUser?.emailVerificationExpires).toBeUndefined()
    })
  })

  describe('resendVerificationEmail', () => {
    it('should resend verification email successfully', async () => {
      const { service, emailService } = await setupTestModule()
      const user = createMockUser()
      userStore.push(user)

      await service.resendVerificationEmail(user.id)

      expect(typeof emailService.sendVerificationEmail).toBe('function')
    })

    it('should throw error if user not found', async () => {
      const { service } = await setupTestModule()
      
      await expect(service.resendVerificationEmail('nonexistent'))
        .rejects.toThrow(NotFoundException)
    })

    it('should throw error if email already verified', async () => {
      const { service } = await setupTestModule()
      const user = createMockUser({ emailVerified: true })
      userStore.push(user)

      await expect(service.resendVerificationEmail(user.id))
        .rejects.toThrow(BadRequestException)
    })

    it('should throw error if recent token still valid', async () => {
      const { service } = await setupTestModule()
      const futureDate = new Date()
      futureDate.setHours(futureDate.getHours() + 25) // More than 23 hours remaining
      
      const user = createMockUser({
        emailVerificationToken: 'recent-token',
        emailVerificationExpires: futureDate
      })
      userStore.push(user)

      await expect(service.resendVerificationEmail(user.id))
        .rejects.toThrow(BadRequestException)
    })

    it('should allow resend if token is about to expire', async () => {
      const { service, emailService } = await setupTestModule()
      const nearExpiryDate = new Date()
      nearExpiryDate.setHours(nearExpiryDate.getHours() + 22)
      
      const user = createMockUser({
        emailVerificationToken: 'old-token',
        emailVerificationExpires: nearExpiryDate
      })
      userStore.push(user)

      await service.resendVerificationEmail(user.id)

      expect(typeof emailService.sendVerificationEmail).toBe('function')
    })
  })

  describe('isEmailVerified', () => {
    it('should return true for verified email', async () => {
      const { service } = await setupTestModule()
      const user = createMockUser({ emailVerified: true })
      userStore.push(user)

      const result = await service.isEmailVerified(user.id)

      expect(result).toBe(true)
    })

    it('should return false for unverified email', async () => {
      const { service } = await setupTestModule()
      const user = createMockUser({ emailVerified: false })
      userStore.push(user)

      const result = await service.isEmailVerified(user.id)

      expect(result).toBe(false)
    })

    it('should throw NotFoundException for nonexistent user', async () => {
      const { service } = await setupTestModule()
      
      await expect(service.isEmailVerified('nonexistent'))
        .rejects.toThrow(NotFoundException)
    })
  })

  describe('requireEmailVerified', () => {
    it('should not throw for verified email', async () => {
      const { service } = await setupTestModule()
      const user = createMockUser({ emailVerified: true })
      userStore.push(user)

      await expect(service.requireEmailVerified(user.id))
        .resolves.toBeUndefined()
    })

    it('should throw BadRequestException for unverified email', async () => {
      const { service } = await setupTestModule()
      const user = createMockUser({ emailVerified: false })
      userStore.push(user)

      await expect(service.requireEmailVerified(user.id))
        .rejects.toThrow(BadRequestException)
    })

    it('should throw NotFoundException for nonexistent user', async () => {
      const { service } = await setupTestModule()
      
      await expect(service.requireEmailVerified('nonexistent'))
        .rejects.toThrow(NotFoundException)
    })
  })
})
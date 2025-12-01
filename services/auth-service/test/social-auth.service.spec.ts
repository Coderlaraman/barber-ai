import { describe, it, expect, beforeEach } from '@jest/globals'
import { Test } from '@nestjs/testing'
import { UnauthorizedException } from '@nestjs/common'
import { SocialAuthService } from '../src/modules/auth/services/social-auth.service'
import { GoogleAuthService } from '../src/modules/auth/services/google-auth.service'
import { FacebookAuthService } from '../src/modules/auth/services/facebook-auth.service'
import { SocialUserProfile } from '../src/modules/auth/interfaces/social-auth.interface'

describe('SocialAuthService', () => {
  let service: SocialAuthService
  let googleAuthService: any
  let facebookAuthService: any

  const setupTestModule = async () => {
    const googleAuthServiceMock = {
      verifyGoogleToken: async (token: string) => {
        if (token === 'valid-google-token') {
          return {
            sub: 'google-user-123',
            email: 'google.user@example.com',
            name: 'Google User',
            picture: 'https://example.com/avatar.jpg',
            email_verified: true
          }
        }
        throw new Error('Invalid Google token')
      }
    }

    const facebookAuthServiceMock = {
      verifyFacebookToken: async (token: string) => {
        if (token === 'valid-facebook-token') {
          return {
            data: {
              app_id: 'facebook-app-id',
              type: 'USER',
              application: 'BarberIA',
              data_access_expires_at: Date.now() + 86400000,
              expires_at: Date.now() + 7200000,
              is_valid: true,
              scopes: ['email', 'public_profile'],
              user_id: 'facebook-user-123'
            }
          }
        }
        throw new Error('Invalid Facebook token')
      },
      getFacebookUserProfile: async (token: string) => {
        if (token === 'valid-facebook-token') {
          return {
            id: 'facebook-user-123',
            name: 'Facebook User',
            email: 'facebook.user@example.com',
            picture: {
              data: {
                url: 'https://example.com/facebook-avatar.jpg'
              }
            }
          }
        }
        throw new Error('Invalid Facebook token')
      }
    }

    const moduleRef = await Test.createTestingModule({
      providers: [
        SocialAuthService,
        { provide: GoogleAuthService, useValue: googleAuthServiceMock },
        { provide: FacebookAuthService, useValue: facebookAuthServiceMock }
      ]
    }).compile()

    service = moduleRef.get(SocialAuthService)
    googleAuthService = googleAuthServiceMock
    facebookAuthService = facebookAuthServiceMock

    return { service, googleAuthService, facebookAuthService }
  }

  describe('validateSocialToken', () => {
    it('should validate Google token successfully', async () => {
      const { service } = await setupTestModule()
      
      const result = await service.validateSocialToken('google', 'valid-google-token')
      
      expect(result).toBeDefined()
      expect(result.id).toBe('google-user-123')
      expect(result.email).toBe('google.user@example.com')
      expect(result.name).toBe('Google User')
      expect(result.provider).toBe('google')
      expect(result.avatar).toBe('https://example.com/avatar.jpg')
    })

    it('should validate Facebook token successfully', async () => {
      const { service } = await setupTestModule()
      
      const result = await service.validateSocialToken('facebook', 'valid-facebook-token')
      
      expect(result).toBeDefined()
      expect(result.id).toBe('facebook-user-123')
      expect(result.email).toBe('facebook.user@example.com')
      expect(result.name).toBe('Facebook User')
      expect(result.provider).toBe('facebook')
      expect(result.avatar).toBe('https://example.com/facebook-avatar.jpg')
    })

    it('should throw UnauthorizedException for invalid Google token', async () => {
      const { service } = await setupTestModule()
      
      await expect(service.validateSocialToken('google', 'invalid-token'))
        .rejects.toThrow(UnauthorizedException)
    })

    it('should throw UnauthorizedException for invalid Facebook token', async () => {
      const { service } = await setupTestModule()
      
      await expect(service.validateSocialToken('facebook', 'invalid-token'))
        .rejects.toThrow(UnauthorizedException)
    })

    it('should throw UnauthorizedException for unsupported provider', async () => {
      const { service } = await setupTestModule()
      
      await expect(service.validateSocialToken('twitter', 'some-token'))
        .rejects.toThrow(UnauthorizedException)
    })

    it('should handle Google token without name field', async () => {
      const { service, googleAuthService } = await setupTestModule()
      
      // Override to return token without name
      googleAuthService.verifyGoogleToken = async (token: string) => {
        if (token === 'google-token-no-name') {
          return {
            sub: 'google-user-456',
            email: 'no.name@example.com',
            picture: 'https://example.com/avatar2.jpg',
            email_verified: true
            // name field is missing
          }
        }
        throw new Error('Invalid Google token')
      }
      
      const result = await service.validateSocialToken('google', 'google-token-no-name')
      
      expect(result).toBeDefined()
      expect(result.id).toBe('google-user-456')
      expect(result.email).toBe('no.name@example.com')
      expect(result.name).toBe('no.name') // Should use email prefix as fallback
      expect(result.provider).toBe('google')
      expect(result.avatar).toBe('https://example.com/avatar2.jpg')
    })

    it('should handle Facebook token without avatar', async () => {
      // Create a separate test module for this test
      const facebookAuthServiceMock = {
        verifyFacebookToken: async (token: string) => {
          if (token === 'facebook-token-no-avatar') {
            return {
              data: {
                app_id: 'facebook-app-id',
                type: 'USER',
                application: 'BarberIA',
                data_access_expires_at: Date.now() + 86400000,
                expires_at: Date.now() + 7200000,
                is_valid: true,
                scopes: ['email', 'public_profile'],
                user_id: 'facebook-user-456'
              }
            }
          }
          throw new Error('Invalid Facebook token')
        },
        getFacebookUserProfile: async (token: string) => {
          if (token === 'facebook-token-no-avatar') {
            return {
              id: 'facebook-user-456',
              name: 'Facebook User No Avatar',
              email: 'no.avatar@example.com'
              // picture field is missing
            }
          }
          throw new Error('Invalid Facebook token')
        }
      }

      const moduleRef = await Test.createTestingModule({
        providers: [
          SocialAuthService,
          { provide: GoogleAuthService, useValue: {} },
          { provide: FacebookAuthService, useValue: facebookAuthServiceMock }
        ]
      }).compile()

      const service = moduleRef.get(SocialAuthService)
      
      const result = await service.validateSocialToken('facebook', 'facebook-token-no-avatar')
      
      expect(result).toBeDefined()
      expect(result.id).toBe('facebook-user-456')
      expect(result.email).toBe('no.avatar@example.com')
      expect(result.name).toBe('Facebook User No Avatar')
      expect(result.provider).toBe('facebook')
      expect(result.avatar).toBeUndefined() // Should not have avatar
    })
  })

  describe('getSupportedProviders', () => {
    it('should return list of supported providers', async () => {
      const { service } = await setupTestModule()
      
      const providers = service.getSupportedProviders()
      
      expect(providers).toBeDefined()
      expect(providers).toHaveLength(2)
      expect(providers).toContain('google')
      expect(providers).toContain('facebook')
    })
  })

  describe('provider registration', () => {
    it('should have Google provider registered', async () => {
      const { service } = await setupTestModule()
      
      const providers = service.getSupportedProviders()
      expect(providers).toContain('google')
      
      // Should be able to validate with Google provider
      const result = await service.validateSocialToken('google', 'valid-google-token')
      expect(result).toBeDefined()
      expect(result.provider).toBe('google')
    })

    it('should have Facebook provider registered', async () => {
      const { service } = await setupTestModule()
      
      const providers = service.getSupportedProviders()
      expect(providers).toContain('facebook')
      
      // Should be able to validate with Facebook provider
      const result = await service.validateSocialToken('facebook', 'valid-facebook-token')
      expect(result).toBeDefined()
      expect(result.provider).toBe('facebook')
    })
  })
})
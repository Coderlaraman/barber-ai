import { Injectable, UnauthorizedException } from '@nestjs/common'
import { SocialAuthProvider, SocialUserProfile } from '../interfaces/social-auth.interface'
import { GoogleAuthService } from './google-auth.service'

@Injectable()
export class SocialAuthService {
  private providers: Map<string, SocialAuthProvider> = new Map()

  constructor(private readonly googleAuthService: GoogleAuthService) {
    // Real Google validation using GoogleAuthService
    this.providers.set('google', {
      getProviderName: () => 'google',
      validateToken: async (token: string): Promise<SocialUserProfile> => {
        try {
          const googleTokenInfo = await this.googleAuthService.verifyGoogleToken(token)
          return {
            id: googleTokenInfo.sub,
            email: googleTokenInfo.email,
            name: googleTokenInfo.name || googleTokenInfo.email.split('@')[0],
            provider: 'google',
            avatar: googleTokenInfo.picture
          }
        } catch {
          throw new UnauthorizedException('Invalid Google token')
        }
      }
    })

    this.providers.set('facebook', {
      getProviderName: () => 'facebook',
      validateToken: async (token: string): Promise<SocialUserProfile> => {
        // Mock validation - in real implementation, this would call Facebook's API
        if (token === 'mock-facebook-token') {
          return {
            id: 'facebook-456',
            email: 'user@facebook.com',
            name: 'Facebook User',
            provider: 'facebook',
            avatar: 'https://example.com/avatar.jpg'
          }
        }
        throw new UnauthorizedException('Invalid Facebook token')
      }
    })
  }

  async validateSocialToken(provider: string, token: string): Promise<SocialUserProfile> {
    const authProvider = this.providers.get(provider)
    if (!authProvider) {
      throw new UnauthorizedException(`Unsupported provider: ${provider}`)
    }

    return authProvider.validateToken(token)
  }

  getSupportedProviders(): string[] {
    return Array.from(this.providers.keys())
  }
}
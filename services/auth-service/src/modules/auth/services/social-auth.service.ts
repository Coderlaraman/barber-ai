import { Injectable, UnauthorizedException } from '@nestjs/common'
import { SocialAuthProvider, SocialUserProfile } from '../interfaces/social-auth.interface'
import { GoogleAuthService } from './google-auth.service'
import { FacebookAuthService } from './facebook-auth.service'

@Injectable()
export class SocialAuthService {
  private providers: Map<string, SocialAuthProvider> = new Map()

  constructor(
    private readonly googleAuthService: GoogleAuthService,
    private readonly facebookAuthService: FacebookAuthService
  ) {
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
        try {
          // Verify the Facebook token
          await this.facebookAuthService.verifyFacebookToken(token)
          
          // Get user profile information
          const facebookProfile = await this.facebookAuthService.getFacebookUserProfile(token)
          
          return {
            id: facebookProfile.id,
            email: facebookProfile.email,
            name: facebookProfile.name,
            provider: 'facebook',
            avatar: facebookProfile.picture?.data?.url
          }
        } catch {
          throw new UnauthorizedException('Invalid Facebook token')
        }
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
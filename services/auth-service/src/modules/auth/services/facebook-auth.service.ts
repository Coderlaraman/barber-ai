import { Injectable, UnauthorizedException } from '@nestjs/common'
import * as https from 'https'

export interface FacebookTokenInfo {
  data: {
    app_id: string
    type: string
    application: string
    data_access_expires_at: number
    expires_at: number
    is_valid: boolean
    scopes: string[]
    user_id: string
  }
}

export interface FacebookUserProfile {
  id: string
  name: string
  email: string
  picture?: {
    data: {
      url: string
    }
  }
}

@Injectable()
export class FacebookAuthService {
  private readonly FACEBOOK_DEBUG_TOKEN_URL = 'https://graph.facebook.com/debug_token'
  private readonly FACEBOOK_USER_INFO_URL = 'https://graph.facebook.com/me'

  private async makeHttpsRequest(url: string): Promise<any> {
    return new Promise((resolve, reject) => {
      https.get(url, (res) => {
        let data = ''
        res.on('data', (chunk) => {
          data += chunk
        })
        res.on('end', () => {
          try {
            resolve(JSON.parse(data))
          } catch {
            reject(new Error('Invalid JSON response'))
          }
        })
      }).on('error', (error) => {
        reject(error)
      })
    })
  }

  async verifyFacebookToken(accessToken: string): Promise<FacebookTokenInfo> {
    try {
      const appId = process.env.FACEBOOK_APP_ID
      const appSecret = process.env.FACEBOOK_APP_SECRET

      if (!appId || !appSecret) {
        throw new Error('Facebook app credentials not configured')
      }

      // Verify the token with Facebook's debug_token endpoint
      const debugUrl = `${this.FACEBOOK_DEBUG_TOKEN_URL}?input_token=${accessToken}&access_token=${appId}|${appSecret}`
      const tokenInfo = await this.makeHttpsRequest(debugUrl) as FacebookTokenInfo

      // Check if token is valid
      if (!tokenInfo.data?.is_valid) {
        throw new UnauthorizedException('Invalid Facebook access token')
      }

      // Check if token has expired
      const currentTime = Math.floor(Date.now() / 1000)
      if (tokenInfo.data.expires_at && tokenInfo.data.expires_at < currentTime) {
        throw new UnauthorizedException('Facebook token has expired')
      }

      return tokenInfo
    } catch (error: any) {
      if (error.message === 'Invalid JSON response' || error.message?.includes('400')) {
        throw new UnauthorizedException('Invalid Facebook access token')
      }
      throw error
    }
  }

  async getFacebookUserProfile(accessToken: string): Promise<FacebookUserProfile> {
    try {
      // Get user profile information
      const userInfoUrl = `${this.FACEBOOK_USER_INFO_URL}?fields=id,name,email,picture&access_token=${accessToken}`
      const userProfile = await this.makeHttpsRequest(userInfoUrl) as FacebookUserProfile

      // Verify we got the essential data
      if (!userProfile.id || !userProfile.name) {
        throw new UnauthorizedException('Unable to retrieve Facebook user profile')
      }

      return userProfile
    } catch (error: any) {
      if (error.message === 'Invalid JSON response' || error.message?.includes('400')) {
        throw new UnauthorizedException('Unable to retrieve Facebook user profile')
      }
      throw error
    }
  }
}
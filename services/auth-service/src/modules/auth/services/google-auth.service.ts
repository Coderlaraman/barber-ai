import { Injectable, UnauthorizedException } from '@nestjs/common'
import * as https from 'https'

interface GoogleTokenInfo {
  iss: string
  azp: string
  aud: string
  sub: string
  email: string
  email_verified: boolean
  name?: string
  picture?: string
  given_name?: string
  family_name?: string
  locale?: string
  iat: number
  exp: number
}

@Injectable()
export class GoogleAuthService {
  private readonly GOOGLE_TOKEN_INFO_URL = 'https://oauth2.googleapis.com/tokeninfo'
  
  constructor() {}

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

  async verifyGoogleToken(accessToken: string): Promise<GoogleTokenInfo> {
    try {
      const tokenInfo = await this.makeHttpsRequest(`${this.GOOGLE_TOKEN_INFO_URL}?access_token=${accessToken}`)
      
      // Verify the token is from Google
      if (tokenInfo.iss !== 'https://accounts.google.com' && tokenInfo.iss !== 'accounts.google.com') {
        throw new UnauthorizedException('Invalid token issuer')
      }
      
      // Verify audience matches our client ID (if configured)
      const clientId = process.env.GOOGLE_CLIENT_ID
      if (clientId && tokenInfo.aud !== clientId) {
        throw new UnauthorizedException('Invalid token audience')
      }
      
      // Check if token is expired
      const currentTime = Math.floor(Date.now() / 1000)
      if (tokenInfo.exp < currentTime) {
        throw new UnauthorizedException('Token has expired')
      }
      
      // Check if email is verified
      if (!tokenInfo.email_verified) {
        throw new UnauthorizedException('Email not verified')
      }
      
      return tokenInfo
    } catch (error: any) {
      if (error.message === 'Invalid JSON response' || error.message?.includes('400')) {
        throw new UnauthorizedException('Invalid Google access token')
      }
      throw error
    }
  }
}
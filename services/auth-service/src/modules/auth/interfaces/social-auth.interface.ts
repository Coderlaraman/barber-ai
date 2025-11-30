export interface SocialUserProfile {
  id: string
  email: string
  name: string
  provider: string
  avatar?: string
}

export interface SocialAuthProvider {
  validateToken(token: string): Promise<SocialUserProfile>
  getProviderName(): string
}
import { Injectable, BadRequestException, UnauthorizedException, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { User, UserRole, AuthProvider } from './entities/user.entity'
import * as bcrypt from 'bcryptjs'
import { JwtService } from '@nestjs/jwt'
import { getRolePermissions } from './entities/role-permissions.entity'
import { AuditService } from './services/audit.service'
import { SocialAuthService } from './services/social-auth.service'
import { TokenBlacklistService } from './services/token-blacklist.service'
import { EmailService } from './services/email.service'
import { EmailVerificationService } from './services/email-verification.service'
import { AuditAction, AuditStatus } from './entities/access-audit.entity'

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly jwt: JwtService,
    private readonly auditService: AuditService,
    private readonly socialAuthService: SocialAuthService,
    private readonly tokenBlacklistService: TokenBlacklistService,
    private readonly emailService: EmailService,
    private readonly emailVerificationService: EmailVerificationService
  ) {}

  async register(email: string, password: string, role: User['role'], auditData?: { ipAddress?: string; userAgent?: string }) {
    const exists = await this.users.findOne({ where: { email } })
    if (exists) {
      await this.auditService.logAccess({
        action: AuditAction.REGISTER,
        status: AuditStatus.FAILURE,
        details: 'Email already taken',
        failureReason: 'EMAIL_TAKEN',
        ipAddress: auditData?.ipAddress,
        userAgent: auditData?.userAgent
      })
      throw new BadRequestException('EMAIL_TAKEN')
    }
    
    const passwordHash = await bcrypt.hash(password, 10)
    const user = this.users.create({ email, passwordHash, role })
    await this.users.save(user)
    
    // Log successful registration
    await this.auditService.logAccess({
      user,
      action: AuditAction.REGISTER,
      status: AuditStatus.SUCCESS,
      details: `New ${role} account created`,
      ipAddress: auditData?.ipAddress,
      userAgent: auditData?.userAgent
    })
    
    // Enviar email de verificación (no esperar para no retrasar la respuesta)
    this.emailVerificationService.sendVerificationEmail(user.id).catch(error => {
      console.error('Error al enviar email de verificación:', error)
    })
    
    const permissions = getRolePermissions(user.role)
    const accessToken = await this.jwt.signAsync({ 
      sub: user.id, 
      email: user.email,
      role: user.role,
      permissions 
    })
    const refreshToken = await this.signRefresh(user)
    return { user: { id: user.id, email: user.email, role: user.role }, accessToken, refreshToken }
  }

  async login(email: string, password: string, auditData?: { ipAddress?: string; userAgent?: string }) {
    const user = await this.users.findOne({ where: { email } })
    if (!user) {
      await this.auditService.logAccess({
        action: AuditAction.LOGIN,
        status: AuditStatus.FAILURE,
        details: 'Login attempt with non-existent email',
        failureReason: 'INVALID_CREDENTIALS',
        ipAddress: auditData?.ipAddress,
        userAgent: auditData?.userAgent
      })
      throw new UnauthorizedException('INVALID_CREDENTIALS')
    }
    
    // Check if account is locked
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      await this.auditService.logAccess({
        user,
        action: AuditAction.LOGIN,
        status: AuditStatus.FAILURE,
        details: 'Login attempt on locked account',
        failureReason: 'ACCOUNT_LOCKED',
        ipAddress: auditData?.ipAddress,
        userAgent: auditData?.userAgent
      })
      throw new UnauthorizedException('ACCOUNT_LOCKED')
    }
    
    // Check if user has a password (social auth users might not have one)
    if (!user.passwordHash) {
      await this.auditService.logAccess({
        user,
        action: AuditAction.LOGIN,
        status: AuditStatus.FAILURE,
        details: 'Login attempt for social auth user without password',
        failureReason: 'INVALID_CREDENTIALS',
        ipAddress: auditData?.ipAddress,
        userAgent: auditData?.userAgent
      })
      throw new UnauthorizedException('INVALID_CREDENTIALS')
    }
    
    const ok = await bcrypt.compare(password, user.passwordHash)
    if (!ok) {
      // Increment failed login attempts
      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1
      
      // Lock account after 5 failed attempts for 30 minutes
      if (user.failedLoginAttempts >= 5) {
        user.lockedUntil = new Date(Date.now() + 30 * 60 * 1000) // 30 minutes
      }
      
      await this.users.save(user)
      
      await this.auditService.logAccess({
        user,
        action: AuditAction.LOGIN,
        status: AuditStatus.FAILURE,
        details: `Login attempt with incorrect password (attempt ${user.failedLoginAttempts})`,
        failureReason: 'INVALID_CREDENTIALS',
        ipAddress: auditData?.ipAddress,
        userAgent: auditData?.userAgent
      })
      throw new UnauthorizedException('INVALID_CREDENTIALS')
    }
    
    // Log successful login
    await this.auditService.logAccess({
      user,
      action: AuditAction.LOGIN,
      status: AuditStatus.SUCCESS,
      details: 'User logged in successfully',
      ipAddress: auditData?.ipAddress,
      userAgent: auditData?.userAgent
    })
    
    // Reset failed login attempts on successful login
    if (user.failedLoginAttempts && user.failedLoginAttempts > 0) {
      user.failedLoginAttempts = 0
      user.lockedUntil = undefined
      await this.users.save(user)
    }
    
    const permissions = getRolePermissions(user.role)
    const accessToken = await this.jwt.signAsync({ 
      sub: user.id, 
      email: user.email,
      role: user.role,
      permissions 
    })
    const refreshToken = await this.signRefresh(user)
    return { user: { id: user.id, email: user.email, role: user.role }, accessToken, refreshToken }
  }

  async refresh(refreshToken: string, auditData?: { ipAddress?: string; userAgent?: string }) {
    try {
      const payload = await this.jwt.verifyAsync(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET || 'dev-refresh'
      })
      const user = await this.users.findOne({ where: { id: payload.sub } })
      if (!user) {
        await this.auditService.logAccess({
          action: AuditAction.TOKEN_REFRESH,
          status: AuditStatus.FAILURE,
          details: 'Token refresh attempt with invalid user',
          failureReason: 'INVALID_REFRESH',
          ipAddress: auditData?.ipAddress,
          userAgent: auditData?.userAgent
        })
        throw new UnauthorizedException('INVALID_REFRESH')
      }
      
      // Log successful token refresh
      await this.auditService.logAccess({
        user,
        action: AuditAction.TOKEN_REFRESH,
        status: AuditStatus.SUCCESS,
        details: 'Access token refreshed successfully',
        ipAddress: auditData?.ipAddress,
        userAgent: auditData?.userAgent
      })
      
      const permissions = getRolePermissions(user.role)
      const accessToken = await this.jwt.signAsync({ 
        sub: user.id, 
        email: user.email,
        role: user.role,
        permissions 
      })
      return { accessToken }
    } catch {
      await this.auditService.logAccess({
        action: AuditAction.TOKEN_REFRESH,
        status: AuditStatus.FAILURE,
        details: 'Token refresh failed',
        failureReason: 'INVALID_REFRESH',
        ipAddress: auditData?.ipAddress,
        userAgent: auditData?.userAgent
      })
      throw new UnauthorizedException('INVALID_REFRESH')
    }
  }

  async socialAuth(provider: string, accessToken: string, auditData?: { ipAddress?: string; userAgent?: string }) {
    try {
      // Validate the social token
      const socialProfile = await this.socialAuthService.validateSocialToken(provider, accessToken)
      
      // Check if user exists
      let user = await this.users.findOne({ where: { email: socialProfile.email } })
      
      if (!user) {
        // Create new user from social profile
        user = this.users.create({
          email: socialProfile.email,
          name: socialProfile.name,
          role: UserRole.CLIENT, // Default role for social auth users
          authProvider: provider === 'google' ? AuthProvider.GOOGLE : AuthProvider.FACEBOOK,
          emailVerified: true, // Los emails de Google/Facebook ya están verificados
          // No password needed for social auth
        })
        user = await this.users.save(user)
        
        // Log successful registration
        await this.auditService.logAccess({
          user,
          action: AuditAction.REGISTER,
          status: AuditStatus.SUCCESS,
          details: `Social registration via ${provider}`,
          ipAddress: auditData?.ipAddress,
          userAgent: auditData?.userAgent
        })
      } else if (!user.emailVerified) {
        // Si el usuario existe pero no tiene email verificado, marcarlo como verificado
        // (porque viene de un proveedor social confiable)
        user.emailVerified = true
        user = await this.users.save(user)
        
        await this.auditService.logAccess({
          user,
          action: AuditAction.EMAIL_VERIFICATION,
          status: AuditStatus.SUCCESS,
          details: `Email verified via social auth ${provider}`,
          ipAddress: auditData?.ipAddress,
          userAgent: auditData?.userAgent
        })
      }
      
      // Log successful login
      await this.auditService.logAccess({
        user,
        action: AuditAction.LOGIN,
        status: AuditStatus.SUCCESS,
        details: `Social login via ${provider}`,
        ipAddress: auditData?.ipAddress,
        userAgent: auditData?.userAgent
      })
      
      // Generate tokens
      const newAccessToken = await this.signAccess(user)
      const newRefreshToken = await this.signRefresh(user)
      
      return {
        user: {
          id: user.id,
          email: user.email,
          role: user.role
        },
        accessToken: newAccessToken,
        refreshToken: newRefreshToken
      }
    } catch (error) {
      // Log failed social auth
      await this.auditService.logAccess({
        action: AuditAction.LOGIN,
        status: AuditStatus.FAILURE,
        details: `Social authentication failed via ${provider}`,
        failureReason: error instanceof Error ? error.message : String(error),
        ipAddress: auditData?.ipAddress,
        userAgent: auditData?.userAgent
      })
      throw error
    }
  }

  async logout(refreshToken?: string, auditData?: { ipAddress?: string; userAgent?: string }) {
    // Add refresh token to blacklist if provided
    if (refreshToken) {
      await this.tokenBlacklistService.addToBlacklist(refreshToken)
    }
    
    // Log the logout event
    await this.auditService.logAccess({
      action: AuditAction.LOGOUT,
      status: AuditStatus.SUCCESS,
      details: 'User logged out successfully',
      ipAddress: auditData?.ipAddress,
      userAgent: auditData?.userAgent
    })

    return { message: 'Logout successful' }
  }

  private async signAccess(user: User) {
    const exp = Number(process.env.JWT_EXPIRES_IN || 60 * 60)
    const permissions = getRolePermissions(user.role)
    return this.jwt.signAsync(
      { sub: user.id, email: user.email, role: user.role, permissions },
      { secret: process.env.JWT_SECRET || 'dev-secret', expiresIn: exp }
    )
  }

  private async signRefresh(user: User) {
    const exp = Number(process.env.JWT_REFRESH_EXPIRES_IN || 60 * 60 * 24 * 7)
    const permissions = getRolePermissions(user.role)
    return this.jwt.signAsync(
      { sub: user.id, email: user.email, role: user.role, permissions },
      { secret: process.env.JWT_REFRESH_SECRET || 'dev-refresh', expiresIn: exp }
    )
  }

  async verifyEmail(token: string) {
    try {
      const user = await this.emailVerificationService.verifyEmail(token)
      
      // Log successful email verification
      await this.auditService.logAccess({
        user,
        action: AuditAction.EMAIL_VERIFICATION,
        status: AuditStatus.SUCCESS,
        details: 'Email verified successfully'
      })
      
      return {
        message: 'Email verified successfully',
        user: {
          id: user.id,
          email: user.email,
          emailVerified: user.emailVerified
        }
      }
    } catch (error) {
      // Log failed email verification
      await this.auditService.logAccess({
        action: AuditAction.EMAIL_VERIFICATION,
        status: AuditStatus.FAILURE,
        details: 'Email verification failed',
        failureReason: error instanceof Error ? error.message : String(error)
      })
      throw error
    }
  }

  async resendVerificationEmail(email: string) {
    const user = await this.users.findOne({ where: { email } })
    
    if (!user) {
      throw new NotFoundException('User not found')
    }
    
    if (user.emailVerified) {
      throw new BadRequestException('Email already verified')
    }
    
    try {
      await this.emailVerificationService.resendVerificationEmail(user.id)
      
      // Log successful verification email resend
      await this.auditService.logAccess({
        user,
        action: AuditAction.EMAIL_VERIFICATION_RESEND,
        status: AuditStatus.SUCCESS,
        details: 'Verification email resent successfully'
      })
      
      return {
        message: 'Verification email sent successfully'
      }
    } catch (error) {
      // Log failed verification email resend
      await this.auditService.logAccess({
        user,
        action: AuditAction.EMAIL_VERIFICATION_RESEND,
        status: AuditStatus.FAILURE,
        details: 'Failed to resend verification email',
        failureReason: error instanceof Error ? error.message : String(error)
      })
      throw error
    }
  }

  async forgotPassword(email: string) {
    const user = await this.users.findOne({ where: { email } })
    
    if (!user) {
      throw new NotFoundException('User not found')
    }

    if (!user.emailVerified) {
      throw new BadRequestException('Debes verificar tu email antes de restablecer tu contraseña')
    }

    try {
      // Generar token de restablecimiento
      const resetToken = this.emailVerificationService.generateToken()
      const resetExpiry = this.emailVerificationService.generateExpiryDate(1) // 1 hora

      // Guardar token en el usuario
      user.passwordResetToken = resetToken
      user.passwordResetExpires = resetExpiry
      await this.users.save(user)

      // Enviar email de restablecimiento (no esperar)
      this.emailService.sendPasswordResetEmail(user.email, resetToken, user.name).catch(error => {
        console.error('Error al enviar email de restablecimiento:', error)
      })

      // Log successful password reset request
      await this.auditService.logAccess({
        user,
        action: AuditAction.PASSWORD_RESET,
        status: AuditStatus.SUCCESS,
        details: 'Password reset requested successfully'
      })

      return {
        message: 'Password reset email sent successfully'
      }
    } catch (error) {
      // Log failed password reset request
      await this.auditService.logAccess({
        user,
        action: AuditAction.PASSWORD_RESET,
        status: AuditStatus.FAILURE,
        details: 'Failed to request password reset',
        failureReason: error instanceof Error ? error.message : String(error)
      })
      throw error
    }
  }

  async resetPassword(token: string, newPassword: string) {
    const user = await this.users.findOne({ where: { passwordResetToken: token } })
    
    if (!user) {
      throw new NotFoundException('Token de restablecimiento inválido')
    }

    if (user.passwordResetExpires && user.passwordResetExpires < new Date()) {
      // Limpiar token expirado
      user.passwordResetToken = undefined
      user.passwordResetExpires = undefined
      await this.users.save(user)
      throw new BadRequestException('El token de restablecimiento ha expirado')
    }

    try {
      // Hash nueva contraseña
      const hashedPassword = await bcrypt.hash(newPassword, 10)
      
      // Actualizar contraseña y limpiar tokens
      user.passwordHash = hashedPassword
      user.passwordResetToken = undefined
      user.passwordResetExpires = undefined
      await this.users.save(user)

      // Log successful password reset
      await this.auditService.logAccess({
        user,
        action: AuditAction.PASSWORD_RESET,
        status: AuditStatus.SUCCESS,
        details: 'Password reset completed successfully'
      })

      return {
        message: 'Password reset successfully'
      }
    } catch (error) {
      // Log failed password reset
      await this.auditService.logAccess({
        user,
        action: AuditAction.PASSWORD_RESET,
        status: AuditStatus.FAILURE,
        details: 'Failed to reset password',
        failureReason: error instanceof Error ? error.message : String(error)
      })
      throw error
    }
  }
}
import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { JwtModule } from '@nestjs/jwt'
import { PassportModule } from '@nestjs/passport'
import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'
import { JwtStrategy } from './strategies/jwt.strategy'
import { JwtAuthGuard } from './guards/jwt-auth-enhanced.guard'
import { RolesGuard } from './guards/roles.guard'
import { PermissionsGuard } from './guards/permissions.guard'
import { OwnerGuard } from './guards/owner.guard'
import { AuditService } from './services/audit.service'
import { SocialAuthService } from './services/social-auth.service'
import { GoogleAuthService } from './services/google-auth.service'
import { TokenBlacklistService, TokenBlacklist } from './services/token-blacklist.service'
import { User } from './entities/user.entity'
import { AccessAudit } from './entities/access-audit.entity'

@Module({
  imports: [
    TypeOrmModule.forFeature([User, AccessAudit, TokenBlacklist]),
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'dev-secret',
      signOptions: { expiresIn: process.env.JWT_EXPIRES_IN || '900s' }
    })
  ],
  controllers: [AuthController],
  providers: [AuthService, AuditService, SocialAuthService, GoogleAuthService, TokenBlacklistService, JwtStrategy, JwtAuthGuard, RolesGuard, PermissionsGuard, OwnerGuard],
  exports: [AuthService, AuditService, SocialAuthService, GoogleAuthService, TokenBlacklistService, JwtAuthGuard, RolesGuard, PermissionsGuard, OwnerGuard]
})
export class AuthModule {}
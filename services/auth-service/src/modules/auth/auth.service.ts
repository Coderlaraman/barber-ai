import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { User } from './entities/user.entity'
import * as bcrypt from 'bcryptjs'
import { JwtService } from '@nestjs/jwt'

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly jwt: JwtService
  ) {}

  async register(email: string, password: string, role: User['role']) {
    const exists = await this.users.findOne({ where: { email } })
    if (exists) throw new BadRequestException('EMAIL_TAKEN')
    const passwordHash = await bcrypt.hash(password, 10)
    const user = this.users.create({ email, passwordHash, role })
    await this.users.save(user)
    const accessToken = await this.jwt.signAsync({ sub: user.id, role: user.role })
    const refreshToken = await this.signRefresh(user)
    return { user: { id: user.id, email: user.email, role: user.role }, accessToken, refreshToken }
  }

  async login(email: string, password: string) {
    const user = await this.users.findOne({ where: { email } })
    if (!user) throw new UnauthorizedException('INVALID_CREDENTIALS')
    const ok = await bcrypt.compare(password, user.passwordHash)
    if (!ok) throw new UnauthorizedException('INVALID_CREDENTIALS')
    const accessToken = await this.jwt.signAsync({ sub: user.id, role: user.role })
    const refreshToken = await this.signRefresh(user)
    return { user: { id: user.id, email: user.email, role: user.role }, accessToken, refreshToken }
  }

  async refresh(refreshToken: string) {
    try {
      const payload = await this.jwt.verifyAsync(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET || 'dev-refresh'
      })
      const user = await this.users.findOne({ where: { id: payload.sub } })
      if (!user) throw new UnauthorizedException('INVALID_REFRESH')
      const accessToken = await this.jwt.signAsync({ sub: user.id, role: user.role })
      return { accessToken }
    } catch {
      throw new UnauthorizedException('INVALID_REFRESH')
    }
  }

  private async signRefresh(user: User) {
    const exp = Number(process.env.JWT_REFRESH_EXPIRES_IN || 60 * 60 * 24 * 7)
    return this.jwt.signAsync(
      { sub: user.id, role: user.role },
      { secret: process.env.JWT_REFRESH_SECRET || 'dev-refresh', expiresIn: exp }
    )
  }
}
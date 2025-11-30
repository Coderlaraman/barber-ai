import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { User } from '../entities/user.entity'
import { EmailService } from './email.service'
import * as crypto from 'crypto'

@Injectable()
export class EmailVerificationService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private emailService: EmailService
  ) {}

  generateToken(): string {
    return crypto.randomBytes(32).toString('hex')
  }

  generateExpiryDate(hours: number = 24): Date {
    const expiry = new Date()
    expiry.setHours(expiry.getHours() + hours)
    return expiry
  }

  async sendVerificationEmail(userId: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } })
    
    if (!user) {
      throw new NotFoundException('Usuario no encontrado')
    }

    if (user.emailVerified) {
      throw new BadRequestException('El email ya está verificado')
    }

    // Generar token de verificación
    const verificationToken = this.generateToken()
    const expiryDate = this.generateExpiryDate(24)

    // Actualizar usuario con el token
    user.emailVerificationToken = verificationToken
    user.emailVerificationExpires = expiryDate
    await this.userRepository.save(user)

    // Enviar email de verificación
    try {
      await this.emailService.sendVerificationEmail(
        user.email,
        verificationToken,
        user.name
      )
    } catch {
      // Si falla el envío, limpiar el token
      user.emailVerificationToken = undefined
      user.emailVerificationExpires = undefined
      await this.userRepository.save(user)
      throw new Error('Error al enviar el email de verificación')
    }
  }

  async verifyEmail(token: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { emailVerificationToken: token }
    })

    if (!user) {
      throw new NotFoundException('Token de verificación inválido')
    }

    if (user.emailVerified) {
      throw new BadRequestException('El email ya está verificado')
    }

    // Verificar si el token expiró
    if (user.emailVerificationExpires && user.emailVerificationExpires < new Date()) {
      // Limpiar token expirado
      user.emailVerificationToken = undefined
      user.emailVerificationExpires = undefined
      await this.userRepository.save(user)
      throw new BadRequestException('El token de verificación ha expirado')
    }

    // Marcar email como verificado y limpiar tokens
    user.emailVerified = true
    user.emailVerificationToken = undefined
    user.emailVerificationExpires = undefined
    
    return await this.userRepository.save(user)
  }

  async resendVerificationEmail(userId: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } })
    
    if (!user) {
      throw new NotFoundException('Usuario no encontrado')
    }

    if (user.emailVerified) {
      throw new BadRequestException('El email ya está verificado')
    }

    // Verificar si hay un token activo y no expirado
    if (user.emailVerificationToken && user.emailVerificationExpires) {
      const timeDiff = user.emailVerificationExpires.getTime() - new Date().getTime()
      const hoursRemaining = timeDiff / (1000 * 60 * 60)
      
      if (hoursRemaining > 23) { // Si queda más de 23 horas
        throw new BadRequestException('Por favor espera antes de solicitar un nuevo email de verificación')
      }
    }

    await this.sendVerificationEmail(userId)
  }

  async isEmailVerified(userId: string): Promise<boolean> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['emailVerified']
    })

    if (!user) {
      throw new NotFoundException('Usuario no encontrado')
    }

    return user.emailVerified
  }

  async requireEmailVerified(userId: string): Promise<void> {
    const isVerified = await this.isEmailVerified(userId)
    if (!isVerified) {
      throw new BadRequestException('Debes verificar tu email antes de continuar')
    }
  }
}
import { Injectable } from '@nestjs/common'

export interface EmailOptions {
  to: string
  subject: string
  text?: string
  html?: string
}

@Injectable()
export class EmailService {
  private readonly isDevelopment = process.env.NODE_ENV !== 'production'

  async sendEmail(options: EmailOptions): Promise<any> {
    if (this.isDevelopment) {
      console.log(`📧 MOCK EMAIL - Destinatario: ${options.to}`)
      console.log(`📧 MOCK EMAIL - Asunto: ${options.subject}`)
      if (options.text) {
        console.log(`📧 MOCK EMAIL - Texto: ${options.text}`)
      }
      if (options.html) {
        console.log(`📧 MOCK EMAIL - HTML: ${options.html.substring(0, 200)}...`)
      }
      return { messageId: 'mock-message-id', accepted: [options.to] }
    }

    // En producción, aquí iría la implementación real con SMTP
    // Por ahora, también usaremos mock para evitar dependencias problemáticas
    console.log(`📧 PRODUCTION MOCK - Destinatario: ${options.to}`)
    console.log(`📧 PRODUCTION MOCK - Asunto: ${options.subject}`)
    return { messageId: 'production-mock-message-id', accepted: [options.to] }
  }

  async sendVerificationEmail(email: string, verificationToken: string, userName?: string): Promise<any> {
    const verificationUrl = `${process.env.APP_URL}/auth/verify-email?token=${verificationToken}`
    const subject = 'Verifica tu cuenta - Barber AI'
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">¡Bienvenido a Barber AI!</h2>
        <p>Hola ${userName || email},</p>
        <p>Gracias por registrarte en Barber AI. Para completar tu registro, por favor verifica tu dirección de email haciendo clic en el siguiente botón:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Verificar mi Email
          </a>
        </div>
        <p>Si el botón no funciona, puedes copiar y pegar el siguiente enlace en tu navegador:</p>
        <p><a href="${verificationUrl}">${verificationUrl}</a></p>
        <p>Este enlace expirará en 24 horas por seguridad.</p>
        <p>Si no te has registrado en Barber AI, por favor ignora este email.</p>
        <hr>
        <p style="color: #666; font-size: 12px;">Este es un email automático, por favor no respondas a esta dirección.</p>
      </div>
    `

    const text = `¡Bienvenido a Barber AI!\n\nHola ${userName || email},\n\nGracias por registrarte en Barber AI. Para completar tu registro, por favor verifica tu dirección de email visitando el siguiente enlace:\n\n${verificationUrl}\n\nEste enlace expirará en 24 horas por seguridad.\n\nSi no te has registrado en Barber AI, por favor ignora este email.`

    return this.sendEmail({ to: email, subject, html, text })
  }

  async sendPasswordResetEmail(email: string, resetToken: string, userName?: string): Promise<any> {
    const resetUrl = `${process.env.APP_URL}/auth/reset-password?token=${resetToken}`
    const subject = 'Restablece tu contraseña - Barber AI'
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Restablecer Contraseña</h2>
        <p>Hola ${userName || email},</p>
        <p>Has solicitado restablecer tu contraseña en Barber AI. Haz clic en el siguiente botón para crear una nueva contraseña:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Restablecer Contraseña
          </a>
        </div>
        <p>Si el botón no funciona, puedes copiar y pegar el siguiente enlace en tu navegador:</p>
        <p><a href="${resetUrl}">${resetUrl}</a></p>
        <p>Este enlace expirará en 1 hora por seguridad.</p>
        <p>Si no has solicitado restablecer tu contraseña, por favor ignora este email.</p>
        <hr>
        <p style="color: #666; font-size: 12px;">Este es un email automático, por favor no respondas a esta dirección.</p>
      </div>
    `

    const text = `Restablecer Contraseña\n\nHola ${userName || email},\n\nHas solicitado restablecer tu contraseña en Barber AI. Visita el siguiente enlace para crear una nueva contraseña:\n\n${resetUrl}\n\nEste enlace expirará en 1 hora por seguridad.\n\nSi no has solicitado restablecer tu contraseña, por favor ignora este email.`

    return this.sendEmail({ to: email, subject, html, text })
  }
}
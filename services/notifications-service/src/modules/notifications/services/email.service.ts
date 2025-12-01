import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import * as nodemailer from 'nodemailer'
import { NotificationChannel } from '../enums/notification.enum'
import { emailTemplates, EmailTemplate } from '../templates/email-templates'

export interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
  from?: string
  bcc?: string[]
  attachments?: Array<{
    filename: string
    content: Buffer | string
    contentType?: string
  }>
  template?: string
  templateVariables?: Record<string, any>
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name)
  private transporter!: nodemailer.Transporter

  constructor(private configService: ConfigService) {
    this.initializeTransporter()
  }

  private initializeTransporter() {
    const smtpConfig = {
      host: this.configService.get<string>('SMTP_HOST', 'smtp.gmail.com'),
      port: this.configService.get<number>('SMTP_PORT', 587),
      secure: this.configService.get<boolean>('SMTP_SECURE', false),
      auth: {
        user: this.configService.get<string>('SMTP_USER'),
        pass: this.configService.get<string>('SMTP_PASSWORD'),
      },
    }

    // Si no hay credenciales SMTP, usar mock para desarrollo
    if (!smtpConfig.auth.user || !smtpConfig.auth.pass) {
      this.logger.warn('SMTP credentials not configured, using mock transport')
      this.transporter = nodemailer.createTransport({
        jsonTransport: true,
      })
    } else {
      this.transporter = nodemailer.createTransport(smtpConfig)
    }
  }

  async sendEmail(options: EmailOptions): Promise<{ messageId: string; success: boolean }> {
    try {
      let { subject, html, text } = options

      // If template is specified, render it with variables
      if (options.template && emailTemplates[options.template]) {
        const template = emailTemplates[options.template]
        const variables = {
          ...this.getDefaultTemplateVariables(),
          ...options.templateVariables,
        }

        subject = this.renderTemplate(template.subject, variables)
        html = this.renderTemplate(template.htmlTemplate, variables)
        text = template.textTemplate ? this.renderTemplate(template.textTemplate, variables) : undefined
      } else if (options.templateVariables) {
        // Render inline HTML/text with variables
        subject = this.renderTemplate(options.subject, options.templateVariables)
        html = this.renderTemplate(options.html, options.templateVariables)
        text = options.text ? this.renderTemplate(options.text, options.templateVariables) : undefined
      }

      const mailOptions = {
        from: options.from || this.configService.get<string>('SMTP_FROM', 'noreply@barber_ai.com'),
        to: options.to,
        subject: subject,
        html: html,
        text: text,
        bcc: options.bcc,
        attachments: options.attachments,
      }

      this.logger.log(`Sending email to ${options.to} with subject: ${subject}`)
      
      const result = await this.transporter.sendMail(mailOptions)
      
      this.logger.log(`Email sent successfully. Message ID: ${result.messageId}`)
      
      return {
        messageId: result.messageId,
        success: true,
      }
    } catch (error) {
      this.logger.error(`Failed to send email to ${options.to}:`, error)
      throw new Error(`Email sending failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  getChannel(): NotificationChannel {
    return NotificationChannel.EMAIL
  }

  /**
   * Render a template string with variables
   */
  private renderTemplate(template: string, variables: Record<string, any>): string {
    if (!variables || Object.keys(variables).length === 0) {
      return template
    }

    let rendered = template
    
    // Replace {{variable}} with actual values
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g')
      rendered = rendered.replace(regex, String(value))
    })

    // Log warning for unmatched variables
    const unmatchedVariables = rendered.match(/{{\s*\w+\s*}}/g)
    if (unmatchedVariables) {
      this.logger.warn(`Unmatched template variables: ${unmatchedVariables.join(', ')}`)
    }

    return rendered
  }

  /**
   * Get default template variables that are commonly used
   */
  private getDefaultTemplateVariables(): Record<string, any> {
    return {
      appName: this.configService.get<string>('APP_NAME', 'Barbería'),
      year: new Date().getFullYear(),
      supportEmail: this.configService.get<string>('SUPPORT_EMAIL', 'support@barber_ai.com'),
    }
  }

  /**
   * Validate email address format
   */
  private validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  /**
   * Send bulk emails with rate limiting
   */
  async sendBulkEmails(emails: EmailOptions[], batchSize: number = 10): Promise<Array<{ messageId: string; success: boolean; error?: string }>> {
    const results: Array<{ messageId: string; success: boolean; error?: string }> = []
    
    for (let i = 0; i < emails.length; i += batchSize) {
      const batch = emails.slice(i, i + batchSize)
      const batchResults = await Promise.allSettled(
        batch.map(email => this.sendEmail(email))
      )
      
      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.push({
            messageId: result.value.messageId,
            success: result.value.success,
          })
        } else {
          results.push({
            messageId: '',
            success: false,
            error: result.reason.message,
          })
        }
      })
      
      // Add delay between batches to avoid rate limiting
      if (i + batchSize < emails.length) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }
    
    return results
  }
}
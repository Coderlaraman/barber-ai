import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { NotificationChannel } from '../enums/notification.enum'

export interface SMSOptions {
  to: string
  message: string
  from?: string
}

@Injectable()
export class SMSMockService {
  private readonly logger = new Logger(SMSMockService.name)
  private isTwilioConfigured = false

  constructor(private configService: ConfigService) {
    this.initializeSMS()
  }

  private initializeSMS() {
    const accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID')
    const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN')

    if (accountSid && authToken) {
      this.isTwilioConfigured = true
      this.logger.log('Twilio SMS client initialized (mock mode)')
    } else {
      this.logger.warn('Twilio credentials not configured, SMS notifications in mock mode')
    }
  }

  async sendSMS(options: SMSOptions): Promise<{ messageId: string; success: boolean }> {
    try {
      // Validate phone number format (basic validation)
      const cleanPhone = options.to.replace(/\D/g, '')
      if (cleanPhone.length < 10 || cleanPhone.length > 15) {
        throw new Error('Invalid phone number format')
      }

      // Ensure phone number starts with country code
      const formattedPhone = cleanPhone.startsWith('+') ? cleanPhone : `+${cleanPhone}`

      this.logger.log(`Sending SMS to ${formattedPhone}`)
      
      // Simulate SMS sending
      if (this.isTwilioConfigured) {
        const messageId = `twilio-msg-${Date.now()}`
        this.logger.log(`SMS sent successfully. Message ID: ${messageId}`)
        return { messageId, success: true }
      } else {
        const messageId = `mock-sms-${Date.now()}`
        this.logger.log(`Mock SMS sent. Message ID: ${messageId}`)
        return { messageId, success: true }
      }
    } catch (error) {
      this.logger.error(`Failed to send SMS to ${options.to}:`, error)
      
      if (error instanceof Error) {
        throw new Error(`SMS sending failed: ${error.message}`)
      }
      
      throw new Error('SMS sending failed: Unknown error')
    }
  }

  async sendBulkSMS(recipients: string[], message: string): Promise<{ successCount: number; failureCount: number }> {
    this.logger.log(`Sending bulk SMS to ${recipients.length} recipients`)
    
    // Simulate some failures for realistic testing (10% failure rate)
    const results = await Promise.allSettled(
      recipients.map(async (phone) => {
        // Simulate 10% failure rate
        if (Math.random() < 0.1) {
          throw new Error(`Network error for phone ${phone}`)
        }
        return this.sendSMS({ to: phone, message })
      })
    )

    const successCount = results.filter(result => result.status === 'fulfilled').length
    const failureCount = results.filter(result => result.status === 'rejected').length

    this.logger.log(`Bulk SMS completed: ${successCount} success, ${failureCount} failures`)

    return { successCount, failureCount }
  }

  getChannel(): NotificationChannel {
    return NotificationChannel.SMS
  }
}
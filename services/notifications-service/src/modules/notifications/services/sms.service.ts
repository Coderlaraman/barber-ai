import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import twilio from 'twilio'
import { NotificationChannel } from '../enums/notification.enum'

export interface SMSOptions {
  to: string
  message: string
  from?: string
}

@Injectable()
export class SMSService {
  private readonly logger = new Logger(SMSService.name)
  private twilioClient: twilio.Twilio | null = null

  constructor(private configService: ConfigService) {
    this.initializeTwilio()
  }

  private initializeTwilio() {
    const accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID')
    const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN')

    if (accountSid && authToken) {
      this.twilioClient = twilio(accountSid, authToken)
      this.logger.log('Twilio SMS client initialized')
    } else {
      this.logger.warn('Twilio credentials not configured, SMS notifications disabled')
    }
  }

  async sendSMS(options: SMSOptions): Promise<{ messageId: string; success: boolean }> {
    if (!this.twilioClient) {
      this.logger.warn('Twilio not configured, skipping SMS')
      return { messageId: 'mock-sms-id', success: true }
    }

    try {
      const fromNumber = options.from || this.configService.get<string>('TWILIO_FROM_NUMBER')
      
      if (!fromNumber) {
        throw new Error('Twilio from number not configured')
      }

      // Validate phone number format (basic validation)
      const cleanPhone = options.to.replace(/\D/g, '')
      if (cleanPhone.length < 10 || cleanPhone.length > 15) {
        throw new Error('Invalid phone number format')
      }

      // Ensure phone number starts with country code
      const formattedPhone = cleanPhone.startsWith('+') ? cleanPhone : `+${cleanPhone}`

      this.logger.log(`Sending SMS to ${formattedPhone}`)
      
      const result = await this.twilioClient.messages.create({
        body: options.message,
        from: fromNumber,
        to: formattedPhone,
      })
      
      this.logger.log(`SMS sent successfully. Message ID: ${result.sid}`)
      
      return {
        messageId: result.sid,
        success: true,
      }
    } catch (error) {
      this.logger.error(`Failed to send SMS to ${options.to}:`, error)
      
      // Handle specific Twilio errors
      if (error instanceof Error) {
        if ('code' in error && error.code === 21211) {
          throw new Error('Invalid phone number')
        } else if ('code' in error && error.code === 21608) {
          throw new Error('Phone number not verified in trial mode')
        }
        throw new Error(`SMS sending failed: ${error.message}`)
      }
      
      throw new Error('SMS sending failed: Unknown error')
    }
  }

  async sendBulkSMS(recipients: string[], message: string): Promise<{ successCount: number; failureCount: number }> {
    if (!this.twilioClient) {
      this.logger.warn('Twilio not configured, skipping bulk SMS')
      return { successCount: recipients.length, failureCount: 0 }
    }

    const results = await Promise.allSettled(
      recipients.map(phone => this.sendSMS({ to: phone, message }))
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
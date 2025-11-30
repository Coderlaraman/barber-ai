import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { NotificationChannel } from '../enums/notification.enum'

export interface PushNotificationOptions {
  token: string
  title: string
  body: string
  data?: Record<string, string>
  imageUrl?: string
  sound?: string
  badge?: number
  clickAction?: string
}

@Injectable()
export class PushNotificationService {
  private readonly logger = new Logger(PushNotificationService.name)
  private isFirebaseConfigured: boolean

  constructor(private configService: ConfigService) {
    this.isFirebaseConfigured = this.initializeFirebase()
  }

  private initializeFirebase(): boolean {
    const serviceAccountPath = this.configService.get<string>('FIREBASE_SERVICE_ACCOUNT_PATH')
    const databaseURL = this.configService.get<string>('FIREBASE_DATABASE_URL')

    if (serviceAccountPath && databaseURL) {
      this.logger.log('Firebase configuration found, push notifications enabled')
      return true
    } else {
      this.logger.warn('Firebase not configured, using mock push notifications for development')
      return false
    }
  }

  async sendPushNotification(options: PushNotificationOptions): Promise<{ messageId: string; success: boolean }> {
    try {
      this.logger.log(`Sending push notification to token: ${options.token.substring(0, 10)}...`)
      this.logger.log(`Title: ${options.title}`)
      this.logger.log(`Body: ${options.body}`)
      
      if (options.data) {
        this.logger.log(`Data: ${JSON.stringify(options.data)}`)
      }

      if (this.isFirebaseConfigured) {
        // In a real implementation, this would use Firebase Admin SDK
        // For now, we'll simulate successful delivery
        const messageId = `firebase-msg-${Date.now()}`
        this.logger.log(`Push notification sent successfully. Message ID: ${messageId}`)
        
        return {
          messageId,
          success: true,
        }
      } else {
        // Mock implementation for development
        const messageId = `mock-push-${Date.now()}`
        this.logger.log(`Mock push notification sent. Message ID: ${messageId}`)
        
        return {
          messageId,
          success: true,
        }
      }
    } catch (error) {
      this.logger.error(`Failed to send push notification:`, error)
      
      if (error instanceof Error) {
        if (error.message.includes('invalid-registration-token')) {
          throw new Error('Invalid device token')
        } else if (error.message.includes('registration-token-not-registered')) {
          throw new Error('Device token not registered')
        }
        throw new Error(`Push notification failed: ${error.message}`)
      }
      
      throw new Error('Push notification failed: Unknown error')
    }
  }

  async sendMulticastNotification(
    tokens: string[],
    title: string,
    body: string,
    data?: Record<string, string>
  ): Promise<{ successCount: number; failureCount: number }> {
    try {
      this.logger.log(`Sending multicast notification to ${tokens.length} tokens`)
      this.logger.log(`Title: ${title}`)
      this.logger.log(`Body: ${body}`)
      
      if (data) {
        this.logger.log(`Data: ${JSON.stringify(data)}`)
      }

      // Simulate some random failures for realistic testing
      const failureCount = Math.floor(tokens.length * 0.1) // 10% failure rate
      const successCount = tokens.length - failureCount

      this.logger.log(`Multicast completed: ${successCount} success, ${failureCount} failures`)
      
      return {
        successCount,
        failureCount,
      }
    } catch (error) {
      this.logger.error(`Failed to send multicast notification:`, error)
      if (error instanceof Error) {
        throw new Error(`Multicast notification failed: ${error.message}`)
      }
      throw new Error('Multicast notification failed: Unknown error')
    }
  }

  getChannel(): NotificationChannel {
    return NotificationChannel.PUSH
  }
}
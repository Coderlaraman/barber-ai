import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import * as admin from 'firebase-admin'
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
  private firebaseApp!: admin.app.App

  constructor(private configService: ConfigService) {
    this.initializeFirebase()
  }

  private initializeFirebase() {
    try {
      const serviceAccountPath = this.configService.get<string>('FIREBASE_SERVICE_ACCOUNT_PATH')
      const databaseURL = this.configService.get<string>('FIREBASE_DATABASE_URL')

      if (serviceAccountPath) {
        this.firebaseApp = admin.initializeApp({
          credential: admin.credential.cert(serviceAccountPath),
          databaseURL,
        })
        this.logger.log('Firebase initialized successfully')
      } else {
        this.logger.warn('Firebase service account not configured, push notifications disabled')
      }
    } catch (error) {
      this.logger.error('Failed to initialize Firebase:', error)
      throw error
    }
  }

  async sendPushNotification(options: PushNotificationOptions): Promise<{ messageId: string; success: boolean }> {
    if (!this.firebaseApp) {
      this.logger.warn('Firebase not configured, skipping push notification')
      return { messageId: 'mock-message-id', success: true }
    }

    try {
      const message: admin.messaging.Message = {
        token: options.token,
        notification: {
          title: options.title,
          body: options.body,
          imageUrl: options.imageUrl,
        },
        data: options.data,
        android: {
          notification: {
            sound: options.sound || 'default',
            clickAction: options.clickAction,
          },
        },
        apns: {
          payload: {
            aps: {
              sound: options.sound || 'default',
              badge: options.badge,
            },
          },
        },
      }

      this.logger.log(`Sending push notification to token: ${options.token.substring(0, 10)}...`)
      
      const result = await admin.messaging().send(message)
      
      this.logger.log(`Push notification sent successfully. Message ID: ${result}`)
      
      return {
        messageId: result,
        success: true,
      }
    } catch (error) {
      this.logger.error(`Failed to send push notification:`, error)
      
      // Handle specific Firebase errors
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
    if (!this.firebaseApp) {
      this.logger.warn('Firebase not configured, skipping multicast notification')
      return { successCount: tokens.length, failureCount: 0 }
    }

    try {
      const message: admin.messaging.MulticastMessage = {
        tokens,
        notification: {
          title,
          body,
        },
        data,
      }

      this.logger.log(`Sending multicast notification to ${tokens.length} tokens`)
      
      const result = await admin.messaging().sendEachForMulticast(message)
      
      this.logger.log(`Multicast completed: ${result.successCount} success, ${result.failureCount} failures`)
      
      return {
        successCount: result.successCount,
        failureCount: result.failureCount,
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
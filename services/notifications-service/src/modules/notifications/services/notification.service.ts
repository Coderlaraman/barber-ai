import { Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '../../../typeorm-mock'
import { Repository } from '../../../typeorm-mock'
import { Notification } from '../entities/notification.entity'
import { UserNotificationPreference } from '../entities/user-notification-preference.entity'
import { CreateNotificationDto } from '../dto/create-notification.dto'
import { NotificationStatus, NotificationChannel, NotificationType } from '../enums/notification.enum'
import { EmailService } from './email.service'
import { PushNotificationService } from './push-notification.service'
import { SMSService } from './sms.service'
import { TemplateService } from './template.service'

export interface NotificationResult {
  success: boolean
  messageId?: string
  error?: string
  channel: NotificationChannel
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name)

  constructor(
    // @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
    // @InjectRepository(UserNotificationPreference)
    private preferenceRepository: Repository<UserNotificationPreference>,
    private emailService: EmailService,
    private pushService: PushNotificationService,
    private smsService: SMSService,
    private templateService: TemplateService
  ) {
    // Initialize mock repositories for testing
    this.notificationRepository = {
      findOne: async (): Promise<Notification | null> => null,
      find: async (): Promise<Notification[]> => [],
      save: async (entity: Notification): Promise<Notification> => entity,
      create: (entity: Partial<Notification>): Notification => entity as Notification,
      delete: async (): Promise<void> => {},
      update: async (): Promise<void> => {},
      count: async (): Promise<number> => 0
    } as any
    
    this.preferenceRepository = {
      findOne: async (): Promise<UserNotificationPreference | null> => null,
      find: async (): Promise<UserNotificationPreference[]> => [],
      save: async (entity: UserNotificationPreference): Promise<UserNotificationPreference> => entity,
      create: (entity: Partial<UserNotificationPreference>): UserNotificationPreference => entity as UserNotificationPreference,
      delete: async (): Promise<void> => {},
      update: async (): Promise<void> => {},
      count: async (): Promise<number> => 0
    } as any
  }

  async createNotification(dto: CreateNotificationDto): Promise<Notification> {
    const notificationData = {
      ...dto,
      scheduledFor: dto.scheduledFor ? new Date(dto.scheduledFor) : undefined,
      status: NotificationStatus.PENDING,
      retryCount: 0,
      maxRetries: 3,
    }
    
    const notification = this.notificationRepository.create(notificationData)
    return this.notificationRepository.save(notification)
  }

  async sendNotification(notification: Notification): Promise<NotificationResult[]> {
    const results: NotificationResult[] = []
    
    // Check user preferences
    const preferences = await this.getUserPreferences(notification.userId)
    
    if (!preferences.isChannelEnabled(notification.channel)) {
      this.logger.log(`Channel ${notification.channel} disabled for user ${notification.userId}`)
      return [{
        success: false,
        error: 'Channel disabled by user preference',
        channel: notification.channel,
      }]
    }

    if (!preferences.isNotificationTypeEnabled(notification.type)) {
      this.logger.log(`Notification type ${notification.type} disabled for user ${notification.userId}`)
      return [{
        success: false,
        error: 'Notification type disabled by user preference',
        channel: notification.channel,
      }]
    }

    // Check quiet hours
    if (this.isQuietHours(preferences)) {
      this.logger.log(`Quiet hours active for user ${notification.userId}, scheduling for later`)
      notification.scheduledFor = this.getNextAvailableTime(preferences)
      await this.notificationRepository.save(notification)
      return [{
        success: false,
        error: 'Quiet hours active, notification scheduled',
        channel: notification.channel,
      }]
    }

    try {
      // Render template if templateId is provided
      let renderedContent = {
        title: notification.title,
        content: notification.content,
        subject: undefined as string | undefined,
      }

      if (notification.templateId) {
        const template = await this.templateService.getTemplate(
          notification.type,
          notification.channel
        )
        
        if (template) {
          const rendered = await this.templateService.renderNotification(
            notification.type,
            notification.channel,
            notification.metadata || {},
            preferences.timezone
          )
          renderedContent = {
            subject: rendered.subject || '',
            title: rendered.title || '',
            content: rendered.content
          }
        }
      }

      // Send notification based on channel
      const result = await this.sendViaChannel(notification, renderedContent)
      results.push(result)

      // Update notification status
      if (result.success) {
        notification.status = NotificationStatus.SENT
        notification.sentAt = new Date()
        notification.errorMessage = undefined
      } else {
        notification.status = NotificationStatus.FAILED
        notification.errorMessage = result.error
        notification.retryCount++
      }

      await this.notificationRepository.save(notification)
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      this.logger.error(`Failed to send notification ${notification.id}:`, error)
      
      notification.status = NotificationStatus.FAILED
      notification.errorMessage = errorMessage
      notification.retryCount++
      
      await this.notificationRepository.save(notification)
      
      results.push({
        success: false,
        error: errorMessage,
        channel: notification.channel,
      })
    }

    return results
  }

  private async sendViaChannel(
    notification: Notification,
    renderedContent: { title: string; content: string; subject?: string }
  ): Promise<NotificationResult> {
    switch (notification.channel) {
      case NotificationChannel.EMAIL:
        return this.sendEmailNotification(notification, renderedContent)
      
      case NotificationChannel.PUSH:
        return this.sendPushNotification(notification, renderedContent)
      
      case NotificationChannel.SMS:
        return this.sendSMSNotification(notification, renderedContent)
      
      case NotificationChannel.IN_APP:
        return this.sendInAppNotification(notification, renderedContent)
      
      default:
        throw new Error(`Unsupported notification channel: ${notification.channel}`)
    }
  }

  private async sendEmailNotification(
    notification: Notification,
    content: { title: string; content: string; subject?: string }
  ): Promise<NotificationResult> {
    try {
      // Get user email from metadata or user service (TODO: integrate with user service)
      const userEmail = notification.metadata?.email || notification.metadata?.userEmail || 'user@example.com'
      
      // Validate email format
      if (!this.isValidEmail(userEmail)) {
        throw new Error(`Invalid email address: ${userEmail}`)
      }

      // Determine if we should use a template or inline content
      const templateName = this.getEmailTemplateName(notification.type)
      
      let emailOptions: any = {
        to: userEmail,
      }

      if (templateName && notification.metadata?.templateVariables) {
        // Use template with variables
        emailOptions.template = templateName
        emailOptions.templateVariables = {
          ...notification.metadata.templateVariables,
          userName: notification.metadata.userName || 'Usuario',
        }
      } else {
        // Use inline content
        emailOptions.subject = content.subject || content.title
        emailOptions.html = content.content
        emailOptions.text = this.stripHtml(content.content)
        
        // Add template variables if available
        if (notification.metadata?.templateVariables) {
          emailOptions.templateVariables = notification.metadata.templateVariables
        }
      }

      const result = await this.emailService.sendEmail(emailOptions)

      return {
        success: true,
        messageId: result.messageId,
        channel: NotificationChannel.EMAIL,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        channel: NotificationChannel.EMAIL,
      }
    }
  }

  private async sendPushNotification(
    notification: Notification,
    content: { title: string; content: string }
  ): Promise<NotificationResult> {
    try {
      // Get device token from metadata
      const deviceToken = notification.metadata?.deviceToken
      
      if (!deviceToken) {
        throw new Error('Device token not provided')
      }

      const result = await this.pushService.sendPushNotification({
        token: deviceToken,
        title: content.title,
        body: content.content,
        data: {
          notificationId: notification.id,
          type: notification.type,
          ...notification.metadata,
        },
      })

      return {
        success: true,
        messageId: result.messageId,
        channel: NotificationChannel.PUSH,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        channel: NotificationChannel.PUSH,
      }
    }
  }

  private async sendSMSNotification(
    notification: Notification,
    content: { content: string }
  ): Promise<NotificationResult> {
    try {
      // Get phone number from metadata
      const phoneNumber = notification.metadata?.phoneNumber
      
      if (!phoneNumber) {
        throw new Error('Phone number not provided')
      }

      const result = await this.smsService.sendSMS({
        to: phoneNumber,
        message: content.content,
      })

      return {
        success: true,
        messageId: result.messageId,
        channel: NotificationChannel.SMS,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        channel: NotificationChannel.SMS,
      }
    }
  }

  private async sendInAppNotification(
    notification: Notification,
    content: { title: string; content: string }
  ): Promise<NotificationResult> {
    try {
      // Store in-app notification (this could be enhanced with WebSocket for real-time delivery)
      // For now, we'll just mark it as delivered
      
      return {
        success: true,
        messageId: `inapp-${notification.id}`,
        channel: NotificationChannel.IN_APP,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        channel: NotificationChannel.IN_APP,
      }
    }
  }

  async getUserPreferences(userId: string): Promise<UserNotificationPreference> {
    let preferences = await this.preferenceRepository.findOne({ where: { userId } })
    
    if (!preferences) {
      // Create default preferences
      preferences = this.preferenceRepository.create({ userId })
      preferences = await this.preferenceRepository.save(preferences)
    }
    
    return preferences
  }

  private isQuietHours(preferences: UserNotificationPreference): boolean {
    if (!preferences.quietHoursStart || !preferences.quietHoursEnd) {
      return false
    }

    const now = new Date()
    const currentTime = now.getHours() * 60 + now.getMinutes()
    
    const [startHour, startMinute] = preferences.quietHoursStart.split(':').map(Number)
    const [endHour, endMinute] = preferences.quietHoursEnd.split(':').map(Number)
    
    const startTime = startHour * 60 + startMinute
    const endTime = endHour * 60 + endMinute

    if (startTime <= endTime) {
      return currentTime >= startTime && currentTime <= endTime
    } else {
      // Quiet hours span midnight
      return currentTime >= startTime || currentTime <= endTime
    }
  }

  private getNextAvailableTime(preferences: UserNotificationPreference): Date {
    const now = new Date()
    
    if (!preferences.quietHoursEnd) {
      return new Date(now.getTime() + 60 * 60 * 1000) // 1 hour from now
    }

    const [endHour, endMinute] = preferences.quietHoursEnd.split(':').map(Number)
    const nextTime = new Date(now)
    nextTime.setHours(endHour, endMinute, 0, 0)

    if (nextTime <= now) {
      nextTime.setDate(nextTime.getDate() + 1)
    }

    return nextTime
  }

  private stripHtml(html: string): string {
    return html
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .trim()
  }

  async getNotificationHistory(userId: string, limit: number = 50): Promise<Notification[]> {
    return this.notificationRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
    })
  }

  async markAsRead(notificationId: string): Promise<void> {
    await this.notificationRepository.update(notificationId, {
      status: NotificationStatus.READ,
      readAt: new Date(),
    })
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationRepository.count({
      where: {
        userId,
        status: NotificationStatus.SENT,
        readAt: null,
      },
    })
  }

  async retryFailedNotifications(): Promise<number> {
    const failedNotifications = await this.notificationRepository.find({
      where: {
        status: NotificationStatus.FAILED,
        retryCount: { $lt: 3 }, // TypeORM syntax for less than
      },
    })

    let retriedCount = 0

    for (const notification of failedNotifications) {
      try {
        await this.sendNotification(notification)
        retriedCount++
      } catch (error) {
        this.logger.error(`Failed to retry notification ${notification.id}:`, error)
      }
    }

    return retriedCount
  }

  /**
   * Get email template name based on notification type
   */
  private getEmailTemplateName(notificationType: NotificationType): string | null {
    const templateMap: Partial<Record<NotificationType, string>> = {
      [NotificationType.APPOINTMENT_CONFIRMED]: 'booking_confirmation',
      [NotificationType.APPOINTMENT_REMINDER]: 'booking_reminder',
      [NotificationType.APPOINTMENT_CANCELLED]: 'booking_cancelled',
      [NotificationType.APPOINTMENT_RESCHEDULED]: 'booking_rescheduled',
      [NotificationType.APPOINTMENT_COMPLETED]: 'appointment_completed',
      [NotificationType.PAYMENT_CONFIRMED]: 'payment_confirmation',
      [NotificationType.PAYMENT_FAILED]: 'payment_failed',
      [NotificationType.PAYMENT_REMINDER]: 'payment_reminder',
      [NotificationType.REFUND_PROCESSED]: 'refund_processed',
      [NotificationType.REVIEW_REQUEST]: 'review_request',
      [NotificationType.REVIEW_RECEIVED]: 'review_received',
      [NotificationType.WELCOME]: 'welcome',
      [NotificationType.EMAIL_VERIFICATION]: 'email_verification',
      [NotificationType.PASSWORD_RESET]: 'password_reset',
      [NotificationType.PROFILE_UPDATED]: 'profile_updated',
      [NotificationType.NEW_BOOKING]: 'new_booking',
      [NotificationType.BOOKING_CANCELLED]: 'booking_cancelled',
      [NotificationType.BOOKING_REMINDER]: 'booking_reminder',
      [NotificationType.AVAILABILITY_REMINDER]: 'availability_reminder',
      [NotificationType.SYSTEM_UPDATE]: 'system_update',
      [NotificationType.MAINTENANCE_NOTICE]: 'maintenance_notice',
      [NotificationType.PROMOTIONAL]: 'promotion',
      [NotificationType.SPECIAL_OFFER]: 'special_offer',
      [NotificationType.LOYALTY_REWARD]: 'loyalty_reward',
    }

    return templateMap[notificationType] || null
  }

  /**
   * Validate email address format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

}
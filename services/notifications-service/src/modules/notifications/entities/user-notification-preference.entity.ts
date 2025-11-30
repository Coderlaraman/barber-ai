import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index, Unique } from '../../../typeorm-mock'
import { NotificationChannel } from '../enums/notification.enum'

@Entity('user_notification_preferences')
@Unique(['userId'])
@Index(['userId'])
export class UserNotificationPreference {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ name: 'user_id', type: 'uuid', nullable: false })
  userId!: string

  @Column({ name: 'email_enabled', type: 'boolean', default: true })
  emailEnabled!: boolean

  @Column({ name: 'push_enabled', type: 'boolean', default: true })
  pushEnabled!: boolean

  @Column({ name: 'sms_enabled', type: 'boolean', default: false })
  smsEnabled!: boolean

  @Column({ name: 'in_app_enabled', type: 'boolean', default: true })
  inAppEnabled!: boolean

  @Column({ name: 'quiet_hours_start', type: 'time', nullable: true })
  quietHoursStart?: string

  @Column({ name: 'quiet_hours_end', type: 'time', nullable: true })
  quietHoursEnd?: string

  @Column({ name: 'timezone', type: 'varchar', length: 50, default: 'America/Mexico_City' })
  timezone!: string

  @Column({ name: 'appointment_reminders', type: 'boolean', default: true })
  appointmentReminders!: boolean

  @Column({ name: 'promotional_emails', type: 'boolean', default: true })
  promotionalEmails!: boolean

  @Column({ name: 'booking_confirmations', type: 'boolean', default: true })
  bookingConfirmations!: boolean

  @Column({ name: 'payment_notifications', type: 'boolean', default: true })
  paymentNotifications!: boolean

  @Column({ name: 'review_requests', type: 'boolean', default: true })
  reviewRequests!: boolean

  @Column({ name: 'system_updates', type: 'boolean', default: true })
  systemUpdates!: boolean

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date

  isChannelEnabled(channel: NotificationChannel): boolean {
    switch (channel) {
      case NotificationChannel.EMAIL:
        return this.emailEnabled
      case NotificationChannel.PUSH:
        return this.pushEnabled
      case NotificationChannel.SMS:
        return this.smsEnabled
      case NotificationChannel.IN_APP:
        return this.inAppEnabled
      default:
        return false
    }
  }

  isNotificationTypeEnabled(type: string): boolean {
    switch (type) {
      case 'appointment_reminder':
        return this.appointmentReminders
      case 'promotional':
        return this.promotionalEmails
      case 'booking_confirmation':
        return this.bookingConfirmations
      case 'payment':
        return this.paymentNotifications
      case 'review_request':
        return this.reviewRequests
      case 'system_update':
        return this.systemUpdates
      default:
        return true
    }
  }
}
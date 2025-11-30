import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from '../../../typeorm-mock'
import { NotificationChannel, NotificationStatus, NotificationType } from '../enums/notification.enum'

@Entity('notifications')
@Index(['userId', 'status'])
@Index(['type', 'status'])
@Index(['createdAt'])
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ name: 'user_id', type: 'uuid', nullable: false })
  userId!: string

  @Column({ name: 'type', type: 'enum', enum: NotificationType, nullable: false })
  type!: NotificationType

  @Column({ name: 'channel', type: 'enum', enum: NotificationChannel, nullable: false })
  channel!: NotificationChannel

  @Column({ name: 'status', type: 'enum', enum: NotificationStatus, default: NotificationStatus.PENDING })
  status!: NotificationStatus

  @Column({ name: 'title', type: 'varchar', length: 255, nullable: false })
  title!: string

  @Column({ name: 'content', type: 'text', nullable: false })
  content!: string

  @Column({ name: 'metadata', type: 'jsonb', nullable: true })
  metadata?: Record<string, any>

  @Column({ name: 'template_id', type: 'varchar', length: 100, nullable: true })
  templateId?: string

  @Column({ name: 'scheduled_for', type: 'timestamp', nullable: true })
  scheduledFor?: Date

  @Column({ name: 'sent_at', type: 'timestamp', nullable: true })
  sentAt?: Date

  @Column({ name: 'delivered_at', type: 'timestamp', nullable: true })
  deliveredAt?: Date

  @Column({ name: 'read_at', type: 'timestamp', nullable: true })
  readAt?: Date

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage?: string

  @Column({ name: 'retry_count', type: 'integer', default: 0 })
  retryCount!: number

  @Column({ name: 'max_retries', type: 'integer', default: 3 })
  maxRetries!: number

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date
}
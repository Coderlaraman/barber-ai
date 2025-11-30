import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index, Unique } from '../../../typeorm-mock'
import { NotificationChannel, NotificationType } from '../enums/notification.enum'

@Entity('notification_templates')
@Unique(['type', 'channel', 'language'])
@Index(['type', 'channel'])
export class NotificationTemplate {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ name: 'type', type: 'enum', enum: NotificationType, nullable: false })
  type!: NotificationType

  @Column({ name: 'channel', type: 'enum', enum: NotificationChannel, nullable: false })
  channel!: NotificationChannel

  @Column({ name: 'language', type: 'varchar', length: 5, default: 'es' })
  language!: string

  @Column({ name: 'name', type: 'varchar', length: 100, nullable: false })
  name!: string

  @Column({ name: 'subject', type: 'varchar', length: 255, nullable: true })
  subject?: string

  @Column({ name: 'title_template', type: 'text', nullable: true })
  titleTemplate?: string

  @Column({ name: 'content_template', type: 'text', nullable: false })
  contentTemplate!: string

  @Column({ name: 'variables', type: 'jsonb', nullable: true })
  variables?: string[]

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean

  @Column({ name: 'description', type: 'text', nullable: true })
  description?: string

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date
}
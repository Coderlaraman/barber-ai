import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm'

@Entity('events')
export class EventEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ unique: true })
  @Index()
  eventId!: string

  @Column()
  @Index()
  eventType!: string

  @Column()
  @Index()
  aggregateId!: string

  @Column()
  @Index()
  aggregateType!: string

  @Column()
  timestamp!: string

  @Column()
  version!: number

  @Column('jsonb')
  payload!: any

  @Column('jsonb', { nullable: true })
  metadata?: any

  @Column('timestamp')
  createdAt!: Date

  @Column('timestamp', { nullable: true })
  processedAt?: Date

  @Column({ default: 0 })
  retryCount!: number

  @Column({ default: 'PENDING' })
  status!: 'PENDING' | 'PROCESSED' | 'FAILED' | 'DEAD_LETTER' | 'REPLAYED'

  @Column({ nullable: true })
  errorMessage?: string
}
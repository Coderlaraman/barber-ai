import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm'

export enum RatingStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

export enum RatingType {
  SERVICE = 'SERVICE',
  PRODUCT = 'PRODUCT'
}

@Entity('ratings')
export class Rating {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ name: 'appointment_id' })
  appointmentId: string

  @Column({ name: 'barber_id' })
  barberId: string

  @Column({ name: 'client_id' })
  clientId: string

  @Column({ name: 'service_id', nullable: true })
  serviceId: string

  @Column({ type: 'enum', enum: RatingType, default: RatingType.SERVICE })
  type: RatingType

  @Column({ type: 'int', name: 'rating' }) // Renamed from score to match service usage
  rating: number

  @Column({ type: 'text', nullable: true })
  comment: string

  @Column({ type: 'jsonb', nullable: true })
  aspects: Record<string, number>

  @Column({ type: 'simple-array', nullable: true })
  photos: string[]

  @Column({ type: 'boolean', default: false, name: 'is_verified' })
  isVerified: boolean

  @Column({ type: 'boolean', default: false, name: 'is_featured' })
  isFeatured: boolean

  @Column({ type: 'int', default: 0, name: 'helpful_count' })
  helpfulCount: number

  @Column({ type: 'int', default: 0, name: 'report_count' })
  reportCount: number

  @Column({ type: 'enum', enum: RatingStatus, default: RatingStatus.PENDING })
  status: RatingStatus

  @Column({ type: 'text', nullable: true, name: 'rejection_reason' })
  rejectionReason: string

  @Column({ name: 'created_by', nullable: true })
  createdBy: string

  @Column({ name: 'updated_by', nullable: true })
  updatedBy: string

  @Column({ name: 'moderated_by', nullable: true })
  moderatedBy: string

  @Column({ name: 'moderated_at', nullable: true })
  moderatedAt: Date

  @Column({ type: 'boolean', default: false, name: 'is_deleted' })
  isDeleted: boolean

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date

  markAsHelpful() {
    this.helpfulCount++
  }

  flag() {
    this.reportCount++
  }
}

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
} from 'typeorm'
import { Transaction } from './transaction.entity'

export enum CommissionType {
  BOOKING = 'BOOKING',
  SUBSCRIPTION = 'SUBSCRIPTION',
  SERVICE = 'SERVICE',
  PRODUCT = 'PRODUCT',
}

export enum CommissionStatus {
  PENDING = 'PENDING',
  CALCULATED = 'CALCULATED',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED',
}

export enum CommissionCalculationType {
  PERCENTAGE = 'PERCENTAGE',
  FIXED = 'FIXED',
  TIERED = 'TIERED',
}

@Entity('commissions')
@Index(['barberId', 'status'])
@Index(['bookingId'])
@Index(['status', 'createdAt'])
export class Commission {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'uuid', nullable: false })
  barberId: string

  @Column({ type: 'uuid', nullable: true })
  bookingId: string

  @Column({
    type: 'enum',
    enum: CommissionType,
    nullable: false,
  })
  type: CommissionType

  @Column({
    type: 'enum',
    enum: CommissionStatus,
    default: CommissionStatus.PENDING,
  })
  status: CommissionStatus

  @Column({
    type: 'enum',
    enum: CommissionCalculationType,
    nullable: false,
  })
  calculationType: CommissionCalculationType

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: false })
  baseAmount: number

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: false })
  commissionRate: number

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  commissionAmount: number

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  platformFee: number

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  netCommission: number

  @Column({ type: 'string', nullable: false })
  currency: string

  @Column({ type: 'string', nullable: true })
  description: string

  @Column({ type: 'jsonb', nullable: true })
  calculationDetails: Record<string, any>

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>

  @Column({ type: 'timestamp', nullable: true })
  calculatedAt: Date

  @Column({ type: 'timestamp', nullable: true })
  paidAt: Date

  @Column({ type: 'timestamp', nullable: true })
  cancelledAt: Date

  @Column({ type: 'string', nullable: true })
  cancellationReason: string

  @OneToMany(() => Transaction, transaction => transaction.commission)
  transactions: Transaction[]

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date

  calculateCommission(): void {
    if (this.calculationType === CommissionCalculationType.PERCENTAGE) {
      this.commissionAmount = Number(this.baseAmount) * (Number(this.commissionRate) / 100)
    } else if (this.calculationType === CommissionCalculationType.FIXED) {
      this.commissionAmount = Number(this.commissionRate)
    }

    this.platformFee = Number(this.commissionAmount) * 0.10 // 10% platform fee on commission
    this.netCommission = Number(this.commissionAmount) - this.platformFee
  }

  markAsCalculated(): void {
    this.calculateCommission()
    this.status = CommissionStatus.CALCULATED
    this.calculatedAt = new Date()
  }

  markAsPaid(): void {
    if (this.status !== CommissionStatus.CALCULATED) {
      throw new Error('Commission must be calculated before payment')
    }
    this.status = CommissionStatus.PAID
    this.paidAt = new Date()
  }

  cancel(reason: string): void {
    if (this.status === CommissionStatus.PAID) {
      throw new Error('Cannot cancel paid commission')
    }
    this.status = CommissionStatus.CANCELLED
    this.cancellationReason = reason
    this.cancelledAt = new Date()
  }

  isPaid(): boolean {
    return this.status === CommissionStatus.PAID
  }

  isCalculated(): boolean {
    return this.status === CommissionStatus.CALCULATED
  }

  isPending(): boolean {
    return this.status === CommissionStatus.PENDING
  }

  isCancelled(): boolean {
    return this.status === CommissionStatus.CANCELLED
  }

  canBePaid(): boolean {
    return this.status === CommissionStatus.CALCULATED
  }

  canBeCancelled(): boolean {
    return this.status === CommissionStatus.PENDING || this.status === CommissionStatus.CALCULATED
  }
}
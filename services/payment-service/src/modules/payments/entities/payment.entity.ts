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
import { Wallet } from './wallet.entity'

export enum PaymentStatus {
  PENDING = 'PENDING',
  AUTHORIZED = 'AUTHORIZED',
  CAPTURED = 'CAPTURED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
  PARTIALLY_REFUNDED = 'PARTIALLY_REFUNDED',
}

export enum PaymentType {
  BOOKING_PAYMENT = 'BOOKING_PAYMENT',
  DEPOSIT = 'DEPOSIT',
  WITHDRAWAL = 'WITHDRAWAL',
  COMMISSION_PAYMENT = 'COMMISSION_PAYMENT',
  SUBSCRIPTION_PAYMENT = 'SUBSCRIPTION_PAYMENT',
  TIP = 'TIP',
}

export enum PaymentProvider {
  STRIPE = 'STRIPE',
  PAYPAL = 'PAYPAL',
  INTERNAL_WALLET = 'INTERNAL_WALLET',
}

@Entity('payments')
@Index(['userId', 'status'])
@Index(['bookingId'])
@Index(['providerReference'])
@Index(['status', 'createdAt'])
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'uuid', nullable: false })
  userId: string

  @Column({ type: 'uuid', nullable: true })
  barberId: string

  @Column({ type: 'uuid', nullable: true })
  bookingId: string

  @Column({
    type: 'enum',
    enum: PaymentType,
    nullable: false,
  })
  type: PaymentType

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  status: PaymentStatus

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: false })
  amount: number

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  platformFee: number

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  barberCommission: number

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  netAmount: number

  @Column({ type: 'string', nullable: false })
  currency: string

  @Column({
    type: 'enum',
    enum: PaymentProvider,
    nullable: false,
  })
  provider: PaymentProvider

  @Column({ type: 'string', nullable: true })
  providerReference: string

  @Column({ type: 'string', nullable: true })
  providerPaymentMethodId: string

  @Column({ type: 'string', nullable: true })
  customerEmail: string

  @Column({ type: 'string', nullable: true })
  customerName: string

  @Column({ type: 'text', nullable: true })
  description: string

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>

  @Column({ type: 'jsonb', nullable: true })
  providerResponse: Record<string, any>

  @Column({ type: 'timestamp', nullable: true })
  authorizedAt: Date

  @Column({ type: 'timestamp', nullable: true })
  capturedAt: Date

  @Column({ type: 'timestamp', nullable: true })
  failedAt: Date

  @Column({ type: 'string', nullable: true })
  failureReason: string

  @Column({ type: 'timestamp', nullable: true })
  refundedAt: Date

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  refundedAmount: number

  @Column({ type: 'uuid', nullable: true })
  walletId: string

  @ManyToOne(() => Wallet, wallet => wallet.payments, { nullable: true })
  @JoinColumn({ name: 'walletId' })
  wallet: Wallet

  @OneToMany(() => Transaction, transaction => transaction.payment)
  transactions: Transaction[]

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date

  calculateFees(): void {
    this.platformFee = Number(this.amount) * 0.029 + 0.30 // 2.9% + $0.30
    this.barberCommission = Number(this.amount) * 0.10 // 10% commission
    this.netAmount = Number(this.amount) - this.platformFee - this.barberCommission
  }

  markAsAuthorized(providerReference: string, providerResponse: any): void {
    this.status = PaymentStatus.AUTHORIZED
    this.providerReference = providerReference
    this.providerResponse = providerResponse
    this.authorizedAt = new Date()
  }

  markAsCaptured(providerResponse: any): void {
    this.status = PaymentStatus.CAPTURED
    this.providerResponse = { ...this.providerResponse, ...providerResponse }
    this.capturedAt = new Date()
    this.calculateFees()
  }

  markAsFailed(reason: string, providerResponse?: any): void {
    this.status = PaymentStatus.FAILED
    this.failureReason = reason
    this.failedAt = new Date()
    if (providerResponse) {
      this.providerResponse = { ...this.providerResponse, ...providerResponse }
    }
  }

  markAsRefunded(refundedAmount: number, providerResponse?: any): void {
    if (this.refundedAmount) {
      this.refundedAmount += refundedAmount
      this.status = this.refundedAmount >= this.amount 
        ? PaymentStatus.REFUNDED 
        : PaymentStatus.PARTIALLY_REFUNDED
    } else {
      this.refundedAmount = refundedAmount
      this.status = refundedAmount >= this.amount 
        ? PaymentStatus.REFUNDED 
        : PaymentStatus.PARTIALLY_REFUNDED
    }
    this.refundedAt = new Date()
    if (providerResponse) {
      this.providerResponse = { ...this.providerResponse, ...providerResponse }
    }
  }

  cancel(): void {
    if (this.status !== PaymentStatus.PENDING && this.status !== PaymentStatus.AUTHORIZED) {
      throw new Error('Payment cannot be cancelled in current status')
    }
    this.status = PaymentStatus.CANCELLED
  }

  isCompleted(): boolean {
    return this.status === PaymentStatus.CAPTURED
  }

  isFailed(): boolean {
    return this.status === PaymentStatus.FAILED
  }

  isRefunded(): boolean {
    return this.status === PaymentStatus.REFUNDED || this.status === PaymentStatus.PARTIALLY_REFUNDED
  }

  canBeCaptured(): boolean {
    return this.status === PaymentStatus.AUTHORIZED
  }

  canBeRefunded(): boolean {
    return this.status === PaymentStatus.CAPTURED && (!this.refundedAmount || this.refundedAmount < this.amount)
  }

  getRefundableAmount(): number {
    if (!this.canBeRefunded()) {
      return 0
    }
    return this.refundedAmount ? this.amount - this.refundedAmount : this.amount
  }
}
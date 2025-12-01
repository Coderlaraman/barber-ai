import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm'
import { Wallet } from './wallet.entity'
import { Payment } from './payment.entity'
import { Commission } from './commission.entity'

export enum TransactionType {
  DEPOSIT = 'DEPOSIT',
  WITHDRAWAL = 'WITHDRAWAL',
  TRANSFER = 'TRANSFER',
  PAYMENT = 'PAYMENT',
  REFUND = 'REFUND',
  COMMISSION = 'COMMISSION',
  FEE = 'FEE',
}

export enum TransactionStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  PROCESSING = 'PROCESSING',
}

export enum PaymentMethod {
  STRIPE = 'STRIPE',
  PAYPAL = 'PAYPAL',
  WALLET = 'WALLET',
  BANK_TRANSFER = 'BANK_TRANSFER',
  CASH = 'CASH',
}

@Entity('transactions')
@Index(['walletId', 'createdAt'])
@Index(['referenceId', 'type'])
@Index(['status', 'createdAt'])
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'uuid' })
  walletId: string

  @ManyToOne(() => Wallet, wallet => wallet.transactions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'walletId' })
  wallet: Wallet

  @Column({
    type: 'enum',
    enum: TransactionType,
    nullable: false,
  })
  type: TransactionType

  @Column({
    type: 'enum',
    enum: TransactionStatus,
    default: TransactionStatus.PENDING,
  })
  status: TransactionStatus

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: false })
  amount: number

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  fee: number

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  netAmount: number

  @Column({ type: 'string', nullable: true })
  currency: string

  @Column({
    type: 'enum',
    enum: PaymentMethod,
    nullable: true,
  })
  paymentMethod: PaymentMethod

  @Column({ type: 'string', nullable: true })
  paymentProviderId: string

  @Column({ type: 'string', nullable: true })
  referenceId: string

  @Column({ type: 'string', nullable: true })
  description: string

  @Column({ type: 'string', nullable: true })
  notes: string

  @Column({ type: 'uuid', nullable: true })
  relatedTransactionId: string

  @ManyToOne(() => Transaction, { nullable: true })
  @JoinColumn({ name: 'relatedTransactionId' })
  relatedTransaction: Transaction

  @Column({ type: 'uuid', nullable: true })
  bookingId: string

  @Column({ type: 'uuid', nullable: true })
  commissionId: string

  @ManyToOne(() => Commission, commission => commission.transactions, { nullable: true })
  @JoinColumn({ name: 'commissionId' })
  commission: Commission

  @Column({ type: 'uuid', nullable: true })
  paymentId: string

  @ManyToOne(() => Payment, payment => payment.transactions, { nullable: true })
  @JoinColumn({ name: 'paymentId' })
  payment: Payment

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>

  @Column({ type: 'timestamp', nullable: true })
  processedAt: Date

  @Column({ type: 'timestamp', nullable: true })
  failedAt: Date

  @Column({ type: 'string', nullable: true })
  failureReason: string

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date

  calculateNetAmount(): void {
    this.netAmount = Number(this.amount) - Number(this.fee)
  }

  markAsCompleted(): void {
    this.status = TransactionStatus.COMPLETED
    this.processedAt = new Date()
  }

  markAsFailed(reason: string): void {
    this.status = TransactionStatus.FAILED
    this.failedAt = new Date()
    this.failureReason = reason
  }

  markAsProcessing(): void {
    this.status = TransactionStatus.PROCESSING
  }

  isCompleted(): boolean {
    return this.status === TransactionStatus.COMPLETED
  }

  isFailed(): boolean {
    return this.status === TransactionStatus.FAILED
  }

  isPending(): boolean {
    return this.status === TransactionStatus.PENDING
  }

  isProcessing(): boolean {
    return this.status === TransactionStatus.PROCESSING
  }

  canBeCancelled(): boolean {
    return this.status === TransactionStatus.PENDING || this.status === TransactionStatus.PROCESSING
  }

  cancel(): void {
    if (!this.canBeCancelled()) {
      throw new Error('Transaction cannot be cancelled in current status')
    }
    this.status = TransactionStatus.CANCELLED
  }

  isCredit(): boolean {
    return [TransactionType.DEPOSIT, TransactionType.REFUND].includes(this.type)
  }

  isDebit(): boolean {
    return [TransactionType.WITHDRAWAL, TransactionType.PAYMENT, TransactionType.COMMISSION, TransactionType.FEE].includes(this.type)
  }

  getSignedAmount(): number {
    return this.isCredit() ? Number(this.amount) : -Number(this.amount)
  }
}
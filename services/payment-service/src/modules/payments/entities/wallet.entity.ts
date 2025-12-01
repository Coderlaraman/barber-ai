import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index, OneToMany } from 'typeorm'
import { Transaction } from './transaction.entity'
import { Payment } from './payment.entity'
import { WalletStatus } from '../enums/wallet-status.enum'
import { WalletType } from '../enums/wallet-type.enum'

@Entity('wallets')
@Index(['userId', 'type'])
@Index(['status'])
export class Wallet {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'uuid' })
  userId: string

  @Column({ type: 'enum', enum: ['CLIENT', 'BARBER', 'PLATFORM'] })
  type: WalletType

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  balance: number

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  pendingBalance: number

  @Column({ type: 'string', nullable: true })
  currency: string

  @Column({ type: 'enum', enum: ['ACTIVE', 'SUSPENDED', 'CLOSED'], default: 'ACTIVE' })
  status: WalletStatus

  @Column({ type: 'timestamp', nullable: true })
  lastTransactionAt: Date

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>

  @OneToMany(() => Transaction, transaction => transaction.wallet)
  transactions: Transaction[]

  @OneToMany(() => Payment, payment => payment.wallet)
  payments: Payment[]

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date

  // Helper methods
  canDebit(amount: number): boolean {
    return this.balance >= amount && this.status === WalletStatus.ACTIVE
  }

  canCredit(amount: number): boolean {
    return this.status === 'ACTIVE'
  }

  debit(amount: number): void {
    if (!this.canDebit(amount)) {
      throw new Error('Insufficient balance or wallet not active')
    }
    this.balance = Number(this.balance) - Number(amount)
    this.lastTransactionAt = new Date()
  }

  credit(amount: number): void {
    if (!this.canCredit(amount)) {
      throw new Error('Wallet not active')
    }
    this.balance = Number(this.balance) + Number(amount)
    this.lastTransactionAt = new Date()
  }

  addPending(amount: number): void {
    this.pendingBalance = Number(this.pendingBalance) + Number(amount)
  }

  releasePending(amount: number): void {
    if (this.pendingBalance < amount) {
      throw new Error('Insufficient pending balance')
    }
    this.pendingBalance = Number(this.pendingBalance) - Number(amount)
  }
}
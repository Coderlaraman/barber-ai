import { Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, DataSource } from 'typeorm'
import { Wallet } from './entities/wallet.entity'
import { WalletType } from './enums/wallet-type.enum'
import { WalletStatus } from './enums/wallet-status.enum'
import { Transaction, TransactionType, TransactionStatus } from './entities/transaction.entity'
import { CreateWalletDto } from './dto/create-wallet.dto'
import { CreditWalletDto } from './dto/credit-wallet.dto'
import { DebitWalletDto } from './dto/debit-wallet.dto'
import { EventBusService } from '../event-bus/event-bus.service'

@Injectable()
export class WalletService {
  private readonly logger = new Logger(WalletService.name)

  constructor(
    @InjectRepository(Wallet)
    private walletRepository: Repository<Wallet>,
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
    private dataSource: DataSource,
    private eventBus: EventBusService,
  ) {}

  async createWallet(createWalletDto: CreateWalletDto): Promise<Wallet> {
    const existingWallet = await this.walletRepository.findOne({
      where: {
        userId: createWalletDto.userId,
        type: createWalletDto.type,
      },
    })

    if (existingWallet) {
      throw new Error(`Wallet already exists for user ${createWalletDto.userId} with type ${createWalletDto.type}`)
    }

    const wallet = this.walletRepository.create({
      ...createWalletDto,
      status: WalletStatus.ACTIVE,
      balance: 0,
      pendingBalance: 0,
    })

    const savedWallet = await this.walletRepository.save(wallet)

    // Publish wallet created event
    await this.eventBus.publish({
      eventId: `wallet-created-${savedWallet.id}-${Date.now()}`,
      eventType: 'wallet.created',
      aggregateId: savedWallet.id,
      aggregateType: 'WALLET',
      payload: {
        walletId: savedWallet.id,
        userId: savedWallet.userId,
        type: savedWallet.type,
        currency: savedWallet.currency,
      },
      metadata: {
        timestamp: new Date().toISOString(),
        service: 'payment-service',
      },
    })

    this.logger.log(`Wallet ${savedWallet.id} created for user ${savedWallet.userId}`)
    return savedWallet
  }

  async getWalletById(walletId: string): Promise<Wallet> {
    const wallet = await this.walletRepository.findOne({
      where: { id: walletId },
      relations: ['transactions'],
    })

    if (!wallet) {
      throw new Error('Wallet not found')
    }

    return wallet
  }

  async getWalletByUserId(userId: string, type: WalletType): Promise<Wallet> {
    const wallet = await this.walletRepository.findOne({
      where: { userId, type },
      relations: ['transactions'],
    })

    if (!wallet) {
      throw new Error(`Wallet not found for user ${userId} with type ${type}`)
    }

    return wallet
  }

  async getPlatformWallet(): Promise<Wallet> {
    const wallet = await this.walletRepository.findOne({
      where: { type: WalletType.PLATFORM },
      relations: ['transactions'],
    })

    if (!wallet) {
      throw new Error('Platform wallet not found')
    }

    return wallet
  }

  async creditWallet(creditWalletDto: CreditWalletDto): Promise<Wallet> {
    return this.dataSource.transaction(async (manager) => {
      const wallet = await manager.findOne(Wallet, {
        where: { id: creditWalletDto.walletId },
        lock: { mode: 'pessimistic_write' },
      })

      if (!wallet) {
        throw new Error('Wallet not found')
      }

      if (wallet.status !== WalletStatus.ACTIVE) {
        throw new Error('Wallet is not active')
      }

      wallet.credit(creditWalletDto.amount)
      await manager.save(wallet)

      // Create credit transaction
      const transaction = manager.create(Transaction, {
        walletId: wallet.id,
        type: TransactionType.DEPOSIT,
        status: TransactionStatus.COMPLETED,
        amount: creditWalletDto.amount,
        currency: wallet.currency,
        description: creditWalletDto.description || 'Wallet credit',
        metadata: creditWalletDto.metadata,
      })

      transaction.calculateNetAmount()
      await manager.save(transaction)

      // Publish wallet credited event
      await this.eventBus.publish({
        eventId: `wallet-credited-${wallet.id}-${Date.now()}`,
        eventType: 'wallet.credited',
        aggregateId: wallet.id,
        aggregateType: 'WALLET',
        payload: {
          walletId: wallet.id,
          userId: wallet.userId,
          amount: creditWalletDto.amount,
          newBalance: wallet.balance,
          currency: wallet.currency,
          transactionId: transaction.id,
        },
        metadata: {
          timestamp: new Date().toISOString(),
          service: 'payment-service',
        },
      })

      this.logger.log(`Wallet ${wallet.id} credited with ${creditWalletDto.amount}`)
      return wallet
    })
  }

  async debitWallet(debitWalletDto: DebitWalletDto): Promise<Wallet> {
    return this.dataSource.transaction(async (manager) => {
      const wallet = await manager.findOne(Wallet, {
        where: { id: debitWalletDto.walletId },
        lock: { mode: 'pessimistic_write' },
      })

      if (!wallet) {
        throw new Error('Wallet not found')
      }

      if (wallet.status !== WalletStatus.ACTIVE) {
        throw new Error('Wallet is not active')
      }

      if (!wallet.canDebit(debitWalletDto.amount)) {
        throw new Error('Insufficient balance or wallet not active')
      }

      wallet.debit(debitWalletDto.amount)
      await manager.save(wallet)

      // Create debit transaction
      const transaction = manager.create(Transaction, {
        walletId: wallet.id,
        type: TransactionType.WITHDRAWAL,
        status: TransactionStatus.COMPLETED,
        amount: debitWalletDto.amount,
        currency: wallet.currency,
        description: debitWalletDto.description || 'Wallet debit',
        metadata: debitWalletDto.metadata,
      })

      transaction.calculateNetAmount()
      await manager.save(transaction)

      // Publish wallet debited event
      await this.eventBus.publish({
        eventId: `wallet-debited-${wallet.id}-${Date.now()}`,
        eventType: 'wallet.debited',
        aggregateId: wallet.id,
        aggregateType: 'WALLET',
        payload: {
          walletId: wallet.id,
          userId: wallet.userId,
          amount: debitWalletDto.amount,
          newBalance: wallet.balance,
          currency: wallet.currency,
          transactionId: transaction.id,
        },
        metadata: {
          timestamp: new Date().toISOString(),
          service: 'payment-service',
        },
      })

      this.logger.log(`Wallet ${wallet.id} debited with ${debitWalletDto.amount}`)
      return wallet
    })
  }

  async getWalletBalance(walletId: string): Promise<{ balance: number; pendingBalance: number; currency: string }> {
    const wallet = await this.getWalletById(walletId)
    return {
      balance: wallet.balance,
      pendingBalance: wallet.pendingBalance,
      currency: wallet.currency,
    }
  }

  async getWalletTransactions(
    walletId: string,
    limit = 50,
    offset = 0,
  ): Promise<{ transactions: Transaction[]; total: number }> {
    const [transactions, total] = await this.transactionRepository.findAndCount({
      where: { walletId },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    })

    return { transactions, total }
  }

  async getUserWallets(userId: string): Promise<Wallet[]> {
    return this.walletRepository.find({
      where: { userId },
      relations: ['transactions'],
      order: { createdAt: 'DESC' },
    })
  }

  async suspendWallet(walletId: string, reason?: string): Promise<Wallet> {
    const wallet = await this.getWalletById(walletId)

    if (wallet.status !== WalletStatus.ACTIVE) {
      throw new Error('Wallet is not active')
    }

    wallet.status = WalletStatus.SUSPENDED
    await this.walletRepository.save(wallet)

    // Publish wallet suspended event
    await this.eventBus.publish({
      eventId: `wallet-suspended-${wallet.id}-${Date.now()}`,
      eventType: 'wallet.suspended',
      aggregateId: wallet.id,
      aggregateType: 'WALLET',
      payload: {
        walletId: wallet.id,
        userId: wallet.userId,
        reason,
      },
      metadata: {
        timestamp: new Date().toISOString(),
        service: 'payment-service',
      },
    })

    this.logger.log(`Wallet ${wallet.id} suspended`)
    return wallet
  }

  async activateWallet(walletId: string): Promise<Wallet> {
    const wallet = await this.getWalletById(walletId)

    if (wallet.status !== WalletStatus.SUSPENDED) {
      throw new Error('Wallet is not suspended')
    }

    wallet.status = WalletStatus.ACTIVE
    await this.walletRepository.save(wallet)

    // Publish wallet activated event
    await this.eventBus.publish({
      eventId: `wallet-activated-${wallet.id}-${Date.now()}`,
      eventType: 'wallet.activated',
      aggregateId: wallet.id,
      aggregateType: 'WALLET',
      payload: {
        walletId: wallet.id,
        userId: wallet.userId,
      },
      metadata: {
        timestamp: new Date().toISOString(),
        service: 'payment-service',
      },
    })

    this.logger.log(`Wallet ${wallet.id} activated`)
    return wallet
  }
}
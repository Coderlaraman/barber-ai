import { Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, DataSource, In } from 'typeorm'
import { Commission, CommissionType, CommissionStatus, CommissionCalculationType } from './entities/commission.entity'
import { WalletType } from './enums/wallet-type.enum'
import { Transaction, TransactionType, TransactionStatus } from './entities/transaction.entity'
import { Wallet } from './entities/wallet.entity'
import { WalletService } from './wallet.service'
import { EventBusService } from '../event-bus/event-bus.service'

interface CommissionCalculationParams {
  barberId: string
  bookingId: string
  amount: number
  type: string
  paymentId: string
}

interface CommissionPaymentParams {
  barberId: string
  commissionIds: string[]
}

@Injectable()
export class CommissionService {
  private readonly logger = new Logger(CommissionService.name)

  constructor(
    @InjectRepository(Commission)
    private commissionRepository: Repository<Commission>,
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
    @InjectRepository(Wallet)
    private walletRepository: Repository<Wallet>,
    private dataSource: DataSource,
    private walletService: WalletService,
    private eventBus: EventBusService,
  ) {}

  async calculateCommission(params: CommissionCalculationParams): Promise<Commission> {
    return this.dataSource.transaction(async (manager) => {
      // Check if commission already exists for this booking
      const existingCommission = await manager.findOne(Commission, {
        where: { bookingId: params.bookingId },
      })

      if (existingCommission) {
        this.logger.log(`Commission already exists for booking ${params.bookingId}`)
        return existingCommission
      }

      // Determine commission rate based on barber tier/type
      const commissionRate = await this.getCommissionRate(params.barberId)
      
      const commission = manager.create(Commission, {
        barberId: params.barberId,
        bookingId: params.bookingId,
        type: CommissionType.BOOKING,
        calculationType: CommissionCalculationType.PERCENTAGE,
        baseAmount: params.amount,
        commissionRate,
        currency: 'USD', // Default currency
        description: `Commission for booking ${params.bookingId}`,
      })

      commission.calculateCommission()
      const savedCommission = await manager.save(commission)

      // Publish commission calculated event
      await this.eventBus.publish({
        eventId: `commission-calculated-${savedCommission.id}-${Date.now()}`,
        eventType: 'commission.calculated',
        aggregateId: savedCommission.id,
        aggregateType: 'COMMISSION',
        payload: {
          commissionId: savedCommission.id,
          barberId: savedCommission.barberId,
          bookingId: savedCommission.bookingId,
          baseAmount: savedCommission.baseAmount,
          commissionAmount: savedCommission.commissionAmount,
          netCommission: savedCommission.netCommission,
          commissionRate: savedCommission.commissionRate,
        },
        metadata: {
          timestamp: new Date().toISOString(),
          service: 'payment-service',
        },
      })

      this.logger.log(`Commission ${savedCommission.id} calculated for booking ${params.bookingId}`)
      return savedCommission
    })
  }

  async payCommission(params: CommissionPaymentParams): Promise<Commission[]> {
    return this.dataSource.transaction(async (manager) => {
      const commissions = await manager.find(Commission, {
        where: {
          id: In(params.commissionIds),
          barberId: params.barberId,
          status: CommissionStatus.CALCULATED,
        },
      })

      if (commissions.length === 0) {
        throw new Error('No eligible commissions found for payment')
      }

      const totalCommissionAmount = commissions.reduce((sum, commission) => {
        return sum + Number(commission.netCommission)
      }, 0)

      // Get platform wallet for commission payments
      const platformWallet = await this.walletService.getPlatformWallet()
      
      if (!platformWallet || !platformWallet.canDebit(totalCommissionAmount)) {
        throw new Error('Insufficient funds in platform wallet for commission payment')
      }

      const paidCommissions: Commission[] = []

      for (const commission of commissions) {
        // Create commission payment transaction
        const transaction = manager.create(Transaction, {
          walletId: platformWallet.id,
          type: TransactionType.COMMISSION,
          status: TransactionStatus.COMPLETED,
          amount: commission.netCommission,
          currency: commission.currency,
          commissionId: commission.id,
          description: `Commission payment for booking ${commission.bookingId}`,
        })

        transaction.calculateNetAmount()
        await manager.save(transaction)

        // Debit from platform wallet
        platformWallet.debit(commission.netCommission)
        await manager.save(platformWallet)

        // Credit to barber wallet
        const barberWallet = await this.walletService.getWalletByUserId(commission.barberId, WalletType.BARBER)
        barberWallet.credit(commission.netCommission)
        await manager.save(barberWallet)

        // Create credit transaction for barber
        const creditTransaction = manager.create(Transaction, {
          walletId: barberWallet.id,
          type: TransactionType.DEPOSIT,
          status: TransactionStatus.COMPLETED,
          amount: commission.netCommission,
          currency: commission.currency,
          commissionId: commission.id,
          description: `Commission received for booking ${commission.bookingId}`,
        })

        creditTransaction.calculateNetAmount()
        await manager.save(creditTransaction)

        // Mark commission as paid
        commission.markAsPaid()
        const paidCommission = await manager.save(commission)
        paidCommissions.push(paidCommission)

        // Publish commission paid event
        await this.eventBus.publish({
          eventId: `commission-paid-${commission.id}-${Date.now()}`,
          eventType: 'commission.paid',
          aggregateId: commission.id,
          aggregateType: 'COMMISSION',
          payload: {
            commissionId: commission.id,
            barberId: commission.barberId,
            bookingId: commission.bookingId,
            amount: commission.netCommission,
            transactionId: transaction.id,
          },
          metadata: {
            timestamp: new Date().toISOString(),
            service: 'payment-service',
          },
        })
      }

      this.logger.log(`Paid ${paidCommissions.length} commissions for barber ${params.barberId}`)
      return paidCommissions
    })
  }

  async getCommissionById(commissionId: string): Promise<Commission> {
    const commission = await this.commissionRepository.findOne({
      where: { id: commissionId },
      relations: ['transactions'],
    })

    if (!commission) {
      throw new Error('Commission not found')
    }

    return commission
  }

  async getCommissionsByBarberId(barberId: string, status?: CommissionStatus): Promise<Commission[]> {
    const where: any = { barberId }
    if (status) {
      where.status = status
    }

    return this.commissionRepository.find({
      where,
      relations: ['transactions'],
      order: { createdAt: 'DESC' },
    })
  }

  async getCommissionsByBookingId(bookingId: string): Promise<Commission[]> {
    return this.commissionRepository.find({
      where: { bookingId },
      relations: ['transactions'],
      order: { createdAt: 'DESC' },
    })
  }

  async getPendingCommissions(barberId?: string): Promise<Commission[]> {
    const where: any = { status: CommissionStatus.CALCULATED }
    if (barberId) {
      where.barberId = barberId
    }

    return this.commissionRepository.find({
      where,
      relations: ['transactions'],
      order: { createdAt: 'ASC' },
    })
  }

  async getCommissionSummary(barberId: string): Promise<{
    totalCommissions: number
    paidCommissions: number
    pendingCommissions: number
    totalAmount: number
    paidAmount: number
    pendingAmount: number
  }> {
    const commissions = await this.commissionRepository.find({
      where: { barberId },
    })

    const summary = {
      totalCommissions: commissions.length,
      paidCommissions: 0,
      pendingCommissions: 0,
      totalAmount: 0,
      paidAmount: 0,
      pendingAmount: 0,
    }

    commissions.forEach(commission => {
      summary.totalAmount += Number(commission.commissionAmount)
      
      if (commission.status === CommissionStatus.PAID) {
        summary.paidCommissions++
        summary.paidAmount += Number(commission.netCommission)
      } else if (commission.status === CommissionStatus.CALCULATED) {
        summary.pendingCommissions++
        summary.pendingAmount += Number(commission.netCommission)
      }
    })

    return summary
  }

  async cancelCommission(commissionId: string, reason: string): Promise<Commission> {
    return this.dataSource.transaction(async (manager) => {
      const commission = await manager.findOne(Commission, {
        where: { id: commissionId },
      })

      if (!commission) {
        throw new Error('Commission not found')
      }

      commission.cancel(reason)
      const cancelledCommission = await manager.save(commission)

      // Publish commission cancelled event
      await this.eventBus.publish({
        eventId: `commission-cancelled-${commission.id}-${Date.now()}`,
        eventType: 'commission.cancelled',
        aggregateId: commission.id,
        aggregateType: 'COMMISSION',
        payload: {
          commissionId: commission.id,
          barberId: commission.barberId,
          bookingId: commission.bookingId,
          reason,
        },
        metadata: {
          timestamp: new Date().toISOString(),
          service: 'payment-service',
        },
      })

      this.logger.log(`Commission ${commission.id} cancelled: ${reason}`)
      return cancelledCommission
    })
  }

  private async getCommissionRate(barberId: string): Promise<number> {
    // This would typically come from barber profile/configuration
    // For now, return default commission rate
    return 0.10 // 10% commission rate
  }
}
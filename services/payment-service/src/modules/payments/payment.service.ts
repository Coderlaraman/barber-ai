import { Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, DataSource, In } from 'typeorm'
import { Payment, PaymentStatus, PaymentType, PaymentProvider } from './entities/payment.entity'
import { PaymentMethod } from './enums/payment-method.enum'
import { WalletType } from './enums/wallet-type.enum'
import { Transaction, TransactionType, TransactionStatus } from './entities/transaction.entity'
import { Wallet } from './entities/wallet.entity'
import { Commission } from './entities/commission.entity'
import { CreatePaymentDto } from './dto/create-payment.dto'
import { ProcessPaymentDto } from './dto/process-payment.dto'
import { StripeService } from './providers/stripe.service'
import { PayPalService } from './providers/paypal.service'
import { WalletService } from './wallet.service'
import { CommissionService } from './commission.service'
import { EventBusService } from '../event-bus/event-bus.service'

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name)

  constructor(
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
    @InjectRepository(Wallet)
    private walletRepository: Repository<Wallet>,
    @InjectRepository(Commission)
    private commissionRepository: Repository<Commission>,
    private dataSource: DataSource,
    private stripeService: StripeService,
    private payPalService: PayPalService,
    private walletService: WalletService,
    private commissionService: CommissionService,
    private eventBus: EventBusService,
  ) {}

  async createPayment(createPaymentDto: CreatePaymentDto): Promise<Payment> {
    return this.dataSource.transaction(async (manager) => {
      const payment = manager.create(Payment, {
        ...createPaymentDto,
        status: PaymentStatus.PENDING,
      })

      payment.calculateFees()
      const savedPayment = await manager.save(payment)

      // Publish payment created event
      await this.eventBus.publish({
        eventId: `payment-created-${savedPayment.id}-${Date.now()}`,
        eventType: 'payment.created',
        aggregateId: savedPayment.id,
        aggregateType: 'PAYMENT',
        payload: {
          paymentId: savedPayment.id,
          userId: savedPayment.userId,
          amount: savedPayment.amount,
          currency: savedPayment.currency,
          type: savedPayment.type,
          provider: savedPayment.provider,
        },
        metadata: {
          timestamp: new Date().toISOString(),
          service: 'payment-service',
        },
      })

      this.logger.log(`Payment ${savedPayment.id} created for user ${savedPayment.userId}`)
      return savedPayment
    })
  }

  async processPayment(processPaymentDto: ProcessPaymentDto): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({
      where: { id: processPaymentDto.paymentId },
      relations: ['transactions'],
    })

    if (!payment) {
      throw new Error('Payment not found')
    }

    if (payment.status !== PaymentStatus.PENDING) {
      throw new Error(`Payment cannot be processed in status: ${payment.status}`)
    }

    try {
      let providerResponse: any

      switch (payment.provider) {
        case PaymentProvider.STRIPE:
          providerResponse = await this.stripeService.processPayment(payment, processPaymentDto)
          break
        case PaymentProvider.PAYPAL:
          providerResponse = await this.payPalService.processPayment(payment, processPaymentDto)
          break
        case PaymentProvider.INTERNAL_WALLET:
          providerResponse = await this.processWalletPayment(payment, processPaymentDto)
          break
        default:
          throw new Error(`Unsupported payment provider: ${payment.provider}`)
      }

      return this.dataSource.transaction(async (manager) => {
        payment.markAsAuthorized(providerResponse.id, providerResponse)
        await manager.save(payment)

        // Create transaction for authorization
        const authTransaction = manager.create(Transaction, {
          walletId: processPaymentDto.walletId,
          type: TransactionType.PAYMENT,
          status: TransactionStatus.PENDING,
          amount: payment.amount,
          fee: payment.platformFee,
          netAmount: payment.netAmount,
          currency: payment.currency,
          paymentMethod: this.mapProviderToPaymentMethod(payment.provider),
          paymentId: payment.id,
          bookingId: payment.bookingId,
          description: `Payment authorization for ${payment.type}`,
        })

        authTransaction.calculateNetAmount()
        await manager.save(authTransaction)

        // Publish payment authorized event
        await this.eventBus.publish({
          eventId: `payment-authorized-${payment.id}-${Date.now()}`,
          eventType: 'payment.authorized',
          aggregateId: payment.id,
          aggregateType: 'PAYMENT',
          payload: {
            paymentId: payment.id,
            userId: payment.userId,
            amount: payment.amount,
            provider: payment.provider,
            providerReference: providerResponse.id,
          },
          metadata: {
            timestamp: new Date().toISOString(),
            service: 'payment-service',
          },
        })

        this.logger.log(`Payment ${payment.id} authorized with ${payment.provider}`)
        return payment
      })
    } catch (error) {
      this.logger.error(`Payment processing failed for ${payment.id}:`, error)
      
      await this.dataSource.transaction(async (manager) => {
        payment.markAsFailed(error.message, error.response?.data || error)
        await manager.save(payment)

        // Publish payment failed event
        await this.eventBus.publish({
          eventId: `payment-failed-${payment.id}-${Date.now()}`,
          eventType: 'payment.failed',
          aggregateId: payment.id,
          aggregateType: 'PAYMENT',
          payload: {
            paymentId: payment.id,
            userId: payment.userId,
            amount: payment.amount,
            provider: payment.provider,
            failureReason: error.message,
          },
          metadata: {
            timestamp: new Date().toISOString(),
            service: 'payment-service',
          },
        })
      })

      throw error
    }
  }

  async capturePayment(paymentId: string): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({
      where: { id: paymentId },
      relations: ['transactions', 'booking'],
    })

    if (!payment) {
      throw new Error('Payment not found')
    }

    if (!payment.canBeCaptured()) {
      throw new Error(`Payment cannot be captured in status: ${payment.status}`)
    }

    try {
      let providerResponse: any

      switch (payment.provider) {
        case PaymentProvider.STRIPE:
          providerResponse = await this.stripeService.capturePayment(payment)
          break
        case PaymentProvider.PAYPAL:
          providerResponse = await this.payPalService.capturePayment(payment)
          break
        case PaymentProvider.INTERNAL_WALLET:
          providerResponse = await this.captureWalletPayment(payment)
          break
        default:
          throw new Error(`Unsupported payment provider: ${payment.provider}`)
      }

      return this.dataSource.transaction(async (manager) => {
        payment.markAsCaptured(providerResponse)
        await manager.save(payment)

        // Update authorization transaction to completed
        const authTransaction = await manager.findOne(Transaction, {
          where: {
            paymentId: payment.id,
            type: TransactionType.PAYMENT,
          },
        })

        if (authTransaction) {
          authTransaction.markAsCompleted()
          await manager.save(authTransaction)
        }

        // Process commission calculation for barber bookings
        if (payment.type === PaymentType.BOOKING_PAYMENT && payment.barberId) {
          await this.commissionService.calculateCommission({
            barberId: payment.barberId,
            bookingId: payment.bookingId,
            amount: payment.netAmount,
            type: 'BOOKING',
            paymentId: payment.id,
          })
        }

        // Publish payment captured event
        await this.eventBus.publish({
          eventId: `payment-captured-${payment.id}-${Date.now()}`,
          eventType: 'payment.captured',
          aggregateId: payment.id,
          aggregateType: 'PAYMENT',
          payload: {
            paymentId: payment.id,
            userId: payment.userId,
            amount: payment.amount,
            netAmount: payment.netAmount,
            platformFee: payment.platformFee,
            barberCommission: payment.barberCommission,
            provider: payment.provider,
          },
          metadata: {
            timestamp: new Date().toISOString(),
            service: 'payment-service',
          },
        })

        this.logger.log(`Payment ${payment.id} captured successfully`)
        return payment
      })
    } catch (error) {
      this.logger.error(`Payment capture failed for ${payment.id}:`, error)
      throw error
    }
  }

  async refundPayment(paymentId: string, amount?: number, reason?: string): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({
      where: { id: paymentId },
      relations: ['transactions'],
    })

    if (!payment) {
      throw new Error('Payment not found')
    }

    if (!payment.canBeRefunded()) {
      throw new Error(`Payment cannot be refunded in status: ${payment.status}`)
    }

    const refundAmount = amount || payment.getRefundableAmount()

    if (refundAmount <= 0) {
      throw new Error('Invalid refund amount')
    }

    try {
      let providerResponse: any

      switch (payment.provider) {
        case PaymentProvider.STRIPE:
          providerResponse = await this.stripeService.refundPayment(payment, refundAmount, reason)
          break
        case PaymentProvider.PAYPAL:
          providerResponse = await this.payPalService.refundPayment(payment, refundAmount, reason)
          break
        case PaymentProvider.INTERNAL_WALLET:
          providerResponse = await this.refundWalletPayment(payment, refundAmount)
          break
        default:
          throw new Error(`Unsupported payment provider: ${payment.provider}`)
      }

      return this.dataSource.transaction(async (manager) => {
        payment.markAsRefunded(refundAmount, providerResponse)
        await manager.save(payment)

        // Create refund transaction
        const refundTransaction = manager.create(Transaction, {
          walletId: payment.transactions[0]?.walletId,
          type: TransactionType.REFUND,
          status: TransactionStatus.COMPLETED,
          amount: refundAmount,
          currency: payment.currency,
          paymentMethod: this.mapProviderToPaymentMethod(payment.provider),
          paymentId: payment.id,
          description: reason || `Refund for payment ${payment.id}`,
        })

        refundTransaction.calculateNetAmount()
        await manager.save(refundTransaction)

        // Publish payment refunded event
        await this.eventBus.publish({
          eventId: `payment-refunded-${payment.id}-${Date.now()}`,
          eventType: 'payment.refunded',
          aggregateId: payment.id,
          aggregateType: 'PAYMENT',
          payload: {
            paymentId: payment.id,
            userId: payment.userId,
            refundedAmount: refundAmount,
            totalRefundedAmount: payment.refundedAmount,
            provider: payment.provider,
            reason,
          },
          metadata: {
            timestamp: new Date().toISOString(),
            service: 'payment-service',
          },
        })

        this.logger.log(`Payment ${payment.id} refunded: $${refundAmount}`)
        return payment
      })
    } catch (error) {
      this.logger.error(`Payment refund failed for ${payment.id}:`, error)
      throw error
    }
  }

  async getPaymentById(paymentId: string): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({
      where: { id: paymentId },
      relations: ['transactions'],
    })

    if (!payment) {
      throw new Error('Payment not found')
    }

    return payment
  }

  async getPaymentsByUserId(userId: string, limit = 50): Promise<Payment[]> {
    return this.paymentRepository.find({
      where: { userId },
      relations: ['transactions'],
      order: { createdAt: 'DESC' },
      take: limit,
    })
  }

  async getPaymentsByBookingId(bookingId: string): Promise<Payment[]> {
    return this.paymentRepository.find({
      where: { bookingId },
      relations: ['transactions'],
      order: { createdAt: 'DESC' },
    })
  }

  private async processWalletPayment(payment: Payment, processPaymentDto: ProcessPaymentDto): Promise<any> {
    const wallet = await this.walletService.getWalletById(processPaymentDto.walletId)
    
    if (!wallet) {
      throw new Error('Wallet not found')
    }

    if (!wallet.canDebit(payment.amount)) {
      throw new Error('Insufficient wallet balance')
    }

    // Wallet payment doesn't need external authorization, return mock response
    return {
      id: `wallet_${Date.now()}`,
      status: 'succeeded',
      amount: payment.amount,
      currency: payment.currency,
    }
  }

  private async captureWalletPayment(payment: Payment): Promise<any> {
    return this.dataSource.transaction(async (manager) => {
      const wallet = await this.walletService.getWalletByUserId(payment.userId, WalletType.CLIENT)
      
      if (!wallet) {
        throw new Error('Client wallet not found')
      }

      if (!wallet.canDebit(payment.amount)) {
        throw new Error('Insufficient wallet balance')
      }

      // Debit from client wallet
      wallet.debit(payment.amount)
      await manager.save(wallet)

      // Create debit transaction
      const debitTransaction = manager.create(Transaction, {
        walletId: wallet.id,
        type: TransactionType.PAYMENT,
        status: TransactionStatus.COMPLETED,
        amount: payment.amount,
        fee: payment.platformFee,
        netAmount: payment.netAmount,
        currency: payment.currency,
        paymentMethod: PaymentMethod.WALLET,
        paymentId: payment.id,
        bookingId: payment.bookingId,
        description: `Payment for ${payment.type}`,
      })

      debitTransaction.calculateNetAmount()
      await manager.save(debitTransaction)

      // Credit to platform wallet
      const platformWallet = await this.walletService.getPlatformWallet()
      if (platformWallet) {
        platformWallet.credit(payment.netAmount)
        await manager.save(platformWallet)

        // Create credit transaction for platform
        const creditTransaction = manager.create(Transaction, {
          walletId: platformWallet.id,
          type: TransactionType.DEPOSIT,
          status: TransactionStatus.COMPLETED,
          amount: payment.netAmount,
          currency: payment.currency,
          paymentMethod: PaymentMethod.WALLET,
          paymentId: payment.id,
          description: `Payment received for booking ${payment.bookingId}`,
        })

        creditTransaction.calculateNetAmount()
        await manager.save(creditTransaction)
      }

      return {
        id: `wallet_capture_${Date.now()}`,
        status: 'succeeded',
        amount: payment.amount,
        currency: payment.currency,
      }
    })
  }

  private async refundWalletPayment(payment: Payment, refundAmount: number): Promise<any> {
    return this.dataSource.transaction(async (manager) => {
      // Refund to client wallet
      const clientWallet = await this.walletService.getWalletByUserId(payment.userId, WalletType.CLIENT)
      if (clientWallet) {
        clientWallet.credit(refundAmount)
        await manager.save(clientWallet)
      }

      // Debit from platform wallet
      const platformWallet = await this.walletService.getPlatformWallet()
      if (platformWallet) {
        platformWallet.debit(refundAmount)
        await manager.save(platformWallet)
      }

      return {
        id: `wallet_refund_${Date.now()}`,
        status: 'succeeded',
        amount: refundAmount,
        currency: payment.currency,
      }
    })
  }

  private mapProviderToPaymentMethod(provider: PaymentProvider): any {
    switch (provider) {
      case PaymentProvider.STRIPE:
        return PaymentMethod.STRIPE
      case PaymentProvider.PAYPAL:
        return PaymentMethod.PAYPAL
      case PaymentProvider.INTERNAL_WALLET:
        return PaymentMethod.WALLET
      default:
        return PaymentMethod.WALLET
    }
  }
}
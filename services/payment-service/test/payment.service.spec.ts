import { Test, TestingModule } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import { Repository, DataSource } from 'typeorm'
import { PaymentService } from '../src/modules/payments/payment.service'
import { Payment, PaymentStatus, PaymentType, PaymentProvider } from '../src/modules/payments/entities/payment.entity'
import { Transaction, TransactionType, TransactionStatus } from '../src/modules/payments/entities/transaction.entity'
import { Wallet } from '../src/modules/payments/entities/wallet.entity'
import { Commission } from '../src/modules/payments/entities/commission.entity'
import { WalletService } from '../src/modules/payments/wallet.service'
import { CommissionService } from '../src/modules/payments/commission.service'
import { StripeService } from '../src/modules/payments/providers/stripe.service'
import { PayPalService } from '../src/modules/payments/providers/paypal.service'
import { EventBusService } from '../src/modules/event-bus/event-bus.service'
import { CreatePaymentDto } from '../src/modules/payments/dto/create-payment.dto'
import { ProcessPaymentDto } from '../src/modules/payments/dto/process-payment.dto'

describe('PaymentService', () => {
  let service: PaymentService
  let paymentRepository: Repository<Payment>
  let walletService: WalletService
  let stripeService: StripeService
  let eventBusService: EventBusService

  const createMockTransaction = () => ({
    id: 'test-transaction-id',
    walletId: 'test-wallet-id',
    type: TransactionType.PAYMENT,
    status: TransactionStatus.COMPLETED,
    amount: 100,
    fee: 3.2,
    netAmount: 96.8,
    currency: 'USD',
    paymentId: 'test-payment-id',
    calculateNetAmount: jest.fn(),
    markAsCompleted: jest.fn(),
    save: jest.fn(),
  })

  const createMockPayment = () => ({
    id: 'test-payment-id',
    userId: 'test-user-id',
    bookingId: 'test-booking-id',
    amount: 100,
    currency: 'USD',
    type: PaymentType.BOOKING_PAYMENT,
    provider: PaymentProvider.STRIPE,
    status: PaymentStatus.PENDING,
    transactions: [createMockTransaction()],
    calculateFees: jest.fn(function() {
      this.platformFee = Number(this.amount) * 0.029 + 0.30
      this.barberCommission = Number(this.amount) * 0.10
      this.netAmount = Number(this.amount) - this.platformFee - this.barberCommission
    }),
    markAsAuthorized: jest.fn(function() {
      this.status = PaymentStatus.AUTHORIZED
    }),
    markAsCaptured: jest.fn(function() {
      this.status = PaymentStatus.CAPTURED
    }),
    markAsFailed: jest.fn(),
    markAsRefunded: jest.fn(function(refundAmount) {
      if (this.refundedAmount) {
        this.refundedAmount += refundAmount
        this.status = this.refundedAmount >= this.amount 
          ? PaymentStatus.REFUNDED 
          : PaymentStatus.PARTIALLY_REFUNDED
      } else {
        this.refundedAmount = refundAmount
        this.status = refundAmount >= this.amount 
          ? PaymentStatus.REFUNDED 
          : PaymentStatus.PARTIALLY_REFUNDED
      }
      this.refundedAt = new Date()
    }),
    canBeCaptured: jest.fn().mockReturnValue(true),
    canBeRefunded: jest.fn().mockReturnValue(true),
    save: jest.fn(),
  })

  let mockPayment = createMockPayment()

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  }

  const mockWalletService = {
    getWalletByUserId: jest.fn(),
    debitWallet: jest.fn(),
    creditWallet: jest.fn(),
  }

  const mockStripeService = {
    processPayment: jest.fn(),
    capturePayment: jest.fn(),
    refundPayment: jest.fn(),
  }

  const mockPayPalService = {
    processPayment: jest.fn(),
    capturePayment: jest.fn(),
    refundPayment: jest.fn(),
  }

  const mockCommissionService = {
    calculateCommission: jest.fn(),
    createCommission: jest.fn(),
  }

  const mockEventBusService = {
    publish: jest.fn(),
    subscribe: jest.fn(),
  }

  const mockDataSource = {
    transaction: jest.fn((callback) => {
      const mockManager = {
        save: jest.fn(),
        create: jest.fn(),
        findOne: jest.fn(),
      }
      return callback(mockManager)
    }),
  }

  beforeEach(async () => {
    // Reset mockPayment before each test
    mockPayment = createMockPayment()
    
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentService,
        {
          provide: getRepositoryToken(Payment),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(Transaction),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(Wallet),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(Commission),
          useValue: mockRepository,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
        {
          provide: WalletService,
          useValue: mockWalletService,
        },
        {
          provide: CommissionService,
          useValue: mockCommissionService,
        },
        {
          provide: StripeService,
          useValue: mockStripeService,
        },
        {
          provide: PayPalService,
          useValue: mockPayPalService,
        },
        {
          provide: EventBusService,
          useValue: mockEventBusService,
        },
      ],
    }).compile()

    service = module.get<PaymentService>(PaymentService)
    paymentRepository = module.get<Repository<Payment>>(getRepositoryToken(Payment))
    walletService = module.get<WalletService>(WalletService)
    stripeService = module.get<StripeService>(StripeService)
    eventBusService = module.get<EventBusService>(EventBusService)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('createPayment', () => {
    it('should create a new payment', async () => {
      const createPaymentDto: CreatePaymentDto = {
        userId: 'test-user-id',
        bookingId: 'test-booking-id',
        amount: 100,
        currency: 'USD',
        type: PaymentType.BOOKING_PAYMENT,
        provider: PaymentProvider.STRIPE,
      }

      // Configure mockDataSource.transaction to return the saved payment
      mockDataSource.transaction.mockImplementation(async (callback) => {
        const mockManager = {
          create: jest.fn().mockReturnValue(mockPayment),
          save: jest.fn().mockResolvedValue(mockPayment),
          findOne: jest.fn(),
        }
        return callback(mockManager)
      })

      const result = await service.createPayment(createPaymentDto)

      expect(mockDataSource.transaction).toHaveBeenCalled()
      expect(mockEventBusService.publish).toHaveBeenCalled()
      expect(result).toEqual(mockPayment)
    })
  })

  describe('processPayment', () => {
    it('should process payment successfully with Stripe', async () => {
      const processPaymentDto: ProcessPaymentDto = {
        paymentId: 'test-payment-id',
        walletId: 'test-wallet-id',
        paymentMethodId: 'pm_test123',
      }

      mockRepository.findOne.mockResolvedValue(mockPayment)
      mockStripeService.processPayment.mockResolvedValue({
        id: 'pi_test123',
        status: 'succeeded',
      })

      // Configure mockDataSource.transaction for processPayment
      mockDataSource.transaction.mockImplementation(async (callback) => {
        const mockManager = {
          create: jest.fn().mockReturnValue(createMockTransaction()),
          save: jest.fn().mockResolvedValue(mockPayment),
          findOne: jest.fn(),
        }
        return callback(mockManager)
      })

      const result = await service.processPayment(processPaymentDto)

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: processPaymentDto.paymentId },
        relations: ['transactions']
      })
      expect(mockStripeService.processPayment).toHaveBeenCalledWith(mockPayment, processPaymentDto)
      expect(result.status).toBe(PaymentStatus.AUTHORIZED)
    })

    it('should throw error if payment not found', async () => {
      const processPaymentDto: ProcessPaymentDto = {
        paymentId: 'test-payment-id',
        walletId: 'test-wallet-id',
        paymentMethodId: 'pm_test123',
      }

      mockRepository.findOne.mockResolvedValue(null)

      await expect(service.processPayment(processPaymentDto)).rejects.toThrow('Payment not found')
    })
  })

  describe('capturePayment', () => {
    it('should capture payment successfully', async () => {
      const authorizedPayment = createMockPayment()
      authorizedPayment.status = PaymentStatus.AUTHORIZED
      mockRepository.findOne.mockResolvedValue(authorizedPayment)

      // Configure mockDataSource.transaction for capturePayment
      mockDataSource.transaction.mockImplementation(async (callback) => {
        const mockTransaction = createMockTransaction()
        const mockManager = {
          create: jest.fn().mockReturnValue(createMockTransaction()),
          save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
          findOne: jest.fn().mockResolvedValue(mockTransaction),
        }
        return callback(mockManager)
      })

      const result = await service.capturePayment('test-payment-id')

      expect(result.status).toBe(PaymentStatus.CAPTURED)
      expect(mockEventBusService.publish).toHaveBeenCalled()
    })

    it('should throw error if payment cannot be captured', async () => {
      const pendingPayment = createMockPayment()
      pendingPayment.status = PaymentStatus.PENDING
      pendingPayment.canBeCaptured = jest.fn().mockReturnValue(false)
      mockRepository.findOne.mockResolvedValue(pendingPayment)

      await expect(service.capturePayment('test-payment-id')).rejects.toThrow('Payment cannot be captured in status: PENDING')
    })
  })

  describe('refundPayment', () => {
    it('should refund payment successfully', async () => {
      const capturedPayment = createMockPayment()
      capturedPayment.status = PaymentStatus.CAPTURED
      mockRepository.findOne.mockResolvedValue(capturedPayment)

      // Configure mockDataSource.transaction for refundPayment
      mockDataSource.transaction.mockImplementation(async (callback) => {
        const mockManager = {
          create: jest.fn().mockReturnValue(createMockTransaction()),
          save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
          findOne: jest.fn(),
        }
        return callback(mockManager)
      })

      const result = await service.refundPayment('test-payment-id', 50)

      expect(result.refundedAmount).toBe(50)
      expect(result.status).toBe(PaymentStatus.PARTIALLY_REFUNDED)
      expect(mockEventBusService.publish).toHaveBeenCalled()
    })

    it('should mark payment as fully refunded if refund amount exceeds payment amount', async () => {
      const capturedPayment = createMockPayment()
      capturedPayment.status = PaymentStatus.CAPTURED
      capturedPayment.amount = 100
      mockRepository.findOne.mockResolvedValue(capturedPayment)

      // Configure mockDataSource.transaction for refundPayment
      mockDataSource.transaction.mockImplementation(async (callback) => {
        const mockManager = {
          create: jest.fn().mockReturnValue(createMockTransaction()),
          save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
          findOne: jest.fn(),
        }
        return callback(mockManager)
      })

      const result = await service.refundPayment('test-payment-id', 150)

      expect(result.refundedAmount).toBe(150)
      expect(result.status).toBe(PaymentStatus.REFUNDED)
      expect(mockEventBusService.publish).toHaveBeenCalled()
    })
  })
})
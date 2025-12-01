import { Test, TestingModule } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import { Repository, DataSource } from 'typeorm'
import { WalletService } from '../src/modules/payments/wallet.service'
import { Wallet } from '../src/modules/payments/entities/wallet.entity'
import { WalletType, WalletStatus } from '../src/modules/payments/enums'
import { Transaction } from '../src/modules/payments/entities/transaction.entity'
import { EventBusService } from '../src/modules/event-bus/event-bus.service'

describe('WalletService', () => {
  let service: WalletService
  let walletRepository: Repository<Wallet>
  let transactionRepository: Repository<Transaction>
  let dataSource: DataSource
  let eventBusService: EventBusService

  const createMockWallet = (balance = 100) => ({
    id: 'test-wallet-id',
    userId: 'test-user-id',
    type: WalletType.CLIENT,
    balance: balance,
    pendingBalance: 0,
    status: WalletStatus.ACTIVE,
    currency: 'USD',
    canDebit: jest.fn().mockReturnValue(true),
    canCredit: jest.fn().mockReturnValue(true),
    debit: jest.fn(function(amount) { 
      this.balance = Number(this.balance) - Number(amount); 
      return this;
    }),
    credit: jest.fn(function(amount) { 
      this.balance = Number(this.balance) + Number(amount); 
      return this;
    }),
    save: jest.fn(),
  })

  let mockWallet = createMockWallet()

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  }

  const mockEventBusService = {
    publish: jest.fn(),
    subscribe: jest.fn(),
  }

  const mockTransaction = {
    id: 'test-transaction-id',
    calculateNetAmount: jest.fn(),
    save: jest.fn(),
  }

  const mockManager = {
    save: jest.fn(),
    create: jest.fn().mockReturnValue(mockTransaction),
    findOne: jest.fn(),
  }

  const mockDataSource = {
    transaction: jest.fn((callback) => callback(mockManager)),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WalletService,
        {
          provide: getRepositoryToken(Wallet),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(Transaction),
          useValue: mockRepository,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
        {
          provide: EventBusService,
          useValue: mockEventBusService,
        },
      ],
    }).compile()

    service = module.get<WalletService>(WalletService)
    walletRepository = module.get<Repository<Wallet>>(getRepositoryToken(Wallet))
    transactionRepository = module.get<Repository<Transaction>>(getRepositoryToken(Transaction))
    dataSource = module.get<DataSource>(DataSource)
    eventBusService = module.get<EventBusService>(EventBusService)
  })

  beforeEach(() => {
    // Reset mock wallet before each test
    mockWallet = createMockWallet()
    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('createWallet', () => {
    it('should create a new wallet', async () => {
      const createWalletDto = {
        userId: 'test-user-id',
        type: WalletType.CLIENT,
        currency: 'USD',
      }

      mockRepository.create.mockReturnValue(mockWallet)
      mockRepository.save.mockResolvedValue(mockWallet)

      const result = await service.createWallet(createWalletDto)

      expect(mockRepository.create).toHaveBeenCalledWith({
        ...createWalletDto,
        balance: 0,
        pendingBalance: 0,
        status: WalletStatus.ACTIVE,
      })
      expect(mockRepository.save).toHaveBeenCalledWith(mockWallet)
      expect(result).toEqual(mockWallet)
    })
  })

  describe('getWalletByUserId', () => {
    it('should return wallet if found', async () => {
      mockRepository.findOne.mockResolvedValue(mockWallet)

      const result = await service.getWalletByUserId('test-user-id', WalletType.CLIENT)

      expect(result).toEqual(mockWallet)
    })

    it('should throw error if wallet not found', async () => {
      mockRepository.findOne.mockResolvedValue(null)

      await expect(service.getWalletByUserId('non-existent-user', WalletType.CLIENT)).rejects.toThrow('Wallet not found for user non-existent-user with type CLIENT')
    })
  })

  describe('creditWallet', () => {
    it('should credit wallet successfully', async () => {
      const creditWalletDto = {
        walletId: 'test-wallet-id',
        amount: 50,
        description: 'Test credit',
      }

      mockManager.findOne.mockResolvedValue(mockWallet)
      mockManager.save.mockImplementation((wallet) => Promise.resolve(wallet))

      const result = await service.creditWallet(creditWalletDto)

      expect(result.balance).toBe(150)
      expect(mockManager.save).toHaveBeenCalled()
      expect(mockEventBusService.publish).toHaveBeenCalled()
    })

    it('should throw error if wallet is not active', async () => {
      const creditWalletDto = {
        walletId: 'test-wallet-id',
        amount: 50,
        description: 'Test credit',
      }

      const inactiveWallet = { ...mockWallet, status: WalletStatus.SUSPENDED }
      mockManager.findOne.mockResolvedValue(inactiveWallet)

      await expect(service.creditWallet(creditWalletDto)).rejects.toThrow('Wallet is not active')
    })
  })

  describe('debitWallet', () => {
    it('should debit wallet successfully', async () => {
      const debitWalletDto = {
        walletId: 'test-wallet-id',
        amount: 30,
        description: 'Test debit',
      }

      mockManager.findOne.mockResolvedValue(mockWallet)
      mockManager.save.mockImplementation((wallet) => Promise.resolve(wallet))

      const result = await service.debitWallet(debitWalletDto)

      expect(result.balance).toBe(70)
      expect(mockManager.save).toHaveBeenCalled()
      expect(mockEventBusService.publish).toHaveBeenCalled()
    })

    it('should throw error if insufficient balance', async () => {
      const debitWalletDto = {
        walletId: 'test-wallet-id',
        amount: 200,
        description: 'Test debit',
      }

      // Create a wallet with insufficient balance
      const lowBalanceWallet = createMockWallet(50)
      lowBalanceWallet.canDebit = jest.fn().mockReturnValue(false)
      mockManager.findOne.mockResolvedValue(lowBalanceWallet)

      await expect(service.debitWallet(debitWalletDto)).rejects.toThrow('Insufficient balance or wallet not active')
    })
  })
})
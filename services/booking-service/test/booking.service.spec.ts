import { Test, TestingModule } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { EventBusService } from '@barber_ai/contracts'
import { BookingService } from '../src/modules/booking/services/booking.service'
import { Booking, BookingStatus } from '../src/modules/booking/entities/booking.entity'
import { CreateBookingDto } from '../src/modules/booking/dto/create-booking.dto'
import { UpdateBookingDto } from '../src/modules/booking/dto/update-booking.dto'
import { ConflictException, NotFoundException } from '@nestjs/common'

describe('BookingService', () => {
  let service: BookingService
  let bookingRepository: Repository<Booking>
  let eventBus: EventBusService

  const mockBookingRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    createQueryBuilder: jest.fn(),
  }

  const mockEventBus = {
    publish: jest.fn().mockResolvedValue(undefined),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingService,
        {
          provide: getRepositoryToken(Booking),
          useValue: mockBookingRepository,
        },
        {
          provide: EventBusService,
          useValue: mockEventBus,
        },
      ],
    }).compile()

    service = module.get<BookingService>(BookingService)
    bookingRepository = module.get<Repository<Booking>>(getRepositoryToken(Booking))
    eventBus = module.get<EventBusService>(EventBusService)
  })

  afterEach(() => {
    jest.clearAllMocks()
    // Reset all mock implementations to ensure clean state
    mockBookingRepository.findOne.mockReset()
    mockBookingRepository.save.mockReset()
    mockBookingRepository.update.mockReset()
    mockBookingRepository.create.mockReset()
    mockEventBus.publish.mockReset()
  })

  describe('createBooking', () => {
    const createBookingDto: CreateBookingDto = {
      clientId: 'client-123',
      barberId: 'barber-456',
      serviceId: 'service-789',
      date: '2024-01-15',
      startTime: '10:00',
      endTime: '11:00',
      price: 50.00,
      notes: 'Corte de cabello normal',
    }

    const savedBooking = {
      id: 'booking-123',
      ...createBookingDto,
      status: 'PENDING' as BookingStatus,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    it('should create a booking successfully when barber is available', async () => {
      // Mock checkAvailability to return true
      jest.spyOn(service as any, 'checkAvailability').mockResolvedValue(true)
      mockBookingRepository.create.mockReturnValue(savedBooking)
      mockBookingRepository.save.mockResolvedValue(savedBooking)

      const result = await service.createBooking(createBookingDto)

      expect(service['checkAvailability']).toHaveBeenCalledWith(
        createBookingDto.barberId,
        createBookingDto.date,
        createBookingDto.startTime,
        createBookingDto.endTime
      )
      expect(mockBookingRepository.create).toHaveBeenCalledWith({
        ...createBookingDto,
        status: 'PENDING',
      })
      expect(mockBookingRepository.save).toHaveBeenCalledWith(savedBooking)
      expect(eventBus.publish).toHaveBeenCalledWith({
        eventId: `booking-created-${savedBooking.id}`,
        eventType: 'booking.created',
        aggregateId: savedBooking.id,
        aggregateType: 'BOOKING',
        payload: {
          appointmentId: savedBooking.id,
          barberId: savedBooking.barberId,
          clientId: savedBooking.clientId,
          serviceId: savedBooking.serviceId,
          date: savedBooking.date,
          startTime: savedBooking.startTime,
          endTime: savedBooking.endTime,
          price: savedBooking.price,
          notes: savedBooking.notes,
        },
        timestamp: expect.any(String),
        version: 1,
      })
      expect(result).toEqual(savedBooking)
    })

    it('should throw ConflictException when barber is not available', async () => {
      jest.spyOn(service as any, 'checkAvailability').mockResolvedValue(false)

      await expect(service.createBooking(createBookingDto)).rejects.toThrow(
        new ConflictException('El barbero no está disponible en ese horario')
      )

      expect(mockBookingRepository.create).not.toHaveBeenCalled()
      expect(mockBookingRepository.save).not.toHaveBeenCalled()
      expect(eventBus.publish).not.toHaveBeenCalled()
    })
  })

  describe('checkAvailability', () => {
    it('should return true when no conflicting bookings exist', async () => {
      const barberId = 'barber-123'
      const date = '2024-01-15'
      const startTime = '10:00'
      const endTime = '11:00'

      mockBookingRepository.createQueryBuilder.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        andWhereIn: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(0),
      })

      const result = await service['checkAvailability'](barberId, date, startTime, endTime)

      expect(result).toBe(true)
    })

    it('should return false when conflicting bookings exist', async () => {
      const barberId = 'barber-123'
      const date = '2024-01-15'
      const startTime = '10:00'
      const endTime = '11:00'

      mockBookingRepository.createQueryBuilder.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        andWhereIn: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(1),
      })

      const result = await service['checkAvailability'](barberId, date, startTime, endTime)

      expect(result).toBe(false)
    })
  })

  describe('getBookingsByClient', () => {
    it('should return bookings for a specific client', async () => {
      const clientId = 'client-123'
      const bookings = [
        { id: 'booking-1', clientId, status: 'CONFIRMED' },
        { id: 'booking-2', clientId, status: 'PENDING' },
      ]

      mockBookingRepository.find.mockResolvedValue(bookings)

      const result = await service.getBookingsByClient(clientId)

      expect(mockBookingRepository.find).toHaveBeenCalledWith({
        where: { clientId },
        order: { date: 'DESC', startTime: 'DESC' },
      })
      expect(result).toEqual(bookings)
    })
  })

  describe('getBookingsByBarber', () => {
    it('should return bookings for a specific barber', async () => {
      const barberId = 'barber-123'
      const bookings = [
        { id: 'booking-1', barberId, status: 'CONFIRMED' },
        { id: 'booking-2', barberId, status: 'PENDING' },
      ]

      mockBookingRepository.find.mockResolvedValue(bookings)

      const result = await service.getBookingsByBarber(barberId)

      expect(mockBookingRepository.find).toHaveBeenCalledWith({
        where: { barberId },
        order: { date: 'ASC', startTime: 'ASC' },
      })
      expect(result).toEqual(bookings)
    })
  })

  describe('confirmBooking', () => {
    it('should confirm a booking successfully', async () => {
      const bookingId = 'booking-123'
      const confirmedBy = 'CLIENT' as const
      const existingBooking = {
        id: bookingId,
        status: 'PENDING' as BookingStatus,
      }
      const updatedBooking = {
        ...existingBooking,
        status: 'CONFIRMED' as BookingStatus,
        confirmedBy,
        confirmedAt: new Date(),
        barberId: 'barber-123',
        clientId: 'client-123',
      }

      mockBookingRepository.findOne.mockResolvedValue(existingBooking)
      mockBookingRepository.save.mockResolvedValue(updatedBooking)

      await service.confirmBooking(bookingId, confirmedBy)

      expect(mockBookingRepository.findOne).toHaveBeenCalledWith({
        where: { id: bookingId },
      })
      expect(mockBookingRepository.save).toHaveBeenCalledWith(expect.objectContaining({
        id: bookingId,
        status: 'CONFIRMED',
        confirmedBy,
        confirmedAt: expect.any(Date),
      }))
      expect(eventBus.publish).toHaveBeenCalledWith({
        eventId: `booking-confirmed-${bookingId}`,
        eventType: 'booking.confirmed',
        aggregateId: bookingId,
        aggregateType: 'BOOKING',
        payload: {
          appointmentId: bookingId,
          barberId: updatedBooking.barberId,
          clientId: updatedBooking.clientId,
          confirmedAt: updatedBooking.confirmedAt.toISOString(),
          confirmedBy: updatedBooking.confirmedBy,
        },
        timestamp: expect.any(String),
        version: 1,
      })
    })

    it('should throw NotFoundException when booking does not exist', async () => {
      const bookingId = 'non-existent'
      const confirmedBy = 'CLIENT' as const

      mockBookingRepository.findOne.mockResolvedValue(undefined)

      await expect(service.confirmBooking(bookingId, confirmedBy)).rejects.toThrow(
        new NotFoundException('Cita no encontrada')
      )

      expect(mockBookingRepository.update).not.toHaveBeenCalled()
      expect(eventBus.publish).not.toHaveBeenCalled()
    })
  })

  describe('cancelBooking', () => {
    it('should cancel a booking successfully', async () => {
      const bookingId = 'booking-456' // Use different ID to avoid conflicts
      const reason = 'Cambio de planes'
      const cancelledBy = 'client-123'
      const existingBooking = {
        id: bookingId,
        status: 'PENDING' as BookingStatus,
      }
      const updatedBooking = {
        ...existingBooking,
        status: 'CANCELLED' as BookingStatus,
        cancellationReason: reason,
        cancelledBy: cancelledBy,
        cancelledAt: new Date(),
        barberId: 'barber-123',
        clientId: cancelledBy,
      }

      // Create fresh mocks for this test
      const freshFindOneMock = jest.fn().mockResolvedValue(existingBooking)
      const freshSaveMock = jest.fn().mockResolvedValue(updatedBooking)
      
      mockBookingRepository.findOne = freshFindOneMock
      mockBookingRepository.save = freshSaveMock

      await service.cancelBooking(bookingId, reason, cancelledBy)

      expect(freshFindOneMock).toHaveBeenCalledWith({ where: { id: bookingId } })
      expect(freshSaveMock).toHaveBeenCalledWith(expect.objectContaining({
        id: bookingId,
        status: 'CANCELLED',
        cancellationReason: reason,
        cancelledBy,
        cancelledAt: expect.any(Date),
      }))
      expect(eventBus.publish).toHaveBeenCalledWith({
        eventId: `booking-cancelled-${bookingId}`,
        eventType: 'booking.cancelled',
        aggregateId: bookingId,
        aggregateType: 'BOOKING',
        payload: {
          appointmentId: bookingId,
          barberId: updatedBooking.barberId,
          clientId: updatedBooking.clientId,
          reason: updatedBooking.cancellationReason,
          cancelledBy: 'CLIENT',
          cancelledAt: updatedBooking.cancelledAt.toISOString(),
        },
        timestamp: expect.any(String),
        version: 1,
      })
    })
  })

  describe('completeBooking', () => {
    it('should complete a booking successfully', async () => {
      const bookingId = 'booking-123'
      const existingBooking = {
        id: bookingId,
        status: 'CONFIRMED' as BookingStatus,
        barberId: 'barber-123',
        clientId: 'client-123',
      }
      const updatedBooking = {
        ...existingBooking,
        status: 'COMPLETED' as BookingStatus,
        updatedAt: new Date(),
      }

      mockBookingRepository.findOne.mockResolvedValue(existingBooking)
      mockBookingRepository.save.mockResolvedValue(updatedBooking)

      await service.completeBooking(bookingId)

      expect(mockBookingRepository.findOne).toHaveBeenCalledWith({ where: { id: bookingId } })
      expect(mockBookingRepository.save).toHaveBeenCalledWith(expect.objectContaining({
        id: bookingId,
        status: 'COMPLETED',
      }))
      expect(eventBus.publish).toHaveBeenCalledWith({
        eventId: `booking-completed-${bookingId}`,
        eventType: 'booking.completed',
        aggregateId: bookingId,
        aggregateType: 'BOOKING',
        payload: {
          appointmentId: bookingId,
          barberId: updatedBooking.barberId,
          clientId: updatedBooking.clientId,
          completedAt: updatedBooking.updatedAt.toISOString(),
        },
        timestamp: expect.any(String),
        version: 1,
      })
    })
  })
})
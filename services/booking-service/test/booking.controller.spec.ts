import { Test, TestingModule } from '@nestjs/testing'
import { BookingController } from '../src/modules/booking/controllers/booking.controller'
import { BookingService } from '../src/modules/booking/services/booking.service'
import { CreateBookingDto } from '../src/modules/booking/dto/create-booking.dto'
import { UpdateBookingDto } from '../src/modules/booking/dto/update-booking.dto'
import { ConflictException, NotFoundException } from '@nestjs/common'

describe('BookingController', () => {
  let controller: BookingController
  let bookingService: BookingService

  const mockBookingService = {
    createBooking: jest.fn(),
    getBookingsByClient: jest.fn(),
    getBookingsByBarber: jest.fn(),
    confirmBooking: jest.fn(),
    cancelBooking: jest.fn(),
    completeBooking: jest.fn(),
    getBookingById: jest.fn(),
    getBookingsByDate: jest.fn(),
    getUpcomingBookings: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BookingController],
      providers: [
        {
          provide: BookingService,
          useValue: mockBookingService,
        },
      ],
    }).compile()

    controller = module.get<BookingController>(BookingController)
    bookingService = module.get<BookingService>(BookingService)
  })

  afterEach(() => {
    jest.clearAllMocks()
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

    const createdBooking = {
      id: 'booking-123',
      ...createBookingDto,
      status: 'PENDING',
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    it('should create a booking successfully', async () => {
      mockBookingService.createBooking.mockResolvedValue(createdBooking)

      const result = await controller.createBooking(createBookingDto)

      expect(bookingService.createBooking).toHaveBeenCalledWith(createBookingDto)
      expect(result).toEqual(createdBooking)
    })

    it('should throw ConflictException when booking conflicts', async () => {
      mockBookingService.createBooking.mockRejectedValue(
        new ConflictException('El barbero no está disponible en ese horario')
      )

      await expect(controller.createBooking(createBookingDto)).rejects.toThrow(
        new ConflictException('El barbero no está disponible en ese horario')
      )
    })
  })

  describe('getBookingsByClient', () => {
    it('should return bookings for a specific client', async () => {
      const clientId = 'client-123'
      const bookings = [
        { id: 'booking-1', clientId, status: 'CONFIRMED' },
        { id: 'booking-2', clientId, status: 'PENDING' },
      ]

      mockBookingService.getBookingsByClient.mockResolvedValue(bookings)

      const result = await controller.getBookingsByClient(clientId)

      expect(bookingService.getBookingsByClient).toHaveBeenCalledWith(clientId)
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

      mockBookingService.getBookingsByBarber.mockResolvedValue(bookings)

      const result = await controller.getBookingsByBarber(barberId)

      expect(bookingService.getBookingsByBarber).toHaveBeenCalledWith(barberId)
      expect(result).toEqual(bookings)
    })
  })

  describe('confirmBooking', () => {
    it('should confirm a booking successfully', async () => {
      const bookingId = 'booking-123'
      const confirmedBy = 'CLIENT'
      const mockResponse = {
        id: bookingId,
        status: 'CONFIRMED',
      }

      mockBookingService.confirmBooking.mockResolvedValue(mockResponse)

      const result = await controller.confirmBooking(bookingId, confirmedBy)

      expect(bookingService.confirmBooking).toHaveBeenCalledWith(bookingId, confirmedBy)
      expect(result).toEqual(mockResponse)
    })

    it('should throw NotFoundException when booking not found', async () => {
      const bookingId = 'non-existent'
      const confirmedBy = 'CLIENT'

      mockBookingService.confirmBooking.mockRejectedValue(
        new NotFoundException('Reserva no encontrada')
      )

      await expect(controller.confirmBooking(bookingId, confirmedBy)).rejects.toThrow(
        new NotFoundException('Reserva no encontrada')
      )
    })
  })

  describe('cancelBooking', () => {
    it('should cancel a booking successfully', async () => {
      const bookingId = 'booking-123'
      const reason = 'Cambio de planes'
      const cancelledBy = 'client-123'
      const mockResponse = {
        id: bookingId,
        status: 'CANCELLED',
      }

      mockBookingService.cancelBooking.mockResolvedValue(mockResponse)

      const result = await controller.cancelBooking(bookingId, reason, cancelledBy)

      expect(bookingService.cancelBooking).toHaveBeenCalledWith(bookingId, reason, cancelledBy)
      expect(result).toEqual(mockResponse)
    })
  })

  describe('completeBooking', () => {
    it('should complete a booking successfully', async () => {
      const bookingId = 'booking-123'
      const mockResponse = {
        id: bookingId,
        status: 'COMPLETED',
      }

      mockBookingService.completeBooking.mockResolvedValue(mockResponse)

      const result = await controller.completeBooking(bookingId)

      expect(bookingService.completeBooking).toHaveBeenCalledWith(bookingId)
      expect(result).toEqual(mockResponse)
    })
  })

  describe('getBookingById', () => {
    it('should return a booking by ID', async () => {
      const bookingId = 'booking-123'
      const booking = { id: bookingId, status: 'CONFIRMED' }

      mockBookingService.getBookingById.mockResolvedValue(booking)

      const result = await controller.getBookingById(bookingId)

      expect(bookingService.getBookingById).toHaveBeenCalledWith(bookingId)
      expect(result).toEqual(booking)
    })

    it('should throw NotFoundException when booking not found', async () => {
      const bookingId = 'non-existent'

      mockBookingService.getBookingById.mockRejectedValue(
        new NotFoundException('Booking not found')
      )

      await expect(controller.getBookingById(bookingId)).rejects.toThrow(
        new NotFoundException('Booking not found')
      )
    })
  })

  describe('getUpcomingBookings', () => {
    it('should return upcoming bookings', async () => {
      const upcomingBookings = [
        { id: 'booking-1', date: '2024-01-16', status: 'CONFIRMED' },
        { id: 'booking-2', date: '2024-01-17', status: 'PENDING' },
      ]

      mockBookingService.getUpcomingBookings.mockResolvedValue(upcomingBookings)

      const result = await controller.getUpcomingBookings()

      expect(bookingService.getUpcomingBookings).toHaveBeenCalled()
      expect(result).toEqual(upcomingBookings)
    })
  })
})
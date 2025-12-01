import { Test, TestingModule } from '@nestjs/testing'
import * as request from 'supertest'
import { getRepositoryToken } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { ValidationPipe } from '@nestjs/common'
import { Booking, BookingStatus } from '../src/modules/booking/entities/booking.entity'
import { BookingController } from '../src/modules/booking/controllers/booking.controller'
import { BookingService } from '../src/modules/booking/services/booking.service'
import { EventBusService } from '@barber_ai/contracts'
import { HealthController } from '../src/modules/health/health.controller'
import { HealthService } from '../src/modules/health/health.service'

describe('Booking Integration Tests', () => {
  let app: any
  let bookingRepository: Repository<Booking>

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
    publish: jest.fn(),
    subscribe: jest.fn(),
    replayEvents: jest.fn(),
  }

  const mockHealthService = {
    getHealthStatus: jest.fn(),
    getStartTime: jest.fn(() => Date.now()),
  }

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [BookingController, HealthController],
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
        {
          provide: HealthService,
          useValue: mockHealthService,
        },
      ],
    }).compile()

    app = moduleFixture.createNestApplication() as any
    app.useGlobalPipes(new ValidationPipe())
    await app.init()

    bookingRepository = moduleFixture.get<Repository<Booking>>(getRepositoryToken(Booking))
  })

  afterEach(async () => {
    if (app) {
      await app.close()
    }
    jest.clearAllMocks()
    mockBookingRepository.createQueryBuilder.mockClear()
  })

  describe('POST /api/v1/bookings', () => {
    const createBookingDto = {
      clientId: '123e4567-e89b-12d3-a456-426614174000',
      barberId: '123e4567-e89b-12d3-a456-426614174001',
      serviceId: '123e4567-e89b-12d3-a456-426614174002',
      date: '2024-01-15',
      startTime: '10:00',
      endTime: '11:00',
      price: 50.00,
      notes: 'Corte de cabello normal',
    }

    const createdBooking = {
      id: 'booking-123',
      ...createBookingDto,
      status: 'PENDING' as BookingStatus,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    it('should create a booking successfully', async () => {
      mockBookingRepository.create.mockReturnValue(createdBooking)
      mockBookingRepository.save.mockResolvedValue(createdBooking)
      mockBookingRepository.createQueryBuilder.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(0),
      })

      const response = await request(app.getHttpServer())
        .post('/bookings')
        .send(createBookingDto)
        .expect(201)

      expect(response.body).toMatchObject({
        id: createdBooking.id,
        clientId: createBookingDto.clientId,
        barberId: createBookingDto.barberId,
        serviceId: createBookingDto.serviceId,
        status: 'PENDING',
      })
    })

    it('should return 409 when booking conflicts', async () => {
      mockBookingRepository.createQueryBuilder.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(1), // Conflict exists
      })

      const response = await request(app.getHttpServer())
        .post('/bookings')
        .send(createBookingDto)
        .expect(409)

      expect(response.body).toMatchObject({
        statusCode: 409,
        message: 'El barbero no está disponible en ese horario',
      })
    })

    it('should return 400 for invalid input', async () => {
      const invalidDto = {
        clientId: '', // Invalid
        barberId: 'barber-456',
        // Missing required fields
      }

      const response = await request(app.getHttpServer())
        .post('/bookings')
        .send(invalidDto)
        .expect(400)

      expect(response.body).toHaveProperty('statusCode', 400)
    })
  })

  describe('GET /api/v1/bookings/client/:clientId', () => {
    it('should return bookings for a client', async () => {
      const clientId = 'client-123'
      const bookings = [
        { id: 'booking-1', clientId, status: 'CONFIRMED' as BookingStatus },
        { id: 'booking-2', clientId, status: 'PENDING' as BookingStatus },
      ]

      mockBookingRepository.find.mockResolvedValue(bookings)

      const response = await request(app.getHttpServer())
        .get(`/bookings/client/${clientId}`)
        .expect(200)

      expect(response.body).toEqual(bookings)
    })

    it('should return empty array when no bookings exist', async () => {
      const clientId = 'client-123'
      mockBookingRepository.find.mockResolvedValue([])

      const response = await request(app.getHttpServer())
        .get(`/bookings/client/${clientId}`)
        .expect(200)

      expect(response.body).toEqual([])
    })
  })

  describe('GET /api/v1/bookings/barber/:barberId', () => {
    it('should return bookings for a barber', async () => {
      const barberId = 'barber-123'
      const bookings = [
        { id: 'booking-1', barberId, status: 'CONFIRMED' as BookingStatus },
        { id: 'booking-2', barberId, status: 'PENDING' as BookingStatus },
      ]

      mockBookingRepository.find.mockResolvedValue(bookings)

      const response = await request(app.getHttpServer())
        .get(`/bookings/barber/${barberId}`)
        .expect(200)

      expect(response.body).toEqual(bookings)
    })
  })

  describe('PUT /api/v1/bookings/:bookingId/confirm', () => {
    it('should confirm a booking successfully', async () => {
      const bookingId = 'booking-123'
      const existingBooking = {
        id: bookingId,
        status: 'PENDING' as BookingStatus,
        clientId: 'client-123',
        barberId: 'barber-456',
      }
      
      const confirmedBooking = {
        ...existingBooking,
        status: 'CONFIRMED' as BookingStatus,
        confirmedBy: 'CLIENT',
        confirmedAt: new Date(),
      }

      mockBookingRepository.findOne.mockResolvedValue(existingBooking)
      mockBookingRepository.save.mockResolvedValue(confirmedBooking)

      const response = await request(app.getHttpServer())
        .put(`/bookings/${bookingId}/confirm?confirmedBy=CLIENT`)
        .expect(200)

      expect(response.body).toMatchObject({
        id: bookingId,
        status: 'CONFIRMED',
      })
    })

    it('should return 404 when booking not found', async () => {
      const bookingId = 'non-existent'
      mockBookingRepository.findOne.mockResolvedValue(undefined)

      const response = await request(app.getHttpServer())
        .put(`/bookings/${bookingId}/confirm?confirmedBy=CLIENT`)
        .expect(404)

      expect(response.body).toHaveProperty('statusCode', 404)
    })
  })

  describe('PUT /api/v1/bookings/:bookingId/cancel', () => {
    it('should cancel a booking successfully', async () => {
      const bookingId = 'booking-123'
      const existingBooking = {
        id: bookingId,
        status: 'PENDING' as BookingStatus,
        clientId: 'client-123',
        barberId: 'barber-456',
      }
      
      const cancelledBooking = {
        ...existingBooking,
        status: 'CANCELLED' as BookingStatus,
        cancellationReason: 'Cambio de planes',
        cancelledBy: 'client-123',
        cancelledAt: new Date(),
      }

      mockBookingRepository.findOne.mockResolvedValue(existingBooking)
      mockBookingRepository.save.mockResolvedValue(cancelledBooking)

      const response = await request(app.getHttpServer())
        .put(`/bookings/${bookingId}/cancel?reason=Cambio%20de%20planes&cancelledBy=client-123`)
        .expect(200)

      expect(response.body).toMatchObject({
        id: bookingId,
        status: 'CANCELLED',
      })
    })
  })

  describe('PUT /api/v1/bookings/:bookingId/complete', () => {
    it('should complete a booking successfully', async () => {
      const bookingId = 'booking-123'
      const existingBooking = {
        id: bookingId,
        status: 'CONFIRMED' as BookingStatus,
        clientId: 'client-123',
        barberId: 'barber-456',
      }
      
      const completedBooking = {
        ...existingBooking,
        status: 'COMPLETED' as BookingStatus,
        completedAt: new Date(),
      }

      mockBookingRepository.findOne.mockResolvedValue(existingBooking)
      mockBookingRepository.save.mockResolvedValue(completedBooking)

      const response = await request(app.getHttpServer())
        .put(`/bookings/${bookingId}/complete`)
        .expect(200)

      expect(response.body).toMatchObject({
        id: bookingId,
        status: 'COMPLETED',
      })
    })
  })

  describe('GET /api/v1/bookings/upcoming', () => {
    it('should return upcoming bookings', async () => {
      const upcomingBookings = [
        { 
          id: 'booking-1', 
          date: '2024-01-16', 
          status: 'CONFIRMED' as BookingStatus,
          clientId: 'client-123',
          barberId: 'barber-456',
          serviceId: 'service-123',
          startTime: '09:00',
          endTime: '10:00',
          price: 50,
          notes: '',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        { 
          id: 'booking-2', 
          date: '2024-01-17', 
          status: 'PENDING' as BookingStatus,
          clientId: 'client-456',
          barberId: 'barber-456',
          serviceId: 'service-456',
          startTime: '10:00',
          endTime: '11:00',
          price: 60,
          notes: '',
          createdAt: new Date(),
          updatedAt: new Date()
        },
      ]

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(upcomingBookings),
      }

      mockBookingRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder)

      const response = await request(app.getHttpServer())
        .get('/bookings/upcoming')
        .expect(200)

      expect(response.body).toEqual([
        {
          id: 'booking-1',
          clientId: 'client-123',
          barberId: 'barber-456',
          serviceId: 'service-123',
          date: '2024-01-16',
          startTime: '09:00',
          endTime: '10:00',
          price: 50,
          status: 'CONFIRMED',
          notes: '',
          confirmedBy: undefined,
          confirmedAt: undefined,
          cancellationReason: undefined,
          cancelledAt: undefined,
          createdAt: expect.any(String),
          updatedAt: expect.any(String)
        },
        {
          id: 'booking-2',
          clientId: 'client-456',
          barberId: 'barber-456',
          serviceId: 'service-456',
          date: '2024-01-17',
          startTime: '10:00',
          endTime: '11:00',
          price: 60,
          status: 'PENDING',
          notes: '',
          confirmedBy: undefined,
          confirmedAt: undefined,
          cancellationReason: undefined,
          cancelledAt: undefined,
          createdAt: expect.any(String),
          updatedAt: expect.any(String)
        }
      ])
    })
  })

  describe('GET /api/v1/bookings/:bookingId', () => {
    it('should return a booking by ID', async () => {
      const bookingId = 'booking-123'
      const booking = { id: bookingId, status: 'CONFIRMED' as BookingStatus }

      mockBookingRepository.findOne.mockResolvedValue(booking)

      const response = await request(app.getHttpServer())
        .get(`/bookings/${bookingId}`)
        .expect(200)

      expect(response.body).toEqual(booking)
    })

    it('should return 404 when booking not found', async () => {
      const bookingId = 'non-existent'
      mockBookingRepository.findOne.mockResolvedValue(undefined)

      const response = await request(app.getHttpServer())
        .get(`/bookings/${bookingId}`)
        .expect(404)

      expect(response.body).toHaveProperty('statusCode', 404)
    })
  })

  describe('Health Check', () => {
    it('should return health status', async () => {
      const response = await request(app.getHttpServer())
        .get('/health')
        .expect(200)

      expect(response.body).toHaveProperty('status')
      expect(response.body).toHaveProperty('timestamp')
      expect(response.body).toHaveProperty('services')
    })
  })
})
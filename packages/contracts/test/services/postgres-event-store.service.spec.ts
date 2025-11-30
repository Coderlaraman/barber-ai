import { Test, TestingModule } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import { Repository, MoreThan } from 'typeorm'
import { PostgresEventStore } from '../../src/services/postgres-event-store.service'
import { EventEntity, EventSnapshotEntity } from '../../src/services/postgres-event-store.service'
import { DomainEvent, EventType } from '../../src/events/base'

// Mock implementations
const mockEventRepository = {
  save: jest.fn().mockResolvedValue(undefined),
  find: jest.fn().mockResolvedValue([]),
  count: jest.fn().mockResolvedValue(0),
  create: jest.fn((entity) => entity),
}

const mockSnapshotRepository = {
  save: jest.fn().mockResolvedValue(undefined),
  findOne: jest.fn().mockResolvedValue(null),
  create: jest.fn((entity) => entity),
}

describe('PostgresEventStore', () => {
  let service: PostgresEventStore
  let eventRepository: Repository<EventEntity>
  let snapshotRepository: Repository<EventSnapshotEntity>

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostgresEventStore,
        {
          provide: getRepositoryToken(EventEntity),
          useValue: mockEventRepository,
        },
        {
          provide: getRepositoryToken(EventSnapshotEntity),
          useValue: mockSnapshotRepository,
        },
      ],
    }).compile()

    service = module.get<PostgresEventStore>(PostgresEventStore)
    eventRepository = module.get<Repository<EventEntity>>(getRepositoryToken(EventEntity))
    snapshotRepository = module.get<Repository<EventSnapshotEntity>>(getRepositoryToken(EventSnapshotEntity))

    // Clear all mocks
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('saveEvent', () => {
    const mockEvent: DomainEvent = {
      eventId: 'test-event-id',
      eventType: EventType.BOOKING_CREATED,
      aggregateId: 'test-aggregate-id',
      aggregateType: 'booking',
      payload: { bookingId: 'test-booking-id' },
      timestamp: '2023-01-01T00:00:00Z',
      version: 1,
    }

    it('should save event to database', async () => {
      const expectedEntity = {
        eventId: mockEvent.eventId,
        eventType: mockEvent.eventType,
        aggregateId: mockEvent.aggregateId,
        aggregateType: mockEvent.aggregateType,
        payload: JSON.stringify(mockEvent.payload),
        timestamp: mockEvent.timestamp,
        version: mockEvent.version,
      }

      mockEventRepository.create.mockReturnValue(expectedEntity)

      await service.saveEvent(mockEvent)

      expect(eventRepository.create).toHaveBeenCalledWith({
        eventId: mockEvent.eventId,
        eventType: mockEvent.eventType,
        aggregateId: mockEvent.aggregateId,
        aggregateType: mockEvent.aggregateType,
        payload: mockEvent.payload,
        metadata: mockEvent.metadata,
        timestamp: mockEvent.timestamp,
        version: mockEvent.version,
        createdAt: expect.any(Date),
        retryCount: 0,
        status: 'PENDING'
      })
      expect(eventRepository.save).toHaveBeenCalledWith(expectedEntity)
    })

    it('should handle errors when saving fails', async () => {
      const error = new Error('Database save failed')
      mockEventRepository.save.mockRejectedValueOnce(error)

      await expect(service.saveEvent(mockEvent)).rejects.toThrow(error)
    })
  })

  describe('getEvents', () => {
    it('should retrieve events for aggregate', async () => {
      const aggregateId = 'test-aggregate-id'
      const mockEventEntities = [
        {
          eventId: 'event-1',
          eventType: EventType.BOOKING_CREATED,
          aggregateId,
          aggregateType: 'booking',
          payload: '{"bookingId":"booking-1"}',
          timestamp: '2023-01-01T00:00:00Z',
          version: 1,
        },
        {
          eventId: 'event-2',
          eventType: EventType.BOOKING_CONFIRMED,
          aggregateId,
          aggregateType: 'booking',
          payload: '{"bookingId":"booking-1"}',
          timestamp: '2023-01-02T00:00:00Z',
          version: 2,
        },
      ]

      mockEventRepository.find.mockResolvedValueOnce(mockEventEntities)

      const result = await service.getEvents(aggregateId)

      expect(eventRepository.find).toHaveBeenCalledWith({
        where: { aggregateId },
        order: { timestamp: 'ASC' },
      })

      expect(result).toHaveLength(2)
      expect(result[0]).toEqual({
        eventId: 'event-1',
        eventType: EventType.BOOKING_CREATED,
        aggregateId,
        aggregateType: 'booking',
        payload: '{"bookingId":"booking-1"}',
        metadata: undefined,
        timestamp: mockEventEntities[0].timestamp,
        version: 1,
      })
    })

    it('should return empty array when no events found', async () => {
      const aggregateId = 'non-existent-id'
      mockEventRepository.find.mockResolvedValueOnce([])

      const result = await service.getEvents(aggregateId)

      expect(eventRepository.find).toHaveBeenCalledWith({
        where: { aggregateId },
        order: { timestamp: 'ASC' },
      })
      expect(result).toEqual([])
    })
  })

  describe('getEventsByType', () => {
    it('should retrieve events by type', async () => {
      const eventType = EventType.BOOKING_CREATED
      const mockEventEntities = [
        {
          eventId: 'event-1',
          eventType,
          aggregateId: 'aggregate-1',
          aggregateType: 'booking',
          payload: '{"bookingId":"booking-1"}',
          timestamp: new Date('2023-01-01T00:00:00Z'),
          version: 1,
        },
        {
          eventId: 'event-2',
          eventType,
          aggregateId: 'aggregate-2',
          aggregateType: 'booking',
          payload: '{"bookingId":"booking-2"}',
          timestamp: '2023-01-02T00:00:00Z',
          version: 1,
        },
      ]

      mockEventRepository.find.mockResolvedValueOnce(mockEventEntities)

      const result = await service.getEventsByType(eventType)

      expect(eventRepository.find).toHaveBeenCalledWith({
        where: { eventType },
        order: { timestamp: 'ASC' },
      })

      expect(result).toHaveLength(2)
    })
  })

  describe('createSnapshot', () => {
    it('should create snapshot for aggregate', async () => {
      const aggregateId = 'test-aggregate-id'
      const mockEvents = [
        {
          eventId: 'event-1',
          eventType: EventType.BOOKING_CREATED,
          aggregateId,
          aggregateType: 'booking',
          payload: { bookingId: 'booking-1' },
          timestamp: '2023-01-01T00:00:00Z',
          version: 1,
        }
      ]

      // Mock the getEvents method to return events
      jest.spyOn(service, 'getEvents').mockResolvedValueOnce(mockEvents)

      const expectedEntity = {
        aggregateId,
        aggregateType: 'booking',
        snapshot: {
          aggregateId,
          lastEventTimestamp: '2023-01-01T00:00:00Z',
          eventCount: 1,
          lastEventType: EventType.BOOKING_CREATED
        },
        version: 1,
        createdAt: expect.any(Date)
      }

      mockSnapshotRepository.create.mockReturnValue(expectedEntity)

      await service.createSnapshot(aggregateId)

      expect(service.getEvents).toHaveBeenCalledWith(aggregateId)
      expect(snapshotRepository.create).toHaveBeenCalledWith(expectedEntity)
      expect(snapshotRepository.save).toHaveBeenCalledWith(expectedEntity)
    })
  })

  describe('getSnapshot', () => {
    it('should retrieve snapshot for aggregate', async () => {
      const aggregateId = 'test-aggregate-id'
      const mockSnapshotEntity = {
        aggregateId,
        snapshot: {
          aggregateId,
          lastEventTimestamp: '2023-01-01T00:00:00Z',
          eventCount: 2,
          lastEventType: EventType.BOOKING_CONFIRMED
        },
        version: 5,
        createdAt: new Date(),
      }

      mockSnapshotRepository.findOne.mockResolvedValueOnce(mockSnapshotEntity)

      const result = await service.getSnapshot(aggregateId)

      expect(snapshotRepository.findOne).toHaveBeenCalledWith({
        where: { aggregateId },
        order: { createdAt: 'DESC' },
      })

      expect(result).toEqual({
        aggregateId,
        lastEventTimestamp: '2023-01-01T00:00:00Z',
        eventCount: 2,
        lastEventType: EventType.BOOKING_CONFIRMED
      })
    })

    it('should return null when no snapshot found', async () => {
      const aggregateId = 'non-existent-id'
      mockSnapshotRepository.findOne.mockResolvedValueOnce(null)

      const result = await service.getSnapshot(aggregateId)

      expect(result).toBeNull()
    })
  })
})
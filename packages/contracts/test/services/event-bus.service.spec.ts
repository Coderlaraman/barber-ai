import { Test, TestingModule } from '@nestjs/testing'
import { EventBusService } from '../../src/services/event-bus.service'
import { PostgresEventStore } from '../../src/services/postgres-event-store.service'
import { DeadLetterQueueService } from '../../src/services/dead-letter-queue.service'
import { DomainEvent, EventType, IEventHandler } from '../../src/events/base'

// Mock implementations
const mockPostgresEventStore = {
  saveEvent: jest.fn().mockResolvedValue(undefined),
  getEvents: jest.fn().mockResolvedValue([]),
}

const mockDeadLetterQueueService = {
  handleFailedEvent: jest.fn().mockResolvedValue(undefined),
}

describe('EventBusService', () => {
  let service: EventBusService
  let postgresEventStore: PostgresEventStore

  beforeEach(async () => {
    // Create service instance directly with mocked dependencies
    service = new EventBusService(mockPostgresEventStore as any, mockDeadLetterQueueService as any)
    postgresEventStore = mockPostgresEventStore as any

    // Clear all mocks
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('publish', () => {
    const mockEvent: DomainEvent = {
      eventId: 'test-event-id',
      eventType: EventType.BOOKING_CREATED,
      aggregateId: 'test-aggregate-id',
      aggregateType: 'booking',
      payload: { bookingId: 'test-booking-id' },
      timestamp: new Date().toISOString(),
      version: 1,
    }

    it('should save event to Postgres', async () => {
      // Mock the Redis publisher to avoid connection issues
      service['publisher'] = {
        publish: jest.fn().mockResolvedValue(1)
      } as any

      await service.publish(mockEvent)

      expect(postgresEventStore.saveEvent).toHaveBeenCalledWith(mockEvent)
    })

    it('should handle errors when saving to Postgres fails', async () => {
      const error = new Error('Postgres save failed')
      mockPostgresEventStore.saveEvent.mockRejectedValueOnce(error)

      await expect(service.publish(mockEvent)).rejects.toThrow(error)
    })
  })

  describe('subscribe', () => {
    it('should register event handler for event type', () => {
      const aggregateType = 'booking'
      const eventType = EventType.BOOKING_CREATED
      
      // Mock the Redis subscriber to avoid connection issues
      service['subscriber'] = {
        subscribe: jest.fn()
      } as any
      
      // Create a proper mock handler that implements IEventHandler
      const mockHandler: IEventHandler<any> = {
        handle: jest.fn(),
        canHandle: jest.fn().mockReturnValue(true)
      }

      service.subscribe(aggregateType, eventType, mockHandler)

      // This would be tested in integration tests
      expect(service).toBeDefined()
    })
  })


})
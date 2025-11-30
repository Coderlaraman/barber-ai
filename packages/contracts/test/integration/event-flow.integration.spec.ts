import { Test, TestingModule } from '@nestjs/testing'
import { EventBusService } from '../../src/services/event-bus.service'
import { PostgresEventStore } from '../../src/services/postgres-event-store.service'
import { DomainEvent, EventType } from '../../src/events/base'

// Mock implementations
const mockPostgresEventStore = {
  saveEvent: jest.fn().mockResolvedValue(undefined),
  getEvents: jest.fn().mockResolvedValue([]),
  getEventsByType: jest.fn().mockResolvedValue([]),
  createSnapshot: jest.fn().mockResolvedValue(undefined),
  getSnapshot: jest.fn().mockResolvedValue(null),
}

describe('Event Flow Integration', () => {
  let eventBusService: EventBusService
  let postgresEventStore: PostgresEventStore

  beforeEach(async () => {
    // Create service instance directly with mocked dependencies
    eventBusService = new EventBusService(mockPostgresEventStore as any, {} as any)
    postgresEventStore = mockPostgresEventStore as any

    // Clear all mocks
    jest.clearAllMocks()
  })

  describe('Complete Event Flow', () => {
    const createBookingEvent = (): DomainEvent => ({
      eventId: 'booking-event-123',
      eventType: EventType.BOOKING_CREATED,
      aggregateId: 'booking-123',
      aggregateType: 'booking',
      payload: {
        bookingId: 'booking-123',
        customerId: 'customer-456',
        serviceId: 'service-789',
        scheduledFor: '2023-01-15T10:00:00Z',
      },
      timestamp: '2023-01-01T12:00:00Z',
      version: 1,
    })

    it('should save event to Postgres', async () => {
      const event = createBookingEvent()

      // Mock the Redis publisher to avoid connection issues
      eventBusService['publisher'] = {
        publish: jest.fn().mockResolvedValue(1)
      } as any

      await eventBusService.publish(event)

      // Verify event is saved to Postgres
      expect(postgresEventStore.saveEvent).toHaveBeenCalledTimes(1)
      expect(postgresEventStore.saveEvent).toHaveBeenCalledWith(event)
    })

    it('should handle errors when Postgres save fails', async () => {
      const event = createBookingEvent()
      const error = new Error('Postgres save failed')

      mockPostgresEventStore.saveEvent.mockRejectedValueOnce(error)

      await expect(eventBusService.publish(event)).rejects.toThrow(error)
    })
  })

  describe('Event Retrieval', () => {
    it('should retrieve events by aggregate ID', async () => {
      const aggregateId = 'booking-123'
      const mockEvents = [
        {
          eventId: 'event-1',
          eventType: EventType.BOOKING_CREATED,
          aggregateId,
          aggregateType: 'booking',
          payload: { bookingId: 'booking-123' },
          timestamp: '2023-01-01T12:00:00Z',
          version: 1,
        },
        {
          eventId: 'event-2',
          eventType: EventType.BOOKING_CONFIRMED,
          aggregateId,
          aggregateType: 'booking',
          payload: { bookingId: 'booking-123' },
          timestamp: '2023-01-02T12:00:00Z',
          version: 2,
        },
      ]

      mockPostgresEventStore.getEvents.mockResolvedValueOnce(mockEvents)

      const result = await postgresEventStore.getEvents(aggregateId)

      expect(postgresEventStore.getEvents).toHaveBeenCalledWith(aggregateId)
      expect(result).toEqual(mockEvents)
      expect(result).toHaveLength(2)
    })

    it('should return empty array when no events found', async () => {
      const aggregateId = 'non-existent-booking'

      mockPostgresEventStore.getEvents.mockResolvedValueOnce([])

      const result = await postgresEventStore.getEvents(aggregateId)

      expect(postgresEventStore.getEvents).toHaveBeenCalledWith(aggregateId)
      expect(result).toEqual([])
    })
  })
})
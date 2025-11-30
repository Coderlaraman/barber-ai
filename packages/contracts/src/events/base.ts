/**
 * Evento base para todos los eventos del dominio
 */
export interface BaseEvent {
  eventId: string
  eventType: string
  aggregateId: string
  aggregateType: string
  timestamp: string
  version: number
  metadata?: Record<string, any>
}

/**
 * Interfaz para eventos de dominio específicos
 */
export interface DomainEvent extends BaseEvent {
  payload: Record<string, any>
}

/**
 * Tipos de eventos disponibles en el sistema
 */
export enum EventType {
  // Booking Events
  BOOKING_CREATED = 'booking.created',
  BOOKING_CANCELLED = 'booking.cancelled',
  BOOKING_RESCHEDULED = 'booking.rescheduled',
  BOOKING_CONFIRMED = 'booking.confirmed',
  BOOKING_REMINDER_SENT = 'booking.reminder.sent',
  
  // Schedule Events
  SCHEDULE_BLOCKED = 'schedule.blocked',
  SCHEDULE_RELEASED = 'schedule.released',
  AVAILABILITY_UPDATED = 'availability.updated',
  
  // Review Events
  REVIEW_CREATED = 'review.created',
  REVIEW_UPDATED = 'review.updated',
  
  // Ranking Events
  RANKING_UPDATED = 'ranking.updated',
  
  // User Events
  USER_REGISTERED = 'user.registered',
  USER_PROFILE_UPDATED = 'user.profile.updated',
  
  // Notification Events
  NOTIFICATION_SENT = 'notification.sent',
  NOTIFICATION_FAILED = 'notification.failed',
  NOTIFICATION_SCHEDULED = 'notification.scheduled',
  
  // Portfolio Events
  PORTFOLIO_ITEM_CREATED = 'portfolio.item.created',
  PORTFOLIO_ITEM_UPDATED = 'portfolio.item.updated',
  PORTFOLIO_ITEM_DELETED = 'portfolio.item.deleted'
}

/**
 * Interfaz para el Event Bus
 */
export interface IEventBus {
  publish<T extends DomainEvent>(event: T): Promise<void>
  publishAll(events: DomainEvent[]): Promise<void>
}

/**
 * Interfaz para manejadores de eventos
 */
export interface IEventHandler<T extends DomainEvent> {
  handle(event: T): Promise<void>
  canHandle(eventType: string): boolean
}

/**
 * Interfaz para el Event Store
 */
export interface IEventStore {
  saveEvent(event: DomainEvent): Promise<void>
  getEvents(aggregateId: string): Promise<DomainEvent[]>
  getEventsByType(eventType: string): Promise<DomainEvent[]>
}

/**
 * Interfaz para implementaciones persistentes del Event Store
 */
export interface PersistentEventStore extends IEventStore {
  // Métodos adicionales para implementaciones persistentes
  createSnapshot(aggregateId: string): Promise<void>
  getSnapshot(aggregateId: string): Promise<any>
  replayEvents(fromTime: string): Promise<DomainEvent[]>
}
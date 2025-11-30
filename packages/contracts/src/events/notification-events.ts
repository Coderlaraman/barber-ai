import { BaseEvent } from './base'

export interface NotificationSentEvent extends BaseEvent {
  eventType: 'notification.sent'
  payload: {
    notificationId: string
    recipientId: string
    recipientType: 'CLIENT' | 'BARBER' | 'ADMIN'
    channel: 'EMAIL' | 'SMS' | 'PUSH' | 'IN_APP'
    type: 'APPOINTMENT_CONFIRMED' | 'APPOINTMENT_REMINDER' | 'BOOKING_CANCELLED' | 'REVIEW_REQUEST' | 'PROMOTION' | 'SYSTEM'
    status: 'SENT' | 'DELIVERED' | 'FAILED'
    sentAt: string
    metadata?: Record<string, any>
  }
}

export interface NotificationFailedEvent extends BaseEvent {
  eventType: 'notification.failed'
  payload: {
    notificationId: string
    recipientId: string
    channel: 'EMAIL' | 'SMS' | 'PUSH' | 'IN_APP'
    type: string
    error: string
    failedAt: string
    retryCount: number
    maxRetries: number
  }
}

export interface NotificationScheduledEvent extends BaseEvent {
  eventType: 'notification.scheduled'
  payload: {
    notificationId: string
    recipientId: string
    channel: 'EMAIL' | 'SMS' | 'PUSH' | 'IN_APP'
    type: string
    scheduledFor: string
    timezone?: string
  }
}
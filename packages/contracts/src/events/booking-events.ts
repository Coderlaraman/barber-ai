import { BaseEvent } from './base'

export interface BookingCreatedEvent extends BaseEvent {
  eventType: 'booking.created'
  payload: {
    appointmentId: string
    barberId: string
    clientId: string
    serviceId: string
    startTime: string
    endTime: string
    date: string
    price: number
    notes?: string
  }
}

export interface BookingCancelledEvent extends BaseEvent {
  eventType: 'booking.cancelled'
  payload: {
    appointmentId: string
    barberId: string
    clientId: string
    reason?: string
    cancelledBy: 'CLIENT' | 'BARBER' | 'SYSTEM'
    cancelledAt: string
  }
}

export interface BookingRescheduledEvent extends BaseEvent {
  eventType: 'booking.rescheduled'
  payload: {
    appointmentId: string
    barberId: string
    clientId: string
    previousStartTime: string
    previousEndTime: string
    newStartTime: string
    newEndTime: string
    previousDate: string
    newDate: string
    reason?: string
  }
}

export interface BookingConfirmedEvent extends BaseEvent {
  eventType: 'booking.confirmed'
  payload: {
    appointmentId: string
    barberId: string
    clientId: string
    confirmedAt: string
    confirmedBy: 'CLIENT' | 'BARBER' | 'SYSTEM'
  }
}

export interface BookingReminderSentEvent extends BaseEvent {
  eventType: 'booking.reminder.sent'
  payload: {
    appointmentId: string
    barberId: string
    clientId: string
    reminderType: '24_HOURS' | '1_HOUR' | '15_MINUTES'
    sentAt: string
    channel: 'EMAIL' | 'SMS' | 'PUSH'
  }
}
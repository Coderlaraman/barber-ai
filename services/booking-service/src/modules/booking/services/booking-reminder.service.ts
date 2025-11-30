import { Injectable, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { EventBusService } from 'contracts'
import { BookingService } from './booking.service'

@Injectable()
export class BookingReminderService {
  private readonly logger = new Logger(BookingReminderService.name)

  constructor(
    private readonly bookingService: BookingService,
    private readonly eventBus: EventBusService
  ) {}

  /**
   * Enviar recordatorios 24 horas antes de la cita
   */
  @Cron(CronExpression.EVERY_HOUR)
  async send24HourReminders(): Promise<void> {
    this.logger.log('Enviando recordatorios de 24 horas...')
    
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowStr = tomorrow.toISOString().split('T')[0]

    const bookings = await this.bookingService.getBookingsByDate(tomorrowStr)
    
    for (const booking of bookings) {
      if (booking.status === 'CONFIRMED') {
        await this.eventBus.publish({
          eventId: `reminder-24h-${booking.id}`,
          eventType: 'booking.reminder.sent',
          aggregateId: booking.id,
          aggregateType: 'BOOKING',
          payload: {
            appointmentId: booking.id,
            barberId: booking.barberId,
            clientId: booking.clientId,
            reminderType: '24_HOURS',
            sentAt: new Date().toISOString(),
            channel: 'EMAIL'
          },
          timestamp: new Date().toISOString(),
          version: 1
        })
        
        this.logger.log(`Recordatorio 24h enviado para cita: ${booking.id}`)
      }
    }
  }

  /**
   * Enviar recordatorios 1 hora antes de la cita
   */
  @Cron(CronExpression.EVERY_30_MINUTES)
  async send1HourReminders(): Promise<void> {
    this.logger.log('Enviando recordatorios de 1 hora...')
    
    const now = new Date()
    const inOneHour = new Date(now.getTime() + 60 * 60 * 1000)
    const todayStr = now.toISOString().split('T')[0]
    const timeStr = inOneHour.toTimeString().slice(0, 5)

    const bookings = await this.bookingService.getBookingsByDate(todayStr)
    
    for (const booking of bookings) {
      if (booking.status === 'CONFIRMED' && booking.startTime === timeStr) {
        await this.eventBus.publish({
          eventId: `reminder-1h-${booking.id}`,
          eventType: 'booking.reminder.sent',
          aggregateId: booking.id,
          aggregateType: 'BOOKING',
          payload: {
            appointmentId: booking.id,
            barberId: booking.barberId,
            clientId: booking.clientId,
            reminderType: '1_HOUR',
            sentAt: new Date().toISOString(),
            channel: 'SMS'
          },
          timestamp: new Date().toISOString(),
          version: 1
        })
        
        this.logger.log(`Recordatorio 1h enviado para cita: ${booking.id}`)
      }
    }
  }

  /**
   * Enviar recordatorios 15 minutos antes de la cita
   */
  @Cron(CronExpression.EVERY_10_MINUTES)
  async send15MinuteReminders(): Promise<void> {
    this.logger.log('Enviando recordatorios de 15 minutos...')
    
    const now = new Date()
    const in15Minutes = new Date(now.getTime() + 15 * 60 * 1000)
    const todayStr = now.toISOString().split('T')[0]
    const timeStr = in15Minutes.toTimeString().slice(0, 5)

    const bookings = await this.bookingService.getBookingsByDate(todayStr)
    
    for (const booking of bookings) {
      if (booking.status === 'CONFIRMED' && booking.startTime === timeStr) {
        await this.eventBus.publish({
          eventId: `reminder-15m-${booking.id}`,
          eventType: 'booking.reminder.sent',
          aggregateId: booking.id,
          aggregateType: 'BOOKING',
          payload: {
            appointmentId: booking.id,
            barberId: booking.barberId,
            clientId: booking.clientId,
            reminderType: '15_MINUTES',
            sentAt: new Date().toISOString(),
            channel: 'PUSH'
          },
          timestamp: new Date().toISOString(),
          version: 1
        })
        
        this.logger.log(`Recordatorio 15m enviado para cita: ${booking.id}`)
      }
    }
  }
}
import { Injectable, Logger, ConflictException, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { HttpService } from '@nestjs/axios'
import { ConfigService } from '@nestjs/config'
import { firstValueFrom } from 'rxjs'
import { EventBusService } from '@barber_ai/contracts'
import { Booking, BookingStatus } from '../entities/booking.entity'
import { CreateBookingDto } from '../dto/create-booking.dto'
import { UpdateBookingDto } from '../dto/update-booking.dto'
import { BookingResponseDto } from '../dto/booking-response.dto'

@Injectable()
export class BookingService {
  private readonly logger = new Logger(BookingService.name)
  private readonly schedulerUrl: string

  constructor(
    @InjectRepository(Booking)
    private bookingRepository: Repository<Booking>,
    private eventBus: EventBusService,
    private httpService: HttpService,
    private configService: ConfigService
  ) {
    this.schedulerUrl = this.configService.get('SCHEDULER_SERVICE_URL') || 'http://scheduler-service:3011'
  }

  async createBooking(createBookingDto: CreateBookingDto): Promise<BookingResponseDto> {
    // Verificar disponibilidad
    const isAvailable = await this.checkAvailability(
      createBookingDto.barberId,
      createBookingDto.date,
      createBookingDto.startTime,
      createBookingDto.endTime
    )

    if (!isAvailable) {
      throw new ConflictException('El barbero no está disponible en ese horario')
    }

    const booking = this.bookingRepository.create({
      ...createBookingDto,
      status: 'PENDING'
    })

    const savedBooking = await this.bookingRepository.save(booking)

    // Publicar evento de creación
    await this.eventBus.publish({
      eventId: `booking-created-${savedBooking.id}`,
      eventType: 'booking.created',
      aggregateId: savedBooking.id,
      aggregateType: 'BOOKING',
      payload: {
        appointmentId: savedBooking.id,
        barberId: savedBooking.barberId,
        clientId: savedBooking.clientId,
        serviceId: savedBooking.serviceId,
        startTime: savedBooking.startTime,
        endTime: savedBooking.endTime,
        date: savedBooking.date,
        price: savedBooking.price,
        notes: savedBooking.notes
      },
      timestamp: new Date().toISOString(),
      version: 1
    })

    this.logger.log(`Cita creada: ${savedBooking.id}`)
    return this.toResponseDto(savedBooking)
  }

  async confirmBooking(bookingId: string, confirmedBy: 'CLIENT' | 'BARBER' | 'SYSTEM'): Promise<BookingResponseDto> {
    const booking = await this.bookingRepository.findOne({ where: { id: bookingId } })
    
    if (!booking) {
      throw new NotFoundException('Cita no encontrada')
    }

    if (booking.status !== 'PENDING') {
      throw new ConflictException('La cita ya está confirmada o cancelada')
    }

    booking.status = 'CONFIRMED'
    booking.confirmedBy = confirmedBy
    booking.confirmedAt = new Date()

    const updatedBooking = await this.bookingRepository.save(booking)

    // Publicar evento de confirmación
    await this.eventBus.publish({
      eventId: `booking-confirmed-${updatedBooking.id}`,
      eventType: 'booking.confirmed',
      aggregateId: updatedBooking.id,
      aggregateType: 'BOOKING',
      payload: {
        appointmentId: updatedBooking.id,
        barberId: updatedBooking.barberId,
        clientId: updatedBooking.clientId,
        confirmedAt: updatedBooking.confirmedAt.toISOString(),
        confirmedBy: updatedBooking.confirmedBy
      },
      timestamp: new Date().toISOString(),
      version: 1
    })

    this.logger.log(`Cita confirmada: ${updatedBooking.id}`)
    return this.toResponseDto(updatedBooking)
  }

  async cancelBooking(bookingId: string, reason: string, cancelledBy: string): Promise<BookingResponseDto> {
    const booking = await this.bookingRepository.findOne({ where: { id: bookingId } })
    
    if (!booking) {
      throw new NotFoundException('Cita no encontrada')
    }

    if (booking.status === 'CANCELLED') {
      throw new ConflictException('La cita ya está cancelada')
    }

    booking.status = 'CANCELLED'
    booking.cancellationReason = reason
    booking.cancelledBy = cancelledBy
    booking.cancelledAt = new Date()

    const updatedBooking = await this.bookingRepository.save(booking)

    // Publicar evento de cancelación
    await this.eventBus.publish({
      eventId: `booking-cancelled-${updatedBooking.id}`,
      eventType: 'booking.cancelled',
      aggregateId: updatedBooking.id,
      aggregateType: 'BOOKING',
      payload: {
        appointmentId: updatedBooking.id,
        barberId: updatedBooking.barberId,
        clientId: updatedBooking.clientId,
        reason: updatedBooking.cancellationReason,
        cancelledBy: updatedBooking.cancelledBy === updatedBooking.clientId ? 'CLIENT' : 
                    updatedBooking.cancelledBy === updatedBooking.barberId ? 'BARBER' : 'SYSTEM',
        cancelledAt: updatedBooking.cancelledAt.toISOString()
      },
      timestamp: new Date().toISOString(),
      version: 1
    })

    this.logger.log(`Cita cancelada: ${updatedBooking.id}`)
    return this.toResponseDto(updatedBooking)
  }

  async completeBooking(bookingId: string): Promise<BookingResponseDto> {
    const booking = await this.bookingRepository.findOne({ where: { id: bookingId } })
    
    if (!booking) {
      throw new NotFoundException('Cita no encontrada')
    }

    if (booking.status !== 'CONFIRMED') {
      throw new ConflictException('La cita debe estar confirmada para poder completarla')
    }

    booking.status = 'COMPLETED'
    booking.updatedAt = new Date()

    const updatedBooking = await this.bookingRepository.save(booking)

    // Publicar evento de completación
    await this.eventBus.publish({
      eventId: `booking-completed-${updatedBooking.id}`,
      eventType: 'booking.completed',
      aggregateId: updatedBooking.id,
      aggregateType: 'BOOKING',
      payload: {
        appointmentId: updatedBooking.id,
        barberId: updatedBooking.barberId,
        clientId: updatedBooking.clientId,
        completedAt: updatedBooking.updatedAt.toISOString()
      },
      timestamp: new Date().toISOString(),
      version: 1
    })

    this.logger.log(`Cita completada: ${updatedBooking.id}`)
    return this.toResponseDto(updatedBooking)
  }

  async rescheduleBooking(
    bookingId: string, 
    newDate: string, 
    newStartTime: string, 
    newEndTime: string,
    reason?: string
  ): Promise<BookingResponseDto> {
    const booking = await this.bookingRepository.findOne({ where: { id: bookingId } })
    
    if (!booking) {
      throw new NotFoundException('Cita no encontrada')
    }

    if (booking.status === 'CANCELLED') {
      throw new ConflictException('No se puede reprogramar una cita cancelada')
    }

    // Verificar disponibilidad del nuevo horario
    // TODO: Integrar con scheduler-service para verificar disponibilidad real
    // Por ahora solo verificamos que no haya conflicto con otras citas
    const isAvailable = await this.checkAvailability(
      booking.barberId,
      newDate,
      newStartTime,
      newEndTime,
      bookingId
    )

    if (!isAvailable) {
      throw new ConflictException('El barbero no está disponible en el nuevo horario')
    }

    const previousData = {
      previousDate: booking.date,
      previousStartTime: booking.startTime,
      previousEndTime: booking.endTime
    }

    booking.date = newDate
    booking.startTime = newStartTime
    booking.endTime = newEndTime

    const updatedBooking = await this.bookingRepository.save(booking)

    // Publicar evento de reprogramación
    await this.eventBus.publish({
      eventId: `booking-rescheduled-${updatedBooking.id}`,
      eventType: 'booking.rescheduled',
      aggregateId: updatedBooking.id,
      aggregateType: 'BOOKING',
      payload: {
        appointmentId: updatedBooking.id,
        barberId: updatedBooking.barberId,
        clientId: updatedBooking.clientId,
        previousStartTime: previousData.previousStartTime,
        previousEndTime: previousData.previousEndTime,
        newStartTime: updatedBooking.startTime,
        newEndTime: updatedBooking.endTime,
        previousDate: previousData.previousDate,
        newDate: updatedBooking.date,
        reason
      },
      timestamp: new Date().toISOString(),
      version: 1
    })

    this.logger.log(`Cita reprogramada: ${updatedBooking.id}`)
    return this.toResponseDto(updatedBooking)
  }

  async updateBooking(id: string, updateBookingDto: UpdateBookingDto): Promise<BookingResponseDto> {
    const booking = await this.bookingRepository.findOne({ where: { id } })
    
    if (!booking) {
      throw new NotFoundException('Cita no encontrada')
    }

    // Si se actualiza fecha/hora, verificar disponibilidad
    if (updateBookingDto.date || updateBookingDto.startTime || updateBookingDto.endTime) {
      const date = updateBookingDto.date || booking.date
      const startTime = updateBookingDto.startTime || booking.startTime
      const endTime = updateBookingDto.endTime || booking.endTime

      const isAvailable = await this.checkAvailability(
        booking.barberId,
        date,
        startTime,
        endTime,
        id
      )

      if (!isAvailable) {
        throw new ConflictException('El nuevo horario no está disponible')
      }
    }

    Object.assign(booking, updateBookingDto)
    const updatedBooking = await this.bookingRepository.save(booking)
    return this.toResponseDto(updatedBooking)
  }

  async getBookingById(bookingId: string): Promise<BookingResponseDto> {
    const booking = await this.bookingRepository.findOne({ where: { id: bookingId } })
    
    if (!booking) {
      throw new NotFoundException('Cita no encontrada')
    }

    return this.toResponseDto(booking)
  }

  async getBookingsByClient(clientId: string): Promise<BookingResponseDto[]> {
    const bookings = await this.bookingRepository.find({
      where: { clientId },
      order: { date: 'DESC', startTime: 'DESC' }
    })
    
    return bookings.map(booking => this.toResponseDto(booking))
  }

  async getUpcomingBookings(days: number = 7): Promise<BookingResponseDto[]> {
    const today = new Date()
    const futureDate = new Date()
    futureDate.setDate(today.getDate() + days)

    const bookings = await this.bookingRepository
      .createQueryBuilder('booking')
      .where('booking.date >= :today', { today: today.toISOString().split('T')[0] })
      .andWhere('booking.date <= :futureDate', { futureDate: futureDate.toISOString().split('T')[0] })
      .andWhere('booking.status != :cancelledStatus', { cancelledStatus: 'CANCELLED' })
      .orderBy('booking.date', 'ASC')
      .addOrderBy('booking.startTime', 'ASC')
      .getMany()

    return bookings.map(booking => this.toResponseDto(booking))
  }

  async getBookingsByBarber(barberId: string): Promise<BookingResponseDto[]> {
    const bookings = await this.bookingRepository.find({
      where: { barberId },
      order: { date: 'ASC', startTime: 'ASC' }
    })
    
    return bookings.map(booking => this.toResponseDto(booking))
  }

  async getBookingsByDate(date: string): Promise<BookingResponseDto[]> {
    const bookings = await this.bookingRepository.find({
      where: { date },
      order: { startTime: 'ASC' }
    })
    
    return bookings.map(booking => this.toResponseDto(booking))
  }

  private async checkAvailability(
    barberId: string, 
    date: string, 
    startTime: string, 
    endTime: string,
    excludeBookingId?: string
  ): Promise<boolean> {
    // 1. Verificar conflictos locales con otras citas
    const query = this.bookingRepository
      .createQueryBuilder('booking')
      .where('booking.barberId = :barberId', { barberId })
      .andWhere('booking.date = :date', { date })
      .andWhere('booking.status != :cancelledStatus', { cancelledStatus: 'CANCELLED' })
      .andWhere(
        '(booking.startTime < :endTime AND booking.endTime > :startTime)',
        { startTime, endTime }
      )

    if (excludeBookingId) {
      query.andWhere('booking.id != :excludeBookingId', { excludeBookingId })
    }

    const conflictingBookings = await query.getCount()
    if (conflictingBookings > 0) {
      return false
    }

    // 2. Consultar al Scheduler Service si el barbero tiene turno disponible
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.schedulerUrl}/availability/check`, {
          params: { barberId, date, startTime, endTime }
        }) as any
      )
      return (response as any).data.available
    } catch (error) {
      this.logger.warn(`Error checking availability with Scheduler: ${error.message}`)
      // Si falla la comunicación, por seguridad asumimos no disponible o 
      // manejamos política de "fail open" dependiendo del negocio.
      // Aquí asumimos true para no bloquear si el servicio está caído en dev,
      // pero en prod debería ser false.
      return true 
    }
  }

  private toResponseDto(booking: Booking): BookingResponseDto {
    return {
      id: booking.id,
      clientId: booking.clientId,
      barberId: booking.barberId,
      serviceId: booking.serviceId,
      date: booking.date,
      startTime: booking.startTime,
      endTime: booking.endTime,
      price: booking.price,
      status: booking.status,
      notes: booking.notes,
      confirmedBy: booking.confirmedBy,
      confirmedAt: booking.confirmedAt,
      cancellationReason: booking.cancellationReason,
      cancelledAt: booking.cancelledAt,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt
    }
  }
}
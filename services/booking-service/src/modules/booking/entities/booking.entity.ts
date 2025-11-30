import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm'

export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW'
export type BookingConfirmedBy = 'CLIENT' | 'BARBER' | 'SYSTEM'

@Entity('bookings')
@Index(['clientId', 'date'])
@Index(['barberId', 'date'])
@Index(['status', 'date'])
export class Booking {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'uuid' })
  clientId: string

  @Column({ type: 'uuid' })
  barberId: string

  @Column({ type: 'uuid' })
  serviceId: string

  @Column({ type: 'date' })
  date: string

  @Column({ type: 'time' })
  startTime: string

  @Column({ type: 'time' })
  endTime: string

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number

  @Column({ type: 'enum', enum: ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW'], default: 'PENDING' })
  status: BookingStatus

  @Column({ type: 'text', nullable: true })
  notes: string

  @Column({ type: 'enum', enum: ['CLIENT', 'BARBER', 'SYSTEM'], nullable: true })
  confirmedBy: BookingConfirmedBy

  @Column({ type: 'timestamp', nullable: true })
  confirmedAt: Date

  @Column({ type: 'text', nullable: true })
  cancellationReason: string

  @Column({ type: 'uuid', nullable: true })
  cancelledBy: string

  @Column({ type: 'timestamp', nullable: true })
  cancelledAt: Date

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
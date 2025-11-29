import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm'

@Entity({ name: 'appointments' })
export class Appointment {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Index()
  @Column({ type: 'uuid' })
  barberId!: string

  @Index()
  @Column({ type: 'uuid' })
  clientId!: string

  @Column({ type: 'timestamptz' })
  start!: Date

  @Column({ type: 'timestamptz' })
  end!: Date

  @Column({ type: 'varchar' })
  status!: 'REQUESTED' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED'

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date
}
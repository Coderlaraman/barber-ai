import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm'

@Entity('event_snapshots')
export class EventSnapshotEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column()
  @Index()
  aggregateId!: string

  @Column()
  aggregateType!: string

  @Column('jsonb')
  snapshot!: any

  @Column()
  version!: number

  @Column('timestamp')
  createdAt!: Date
}
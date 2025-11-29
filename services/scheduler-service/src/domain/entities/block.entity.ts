import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm'

@Entity({ name: 'blocks' })
export class Block {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Index()
  @Column({ type: 'uuid' })
  barberId!: string

  @Column({ type: 'timestamptz' })
  start!: Date

  @Column({ type: 'timestamptz' })
  end!: Date

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date
}
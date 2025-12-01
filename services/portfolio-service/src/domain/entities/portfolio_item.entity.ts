import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm'

@Entity({ name: 'portfolio_items' })
export class PortfolioItem {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Index()
  @Column({ type: 'uuid' })
  barberId!: string

  @Column({ type: 'varchar' })
  title!: string

  @Column({ type: 'text', nullable: true })
  description?: string

  @Column({ type: 'jsonb', nullable: true })
  tags?: string[]

  @Column({ type: 'varchar', nullable: true })
  imageUrl?: string

  @Column({ type: 'boolean', default: false })
  isFeatured!: boolean

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt!: Date
}
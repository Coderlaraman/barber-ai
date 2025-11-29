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

  @Column({ type: 'jsonb', nullable: true })
  tags?: string[]

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date
}
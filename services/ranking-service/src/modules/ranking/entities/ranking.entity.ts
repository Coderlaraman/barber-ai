import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm'

@Entity('rankings')
@Index(['barberId', 'period'], { unique: true })
export class Ranking {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'uuid', nullable: false })
  barberId!: string

  @Column({ type: 'varchar', length: 20, nullable: false })
  period!: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'all_time'

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  averageRating!: number

  @Column({ type: 'integer', default: 0 })
  totalRatings!: number

  @Column({ type: 'integer', default: 0 })
  positiveRatings!: number // ratings >= 4

  @Column({ type: 'integer', default: 0 })
  negativeRatings!: number // ratings <= 2

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  rankingScore!: number // Calculated score for ranking position

  @Column({ type: 'integer', default: 0 })
  position!: number // Position in ranking (1 = best)

  @Column({ type: 'jsonb', nullable: true })
  metrics!: {
    serviceQuality?: number
    punctuality?: number
    cleanliness?: number
    priceValue?: number
    communication?: number
  }

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalRevenue!: number

  @Column({ type: 'integer', default: 0 })
  completedAppointments!: number

  @Column({ type: 'date', nullable: false })
  periodStart!: Date

  @Column({ type: 'date', nullable: false })
  periodEnd!: Date

  @CreateDateColumn()
  createdAt!: Date

  @UpdateDateColumn()
  updatedAt!: Date

  // Utility methods
  calculateRankingScore(): number {
    // Weighted scoring algorithm
    const ratingWeight = 0.4
    const quantityWeight = 0.3
    const revenueWeight = 0.2
    const consistencyWeight = 0.1

    const ratingScore = this.averageRating * 20 // Convert to 0-100 scale
    const quantityScore = Math.min(this.totalRatings / 10, 10) * 10 // Max 100 points for 100+ ratings
    const positiveRatio = this.totalRatings > 0 ? (this.positiveRatings / this.totalRatings) * 100 : 0
    const revenueScore = Math.min(this.totalRevenue / 1000, 10) * 10 // Max 100 points for $10k+ revenue

    const score = (
      ratingScore * ratingWeight +
      quantityScore * quantityWeight +
      revenueScore * revenueWeight +
      positiveRatio * consistencyWeight
    )

    return Number(score.toFixed(2))
  }

  updateMetrics(rating: number, aspects?: Record<string, number>): void {
    this.totalRatings++
    
    // Update rating counters
    if (rating >= 4) {
      this.positiveRatings++
    } else if (rating <= 2) {
      this.negativeRatings++
    }

    // Recalculate average rating
    const currentTotal = (this.averageRating * (this.totalRatings - 1)) + rating
    this.averageRating = Number((currentTotal / this.totalRatings).toFixed(2))

    // Update aspect metrics if provided
    if (aspects) {
      if (!this.metrics) {
        this.metrics = {}
      }
      
      Object.entries(aspects).forEach(([key, value]) => {
        const metricKey = key as keyof typeof this.metrics
        if (this.metrics[metricKey] !== undefined) {
          // Weighted average for existing metrics
          this.metrics[metricKey] = Number(((this.metrics[metricKey] * (this.totalRatings - 1) + value) / this.totalRatings).toFixed(1))
        } else {
          this.metrics[metricKey] = value
        }
      })
    }

    // Recalculate ranking score
    this.rankingScore = this.calculateRankingScore()
  }

  updateBusinessMetrics(revenue: number, completedAppointments: number): void {
    this.totalRevenue += revenue
    this.completedAppointments += completedAppointments
    this.rankingScore = this.calculateRankingScore()
  }
}
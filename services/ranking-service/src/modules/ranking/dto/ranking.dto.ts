export class CreateRankingDto {
  barberId!: string
  period!: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'all_time'
  periodStart!: Date
  periodEnd!: Date
}

export class UpdateRankingDto {
  averageRating?: number
  totalRatings?: number
  positiveRatings?: number
  negativeRatings?: number
  rankingScore?: number
  position?: number
  metrics?: Record<string, number>
  totalRevenue?: number
  completedAppointments?: number
}

export class RankingResponseDto {
  id!: string
  barberId!: string
  period!: string
  averageRating!: number
  totalRatings!: number
  positiveRatings!: number
  negativeRatings!: number
  rankingScore!: number
  position!: number
  metrics!: Record<string, number>
  totalRevenue!: number
  completedAppointments!: number
  periodStart!: Date
  periodEnd!: Date
  createdAt!: Date
  updatedAt!: Date
}

export class RankingQueryDto {
  period?: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'all_time'
  barberId?: string
  startDate?: Date
  endDate?: Date
  limit?: number
  offset?: number
}

export class RankingMetricsDto {
  barberId!: string
  period!: string
  averageRating!: number
  totalRatings!: number
  positiveRatio!: number
  negativeRatio!: number
  rankingPosition!: number
  totalRevenue!: number
  completedAppointments!: number
  metrics!: Record<string, number>
}
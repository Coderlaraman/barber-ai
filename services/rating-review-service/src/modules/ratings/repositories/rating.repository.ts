import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThan, LessThan } from 'typeorm';
import { Rating, RatingStatus } from '../entities/rating.entity';

@Injectable()
export class RatingRepository {
  constructor(
    @InjectRepository(Rating)
    private readonly ratingRepository: Repository<Rating>,
  ) {}

  async findOneById(id: string): Promise<Rating | null> {
    return this.ratingRepository.findOne({
      where: { id, isDeleted: false } as any,
    });
  }

  async findActive(options?: any): Promise<Rating[]> {
    return this.ratingRepository.find({
      where: { isDeleted: false } as any,
      ...options,
    });
  }

  async createEntity(data: Partial<Rating>, userId?: string): Promise<Rating> {
    const entity = this.ratingRepository.create(data);
    if (userId) {
      (entity as any).createdBy = userId;
    }
    return this.ratingRepository.save(entity);
  }

  async updateEntity(id: string, data: Partial<Rating>, userId?: string): Promise<Rating> {
    const entity = await this.findOneById(id);
    if (!entity) {
      throw new Error('Entity not found');
    }
    Object.assign(entity, data);
    if (userId) {
      (entity as any).updatedBy = userId;
    }
    return this.ratingRepository.save(entity);
  }

  async softDelete(id: string, userId?: string): Promise<any> {
    const entity = await this.findOneById(id);
    if (!entity) {
      throw new Error('Entity not found');
    }
    (entity as any).isDeleted = true;
    (entity as any).deletedAt = new Date();
    (entity as any).deletedBy = userId;
    (entity as any).isActive = false;
    return this.ratingRepository.save(entity);
  }

  async save(rating: Rating): Promise<Rating> {
    return this.ratingRepository.save(rating);
  }

  async findByBarberId(barberId: string, status?: RatingStatus): Promise<Rating[]> {
    const where: any = { barberId, isDeleted: false };
    if (status) {
      where.status = status;
    }
    
    return this.ratingRepository.find({
      where,
      order: { createdAt: 'DESC' },
      relations: ['appointment'],
    });
  }

  async findByClientId(clientId: string, status?: RatingStatus): Promise<Rating[]> {
    const where: any = { clientId, isDeleted: false };
    if (status) {
      where.status = status;
    }
    
    return this.ratingRepository.find({
      where,
      order: { createdAt: 'DESC' },
      relations: ['appointment'],
    });
  }

  async findByAppointmentId(appointmentId: string): Promise<Rating | null> {
    return this.ratingRepository.findOne({
      where: { appointmentId, isDeleted: false },
    });
  }

  async getBarberRatingStats(barberId: string): Promise<{
    averageRating: number;
    totalRatings: number;
    ratingDistribution: { [key: number]: number };
    averageAspects: any;
  }> {
    const ratings = await this.ratingRepository.find({
      where: { barberId, status: RatingStatus.APPROVED, isDeleted: false },
    });

    if (ratings.length === 0) {
      return {
        averageRating: 0,
        totalRatings: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        averageAspects: {},
      };
    }

    const totalRating = ratings.reduce((sum, rating) => sum + rating.rating, 0);
    const averageRating = Number((totalRating / ratings.length).toFixed(2));

    // Calcular distribución
    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    ratings.forEach(rating => {
      ratingDistribution[rating.rating]++;
    });

    // Calcular promedio de aspectos
    const aspectTotals = {
      punctuality: 0,
      quality: 0,
      cleanliness: 0,
      communication: 0,
      value: 0,
    };
    const aspectCounts = { ...aspectTotals };

    ratings.forEach(rating => {
      if (rating.aspects) {
        Object.entries(rating.aspects).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            aspectTotals[key] += value;
            aspectCounts[key]++;
          }
        });
      }
    });

    const averageAspects = {};
    Object.keys(aspectTotals).forEach(key => {
      if (aspectCounts[key] > 0) {
        averageAspects[key] = Number((aspectTotals[key] / aspectCounts[key]).toFixed(1));
      }
    });

    return {
      averageRating,
      totalRatings: ratings.length,
      ratingDistribution,
      averageAspects,
    };
  }

  async getClientRatingHistory(clientId: string): Promise<{
    totalGiven: number;
    averageGiven: number;
    recentRatings: Rating[];
  }> {
    const ratings = await this.ratingRepository.find({
      where: { clientId, isDeleted: false },
      order: { createdAt: 'DESC' },
      take: 10,
    });

    if (ratings.length === 0) {
      return {
        totalGiven: 0,
        averageGiven: 0,
        recentRatings: [],
      };
    }

    const totalGiven = await this.ratingRepository.count({
      where: { clientId, isDeleted: false },
    });

    const totalRating = ratings.reduce((sum, rating) => sum + rating.rating, 0);
    const averageGiven = Number((totalRating / ratings.length).toFixed(2));

    return {
      totalGiven,
      averageGiven,
      recentRatings: ratings,
    };
  }

  async findFeaturedReviews(barberId: string, limit: number = 3): Promise<Rating[]> {
    return this.ratingRepository.find({
      where: { 
        barberId, 
        status: RatingStatus.APPROVED, 
        isFeatured: true, 
        isDeleted: false 
      },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async findRecentReviews(barberId: string, limit: number = 10): Promise<Rating[]> {
    return this.ratingRepository.find({
      where: { 
        barberId, 
        status: RatingStatus.APPROVED, 
        isDeleted: false 
      },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async getRatingByBarberAndClient(barberId: string, clientId: string): Promise<Rating | null> {
    return this.ratingRepository.findOne({
      where: { barberId, clientId, isDeleted: false },
      order: { createdAt: 'DESC' },
    });
  }

  async getAverageRatingByDateRange(barberId: string, startDate: Date, endDate: Date): Promise<number> {
    const result = await this.ratingRepository
      .createQueryBuilder('rating')
      .select('AVG(rating.rating)', 'average')
      .where('rating.barberId = :barberId', { barberId })
      .andWhere('rating.status = :status', { status: RatingStatus.APPROVED })
      .andWhere('rating.isDeleted = false')
      .andWhere('rating.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate })
      .getRawOne();

    return result?.average ? Number(parseFloat(result.average).toFixed(2)) : 0;
  }
}
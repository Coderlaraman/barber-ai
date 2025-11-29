import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepository } from '../../../common/repositories/base.repository';
import { BarberAvailability } from '../../availability/entities/barber-availability.entity';

@Injectable()
export class BarberAvailabilityRepository extends BaseRepository<BarberAvailability> {
  constructor(
    @InjectRepository(BarberAvailability)
    private readonly barberAvailabilityRepository: Repository<BarberAvailability>,
  ) {
    super(barberAvailabilityRepository);
  }

  async findByBarberId(barberId: string): Promise<BarberAvailability[]> {
    return this.barberAvailabilityRepository.find({
      where: { barberId, isActive: true },
      order: { dayOfWeek: 'ASC', startTime: 'ASC' },
    });
  }

  async findByBarberIdAndDay(barberId: string, dayOfWeek: number): Promise<BarberAvailability[]> {
    return this.barberAvailabilityRepository.find({
      where: { barberId, dayOfWeek, isActive: true },
      order: { startTime: 'ASC' },
    });
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<BarberAvailability[]> {
    return this.barberAvailabilityRepository.find({
      where: {
        isActive: true,
        validFrom: {
          $lte: endDate,
        } as any,
        validUntil: {
          $gte: startDate,
        } as any,
      },
      order: { barberId: 'ASC', dayOfWeek: 'ASC', startTime: 'ASC' },
    });
  }

  async findByBarberIdAndDateRange(barberId: string, startDate: Date, endDate: Date): Promise<BarberAvailability[]> {
    return this.barberAvailabilityRepository.find({
      where: {
        barberId,
        isActive: true,
        validFrom: {
          $lte: endDate,
        } as any,
        validUntil: {
          $gte: startDate,
        } as any,
      },
      order: { dayOfWeek: 'ASC', startTime: 'ASC' },
    });
  }

  async findActiveAvailabilities(): Promise<BarberAvailability[]> {
    const today = new Date();
    return this.barberAvailabilityRepository.find({
      where: {
        isActive: true,
        validFrom: {
          $lte: today,
        } as any,
        validUntil: {
          $gte: today,
        } as any,
      },
      order: { barberId: 'ASC', dayOfWeek: 'ASC', startTime: 'ASC' },
    });
  }

  async findOverlappingAvailabilities(barberId: string, dayOfWeek: number, startTime: string, endTime: string, excludeId?: string): Promise<BarberAvailability[]> {
    const query = this.barberAvailabilityRepository.createQueryBuilder('availability')
      .where('availability.barberId = :barberId', { barberId })
      .andWhere('availability.dayOfWeek = :dayOfWeek', { dayOfWeek })
      .andWhere('availability.isActive = true')
      .andWhere('availability.startTime < :endTime', { endTime })
      .andWhere('availability.endTime > :startTime', { startTime });

    if (excludeId) {
      query.andWhere('availability.id != :excludeId', { excludeId });
    }

    return query.getMany();
  }

  async countByBarberId(barberId: string): Promise<number> {
    return this.barberAvailabilityRepository.count({
      where: { barberId, isActive: true },
    });
  }

  async countByDayOfWeek(dayOfWeek: number): Promise<number> {
    return this.barberAvailabilityRepository.count({
      where: { dayOfWeek, isActive: true },
    });
  }

  async deleteByBarberId(barberId: string): Promise<void> {
    await this.barberAvailabilityRepository.update(
      { barberId, isActive: true },
      { isActive: false, deletedAt: new Date() }
    );
  }
}
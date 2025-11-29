import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepository } from '../../../common/repositories/base.repository';
import { TimeSlot, TimeSlotStatus } from '../../time-slots/entities/time-slot.entity';

@Injectable()
export class TimeSlotRepository extends BaseRepository<TimeSlot> {
  constructor(
    @InjectRepository(TimeSlot)
    private readonly timeSlotRepository: Repository<TimeSlot>,
  ) {
    super(timeSlotRepository);
  }

  async findByBarberId(barberId: string): Promise<TimeSlot[]> {
    return this.timeSlotRepository.find({
      where: { barberId, isActive: true },
      order: { date: 'ASC', startTime: 'ASC' },
    });
  }

  async findByBarberIdAndDate(barberId: string, date: Date): Promise<TimeSlot[]> {
    return this.timeSlotRepository.find({
      where: { barberId, date, isActive: true },
      order: { startTime: 'ASC' },
    });
  }

  async findByBarberIdAndDateRange(barberId: string, startDate: Date, endDate: Date): Promise<TimeSlot[]> {
    return this.timeSlotRepository.find({
      where: {
        barberId,
        date: {
          $gte: startDate,
          $lte: endDate,
        } as any,
        isActive: true,
      },
      order: { date: 'ASC', startTime: 'ASC' },
    });
  }

  async findAvailableSlots(barberId: string, date: Date): Promise<TimeSlot[]> {
    return this.timeSlotRepository.find({
      where: {
        barberId,
        date,
        status: TimeSlotStatus.AVAILABLE,
        isActive: true,
      },
      order: { startTime: 'ASC' },
    });
  }

  async findBlockedSlots(barberId: string, date: Date): Promise<TimeSlot[]> {
    return this.timeSlotRepository.find({
      where: {
        barberId,
        date,
        status: TimeSlotStatus.BLOCKED,
        isActive: true,
      },
      order: { startTime: 'ASC' },
    });
  }

  async findBookedSlots(barberId: string, date: Date): Promise<TimeSlot[]> {
    return this.timeSlotRepository.find({
      where: {
        barberId,
        date,
        status: TimeSlotStatus.BOOKED,
        isActive: true,
      },
      order: { startTime: 'ASC' },
    });
  }

  async findByTimeRange(barberId: string, date: Date, startTime: string, endTime: string): Promise<TimeSlot[]> {
    return this.timeSlotRepository.find({
      where: {
        barberId,
        date,
        startTime: {
          $gte: startTime,
          $lte: endTime,
        } as any,
        isActive: true,
      },
      order: { startTime: 'ASC' },
    });
  }

  async findOverlappingSlots(barberId: string, date: Date, startTime: string, endTime: string, excludeId?: string): Promise<TimeSlot[]> {
    const query = this.timeSlotRepository.createQueryBuilder('timeSlot')
      .where('timeSlot.barberId = :barberId', { barberId })
      .andWhere('timeSlot.date = :date', { date })
      .andWhere('timeSlot.isActive = true')
      .andWhere('timeSlot.startTime < :endTime', { endTime })
      .andWhere('timeSlot.endTime > :startTime', { startTime });

    if (excludeId) {
      query.andWhere('timeSlot.id != :excludeId', { excludeId });
    }

    return query.getMany();
  }

  async findFutureSlots(barberId: string): Promise<TimeSlot[]> {
    const today = new Date();
    return this.timeSlotRepository.find({
      where: {
        barberId,
        date: {
          $gte: today,
        } as any,
        isActive: true,
      },
      order: { date: 'ASC', startTime: 'ASC' },
    });
  }

  async findPastSlots(barberId: string): Promise<TimeSlot[]> {
    const today = new Date();
    return this.timeSlotRepository.find({
      where: {
        barberId,
        date: {
          $lt: today,
        } as any,
        isActive: true,
      },
      order: { date: 'DESC', startTime: 'DESC' },
    });
  }

  async countByBarberId(barberId: string): Promise<number> {
    return this.timeSlotRepository.count({
      where: { barberId, isActive: true },
    });
  }

  async countByDate(date: Date): Promise<number> {
    return this.timeSlotRepository.count({
      where: { date, isActive: true },
    });
  }

  async countAvailableSlots(barberId: string, date: Date): Promise<number> {
    return this.timeSlotRepository.count({
      where: {
        barberId,
        date,
        status: TimeSlotStatus.AVAILABLE,
        isActive: true,
      },
    });
  }

  async countBookedSlots(barberId: string, date: Date): Promise<number> {
    return this.timeSlotRepository.count({
      where: {
        barberId,
        date,
        status: TimeSlotStatus.BOOKED,
        isActive: true,
      },
    });
  }

  async countBlockedSlots(barberId: string, date: Date): Promise<number> {
    return this.timeSlotRepository.count({
      where: {
        barberId,
        date,
        status: TimeSlotStatus.BLOCKED,
        isActive: true,
      },
    });
  }

  async deleteByBarberId(barberId: string): Promise<void> {
    await this.timeSlotRepository.update(
      { barberId, isActive: true },
      { isActive: false, deletedAt: new Date() }
    );
  }

  async deleteByDate(date: Date): Promise<void> {
    await this.timeSlotRepository.update(
      { date, isActive: true },
      { isActive: false, deletedAt: new Date() }
    );
  }
}
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepository } from '../../../common/repositories/base.repository';
import { AppointmentHistory } from '../entities/appointment-history.entity';
import { HistoryAction } from '../enums/history-action.enum';

@Injectable()
export class AppointmentHistoryRepository extends BaseRepository<AppointmentHistory> {
  constructor(
    @InjectRepository(AppointmentHistory)
    private readonly appointmentHistoryRepository: Repository<AppointmentHistory>,
  ) {
    super(appointmentHistoryRepository);
  }

  async findByAppointmentId(appointmentId: string): Promise<AppointmentHistory[]> {
    return this.appointmentHistoryRepository.find({
      where: { appointmentId },
      order: { createdAt: 'DESC' },
    });
  }

  async findByAction(action: HistoryAction): Promise<AppointmentHistory[]> {
    return this.appointmentHistoryRepository.find({
      where: { action: action as any },
      order: { createdAt: 'DESC' },
    });
  }

  async findByUserId(userId: string): Promise<AppointmentHistory[]> {
    return this.appointmentHistoryRepository.find({
      where: { changedBy: userId },
      order: { createdAt: 'DESC' },
    });
  }

  async findByAppointmentIdAndAction(appointmentId: string, action: HistoryAction): Promise<AppointmentHistory[]> {
    return this.appointmentHistoryRepository.find({
      where: {
        appointmentId,
        action: action as any,
      },
      order: { createdAt: 'DESC' },
    });
  }

  async findRecentChanges(limit: number = 50): Promise<AppointmentHistory[]> {
    return this.appointmentHistoryRepository.find({
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async countByAppointmentId(appointmentId: string): Promise<number> {
    return this.appointmentHistoryRepository.count({
      where: { appointmentId },
    });
  }

  async countByAction(action: string): Promise<number> {
    return this.appointmentHistoryRepository.count({
      where: { action: action as any },
    });
  }

  async countByUserId(userId: string): Promise<number> {
    return this.appointmentHistoryRepository.count({
      where: { changedBy: userId },
    });
  }

  async getLastChangeByAppointmentId(appointmentId: string): Promise<AppointmentHistory | null> {
    return this.appointmentHistoryRepository.findOne({
      where: { appointmentId },
      order: { createdAt: 'DESC' },
    });
  }

  async getChangesInDateRange(startDate: Date, endDate: Date): Promise<AppointmentHistory[]> {
    return this.appointmentHistoryRepository.find({
      where: {
        createdAt: {
          $gte: startDate,
          $lte: endDate,
        } as any,
      },
      order: { createdAt: 'DESC' },
    });
  }
}
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepository } from '../../../common/repositories/base.repository';
import { Appointment } from '../entities/appointment.entity';
import { AppointmentStatus } from '../enums/appointment.enum';

@Injectable()
export class AppointmentRepository extends BaseRepository<Appointment> {
  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentRepository: Repository<Appointment>,
  ) {
    super(appointmentRepository);
  }

  async findByBarberAndDate(barberId: string, date: Date): Promise<Appointment[]> {
    return this.appointmentRepository.find({
      where: {
        barberId,
        appointmentDate: date,
        isActive: true,
      },
      relations: ['service', 'timeSlot'],
      order: { startTime: 'ASC' },
    });
  }

  async findByClientAndDate(clientId: string, date: Date): Promise<Appointment[]> {
    return this.appointmentRepository.find({
      where: {
        clientId,
        appointmentDate: date,
        isActive: true,
      },
      relations: ['service', 'timeSlot'],
      order: { startTime: 'ASC' },
    });
  }

  async findByBarberAndDateRange(barberId: string, startDate: Date, endDate: Date): Promise<Appointment[]> {
    return this.appointmentRepository.find({
      where: {
        barberId,
        appointmentDate: {
          $gte: startDate,
          $lte: endDate,
        } as any,
        isActive: true,
      },
      relations: ['service', 'timeSlot'],
      order: { appointmentDate: 'ASC', startTime: 'ASC' },
    });
  }

  async findByStatus(status: AppointmentStatus): Promise<Appointment[]> {
    return this.appointmentRepository.find({
      where: {
        status,
        isActive: true,
      },
      relations: ['service', 'timeSlot'],
      order: { createdAt: 'DESC' },
    });
  }

  async findPendingAppointments(): Promise<Appointment[]> {
    return this.appointmentRepository.find({
      where: {
        status: AppointmentStatus.PENDING,
        isActive: true,
        appointmentDate: {
          $gte: new Date(),
        } as any,
      },
      relations: ['service', 'timeSlot'],
      order: { appointmentDate: 'ASC', startTime: 'ASC' },
    });
  }

  async findConfirmedAppointments(): Promise<Appointment[]> {
    return this.appointmentRepository.find({
      where: {
        status: AppointmentStatus.CONFIRMED,
        isActive: true,
        appointmentDate: {
          $gte: new Date(),
        } as any,
      },
      relations: ['service', 'timeSlot'],
      order: { appointmentDate: 'ASC', startTime: 'ASC' },
    });
  }

  async findCompletedAppointments(): Promise<Appointment[]> {
    return this.appointmentRepository.find({
      where: {
        status: AppointmentStatus.COMPLETED,
        isActive: true,
      },
      relations: ['service', 'timeSlot'],
      order: { appointmentDate: 'DESC', startTime: 'DESC' },
    });
  }

  async findCancelledAppointments(): Promise<Appointment[]> {
    return this.appointmentRepository.find({
      where: {
        status: AppointmentStatus.CANCELLED,
        isActive: true,
      },
      relations: ['service', 'timeSlot'],
      order: { updatedAt: 'DESC' },
    });
  }

  async findOverlappingAppointments(barberId: string, date: Date, startTime: string, endTime: string, excludeId?: string): Promise<Appointment[]> {
    const query = this.appointmentRepository.createQueryBuilder('appointment')
      .where('appointment.barberId = :barberId', { barberId })
      .andWhere('appointment.appointmentDate = :date', { date })
      .andWhere('appointment.isActive = true')
      .andWhere('appointment.status != :cancelledStatus', { cancelledStatus: AppointmentStatus.CANCELLED })
      .andWhere('appointment.startTime < :endTime', { endTime })
      .andWhere('appointment.endTime > :startTime', { startTime });

    if (excludeId) {
      query.andWhere('appointment.id != :excludeId', { excludeId });
    }

    return query.getMany();
  }

  async countByBarberAndDate(barberId: string, date: Date): Promise<number> {
    return this.appointmentRepository.count({
      where: {
        barberId,
        appointmentDate: date,
        isActive: true,
      },
    });
  }

  async countByClientAndDate(clientId: string, date: Date): Promise<number> {
    return this.appointmentRepository.count({
      where: {
        clientId,
        appointmentDate: date,
        isActive: true,
      },
    });
  }

  async countByStatus(status: AppointmentStatus): Promise<number> {
    return this.appointmentRepository.count({
      where: {
        status,
        isActive: true,
      },
    });
  }

  async findByBarberId(barberId: string): Promise<Appointment[]> {
    return this.appointmentRepository.find({
      where: {
        barberId,
        isActive: true,
      },
      relations: ['service', 'timeSlot'],
      order: { appointmentDate: 'DESC', startTime: 'DESC' },
    });
  }

  async findByClientId(clientId: string): Promise<Appointment[]> {
    return this.appointmentRepository.find({
      where: {
        clientId,
        isActive: true,
      },
      relations: ['service', 'timeSlot'],
      order: { appointmentDate: 'DESC', startTime: 'DESC' },
    });
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<Appointment[]> {
    return this.appointmentRepository.find({
      where: {
        appointmentDate: {
          $gte: startDate,
          $lte: endDate,
        } as any,
        isActive: true,
      },
      relations: ['service', 'timeSlot'],
      order: { appointmentDate: 'ASC', startTime: 'ASC' },
    });
  }
}
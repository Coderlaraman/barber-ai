import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  JoinColumn,
  OneToOne,
} from 'typeorm';
import { Specialty } from './specialty.entity';
import { Service } from './service.entity';
import { Schedule } from './schedule.entity';
import { BarberLocation } from './barber-location.entity';

export enum BarberStatus {
  PENDING_VERIFICATION = 'pending_verification',
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  LICENSE_EXPIRED = 'license_expired',
}

export enum ExperienceLevel {
  JUNIOR = 'junior',      // 0-2 años
  MID_LEVEL = 'mid_level',  // 2-5 años
  SENIOR = 'senior',      // 5-10 años
  EXPERT = 'expert',      // 10+ años
}

@Entity('barbers')
export class Barber {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  userId: string; // Relación con User Service

  @Column({ length: 100 })
  licenseNumber: string;

  @Column({ type: 'date' })
  licenseExpiryDate: Date;

  @Column({ type: 'enum', enum: ExperienceLevel, default: ExperienceLevel.JUNIOR })
  experienceLevel: ExperienceLevel;

  @Column({ type: 'integer', default: 0 })
  yearsOfExperience: number;

  @Column({ type: 'text', nullable: true })
  bio: string;

  @Column({ type: 'text', nullable: true })
  professionalSummary: string;

  @Column({ type: 'jsonb', nullable: true })
  skills: string[]; // Array de habilidades específicas

  @Column({ type: 'jsonb', nullable: true })
  certifications: string[]; // Certificaciones profesionales

  @Column({ type: 'jsonb', nullable: true })
  portfolioPhotos: string[]; // URLs de fotos de trabajos

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0.0 })
  averageRating: number;

  @Column({ type: 'integer', default: 0 })
  totalReviews: number;

  @Column({ type: 'integer', default: 0 })
  totalBookings: number;

  @Column({ type: 'integer', default: 0 })
  completedBookings: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0.0 })
  totalEarnings: number;

  @Column({ type: 'enum', enum: BarberStatus, default: BarberStatus.PENDING_VERIFICATION })
  status: BarberStatus;

  @Column({ type: 'boolean', default: false })
  isVerified: boolean;

  @Column({ type: 'boolean', default: true })
  isAvailable: boolean;

  @Column({ type: 'boolean', default: false })
  acceptsWalkIns: boolean; // Acepta clientes sin cita

  @Column({ type: 'integer', default: 15 })
  bufferTimeMinutes: number; // Tiempo entre citas

  @Column({ type: 'jsonb', nullable: true })
  workingHours: Record<string, any>; // Horario de trabajo detallado

  @Column({ type: 'jsonb', nullable: true })
  holidays: string[]; // Días festivos no laborables

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relaciones
  @OneToMany(() => Specialty, (specialty) => specialty.barber)
  specialties: Specialty[];

  @OneToMany(() => Service, (service) => service.barber)
  services: Service[];

  @OneToMany(() => Schedule, (schedule) => schedule.barber)
  schedules: Schedule[];

  @OneToOne(() => BarberLocation, (location) => location.barber)
  @JoinColumn()
  location: BarberLocation;

  // Métodos de utilidad
  isLicenseValid(): boolean {
    return this.licenseExpiryDate > new Date();
  }

  getExperienceLevel(): ExperienceLevel {
    if (this.yearsOfExperience >= 10) return ExperienceLevel.EXPERT;
    if (this.yearsOfExperience >= 5) return ExperienceLevel.SENIOR;
    if (this.yearsOfExperience >= 2) return ExperienceLevel.MID_LEVEL;
    return ExperienceLevel.JUNIOR;
  }

  updateRating(newRating: number): void {
    const total = this.averageRating * this.totalReviews + newRating;
    this.totalReviews += 1;
    this.averageRating = Number((total / this.totalReviews).toFixed(2));
  }

  incrementBookings(completed: boolean = false): void {
    this.totalBookings += 1;
    if (completed) {
      this.completedBookings += 1;
    }
  }

  addEarnings(amount: number): void {
    this.totalEarnings = Number((this.totalEarnings + amount).toFixed(2));
  }
}
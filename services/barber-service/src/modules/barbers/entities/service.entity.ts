import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Barber } from './barber.entity';
import { Specialty } from './specialty.entity';

export enum ServiceStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  TEMPORARILY_UNAVAILABLE = 'temporarily_unavailable',
  SEASONAL = 'seasonal',
}

export enum ServiceGender {
  MALE = 'male',
  FEMALE = 'female',
  UNISEX = 'unisex',
}

export enum ServiceDurationUnit {
  MINUTES = 'minutes',
  HOURS = 'hours',
}

@Entity('barber_services')
export class Service {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 150 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'text', nullable: true })
  shortDescription: string; // Descripción corta para listados

  @Column({ type: 'text', nullable: true })
  detailedDescription: string; // Descripción detallada

  @Column({ type: 'enum', enum: ServiceStatus, default: ServiceStatus.ACTIVE })
  status: ServiceStatus;

  @Column({ type: 'enum', enum: ServiceGender, default: ServiceGender.UNISEX })
  gender: ServiceGender;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  basePrice: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  promotionalPrice: number; // Precio promocional

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  duration: number; // Duración numérica

  @Column({ type: 'enum', enum: ServiceDurationUnit, default: ServiceDurationUnit.MINUTES })
  durationUnit: ServiceDurationUnit;

  @Column({ type: 'integer', nullable: true })
  minDuration: number; // Duración mínima en minutos

  @Column({ type: 'integer', nullable: true })
  maxDuration: number; // Duración máxima en minutos

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  bufferTime: number; // Tiempo adicional entre servicios (minutos)

  @Column({ type: 'jsonb', nullable: true })
  includedServices: string[]; // Servicios incluidos en el paquete

  @Column({ type: 'jsonb', nullable: true })
  additionalServices: string[]; // Servicios adicionales disponibles

  @Column({ type: 'jsonb', nullable: true })
  requirements: string[]; // Requisitos previos del cliente

  @Column({ type: 'jsonb', nullable: true })
  contraindications: string[]; // Contraindicaciones o advertencias

  @Column({ type: 'jsonb', nullable: true })
  photos: string[]; // URLs de fotos del servicio

  @Column({ type: 'jsonb', nullable: true })
  tags: string[]; // Etiquetas para búsqueda

  @Column({ type: 'boolean', default: true })
  requiresConsultation: boolean; // Requiere consulta previa

  @Column({ type: 'boolean', default: false })
  isPackage: boolean; // Es un paquete de servicios

  @Column({ type: 'integer', default: 1 })
  maxClients: number; // Máximo de clientes simultáneos

  @Column({ type: 'integer', default: 0 })
  popularity: number; // Popularidad del servicio (0-100)

  @Column({ type: 'integer', default: 0 })
  bookingCount: number; // Número de veces reservado

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  averageRating: number;

  @Column({ type: 'integer', default: 0 })
  reviewCount: number;

  @Column({ type: 'jsonb', nullable: true })
  seasonalAvailability: Record<string, any>; // Disponibilidad estacional

  @Column({ type: 'date', nullable: true })
  availableFrom: Date; // Fecha desde cuando está disponible

  @Column({ type: 'date', nullable: true })
  availableUntil: Date; // Fecha hasta cuando está disponible

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relaciones
  @ManyToOne(() => Barber, (barber) => barber.services)
  @JoinColumn({ name: 'barberId' })
  barber: Barber;

  @Column()
  barberId: string;

  @ManyToOne(() => Specialty, (specialty) => specialty.services)
  @JoinColumn({ name: 'specialtyId' })
  specialty: Specialty;

  @Column()
  specialtyId: string;

  // Métodos de utilidad
  getDurationInMinutes(): number {
    if (this.durationUnit === ServiceDurationUnit.HOURS) {
      return this.duration * 60;
    }
    return this.duration;
  }

  getTotalDurationWithBuffer(): number {
    return this.getDurationInMinutes() + this.bufferTime;
  }

  getCurrentPrice(): number {
    return this.promotionalPrice || this.basePrice;
  }

  isAvailable(): boolean {
    if (this.status !== ServiceStatus.ACTIVE) return false;
    
    const now = new Date();
    if (this.availableFrom && now < this.availableFrom) return false;
    if (this.availableUntil && now > this.availableUntil) return false;
    
    return true;
  }

  isSeasonallyAvailable(): boolean {
    if (!this.seasonalAvailability) return true;
    
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentDay = now.getDate();
    
    // Lógica de disponibilidad estacional
    const availableMonths = this.seasonalAvailability['months'] || [];
    if (availableMonths.length > 0 && !availableMonths.includes(currentMonth)) {
      return false;
    }
    
    return true;
  }

  updateRating(newRating: number): void {
    const total = this.averageRating * this.reviewCount + newRating;
    this.reviewCount += 1;
    this.averageRating = Number((total / this.reviewCount).toFixed(2));
    this.updatePopularity();
  }

  updatePopularity(): void {
    // Algoritmo simple de popularidad basado en bookings y rating
    const bookingScore = Math.min(this.bookingCount / 10, 50); // Máximo 50 puntos
    const ratingScore = this.averageRating * 20; // Máximo 20 puntos
    const recencyScore = 30; // Puntos por ser nuevo o actualizado
    
    this.popularity = Math.min(Math.round(bookingScore + ratingScore + recencyScore), 100);
  }

  incrementBookingCount(): void {
    this.bookingCount += 1;
    this.updatePopularity();
  }

  matchesSearch(query: string): boolean {
    const searchTerms = query.toLowerCase().split(' ');
    const searchableText = `${this.name} ${this.description} ${this.shortDescription} ${this.specialty?.name} ${this.tags?.join(' ')}`.toLowerCase();
    return searchTerms.every(term => searchableText.includes(term));
  }

  getPriceRange(): { min: number; max: number } {
    const basePrice = this.getCurrentPrice();
    let maxPrice = basePrice;
    
    if (this.additionalServices && this.additionalServices.length > 0) {
      // Asumir que servicios adicionales pueden aumentar el precio en un 50% máximo
      maxPrice = basePrice * 1.5;
    }
    
    return {
      min: basePrice,
      max: Number(maxPrice.toFixed(2)),
    };
  }
}
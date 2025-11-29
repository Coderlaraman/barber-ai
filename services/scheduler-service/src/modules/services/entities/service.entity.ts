import { Entity, Column, Index, Check } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

export enum ServiceCategory {
  HAIRCUT = 'HAIRCUT',
  BEARD_TRIM = 'BEARD_TRIM',
  HAIR_WASH = 'HAIR_WASH',
  HAIR_COLORING = 'HAIR_COLORING',
  HAIR_TREATMENT = 'HAIR_TREATMENT',
  SHAVE = 'SHAVE',
  STYLING = 'STYLING',
  COMBO = 'COMBO',
  OTHER = 'OTHER',
}

export enum ServiceStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  TEMPORARILY_UNAVAILABLE = 'TEMPORARILY_UNAVAILABLE',
}

/**
 * Entidad que representa los servicios que ofrecen los barberos
 * Incluye gestión de precios, duración y disponibilidad
 */
@Entity('services')
@Index(['barberId', 'isActive'])
@Index(['category', 'status'])
@Index(['price', 'durationMinutes'])
@Check('price >= 0')
@Check('duration_minutes > 0')
@Check('buffer_time_minutes >= 0')
export class Service extends BaseEntity {
  @Column({
    name: 'name',
    type: 'varchar',
    length: 100,
    nullable: false,
    comment: 'Nombre del servicio',
  })
  name!: string;

  @Column({
    name: 'description',
    type: 'text',
    nullable: true,
    comment: 'Descripción detallada del servicio',
  })
  description?: string;

  @Column({
    name: 'category',
    type: 'enum',
    enum: ServiceCategory,
    default: ServiceCategory.OTHER,
    comment: 'Categoría del servicio',
  })
  category!: ServiceCategory;

  @Column({
    name: 'status',
    type: 'enum',
    enum: ServiceStatus,
    default: ServiceStatus.ACTIVE,
    comment: 'Estado del servicio',
  })
  status!: ServiceStatus;

  @Column({
    name: 'price',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: false,
    comment: 'Precio base del servicio en la moneda local',
  })
  price!: number;

  @Column({
    name: 'duration_minutes',
    type: 'integer',
    nullable: false,
    comment: 'Duración estimada del servicio en minutos',
  })
  durationMinutes!: number;

  @Column({
    name: 'buffer_time_minutes',
    type: 'integer',
    default: 0,
    comment: 'Tiempo de buffer adicional entre citas (minutos)',
  })
  bufferTimeMinutes!: number;

  @Column({
    name: 'total_duration_minutes',
    type: 'integer',
    nullable: false,
    comment: 'Duración total incluyendo buffer (calculado)',
  })
  get totalDurationMinutes(): number {
    return this.durationMinutes + this.bufferTimeMinutes;
  }

  @Column({
    name: 'image_url',
    type: 'varchar',
    length: 500,
    nullable: true,
    comment: 'URL de imagen representativa del servicio',
  })
  imageUrl?: string;

  @Column({
    name: 'is_featured',
    type: 'boolean',
    default: false,
    comment: 'Indica si es un servicio destacado',
  })
  isFeatured!: boolean;

  @Column({
    name: 'min_booking_notice_hours',
    type: 'integer',
    default: 2,
    comment: 'Mínimo de horas de anticipación para reservar',
  })
  minBookingNoticeHours!: number;

  @Column({
    name: 'max_days_in_advance',
    type: 'integer',
    default: 30,
    comment: 'Máximo de días en el futuro para reservar',
  })
  maxDaysInAdvance!: number;

  @Column({
    name: 'requirements',
    type: 'jsonb',
    nullable: true,
    default: {},
    comment: 'Requisitos específicos del servicio',
  })
  requirements?: {
    hairLength?: 'short' | 'medium' | 'long';
    beardLength?: 'none' | 'short' | 'medium' | 'long';
    specialProducts?: string[];
    preparation?: string[];
  };

  @Column({
    name: 'tags',
    type: 'text',
    array: true,
    default: [],
    comment: 'Etiquetas para búsqueda y filtrado',
  })
  tags!: string[];

  @Column({
    name: 'barber_id',
    type: 'uuid',
    nullable: false,
    comment: 'ID del barbero que ofrece el servicio',
  })
  barberId!: string;

  @Column({
    name: 'duration',
    type: 'integer',
    nullable: false,
    comment: 'Duración del servicio en minutos',
  })
  duration!: number;

  @Column({
    name: 'popularity',
    type: 'integer',
    default: 0,
    comment: 'Popularidad del servicio (número de reservas)',
  })
  popularity!: number;



  /**
   * Verifica si el servicio está disponible para reservar
   */
  isAvailableForBooking(): boolean {
    return this.status === ServiceStatus.ACTIVE && this.isActive;
  }

  /**
   * Calcula el precio total incluyendo impuestos o descuentos
   */
  calculateTotalPrice(taxRate: number = 0, discount: number = 0): number {
    const subtotal = this.price;
    const taxAmount = subtotal * taxRate;
    const discountAmount = subtotal * discount;
    return subtotal + taxAmount - discountAmount;
  }

  /**
   * Verifica si hay suficiente tiempo para reservar
   */
  hasMinimumNotice(proposedTime: Date): boolean {
    const now = new Date();
    const noticeHours = (proposedTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    return noticeHours >= this.minBookingNoticeHours;
  }

  /**
   * Verifica si la fecha está dentro del período permitido
   */
  isWithinBookingWindow(proposedDate: Date): boolean {
    const now = new Date();
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + this.maxDaysInAdvance);
    
    return proposedDate >= now && proposedDate <= maxDate;
  }

  /**
   * Obtiene etiquetas formateadas para búsqueda
   */
  getSearchableTags(): string[] {
    return [
      this.name.toLowerCase(),
      this.category.toLowerCase(),
      this.description?.toLowerCase() || '',
      ...this.tags.map(tag => tag.toLowerCase()),
    ].filter(Boolean);
  }
}
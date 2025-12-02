import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Barber } from './barber.entity';
import { Service } from './service.entity';

export enum SpecialtyCategory {
  HAIRCUT = 'haircut',
  BEARD = 'beard',
  HAIR_TREATMENT = 'hair_treatment',
  HAIR_COLORING = 'hair_coloring',
  HAIR_STYLING = 'hair_styling',
  SHAVING = 'shaving',
  FACIAL_TREATMENT = 'facial_treatment',
  SCALP_TREATMENT = 'scalp_treatment',
  OTHER = 'other',
}

export enum SpecialtyLevel {
  BASIC = 'basic',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
  EXPERT = 'expert',
}

@Entity('barber_specialties')
export class Specialty {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  name: string;

  @Column({ type: 'enum', enum: SpecialtyCategory })
  category: SpecialtyCategory;

  @Column({ type: 'enum', enum: SpecialtyLevel, default: SpecialtyLevel.BASIC })
  level: SpecialtyLevel;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'text', nullable: true })
  requirements: string; // Requisitos para esta especialidad

  @Column({ type: 'integer', nullable: true })
  minExperienceYears: number; // Años mínimos de experiencia requeridos

  @Column({ type: 'jsonb', nullable: true })
  requiredCertifications: string[]; // Certificaciones necesarias

  @Column({ type: 'jsonb', nullable: true })
  toolsRequired: string[]; // Herramientas necesarias

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  averageDuration: number; // Duración promedio en minutos

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  basePrice: number; // Precio base sugerido

  @Column({ type: 'integer', default: 0 })
  complexity: number; // 1-10 nivel de complejidad

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'boolean', default: false })
  requiresCertification: boolean;

  @Column({ type: 'jsonb', nullable: true })
  tags: string[]; // Etiquetas para búsqueda

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relación con Barber
  @ManyToOne(() => Barber, (barber) => barber.specialties)
  @JoinColumn({ name: 'barberId' })
  barber: Barber;

  @Column()
  barberId: string;

  // Relación con Service
  @OneToMany(() => Service, (service) => service.specialty)
  services: Service[];

  // Métodos de utilidad
  isAvailableFor(barberExperience: number): boolean {
    if (!this.minExperienceYears) return true;
    return barberExperience >= this.minExperienceYears;
  }

  getEstimatedPrice(basePrice: number, experienceLevel: number): number {
    const complexityMultiplier = this.complexity / 5; // Normalizar a 0-2
    const experienceMultiplier = experienceLevel / 5; // Normalizar a 0-2
    return Number((basePrice * (1 + complexityMultiplier + experienceMultiplier)).toFixed(2));
  }

  matchesSearch(query: string): boolean {
    const searchTerms = query.toLowerCase().split(' ');
    const searchableText = `${this.name} ${this.description} ${this.category} ${this.tags?.join(' ')}`.toLowerCase();
    return searchTerms.every(term => searchableText.includes(term));
  }
}
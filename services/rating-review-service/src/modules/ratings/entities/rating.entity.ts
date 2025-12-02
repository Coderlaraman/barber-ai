import { Entity, Column, Index, Check } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

export enum RatingType {
  APPOINTMENT = 'appointment',
  SERVICE = 'service',
  BARBER = 'barber',
}

export enum RatingStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  FLAGGED = 'flagged',
}

@Entity('ratings')
@Index(['barberId', 'createdAt'])
@Index(['clientId', 'createdAt'])
@Index(['appointmentId'])
@Index(['barberId', 'status'])
@Check('rating >= 1 AND rating <= 5')
@Check('CHAR_LENGTH(comment) >= 10 WHEN comment IS NOT NULL')
export class Rating extends BaseEntity {
  // Explicitly declare BaseEntity properties for TypeScript compatibility
  id: string;
  createdAt: Date;
  updatedAt: Date;
  version: number;
  createdBy: string;
  updatedBy: string;
  isActive: boolean;
  isDeleted: boolean;
  deletedAt: Date;
  deletedBy: string;

  @Column({ type: 'uuid', nullable: false })
  @Index()
  appointmentId: string;

  @Column({ type: 'uuid', nullable: false })
  @Index()
  barberId: string;

  @Column({ type: 'uuid', nullable: false })
  @Index()
  clientId: string;

  @Column({ type: 'uuid', nullable: false })
  serviceId: string;

  @Column({ type: 'enum', enum: RatingType, default: RatingType.APPOINTMENT })
  type: RatingType;

  @Column({ type: 'integer', nullable: false })
  rating: number;

  @Column({ type: 'text', nullable: true })
  comment: string;

  @Column({ type: 'jsonb', nullable: true })
  aspects: {
    punctuality?: number;
    quality?: number;
    cleanliness?: number;
    communication?: number;
    value?: number;
  };

  @Column({ type: 'jsonb', nullable: true })
  photos: string[];

  @Column({ type: 'boolean', default: false })
  isVerified: boolean;

  @Column({ type: 'boolean', default: false })
  isFeatured: boolean;

  @Column({ type: 'integer', default: 0 })
  helpfulCount: number;

  @Column({ type: 'integer', default: 0 })
  reportCount: number;

  @Column({ type: 'enum', enum: RatingStatus, default: RatingStatus.PENDING })
  status: RatingStatus;

  @Column({ type: 'text', nullable: true })
  rejectionReason: string;

  @Column({ type: 'uuid', nullable: true })
  moderatedBy: string;

  @Column({ type: 'timestamptz', nullable: true })
  moderatedAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  @Index()
  appointmentDate: Date;

  // Métodos de utilidad
  approve(moderatorId: string): void {
    this.status = RatingStatus.APPROVED;
    this.moderatedBy = moderatorId;
    this.moderatedAt = new Date();
  }

  reject(reason: string, moderatorId: string): void {
    this.status = RatingStatus.REJECTED;
    this.rejectionReason = reason;
    this.moderatedBy = moderatorId;
    this.moderatedAt = new Date();
  }

  flag(): void {
    this.status = RatingStatus.FLAGGED;
    this.reportCount += 1;
  }

  markAsHelpful(): void {
    this.helpfulCount += 1;
  }

  addPhoto(photoUrl: string): void {
    if (!this.photos) {
      this.photos = [];
    }
    this.photos.push(photoUrl);
  }

  calculateAverageAspects(): number {
    if (!this.aspects) return this.rating;
    
    const values = Object.values(this.aspects).filter(val => val !== undefined);
    if (values.length === 0) return this.rating;
    
    const sum = values.reduce((acc, val) => acc + val, 0);
    return Number((sum / values.length).toFixed(1));
  }

  isValid(): boolean {
    return this.rating >= 1 && this.rating <= 5 && 
           (this.comment ? this.comment.length >= 10 : true);
  }
}
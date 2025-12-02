import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { RatingRepository } from '../repositories/rating.repository';
import { Rating, RatingStatus } from '../entities/rating.entity';
import {
  CreateRatingDto,
  UpdateRatingDto,
  ModerateRatingDto,
  BarberRatingStatsDto,
  ClientRatingHistoryDto,
} from '../dto/rating.dto';

@Injectable()
export class RatingService {
  constructor(
    private readonly ratingRepository: RatingRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async createRating(createRatingDto: CreateRatingDto, userId: string): Promise<Rating> {
    // Verificar si ya existe una calificación para esta cita
    const existingRating = await this.ratingRepository.findByAppointmentId(createRatingDto.appointmentId);
    if (existingRating) {
      throw new ConflictException('Ya existe una calificación para esta cita');
    }

    // Validar que la calificación sea válida
    if (createRatingDto.aspects) {
      const aspectValues = Object.values(createRatingDto.aspects).filter(val => val !== undefined);
      for (const value of aspectValues) {
        if (value < 1 || value > 5) {
          throw new BadRequestException('Los valores de aspectos deben estar entre 1 y 5');
        }
      }
    }

    const rating = await this.ratingRepository.createEntity({
      ...createRatingDto,
      status: RatingStatus.APPROVED, // Auto-aprobado inicialmente
      isVerified: false,
    }, userId);

    // Emitir evento de calificación creada
    this.eventEmitter.emit('rating.created', {
      ratingId: rating.id,
      barberId: rating.barberId,
      clientId: rating.clientId,
      rating: rating.rating,
      appointmentId: rating.appointmentId,
    });

    return rating;
  }

  async updateRating(id: string, updateRatingDto: UpdateRatingDto, userId: string): Promise<Rating> {
    const rating = await this.ratingRepository.findOneById(id);
    if (!rating) {
      throw new NotFoundException('Calificación no encontrada');
    }

    // Validar que solo el cliente propietario pueda actualizar
    if (rating.clientId !== userId) {
      throw new BadRequestException('No tienes permiso para actualizar esta calificación');
    }

    // Validar que no esté rechazada o eliminada
    if (rating.status === RatingStatus.REJECTED) {
      throw new BadRequestException('No se puede actualizar una calificación rechazada');
    }

    const oldRating = rating.rating; // Guardar valor anterior antes de actualizar
    const updatedRating = await this.ratingRepository.updateEntity(id, updateRatingDto, userId);

    // Emitir evento de calificación actualizada
    this.eventEmitter.emit('rating.updated', {
      ratingId: updatedRating.id,
      barberId: updatedRating.barberId,
      oldRating: oldRating,
      newRating: updatedRating.rating,
      clientId: updatedRating.clientId,
    });

    return updatedRating;
  }

  async moderateRating(id: string, moderateRatingDto: ModerateRatingDto, moderatorId: string): Promise<Rating> {
    const rating = await this.ratingRepository.findOneById(id);
    if (!rating) {
      throw new NotFoundException('Calificación no encontrada');
    }

    if (moderateRatingDto.status === RatingStatus.REJECTED && !moderateRatingDto.rejectionReason) {
      throw new BadRequestException('Se requiere una razón para rechazar una calificación');
    }

    rating.status = moderateRatingDto.status;
    if (moderateRatingDto.rejectionReason) {
      rating.rejectionReason = moderateRatingDto.rejectionReason;
    }
    rating.moderatedBy = moderatorId;
    rating.moderatedAt = new Date();

    const updatedRating = await this.ratingRepository.save(rating);

    // Emitir evento de calificación moderada
    this.eventEmitter.emit('rating.moderated', {
      ratingId: updatedRating.id,
      barberId: updatedRating.barberId,
      status: updatedRating.status,
      moderatedBy: moderatorId,
    });

    return updatedRating;
  }

  async deleteRating(id: string, userId: string): Promise<void> {
    const rating = await this.ratingRepository.findOneById(id);
    if (!rating) {
      throw new NotFoundException('Calificación no encontrada');
    }

    // Validar que solo el cliente propietario pueda eliminar
    if (rating.clientId !== userId) {
      throw new BadRequestException('No tienes permiso para eliminar esta calificación');
    }

    await this.ratingRepository.softDelete(id, userId);

    // Emitir evento de calificación eliminada
    this.eventEmitter.emit('rating.deleted', {
      ratingId: id,
      barberId: rating.barberId,
      clientId: rating.clientId,
    });
  }

  async getRatingById(id: string): Promise<Rating> {
    const rating = await this.ratingRepository.findOneById(id);
    if (!rating) {
      throw new NotFoundException('Calificación no encontrada');
    }
    return rating;
  }

  async getRatingsByBarber(barberId: string, status?: RatingStatus): Promise<Rating[]> {
    return this.ratingRepository.findByBarberId(barberId, status);
  }

  async getRatingsByClient(clientId: string, status?: RatingStatus): Promise<Rating[]> {
    return this.ratingRepository.findByClientId(clientId, status);
  }

  async getRatingByAppointment(appointmentId: string): Promise<Rating | null> {
    return this.ratingRepository.findByAppointmentId(appointmentId);
  }

  async getBarberRatingStats(barberId: string): Promise<BarberRatingStatsDto> {
    const stats = await this.ratingRepository.getBarberRatingStats(barberId);
    return {
      barberId,
      averageRating: stats.averageRating,
      totalRatings: stats.totalRatings,
      ratingDistribution: {
        5: stats.ratingDistribution[5] || 0,
        4: stats.ratingDistribution[4] || 0,
        3: stats.ratingDistribution[3] || 0,
        2: stats.ratingDistribution[2] || 0,
        1: stats.ratingDistribution[1] || 0,
      },
      averageAspects: stats.averageAspects,
    };
  }

  async getClientRatingHistory(clientId: string): Promise<ClientRatingHistoryDto> {
    const history = await this.ratingRepository.getClientRatingHistory(clientId);
    return {
      clientId,
      totalGiven: history.totalGiven,
      averageGiven: history.averageGiven,
      recentRatings: history.recentRatings.map(rating => ({
        id: rating.id,
        appointmentId: rating.appointmentId,
        barberId: rating.barberId,
        clientId: rating.clientId,
        serviceId: rating.serviceId,
        type: rating.type,
        rating: rating.rating,
        comment: rating.comment,
        aspects: rating.aspects,
        photos: rating.photos,
        isVerified: rating.isVerified,
        isFeatured: rating.isFeatured,
        helpfulCount: rating.helpfulCount,
        reportCount: rating.reportCount,
        status: rating.status,
        rejectionReason: rating.rejectionReason,
        createdAt: rating.createdAt,
        updatedAt: rating.updatedAt,
      })),
    };
  }

  async getFeaturedReviews(barberId: string, limit: number = 3): Promise<Rating[]> {
    return this.ratingRepository.findFeaturedReviews(barberId, limit);
  }

  async getRecentReviews(barberId: string, limit: number = 10): Promise<Rating[]> {
    return this.ratingRepository.findRecentReviews(barberId, limit);
  }

  async markAsHelpful(ratingId: string, userId: string): Promise<Rating> {
    const rating = await this.ratingRepository.findOneById(ratingId);
    if (!rating) {
      throw new NotFoundException('Calificación no encontrada');
    }

    rating.markAsHelpful();
    const updatedRating = await this.ratingRepository.save(rating);

    this.eventEmitter.emit('rating.helpful', {
      ratingId: updatedRating.id,
      barberId: updatedRating.barberId,
      helpfulCount: updatedRating.helpfulCount,
    });

    return updatedRating;
  }

  async flagRating(ratingId: string, userId: string): Promise<Rating> {
    const rating = await this.ratingRepository.findOneById(ratingId);
    if (!rating) {
      throw new NotFoundException('Calificación no encontrada');
    }

    rating.flag();
    const updatedRating = await this.ratingRepository.save(rating);

    // Si tiene demasiados reportes, podría requerir moderación
    if (updatedRating.reportCount >= 3) {
      this.eventEmitter.emit('rating.requires.moderation', {
        ratingId: updatedRating.id,
        barberId: updatedRating.barberId,
        reportCount: updatedRating.reportCount,
      });
    }

    return updatedRating;
  }
}
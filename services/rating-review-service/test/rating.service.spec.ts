import { Test, TestingModule } from '@nestjs/testing';
import { RatingService } from '../src/modules/ratings/services/rating.service';
import { RatingRepository } from '../src/modules/ratings/repositories/rating.repository';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { Rating, RatingStatus } from '../src/modules/ratings/entities/rating.entity';
import { CreateRatingDto, UpdateRatingDto } from '../src/modules/ratings/dto/rating.dto';
import { describe, it, expect, beforeEach, jest } from '@jest/globals';

describe('RatingService', () => {
  let service: RatingService;
  let ratingRepository: any;
  let eventEmitter: any;

  const mockRatingRepository = {
    findByAppointmentId: jest.fn(),
    createEntity: jest.fn(),
    findOneById: jest.fn(),
    updateEntity: jest.fn(),
    save: jest.fn(),
    softDelete: jest.fn(),
    findByBarberId: jest.fn(),
    findByClientId: jest.fn(),
    getBarberRatingStats: jest.fn(),
    getClientRatingHistory: jest.fn(),
    findFeaturedReviews: jest.fn(),
    findRecentReviews: jest.fn(),
  };

  const mockEventEmitter = {
    emit: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RatingService,
        {
          provide: RatingRepository,
          useValue: mockRatingRepository,
        },
        {
          provide: EventEmitter2,
          useValue: mockEventEmitter,
        },
      ],
    }).compile();

    service = module.get<RatingService>(RatingService);
    ratingRepository = mockRatingRepository;
    eventEmitter = mockEventEmitter;

    jest.clearAllMocks();
  });

  describe('createRating', () => {
    const createRatingDto: CreateRatingDto = {
      barberId: 'barber-123',
      appointmentId: 'appointment-123',
      clientId: 'client-123',
      serviceId: 'service-123',
      rating: 5,
      comment: 'Excellent service!',
      aspects: {
        punctuality: 5,
        quality: 5,
        cleanliness: 5,
      },
    };

    const userId = 'client-456';
    const mockCreatedRating = {
      id: 'rating-123',
      ...createRatingDto,
      status: RatingStatus.APPROVED,
      isVerified: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should create a rating successfully', async () => {
      ratingRepository.findByAppointmentId.mockResolvedValue(null);
      ratingRepository.createEntity.mockResolvedValue(mockCreatedRating);

      const result = await service.createRating(createRatingDto, userId);

      expect(ratingRepository.findByAppointmentId).toHaveBeenCalledWith(createRatingDto.appointmentId);
      expect(ratingRepository.createEntity).toHaveBeenCalledWith({
        ...createRatingDto,
        status: RatingStatus.APPROVED,
        isVerified: false,
      }, userId);
      expect(eventEmitter.emit).toHaveBeenCalledWith('rating.created', {
        ratingId: mockCreatedRating.id,
        barberId: mockCreatedRating.barberId,
        clientId: mockCreatedRating.clientId,
        rating: mockCreatedRating.rating,
        appointmentId: mockCreatedRating.appointmentId,
      });
      expect(result).toEqual(mockCreatedRating);
    });

    it('should throw ConflictException if rating already exists for appointment', async () => {
      const existingRating = { id: 'existing-rating' };
      ratingRepository.findByAppointmentId.mockResolvedValue(existingRating);

      await expect(service.createRating(createRatingDto, userId))
        .rejects.toThrow(ConflictException);

      expect(ratingRepository.createEntity).not.toHaveBeenCalled();
      expect(eventEmitter.emit).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if aspect values are invalid', async () => {
      const invalidDto = {
        ...createRatingDto,
        aspects: {
          punctuality: 6, // Invalid: > 5
          quality: 5,
          cleanliness: 5,
        },
      };
      ratingRepository.findByAppointmentId.mockResolvedValue(null);

      await expect(service.createRating(invalidDto, userId))
        .rejects.toThrow(BadRequestException);

      expect(ratingRepository.createEntity).not.toHaveBeenCalled();
      expect(eventEmitter.emit).not.toHaveBeenCalled();
    });
  });

  describe('updateRating', () => {
    const ratingId = 'rating-123';
    const updateRatingDto: UpdateRatingDto = {
      rating: 4,
      comment: 'Updated comment',
    };
    const userId = 'client-456';

    const existingRating = {
      id: ratingId,
      rating: 3,
      clientId: userId,
      barberId: 'barber-123',
      status: RatingStatus.APPROVED,
    };

    const updatedRating = {
      ...existingRating,
      ...updateRatingDto,
      updatedAt: new Date(),
    };

    it('should update rating successfully', async () => {
      ratingRepository.findOneById.mockResolvedValue(existingRating);
      ratingRepository.updateEntity.mockResolvedValue(updatedRating);

      const result = await service.updateRating(ratingId, updateRatingDto, userId);

      expect(ratingRepository.findOneById).toHaveBeenCalledWith(ratingId);
      expect(ratingRepository.updateEntity).toHaveBeenCalledWith(ratingId, updateRatingDto, userId);
      expect(eventEmitter.emit).toHaveBeenCalledWith('rating.updated', {
        ratingId: updatedRating.id,
        barberId: updatedRating.barberId,
        oldRating: 3,
        newRating: 4,
        clientId: updatedRating.clientId,
      });
      expect(result).toEqual(updatedRating);
    });

    it('should throw NotFoundException if rating not found', async () => {
      ratingRepository.findOneById.mockResolvedValue(null);

      await expect(service.updateRating(ratingId, updateRatingDto, userId))
        .rejects.toThrow(NotFoundException);

      expect(ratingRepository.updateEntity).not.toHaveBeenCalled();
      expect(eventEmitter.emit).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if user is not the owner', async () => {
      const differentUserRating = {
        ...existingRating,
        clientId: 'different-client',
      };
      ratingRepository.findOneById.mockResolvedValue(differentUserRating);

      await expect(service.updateRating(ratingId, updateRatingDto, userId))
        .rejects.toThrow(BadRequestException);

      expect(ratingRepository.updateEntity).not.toHaveBeenCalled();
      expect(eventEmitter.emit).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if rating is rejected', async () => {
      const rejectedRating = {
        ...existingRating,
        status: RatingStatus.REJECTED,
      };
      ratingRepository.findOneById.mockResolvedValue(rejectedRating);

      await expect(service.updateRating(ratingId, updateRatingDto, userId))
        .rejects.toThrow(BadRequestException);

      expect(ratingRepository.updateEntity).not.toHaveBeenCalled();
      expect(eventEmitter.emit).not.toHaveBeenCalled();
    });
  });

  describe('deleteRating', () => {
    const ratingId = 'rating-123';
    const userId = 'client-456';

    const existingRating = {
      id: ratingId,
      clientId: userId,
      barberId: 'barber-123',
    };

    it('should delete rating successfully', async () => {
      ratingRepository.findOneById.mockResolvedValue(existingRating);

      await service.deleteRating(ratingId, userId);

      expect(ratingRepository.findOneById).toHaveBeenCalledWith(ratingId);
      expect(ratingRepository.softDelete).toHaveBeenCalledWith(ratingId, userId);
      expect(eventEmitter.emit).toHaveBeenCalledWith('rating.deleted', {
        ratingId: ratingId,
        barberId: existingRating.barberId,
        clientId: existingRating.clientId,
      });
    });

    it('should throw NotFoundException if rating not found', async () => {
      ratingRepository.findOneById.mockResolvedValue(null);

      await expect(service.deleteRating(ratingId, userId))
        .rejects.toThrow(NotFoundException);

      expect(ratingRepository.softDelete).not.toHaveBeenCalled();
      expect(eventEmitter.emit).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if user is not the owner', async () => {
      const differentUserRating = {
        ...existingRating,
        clientId: 'different-client',
      };
      ratingRepository.findOneById.mockResolvedValue(differentUserRating);

      await expect(service.deleteRating(ratingId, userId))
        .rejects.toThrow(BadRequestException);

      expect(ratingRepository.softDelete).not.toHaveBeenCalled();
      expect(eventEmitter.emit).not.toHaveBeenCalled();
    });
  });

  describe('getRatingById', () => {
    const ratingId = 'rating-123';

    it('should return rating if found', async () => {
      const mockRating = { id: ratingId };
      ratingRepository.findOneById.mockResolvedValue(mockRating);

      const result = await service.getRatingById(ratingId);

      expect(ratingRepository.findOneById).toHaveBeenCalledWith(ratingId);
      expect(result).toEqual(mockRating);
    });

    it('should throw NotFoundException if rating not found', async () => {
      ratingRepository.findOneById.mockResolvedValue(null);

      await expect(service.getRatingById(ratingId))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('getRatingsByBarber', () => {
    const barberId = 'barber-123';

    it('should return ratings for barber', async () => {
      const mockRatings = [{ id: 'rating-1' }, { id: 'rating-2' }];
      ratingRepository.findByBarberId.mockResolvedValue(mockRatings);

      const result = await service.getRatingsByBarber(barberId);

      expect(ratingRepository.findByBarberId).toHaveBeenCalledWith(barberId, undefined);
      expect(result).toEqual(mockRatings);
    });

    it('should return ratings for barber with specific status', async () => {
      const mockRatings = [{ id: 'rating-1' }];
      ratingRepository.findByBarberId.mockResolvedValue(mockRatings);

      const result = await service.getRatingsByBarber(barberId, RatingStatus.APPROVED);

      expect(ratingRepository.findByBarberId).toHaveBeenCalledWith(barberId, RatingStatus.APPROVED);
      expect(result).toEqual(mockRatings);
    });
  });

  describe('getBarberRatingStats', () => {
    const barberId = 'barber-123';

    it('should return rating stats for barber', async () => {
      const mockRepositoryStats = {
        averageRating: 4.5,
        totalRatings: 10,
        ratingDistribution: {
          5: 5,
          4: 3,
          3: 2,
          2: 0,
          1: 0,
        },
        averageAspects: {
          punctuality: 4.5,
          quality: 4.3,
          service: 4.6,
        },
      };
      ratingRepository.getBarberRatingStats.mockResolvedValue(mockRepositoryStats);

      const result = await service.getBarberRatingStats(barberId);

      expect(ratingRepository.getBarberRatingStats).toHaveBeenCalledWith(barberId);
      expect(result).toEqual({
        barberId,
        ...mockRepositoryStats,
      });
    });
  });

  describe('markAsHelpful', () => {
    const ratingId = 'rating-123';
    const userId = 'user-456';

    const existingRating = {
      id: ratingId,
      barberId: 'barber-123',
      helpfulCount: 5,
      markAsHelpful: jest.fn().mockImplementation(function() {
        this.helpfulCount++;
      }),
    };

    it('should mark rating as helpful', async () => {
      ratingRepository.findOneById.mockResolvedValue(existingRating);
      ratingRepository.save.mockResolvedValue(existingRating);

      const result = await service.markAsHelpful(ratingId, userId);

      expect(ratingRepository.findOneById).toHaveBeenCalledWith(ratingId);
      expect(existingRating.markAsHelpful).toHaveBeenCalled();
      expect(ratingRepository.save).toHaveBeenCalledWith(existingRating);
      expect(eventEmitter.emit).toHaveBeenCalledWith('rating.helpful', {
        ratingId: ratingId,
        barberId: existingRating.barberId,
        helpfulCount: 6,
      });
      expect(result).toEqual(existingRating);
    });

    it('should throw NotFoundException if rating not found', async () => {
      ratingRepository.findOneById.mockResolvedValue(null);

      await expect(service.markAsHelpful(ratingId, userId))
        .rejects.toThrow(NotFoundException);

      expect(ratingRepository.save).not.toHaveBeenCalled();
      expect(eventEmitter.emit).not.toHaveBeenCalled();
    });
  });
});
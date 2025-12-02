/// <reference types="jest" />
import { Test, TestingModule } from '@nestjs/testing';
import { RatingController } from '../src/modules/ratings/controllers/rating.controller';
import { RatingService } from '../src/modules/ratings/services/rating.service';
import { CreateRatingDto, UpdateRatingDto, ModerateRatingDto } from '../src/modules/ratings/dto/rating.dto';
import { Rating, RatingStatus } from '../src/modules/ratings/entities/rating.entity';
import { describe, it, expect, beforeEach, jest } from '@jest/globals';

describe('RatingController', () => {
  let controller: RatingController;
  let ratingService: any;

  const mockRatingService = {
    createRating: jest.fn(),
    updateRating: jest.fn(),
    deleteRating: jest.fn(),
    getRatingById: jest.fn(),
    getRatingsByBarber: jest.fn(),
    getRatingByAppointment: jest.fn(),
    getBarberRatingStats: jest.fn(),
    getClientRatingHistory: jest.fn(),
    getFeaturedReviews: jest.fn(),
    moderateRating: jest.fn(),
    markAsHelpful: jest.fn(),
    flagRating: jest.fn(),
  };

  const mockRequest = {
    user: {
      userId: 'user-123',
      email: 'user@example.com',
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RatingController],
      providers: [
        {
          provide: RatingService,
          useValue: mockRatingService,
        },
      ],
    }).compile();

    controller = module.get<RatingController>(RatingController);
    ratingService = mockRatingService;

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
    };

    const mockCreatedRating = {
      id: 'rating-123',
      ...createRatingDto,
      status: RatingStatus.APPROVED,
      createdAt: new Date(),
      barberId: 'barber-123',
      clientId: 'client-123',
      serviceId: 'service-123',
      appointmentId: 'appointment-123',
      rating: 5,
      comment: 'Excellent service!',
    };

    it('should create a rating successfully', async () => {
      ratingService.createRating.mockResolvedValue(mockCreatedRating);

      const result = await controller.createRating(createRatingDto, mockRequest as any);

      expect(ratingService.createRating).toHaveBeenCalledWith(createRatingDto, mockRequest.user.userId);
      expect(result).toEqual(mockCreatedRating);
    });
  });

  describe('updateRating', () => {
    const ratingId = 'rating-123';
    const updateRatingDto: UpdateRatingDto = {
      rating: 4,
      comment: 'Updated comment',
    };

    const mockUpdatedRating = {
      id: ratingId,
      ...updateRatingDto,
      barberId: 'barber-123',
      clientId: 'client-123',
      serviceId: 'service-123',
      appointmentId: 'appointment-456',
      status: RatingStatus.APPROVED,
      updatedAt: new Date(),
      rating: 4,
      comment: 'Updated comment',
    };

    it('should update a rating successfully', async () => {
      ratingService.updateRating.mockResolvedValue(mockUpdatedRating);

      const result = await controller.updateRating(ratingId, updateRatingDto, mockRequest as any);

      expect(ratingService.updateRating).toHaveBeenCalledWith(ratingId, updateRatingDto, mockRequest.user.userId);
      expect(result).toEqual(mockUpdatedRating);
    });
  });

  describe('deleteRating', () => {
    const ratingId = 'rating-123';

    it('should delete rating successfully', async () => {
      ratingService.deleteRating.mockResolvedValue(undefined);

      await controller.deleteRating(ratingId, mockRequest as any);

      expect(ratingService.deleteRating).toHaveBeenCalledWith(ratingId, mockRequest.user.userId);
    });
  });

  describe('getRatingById', () => {
    const ratingId = 'rating-123';

    const mockRating = {
      id: ratingId,
      barberId: 'barber-123',
      clientId: 'client-456',
      serviceId: 'service-123',
      appointmentId: 'appointment-123',
      rating: 5,
      comment: 'Great service!',
      status: RatingStatus.APPROVED,
    };

    it('should return rating by id', async () => {
      ratingService.getRatingById.mockResolvedValue(mockRating);

      const result = await controller.getRatingById(ratingId);

      expect(ratingService.getRatingById).toHaveBeenCalledWith(ratingId);
      expect(result).toEqual(mockRating);
    });
  });

  describe('getRatingsByBarber', () => {
    it('should return ratings for a barber', async () => {
      const barberId = 'barber-123';
      const mockRatings = [
        { id: 'rating-1', barberId, clientId: 'client-1', serviceId: 'service-1', appointmentId: 'appointment-1', rating: 5, status: RatingStatus.APPROVED } as unknown as Rating,
        { id: 'rating-2', barberId, clientId: 'client-2', serviceId: 'service-2', appointmentId: 'appointment-2', rating: 4, status: RatingStatus.APPROVED } as unknown as Rating,
      ];

      ratingService.getRatingsByBarber.mockResolvedValue(mockRatings);

      const result = await controller.getRatingsByBarber(barberId);

      expect(ratingService.getRatingsByBarber).toHaveBeenCalledWith(barberId, undefined);
      expect(result).toEqual(mockRatings);
    });

    it('should return ratings with status filter', async () => {
      const barberId = 'barber-123';
      const status = RatingStatus.APPROVED;
      const mockRatings = [{ id: 'rating-1', barberId, clientId: 'client-1', serviceId: 'service-1', appointmentId: 'appointment-1', rating: 5, status: RatingStatus.APPROVED } as unknown as Rating];

      ratingService.getRatingsByBarber.mockResolvedValue(mockRatings);

      const result = await controller.getRatingsByBarber(barberId, status);

      expect(ratingService.getRatingsByBarber).toHaveBeenCalledWith(barberId, status);
      expect(result).toEqual(mockRatings);
    });
  });

  

  describe('getRatingByAppointment', () => {
    const appointmentId = 'appointment-123';

    const mockRating = {
      id: 'rating-123',
      appointmentId,
      barberId: 'barber-123',
      clientId: 'client-123',
      serviceId: 'service-123',
      rating: 5,
      comment: 'Great service!',
      status: RatingStatus.APPROVED,
    };

    it('should return rating by appointment id', async () => {
      ratingService.getRatingByAppointment.mockResolvedValue(mockRating);

      const result = await controller.getRatingByAppointment(appointmentId);

      expect(ratingService.getRatingByAppointment).toHaveBeenCalledWith(appointmentId);
      expect(result).toEqual(mockRating);
    });

    it('should return null if no rating found', async () => {
      ratingService.getRatingByAppointment.mockResolvedValue(null);

      const result = await controller.getRatingByAppointment(appointmentId);

      expect(ratingService.getRatingByAppointment).toHaveBeenCalledWith(appointmentId);
      expect(result).toBeNull();
    });
  });

  describe('getBarberRatingStats', () => {
    const barberId = 'barber-123';

    const mockStats = {
      averageRating: 4.5,
      totalRatings: 10,
      fiveStarRatings: 5,
      fourStarRatings: 3,
    };

    it('should return rating stats for barber', async () => {
      ratingService.getBarberRatingStats.mockResolvedValue(mockStats);

      const result = await controller.getBarberRatingStats(barberId);

      expect(ratingService.getBarberRatingStats).toHaveBeenCalledWith(barberId);
      expect(result).toEqual(mockStats);
    });
  });

  describe('getClientRatingHistory', () => {
    const clientId = 'client-456';

    const mockHistory = {
      totalRatings: 5,
      averageRatingGiven: 4.2,
      ratings: [
        { id: 'rating-1', rating: 5 },
        { id: 'rating-2', rating: 4 },
      ],
    };

    it('should return rating history for client', async () => {
      ratingService.getClientRatingHistory.mockResolvedValue(mockHistory);

      const result = await controller.getClientRatingHistory(clientId);

      expect(ratingService.getClientRatingHistory).toHaveBeenCalledWith(clientId);
      expect(result).toEqual(mockHistory);
    });
  });

  describe('getFeaturedReviews', () => {
    const barberId = 'barber-123';

    const mockReviews = [
      { id: 'rating-1', rating: 5, comment: 'Excellent!' },
      { id: 'rating-2', rating: 5, comment: 'Great service!' },
    ];

    it('should return featured reviews for barber', async () => {
      ratingService.getFeaturedReviews.mockResolvedValue(mockReviews);

      const result = await controller.getFeaturedReviews(barberId);

      expect(ratingService.getFeaturedReviews).toHaveBeenCalledWith(barberId, 3);
      expect(result).toEqual(mockReviews);
    });

    it('should return featured reviews with custom limit', async () => {
      const limit = 5;
      ratingService.getFeaturedReviews.mockResolvedValue(mockReviews);

      const result = await controller.getFeaturedReviews(barberId, limit);

      expect(ratingService.getFeaturedReviews).toHaveBeenCalledWith(barberId, limit);
      expect(result).toEqual(mockReviews);
    });
  });

  

  describe('moderateRating', () => {
    const ratingId = 'rating-123';
    const moderateRatingDto: ModerateRatingDto = {
      status: RatingStatus.REJECTED,
      rejectionReason: 'Inappropriate content',
    };

    const mockModeratedRating = {
      id: ratingId,
      barberId: 'barber-123',
      clientId: 'client-123',
      serviceId: 'service-123',
      appointmentId: 'appointment-123',
      rating: 3,
      comment: 'Average service',
      status: RatingStatus.REJECTED,
      rejectionReason: 'Inappropriate content',
      moderatedBy: 'moderator-123',
      moderatedAt: new Date(),
    };

    it('should moderate rating successfully', async () => {
      ratingService.moderateRating.mockResolvedValue(mockModeratedRating);

      const result = await controller.moderateRating(ratingId, moderateRatingDto, mockRequest as any);

      expect(ratingService.moderateRating).toHaveBeenCalledWith(ratingId, moderateRatingDto, mockRequest.user.userId);
      expect(result).toEqual(mockModeratedRating);
    });
  });

  describe('markAsHelpful', () => {
    const ratingId = 'rating-123';

    const mockUpdatedRating = {
      id: ratingId,
      barberId: 'barber-123',
      clientId: 'client-123',
      serviceId: 'service-123',
      appointmentId: 'appointment-123',
      rating: 5,
      comment: 'Great service!',
      helpfulCount: 6,
    };

    it('should mark rating as helpful', async () => {
      ratingService.markAsHelpful.mockResolvedValue(mockUpdatedRating);

      const result = await controller.markAsHelpful(ratingId, mockRequest as any);

      expect(ratingService.markAsHelpful).toHaveBeenCalledWith(ratingId, mockRequest.user.userId);
      expect(result).toEqual(mockUpdatedRating);
    });
  });

  describe('flagRating', () => {
    const ratingId = 'rating-123';

    const mockFlaggedRating = {
      id: ratingId,
      barberId: 'barber-123',
      clientId: 'client-123',
      serviceId: 'service-123',
      appointmentId: 'appointment-123',
      rating: 2,
      comment: 'Poor service',
      reportCount: 3,
    };

    it('should flag rating successfully', async () => {
      ratingService.flagRating.mockResolvedValue(mockFlaggedRating);

      const result = await controller.flagRating(ratingId, mockRequest as any);

      expect(ratingService.flagRating).toHaveBeenCalledWith(ratingId, mockRequest.user.userId);
      expect(result).toEqual(mockFlaggedRating);
    });
  });
});
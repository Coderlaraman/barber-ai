import { Test, TestingModule } from '@nestjs/testing';
import { RankingController } from '../src/modules/ranking/ranking.controller';
import { RankingService } from '../src/modules/ranking/ranking.service';
import { CreateRankingDto, UpdateRankingDto } from '../src/modules/ranking/dto/ranking.dto';
import { describe, it, expect, beforeEach, jest } from '@jest/globals';

describe('RankingController', () => {
  let controller: RankingController;
  let rankingService: any;

  const mockRankingService = {
    createRanking: jest.fn(),
    updateRanking: jest.fn(),
    getRankingByBarberAndPeriod: jest.fn(),
    getTopRankings: jest.fn(),
    getRankingMetrics: jest.fn(),
    recalculateAllRankings: jest.fn(),
  };

  const mockRequest = {
    user: {
      userId: 'admin-123',
      email: 'admin@example.com',
      role: 'admin',
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RankingController],
      providers: [
        {
          provide: RankingService,
          useValue: mockRankingService,
        },
      ],
    }).compile();

    controller = module.get<RankingController>(RankingController);
    rankingService = mockRankingService;

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createRanking', () => {
    const createRankingDto: CreateRankingDto = {
      barberId: 'barber-123',
      period: 'monthly',
      periodStart: new Date('2024-01-01'),
      periodEnd: new Date('2024-01-31'),
    };

    const mockCreatedRanking = {
      id: 'ranking-123',
      ...createRankingDto,
      averageRating: 0,
      totalRatings: 0,
      rankingScore: 0,
      position: 0,
      createdAt: new Date(),
    };

    it('should create ranking successfully', async () => {
      rankingService.createRanking.mockResolvedValue(mockCreatedRanking);

      const result = await controller.createRanking(createRankingDto);

      expect(rankingService.createRanking).toHaveBeenCalledWith(createRankingDto);
      expect(result).toEqual(mockCreatedRanking);
    });
  });

  describe('updateRanking', () => {
    const barberId = 'barber-123';
    const period = 'monthly';
    const updateRankingDto: UpdateRankingDto = {
      averageRating: 4.5,
      totalRatings: 10,
      rankingScore: 85,
      position: 1,
    };

    const mockUpdatedRanking = {
      id: 'ranking-123',
      barberId,
      period,
      ...updateRankingDto,
      updatedAt: new Date(),
    };

    it('should update ranking successfully', async () => {
      rankingService.updateRanking.mockResolvedValue(mockUpdatedRanking);

      const result = await controller.updateRanking(barberId, period, updateRankingDto);

      expect(rankingService.updateRanking).toHaveBeenCalledWith(barberId, period, updateRankingDto);
      expect(result).toEqual(mockUpdatedRanking);
    });
  });

  describe('getBarberRanking', () => {
    const barberId = 'barber-123';
    const period = 'monthly';

    const mockRanking = {
      id: 'ranking-123',
      barberId,
      period,
      averageRating: 4.5,
      totalRatings: 10,
      rankingScore: 85,
      position: 1,
    };

    it('should return ranking for barber and period', async () => {
      rankingService.getRankingByBarberAndPeriod.mockResolvedValue(mockRanking);

      const result = await controller.getBarberRanking(barberId, period);

      expect(rankingService.getRankingByBarberAndPeriod).toHaveBeenCalledWith(barberId, period);
      expect(result).toEqual(mockRanking);
    });
  });

  describe('getTopRankings', () => {
    const period = 'monthly';
    const limit = 10;

    const mockTopRankings = [
      {
        id: 'ranking-1',
        barberId: 'barber-123',
        position: 1,
        averageRating: 4.8,
        rankingScore: 95,
      },
      {
        id: 'ranking-2',
        barberId: 'barber-456',
        position: 2,
        averageRating: 4.6,
        rankingScore: 92,
      },
    ];

    it('should return top ranked barbers', async () => {
      rankingService.getTopRankings.mockResolvedValue(mockTopRankings);

      const result = await controller.getTopRankings(period, limit);

      expect(rankingService.getTopRankings).toHaveBeenCalledWith(period, limit);
      expect(result).toEqual(mockTopRankings);
    });

    it('should return top ranked barbers with default limit', async () => {
      rankingService.getTopRankings.mockResolvedValue(mockTopRankings);

      const result = await controller.getTopRankings(period);

      expect(rankingService.getTopRankings).toHaveBeenCalledWith(period, 10);
      expect(result).toEqual(mockTopRankings);
    });
  });

  describe('getRankingMetrics', () => {
    const barberId = 'barber-123';
    const period = 'monthly';

    const mockMetrics = {
      totalBarbers: 50,
      averageRating: 4.2,
      topScore: 95,
      lowestScore: 60,
    };

    it('should return ranking metrics', async () => {
      rankingService.getRankingMetrics.mockResolvedValue(mockMetrics);

      const result = await controller.getRankingMetrics(barberId, period);

      expect(rankingService.getRankingMetrics).toHaveBeenCalledWith(barberId, period);
      expect(result).toEqual(mockMetrics);
    });
  });

  describe('recalculateRankings', () => {
    it('should trigger ranking recalculation', async () => {
      const mockResult = { status: 'success', message: 'Rankings recalculados exitosamente para el período monthly', period: 'monthly' };
      rankingService.recalculateAllRankings.mockResolvedValue(undefined);

      const result = await controller.recalculateRankings('monthly');

      expect(rankingService.recalculateAllRankings).toHaveBeenCalledWith('monthly');
      expect(result).toEqual(mockResult);
    });
  });

  describe('health', () => {
    it('should return health status', () => {
      const result = controller.health();

      expect(result).toEqual({
        status: 'ok',
        service: 'ranking',
        timestamp: expect.any(String),
      });
    });
  });
});
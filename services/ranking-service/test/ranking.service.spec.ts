import { Test, TestingModule } from '@nestjs/testing';
import { RankingService } from '../src/modules/ranking/ranking.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Ranking } from '../src/modules/ranking/entities/ranking.entity';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CreateRankingDto, UpdateRankingDto } from '../src/modules/ranking/dto/ranking.dto';

describe('RankingService', () => {
  let service: RankingService;
  let rankingRepository: any;
  let eventEmitter: any;

  const mockRankingRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockEventEmitter = {
    emit: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RankingService,
        {
          provide: getRepositoryToken(Ranking),
          useValue: mockRankingRepository,
        },
        {
          provide: EventEmitter2,
          useValue: mockEventEmitter,
        },
      ],
    }).compile();

    service = module.get<RankingService>(RankingService);
    rankingRepository = mockRankingRepository;
    eventEmitter = mockEventEmitter;

    jest.clearAllMocks();
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
      positiveRatings: 0,
      negativeRatings: 0,
      rankingScore: 0,
      position: 0,
      totalRevenue: 0,
      completedAppointments: 0,
      metrics: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should create ranking successfully', async () => {
      rankingRepository.findOne.mockResolvedValue(null);
      rankingRepository.create.mockReturnValue(mockCreatedRanking);
      rankingRepository.save.mockResolvedValue(mockCreatedRanking);

      const result = await service.createRanking(createRankingDto);

      expect(rankingRepository.findOne).toHaveBeenCalledWith({
        where: { barberId: createRankingDto.barberId, period: createRankingDto.period }
      });
      expect(rankingRepository.create).toHaveBeenCalledWith({
        barberId: createRankingDto.barberId,
        period: createRankingDto.period,
        periodStart: createRankingDto.periodStart,
        periodEnd: createRankingDto.periodEnd,
        averageRating: 0,
        totalRatings: 0,
        positiveRatings: 0,
        negativeRatings: 0,
        rankingScore: 0,
        position: 0,
        totalRevenue: 0,
        completedAppointments: 0,
      });
      expect(rankingRepository.save).toHaveBeenCalledWith(mockCreatedRanking);
      expect(result).toEqual({
        id: mockCreatedRanking.id,
        barberId: mockCreatedRanking.barberId,
        period: mockCreatedRanking.period,
        periodStart: mockCreatedRanking.periodStart,
        periodEnd: mockCreatedRanking.periodEnd,
        averageRating: mockCreatedRanking.averageRating,
        totalRatings: mockCreatedRanking.totalRatings,
        positiveRatings: mockCreatedRanking.positiveRatings,
        negativeRatings: mockCreatedRanking.negativeRatings,
        rankingScore: mockCreatedRanking.rankingScore,
        position: mockCreatedRanking.position,
        totalRevenue: mockCreatedRanking.totalRevenue,
        completedAppointments: mockCreatedRanking.completedAppointments,
        metrics: mockCreatedRanking.metrics || {},
        createdAt: mockCreatedRanking.createdAt,
        updatedAt: mockCreatedRanking.updatedAt,
      });
    });

    it('should throw ConflictException if ranking already exists', async () => {
      const existingRanking = { id: 'existing-ranking' };
      rankingRepository.findOne.mockResolvedValue(existingRanking);

      await expect(service.createRanking(createRankingDto))
        .rejects.toThrow(ConflictException);

      expect(rankingRepository.create).not.toHaveBeenCalled();
      expect(rankingRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('updateRanking', () => {
    const barberId = 'barber-123';
    const period = 'monthly';
    const updateRankingDto: UpdateRankingDto = {
      averageRating: 4.5,
      totalRatings: 10,
      positiveRatings: 8,
      negativeRatings: 2,
      rankingScore: 85,
      position: 1,
    };

    const existingRanking = {
      id: 'ranking-123',
      barberId,
      period,
      averageRating: 0,
      totalRatings: 0,
      positiveRatings: 0,
      negativeRatings: 0,
      rankingScore: 0,
      position: 0,
      totalRevenue: 0,
      completedAppointments: 0,
      metrics: {},
      periodStart: new Date('2024-01-01'),
      periodEnd: new Date('2024-01-31'),
      createdAt: new Date(),
      updatedAt: new Date(),
      calculateRankingScore: jest.fn().mockReturnValue(85),
    };

    it('should update ranking successfully', async () => {
      rankingRepository.findOne.mockResolvedValue(existingRanking);
      rankingRepository.save.mockResolvedValue({ ...existingRanking, ...updateRankingDto });

      const result = await service.updateRanking(barberId, period, updateRankingDto);

      expect(rankingRepository.findOne).toHaveBeenCalledWith({ where: { barberId, period } });
      expect(rankingRepository.save).toHaveBeenCalledWith({
        ...existingRanking,
        ...updateRankingDto,
      });
      expect(result).toEqual({
        id: existingRanking.id,
        barberId: existingRanking.barberId,
        period: existingRanking.period,
        ...updateRankingDto,
        metrics: existingRanking.metrics,
        totalRevenue: existingRanking.totalRevenue,
        completedAppointments: existingRanking.completedAppointments,
        periodStart: existingRanking.periodStart,
        periodEnd: existingRanking.periodEnd,
        createdAt: existingRanking.createdAt,
        updatedAt: expect.any(Date),
      });
    });

    it('should throw NotFoundException if ranking not found', async () => {
      rankingRepository.findOne.mockResolvedValue(null);

      await expect(service.updateRanking(barberId, period, updateRankingDto))
        .rejects.toThrow(NotFoundException);

      expect(rankingRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('getRankingByBarberAndPeriod', () => {
    const barberId = 'barber-123';
    const period = 'monthly';

    const mockRanking = {
      id: 'ranking-123',
      barberId,
      period,
      averageRating: 4.5,
      totalRatings: 10,
      positiveRatings: 8,
      negativeRatings: 2,
      rankingScore: 85,
      position: 1,
      totalRevenue: 1000,
      completedAppointments: 15,
      metrics: {},
      periodStart: new Date('2024-01-01'),
      periodEnd: new Date('2024-01-31'),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should return ranking for barber and period', async () => {
      rankingRepository.findOne.mockResolvedValue(mockRanking);

      const result = await service.getRankingByBarberAndPeriod(barberId, period);

      expect(rankingRepository.findOne).toHaveBeenCalledWith({
        where: { barberId, period }
      });
      expect(result).toEqual({
        id: mockRanking.id,
        barberId: mockRanking.barberId,
        period: mockRanking.period,
        averageRating: mockRanking.averageRating,
        totalRatings: mockRanking.totalRatings,
        positiveRatings: mockRanking.positiveRatings,
        negativeRatings: mockRanking.negativeRatings,
        rankingScore: mockRanking.rankingScore,
        position: mockRanking.position,
        metrics: mockRanking.metrics,
        totalRevenue: mockRanking.totalRevenue,
        completedAppointments: mockRanking.completedAppointments,
        periodStart: mockRanking.periodStart,
        periodEnd: mockRanking.periodEnd,
        createdAt: mockRanking.createdAt,
        updatedAt: mockRanking.updatedAt,
      });
    });

    it('should throw NotFoundException if ranking not found', async () => {
      rankingRepository.findOne.mockResolvedValue(null);

      await expect(service.getRankingByBarberAndPeriod(barberId, period))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('getTopRankings', () => {
    const period = 'monthly';
    const limit = 10;

    const mockRankings = [
      {
        id: 'ranking-1',
        barberId: 'barber-123',
        period: 'monthly',
        position: 1,
        averageRating: 4.8,
        totalRatings: 25,
        positiveRatings: 20,
        negativeRatings: 5,
        rankingScore: 95,
        totalRevenue: 1500,
        completedAppointments: 30,
        metrics: {},
        periodStart: new Date('2024-01-01'),
        periodEnd: new Date('2024-01-31'),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'ranking-2',
        barberId: 'barber-456',
        period: 'monthly',
        position: 2,
        averageRating: 4.6,
        totalRatings: 20,
        positiveRatings: 16,
        negativeRatings: 4,
        rankingScore: 92,
        totalRevenue: 1200,
        completedAppointments: 25,
        metrics: {},
        periodStart: new Date('2024-01-01'),
        periodEnd: new Date('2024-01-31'),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    it('should return top ranked barbers', async () => {
      rankingRepository.find.mockResolvedValue(mockRankings);

      const result = await service.getTopRankings(period, limit);

      expect(rankingRepository.find).toHaveBeenCalledWith({
        where: { period },
        order: { rankingScore: 'DESC' },
        take: limit,
      });
      expect(result).toEqual(mockRankings.map(ranking => ({
        id: ranking.id,
        barberId: ranking.barberId,
        period: ranking.period,
        averageRating: ranking.averageRating,
        totalRatings: ranking.totalRatings,
        positiveRatings: ranking.positiveRatings,
        negativeRatings: ranking.negativeRatings,
        rankingScore: ranking.rankingScore,
        position: ranking.position,
        metrics: ranking.metrics,
        totalRevenue: ranking.totalRevenue,
        completedAppointments: ranking.completedAppointments,
        periodStart: ranking.periodStart,
        periodEnd: ranking.periodEnd,
        createdAt: ranking.createdAt,
        updatedAt: ranking.updatedAt,
      })));
    });
  });

  describe('processRatingEvent', () => {
    const ratingData = {
      ratingId: 'rating-123',
      barberId: 'barber-123',
      rating: 5,
      aspects: { punctuality: 5, quality: 5 },
      timestamp: new Date(),
    };

    const mockRanking = {
      id: 'ranking-123',
      barberId: 'barber-123',
      period: 'monthly',
      averageRating: 4.0,
      totalRatings: 5,
      positiveRatings: 4,
      negativeRatings: 1,
      rankingScore: 80,
      save: jest.fn(),
      updateMetrics: jest.fn(),
      updateBusinessMetrics: jest.fn(),
    };

    it('should process rating event for all periods', async () => {
      rankingRepository.findOne.mockResolvedValue(mockRanking);
      rankingRepository.save.mockResolvedValue(mockRanking);

      await service.processRatingEvent(ratingData);

      expect(rankingRepository.findOne).toHaveBeenCalledTimes(5); // 5 periods
      expect(eventEmitter.emit).toHaveBeenCalledWith('ranking.updated', {
        barberId: ratingData.barberId,
        rating: ratingData.rating,
        aspects: ratingData.aspects,
        timestamp: ratingData.timestamp,
      });
    });

    it('should create new ranking if not exists', async () => {
      rankingRepository.findOne.mockResolvedValue(null);
      rankingRepository.create.mockReturnValue(mockRanking);
      rankingRepository.save.mockResolvedValue(mockRanking);

      await service.processRatingEvent(ratingData);

      expect(rankingRepository.create).toHaveBeenCalled();
      expect(rankingRepository.save).toHaveBeenCalled();
    });
  });

  describe('processBusinessEvent', () => {
    const businessData = {
      barberId: 'barber-123',
      revenue: 100,
      completedAppointments: 2,
      timestamp: new Date(),
    };

    const mockRanking = {
      id: 'ranking-123',
      barberId: 'barber-123',
      period: 'monthly',
      averageRating: 4.5,
      totalRatings: 10,
      positiveRatings: 8,
      negativeRatings: 2,
      rankingScore: 85,
      position: 1,
      totalRevenue: 500,
      completedAppointments: 10,
      metrics: {},
      periodStart: new Date('2024-01-01'),
      periodEnd: new Date('2024-01-31'),
      createdAt: new Date(),
      updatedAt: new Date(),
      updateBusinessMetrics: jest.fn(function(this: any, revenue: number, completedAppointments: number) {
        this.totalRevenue += revenue;
        this.completedAppointments += completedAppointments;
      }),
      save: jest.fn(),
    };

    it('should process business event for all periods', async () => {
      // Create separate mock rankings for each period to track individual updates
      const mockRankingsByPeriod = new Map<string, any>();
      
      rankingRepository.findOne.mockImplementation(({ where }: { where: any }) => {
        const period = where.period;
        if (!mockRankingsByPeriod.has(period)) {
          // Create a copy of the mock ranking for this period
          const periodRanking = { ...mockRanking, period };
          periodRanking.updateBusinessMetrics = jest.fn(function(this: any, revenue: number, completedAppointments: number) {
            this.totalRevenue += revenue;
            this.completedAppointments += completedAppointments;
          });
          mockRankingsByPeriod.set(period, periodRanking);
        }
        return mockRankingsByPeriod.get(period);
      });
      
      rankingRepository.save.mockImplementation((ranking: any) => Promise.resolve(ranking));

      await service.processBusinessEvent(businessData);

      expect(rankingRepository.findOne).toHaveBeenCalledTimes(5); // 5 periods
      
      // Verify that each period's ranking was updated correctly
      const monthlyRanking = mockRankingsByPeriod.get('monthly');
      expect(monthlyRanking.totalRevenue).toBe(600); // 500 + 100
      expect(monthlyRanking.completedAppointments).toBe(12); // 10 + 2
    });
  });

  describe('recalculateAllRankings', () => {
    const period = 'monthly';

    it('should recalculate all rankings for period', async () => {
      const mockRankings = [
        { id: 'ranking-1', barberId: 'barber-123', rankingScore: 80 },
        { id: 'ranking-2', barberId: 'barber-456', rankingScore: 90 },
      ];

      rankingRepository.find.mockResolvedValue(mockRankings);
      rankingRepository.save.mockResolvedValue({});

      await service.recalculateAllRankings(period);

      expect(rankingRepository.find).toHaveBeenCalledWith({
        where: { period },
        order: { rankingScore: 'DESC' },
      });
      expect(rankingRepository.save).toHaveBeenCalledWith(mockRankings);
    });
  });

  describe('getRankingMetrics', () => {
    const barberId = 'barber-123';
    const period = 'monthly';

    it('should return ranking metrics', async () => {
      const mockRanking = {
        id: 'ranking-123',
        barberId,
        period,
        averageRating: 4.5,
        totalRatings: 10,
        positiveRatings: 8,
        negativeRatings: 2,
        rankingScore: 85,
        position: 1,
        totalRevenue: 1000,
        completedAppointments: 15,
        metrics: { serviceQuality: 4.5 },
        periodStart: new Date('2024-01-01'),
        periodEnd: new Date('2024-01-31'),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const expectedMetrics = {
        barberId,
        period,
        averageRating: 4.5,
        totalRatings: 10,
        positiveRatio: 80, // (8/10) * 100
        negativeRatio: 20, // (2/10) * 100
        rankingPosition: 1,
        totalRevenue: 1000,
        completedAppointments: 15,
        metrics: { serviceQuality: 4.5 },
      };

      jest.spyOn(service, 'getRankingByBarberAndPeriod').mockResolvedValue(mockRanking);

      const result = await service.getRankingMetrics(barberId, period);

      expect(service.getRankingByBarberAndPeriod).toHaveBeenCalledWith(barberId, period);
      expect(result).toEqual(expectedMetrics);
    });
  });
});
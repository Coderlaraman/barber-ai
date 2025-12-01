import { Test, TestingModule } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { PortfolioService } from '../src/modules/portfolio/portfolio.service'
import { PortfolioItem } from '../src/domain/entities/portfolio_item.entity'
import { CreatePortfolioItemDto } from '../src/modules/portfolio/dto/create-portfolio-item.dto'
import { UpdatePortfolioItemDto } from '../src/modules/portfolio/dto/update-portfolio-item.dto'
import { NotFoundException } from '@nestjs/common'

describe('PortfolioService', () => {
  let service: PortfolioService
  let portfolioRepository: Repository<PortfolioItem>

  const mockPortfolioRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    createQueryBuilder: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PortfolioService,
        {
          provide: getRepositoryToken(PortfolioItem),
          useValue: mockPortfolioRepository,
        },
      ],
    }).compile()

    service = module.get<PortfolioService>(PortfolioService)
    portfolioRepository = module.get<Repository<PortfolioItem>>(getRepositoryToken(PortfolioItem))
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('createPortfolioItem', () => {
    const createDto: CreatePortfolioItemDto = {
      barberId: 'barber-123',
      title: 'Fade Moderno',
      description: 'Corte de cabello estilo fade moderno',
      imageUrl: 'https://example.com/image.jpg',
      tags: ['fade', 'moderno', 'hombre'],
    }

    const createdItem = {
      id: 'portfolio-123',
      ...createDto,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    it('should create a portfolio item successfully', async () => {
      mockPortfolioRepository.create.mockReturnValue(createdItem)
      mockPortfolioRepository.save.mockResolvedValue(createdItem)

      const result = await service.createPortfolioItem(createDto)

      expect(mockPortfolioRepository.create).toHaveBeenCalledWith(createDto)
      expect(mockPortfolioRepository.save).toHaveBeenCalledWith(createdItem)
      expect(result).toEqual(createdItem)
    })
  })

  describe('getPortfolioByBarber', () => {
    it('should return portfolio items for a specific barber', async () => {
      const barberId = 'barber-123'
      const portfolioItems = [
        { id: 'item-1', barberId, title: 'Fade Moderno' },
        { id: 'item-2', barberId, title: 'Barba Estilizada' },
      ]

      mockPortfolioRepository.find.mockResolvedValue(portfolioItems)

      const result = await service.getPortfolioByBarber(barberId)

      expect(mockPortfolioRepository.find).toHaveBeenCalledWith({
        where: { barberId },
        order: { createdAt: 'DESC' },
      })
      expect(result).toEqual(portfolioItems)
    })

    it('should return empty array when no portfolio items exist', async () => {
      const barberId = 'barber-123'
      mockPortfolioRepository.find.mockResolvedValue([])

      const result = await service.getPortfolioByBarber(barberId)

      expect(result).toEqual([])
    })
  })

  describe('getPortfolioItemById', () => {
    it('should return a portfolio item by ID', async () => {
      const itemId = 'portfolio-123'
      const portfolioItem = {
        id: itemId,
        barberId: 'barber-123',
        title: 'Fade Moderno',
      }

      mockPortfolioRepository.findOne.mockResolvedValue(portfolioItem)

      const result = await service.getPortfolioItemById(itemId)

      expect(mockPortfolioRepository.findOne).toHaveBeenCalledWith({
        where: { id: itemId },
      })
      expect(result).toEqual(portfolioItem)
    })

    it('should throw NotFoundException when portfolio item not found', async () => {
      const itemId = 'non-existent'
      mockPortfolioRepository.findOne.mockResolvedValue(undefined)

      await expect(service.getPortfolioItemById(itemId)).rejects.toThrow(
        new NotFoundException('Portfolio item not found')
      )
    })
  })

  describe('updatePortfolioItem', () => {
    const updateDto: UpdatePortfolioItemDto = {
      title: 'Fade Moderno Actualizado',
      description: 'Nueva descripción',
      tags: ['fade', 'actualizado'],
    }

    it('should update a portfolio item successfully', async () => {
      const itemId = 'portfolio-123'
      const existingItem = {
        id: itemId,
        barberId: 'barber-123',
        title: 'Fade Moderno',
        description: 'Descripción original',
      }

      mockPortfolioRepository.findOne.mockResolvedValue(existingItem)
      mockPortfolioRepository.update.mockResolvedValue({ affected: 1 })

      await service.updatePortfolioItem(itemId, updateDto)

      expect(mockPortfolioRepository.findOne).toHaveBeenCalledWith({
        where: { id: itemId },
      })
      expect(mockPortfolioRepository.update).toHaveBeenCalledWith(
        itemId,
        updateDto
      )
    })

    it('should throw NotFoundException when portfolio item not found', async () => {
      const itemId = 'non-existent'
      mockPortfolioRepository.findOne.mockResolvedValue(undefined)

      await expect(service.updatePortfolioItem(itemId, updateDto)).rejects.toThrow(
        new NotFoundException('Portfolio item not found')
      )

      expect(mockPortfolioRepository.update).not.toHaveBeenCalled()
    })
  })

  describe('deletePortfolioItem', () => {
    it('should delete a portfolio item successfully', async () => {
      const itemId = 'portfolio-123'
      const existingItem = {
        id: itemId,
        barberId: 'barber-123',
        title: 'Fade Moderno',
      }

      mockPortfolioRepository.findOne.mockResolvedValue(existingItem)
      mockPortfolioRepository.delete.mockResolvedValue({ affected: 1 })

      await service.deletePortfolioItem(itemId)

      expect(mockPortfolioRepository.findOne).toHaveBeenCalledWith({
        where: { id: itemId },
      })
      expect(mockPortfolioRepository.delete).toHaveBeenCalledWith(itemId)
    })

    it('should throw NotFoundException when portfolio item not found', async () => {
      const itemId = 'non-existent'
      mockPortfolioRepository.findOne.mockResolvedValue(undefined)

      await expect(service.deletePortfolioItem(itemId)).rejects.toThrow(
        new NotFoundException('Portfolio item not found')
      )

      expect(mockPortfolioRepository.delete).not.toHaveBeenCalled()
    })
  })

  describe('searchPortfolio', () => {
    it('should search portfolio items by query', async () => {
      const query = 'fade'
      const searchResults = [
        { id: 'item-1', title: 'Fade Moderno', tags: ['fade', 'moderno'] },
        { id: 'item-2', title: 'Taper Fade', tags: ['taper', 'fade'] },
      ]

      mockPortfolioRepository.createQueryBuilder.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        orWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(searchResults),
      })

      const result = await service.searchPortfolio(query)

      expect(mockPortfolioRepository.createQueryBuilder).toHaveBeenCalled()
      expect(result).toEqual(searchResults)
    })

    it('should return empty array when no search results', async () => {
      const query = 'nonexistent'

      mockPortfolioRepository.createQueryBuilder.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        orWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      })

      const result = await service.searchPortfolio(query)

      expect(result).toEqual([])
    })
  })

  describe('getFeaturedPortfolio', () => {
    it('should return featured portfolio items', async () => {
      const limit = 5
      const featuredItems = [
        { id: 'item-1', title: 'Mejor Trabajo 1', isFeatured: true },
        { id: 'item-2', title: 'Mejor Trabajo 2', isFeatured: true },
      ]

      mockPortfolioRepository.find.mockResolvedValue(featuredItems)

      const result = await service.getFeaturedPortfolio(limit)

      expect(mockPortfolioRepository.find).toHaveBeenCalledWith({
        where: { isFeatured: true },
        order: { createdAt: 'DESC' },
        take: limit,
      })
      expect(result).toEqual(featuredItems)
    })
  })
})
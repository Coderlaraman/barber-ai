import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { PortfolioItem } from '../../domain/entities/portfolio_item.entity'
import { CreatePortfolioItemDto } from './dto/create-portfolio-item.dto'
import { UpdatePortfolioItemDto } from './dto/update-portfolio-item.dto'

@Injectable()
export class PortfolioService {
  constructor(
    @InjectRepository(PortfolioItem)
    private readonly portfolioRepository: Repository<PortfolioItem>
  ) {}

  async createPortfolioItem(
    createDto: CreatePortfolioItemDto
  ): Promise<PortfolioItem> {
    const portfolioItem = this.portfolioRepository.create(createDto)
    return this.portfolioRepository.save(portfolioItem)
  }

  async getPortfolioByBarber(barberId: string): Promise<PortfolioItem[]> {
    return this.portfolioRepository.find({
      where: { barberId },
      order: { createdAt: 'DESC' },
    })
  }

  async getPortfolioItemById(id: string): Promise<PortfolioItem> {
    const portfolioItem = await this.portfolioRepository.findOne({
      where: { id },
    })

    if (!portfolioItem) {
      throw new NotFoundException('Portfolio item not found')
    }

    return portfolioItem
  }

  async updatePortfolioItem(
    id: string,
    updateDto: UpdatePortfolioItemDto
  ): Promise<void> {
    const portfolioItem = await this.getPortfolioItemById(id)
    
    if (!portfolioItem) {
      throw new NotFoundException('Portfolio item not found')
    }

    await this.portfolioRepository.update(id, updateDto)
  }

  async deletePortfolioItem(id: string): Promise<void> {
    const portfolioItem = await this.getPortfolioItemById(id)
    
    if (!portfolioItem) {
      throw new NotFoundException('Portfolio item not found')
    }

    await this.portfolioRepository.delete(id)
  }

  async searchPortfolio(query: string): Promise<PortfolioItem[]> {
    return this.portfolioRepository
      .createQueryBuilder('portfolio_item')
      .where('portfolio_item.title LIKE :query', { query: `%${query}%` })
      .orWhere('portfolio_item.description LIKE :query', { query: `%${query}%` })
      .orWhere('portfolio_item.tags ::text LIKE :query', { query: `%${query}%` })
      .orderBy('portfolio_item.createdAt', 'DESC')
      .limit(20)
      .getMany()
  }

  async getFeaturedPortfolio(limit: number = 10): Promise<PortfolioItem[]> {
    return this.portfolioRepository.find({
      where: { isFeatured: true },
      order: { createdAt: 'DESC' },
      take: limit,
    })
  }
}
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepository } from '../../../common/repositories/base.repository';
import { Service, ServiceCategory } from '../../services/entities/service.entity';

@Injectable()
export class ServiceRepository extends BaseRepository<Service> {
  constructor(
    @InjectRepository(Service)
    private readonly serviceRepository: Repository<Service>,
  ) {
    super(serviceRepository);
  }

  async findByCategory(category: ServiceCategory): Promise<Service[]> {
    return this.serviceRepository.find({
      where: { category, isActive: true },
      order: { name: 'ASC' },
    });
  }

  async findByDurationRange(minDuration: number, maxDuration: number): Promise<Service[]> {
    return this.serviceRepository.find({
      where: {
        durationMinutes: {
          $gte: minDuration,
          $lte: maxDuration,
        } as any,
        isActive: true,
      },
      order: { durationMinutes: 'ASC' },
    });
  }

  async findByPriceRange(minPrice: number, maxPrice: number): Promise<Service[]> {
    return this.serviceRepository.find({
      where: {
        price: {
          $gte: minPrice,
          $lte: maxPrice,
        } as any,
        isActive: true,
      },
      order: { price: 'ASC' },
    });
  }

  async findAvailableServices(): Promise<Service[]> {
    return this.serviceRepository.find({
      where: { isActive: true },
      order: { name: 'ASC' },
    });
  }

  async findMostPopular(limit: number = 10): Promise<Service[]> {
    return this.serviceRepository.find({
      where: { isActive: true },
      order: { name: 'DESC' }, // Using name as proxy for popularity since popularity field doesn't exist
      take: limit,
    });
  }

  async searchByName(searchTerm: string): Promise<Service[]> {
    return this.serviceRepository.createQueryBuilder('service')
      .where('service.name ILIKE :searchTerm', { searchTerm: `%${searchTerm}%` })
      .andWhere('service.isActive = true')
      .orderBy('service.name', 'ASC')
      .getMany();
  }

  async searchByDescription(searchTerm: string): Promise<Service[]> {
    return this.serviceRepository.createQueryBuilder('service')
      .where('service.description ILIKE :searchTerm', { searchTerm: `%${searchTerm}%` })
      .andWhere('service.isActive = true')
      .orderBy('service.name', 'ASC')
      .getMany();
  }

  async countByCategory(category: ServiceCategory): Promise<number> {
    return this.serviceRepository.count({
      where: { category, isActive: true },
    });
  }

  async getCategories(): Promise<string[]> {
    const services = await this.serviceRepository
      .createQueryBuilder('service')
      .select('DISTINCT service.category')
      .where('service.isActive = true')
      .orderBy('service.category', 'ASC')
      .getRawMany();

    return services.map(service => service.category);
  }

  async incrementPopularity(serviceId: string): Promise<void> {
    await this.serviceRepository.increment({ id: serviceId }, 'popularity', 1);
  }

  async decrementPopularity(serviceId: string): Promise<void> {
    await this.serviceRepository.decrement({ id: serviceId }, 'popularity', 1);
  }
}
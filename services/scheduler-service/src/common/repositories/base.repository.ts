import { DeepPartial, FindOptionsWhere, Repository, Not, IsNull } from 'typeorm';
import { BaseRepositoryInterface } from './base-repository.interface';
import { BaseEntity } from '../entities/base.entity';

export abstract class BaseRepository<T extends BaseEntity> implements BaseRepositoryInterface<T> {
  constructor(private readonly repository: Repository<T>) {}

  async findOneById(id: string): Promise<T | null> {
    return this.repository.findOne({
      where: { id } as FindOptionsWhere<T>,
      withDeleted: true,
    });
  }

  async findOneByCondition(condition: FindOptionsWhere<T>): Promise<T | null> {
    return this.repository.findOne({
      where: condition,
      withDeleted: true,
    });
  }

  async findAll(): Promise<T[]> {
    return this.repository.find({
      where: { isActive: true } as FindOptionsWhere<T>,
    });
  }

  async findAllWithPagination(page: number, limit: number): Promise<[T[], number]> {
    return this.repository.findAndCount({
      where: { isActive: true } as FindOptionsWhere<T>,
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' } as any,
    });
  }

  async create(entity: DeepPartial<T>): Promise<T> {
    const newEntity = this.repository.create(entity);
    return this.repository.save(newEntity);
  }

  async update(id: string, entity: DeepPartial<T>): Promise<T | null> {
    await this.repository.update(id, entity as any);
    return this.findOneById(id);
  }

  async softDelete(id: string, deletedBy: string): Promise<boolean> {
    const entity = await this.findOneById(id);
    if (!entity) {
      return false;
    }

    entity.deletedAt = new Date();
    entity.deletedBy = deletedBy;
    entity.isActive = false;
    
    await this.repository.save(entity);
    return true;
  }

  async restore(id: string): Promise<boolean> {
    const entity = await this.findOneById(id);
    if (!entity || !entity.deletedAt) {
      return false;
    }

    await entity.restore();
    await this.repository.save(entity);
    return true;
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.repository.count({
      where: { id } as FindOptionsWhere<T>,
      withDeleted: true,
    });
    return count > 0;
  }

  async count(): Promise<number> {
    return this.repository.count({
      withDeleted: true,
    });
  }

  async countActive(): Promise<number> {
    return this.repository.count({
      where: { isActive: true } as FindOptionsWhere<T>,
    });
  }

  async countDeleted(): Promise<number> {
    return this.repository.count({
      where: { deletedAt: Not(IsNull()) } as FindOptionsWhere<T>,
      withDeleted: true,
    });
  }
}
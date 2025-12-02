import {
  EntityRepository,
  Repository,
  FindOneOptions,
  FindManyOptions,
  DeepPartial,
  SaveOptions,
  UpdateResult,
} from 'typeorm';
import { BaseEntity } from '../entities/base.entity';

@EntityRepository()
export abstract class BaseRepository<T extends BaseEntity> extends Repository<T> {
  async findOneById(id: string, options?: FindOneOptions<T>): Promise<T | null> {
    return this.findOne({
      where: { id, isDeleted: false } as any,
      ...options,
    });
  }

  async findActive(options?: FindManyOptions<T>): Promise<T[]> {
    return this.find({
      where: { isDeleted: false } as any,
      ...options,
    });
  }

  async softDelete(id: string, userId?: string): Promise<UpdateResult> {
    const entity = await this.findOneById(id);
    if (!entity) {
      throw new Error('Entity not found');
    }
    
    await entity.softDelete(userId);
    return this.update(id, {
      isDeleted: true,
      deletedAt: new Date(),
      deletedBy: userId,
      isActive: false,
    } as any);
  }

  async createEntity(entityData: DeepPartial<T>, userId?: string): Promise<T> {
    const entity = this.create({
      ...entityData,
      createdBy: userId,
      updatedBy: userId,
    } as any);
    
    return this.save(entity);
  }

  async updateEntity(id: string, entityData: DeepPartial<T>, userId?: string): Promise<T> {
    await this.update(id, {
      ...entityData,
      updatedBy: userId,
      updatedAt: new Date(),
    } as any);
    
    const updated = await this.findOneById(id);
    if (!updated) {
      throw new Error('Entity not found after update');
    }
    
    return updated;
  }
}
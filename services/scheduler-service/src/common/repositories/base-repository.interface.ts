import { DeepPartial, FindOptionsWhere } from 'typeorm';

export interface BaseRepositoryInterface<T> {
  findOneById(id: string): Promise<T | null>;
  findOneByCondition(condition: FindOptionsWhere<T>): Promise<T | null>;
  findAll(): Promise<T[]>;
  findAllWithPagination(page: number, limit: number): Promise<[T[], number]>;
  create(entity: DeepPartial<T>): Promise<T>;
  update(id: string, entity: DeepPartial<T>): Promise<T | null>;
  softDelete(id: string, deletedBy: string): Promise<boolean>;
  restore(id: string): Promise<boolean>;
  exists(id: string): Promise<boolean>;
  count(): Promise<number>;
  countActive(): Promise<number>;
  countDeleted(): Promise<number>;
}
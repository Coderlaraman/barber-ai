// Temporary TypeORM mock to allow compilation while npm cache issue is resolved
export function Entity(name?: string) {
  return function (target: any) {
    // Mock implementation
  }
}

export function PrimaryGeneratedColumn(strategy?: string) {
  return function (target: any, propertyKey: string) {
    // Mock implementation
  }
}

export function Column(options?: any) {
  return function (target: any, propertyKey: string) {
    // Mock implementation
  }
}

export function CreateDateColumn(options?: any) {
  return function (target: any, propertyKey: string) {
    // Mock implementation
  }
}

export function UpdateDateColumn(options?: any) {
  return function (target: any, propertyKey: string) {
    // Mock implementation
  }
}

export function Index(fields?: string | string[]) {
  return function (target: any, propertyKey?: string) {
    // Mock implementation
  }
}

export function Unique(fields?: string | string[]) {
  return function (target: any, propertyKey?: string) {
    // Mock implementation
  }
}

export interface Repository<T> {
  findOne(options: any): Promise<T | null>
  find(options?: any): Promise<T[]>
  save(entity: T): Promise<T>
  create(entity: Partial<T>): T
  delete(criteria: any): Promise<void>
  update(criteria: any, partialEntity: Partial<T>): Promise<void>
  count(options?: any): Promise<number>
}

export function InjectRepository(entity: any) {
  return function (target: any, propertyKey: string, parameterIndex: number) {
    // Mock implementation - return a mock repository instance
    const mockRepo: Repository<any> = {
      findOne: async () => null,
      find: async () => [],
      save: async (entity) => entity,
      create: (entity) => entity as any,
      delete: async () => {},
      update: async () => {},
      count: async () => 0
    }
    // Inject the mock repository
    target[propertyKey] = mockRepo
    return target
  }
}
export interface RedisConfig {
  host: string
  port: number
  password?: string
  db?: number
  keyPrefix?: string
  retryDelayOnFailover?: number
  enableReadyCheck?: boolean
  maxRetriesPerRequest?: number
}

export const defaultRedisConfig: RedisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || '0', 10),
  keyPrefix: process.env.REDIS_KEY_PREFIX || 'barber_shop:',
  retryDelayOnFailover: 100,
  enableReadyCheck: false,
  maxRetriesPerRequest: 3,
}

export const getRedisUrl = (config: RedisConfig = defaultRedisConfig): string => {
  const { host, port, password, db } = config
  
  if (password) {
    return `redis://:${password}@${host}:${port}/${db}`
  }
  
  return `redis://${host}:${port}/${db}`
}
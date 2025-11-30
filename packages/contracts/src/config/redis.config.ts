import { Injectable } from '@nestjs/common'
import Redis, { RedisOptions } from 'ioredis'

export interface RedisConfig {
  host: string
  port: number
  password?: string
  db?: number
  tls?: boolean
  cluster?: boolean
  nodes?: Array<{ host: string; port: number }>
  maxRetriesPerRequest?: number
  retryDelayOnFailover?: number
  enableReadyCheck?: boolean
  lazyConnect?: boolean
  keepAlive?: number
  connectTimeout?: number
  commandTimeout?: number
  family?: number
  keyPrefix?: string
  enableOfflineQueue?: boolean
}

@Injectable()
export class RedisConfiguration {
  private static instance: RedisConfiguration
  private config: RedisConfig

  private constructor() {
    this.config = this.loadConfig()
  }

  static getInstance(): RedisConfiguration {
    if (!RedisConfiguration.instance) {
      RedisConfiguration.instance = new RedisConfiguration()
    }
    return RedisConfiguration.instance
  }

  private loadConfig(): RedisConfig {
    return {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB || '0', 10),
      tls: process.env.REDIS_TLS === 'true',
      cluster: process.env.REDIS_CLUSTER === 'true',
      nodes: this.parseClusterNodes(),
      maxRetriesPerRequest: parseInt(process.env.REDIS_MAX_RETRIES_PER_REQUEST || '3', 10),
      retryDelayOnFailover: parseInt(process.env.REDIS_RETRY_DELAY_ON_FAILOVER || '100', 10),
      enableReadyCheck: process.env.REDIS_ENABLE_READY_CHECK !== 'false',
      lazyConnect: process.env.REDIS_LAZY_CONNECT === 'true',
      keepAlive: parseInt(process.env.REDIS_KEEP_ALIVE || '30000', 10),
      connectTimeout: parseInt(process.env.REDIS_CONNECT_TIMEOUT || '10000', 10),
      commandTimeout: parseInt(process.env.REDIS_COMMAND_TIMEOUT || '5000', 10),
      family: parseInt(process.env.REDIS_FAMILY || '4', 10),
      keyPrefix: process.env.REDIS_KEY_PREFIX || 'barberia:',
      enableOfflineQueue: process.env.REDIS_ENABLE_OFFLINE_QUEUE !== 'false'
    }
  }

  private parseClusterNodes(): Array<{ host: string; port: number }> {
    const nodesStr = process.env.REDIS_CLUSTER_NODES
    if (!nodesStr) return []
    
    return nodesStr.split(',').map(node => {
      const [host, port] = node.split(':')
      return { host, port: parseInt(port, 10) }
    })
  }

  getConfig(): RedisConfig {
    return this.config
  }

  createRedisOptions(): RedisOptions {
    const config = this.getConfig()
    
    const options: RedisOptions = {
      host: config.host,
      port: config.port,
      password: config.password,
      db: config.db,
      maxRetriesPerRequest: config.maxRetriesPerRequest,
      enableReadyCheck: config.enableReadyCheck,
      lazyConnect: config.lazyConnect,
      keepAlive: config.keepAlive,
      connectTimeout: config.connectTimeout,
      commandTimeout: config.commandTimeout,
      family: config.family,
      keyPrefix: config.keyPrefix,
      enableOfflineQueue: config.enableOfflineQueue,
      retryStrategy: (times: number) => {
        const delay = Math.min(times * 50, 2000)
        return delay
      },
      reconnectOnError: (err: Error) => {
        const targetError = 'READONLY'
        if (err.message.includes(targetError)) {
          return true
        }
        return false
      }
    }

    // Configuración TLS para producción
    if (config.tls) {
      options.tls = {
        rejectUnauthorized: process.env.REDIS_TLS_REJECT_UNAUTHORIZED !== 'false',
        servername: process.env.REDIS_TLS_SERVERNAME || config.host,
        checkServerIdentity: process.env.REDIS_TLS_CHECK_SERVER_IDENTITY === 'true' ? undefined : () => undefined
      }

      // Opciones adicionales de TLS si están configuradas
      if (process.env.REDIS_TLS_CA_CERT) {
        options.tls.ca = Buffer.from(process.env.REDIS_TLS_CA_CERT, 'base64')
      }
      if (process.env.REDIS_TLS_CLIENT_CERT) {
        options.tls.cert = Buffer.from(process.env.REDIS_TLS_CLIENT_CERT, 'base64')
      }
      if (process.env.REDIS_TLS_CLIENT_KEY) {
        options.tls.key = Buffer.from(process.env.REDIS_TLS_CLIENT_KEY, 'base64')
      }
    }

    return options
  }

  createClusterOptions(): RedisOptions[] {
    const config = this.getConfig()
    
    if (!config.cluster || !config.nodes || config.nodes.length === 0) {
      throw new Error('Cluster configuration is invalid')
    }

    return config.nodes.map(node => ({
      host: node.host,
      port: node.port,
      password: config.password,
      maxRetriesPerRequest: config.maxRetriesPerRequest,
      retryDelayOnFailover: config.retryDelayOnFailover,
      enableReadyCheck: config.enableReadyCheck,
      lazyConnect: config.lazyConnect,
      keepAlive: config.keepAlive,
      connectTimeout: config.connectTimeout,
      commandTimeout: config.commandTimeout,
      family: config.family,
      keyPrefix: config.keyPrefix,
      enableOfflineQueue: config.enableOfflineQueue,
      tls: config.tls ? {
        rejectUnauthorized: process.env.REDIS_TLS_REJECT_UNAUTHORIZED !== 'false',
        servername: process.env.REDIS_TLS_SERVERNAME || node.host
      } : undefined,
      retryStrategy: (times: number) => {
        const delay = Math.min(times * 50, 2000)
        return delay
      }
    }))
  }

  createRedisClient(): Redis | any {
    const config = this.getConfig()
    
    if (config.cluster) {
      const clusterOptions = this.createClusterOptions()
      return new Redis.Cluster(clusterOptions, {
        redisOptions: clusterOptions[0],
        enableOfflineQueue: config.enableOfflineQueue
      })
    } else {
      return new Redis(this.createRedisOptions())
    }
  }

  createRedisClientForPubSub(): { publisher: Redis; subscriber: Redis } {
    const publisher = this.createRedisClient() as Redis
    const subscriber = this.createRedisClient() as Redis
    
    return { publisher, subscriber }
  }
}
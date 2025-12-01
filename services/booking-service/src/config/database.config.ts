import { TypeOrmModuleOptions } from '@nestjs/typeorm'
import { validateDatabaseConfig } from './database-env.validation'

export const databaseConfig = (): TypeOrmModuleOptions => {
  const isProduction = process.env.NODE_ENV === 'production'
  
  // Validar configuración de entorno
  const envConfig = validateDatabaseConfig(process.env)
  
  return {
    type: 'postgres',
    host: envConfig.DB_HOST,
    port: envConfig.DB_PORT,
    username: envConfig.DB_USERNAME,
    password: envConfig.DB_PASSWORD,
    database: envConfig.DB_NAME,
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    
    // Configuración de producción
    synchronize: !isProduction, // Nunca usar synchronize en producción
    logging: isProduction ? ['error'] : ['query', 'error'],
    
    // Pool de conexiones
    maxQueryExecutionTime: 1000, // 1 segundo máximo por query
    poolSize: envConfig.DB_POOL_SIZE,
    
    // SSL para producción
    ssl: envConfig.DB_SSL ? {
      rejectUnauthorized: false // Aceptar certificados autofirmados si es necesario
    } : false,
    
    // Reintentos de conexión
    retryAttempts: isProduction ? 10 : 3,
    retryDelay: 3000, // 3 segundos entre reintentos
    
    // Cache de entidades
    cache: isProduction ? {
      type: 'redis',
      options: {
        host: process.env.REDIS_HOST || 'localhost',
        port: Number(process.env.REDIS_PORT) || 6379,
        password: process.env.REDIS_PASSWORD
      },
      duration: 60000 // 1 minuto de cache
    } : false,
    
    // Optimizaciones
    extra: {
      max: envConfig.DB_POOL_SIZE, // Máximo de conexiones en el pool
      idleTimeoutMillis: 30000, // 30 segundos de timeout inactivo
      connectionTimeoutMillis: envConfig.DB_CONNECTION_TIMEOUT, // 5 segundos de timeout de conexión
      query_timeout: envConfig.DB_QUERY_TIMEOUT, // Timeout de queries
    }
  }
}
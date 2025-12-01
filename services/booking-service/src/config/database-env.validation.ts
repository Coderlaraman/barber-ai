import { plainToClass } from 'class-transformer'
import { IsString, IsNumber, IsBoolean, IsOptional, validateSync } from 'class-validator'

class DatabaseEnvironment {
  @IsString()
  DB_HOST: string = 'localhost'

  @IsNumber()
  @IsOptional()
  DB_PORT: number = 5432

  @IsString()
  DB_USERNAME: string = 'postgres'

  @IsString()
  DB_PASSWORD: string = 'password'

  @IsString()
  DB_NAME: string = 'barberia_booking'

  @IsBoolean()
  @IsOptional()
  DB_SSL: boolean = false

  @IsNumber()
  @IsOptional()
  DB_POOL_SIZE: number = 20

  @IsNumber()
  @IsOptional()
  DB_QUERY_TIMEOUT: number = 30000

  @IsNumber()
  @IsOptional()
  DB_CONNECTION_TIMEOUT: number = 5000

  @IsString()
  @IsOptional()
  DB_TIMEZONE: string = 'America/Mexico_City'
}

export function validateDatabaseConfig(config: Record<string, unknown>) {
  const validatedConfig = plainToClass(DatabaseEnvironment, config, {
    enableImplicitConversion: true,
  })
  
  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  })

  if (errors.length > 0) {
    const errorMessages = errors.map(error => 
      Object.values(error.constraints || {}).join(', ')
    ).join('; ')
    
    throw new Error(`Configuración de base de datos inválida: ${errorMessages}`)
  }
  
  return validatedConfig
}
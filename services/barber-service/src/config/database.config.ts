import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { Barber } from '../modules/barbers/entities/barber.entity';
import { Specialty } from '../modules/barbers/entities/specialty.entity';
import { Service } from '../modules/barbers/entities/service.entity';
import { BarberLocation } from '../modules/barbers/entities/barber-location.entity';

export default (): { database: TypeOrmModuleOptions } => ({
  database: {
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'barber_db',
    entities: [Barber, Specialty, Service, BarberLocation],
    synchronize: process.env.NODE_ENV !== 'production',
    logging: process.env.NODE_ENV === 'development',
    migrations: ['dist/migrations/*{.ts,.js}'],
    migrationsRun: process.env.NODE_ENV === 'production',
  },
});
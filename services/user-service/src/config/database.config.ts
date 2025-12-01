import { DataSource } from 'typeorm';
import { User } from '../modules/users/entities/user.entity';
import { UserPreference } from '../modules/users/entities/user-preference.entity';
import { UserAddress } from '../modules/users/entities/user-address.entity';

export const databaseConfig = {
  type: 'postgres' as const,
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_DATABASE || 'barberai_users',
  entities: [User, UserPreference, UserAddress],
  migrations: [__dirname + '/../migrations/*{.ts,.js}'],
  synchronize: process.env.NODE_ENV !== 'production',
  logging: process.env.NODE_ENV === 'development',
};

export const dataSource = new DataSource({
  ...databaseConfig,
  type: 'postgres',
});
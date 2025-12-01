import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserService } from './services/user.service';
import { UserController } from './controllers/user.controller';
import { User } from './entities/user.entity';
import { UserPreference } from './entities/user-preference.entity';
import { UserAddress } from './entities/user-address.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, UserPreference, UserAddress])],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
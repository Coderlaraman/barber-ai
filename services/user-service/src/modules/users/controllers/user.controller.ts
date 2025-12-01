import { Controller, Get, Post, Put, Delete, Body, Param, Query, HttpStatus, HttpCode } from '@nestjs/common';
import { UserService } from '../services/user.service';
import { CreateUserDto, UpdateUserDto } from '../dto/user.dto';
import { CreateUserPreferenceDto, UpdateUserPreferenceDto } from '../dto/user-preference.dto';
import { CreateUserAddressDto, UpdateUserAddressDto } from '../dto/user-address.dto';
import { UserResponseDto } from '../dto/user.dto';
import { UserPreference } from '../entities/user-preference.entity';
import { UserAddress } from '../entities/user-address.entity';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createUser(@Body() createUserDto: CreateUserDto): Promise<UserResponseDto> {
    return this.userService.createUser(createUserDto);
  }

  @Get()
  async findAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('role') role?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ): Promise<{ data: UserResponseDto[]; total: number; page: number; totalPages: number }> {
    return this.userService.findAll(
      parseInt(page, 10),
      parseInt(limit, 10),
      role as any,
      status as any,
      search
    );
  }

  @Get(':id')
  async findById(@Param('id') id: string): Promise<UserResponseDto> {
    return this.userService.findById(id);
  }

  @Get('email/:email')
  async findByEmail(@Param('email') email: string): Promise<UserResponseDto | null> {
    return this.userService.findByEmail(email);
  }

  @Put(':id')
  async updateUser(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    return this.userService.updateUser(id, updateUserDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteUser(@Param('id') id: string): Promise<void> {
    return this.userService.deleteUser(id);
  }

  @Put(':id/activate')
  async activateUser(@Param('id') id: string): Promise<UserResponseDto> {
    return this.userService.activateUser(id);
  }

  @Put(':id/deactivate')
  async deactivateUser(@Param('id') id: string): Promise<UserResponseDto> {
    return this.userService.deactivateUser(id);
  }

  @Put(':id/last-login')
  @HttpCode(HttpStatus.NO_CONTENT)
  async updateLastLogin(@Param('id') id: string): Promise<void> {
    return this.userService.updateLastLogin(id);
  }

  // Preference endpoints
  @Post(':id/preferences')
  @HttpCode(HttpStatus.CREATED)
  async createUserPreference(
    @Param('id') userId: string,
    @Body() createPreferenceDto: CreateUserPreferenceDto,
  ): Promise<UserPreference> {
    createPreferenceDto.userId = userId;
    return this.userService.createUserPreference(createPreferenceDto);
  }

  @Get(':id/preferences')
  async getUserPreferences(@Param('id') userId: string): Promise<UserPreference[]> {
    return this.userService.getUserPreferences(userId);
  }

  @Put('preferences/:preferenceId')
  async updateUserPreference(
    @Param('preferenceId') preferenceId: string,
    @Body() updatePreferenceDto: UpdateUserPreferenceDto,
  ): Promise<UserPreference> {
    return this.userService.updateUserPreference(preferenceId, updatePreferenceDto);
  }

  // Address endpoints
  @Post(':id/addresses')
  @HttpCode(HttpStatus.CREATED)
  async createUserAddress(
    @Param('id') userId: string,
    @Body() createAddressDto: CreateUserAddressDto,
  ): Promise<UserAddress> {
    createAddressDto.userId = userId;
    return this.userService.createUserAddress(createAddressDto);
  }

  @Get(':id/addresses')
  async getUserAddresses(@Param('id') userId: string): Promise<UserAddress[]> {
    return this.userService.getUserAddresses(userId);
  }

  @Put('addresses/:addressId')
  async updateUserAddress(
    @Param('addressId') addressId: string,
    @Body() updateAddressDto: UpdateUserAddressDto,
  ): Promise<UserAddress> {
    return this.userService.updateUserAddress(addressId, updateAddressDto);
  }
}
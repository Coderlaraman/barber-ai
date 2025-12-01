import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, ILike } from 'typeorm';
import { User, UserRole, UserStatus } from '../entities/user.entity';
import { UserPreference, PreferenceType } from '../entities/user-preference.entity';
import { UserAddress } from '../entities/user-address.entity';
import { CreateUserDto, UpdateUserDto, UserResponseDto } from '../dto/user.dto';
import { CreateUserPreferenceDto, UpdateUserPreferenceDto } from '../dto/user-preference.dto';
import { CreateUserAddressDto, UpdateUserAddressDto } from '../dto/user-address.dto';
import { plainToClass } from 'class-transformer';
import * as libphonenumber from 'libphonenumber-js';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(UserPreference)
    private preferenceRepository: Repository<UserPreference>,
    @InjectRepository(UserAddress)
    private addressRepository: Repository<UserAddress>,
  ) {}

  async createUser(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    // Validar email único
    const existingUser = await this.userRepository.findOne({ 
      where: { email: createUserDto.email } 
    });
    
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Validar teléfono si se proporciona
    if (createUserDto.phone) {
      const phoneValidation = this.validatePhoneNumber(createUserDto.phone);
      if (!phoneValidation.isValid) {
        throw new BadRequestException(phoneValidation.error);
      }
    }

    // Validar edad mínima (18 años)
    if (createUserDto.dateOfBirth) {
      const birthDate = new Date(createUserDto.dateOfBirth);
      const age = this.calculateAge(birthDate);
      if (age < 18) {
        throw new BadRequestException('User must be at least 18 years old');
      }
    }

    const user = this.userRepository.create({
      ...createUserDto,
      status: createUserDto.status || UserStatus.PENDING_VERIFICATION,
      role: createUserDto.role || UserRole.CUSTOMER,
    });

    const savedUser = await this.userRepository.save(user);
    
    // Crear preferencias por defecto
    await this.createDefaultPreferences(savedUser.id);
    
    return this.toResponseDto(savedUser);
  }

  async findAll(
    page: number = 1, 
    limit: number = 10, 
    role?: UserRole, 
    status?: UserStatus,
    search?: string
  ): Promise<{ data: UserResponseDto[]; total: number; page: number; totalPages: number }> {
    const where: FindOptionsWhere<User> = {};
    
    if (role) where.role = role;
    if (status) where.status = status;
    if (search) {
      where.email = ILike(`%${search}%`);
    }

    const [users, total] = await this.userRepository.findAndCount({
      where,
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return {
      data: users.map(user => this.toResponseDto(user)),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string): Promise<UserResponseDto> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['preferences', 'addresses'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.toResponseDto(user);
  }

  async findByEmail(email: string): Promise<UserResponseDto | null> {
    const user = await this.userRepository.findOne({
      where: { email },
      relations: ['preferences', 'addresses'],
    });

    return user ? this.toResponseDto(user) : null;
  }

  async updateUser(id: string, updateUserDto: UpdateUserDto): Promise<UserResponseDto> {
    const user = await this.userRepository.findOne({ where: { id } });
    
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Validar email único si se está actualizando
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.userRepository.findOne({ 
        where: { email: updateUserDto.email } 
      });
      
      if (existingUser) {
        throw new ConflictException('User with this email already exists');
      }
    }

    // Validar teléfono si se proporciona
    if (updateUserDto.phone) {
      const phoneValidation = this.validatePhoneNumber(updateUserDto.phone);
      if (!phoneValidation.isValid) {
        throw new BadRequestException(phoneValidation.error);
      }
    }

    // Validar edad mínima si se está actualizando la fecha de nacimiento
    if (updateUserDto.dateOfBirth) {
      const birthDate = new Date(updateUserDto.dateOfBirth);
      const age = this.calculateAge(birthDate);
      if (age < 18) {
        throw new BadRequestException('User must be at least 18 years old');
      }
    }

    Object.assign(user, updateUserDto);
    const updatedUser = await this.userRepository.save(user);
    
    return this.toResponseDto(updatedUser);
  }

  async deleteUser(id: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id } });
    
    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.userRepository.softDelete(id);
  }

  async activateUser(id: string): Promise<UserResponseDto> {
    return this.updateUserStatus(id, UserStatus.ACTIVE);
  }

  async deactivateUser(id: string): Promise<UserResponseDto> {
    return this.updateUserStatus(id, UserStatus.INACTIVE);
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.userRepository.update(id, { lastLoginAt: new Date() });
  }

  // Métodos de preferencias
  async createUserPreference(createPreferenceDto: CreateUserPreferenceDto): Promise<UserPreference> {
    const user = await this.userRepository.findOne({ 
      where: { id: createPreferenceDto.userId } 
    });
    
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Validar que no exista una preferencia del mismo tipo
    const existingPreference = await this.preferenceRepository.findOne({
      where: { 
        user: { id: createPreferenceDto.userId },
        preferenceType: createPreferenceDto.preferenceType 
      }
    });

    if (existingPreference) {
      throw new ConflictException('Preference of this type already exists for the user');
    }

    const preference = this.preferenceRepository.create(createPreferenceDto);
    return this.preferenceRepository.save(preference);
  }

  async updateUserPreference(id: string, updatePreferenceDto: UpdateUserPreferenceDto): Promise<UserPreference> {
    const preference = await this.preferenceRepository.findOne({ where: { id } });
    
    if (!preference) {
      throw new NotFoundException('Preference not found');
    }

    Object.assign(preference, updatePreferenceDto);
    return this.preferenceRepository.save(preference);
  }

  async getUserPreferences(userId: string): Promise<UserPreference[]> {
    const user = await this.userRepository.findOne({ 
      where: { id: userId } 
    });
    
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.preferenceRepository.find({
      where: { user: { id: userId } },
      order: { preferenceType: 'ASC' },
    });
  }

  // Métodos de direcciones
  async createUserAddress(createAddressDto: CreateUserAddressDto): Promise<UserAddress> {
    const user = await this.userRepository.findOne({ 
      where: { id: createAddressDto.userId } 
    });
    
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Si es la dirección por defecto, actualizar las demás
    if (createAddressDto.isDefault) {
      await this.addressRepository.update(
        { user: { id: createAddressDto.userId } },
        { isDefault: false }
      );
    }

    const address = this.addressRepository.create(createAddressDto);
    return this.addressRepository.save(address);
  }

  async updateUserAddress(id: string, updateAddressDto: UpdateUserAddressDto): Promise<UserAddress> {
    const address = await this.addressRepository.findOne({ 
      where: { id },
      relations: ['user']
    });
    
    if (!address) {
      throw new NotFoundException('Address not found');
    }

    // Si se marca como predeterminada, actualizar las demás
    if (updateAddressDto.isDefault) {
      await this.addressRepository.update(
        { user: { id: address.user.id } },
        { isDefault: false }
      );
    }

    Object.assign(address, updateAddressDto);
    return this.addressRepository.save(address);
  }

  async getUserAddresses(userId: string): Promise<UserAddress[]> {
    const user = await this.userRepository.findOne({ 
      where: { id: userId } 
    });
    
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.addressRepository.find({
      where: { user: { id: userId } },
      order: { isDefault: 'DESC', createdAt: 'ASC' },
    });
  }

  // Métodos privados
  private async updateUserStatus(id: string, status: UserStatus): Promise<UserResponseDto> {
    const user = await this.userRepository.findOne({ where: { id } });
    
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.status = status;
    const updatedUser = await this.userRepository.save(user);
    
    return this.toResponseDto(updatedUser);
  }

  private async createDefaultPreferences(userId: string): Promise<void> {
    const defaultPreferences = [
      { preferenceType: PreferenceType.NOTIFICATION_BOOKING_CONFIRMED, preferenceValue: 'true' },
      { preferenceType: PreferenceType.NOTIFICATION_BOOKING_REMINDER, preferenceValue: 'true' },
      { preferenceType: PreferenceType.NOTIFICATION_PROMOTIONS, preferenceValue: 'false' },
      { preferenceType: PreferenceType.THEME, preferenceValue: 'auto' },
      { preferenceType: PreferenceType.LANGUAGE, preferenceValue: 'es' },
      { preferenceType: PreferenceType.CURRENCY, preferenceValue: 'COP' },
      { preferenceType: PreferenceType.TIMEZONE, preferenceValue: 'America/Bogota' },
    ];

    for (const pref of defaultPreferences) {
      try {
        await this.createUserPreference({ userId, ...pref });
      } catch (error) {
        // Silenciar errores de preferencias duplicadas
        if (error instanceof ConflictException) continue;
        throw error;
      }
    }
  }

  private validatePhoneNumber(phone: string): { isValid: boolean; error?: string } {
    try {
      const phoneNumber = libphonenumber.parsePhoneNumber(phone, 'CO');
      if (!phoneNumber.isValid()) {
        return { isValid: false, error: 'Invalid phone number format' };
      }
      return { isValid: true };
    } catch {
      return { isValid: false, error: 'Invalid phone number format' };
    }
  }

  private calculateAge(birthDate: Date): number {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }

  private toResponseDto(user: User): UserResponseDto {
    return plainToClass(UserResponseDto, {
      ...user,
      fullName: user.fullName,
      age: user.age,
      isActive: user.isActive,
    });
  }
}
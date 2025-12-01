import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from '../src/modules/users/services/user.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User, UserRole, UserStatus } from '../src/modules/users/entities/user.entity';
import { UserPreference } from '../src/modules/users/entities/user-preference.entity';
import { UserAddress } from '../src/modules/users/entities/user-address.entity';
import { ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateUserDto } from '../src/modules/users/dto/user.dto';

describe('UserService', () => {
  let service: UserService;
  let userRepository: any;
  let preferenceRepository: any;
  let addressRepository: any;

  const mockUserRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    findAndCount: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
  };

  const mockPreferenceRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    update: jest.fn(),
  };

  const mockAddressRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    update: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: getRepositoryToken(UserPreference),
          useValue: mockPreferenceRepository,
        },
        {
          provide: getRepositoryToken(UserAddress),
          useValue: mockAddressRepository,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    userRepository = module.get(getRepositoryToken(User));
    preferenceRepository = module.get(getRepositoryToken(UserPreference));
    addressRepository = module.get(getRepositoryToken(UserAddress));

    jest.clearAllMocks();
  });

  describe('createUser', () => {
    const createUserDto: CreateUserDto = {
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe',
      phone: '+573001234567',
      dateOfBirth: '1990-01-01',
    };

    it('should create a user successfully', async () => {
      const mockUser = {
        id: '123',
        ...createUserDto,
        dateOfBirth: new Date(createUserDto.dateOfBirth),
        role: UserRole.CUSTOMER,
        status: UserStatus.PENDING_VERIFICATION,
        emailVerified: false,
        phoneVerified: false,
        profileImageUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLoginAt: null,
        preferences: [],
        addresses: [],
        fullName: 'John Doe',
        isActive: false,
        age: 34,
      };

      userRepository.findOne.mockResolvedValueOnce(null); // Para verificar email único
      userRepository.create.mockReturnValue(mockUser);
      userRepository.save.mockResolvedValue(mockUser);
      
      // Configurar múltiples llamadas mock para createDefaultPreferences
      userRepository.findOne
        .mockResolvedValueOnce(mockUser) // Primera preferencia
        .mockResolvedValueOnce(mockUser) // Segunda preferencia
        .mockResolvedValueOnce(mockUser) // Tercera preferencia
        .mockResolvedValueOnce(mockUser) // Cuarta preferencia
        .mockResolvedValueOnce(mockUser) // Quinta preferencia
        .mockResolvedValueOnce(mockUser) // Sexta preferencia
        .mockResolvedValueOnce(mockUser); // Séptima preferencia (TIMEZONE)
        
      preferenceRepository.create.mockReturnValue({});
      preferenceRepository.save.mockResolvedValue({});

      const result = await service.createUser(createUserDto);

      expect(result).toBeDefined();
      expect(result.email).toBe(createUserDto.email);
      expect(result.firstName).toBe(createUserDto.firstName);
      expect(userRepository.create).toHaveBeenCalledWith({
        ...createUserDto,
        role: UserRole.CUSTOMER,
        status: UserStatus.PENDING_VERIFICATION,
      });
    });

    it('should throw ConflictException if email already exists', async () => {
      userRepository.findOne.mockResolvedValue({ id: 'existing' });

      await expect(service.createUser(createUserDto)).rejects.toThrow(ConflictException);
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { email: createUserDto.email },
      });
    });

    it('should throw BadRequestException for invalid phone number', async () => {
      const invalidDto = { ...createUserDto, phone: 'invalid-phone' };
      userRepository.findOne.mockResolvedValue(null);

      await expect(service.createUser(invalidDto)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for user under 18', async () => {
      const underageDto = { ...createUserDto, dateOfBirth: '2010-01-01' };
      userRepository.findOne.mockResolvedValue(null);

      await expect(service.createUser(underageDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('findById', () => {
    it('should return user when found', async () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        fullName: 'John Doe',
        isActive: true,
        age: 34,
      };

      userRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findById('123');

      expect(result).toBeDefined();
      expect(result.id).toBe('123');
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: '123' },
        relations: ['preferences', 'addresses'],
      });
    });

    it('should throw NotFoundException when user not found', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(service.findById('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateUser', () => {
    it('should update user successfully', async () => {
      const existingUser = {
        id: '123',
        email: 'old@example.com',
        firstName: 'John',
        lastName: 'Doe',
      };

      const updateDto = {
        firstName: 'Jane',
        email: 'new@example.com',
      };

      userRepository.findOne.mockResolvedValueOnce(existingUser); // Para verificar usuario existe
      userRepository.findOne.mockResolvedValueOnce(null); // Para verificar email único
      userRepository.save.mockResolvedValue({ ...existingUser, ...updateDto });

      const result = await service.updateUser('123', updateDto);

      expect(result.firstName).toBe('Jane');
      expect(result.email).toBe('new@example.com');
      expect(userRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when user not found', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(service.updateUser('nonexistent', {})).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteUser', () => {
    it('should delete user successfully', async () => {
      userRepository.findOne.mockResolvedValue({ id: '123' });
      userRepository.softDelete.mockResolvedValue({ affected: 1 });

      await service.deleteUser('123');

      expect(userRepository.softDelete).toHaveBeenCalledWith('123');
    });

    it('should throw NotFoundException when user not found', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(service.deleteUser('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('activateUser', () => {
    it('should activate user successfully', async () => {
      const user = {
        id: '123',
        status: UserStatus.INACTIVE,
      };

      userRepository.findOne.mockResolvedValue(user);
      userRepository.save.mockResolvedValue({ ...user, status: UserStatus.ACTIVE });

      const result = await service.activateUser('123');

      expect(result.status).toBe(UserStatus.ACTIVE);
      expect(userRepository.save).toHaveBeenCalledWith({
        ...user,
        status: UserStatus.ACTIVE,
      });
    });
  });

  describe('deactivateUser', () => {
    it('should deactivate user successfully', async () => {
      const user = {
        id: '123',
        status: UserStatus.ACTIVE,
      };

      userRepository.findOne.mockResolvedValue(user);
      userRepository.save.mockResolvedValue({ ...user, status: UserStatus.INACTIVE });

      const result = await service.deactivateUser('123');

      expect(result.status).toBe(UserStatus.INACTIVE);
      expect(userRepository.save).toHaveBeenCalledWith({
        ...user,
        status: UserStatus.INACTIVE,
      });
    });
  });
});
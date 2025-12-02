import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Between, Like } from 'typeorm';
import { Barber, BarberStatus } from '../entities/barber.entity';
import { Specialty } from '../entities/specialty.entity';
import { Service, ServiceStatus } from '../entities/service.entity';
import { BarberLocation } from '../entities/barber-location.entity';
import { CreateBarberDto, UpdateBarberDto, BarberResponseDto } from '../dto/barber.dto';
import { CreateSpecialtyDto, UpdateSpecialtyDto, SpecialtyResponseDto } from '../dto/specialty.dto';
import { CreateServiceDto, UpdateServiceDto, ServiceResponseDto, ServiceSearchDto } from '../dto/service.dto';

@Injectable()
export class BarberService {
  constructor(
    @InjectRepository(Barber)
    private barberRepository: Repository<Barber>,
    @InjectRepository(Specialty)
    private specialtyRepository: Repository<Specialty>,
    @InjectRepository(Service)
    private serviceRepository: Repository<Service>,
    @InjectRepository(BarberLocation)
    private barberLocationRepository: Repository<BarberLocation>,
  ) {}

  // ===== BARBER METHODS =====

  async createBarber(createBarberDto: CreateBarberDto): Promise<BarberResponseDto> {
    // Verificar si el userId ya existe
    const existingBarber = await this.barberRepository.findOne({
      where: { userId: createBarberDto.userId },
    });

    if (existingBarber) {
      throw new ConflictException('Barber with this userId already exists');
    }

    // Verificar validez de la licencia
    if (createBarberDto.licenseExpiryDate && new Date(createBarberDto.licenseExpiryDate) <= new Date()) {
      throw new BadRequestException('License expiry date must be in the future');
    }

    // Verificar años de experiencia
    if (createBarberDto.yearsOfExperience !== undefined && createBarberDto.yearsOfExperience < 0) {
      throw new BadRequestException('Years of experience cannot be negative');
    }

    const barber = this.barberRepository.create(createBarberDto);
    
    // Establecer estado inicial
    if (!barber.status) {
      barber.status = BarberStatus.ACTIVE;
    }

    const savedBarber = await this.barberRepository.save(barber);
    return this.mapBarberToResponseDto(savedBarber);
  }

  async findAllBarbers(): Promise<BarberResponseDto[]> {
    const barbers = await this.barberRepository.find({
      relations: ['specialties', 'services', 'locations'],
    });
    return barbers.map(barber => this.mapBarberToResponseDto(barber));
  }

  async findBarberById(id: string): Promise<BarberResponseDto> {
    const barber = await this.barberRepository.findOne({
      where: { id },
      relations: ['specialties', 'services', 'locations'],
    });

    if (!barber) {
      throw new NotFoundException('Barber not found');
    }

    return this.mapBarberToResponseDto(barber);
  }

  async updateBarber(id: string, updateBarberDto: UpdateBarberDto): Promise<BarberResponseDto> {
    const barber = await this.barberRepository.findOne({ where: { id } });

    if (!barber) {
      throw new NotFoundException('Barber not found');
    }

    // No need to check email as barbers don't have email fields

    // Verificar validez de la licencia
    if (updateBarberDto.licenseExpiryDate && new Date(updateBarberDto.licenseExpiryDate) <= new Date()) {
      throw new BadRequestException('License expiry date must be in the future');
    }

    // Verificar años de experiencia
    if (updateBarberDto.yearsOfExperience !== undefined && updateBarberDto.yearsOfExperience < 0) {
      throw new BadRequestException('Years of experience cannot be negative');
    }

    Object.assign(barber, updateBarberDto);
    const updatedBarber = await this.barberRepository.save(barber);
    return this.mapBarberToResponseDto(updatedBarber);
  }

  async deleteBarber(id: string): Promise<void> {
    const barber = await this.barberRepository.findOne({ where: { id } });

    if (!barber) {
      throw new NotFoundException('Barber not found');
    }

    // Verificar si tiene servicios activos
    const activeServices = await this.serviceRepository.count({
      where: { barber: { id }, status: ServiceStatus.ACTIVE },
    });

    if (activeServices > 0) {
      throw new BadRequestException('Cannot delete barber with active services');
    }

    await this.barberRepository.remove(barber);
  }

  // ===== SPECIALTY METHODS =====

  async createSpecialty(createSpecialtyDto: CreateSpecialtyDto): Promise<SpecialtyResponseDto> {
    // Verificar si el nombre ya existe
    const existingSpecialty = await this.specialtyRepository.findOne({
      where: { name: createSpecialtyDto.name },
    });

    if (existingSpecialty) {
      throw new ConflictException('Specialty with this name already exists');
    }

    const specialty = this.specialtyRepository.create(createSpecialtyDto);
    const savedSpecialty = await this.specialtyRepository.save(specialty);
    return this.mapSpecialtyToResponseDto(savedSpecialty);
  }

  async findAllSpecialties(): Promise<SpecialtyResponseDto[]> {
    const specialties = await this.specialtyRepository.find({
      relations: ['services'],
    });
    return specialties.map(specialty => this.mapSpecialtyToResponseDto(specialty));
  }

  async findSpecialtyById(id: string): Promise<SpecialtyResponseDto> {
    const specialty = await this.specialtyRepository.findOne({
      where: { id },
      relations: ['services'],
    });

    if (!specialty) {
      throw new NotFoundException('Specialty not found');
    }

    return this.mapSpecialtyToResponseDto(specialty);
  }

  async updateSpecialty(id: string, updateSpecialtyDto: UpdateSpecialtyDto): Promise<SpecialtyResponseDto> {
    const specialty = await this.specialtyRepository.findOne({ where: { id } });

    if (!specialty) {
      throw new NotFoundException('Specialty not found');
    }

    // Verificar si el nombre ya existe (si se está actualizando)
    if (updateSpecialtyDto.name && updateSpecialtyDto.name !== specialty.name) {
      const existingSpecialty = await this.specialtyRepository.findOne({
        where: { name: updateSpecialtyDto.name },
      });

      if (existingSpecialty) {
        throw new ConflictException('Specialty with this name already exists');
      }
    }

    Object.assign(specialty, updateSpecialtyDto);
    const updatedSpecialty = await this.specialtyRepository.save(specialty);
    return this.mapSpecialtyToResponseDto(updatedSpecialty);
  }

  async deleteSpecialty(id: string): Promise<void> {
    const specialty = await this.specialtyRepository.findOne({
      where: { id },
      relations: ['services'],
    });

    if (!specialty) {
      throw new NotFoundException('Specialty not found');
    }

    // Verificar si tiene servicios asociados
    if (specialty.services && specialty.services.length > 0) {
      throw new BadRequestException('Cannot delete specialty with associated services');
    }

    await this.specialtyRepository.remove(specialty);
  }

  // ===== SERVICE METHODS =====

  async createService(barberId: string, createServiceDto: CreateServiceDto): Promise<ServiceResponseDto> {
    // Verificar que el barbero existe
    const barber = await this.barberRepository.findOne({
      where: { id: barberId },
    });

    if (!barber) {
      throw new NotFoundException('Barber not found');
    }

    // Verificar que la especialidad existe (si se proporciona)
    if (createServiceDto.specialtyId) {
      const specialty = await this.specialtyRepository.findOne({
        where: { id: createServiceDto.specialtyId },
      });

      if (!specialty) {
        throw new NotFoundException('Specialty not found');
      }
    }

    // Verificar precio válido
    if (createServiceDto.basePrice !== undefined && createServiceDto.basePrice < 0) {
      throw new BadRequestException('Price cannot be negative');
    }

    // Verificar duración válida
    if (createServiceDto.duration !== undefined && createServiceDto.duration <= 0) {
      throw new BadRequestException('Duration must be positive');
    }

    const service = this.serviceRepository.create({
      ...createServiceDto,
      barber,
      specialty: createServiceDto.specialtyId ? { id: createServiceDto.specialtyId } : null,
    });

    // Establecer estado inicial
    if (!service.status) {
      service.status = ServiceStatus.ACTIVE;
    }

    const savedService = await this.serviceRepository.save(service);
    return this.mapServiceToResponseDto(savedService);
  }

  async findAllServices(searchDto?: ServiceSearchDto): Promise<ServiceResponseDto[]> {
    const where: any = {};

    if (searchDto) {
      if (searchDto.barberId) {
        where.barber = { id: searchDto.barberId };
      }

      if (searchDto.specialtyId) {
        where.specialty = { id: searchDto.specialtyId };
      }

      if (searchDto.status) {
        where.status = searchDto.status;
      }

      if (searchDto.minPrice !== undefined || searchDto.maxPrice !== undefined) {
        where.price = Between(
          searchDto.minPrice ?? 0,
          searchDto.maxPrice ?? Number.MAX_SAFE_INTEGER
        );
      }

      if (searchDto.query) {
        where.name = Like(`%${searchDto.query}%`);
      }
    }

    const services = await this.serviceRepository.find({
      where,
      relations: ['barber', 'specialty'],
      order: { createdAt: 'DESC' },
    });

    return services.map(service => this.mapServiceToResponseDto(service));
  }

  async findServiceById(id: string): Promise<ServiceResponseDto> {
    const service = await this.serviceRepository.findOne({
      where: { id },
      relations: ['barber', 'specialty'],
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    return this.mapServiceToResponseDto(service);
  }

  async updateService(id: string, updateServiceDto: UpdateServiceDto): Promise<ServiceResponseDto> {
    const service = await this.serviceRepository.findOne({ where: { id } });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    // Verificar que la especialidad existe (si se está actualizando)
    // Note: specialtyId is not in UpdateServiceDto, so we can't update specialty directly
    /*
    if (updateServiceDto.specialtyId) {
      const specialty = await this.specialtyRepository.findOne({
        where: { id: updateServiceDto.specialtyId },
      });

      if (!specialty) {
        throw new NotFoundException('Specialty not found');
      }
    }
    */

    // Verificar precio válido
    if (updateServiceDto.basePrice !== undefined && updateServiceDto.basePrice < 0) {
      throw new BadRequestException('Price cannot be negative');
    }

    // Verificar duración válida
    if (updateServiceDto.duration !== undefined && updateServiceDto.duration <= 0) {
      throw new BadRequestException('Duration must be positive');
    }

    Object.assign(service, updateServiceDto);
    
    // Note: specialtyId is not in UpdateServiceDto, so we can't update specialty directly
    // Actualizar relaciones si es necesario
    /*
    if (updateServiceDto.specialtyId) {
      service.specialty = { id: updateServiceDto.specialtyId } as Specialty;
    } else if (updateServiceDto.specialtyId === null) {
      service.specialty = null;
    }
    */

    const updatedService = await this.serviceRepository.save(service);
    return this.mapServiceToResponseDto(updatedService);
  }

  async deleteService(id: string): Promise<void> {
    const service = await this.serviceRepository.findOne({ where: { id } });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    await this.serviceRepository.remove(service);
  }

  // ===== LOCATION METHODS =====

  async addBarberLocation(barberId: string, locationData: {
    address: string;
    latitude: number;
    longitude: number;
    isPrimary?: boolean;
  }): Promise<BarberLocation> {
    const barber = await this.barberRepository.findOne({ where: { id: barberId } });

    if (!barber) {
      throw new NotFoundException('Barber not found');
    }

    // Si es ubicación primaria, desactivar otras primarias
    // Note: isPrimary property doesn't exist in BarberLocation entity
    // This logic should be removed or use isActive instead
    /*
    if (locationData.isPrimary) {
      await this.barberLocationRepository.update(
        { barber: { id: barberId }, isPrimary: true },
        { isPrimary: false }
      );
    }
    */

    const location = this.barberLocationRepository.create({
      ...locationData,
      barber,
    });

    return await this.barberLocationRepository.save(location);
  }

  async findBarbersNearby(latitude: number, longitude: number, radiusKm: number = 5): Promise<BarberResponseDto[]> {
    // Implementar búsqueda por radio usando fórmula de Haversine
    const barbers = await this.barberRepository.find({
      relations: ['location', 'specialties', 'services'],
      where: { status: BarberStatus.ACTIVE },
    });

    const nearbyBarbers = barbers.filter(barber => {
      if (!barber.location) return false;
      const distance = barber.location.getDistanceFrom(latitude, longitude);
      return distance <= radiusKm;
    });

    return nearbyBarbers.map(barber => this.mapBarberToResponseDto(barber));
  }

  // ===== UTILITY METHODS =====

  private mapBarberToResponseDto(barber: Barber): BarberResponseDto {
    return {
      id: barber.id,
      userId: barber.userId,
      licenseNumber: barber.licenseNumber,
      licenseExpiryDate: barber.licenseExpiryDate,
      experienceLevel: barber.experienceLevel,
      yearsOfExperience: barber.yearsOfExperience,
      bio: barber.bio,
      professionalSummary: barber.professionalSummary,
      skills: barber.skills,
      certifications: barber.certifications,
      portfolioPhotos: barber.portfolioPhotos,
      averageRating: barber.averageRating,
      totalReviews: barber.totalReviews,
      totalBookings: barber.totalBookings,
      completedBookings: barber.completedBookings,
      totalEarnings: barber.totalEarnings,
      status: barber.status,
      isVerified: barber.isVerified,
      isAvailable: barber.isAvailable,
      acceptsWalkIns: barber.acceptsWalkIns,
      bufferTimeMinutes: barber.bufferTimeMinutes,
      workingHours: barber.workingHours,
      holidays: barber.holidays,
      specialties: barber.specialties?.map(specialty => this.mapSpecialtyToResponseDto(specialty)) || [],
      services: barber.services?.map(service => this.mapServiceToResponseDto(service)) || [],
      location: barber.location ? {
        id: barber.location.id,
        address: barber.location.address,
        latitude: barber.location.latitude,
        longitude: barber.location.longitude,
        // Note: isPrimary property doesn't exist in BarberLocation entity
        // isPrimary: barber.location.isPrimary,
      } : null,
      createdAt: barber.createdAt,
      updatedAt: barber.updatedAt,
    };
  }

  private mapSpecialtyToResponseDto(specialty: Specialty): SpecialtyResponseDto {
    return {
      id: specialty.id,
      name: specialty.name,
      description: specialty.description,
      category: specialty.category,
      level: specialty.level,
      requirements: specialty.requirements,
      minExperienceYears: specialty.minExperienceYears,
      requiredCertifications: specialty.requiredCertifications,
      toolsRequired: specialty.toolsRequired,
      averageDuration: specialty.averageDuration,
      basePrice: specialty.basePrice,
      complexity: specialty.complexity,
      isActive: specialty.isActive,
      requiresCertification: specialty.requiresCertification,
      tags: specialty.tags,
      createdAt: specialty.createdAt,
      updatedAt: specialty.updatedAt,
      barberId: specialty.barberId,
    };
  }

  private mapServiceToResponseDto(service: Service): ServiceResponseDto {
    return {
      id: service.id,
      name: service.name,
      description: service.description,
      shortDescription: service.shortDescription,
      detailedDescription: service.detailedDescription,
      status: service.status,
      gender: service.gender,
      basePrice: service.basePrice,
      promotionalPrice: service.promotionalPrice,
      duration: service.duration,
      durationUnit: service.durationUnit,
      minDuration: service.minDuration,
      maxDuration: service.maxDuration,
      bufferTime: service.bufferTime,
      includedServices: service.includedServices,
      additionalServices: service.additionalServices,
      requirements: service.requirements,
      contraindications: service.contraindications,
      photos: service.photos,
      tags: service.tags,
      requiresConsultation: service.requiresConsultation,
      isPackage: service.isPackage,
      maxClients: service.maxClients,
      popularity: service.popularity,
      bookingCount: service.bookingCount,
      averageRating: service.averageRating,
      reviewCount: service.reviewCount,
      // Note: seasonalAvailability is not in ServiceResponseDto
      // seasonalAvailability: service.seasonalAvailability,
      availableFrom: service.availableFrom,
      availableUntil: service.availableUntil,
      barberId: service.barberId,
      specialtyId: service.specialtyId,
      specialty: service.specialty ? {
        id: service.specialty.id,
        name: service.specialty.name,
        category: service.specialty.category,
      } : null,
      createdAt: service.createdAt,
      updatedAt: service.updatedAt,
    };
  }
}
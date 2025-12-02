import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BarberService } from '../src/modules/barbers/services/barber.service';
import { Barber, BarberStatus, ExperienceLevel } from '../src/modules/barbers/entities/barber.entity';
import { Specialty, SpecialtyCategory, SpecialtyLevel } from '../src/modules/barbers/entities/specialty.entity';
import { Service, ServiceStatus, ServiceGender, ServiceDurationUnit } from '../src/modules/barbers/entities/service.entity';
import { BarberLocation, LocationType, EstablishmentSize } from '../src/modules/barbers/entities/barber-location.entity';
import { CreateBarberDto } from '../src/modules/barbers/dto/barber.dto';
import { CreateSpecialtyDto } from '../src/modules/barbers/dto/specialty.dto';
import { CreateServiceDto } from '../src/modules/barbers/dto/service.dto';
import { ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';

describe('BarberService', () => {
  let service: BarberService;
  let barberRepository: Repository<Barber>;
  let specialtyRepository: Repository<Specialty>;
  let serviceRepository: Repository<Service>;
  let barberLocationRepository: Repository<BarberLocation>;

  const mockRepository = () => ({
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BarberService,
        { provide: getRepositoryToken(Barber), useValue: mockRepository() },
        { provide: getRepositoryToken(Specialty), useValue: mockRepository() },
        { provide: getRepositoryToken(Service), useValue: mockRepository() },
        { provide: getRepositoryToken(BarberLocation), useValue: mockRepository() },
      ],
    }).compile();

    service = module.get<BarberService>(BarberService);
    barberRepository = module.get<Repository<Barber>>(getRepositoryToken(Barber));
    specialtyRepository = module.get<Repository<Specialty>>(getRepositoryToken(Specialty));
    serviceRepository = module.get<Repository<Service>>(getRepositoryToken(Service));
    barberLocationRepository = module.get<Repository<BarberLocation>>(getRepositoryToken(BarberLocation));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createBarber', () => {
    const createBarberDto: CreateBarberDto = {
      userId: 'user-123',
      licenseNumber: 'BARBER123',
      licenseExpiryDate: '2025-12-31',
      yearsOfExperience: 5,
      bio: 'Professional barber with 5 years of experience',
    };

    const mockBarber: Barber = {
      id: '1',
      userId: 'user-123',
      licenseNumber: 'BARBER123',
      licenseExpiryDate: new Date('2025-12-31'),
      experienceLevel: ExperienceLevel.MID_LEVEL,
      yearsOfExperience: 5,
      bio: 'Professional barber with 5 years of experience',
      professionalSummary: 'Expert in modern and classic haircuts',
      skills: ['Hair cutting', 'Beard trimming', 'Shaving'],
      certifications: ['Barber License', 'Advanced Hair Cutting'],
      portfolioPhotos: ['photo1.jpg', 'photo2.jpg'],
      specialties: [],
      services: [],
      location: null,
      schedules: [],
      averageRating: 4.5,
      totalReviews: 10,
      totalBookings: 50,
      completedBookings: 45,
      totalEarnings: 5000,
      isAvailable: true,
      isVerified: true,
      acceptsWalkIns: true,
      bufferTimeMinutes: 15,
      status: BarberStatus.ACTIVE,
      workingHours: { monday: '9:00-18:00', tuesday: '9:00-18:00' },
      holidays: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      isLicenseValid: () => true,
      getExperienceLevel: () => ExperienceLevel.MID_LEVEL,
      updateRating: (rating: number) => {},
      incrementBookings: () => {},
      addEarnings: (amount: number) => {},
    };

    it('should create a barber successfully', async () => {
      jest.spyOn(barberRepository, 'findOne').mockResolvedValue(null);
      jest.spyOn(barberRepository, 'create').mockReturnValue(mockBarber);
      jest.spyOn(barberRepository, 'save').mockResolvedValue(mockBarber);

      const result = await service.createBarber(createBarberDto);

      expect(result).toBeDefined();
      expect(result.licenseNumber).toBe('BARBER123');
      expect(result.yearsOfExperience).toBe(5);
    });

    it('should throw ConflictException if email already exists', async () => {
      jest.spyOn(barberRepository, 'findOne').mockResolvedValue(mockBarber);

      await expect(service.createBarber(createBarberDto)).rejects.toThrow(ConflictException);
    });

    it('should throw BadRequestException if license expiry date is in the past', async () => {
      const invalidDto = {
        ...createBarberDto,
        licenseExpiryDate: '2020-01-01',
      };

      jest.spyOn(barberRepository, 'findOne').mockResolvedValue(null);

      await expect(service.createBarber(invalidDto)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if years of experience is negative', async () => {
      const invalidDto = {
        ...createBarberDto,
        yearsOfExperience: -1,
      };

      jest.spyOn(barberRepository, 'findOne').mockResolvedValue(null);

      await expect(service.createBarber(invalidDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('findBarberById', () => {
    const mockBarber: Barber = {
      id: '1',
      userId: 'user-123',
      licenseNumber: 'BARBER123',
      licenseExpiryDate: new Date('2025-12-31'),
      experienceLevel: ExperienceLevel.MID_LEVEL,
      yearsOfExperience: 5,
      bio: 'Professional barber with 5 years of experience',
      professionalSummary: 'Expert in modern and classic haircuts',
      skills: ['Hair cutting', 'Beard trimming', 'Shaving'],
      certifications: ['Barber License', 'Advanced Hair Cutting'],
      portfolioPhotos: ['photo1.jpg', 'photo2.jpg'],
      specialties: [],
      services: [],
      location: null,
      schedules: [],
      averageRating: 4.5,
      totalReviews: 10,
      totalBookings: 50,
      completedBookings: 45,
      totalEarnings: 5000,
      isAvailable: true,
      isVerified: true,
      acceptsWalkIns: true,
      bufferTimeMinutes: 15,
      status: BarberStatus.ACTIVE,
      workingHours: { monday: '9:00-18:00', tuesday: '9:00-18:00' },
      holidays: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      isLicenseValid: () => true,
      getExperienceLevel: () => ExperienceLevel.MID_LEVEL,
      updateRating: (rating: number) => {},
      incrementBookings: () => {},
      addEarnings: (amount: number) => {},
    };

    it('should return a barber when found', async () => {
      jest.spyOn(barberRepository, 'findOne').mockResolvedValue(mockBarber);

      const result = await service.findBarberById('1');

      expect(result).toBeDefined();
      expect(result.licenseNumber).toBe('BARBER123');
    });

    it('should throw NotFoundException when barber not found', async () => {
      jest.spyOn(barberRepository, 'findOne').mockResolvedValue(null);

      await expect(service.findBarberById('999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateBarber', () => {
    const updateBarberDto = {
      yearsOfExperience: 6,
    };

    const existingBarber: Barber = {
      id: '1',
      userId: 'user-123',
      licenseNumber: 'BARBER123',
      licenseExpiryDate: new Date('2025-12-31'),
      experienceLevel: ExperienceLevel.MID_LEVEL,
      yearsOfExperience: 5,
      bio: 'Professional barber with 5 years of experience',
      professionalSummary: 'Expert in modern and classic haircuts',
      skills: ['Hair cutting', 'Beard trimming', 'Shaving'],
      certifications: ['Barber License', 'Advanced Hair Cutting'],
      portfolioPhotos: ['photo1.jpg', 'photo2.jpg'],
      specialties: [],
      services: [],
      location: null,
      schedules: [],
      averageRating: 4.5,
      totalReviews: 10,
      totalBookings: 50,
      completedBookings: 45,
      totalEarnings: 5000,
      isAvailable: true,
      isVerified: true,
      acceptsWalkIns: true,
      bufferTimeMinutes: 15,
      status: BarberStatus.ACTIVE,
      workingHours: { monday: '9:00-18:00', tuesday: '9:00-18:00' },
      holidays: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      isLicenseValid: () => true,
      getExperienceLevel: () => ExperienceLevel.MID_LEVEL,
      updateRating: (rating: number) => {},
      incrementBookings: () => {},
      addEarnings: (amount: number) => {},
    };

    const updatedBarber: Barber = {
      ...existingBarber,
      ...updateBarberDto,
      isLicenseValid: () => true,
      getExperienceLevel: () => ExperienceLevel.MID_LEVEL,
      updateRating: (rating: number) => {},
      incrementBookings: () => {},
      addEarnings: (amount: number) => {},
    };

    it('should update a barber successfully', async () => {
      jest.spyOn(barberRepository, 'findOne').mockResolvedValue(existingBarber);
      jest.spyOn(barberRepository, 'save').mockResolvedValue(updatedBarber);

      const result = await service.updateBarber('1', updateBarberDto);

      expect(result.yearsOfExperience).toBe(6);
    });

    it('should throw NotFoundException when barber not found', async () => {
      jest.spyOn(barberRepository, 'findOne').mockResolvedValue(null);

      await expect(service.updateBarber('999', updateBarberDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteBarber', () => {
    const mockBarber: Barber = {
      id: '1',
      userId: 'user-123',
      licenseNumber: 'BARBER123',
      licenseExpiryDate: new Date('2025-12-31'),
      experienceLevel: ExperienceLevel.MID_LEVEL,
      yearsOfExperience: 5,
      bio: 'Professional barber with 5 years of experience',
      professionalSummary: 'Expert in modern and classic haircuts',
      skills: ['Hair cutting', 'Beard trimming', 'Shaving'],
      certifications: ['Barber License', 'Advanced Hair Cutting'],
      portfolioPhotos: ['photo1.jpg', 'photo2.jpg'],
      specialties: [],
      services: [],
      location: null,
      schedules: [],
      averageRating: 4.5,
      totalReviews: 10,
      totalBookings: 50,
      completedBookings: 45,
      totalEarnings: 5000,
      isAvailable: true,
      isVerified: true,
      acceptsWalkIns: true,
      bufferTimeMinutes: 15,
      status: BarberStatus.ACTIVE,
      workingHours: { monday: '9:00-18:00', tuesday: '9:00-18:00' },
      holidays: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      isLicenseValid: () => true,
      getExperienceLevel: () => ExperienceLevel.MID_LEVEL,
      updateRating: (rating: number) => {},
      incrementBookings: () => {},
      addEarnings: (amount: number) => {},
    };

    it('should delete a barber successfully', async () => {
      jest.spyOn(barberRepository, 'findOne').mockResolvedValue(mockBarber);
      jest.spyOn(serviceRepository, 'count').mockResolvedValue(0);
      jest.spyOn(barberRepository, 'remove').mockResolvedValue(mockBarber);

      await service.deleteBarber('1');

      expect(barberRepository.remove).toHaveBeenCalledWith(mockBarber);
    });

    it('should throw BadRequestException if barber has active services', async () => {
      jest.spyOn(barberRepository, 'findOne').mockResolvedValue(mockBarber);
      jest.spyOn(serviceRepository, 'count').mockResolvedValue(2);

      await expect(service.deleteBarber('1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('Specialty methods', () => {
    const createSpecialtyDto: CreateSpecialtyDto = {
      name: 'Hair Cutting',
      description: 'Professional hair cutting services',
      category: SpecialtyCategory.HAIRCUT,
    };

    const mockSpecialty: Specialty = {
      id: '1',
      name: 'Hair Cutting',
      description: 'Professional hair cutting services',
      category: SpecialtyCategory.HAIRCUT,
      level: SpecialtyLevel.BASIC,
      requirements: 'Basic certification required',
      minExperienceYears: 1,
      requiredCertifications: ['Basic certification'],
      toolsRequired: ['Scissors', 'Comb'],
      averageDuration: 30,
      basePrice: 25,
      complexity: 3,
      isActive: true,
      requiresCertification: false,
      tags: ['hair', 'cutting', 'basic'],
      barber: null,
      barberId: null,
      services: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      isAvailableFor: (barberExperience: number) => barberExperience >= 1,
      getEstimatedPrice: (basePrice: number, experienceLevel: number) => 25,
      matchesSearch: (query: string) => true,
    };

    describe('createSpecialty', () => {
      it('should create a specialty successfully', async () => {
        jest.spyOn(specialtyRepository, 'findOne').mockResolvedValue(null);
        jest.spyOn(specialtyRepository, 'create').mockReturnValue(mockSpecialty);
        jest.spyOn(specialtyRepository, 'save').mockResolvedValue(mockSpecialty);

        const result = await service.createSpecialty(createSpecialtyDto);

        expect(result.name).toBe('Hair Cutting');
        expect(result.category).toBe(SpecialtyCategory.HAIRCUT);
      });

      it('should throw ConflictException if specialty name already exists', async () => {
        jest.spyOn(specialtyRepository, 'findOne').mockResolvedValue(mockSpecialty);

        await expect(service.createSpecialty(createSpecialtyDto)).rejects.toThrow(ConflictException);
      });
    });
  });

  describe('Service methods', () => {
    const createServiceDto: CreateServiceDto = {
      name: 'Premium Haircut',
      description: 'High-quality haircut service',
      basePrice: 50,
      duration: 45,
      specialtyId: '1',
    };

    const mockBarber: Barber = {
      id: '1',
      userId: 'user-123',
      licenseNumber: 'BARBER123',
      licenseExpiryDate: new Date('2025-12-31'),
      experienceLevel: ExperienceLevel.MID_LEVEL,
      yearsOfExperience: 5,
      bio: 'Professional barber with 5 years of experience',
      professionalSummary: 'Expert in modern and classic haircuts',
      skills: ['Hair cutting', 'Beard trimming', 'Shaving'],
      certifications: ['Barber License', 'Advanced Hair Cutting'],
      portfolioPhotos: ['photo1.jpg', 'photo2.jpg'],
      specialties: [],
      services: [],
      location: null,
      schedules: [],
      averageRating: 4.5,
      totalReviews: 10,
      totalBookings: 50,
      completedBookings: 45,
      totalEarnings: 5000,
      isAvailable: true,
      isVerified: true,
      acceptsWalkIns: true,
      bufferTimeMinutes: 15,
      status: BarberStatus.ACTIVE,
      workingHours: { monday: '9:00-18:00', tuesday: '9:00-18:00' },
      holidays: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      isLicenseValid: () => true,
      getExperienceLevel: () => ExperienceLevel.MID_LEVEL,
      updateRating: (rating: number) => {},
      incrementBookings: () => {},
      addEarnings: (amount: number) => {},
    };

    const mockSpecialty: Specialty = {
      id: '1',
      name: 'Hair Cutting',
      description: 'Professional hair cutting services',
      category: SpecialtyCategory.HAIRCUT,
      level: SpecialtyLevel.BASIC,
      requirements: 'Basic certification required',
      minExperienceYears: 1,
      requiredCertifications: ['Basic certification'],
      toolsRequired: ['Scissors', 'Comb'],
      averageDuration: 30,
      basePrice: 25,
      complexity: 3,
      isActive: true,
      requiresCertification: false,
      tags: ['hair', 'cutting', 'basic'],
      barber: null,
      barberId: null,
      services: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      isAvailableFor: (barberExperience: number) => barberExperience >= 1,
      getEstimatedPrice: (basePrice: number, experienceLevel: number) => 25,
      matchesSearch: (query: string) => true,
    };

    const mockService: Service = {
      id: '1',
      name: 'Premium Haircut',
      description: 'High-quality haircut service',
      shortDescription: 'Premium haircut',
      detailedDescription: 'Detailed premium haircut service',
      status: ServiceStatus.ACTIVE,
      gender: ServiceGender.UNISEX,
      basePrice: 50,
      promotionalPrice: null,
      duration: 45,
      durationUnit: ServiceDurationUnit.MINUTES,
      minDuration: 30,
      maxDuration: 60,
      bufferTime: 5,
      includedServices: [],
      additionalServices: [],
      requirements: [],
      contraindications: [],
      photos: [],
      tags: ['premium', 'haircut'],
      requiresConsultation: false,
      isPackage: false,
      maxClients: 1,
      availableFrom: null,
      availableUntil: null,
      seasonalAvailability: null,
      popularity: 8,
      bookingCount: 25,
      averageRating: 4.5,
      reviewCount: 10,
      barber: mockBarber,
      barberId: '1',
      specialty: mockSpecialty,
      specialtyId: '1',
      createdAt: new Date(),
      updatedAt: new Date(),
      isAvailable: () => true,
      getTotalDurationWithBuffer: () => 50,
      getCurrentPrice: () => 50,
      isSeasonallyAvailable: () => true,
      getDurationInMinutes: () => 45,
      updateRating: (newRating: number) => {},
      updatePopularity: () => {},
      incrementBookingCount: () => {},
      matchesSearch: (query: string) => true,
      getPriceRange: () => ({ min: 50, max: 75 }),
    };

    describe('createService', () => {
      it('should create a service successfully', async () => {
        jest.spyOn(barberRepository, 'findOne').mockResolvedValue(mockBarber);
        jest.spyOn(specialtyRepository, 'findOne').mockResolvedValue(mockSpecialty);
        jest.spyOn(serviceRepository, 'create').mockReturnValue(mockService);
        jest.spyOn(serviceRepository, 'save').mockResolvedValue(mockService);

        const result = await service.createService('1', createServiceDto);

        expect(result.name).toBe('Premium Haircut');
        expect(result.basePrice).toBe(50);
        expect(result.duration).toBe(45);
      });

      it('should throw NotFoundException if barber not found', async () => {
        jest.spyOn(barberRepository, 'findOne').mockResolvedValue(null);

        await expect(service.createService('1', createServiceDto)).rejects.toThrow(NotFoundException);
      });

      it('should throw BadRequestException if price is negative', async () => {
        jest.spyOn(barberRepository, 'findOne').mockResolvedValue(mockBarber);
        jest.spyOn(specialtyRepository, 'findOne').mockResolvedValue(mockSpecialty);
        
        const invalidDto = { ...createServiceDto, basePrice: -10 };

        await expect(service.createService('1', invalidDto)).rejects.toThrow(BadRequestException);
      });

      it('should throw BadRequestException if duration is not positive', async () => {
        jest.spyOn(barberRepository, 'findOne').mockResolvedValue(mockBarber);
        jest.spyOn(specialtyRepository, 'findOne').mockResolvedValue(mockSpecialty);
        
        const invalidDto = { ...createServiceDto, duration: 0 };

        await expect(service.createService('1', invalidDto)).rejects.toThrow(BadRequestException);
      });
    });
  });

  describe('Location methods', () => {
    describe('addBarberLocation', () => {
      it('should add a location to a barber', async () => {
        const mockBarber: Barber = {
          id: '1',
          userId: 'user-123',
          licenseNumber: 'BARBER123',
          licenseExpiryDate: new Date('2025-12-31'),
          experienceLevel: ExperienceLevel.MID_LEVEL,
          yearsOfExperience: 5,
          bio: 'Professional barber with 5 years of experience',
          professionalSummary: 'Expert in modern and classic haircuts',
          skills: ['Hair cutting', 'Beard trimming', 'Shaving'],
          certifications: ['Barber License', 'Advanced Hair Cutting'],
          portfolioPhotos: ['photo1.jpg', 'photo2.jpg'],
          specialties: [],
          services: [],
          location: null,
          schedules: [],
          averageRating: 4.5,
          totalReviews: 10,
          totalBookings: 50,
          completedBookings: 45,
          totalEarnings: 5000,
          isAvailable: true,
          isVerified: true,
          acceptsWalkIns: true,
          bufferTimeMinutes: 15,
          status: BarberStatus.ACTIVE,
          workingHours: { monday: '9:00-18:00', tuesday: '9:00-18:00' },
          holidays: [],
          createdAt: new Date(),
          updatedAt: new Date(),
          isLicenseValid: () => true,
          getExperienceLevel: () => ExperienceLevel.MID_LEVEL,
          updateRating: (rating: number) => {},
          incrementBookings: () => {},
          addEarnings: (amount: number) => {},
        };

        const locationData = {
          address: '123 Main St',
          latitude: 40.7128,
          longitude: -74.0060,
          isPrimary: true,
        };

        const mockLocation: Partial<BarberLocation> = {
          id: '1',
          ...locationData,
          locationType: LocationType.BARBERSHOP,
          establishmentName: 'Barber Shop',
          description: 'Main location',
          neighborhood: 'Downtown',
          city: 'New York',
          state: 'NY',
          country: 'USA',
          postalCode: '10001',
          phoneNumber: '+1234567890',
          email: 'shop@example.com',
          website: 'www.example.com',
          barber: mockBarber,
          barberId: '1',
          isActive: true,
          averageRating: 4.5,
          reviewCount: 10,
          totalAppointments: 50,
          hasParking: false,
          isWheelchairAccessible: false,
          isPublicTransportAccessible: true,
          establishmentSize: EstablishmentSize.INDIVIDUAL,
          numberOfStations: 1,
          numberOfBarbers: 1,
          googlePlaceId: null,
          businessHours: null,
          amenities: [],
          paymentMethods: [],
          coordinatesAccuracy: null,
          photos: [],
          timezone: 'America/New_York',
          floor: null,
          apartment: null,
          reference: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          getFullAddress: () => '123 Main St, Downtown, New York, NY',
          getShortAddress: () => 'Downtown, NY',
          isCurrentlyOpen: () => true,
          getDistanceFrom: (lat: number, lng: number) => 0,
          acceptsPaymentMethod: (method: string) => false,
          hasAmenity: (amenity: string) => false,
          updateRating: (newRating: number) => {},
          incrementAppointmentCount: () => {},
          getCoordinates: () => ({ lat: 40.7128, lng: -74.0060 }),
          setCoordinates: (lat: number, lng: number) => {},
        };

        jest.spyOn(barberRepository, 'findOne').mockResolvedValue(mockBarber);
        jest.spyOn(barberLocationRepository, 'update').mockResolvedValue({ affected: 1, raw: {}, generatedMaps: [] });
        jest.spyOn(barberLocationRepository, 'create').mockReturnValue(mockLocation as any);
        jest.spyOn(barberLocationRepository, 'save').mockResolvedValue(mockLocation as any);

        const result = await service.addBarberLocation('1', locationData);

        expect(result.address).toBe('123 Main St');
        expect(result.latitude).toBe(40.7128);
        expect(result.longitude).toBe(-74.0060);
      });

      it('should throw NotFoundException if barber not found', async () => {
        jest.spyOn(barberRepository, 'findOne').mockResolvedValue(null);

        await expect(service.addBarberLocation('999', {} as any)).rejects.toThrow(NotFoundException);
      });
    });
  });
});
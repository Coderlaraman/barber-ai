import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  ValidationPipe,
} from '@nestjs/common';
import { BarberService } from '../services/barber.service';
import { CreateBarberDto, UpdateBarberDto } from '../dto/barber.dto';
import { CreateSpecialtyDto, UpdateSpecialtyDto } from '../dto/specialty.dto';
import { CreateServiceDto, UpdateServiceDto, ServiceSearchDto } from '../dto/service.dto';

@Controller('barbers')
export class BarberController {
  constructor(private readonly barberService: BarberService) {}

  // ===== BARBER ENDPOINTS =====

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createBarber(@Body(ValidationPipe) createBarberDto: CreateBarberDto) {
    return this.barberService.createBarber(createBarberDto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async findAllBarbers() {
    return this.barberService.findAllBarbers();
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findBarberById(@Param('id') id: string) {
    return this.barberService.findBarberById(id);
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  async updateBarber(
    @Param('id') id: string,
    @Body(ValidationPipe) updateBarberDto: UpdateBarberDto,
  ) {
    return this.barberService.updateBarber(id, updateBarberDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteBarber(@Param('id') id: string) {
    await this.barberService.deleteBarber(id);
  }

  // ===== SPECIALTY ENDPOINTS =====

  @Post('specialties')
  @HttpCode(HttpStatus.CREATED)
  async createSpecialty(@Body(ValidationPipe) createSpecialtyDto: CreateSpecialtyDto) {
    return this.barberService.createSpecialty(createSpecialtyDto);
  }

  @Get('specialties')
  @HttpCode(HttpStatus.OK)
  async findAllSpecialties() {
    return this.barberService.findAllSpecialties();
  }

  @Get('specialties/:id')
  @HttpCode(HttpStatus.OK)
  async findSpecialtyById(@Param('id') id: string) {
    return this.barberService.findSpecialtyById(id);
  }

  @Put('specialties/:id')
  @HttpCode(HttpStatus.OK)
  async updateSpecialty(
    @Param('id') id: string,
    @Body(ValidationPipe) updateSpecialtyDto: UpdateSpecialtyDto,
  ) {
    return this.barberService.updateSpecialty(id, updateSpecialtyDto);
  }

  @Delete('specialties/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteSpecialty(@Param('id') id: string) {
    await this.barberService.deleteSpecialty(id);
  }

  // ===== SERVICE ENDPOINTS =====

  @Post('services')
  @HttpCode(HttpStatus.CREATED)
  async createService(@Body(ValidationPipe) createServiceDto: CreateServiceDto) {
    return this.barberService.createService(createServiceDto);
  }

  @Get('services')
  @HttpCode(HttpStatus.OK)
  async findAllServices(@Query(ValidationPipe) searchDto?: ServiceSearchDto) {
    return this.barberService.findAllServices(searchDto);
  }

  @Get('services/:id')
  @HttpCode(HttpStatus.OK)
  async findServiceById(@Param('id') id: string) {
    return this.barberService.findServiceById(id);
  }

  @Put('services/:id')
  @HttpCode(HttpStatus.OK)
  async updateService(
    @Param('id') id: string,
    @Body(ValidationPipe) updateServiceDto: UpdateServiceDto,
  ) {
    return this.barberService.updateService(id, updateServiceDto);
  }

  @Delete('services/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteService(@Param('id') id: string) {
    await this.barberService.deleteService(id);
  }

  // ===== LOCATION ENDPOINTS =====

  @Post(':id/locations')
  @HttpCode(HttpStatus.CREATED)
  async addBarberLocation(
    @Param('id') barberId: string,
    @Body(ValidationPipe) locationData: {
      address: string;
      latitude: number;
      longitude: number;
      isPrimary?: boolean;
    },
  ) {
    return this.barberService.addBarberLocation(barberId, locationData);
  }

  @Get('nearby')
  @HttpCode(HttpStatus.OK)
  async findBarbersNearby(
    @Query('lat') latitude: number,
    @Query('lng') longitude: number,
    @Query('radius') radius: number = 5,
  ) {
    return this.barberService.findBarbersNearby(latitude, longitude, radius);
  }
}
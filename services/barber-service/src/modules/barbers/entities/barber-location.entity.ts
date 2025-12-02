import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Barber } from './barber.entity';

export enum LocationType {
  BARBERSHOP = 'barbershop',
  HOME_STUDIO = 'home_studio',
  MOBILE_SERVICE = 'mobile_service',
  SALON = 'salon',
  PRIVATE_STUDIO = 'private_studio',
}

export enum EstablishmentSize {
  INDIVIDUAL = 'individual', // Solo un barbero
  SMALL = 'small', // 2-5 barberos
  MEDIUM = 'medium', // 6-15 barberos
  LARGE = 'large', // 16+ barberos
}

@Entity('barber_locations')
export class BarberLocation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: LocationType, default: LocationType.BARBERSHOP })
  locationType: LocationType;

  @Column({ length: 200 })
  establishmentName: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ length: 200 })
  address: string;

  @Column({ length: 100, nullable: true })
  neighborhood: string;

  @Column({ length: 100 })
  city: string;

  @Column({ length: 50 })
  state: string;

  @Column({ length: 20, nullable: true })
  postalCode: string;

  @Column({ length: 100, nullable: true })
  country: string;

  @Column({ type: 'decimal', precision: 10, scale: 8 })
  latitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 8 })
  longitude: number;

  @Column({ length: 50, nullable: true })
  floor: string; // Piso o departamento

  @Column({ length: 50, nullable: true })
  apartment: string; // Número de apartamento

  @Column({ length: 50, nullable: true })
  reference: string; // Referencias para encontrar el lugar

  @Column({ type: 'boolean', default: false })
  hasParking: boolean;

  @Column({ type: 'boolean', default: false })
  isWheelchairAccessible: boolean;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'boolean', default: false })
  isPublicTransportAccessible: boolean;

  @Column({ type: 'enum', enum: EstablishmentSize, default: EstablishmentSize.INDIVIDUAL })
  establishmentSize: EstablishmentSize;

  @Column({ type: 'integer', nullable: true })
  numberOfStations: number; // Número de estaciones de trabajo

  @Column({ type: 'integer', nullable: true })
  numberOfBarbers: number; // Número de barberos en el establecimiento

  @Column({ type: 'text', nullable: true })
  phoneNumber: string;

  @Column({ type: 'text', nullable: true })
  website: string;

  @Column({ type: 'text', nullable: true })
  email: string;

  @Column({ type: 'jsonb', nullable: true })
  businessHours: Record<string, any>; // Horario de atención del establecimiento

  @Column({ type: 'jsonb', nullable: true })
  amenities: string[]; // Comodidades (WiFi, café, música, etc.)

  @Column({ type: 'jsonb', nullable: true })
  photos: string[]; // Fotos del establecimiento

  @Column({ type: 'jsonb', nullable: true })
  paymentMethods: string[]; // Métodos de pago aceptados

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  averageRating: number;

  @Column({ type: 'integer', default: 0 })
  reviewCount: number;

  @Column({ type: 'integer', default: 0 })
  totalAppointments: number;

  @Column({ type: 'text', nullable: true })
  googlePlaceId: string; // ID de Google Places

  @Column({ type: 'jsonb', nullable: true })
  coordinatesAccuracy: Record<string, any>; // Precisión de las coordenadas

  @Column({ type: 'text', nullable: true })
  timezone: string; // Zona horaria

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relación con Barber
  @OneToOne(() => Barber, (barber) => barber.location)
  @JoinColumn()
  barber: Barber;

  @Column({ unique: true })
  barberId: string;

  // Métodos de utilidad
  getFullAddress(): string {
    const parts = [
      this.address,
      this.floor,
      this.apartment,
      this.neighborhood,
      this.city,
      this.state,
      this.postalCode,
      this.country,
    ].filter(Boolean);
    
    return parts.join(', ');
  }

  getShortAddress(): string {
    return `${this.neighborhood || this.city}, ${this.state}`;
  }

  isCurrentlyOpen(now: Date = new Date()): boolean {
    if (!this.businessHours) return true;
    
    const dayOfWeek = now.getDay(); // 0 = Domingo
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const dayName = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][dayOfWeek];
    const dayHours = this.businessHours[dayName];
    
    if (!dayHours || !dayHours.open || !dayHours.close) return true;
    
    const [openHour, openMinute] = dayHours.open.split(':').map(Number);
    const [closeHour, closeMinute] = dayHours.close.split(':').map(Number);
    
    const openTime = openHour * 60 + openMinute;
    const closeTime = closeHour * 60 + closeMinute;
    
    return currentTime >= openTime && currentTime <= closeTime;
  }

  getDistanceFrom(lat: number, lng: number): number {
    // Fórmula de Haversine para calcular distancia
    const R = 6371; // Radio de la Tierra en km
    const dLat = this.toRadians(lat - this.latitude);
    const dLng = this.toRadians(lng - this.longitude);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(this.latitude)) * Math.cos(this.toRadians(lat)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distancia en km
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  acceptsPaymentMethod(method: string): boolean {
    return this.paymentMethods?.includes(method) || false;
  }

  hasAmenity(amenity: string): boolean {
    return this.amenities?.includes(amenity) || false;
  }

  updateRating(newRating: number): void {
    const total = this.averageRating * this.reviewCount + newRating;
    this.reviewCount += 1;
    this.averageRating = Number((total / this.reviewCount).toFixed(2));
  }

  incrementAppointmentCount(): void {
    this.totalAppointments += 1;
  }

  getCoordinates(): { lat: number; lng: number } {
    return {
      lat: this.latitude,
      lng: this.longitude,
    };
  }

  setCoordinates(lat: number, lng: number): void {
    this.latitude = lat;
    this.longitude = lng;
  }
}
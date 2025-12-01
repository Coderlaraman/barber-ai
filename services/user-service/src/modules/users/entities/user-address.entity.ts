import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from './user.entity';

export enum AddressType {
  HOME = 'home',
  WORK = 'work',
  OTHER = 'other'
}

@Entity('user_addresses')
export class UserAddress {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, user => user.addresses, { onDelete: 'CASCADE' })
  user: User;

  @Column({ type: 'enum', enum: AddressType, default: AddressType.HOME })
  type: AddressType;

  @Column()
  street: string;

  @Column({ nullable: true })
  number: string;

  @Column({ nullable: true })
  apartment: string;

  @Column()
  neighborhood: string;

  @Column()
  city: string;

  @Column()
  state: string;

  @Column()
  country: string;

  @Column({ length: 10 })
  postalCode: string;

  @Column({ type: 'decimal', precision: 10, scale: 8, nullable: true })
  latitude: number;

  @Column({ type: 'decimal', precision: 11, scale: 8, nullable: true })
  longitude: number;

  @Column({ default: false })
  isDefault: boolean;

  @Column({ default: true })
  isActive: boolean;

  @Column({ length: 500, nullable: true })
  reference: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  get fullAddress(): string {
    const parts = [
      this.street,
      this.number,
      this.apartment,
      this.neighborhood,
      this.city,
      this.state,
      this.country,
      this.postalCode
    ].filter(Boolean);
    
    return parts.join(', ');
  }

  get shortAddress(): string {
    return `${this.street} ${this.number || ''}, ${this.neighborhood}, ${this.city}`;
  }
}
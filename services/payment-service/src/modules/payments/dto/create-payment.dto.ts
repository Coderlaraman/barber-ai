import { IsEnum, IsNumber, IsString, IsOptional, IsUUID, Min, IsEmail } from 'class-validator'
import { PaymentType, PaymentProvider } from '../entities/payment.entity'

export class CreatePaymentDto {
  @IsUUID()
  userId: string

  @IsOptional()
  @IsUUID()
  barberId?: string

  @IsOptional()
  @IsUUID()
  bookingId?: string

  @IsEnum(PaymentType)
  type: PaymentType

  @IsNumber()
  @Min(0.01)
  amount: number

  @IsString()
  currency: string

  @IsEnum(PaymentProvider)
  provider: PaymentProvider

  @IsOptional()
  @IsEmail()
  customerEmail?: string

  @IsOptional()
  @IsString()
  customerName?: string

  @IsOptional()
  @IsString()
  description?: string

  @IsOptional()
  metadata?: Record<string, any>
}
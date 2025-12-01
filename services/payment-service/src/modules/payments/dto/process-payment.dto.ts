import { IsUUID, IsOptional, IsString } from 'class-validator'

export class ProcessPaymentDto {
  @IsUUID()
  paymentId: string

  @IsUUID()
  walletId: string

  @IsOptional()
  @IsString()
  paymentMethodId?: string

  @IsOptional()
  @IsString()
  customerId?: string

  @IsOptional()
  metadata?: Record<string, any>
}
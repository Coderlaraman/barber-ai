import { IsNumber, IsUUID, IsOptional, IsString, Min } from 'class-validator'

export class CreditWalletDto {
  @IsUUID()
  walletId: string

  @IsNumber()
  @Min(0.01)
  amount: number

  @IsOptional()
  @IsString()
  description?: string

  @IsOptional()
  metadata?: Record<string, any>
}
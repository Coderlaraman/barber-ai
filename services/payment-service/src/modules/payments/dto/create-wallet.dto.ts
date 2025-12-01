import { IsEnum, IsString, IsOptional, IsUUID } from 'class-validator'
import { WalletType } from '../enums/wallet-type.enum'

export class CreateWalletDto {
  @IsUUID()
  userId: string

  @IsEnum(['CLIENT', 'BARBER', 'PLATFORM'])
  type: WalletType

  @IsOptional()
  @IsString()
  currency?: string = 'USD'

  @IsOptional()
  metadata?: Record<string, any>
}
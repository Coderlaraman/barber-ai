import { IsEmail, IsNotEmpty, IsString } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class VerifyEmailDto {
  @ApiProperty({ description: 'Token de verificación enviado por email' })
  @IsString()
  @IsNotEmpty()
  token!: string
}

export class ResendVerificationDto {
  @ApiProperty({ description: 'Email del usuario' })
  @IsEmail()
  @IsNotEmpty()
  email!: string
}
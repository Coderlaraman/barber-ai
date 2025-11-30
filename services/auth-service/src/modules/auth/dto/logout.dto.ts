import { IsString, IsOptional } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class LogoutDto {
  @ApiProperty({
    description: 'Optional refresh token to invalidate',
    required: false,
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  })
  @IsString()
  @IsOptional()
  refreshToken?: string
}
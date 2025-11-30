import { IsString, IsEmail, IsOptional } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class SocialAuthDto {
  @ApiProperty({
    description: 'OAuth provider (google, facebook, etc.)',
    example: 'google',
    enum: ['google', 'facebook']
  })
  @IsString()
  provider!: string

  @ApiProperty({
    description: 'OAuth access token from the provider',
    example: 'ya29.a0AfH6SMBx...'
  })
  @IsString()
  accessToken!: string

  @ApiProperty({
    description: 'User email from OAuth provider',
    example: 'user@example.com',
    required: false
  })
  @IsEmail()
  @IsOptional()
  email?: string

  @ApiProperty({
    description: 'User name from OAuth provider',
    example: 'John Doe',
    required: false
  })
  @IsString()
  @IsOptional()
  name?: string
}
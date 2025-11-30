import { IsEnum, IsOptional, IsString, IsDateString } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'
import { AuditAction, AuditStatus } from '../entities/access-audit.entity'

export class AuditQueryDto {
  @ApiProperty({
    description: 'Filter by user ID',
    required: false,
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsString()
  @IsOptional()
  userId?: string

  @ApiProperty({
    description: 'Filter by audit action',
    required: false,
    enum: AuditAction,
    example: 'LOGIN'
  })
  @IsEnum(AuditAction)
  @IsOptional()
  action?: AuditAction

  @ApiProperty({
    description: 'Filter by audit status',
    required: false,
    enum: AuditStatus,
    example: 'FAILURE'
  })
  @IsEnum(AuditStatus)
  @IsOptional()
  status?: AuditStatus

  @ApiProperty({
    description: 'Start date for filtering (ISO format)',
    required: false,
    example: '2024-01-01T00:00:00.000Z'
  })
  @IsDateString()
  @IsOptional()
  startDate?: string

  @ApiProperty({
    description: 'End date for filtering (ISO format)',
    required: false,
    example: '2024-12-31T23:59:59.999Z'
  })
  @IsDateString()
  @IsOptional()
  endDate?: string
}
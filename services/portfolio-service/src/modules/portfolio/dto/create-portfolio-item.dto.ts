import { ApiProperty } from '@nestjs/swagger'
import { IsString, IsOptional, IsArray } from 'class-validator'

export class CreatePortfolioItemDto {
  @ApiProperty({
    description: 'ID del barbero',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: true,
  })
  @IsString()
  barberId!: string

  @ApiProperty({
    description: 'Título del trabajo/portfolio',
    example: 'Corte clásico con degradado',
    required: true,
  })
  @IsString()
  title!: string

  @ApiProperty({
    description: 'Array de etiquetas/tags para categorizar el trabajo',
    example: ['corte-clasico', 'degradado', 'hombre'],
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[]
}
import { ApiProperty } from '@nestjs/swagger'
import { IsString, IsOptional, IsArray } from 'class-validator'

export class UpdatePortfolioItemDto {
  @ApiProperty({
    description: 'Título del trabajo del portafolio',
    example: 'Corte de pelo moderno con fade',
    required: false,
  })
  @IsString()
  @IsOptional()
  title?: string

  @ApiProperty({
    description: 'Descripción detallada del trabajo',
    example: 'Corte moderno con técnica fade bajo y diseño en la parte superior',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string

  @ApiProperty({
    description: 'URL de la imagen del trabajo',
    example: 'https://example.com/images/haircut1.jpg',
    required: false,
  })
  @IsString()
  @IsOptional()
  imageUrl?: string

  @ApiProperty({
    description: 'Etiquetas para categorizar el trabajo',
    example: ['corte', 'fade', 'moderno'],
    type: [String],
    required: false,
  })
  @IsArray()
  @IsOptional()
  tags?: string[]

  @ApiProperty({
    description: 'Metadatos adicionales del trabajo',
    example: { duracion: '45min', precio: 25, tecnica: 'fade bajo' },
    required: false,
  })
  @IsOptional()
  metadata?: Record<string, any>
}
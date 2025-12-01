import { ApiProperty } from '@nestjs/swagger'

export class PortfolioItemResponseDto {
  @ApiProperty({
    description: 'ID único del elemento del portafolio',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id!: string

  @ApiProperty({
    description: 'ID del barbero propietario',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  barberId!: string

  @ApiProperty({
    description: 'Título del trabajo/portfolio',
    example: 'Corte clásico con degradado',
  })
  title!: string

  @ApiProperty({
    description: 'Array de etiquetas/tags para categorizar el trabajo',
    example: ['corte-clasico', 'degradado', 'hombre'],
    type: [String],
    required: false,
  })
  tags?: string[]

  @ApiProperty({
    description: 'Descripción del trabajo/portfolio',
    example: 'Corte clásico con degradado perfecto para caballeros',
    required: false,
  })
  description?: string

  @ApiProperty({
    description: 'URL de la imagen del trabajo',
    example: 'https://example.com/image.jpg',
    required: false,
  })
  imageUrl?: string

  @ApiProperty({
    description: 'Fecha de creación',
    example: '2023-12-01T10:00:00.000Z',
  })
  createdAt!: Date
}
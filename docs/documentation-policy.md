# Política de Documentación Obligatoria para Nuevos Endpoints

## 📋 Resumen Ejecutivo

Esta política establece los estándares obligatorios de documentación para todos los nuevos endpoints en el sistema Barber AI. La documentación es un requisito fundamental para mantener la calidad, consistencia y mantenibilidad del código a lo largo del tiempo.

## 🎯 Objetivos

- **Consistencia**: Garantizar que todos los endpoints sigan los mismos estándares de documentación
- **Claridad**: Facilitar la comprensión y uso de las APIs por parte de otros desarrolladores
- **Mantenibilidad**: Reducir el tiempo de onboarding y mantenimiento del código
- **Calidad**: Prevenir errores y malentendidos en la implementación
- **Automatización**: Permitir la generación automática de documentación Swagger/OpenAPI

## 📋 Requisitos Obligatorios

### 1. Documentación de Código (JSDoc/TSDoc)

Todo endpoint DEBE incluir documentación TSDoc completa con los siguientes elementos:

```typescript
/**
 * [Nombre descriptivo del endpoint]
 * 
 * [Descripción detallada de qué hace el endpoint, incluyendo lógica de negocio]
 * 
 * @param [nombre] - [Descripción del parámetro con tipo y validaciones]
 * @param [nombre] - [Descripción del parámetro con tipo y validaciones]
 * @returns [Descripción del retorno con tipo y estructura]
 * 
 * @throws [Excepción] - [Cuándo y por qué se lanza]
 * @throws [Excepción] - [Cuándo y por qué se lanza]
 * 
 * @example
 * ```typescript
 * // Ejemplo de uso exitoso
 * const resultado = await servicio.metodo({
 *   campo1: 'valor1',
 *   campo2: 'valor2'
 * })
 * ```
 * 
 * @example
 * ```typescript
 * // Ejemplo de manejo de error
 * try {
 *   await servicio.metodo(datosInvalidos)
 * } catch (error) {
 *   // Manejo del error específico
 * }
 * ```
 */
```

### 2. Decoradores Swagger/OpenAPI Obligatorios

Todo endpoint DEBE incluir los siguientes decoradores de @nestjs/swagger:

```typescript
@ApiTags('[Nombre del Grupo]') // Obligatorio en nivel de clase
@Controller('api/v1/[recurso]')
export class [Nombre]Controller {
  
  @Post() // o el método HTTP correspondiente
  @ApiBearerAuth() // Si requiere autenticación
  @ApiOperation({ 
    summary: '[Resumen breve]', // Máximo 50 caracteres
    description: '[Descripción detallada]' // Incluir lógica de negocio
  })
  @ApiResponse({ 
    status: 201, // Código HTTP correcto
    description: '[Descripción del éxito]',
    type: [DtoDeRespuesta], // DTO de respuesta
    headers: {
      'Location': { // Si aplica
        description: 'URL del recurso creado',
        schema: { type: 'string' }
      }
    }
  })
  @ApiResponse({ 
    status: 400, // Códigos de error comunes
    description: 'Datos de entrada inválidos',
    type: ErrorResponseDto
  })
  @ApiResponse({ 
    status: 401, // Si requiere autenticación
    description: 'No autorizado - token inválido o expirado',
    type: ErrorResponseDto
  })
  @ApiResponse({ 
    status: 403, // Si hay autorización
    description: 'Prohibido - sin permisos suficientes',
    type: ErrorResponseDto
  })
  @ApiResponse({ 
    status: 404, // Si hay búsquedas
    description: 'Recurso no encontrado',
    type: ErrorResponseDto
  })
  @ApiResponse({ 
    status: 409, // Si hay conflictos
    description: 'Conflicto - el recurso ya existe',
    type: ErrorResponseDto
  })
  @ApiResponse({ 
    status: 422, // Si hay validaciones de negocio
    description: 'Violación de regla de negocio',
    type: ErrorResponseDto
  })
  @ApiResponse({ 
    status: 500, // Siempre incluir
    description: 'Error interno del servidor',
    type: ErrorResponseDto
  })
  async metodo(@Body() dto: CreateDto) {
    // implementación
  }
}
```

### 3. DTOs de Entrada y Salida

Todos los DTOs DEBEN incluir:

```typescript
export class CreateResourceDto {
  @ApiProperty({
    description: 'Descripción del campo incluyendo validaciones',
    example: 'valor_de_ejemplo',
    required: true, // o false si es opcional
    minimum: 1, // Si aplica
    maximum: 100, // Si aplica
    pattern: '^[a-zA-Z0-9]+$' // Si aplica
  })
  @IsNotEmpty({ message: 'El campo no puede estar vacío' })
  @IsString({ message: 'El campo debe ser una cadena' })
  @Length(1, 100, { message: 'El campo debe tener entre 1 y 100 caracteres' })
  readonly campo: string;
}
```

### 4. Documentación de Modelos/Entidades

```typescript
@Entity('recursos')
export class Recurso {
  @ApiProperty({
    description: 'Identificador único del recurso',
    example: '123e4567-e89b-12d3-a456-426614174000',
    readOnly: true
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'Fecha de creación automática',
    example: '2024-01-15T10:30:00.000Z',
    readOnly: true
  })
  @CreateDateColumn()
  createdAt: Date;
}
```

## 🔍 Checklist de Verificación

### Antes de crear un PR, verificar:

- [ ] **TSDoc completo** en todos los métodos del servicio
- [ ] **Decoradores Swagger** en todos los endpoints del controlador
- [ ] **DTOs documentados** con @ApiProperty y validaciones
- [ ] **Modelos/Entidades documentados** con @ApiProperty
- [ ] **Códigos HTTP correctos** en todas las respuestas
- [ ] **Descripciones claras** de todos los parámetros y respuestas
- [ ] **Ejemplos de uso** en la documentación TSDoc
- [ ] **Manejo de errores documentado** con @throws
- [ ] **Autenticación documentada** con @ApiBearerAuth si aplica
- [ ] **Headers documentados** si se usan (Location, etc.)

## 🚨 Consecuencias de No Cumplir

- **PR Rechazado**: Los PRs sin documentación completa serán rechazados automáticamente
- **Revisión Obligatoria**: Se requerirá documentación completa antes de aprobar
- **Retraso en Despliegue**: La falta de documentación retrasará la integración a main

## 📚 Ejemplos de Buenas Prácticas

### Ejemplo Completo de Endpoint

```typescript
/**
 * Crea una nueva calificación para un barbero
 * 
 * Permite a los clientes calificar el servicio recibido de un barbero.
 * Valida que el cliente haya completado una cita con el barbero y que no haya
 * calificado previamente el mismo servicio.
 * 
 * @param createRatingDto - Datos de la calificación incluyendo puntuación y reseña
 * @param req - Request con usuario autenticado
 * @returns La calificación creada con ID generado
 * 
 * @throws ConflictException si el cliente ya calificó este servicio
 * @throws NotFoundException si la cita no existe o no está completada
 * @throws BadRequestException si la puntuación está fuera del rango 1-5
 * 
 * @example
 * ```typescript
 * const rating = await ratingController.create({
 *   barberId: '123e4567-e89b-12d3-a456-426614174000',
 *   appointmentId: '456e7890-e89b-12d3-a456-426614174000',
 *   rating: 5,
 *   review: 'Excelente servicio, muy profesional'
 * }, authenticatedRequest)
 * ```
 */
@Post()
@ApiBearerAuth()
@ApiOperation({ 
  summary: 'Crear calificación de barbero',
  description: 'Permite a clientes calificar servicios de barberos después de completar una cita'
})
@ApiResponse({ 
  status: 201,
  description: 'Calificación creada exitosamente',
  type: RatingResponseDto,
  headers: {
    'Location': {
      description: 'URL de la calificación creada',
      schema: { type: 'string' }
    }
  }
})
@ApiResponse({ 
  status: 400,
  description: 'Datos de entrada inválidos',
  type: ErrorResponseDto
})
@ApiResponse({ 
  status: 401,
  description: 'No autorizado - token inválido o expirado',
  type: ErrorResponseDto
})
@ApiResponse({ 
  status: 404,
  description: 'Cita o barbero no encontrado',
  type: ErrorResponseDto
})
@ApiResponse({ 
  status: 409,
  description: 'El cliente ya calificó este servicio',
  type: ErrorResponseDto
})
@ApiResponse({ 
  status: 500,
  description: 'Error interno del servidor',
  type: ErrorResponseDto
})
async create(
  @Body() createRatingDto: CreateRatingDto,
  @Request() req: AuthenticatedRequest
) {
  return this.ratingService.create(createRatingDto, req.user.id);
}
```

## 📖 Referencias

- [NestJS Swagger Documentation](https://docs.nestjs.com/openapi/introduction)
- [OpenAPI Specification](https://swagger.io/specification/)
- [TSDoc Standard](https://tsdoc.org/)

---

**Última actualización**: Diciembre 2024
**Versión**: 1.0.0
**Aprobado por**: Equipo de Arquitectura Barber AI
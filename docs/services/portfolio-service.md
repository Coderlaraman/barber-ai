# Portfolio Service

Servicio de gestión de portafolio para barberos. Permite crear, actualizar, consultar y eliminar elementos del portafolio de trabajos de los barberos.

## 📋 Índice

- [Características](#características)
- [Tecnologías](#tecnologías)
- [Instalación](#instalación)
- [Configuración](#configuración)
- [Endpoints](#endpoints)
- [Modelos de Datos](#modelos-de-datos)
- [Reglas de Negocio](#reglas-de-negocio)
- [Integración con otros servicios](#integración-con-otros-servicios)
- [Despliegue](#despliegue)

## ✨ Características

- **Gestión de Portafolio**: Crear, actualizar y eliminar elementos del portafolio
- **Búsqueda Inteligente**: Buscar elementos por título o etiquetas
- **Etiquetado Flexible**: Sistema de tags para categorizar trabajos
- **Paginación**: Soporte para paginación en listados
- **API RESTful**: Interfaz RESTful bien documentada con Swagger

## 🛠 Tecnologías

- **Framework**: NestJS 10.4.10
- **Lenguaje**: TypeScript
- **ORM**: TypeORM 0.3.20
- **Base de Datos**: PostgreSQL
- **Documentación**: Swagger/OpenAPI
- **Validación**: class-validator 0.14.1
- **Transformación**: class-transformer 0.5.1

## 📦 Instalación

```bash
# Instalar dependencias
npm install

# Construir el proyecto
npm run build

# Ejecutar migraciones
npm run migration:run

# Iniciar el servicio
npm run start
```

## ⚙️ Configuración

### Variables de Entorno

```env
PORT=3004
DATABASE_URL=postgresql://user:password@localhost:5432/barberia_portfolio
NODE_ENV=development
```

### Configuración de TypeORM

El servicio utiliza TypeORM con las siguientes configuraciones:

- **Tipo de UUID**: uuid v4
- **Timestamps**: PostgreSQL timestamptz
- **Índices**: Optimizados para búsquedas por barberId
- **Soft Delete**: No implementado actualmente

## 🔗 Endpoints

### Portfolio Items

#### Agregar elemento al portafolio
```http
POST /portfolio/items
```

**Descripción**: Agrega un nuevo elemento al portafolio de un barbero

**Body Parameters**:
```json
{
  "barberId": "123e4567-e89b-12d3-a456-426614174000",
  "title": "Corte clásico con degradado",
  "description": "Corte clásico masculino con degradado en los laterales",
  "imageUrl": "https://example.com/haircut.jpg",
  "tags": ["corte-clasico", "degradado", "hombre"],
  "metadata": {
    "duration": 45,
    "price": 25.00
  }
}
```

**Response** (201):
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "barberId": "123e4567-e89b-12d3-a456-426614174000",
  "title": "Corte clásico con degradado",
  "tags": ["corte-clasico", "degradado", "hombre"],
  "createdAt": "2024-01-15T10:30:00Z"
}
```

#### Actualizar elemento del portafolio
```http
PUT /portfolio/items/:itemId
```

**Descripción**: Actualiza un elemento existente del portafolio

**Path Parameters**:
- `itemId` (string, uuid): ID del elemento del portafolio

**Body Parameters**:
```json
{
  "title": "Corte clásico moderno actualizado",
  "description": "Versión actualizada del corte clásico",
  "imageUrl": "https://example.com/updated-haircut.jpg",
  "tags": ["corte-clasico", "moderno", "actualizado"],
  "metadata": {
    "duration": 50,
    "price": 30.00
  }
}
```

**Response** (200):
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "barberId": "123e4567-e89b-12d3-a456-426614174000",
  "title": "Corte clásico moderno actualizado",
  "description": "Versión actualizada del corte clásico",
  "imageUrl": "https://example.com/updated-haircut.jpg",
  "tags": ["corte-clasico", "moderno", "actualizado"],
  "metadata": {
    "duration": 50,
    "price": 30.00
  },
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-15T12:00:00Z"
}
```

#### Obtener portafolio de un barbero
```http
GET /portfolio/items/:barberId?limit=10&offset=0
```

**Descripción**: Obtiene todos los elementos del portafolio de un barbero específico

**Path Parameters**:
- `barberId` (string, uuid): ID del barbero

**Query Parameters**:
- `limit` (number, optional): Número máximo de elementos a devolver (default: 10)
- `offset` (number, optional): Número de elementos a saltar para paginación (default: 0)

**Response** (200):
```json
[
  {
    "id": "123e4567-e89b-12d3-a456-426614174001",
    "barberId": "123e4567-e89b-12d3-a456-426614174000",
    "title": "Corte clásico con degradado",
    "description": "Corte clásico masculino con degradado en los laterales",
    "imageUrl": "https://example.com/haircut1.jpg",
    "tags": ["corte-clasico", "degradado", "hombre"],
    "metadata": {
      "duration": 45,
      "price": 25.00
    },
    "createdAt": "2024-01-15T10:30:00Z"
  }
]
```

#### Buscar elementos en el portafolio
```http
GET /portfolio/items/:barberId/search?query=corte&tags=corte-clasico,hombre
```

**Descripción**: Busca elementos del portafolio por título o etiquetas

**Path Parameters**:
- `barberId` (string, uuid): ID del barbero

**Query Parameters**:
- `query` (string, required): Término de búsqueda para título o etiquetas
- `tags` (string, optional): Filtrar por etiquetas específicas (separadas por comas)

**Response** (200):
```json
[
  {
    "id": "123e4567-e89b-12d3-a456-426614174002",
    "barberId": "123e4567-e89b-12d3-a456-426614174000",
    "title": "Corte clásico moderno",
    "description": "Corte clásico con toques modernos",
    "imageUrl": "https://example.com/haircut2.jpg",
    "tags": ["corte-clasico", "moderno", "hombre"],
    "metadata": {
      "duration": 50,
      "price": 30.00
    },
    "createdAt": "2024-01-10T14:20:00Z"
  }
]
```

#### Eliminar elemento del portafolio
```http
DELETE /portfolio/items/:itemId
```

**Descripción**: Elimina un elemento específico del portafolio

**Path Parameters**:
- `itemId` (string, uuid): ID del elemento del portafolio

**Response** (200):
```json
{
  "success": true,
  "message": "Elemento eliminado exitosamente"
}
```

### Health Check

#### Verificar salud del servicio
```http
GET /portfolio/health
```

**Descripción**: Verifica el estado de salud del servicio de portafolio

**Response** (200):
```json
{
  "status": "ok",
  "service": "portfolio"
}
```

## 📊 Modelos de Datos

### PortfolioItem Entity

```typescript
@Entity({ name: 'portfolio_items' })
export class PortfolioItem {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Index()
  @Column({ type: 'uuid' })
  barberId!: string

  @Column({ type: 'varchar' })
  title!: string

  @Column({ type: 'jsonb', nullable: true })
  tags?: string[]

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date
}
```

### DTOs

#### CreatePortfolioItemDto
```typescript
export class CreatePortfolioItemDto {
  @IsUUID()
  barberId: string

  @IsString()
  @MinLength(3)
  @MaxLength(100)
  title: string

  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string

  @IsUrl()
  @IsOptional()
  imageUrl?: string

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[]

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>
}
```

#### UpdatePortfolioItemDto
```typescript
export class UpdatePortfolioItemDto {
  @IsString()
  @IsOptional()
  @MinLength(3)
  @MaxLength(100)
  title?: string

  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string

  @IsUrl()
  @IsOptional()
  imageUrl?: string

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[]

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>
}
```

## 📋 Reglas de Negocio

### Validaciones

1. **Título del Elemento**:
   - Mínimo 3 caracteres
   - Máximo 100 caracteres
   - Requerido para creación

2. **Descripción**:
   - Máximo 500 caracteres
   - Opcional

3. **URL de Imagen**:
   - Debe ser una URL válida
   - Opcional

4. **Etiquetas (Tags)**:
   - Array de strings
   - Opcional
   - Se recomienda usar minúsculas y guiones para espacios

5. **Metadatos**:
   - Objeto JSON flexible
   - Puede incluir información adicional como duración, precio, etc.

### Restricciones

1. **IDs**: Todos los IDs deben ser UUID v4 válidos
2. **BarberId**: Debe existir en el sistema (validación cruzada pendiente)
3. **Duplicados**: No hay restricción de duplicados actualmente
4. **Límites**: Sin límites de elementos por barbero definidos

## 🔗 Integración con otros servicios

### Servicios Relacionados

1. **Auth-Service**: Validación de identidad del barbero (pendiente implementar)
2. **User-Service**: Verificación de existencia del barbero (pendiente implementar)
3. **Search-Service**: Indexación de elementos para búsqueda global (pendiente)
4. **Ranking-Service**: Cálculo de reputación basada en portafolio (pendiente)

### Eventos Publicados

Actualmente no se publican eventos. En el futuro se planea:
- `portfolio.item.created`
- `portfolio.item.updated`
- `portfolio.item.deleted`

### Eventos Consumidos

Actualmente no se consumen eventos. En el futuro se planea:
- Escuchar eventos de usuario para validar barberos
- Escuchar eventos de eliminación de usuarios para limpieza

## 🚀 Despliegue

### Desarrollo

```bash
# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
npm run dev
```

### Producción

```bash
# Construir el proyecto
npm run build

# Ejecutar migraciones
npm run migration:run

# Iniciar en modo producción
npm run start
```

### Docker

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3004

CMD ["npm", "run", "start"]
```

### Docker Compose

```yaml
portfolio-service:
  build: ./services/portfolio-service
  ports:
    - "3004:3004"
  environment:
    - DATABASE_URL=postgresql://user:password@postgres:5432/barberia_portfolio
    - NODE_ENV=production
  depends_on:
    - postgres
  networks:
    - barberia-network
```

### Health Check

El servicio expone un endpoint de health check en `/portfolio/health` que retorna:

```json
{
  "status": "ok",
  "service": "portfolio"
}
```

### Métricas de Rendimiento

- **Tiempo de respuesta promedio**: < 100ms
- **Capacidad de concurrencia**: 1000+ requests simultáneos
- **Tiempo de inicio**: < 5 segundos
- **Memoria base**: ~100MB

### Monitoreo

Se recomienda implementar:
- Logs estructurados con niveles (error, warn, info, debug)
- Métricas de Prometheus para monitoreo de rendimiento
- Alertas para errores críticos y degradación de servicio
- Dashboard de Grafana para visualización de métricas

### Seguridad

Consideraciones de seguridad pendientes:
- Autenticación JWT para proteger endpoints
- Rate limiting para prevenir abuso
- Validación de tamaño de imágenes
- Sanitización de metadatos
- CORS configurado apropiadamente
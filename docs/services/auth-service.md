# Auth Service

Servicio de autenticación y gestión de usuarios para el sistema BarberIA. Proporciona autenticación segura con JWT, auditoría de accesos, y gestión de roles y permisos.

## Características Principales

### Autenticación Segura
- **JWT Tokens**: Access tokens (15 minutos) y refresh tokens (7 días)
- **Rate Limiting**: Protección contra ataques de fuerza bruta
- **Auditoría Completa**: Registro de todos los eventos de autenticación
- **Verificación de Email**: Sistema de verificación por correo electrónico
- **Recuperación de Contraseña**: Tokens seguros con expiración de 1 hora

### Gestión de Usuarios
- **Roles y Permisos**: CLIENT, BARBER, ADMIN con permisos específicos
- **Autenticación Social**: Integración con Google y Facebook
- **Bloqueo de Cuenta**: Protección contra intentos fallidos de login
- **Perfiles de Usuario**: Información personal y preferencias

### Seguridad y Auditoría
- **Registro de Eventos**: Login, logout, registro, refresco de tokens
- **Detección de Anomalías**: Monitoreo de actividad sospechosa
- **Información Contextual**: IP, user agent, timestamp de cada evento
- **Tokens Revocables**: Invalidación de tokens en caso de compromiso

## Endpoints

### Autenticación

#### POST /auth/register
Registra un nuevo usuario en el sistema.

**Request Body:**
```json
{
  "email": "usuario@example.com",
  "password": "SecurePass123!",
  "role": "CLIENT"
}
```

**Response (201):**
```json
{
  "user": {
    "id": "uuid",
    "email": "usuario@example.com",
    "role": "CLIENT"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Rate Limit:** 5 registros por minuto por IP

#### POST /auth/login
Autentica las credenciales del usuario.

**Request Body:**
```json
{
  "email": "usuario@example.com",
  "password": "SecurePass123!"
}
```

**Response (200):**
```json
{
  "user": {
    "id": "uuid",
    "email": "usuario@example.com",
    "role": "CLIENT"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Rate Limit:** 10 intentos de login por minuto por IP

#### POST /auth/refresh
Renueva el access token usando un refresh token válido.

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### POST /auth/logout
Cierra la sesión del usuario.

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200):**
```json
{
  "message": "Logout successful"
}
```

### Autenticación Social

#### POST /auth/social
Autenticación mediante proveedores OAuth (Google, Facebook).

**Request Body:**
```json
{
  "provider": "google",
  "accessToken": "ya29.a0ARrdaM..."
}
```

**Response (200):**
```json
{
  "user": {
    "id": "uuid",
    "email": "usuario@gmail.com",
    "role": "CLIENT"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Rate Limit:** 10 autenticaciones sociales por minuto por IP

### Gestión de Email

#### POST /auth/verify-email
Verifica la dirección de email del usuario.

**Request Body:**
```json
{
  "token": "verification-token-123"
}
```

**Response (200):**
```json
{
  "message": "Email verified successfully",
  "user": {
    "id": "uuid",
    "email": "usuario@example.com",
    "emailVerified": true
  }
}
```

#### POST /auth/resend-verification
Reenvía el email de verificación.

**Request Body:**
```json
{
  "email": "usuario@example.com"
}
```

**Response (200):**
```json
{
  "message": "Verification email sent successfully"
}
```

### Recuperación de Contraseña

#### POST /auth/forgot-password
Solicita el restablecimiento de contraseña.

**Request Body:**
```json
{
  "email": "usuario@example.com"
}
```

**Response (200):**
```json
{
  "message": "Password reset email sent successfully"
}
```

#### POST /auth/reset-password
Restablece la contraseña usando el token recibido por email.

**Request Body:**
```json
{
  "token": "reset-token-123",
  "newPassword": "NewSecurePass123!"
}
```

**Response (200):**
```json
{
  "message": "Password reset successfully"
}
```

### Auditoría

#### GET /auth/audit
Consulta los logs de auditoría (requiere autenticación).

**Query Parameters:**
- `userId` (opcional): Filtrar por ID de usuario
- `action` (opcional): Filtrar por tipo de acción (LOGIN, LOGOUT, REGISTER, TOKEN_REFRESH)
- `status` (opcional): Filtrar por estado (SUCCESS, FAILURE)
- `startDate` (opcional): Fecha de inicio (formato ISO)
- `endDate` (opcional): Fecha de fin (formato ISO)

**Response (200):**
```json
[
  {
    "id": "uuid",
    "userId": "uuid",
    "email": "usuario@example.com",
    "role": "CLIENT",
    "action": "LOGIN",
    "status": "SUCCESS",
    "ipAddress": "192.168.1.1",
    "userAgent": "Mozilla/5.0...",
    "createdAt": "2024-01-01T12:00:00Z"
  }
]
```

### Health Check

#### GET /auth/health
Verifica el estado del servicio de autenticación.

**Response (200):**
```json
{
  "status": "ok",
  "service": "auth"
}
```

## Modelos de Datos

### User Entity
```typescript
@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ unique: true })
  email!: string

  @Column({ nullable: true })
  name?: string

  @Column({ nullable: true })
  passwordHash?: string

  @Column({ type: 'enum', enum: UserRole })
  role!: UserRole // CLIENT, BARBER, ADMIN

  @Column({ type: 'enum', enum: AuthProvider, default: AuthProvider.LOCAL })
  authProvider!: AuthProvider // local, google, facebook

  @Column({ nullable: true })
  failedLoginAttempts?: number

  @Column({ nullable: true })
  lockedUntil?: Date

  @Column({ default: false })
  emailVerified!: boolean

  @Column({ nullable: true })
  emailVerificationToken?: string

  @Column({ nullable: true })
  emailVerificationExpires?: Date
}
```

### Access Audit Entity
```typescript
@Entity('access_audits')
export class AccessAudit {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @ManyToOne(() => User, { nullable: true })
  user?: User

  @Column()
  email!: string

  @Column()
  role!: UserRole

  @Column()
  action!: AuditAction // LOGIN, LOGOUT, REGISTER, TOKEN_REFRESH

  @Column()
  status!: AuditStatus // SUCCESS, FAILURE

  @Column({ nullable: true })
  failureReason?: string

  @Column({ nullable: true })
  details?: string

  @Column()
  ipAddress!: string

  @Column()
  userAgent!: string

  @CreateDateColumn()
  createdAt!: Date
}
```

## Seguridad

### Rate Limiting
- **Registro**: 5 intentos por minuto por IP
- **Login**: 10 intentos por minuto por IP
- **Autenticación Social**: 10 intentos por minuto por IP

### JWT Configuration
```typescript
JwtModule.register({
  secret: process.env.JWT_SECRET,
  signOptions: { expiresIn: '15m' }
})
```

### Password Requirements
- Mínimo 8 caracteres
- Al menos una mayúscula
- Al menos una minúscula
- Al menos un número
- Al menos un carácter especial

### Account Lockout
- 5 intentos fallidos de login bloquean la cuenta por 30 minutos
- Registro de intentos fallidos en la auditoría

## Configuración de Entorno

```bash
# Puerto del servicio
PORT=3001

# Base de datos PostgreSQL
DB_HOST=postgres
DB_PORT=5432
DB_NAME=barberia_auth
DB_USER=postgres
DB_PASSWORD=password

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-super-secret-refresh-key

# Email (SendGrid)
SENDGRID_API_KEY=your-sendgrid-api-key
FROM_EMAIL=noreply@barberia.com

# OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-app-secret
```

## Dependencias Principales

- **@nestjs/jwt**: Gestión de tokens JWT
- **@nestjs/passport**: Autenticación con Passport
- **bcryptjs**: Hashing de contraseñas
- **typeorm**: ORM para PostgreSQL
- **@nestjs/throttler**: Rate limiting
- **sendgrid/mail**: Envío de emails

## Despliegue

### Desarrollo
```bash
cd services/auth-service
npm install
npm run dev
```

### Producción
```bash
cd services/auth-service
npm install
npm run build
npm run start
```

### Docker
```bash
docker build -t barberia-auth-service .
docker run -p 3001:3001 --env-file .env barberia-auth-service
```

## Monitoreo y Métricas

### Health Check
- Endpoint: `GET /auth/health`
- Respuesta: `{ "status": "ok", "service": "auth" }`

### Auditoría
- Registro completo de todos los eventos de autenticación
- Consulta de logs con filtros avanzados
- Detección de patrones sospechosos

### Métricas de Rendimiento
- Tiempo de respuesta de autenticación: < 200ms
- Disponibilidad del servicio: 99.9%
- Tasa de éxito de login: > 95%

## Integración con Otros Servicios

### API Gateway
El servicio de autenticación se integra con el API Gateway a través de:
- Proxy de rutas `/auth/*` al servicio en puerto 3001
- Validación de tokens JWT en el gateway
- Propagación de contexto de usuario

### User Service
Comunicación para:
- Sincronización de datos de usuario
- Actualización de perfiles
- Gestión de preferencias

### Notification Service
Envío de:
- Emails de verificación
- Notificaciones de seguridad
- Alertas de actividad sospechosa
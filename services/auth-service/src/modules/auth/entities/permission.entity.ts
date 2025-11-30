export enum Permission {
  // User Management
  USERS_READ = 'users:read',
  USERS_CREATE = 'users:create',
  USERS_UPDATE = 'users:update',
  USERS_DELETE = 'users:delete',
  
  // Appointment Management
  APPOINTMENTS_READ = 'appointments:read',
  APPOINTMENTS_CREATE = 'appointments:create',
  APPOINTMENTS_UPDATE = 'appointments:update',
  APPOINTMENTS_CANCEL = 'appointments:cancel',
  APPOINTMENTS_CONFIRM = 'appointments:confirm',
  APPOINTMENTS_COMPLETE = 'appointments:complete',
  
  // Availability Management
  AVAILABILITY_READ = 'availability:read',
  AVAILABILITY_CREATE = 'availability:create',
  AVAILABILITY_UPDATE = 'availability:update',
  AVAILABILITY_DELETE = 'availability:delete',
  
  // Portfolio Management
  PORTFOLIO_READ = 'portfolio:read',
  PORTFOLIO_CREATE = 'portfolio:create',
  PORTFOLIO_UPDATE = 'portfolio:update',
  PORTFOLIO_DELETE = 'portfolio:delete',
  
  // Barber Profile Management
  BARBERS_READ = 'barbers:read',
  BARBERS_UPDATE = 'barbers:update',
  BARBERS_DELETE = 'barbers:delete',
  
  // Analytics and Reports
  ANALYTICS_READ = 'analytics:read',
  REPORTS_READ = 'reports:read',
  
  // System Administration
  SYSTEM_ADMIN = 'system:admin',
  SYSTEM_CONFIG = 'system:config'
}
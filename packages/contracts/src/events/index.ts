// Exportar interfaces base
export * from './base'

// Exportar eventos específicos
export * from './booking-events'
export * from './notification-events'

// Exportar servicios
export * from '../services/event-bus.service'
export * from '../services/event-store.service'
export * from '../services/event-handler'
export * from '../services/postgres-event-store.service'
export * from '../services/event-metrics.service'
export * from '../services/dead-letter-queue.service'

// Exportar módulos
export * from './events.module'
export * from './events-complete.module'

// Exportar controllers
export * from '../controllers/event-dashboard.controller'

// Exportar handlers de ejemplo
export * from '../handlers/booking-created.handler'
export * from '../handlers/notification-sent.handler'

// Mantener compatibilidad hacia atrás (solo si no hay conflictos)
// export * from './booking'  // Comentado para evitar conflictos
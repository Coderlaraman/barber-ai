import 'reflect-metadata'

// Mock para servicios externos
jest.mock('@barber_ai/contracts', () => ({
  EventBusService: jest.fn().mockImplementation(() => ({
    publish: jest.fn().mockResolvedValue(undefined),
    subscribe: jest.fn().mockResolvedValue(undefined),
    unsubscribe: jest.fn().mockResolvedValue(undefined),
  })),
  PostgresEventStore: jest.fn().mockImplementation(() => ({
    save: jest.fn().mockResolvedValue(undefined),
    getEvents: jest.fn().mockResolvedValue([]),
  })),
}))

// Configuración global de tests
beforeEach(() => {
  jest.clearAllMocks()
})

// Limpiar después de cada test suite
afterEach(() => {
  jest.restoreAllMocks()
})
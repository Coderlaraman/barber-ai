// TypeScript declarations for Jest globals
declare const describe: any
declare const it: any
declare const expect: any
declare const jest: any

import { GatewayController, AvailabilityController } from '../src/modules/gateway/gateway.controller'

describe('Gateway Controller Tests', () => {
  describe('GatewayController', () => {
    it('should be defined', () => {
      expect(GatewayController).toBeDefined()
    })

    it('should have proper metadata', () => {
      const controller = new GatewayController()
      expect(controller).toBeInstanceOf(GatewayController)
    })
  })

  describe('AvailabilityController', () => {
    it('should be defined', () => {
      expect(AvailabilityController).toBeDefined()
    })

    it('should have proper metadata', () => {
      const controller = new AvailabilityController()
      expect(controller).toBeInstanceOf(AvailabilityController)
    })
  })

  describe('Endpoint Configuration', () => {
    it('should have appointments endpoints configured', () => {
      // Test that the controller methods exist
      const controller = new GatewayController()
      expect(typeof controller.createAppointment).toBe('function')
      expect(typeof controller.getAppointment).toBe('function')
      expect(typeof controller.getAppointments).toBe('function')
      expect(typeof controller.updateAppointment).toBe('function')
      expect(typeof controller.cancelAppointment).toBe('function')
      expect(typeof controller.confirmAppointment).toBe('function')
      expect(typeof controller.completeAppointment).toBe('function')
    })

    it('should have availability endpoints configured', () => {
      // Test that the controller methods exist
      const controller = new AvailabilityController()
      expect(typeof controller.createAvailability).toBe('function')
      expect(typeof controller.getAvailability).toBe('function')
      expect(typeof controller.getAvailabilities).toBe('function')
      expect(typeof controller.updateAvailability).toBe('function')
      expect(typeof controller.deleteAvailability).toBe('function')
      expect(typeof controller.generateTimeSlots).toBe('function')
      expect(typeof controller.blockTimeSlot).toBe('function')
      expect(typeof controller.unblockTimeSlot).toBe('function')
    })
  })

  describe('Proxy Configuration', () => {
    it('should handle proxy responses correctly', () => {
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
      }

      const controller = new GatewayController()
      controller.createAppointment({}, {} as any, mockResponse as any)

      expect(mockResponse.status).toHaveBeenCalledWith(501)
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Use proxy endpoint' })
    })
  })
})
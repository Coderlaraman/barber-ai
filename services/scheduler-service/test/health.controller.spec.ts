import { Test, TestingModule } from '@nestjs/testing'
import { HealthController } from '../src/modules/health/health.controller'

describe('HealthController', () => {
  let controller: HealthController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
    }).compile()

    controller = module.get<HealthController>(HealthController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  describe('health', () => {
    it('should return health status', () => {
      const result = controller.health()
      
      expect(result).toEqual({
        status: 'ok',
        timestamp: expect.any(String),
        service: 'barberia-scheduler-service',
        version: '0.1.0'
      })
    })
  })
})
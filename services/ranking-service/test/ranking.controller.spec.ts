import { Test, TestingModule } from '@nestjs/testing'
import { RankingController } from '../src/modules/ranking/ranking.controller'

describe('RankingController', () => {
  let controller: RankingController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RankingController],
    }).compile()

    controller = module.get<RankingController>(RankingController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  describe('recalculate', () => {
    it('should return recalculate status', () => {
      const result = controller.recalculate()
      
      expect(result).toEqual({
        status: 'stub',
        action: 'recalculate'
      })
    })
  })

  describe('health', () => {
    it('should return health status', () => {
      const result = controller.health()
      
      expect(result).toEqual({
        status: 'ok',
        service: 'ranking'
      })
    })
  })
})
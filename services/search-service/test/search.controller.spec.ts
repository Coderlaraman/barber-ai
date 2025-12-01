import { Test, TestingModule } from '@nestjs/testing'
import { SearchController } from '../src/modules/search/search.controller'

describe('SearchController', () => {
  let controller: SearchController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SearchController],
    }).compile()

    controller = module.get<SearchController>(SearchController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  describe('search', () => {
    it('should return stub results', () => {
      const result = controller.search({})
      
      expect(result).toEqual({
        status: 'stub',
        results: []
      })
    })
  })

  describe('health', () => {
    it('should return health status', () => {
      const result = controller.health()
      
      expect(result).toEqual({
        status: 'ok',
        service: 'search'
      })
    })
  })
})
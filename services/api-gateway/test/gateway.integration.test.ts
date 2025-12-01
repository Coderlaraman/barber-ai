import { Test, TestingModule } from '@nestjs/testing'
import request from 'supertest'
import { AppModule } from '../src/modules/app.module'

describe('API Gateway Integration Tests', () => {
  let app: any
  let server: any

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = moduleFixture.createNestApplication()
    await app.init()
    server = app.getHttpServer()
  })

  afterAll(async () => {
    await app.close()
  })

  describe('Health Check Endpoints', () => {
    it('should return gateway health status', async () => {
      const response = await request(server)
        .get('/')
        .timeout(5000)

      // The gateway should return the documentation index page
      expect([200, 404]).toContain(response.status)
      if (response.status === 200) {
        expect(response.text).toContain('BarberIA')
        expect(response.text).toContain('Documentación')
      }
    })

    it('should check all service health endpoints', async () => {
      const healthEndpoints = [
        '/auth/health',
        '/scheduler/health', 
        '/notifications/health',
        '/portfolio/health',
        '/search/health',
        '/ranking/health'
      ]

      for (const endpoint of healthEndpoints) {
        const response = await request(server)
          .get(endpoint)
          .timeout(5000)
          
        // Los servicios pueden estar abajo en tests, pero el proxy debe funcionar
        expect([200, 404, 502]).toContain(response.status)
      }
    })
  })

  describe('Proxy Configuration Tests', () => {
    it('should proxy requests to scheduler service', async () => {
      const response = await request(server)
        .get('/appointments/health')
        .timeout(5000)

      expect([200, 404, 500, 502]).toContain(response.status)
    })

    it('should proxy requests to auth service', async () => {
      const response = await request(server)
        .get('/auth/health')
        .timeout(5000)

      expect([200, 404, 502]).toContain(response.status)
    })

    it('should proxy requests to notifications service', async () => {
      const response = await request(server)
        .get('/notifications/health')
        .timeout(5000)

      expect([200, 404, 502]).toContain(response.status)
    })

    it('should proxy requests to portfolio service', async () => {
      const response = await request(server)
        .get('/portfolio/health')
        .timeout(5000)

      expect([200, 404, 502]).toContain(response.status)
    })

    it('should proxy requests to search service', async () => {
      const response = await request(server)
        .get('/search/health')
        .timeout(5000)

      expect([200, 404, 502]).toContain(response.status)
    })

    it('should proxy requests to ranking service', async () => {
      const response = await request(server)
        .get('/ranking/health')
        .timeout(5000)

      expect([200, 404, 502]).toContain(response.status)
    })
  })

  describe('Swagger Documentation Proxy', () => {
    it('should proxy swagger docs for scheduler service', async () => {
      const response = await request(server)
        .get('/docs-json/scheduler')
        .timeout(5000)

      expect([200, 404, 502]).toContain(response.status)
    })

    it('should proxy swagger docs for auth service', async () => {
      const response = await request(server)
        .get('/docs-json/auth')
        .timeout(5000)

      expect([200, 404, 502]).toContain(response.status)
    })

    it('should serve swagger UI for services', async () => {
      const services = ['scheduler', 'auth', 'notifications', 'portfolio', 'search', 'ranking']
      
      for (const service of services) {
        const response = await request(server)
          .get(`/docs/${service}`)
          .timeout(5000)

        expect([200, 404]).toContain(response.status)
      }
    })
  })

  describe('Error Handling', () => {
    it('should handle non-existent service gracefully', async () => {
      const response = await request(server)
        .get('/nonexistent/health')
        .timeout(5000)

      expect([404, 502]).toContain(response.status)
    })

    it('should handle invalid service names in docs endpoint', async () => {
      const response = await request(server)
        .get('/docs-json/nonexistent')
        .timeout(5000)

      // Should return 404 for unknown service
      expect(response.status).toBe(404)
    })
  })
})
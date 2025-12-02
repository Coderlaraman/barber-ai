import 'reflect-metadata'
import { NestFactory } from '@nestjs/core'
import { AppModule } from './modules/app.module'
import { createProxyMiddleware } from 'http-proxy-middleware'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import * as swaggerUi from 'swagger-ui-express'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  app.enableCors()
  const config = new DocumentBuilder()
    .setTitle('BarberIA API Gateway')
    .setDescription('Documentación de rutas públicas y proxy hacia microservicios')
    .setVersion('0.1.0')
    .build()
  const document = SwaggerModule.createDocument(app, config)
  SwaggerModule.setup('docs', app, document)
  const expressApp = app.getHttpAdapter().getInstance()
  expressApp.use('/docs/scheduler', swaggerUi.serve, swaggerUi.setup(undefined, {
    swaggerOptions: { url: '/docs-json/scheduler' }
  }))
  expressApp.use('/docs/auth', swaggerUi.serve, swaggerUi.setup(undefined, {
    swaggerOptions: { url: '/docs-json/auth' }
  }))
  expressApp.use('/docs/notifications', swaggerUi.serve, swaggerUi.setup(undefined, {
    swaggerOptions: { url: '/docs-json/notifications' }
  }))
  expressApp.use('/docs/portfolio', swaggerUi.serve, swaggerUi.setup(undefined, {
    swaggerOptions: { url: '/docs-json/portfolio' }
  }))
  expressApp.use('/docs/search', swaggerUi.serve, swaggerUi.setup(undefined, {
    swaggerOptions: { url: '/docs-json/search' }
  }))
  expressApp.use('/docs/ranking', swaggerUi.serve, swaggerUi.setup(undefined, {
    swaggerOptions: { url: '/docs-json/ranking' }
  }))
  expressApp.use('/docs-json/barber', swaggerUi.serve, swaggerUi.setup(undefined, {
    swaggerOptions: { url: '/docs-json/barber' }
  }))
  expressApp.use('/docs-json/rating', swaggerUi.serve, swaggerUi.setup(undefined, {
    swaggerOptions: { url: '/docs-json/rating' }
  }))
  expressApp.use('/docs/rating', swaggerUi.serve, swaggerUi.setup(undefined, {
    swaggerOptions: { url: '/docs-json/rating' }
  }))

  expressApp.get('/docs-json/:service', async (req: any, res: any) => {
    const service = String(req.params.service || '').toLowerCase()
    const map: Record<string, string> = {
      auth: process.env.AUTH_SERVICE_URL || 'http://auth-service:3001',
      scheduler: 'http://scheduler-service:3002',
      notifications: 'http://notifications-service:3003',
      portfolio: 'http://portfolio-service:3004',
      search: 'http://search-service:3005',
      ranking: 'http://ranking-service:3006',
      barber: 'http://barber-service:3007',
      rating: 'http://rating-review-service:3008',
      ai: 'http://ai-recommender-service:8000'
    }
    const base = map[service]
    if (!base) return res.status(404).json({ message: 'Unknown service', service })
    try {
      const suffix = service === 'ai' ? '/openapi.json' : '/docs-json'
      const r = await fetch(`${base}${suffix}`)
      const body = await r.text()
      res.status(r.status).type('application/json').send(body)
    } catch {
      res.status(502).json({ message: 'Upstream docs fetch failed', service })
    }
  })

  expressApp.get('/', async (req: any, res: any) => {
    const services = [
      { key: 'auth', label: 'Auth', base: process.env.AUTH_SERVICE_URL || 'http://auth-service:3001', health: '/auth/health' },
      { key: 'scheduler', label: 'Scheduler', base: 'http://scheduler-service:3002', health: '/scheduler/health' },
      { key: 'notifications', label: 'Notifications', base: 'http://notifications-service:3003', health: '/notifications/health' },
      { key: 'portfolio', label: 'Portfolio', base: 'http://portfolio-service:3004', health: '/portfolio/health' },
      { key: 'search', label: 'Search', base: 'http://search-service:3005', health: '/search/health' },
      { key: 'ranking', label: 'Ranking', base: 'http://ranking-service:3006', health: '/ranking/health' },
      { key: 'barber', label: 'Barber', base: 'http://barber-service:3007', health: '/barbers' },
      { key: 'rating', label: 'Rating & Reviews', base: 'http://rating-review-service:3008', health: '/ratings' },
      { key: 'ai', label: 'AI Recommender', base: 'http://ai-recommender-service:8000', health: '/health' }
    ]
    const withTimeout = async (url: string) => {
      const c = new AbortController()
      const t = setTimeout(() => c.abort(), 2500)
      try {
        const r = await fetch(url, { signal: c.signal })
        clearTimeout(t)
        return r
      } catch {
        clearTimeout(t)
        return null
      }
    }
    const statusRows = await Promise.all(
      services.map(async (s) => {
        const hr = await withTimeout(`${s.base}${s.health}`)
        const healthy = !!hr && hr.ok
        const docsSuffix = s.key === 'ai' ? '/openapi.json' : '/docs-json'
        const dr = await withTimeout(`${s.base}${docsSuffix}`)
        let routes = '—'
        if (dr && dr.ok) {
          try {
            const json = await dr.json()
            routes = json && json.paths ? String(Object.keys(json.paths).length) : '0'
          } catch {
            routes = '—'
          }
        }
        const pill = healthy ? '<span style="color:#0a0">OK</span>' : '<span style="color:#a00">DOWN</span>'
        return `<tr><td>${s.label}</td><td>${pill}</td><td>${routes}</td><td><a href="/docs/${s.key}">UI</a></td><td><a href="/docs-json/${s.key}">JSON</a></td></tr>`
      })
    )
    const html = `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>BarberIA – Índice de Documentación</title><style>body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Cantarell,Noto Sans,sans-serif;margin:40px;line-height:1.6}h1{margin-bottom:0.5rem}table{border-collapse:collapse;margin-top:1rem}th,td{border:1px solid #e5e7eb;padding:.5rem .75rem;text-align:left}a{color:#0366d6;text-decoration:none}a:hover{text-decoration:underline}.muted{color:#6b7280}</style></head><body><h1>BarberIA – Índice de Documentación</h1><p class="muted">Estado y rutas documentadas por servicio.</p><table><thead><tr><th>Servicio</th><th>Salud</th><th># Rutas</th><th>Swagger UI</th><th>Swagger JSON</th></tr></thead><tbody>${statusRows.join('')}</tbody></table></body></html>`
    res.type('html').send(html)
  })
  expressApp.use(
    '/docs-json/scheduler',
    createProxyMiddleware({
      target: 'http://scheduler-service:3002',
      changeOrigin: true,
      pathRewrite: (path) => path.replace(/^\/docs-json\/scheduler/, '/docs-json')
    })
  )
  expressApp.use(
    '/docs-json/auth',
    createProxyMiddleware({
      target: process.env.AUTH_SERVICE_URL || 'http://auth-service:3001',
      changeOrigin: true,
      pathRewrite: (path) => path.replace(/^\/docs-json\/auth/, '/docs-json')
    })
  )
  expressApp.use(
    '/docs-json/notifications',
    createProxyMiddleware({
      target: 'http://notifications-service:3003',
      changeOrigin: true,
      pathRewrite: (path) => path.replace(/^\/docs-json\/notifications/, '/docs-json')
    })
  )
  expressApp.use(
    '/docs-json/portfolio',
    createProxyMiddleware({
      target: 'http://portfolio-service:3004',
      changeOrigin: true,
      pathRewrite: (path) => path.replace(/^\/docs-json\/portfolio/, '/docs-json')
    })
  )
  expressApp.use(
    '/docs-json/search',
    createProxyMiddleware({
      target: 'http://search-service:3005',
      changeOrigin: true,
      pathRewrite: (path) => path.replace(/^\/docs-json\/search/, '/docs-json')
    })
  )
  expressApp.use(
    '/docs-json/ranking',
    createProxyMiddleware({
      target: 'http://ranking-service:3006',
      changeOrigin: true,
      pathRewrite: (path) => path.replace(/^\/docs-json\/ranking/, '/docs-json')
    })
  )
  expressApp.use(
    '/docs-json/barber',
    createProxyMiddleware({
      target: 'http://barber-service:3007',
      changeOrigin: true,
      pathRewrite: (path) => path.replace(/^\/docs-json\/barber/, '/docs-json')
    })
  )
  expressApp.use(
    '/docs-json/rating',
    createProxyMiddleware({
      target: 'http://rating-review-service:3008',
      changeOrigin: true,
      pathRewrite: (path) => path.replace(/^\/docs-json\/rating/, '/docs-json')
    })
  )
  app.use('/docs/ai', swaggerUi.serve, swaggerUi.setup(undefined, {
    swaggerOptions: { url: '/docs-json/ai' }
  }))
  
  // Specific proxy configurations for appointments endpoints
  app.use(
    '/appointments',
    createProxyMiddleware({
      target: 'http://scheduler-service:3002',
      changeOrigin: true,
      ws: true,
      pathRewrite: (path) => path.startsWith('/appointments') ? path : `/appointments${path}`
    })
  )
  
  app.use(
    '/availability',
    createProxyMiddleware({
      target: 'http://scheduler-service:3002',
      changeOrigin: true,
      ws: true,
      pathRewrite: (path) => path.startsWith('/availability') ? path : `/availability${path}`
    })
  )
  
  app.use(
    '/scheduler',
    createProxyMiddleware({
      target: 'http://scheduler-service:3002',
      changeOrigin: true,
      ws: true,
      pathRewrite: (path) => (path.startsWith('/scheduler') ? path : `/scheduler${path}`)
    })
  )
  app.use(
    '/notifications',
    createProxyMiddleware({
      target: 'http://notifications-service:3003',
      changeOrigin: true,
      ws: true,
      pathRewrite: (path) => (path.startsWith('/notifications') ? path : `/notifications${path}`)
    })
  )
  app.use(
    '/portfolio',
    createProxyMiddleware({
      target: 'http://portfolio-service:3004',
      changeOrigin: true,
      ws: true,
      pathRewrite: (path) => (path.startsWith('/portfolio') ? path : `/portfolio${path}`)
    })
  )
  app.use(
    '/search',
    createProxyMiddleware({
      target: 'http://search-service:3005',
      changeOrigin: true,
      ws: true,
      pathRewrite: (path) => (path.startsWith('/search') ? path : `/search${path}`)
    })
  )
  app.use(
    '/ranking',
    createProxyMiddleware({
      target: 'http://ranking-service:3006',
      changeOrigin: true,
      ws: true,
      pathRewrite: (path) => (path.startsWith('/ranking') ? path : `/ranking${path}`)
    })
  )
  app.use(
    '/barbers',
    createProxyMiddleware({
      target: 'http://barber-service:3007',
      changeOrigin: true,
      ws: true,
      pathRewrite: (path) => (path.startsWith('/barbers') ? path : `/barbers${path}`)
    })
  )
  app.use(
    '/specialties',
    createProxyMiddleware({
      target: 'http://barber-service:3007',
      changeOrigin: true,
      ws: true,
      pathRewrite: (path) => (path.startsWith('/specialties') ? path : `/specialties${path}`)
    })
  )
  app.use(
    '/services',
    createProxyMiddleware({
      target: 'http://barber-service:3007',
      changeOrigin: true,
      ws: true,
      pathRewrite: (path) => (path.startsWith('/services') ? path : `/services${path}`)
    })
  )
  app.use(
    '/ratings',
    createProxyMiddleware({
      target: 'http://rating-review-service:3008',
      changeOrigin: true,
      ws: true,
      pathRewrite: (path) => (path.startsWith('/ratings') ? path : `/ratings${path}`)
    })
  )
  app.use(
    '/auth',
    createProxyMiddleware({
      target: process.env.AUTH_SERVICE_URL || 'http://auth-service:3001',
      changeOrigin: true,
      ws: true,
      pathRewrite: (path) => (path.startsWith('/auth') ? path : `/auth${path}`)
    })
  )
  app.use(
    '/ai',
    createProxyMiddleware({
      target: 'http://ai-recommender-service:8000',
      changeOrigin: true,
      ws: true,
      pathRewrite: (path) => path.replace(/^\/ai/, '')
    })
  )
  await app.listen(process.env.PORT ? Number(process.env.PORT) : 8080)
}

bootstrap()

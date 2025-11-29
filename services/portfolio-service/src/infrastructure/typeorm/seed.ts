import { AppDataSource } from './data-source'
import { PortfolioItem } from '../../domain/entities/portfolio_item.entity'

async function run() {
  await AppDataSource.initialize()
  try {
    const repo = AppDataSource.getRepository(PortfolioItem)
    const barberId = '00000000-0000-0000-0000-000000000001'
    const item = repo.create({ barberId, title: 'Corte clásico', tags: ['clásico', 'caballero'] })
    await repo.save(item)
    console.log('Seeded portfolio item:', item.id)
  } finally {
    await AppDataSource.destroy()
  }
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
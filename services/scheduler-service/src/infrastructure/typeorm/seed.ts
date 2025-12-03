import { AppDataSource } from './data-source'
import { Block } from '../../domain/entities/block.entity'

async function run() {
  await AppDataSource.initialize()
  try {
    const blockRepo = AppDataSource.getRepository(Block)
    const barberId = '00000000-0000-0000-0000-000000000001'
    const now = new Date()
    const start = new Date(now.getTime() + 60 * 60 * 1000)
    const end = new Date(start.getTime() + 30 * 60 * 1000)
    const block = blockRepo.create({ barberId, start, end })
    await blockRepo.save(block)
    console.log('Seeded scheduler data: block', block.id)
  } finally {
    await AppDataSource.destroy()
  }
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
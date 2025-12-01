import { DataSource } from 'typeorm'
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions'

async function runMigrations() {
  console.log('🚀 Ejecutando migraciones de base de datos...')
  
  try {
    // Configuración directa para migraciones
    const dataSource = new DataSource({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT) || 5432,
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'password',
      database: process.env.DB_NAME || 'barber_booking',
      ssl: process.env.DB_SSL === 'true' ? {
        rejectUnauthorized: false
      } : false,
      migrations: [__dirname + '/src/migrations/*.ts'],
      migrationsRun: false // No ejecutar automáticamente, lo haremos manualmente
    } as PostgresConnectionOptions)

    await dataSource.initialize()
    console.log('✅ Conexión a base de datos establecida')

    // Ejecutar migraciones pendientes
    const migrations = await dataSource.runMigrations()
    console.log(`✅ ${migrations.length} migraciones ejecutadas exitosamente`)

    // Verificar estado de migraciones
    const pendingMigrations = await dataSource.showMigrations()
    console.log(`📊 Estado de migraciones: ${pendingMigrations ? 'Hay migraciones pendientes' : 'Todas las migraciones aplicadas'}`)

    await dataSource.destroy()
    console.log('✅ Conexión cerrada')
    
  } catch (error) {
    console.error('❌ Error ejecutando migraciones:', error)
    process.exit(1)
  }
}

if (require.main === module) {
  runMigrations()
}
import { MigrationInterface, QueryRunner } from "typeorm"

export class InitialBookingSchema1733016000000 implements MigrationInterface {
    name = 'InitialBookingSchema1733016000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Crear tabla de bookings
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS bookings (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                client_id UUID NOT NULL,
                barber_id UUID NOT NULL,
                service_id UUID NOT NULL,
                date DATE NOT NULL,
                start_time TIME NOT NULL,
                end_time TIME NOT NULL,
                status VARCHAR(50) NOT NULL DEFAULT 'pending',
                price DECIMAL(10,2),
                location VARCHAR(255),
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                cancelled_at TIMESTAMP,
                cancellation_reason TEXT
            )
        `)

        // Crear índices
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_bookings_client_id ON bookings(client_id)`)
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_bookings_barber_id ON bookings(barber_id)`)
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(date)`)
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status)`)
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_bookings_date_time ON bookings(date, start_time)`)

        // Crear tabla de servicios de barbero
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS barber_services (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                barber_id UUID NOT NULL,
                service_id UUID NOT NULL,
                price DECIMAL(10,2) NOT NULL,
                duration_minutes INTEGER NOT NULL,
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(barber_id, service_id)
            )
        `)

        await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_barber_services_barber_id ON barber_services(barber_id)`)
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_barber_services_service_id ON barber_services(service_id)`)

        // Crear tabla de horarios de barbero
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS barber_schedules (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                barber_id UUID NOT NULL,
                day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
                start_time TIME NOT NULL,
                end_time TIME NOT NULL,
                is_working_day BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(barber_id, day_of_week)
            )
        `)

        await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_barber_schedules_barber_id ON barber_schedules(barber_id)`)

        // Crear tabla de bloqueos de tiempo
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS time_blocks (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                barber_id UUID NOT NULL,
                date DATE NOT NULL,
                start_time TIME NOT NULL,
                end_time TIME NOT NULL,
                reason VARCHAR(255),
                is_recurring BOOLEAN DEFAULT false,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `)

        await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_time_blocks_barber_id ON time_blocks(barber_id)`)
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_time_blocks_date ON time_blocks(date)`)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS time_blocks`)
        await queryRunner.query(`DROP TABLE IF EXISTS barber_schedules`)
        await queryRunner.query(`DROP TABLE IF EXISTS barber_services`)
        await queryRunner.query(`DROP TABLE IF EXISTS bookings`)
    }
}
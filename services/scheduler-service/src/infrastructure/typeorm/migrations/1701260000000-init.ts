import { MigrationInterface, QueryRunner } from 'typeorm'

export class InitScheduler1701260000000 implements MigrationInterface {
  name = 'InitScheduler1701260000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')
    await queryRunner.query(
      'CREATE TABLE IF NOT EXISTS "blocks" ("id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(), "barberId" uuid NOT NULL, "start" timestamptz NOT NULL, "end" timestamptz NOT NULL, "createdAt" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP)'
    )
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "idx_blocks_barber_id" ON "blocks" ("barberId")'
    )
    await queryRunner.query(
      'CREATE TABLE IF NOT EXISTS "appointments" ("id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(), "barberId" uuid NOT NULL, "clientId" uuid NOT NULL, "start" timestamptz NOT NULL, "end" timestamptz NOT NULL, "status" varchar NOT NULL, "createdAt" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP)'
    )
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "idx_appointments_barber_id" ON "appointments" ("barberId")'
    )
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "idx_appointments_client_id" ON "appointments" ("clientId")'
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX IF EXISTS "idx_appointments_client_id"')
    await queryRunner.query('DROP INDEX IF EXISTS "idx_appointments_barber_id"')
    await queryRunner.query('DROP TABLE IF EXISTS "appointments"')
    await queryRunner.query('DROP INDEX IF EXISTS "idx_blocks_barber_id"')
    await queryRunner.query('DROP TABLE IF EXISTS "blocks"')
  }
}
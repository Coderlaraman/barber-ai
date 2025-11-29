import { MigrationInterface, QueryRunner } from 'typeorm'

export class InitPortfolio1701260000001 implements MigrationInterface {
  name = 'InitPortfolio1701260000001'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')
    await queryRunner.query(
      'CREATE TABLE IF NOT EXISTS "portfolio_items" ("id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(), "barberId" uuid NOT NULL, "title" varchar NOT NULL, "tags" jsonb NULL, "createdAt" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP)'
    )
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "idx_portfolio_items_barber_id" ON "portfolio_items" ("barberId")'
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX IF EXISTS "idx_portfolio_items_barber_id"')
    await queryRunner.query('DROP TABLE IF EXISTS "portfolio_items"')
  }
}
import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateBarberTables1733012345678 implements MigrationInterface {
    name = 'CreateBarberTables1733012345678'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create specialties table
        await queryRunner.query(`
            CREATE TABLE "specialties" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying(100) NOT NULL,
                "description" text,
                "category" character varying(50) NOT NULL,
                "estimated_duration" integer NOT NULL DEFAULT 30,
                "base_price" numeric(10,2) NOT NULL DEFAULT 0,
                "is_active" boolean NOT NULL DEFAULT true,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_specialties_id" PRIMARY KEY ("id")
            )
        `);

        // Create barbers table
        await queryRunner.query(`
            CREATE TABLE "barbers" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "user_id" uuid NOT NULL,
                "license_number" character varying(50) NOT NULL,
                "license_expiry_date" date NOT NULL,
                "years_of_experience" integer NOT NULL DEFAULT 0,
                "bio" text,
                "status" character varying(20) NOT NULL DEFAULT 'ACTIVE',
                "is_verified" boolean NOT NULL DEFAULT false,
                "verification_date" TIMESTAMP,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_barbers_id" PRIMARY KEY ("id"),
                CONSTRAINT "UQ_barbers_user_id" UNIQUE ("user_id"),
                CONSTRAINT "UQ_barbers_license_number" UNIQUE ("license_number")
            )
        `);

        // Create services table
        await queryRunner.query(`
            CREATE TABLE "services" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying(100) NOT NULL,
                "description" text,
                "duration" integer NOT NULL,
                "price" numeric(10,2) NOT NULL,
                "category" character varying(50) NOT NULL,
                "is_active" boolean NOT NULL DEFAULT true,
                "specialty_id" uuid,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_services_id" PRIMARY KEY ("id")
            )
        `);

        // Create barber_locations table
        await queryRunner.query(`
            CREATE TABLE "barber_locations" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "barber_id" uuid NOT NULL,
                "address" character varying(255) NOT NULL,
                "city" character varying(100) NOT NULL,
                "state" character varying(100) NOT NULL,
                "zip_code" character varying(20),
                "country" character varying(100) NOT NULL DEFAULT 'USA',
                "latitude" numeric(10,8) NOT NULL,
                "longitude" numeric(11,8) NOT NULL,
                "is_primary" boolean NOT NULL DEFAULT false,
                "radius_km" integer NOT NULL DEFAULT 10,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_barber_locations_id" PRIMARY KEY ("id")
            )
        `);

        // Create barber_specialties junction table
        await queryRunner.query(`
            CREATE TABLE "barber_specialties" (
                "barber_id" uuid NOT NULL,
                "specialty_id" uuid NOT NULL,
                "proficiency_level" character varying(20) NOT NULL DEFAULT 'INTERMEDIATE',
                "years_experience" integer NOT NULL DEFAULT 0,
                "certified" boolean NOT NULL DEFAULT false,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_barber_specialties" PRIMARY KEY ("barber_id", "specialty_id")
            )
        `);

        // Create indexes for better performance
        await queryRunner.query(`CREATE INDEX "IDX_barbers_user_id" ON "barbers" ("user_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_barbers_status" ON "barbers" ("status")`);
        await queryRunner.query(`CREATE INDEX "IDX_barbers_license_number" ON "barbers" ("license_number")`);
        await queryRunner.query(`CREATE INDEX "IDX_specialties_category" ON "specialties" ("category")`);
        await queryRunner.query(`CREATE INDEX "IDX_specialties_is_active" ON "specialties" ("is_active")`);
        await queryRunner.query(`CREATE INDEX "IDX_services_specialty_id" ON "services" ("specialty_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_services_category" ON "services" ("category")`);
        await queryRunner.query(`CREATE INDEX "IDX_services_is_active" ON "services" ("is_active")`);
        await queryRunner.query(`CREATE INDEX "IDX_barber_locations_barber_id" ON "barber_locations" ("barber_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_barber_locations_coordinates" ON "barber_locations" ("latitude", "longitude")`);
        await queryRunner.query(`CREATE INDEX "IDX_barber_specialties_barber_id" ON "barber_specialties" ("barber_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_barber_specialties_specialty_id" ON "barber_specialties" ("specialty_id")`);

        // Add foreign key constraints
        await queryRunner.query(`
            ALTER TABLE "barbers" 
            ADD CONSTRAINT "FK_barbers_user_id" 
            FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
        `);

        await queryRunner.query(`
            ALTER TABLE "services" 
            ADD CONSTRAINT "FK_services_specialty_id" 
            FOREIGN KEY ("specialty_id") REFERENCES "specialties"("id") ON DELETE SET NULL
        `);

        await queryRunner.query(`
            ALTER TABLE "barber_locations" 
            ADD CONSTRAINT "FK_barber_locations_barber_id" 
            FOREIGN KEY ("barber_id") REFERENCES "barbers"("id") ON DELETE CASCADE
        `);

        await queryRunner.query(`
            ALTER TABLE "barber_specialties" 
            ADD CONSTRAINT "FK_barber_specialties_barber_id" 
            FOREIGN KEY ("barber_id") REFERENCES "barbers"("id") ON DELETE CASCADE
        `);

        await queryRunner.query(`
            ALTER TABLE "barber_specialties" 
            ADD CONSTRAINT "FK_barber_specialties_specialty_id" 
            FOREIGN KEY ("specialty_id") REFERENCES "specialties"("id") ON DELETE CASCADE
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop foreign key constraints
        await queryRunner.query(`ALTER TABLE "barber_specialties" DROP CONSTRAINT "FK_barber_specialties_specialty_id"`);
        await queryRunner.query(`ALTER TABLE "barber_specialties" DROP CONSTRAINT "FK_barber_specialties_barber_id"`);
        await queryRunner.query(`ALTER TABLE "barber_locations" DROP CONSTRAINT "FK_barber_locations_barber_id"`);
        await queryRunner.query(`ALTER TABLE "services" DROP CONSTRAINT "FK_services_specialty_id"`);
        await queryRunner.query(`ALTER TABLE "barbers" DROP CONSTRAINT "FK_barbers_user_id"`);

        // Drop indexes
        await queryRunner.query(`DROP INDEX "public"."IDX_barber_specialties_specialty_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_barber_specialties_barber_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_barber_locations_coordinates"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_barber_locations_barber_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_services_is_active"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_services_category"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_services_specialty_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_specialties_is_active"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_specialties_category"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_barbers_license_number"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_barbers_status"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_barbers_user_id"`);

        // Drop tables
        await queryRunner.query(`DROP TABLE "barber_specialties"`);
        await queryRunner.query(`DROP TABLE "barber_locations"`);
        await queryRunner.query(`DROP TABLE "services"`);
        await queryRunner.query(`DROP TABLE "barbers"`);
        await queryRunner.query(`DROP TABLE "specialties"`);
    }
}
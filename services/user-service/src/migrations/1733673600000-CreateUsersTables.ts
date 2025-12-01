import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateUsersTables1733673600000 implements MigrationInterface {
    name = 'CreateUsersTables1733673600000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Crear tabla users
        await queryRunner.query(`
            CREATE TABLE "users" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "email" character varying NOT NULL,
                "phone" character varying,
                "firstName" character varying NOT NULL,
                "lastName" character varying NOT NULL,
                "dateOfBirth" date,
                "role" character varying NOT NULL DEFAULT 'customer',
                "status" character varying NOT NULL DEFAULT 'pending_verification',
                "latitude" numeric(10,8),
                "longitude" numeric(11,8),
                "emailVerified" boolean NOT NULL DEFAULT false,
                "phoneVerified" boolean NOT NULL DEFAULT false,
                "profileImageUrl" character varying,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "lastLoginAt" TIMESTAMP,
                CONSTRAINT "PK_users" PRIMARY KEY ("id"),
                CONSTRAINT "UQ_users_email" UNIQUE ("email")
            )
        `);

        // Crear tabla user_preferences
        await queryRunner.query(`
            CREATE TABLE "user_preferences" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "userId" uuid NOT NULL,
                "preferenceType" character varying NOT NULL,
                "preferenceValue" text NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_user_preferences" PRIMARY KEY ("id"),
                CONSTRAINT "FK_user_preferences_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
            )
        `);

        // Crear tabla user_addresses
        await queryRunner.query(`
            CREATE TABLE "user_addresses" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "userId" uuid NOT NULL,
                "type" character varying NOT NULL DEFAULT 'home',
                "street" character varying NOT NULL,
                "number" character varying,
                "apartment" character varying,
                "neighborhood" character varying NOT NULL,
                "city" character varying NOT NULL,
                "state" character varying NOT NULL,
                "country" character varying NOT NULL,
                "postalCode" character varying(10) NOT NULL,
                "latitude" numeric(10,8),
                "longitude" numeric(11,8),
                "isDefault" boolean NOT NULL DEFAULT false,
                "isActive" boolean NOT NULL DEFAULT true,
                "reference" character varying(500),
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_user_addresses" PRIMARY KEY ("id"),
                CONSTRAINT "FK_user_addresses_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
            )
        `);

        // Crear índices
        await queryRunner.query(`CREATE INDEX "IDX_users_email" ON "users" ("email") `);
        await queryRunner.query(`CREATE INDEX "IDX_users_status" ON "users" ("status") `);
        await queryRunner.query(`CREATE INDEX "IDX_users_role" ON "users" ("role") `);
        await queryRunner.query(`CREATE INDEX "IDX_user_preferences_userId" ON "user_preferences" ("userId") `);
        await queryRunner.query(`CREATE INDEX "IDX_user_preferences_type" ON "user_preferences" ("preferenceType") `);
        await queryRunner.query(`CREATE INDEX "IDX_user_addresses_userId" ON "user_addresses" ("userId") `);
        await queryRunner.query(`CREATE INDEX "IDX_user_addresses_isDefault" ON "user_addresses" ("isDefault") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "user_addresses"`);
        await queryRunner.query(`DROP TABLE "user_preferences"`);
        await queryRunner.query(`DROP TABLE "users"`);
    }
}
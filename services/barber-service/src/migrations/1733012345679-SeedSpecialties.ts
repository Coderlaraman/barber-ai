import { MigrationInterface, QueryRunner } from "typeorm";

export class SeedSpecialties1733012345679 implements MigrationInterface {
    name = 'SeedSpecialties1733012345679'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Insert common barber specialties
        await queryRunner.query(`
            INSERT INTO "specialties" ("name", "description", "category", "estimated_duration", "base_price", "is_active") VALUES
            -- Cortes de Cabello
            ('Corte Clásico', 'Corte de cabello tradicional con tijeras y máquina', 'CORTE_CABELLO', 30, 25.00, true),
            ('Corte Moderno', 'Corte de cabello con técnicas contemporáneas', 'CORTE_CABELLO', 35, 30.00, true),
            ('Fade/Bajo', 'Corte degradado con transiciones suaves', 'CORTE_CABELLO', 40, 35.00, true),
            ('Taper Fade', 'Corte con degradado en la parte posterior y lateral', 'CORTE_CABELLO', 45, 40.00, true),
            ('Undercut', 'Corte con contraste entre parte superior y laterales', 'CORTE_CABELLO', 35, 32.00, true),
            ('Buzz Cut', 'Corte uniforme con máquina', 'CORTE_CABELLO', 20, 15.00, true),
            ('Corte Infantil', 'Corte especializado para niños', 'CORTE_CABELLO', 25, 20.00, true),
            ('Corte Ejecutivo', 'Corte profesional y pulido', 'CORTE_CABELLO', 30, 28.00, true),
            ('Corte Texturizado', 'Corte que añade textura y movimiento', 'CORTE_CABELLO', 40, 35.00, true),
            ('Mullet', 'Corte con parte trasera larga y frontal corta', 'CORTE_CABELLO', 35, 30.00, true),
            
            -- Barba y Bigote
            ('Barba Completa', 'Afeitado y diseño de barba completa', 'BARBA_BIGOTE', 25, 20.00, true),
            ('Barba de 3 Días', 'Mantenimiento de barba corta y desaliñada', 'BARBA_BIGOTE', 20, 18.00, true),
            ('Barba Imperial', 'Estilo de barba con bigote largo y curvado', 'BARBA_BIGOTE', 30, 25.00, true),
            ('Goatee', 'Barba en la barbilla sin bigote', 'BARBA_BIGOTE', 20, 15.00, true),
            ('Bigote Clásico', 'Diseño y mantenimiento de bigote tradicional', 'BARBA_BIGOTE', 15, 12.00, true),
            ('Bigote Handlebar', 'Bigote con extremos curvados hacia arriba', 'BARBA_BIGOTE', 25, 20.00, true),
            ('Afeitado Tradicional', 'Afeitado con navaja de barbero', 'BARBA_BIGOTE', 30, 25.00, true),
            ('Barba Hipster', 'Barba larga con diseño moderno', 'BARBA_BIGOTE', 35, 30.00, true),
            ('Line Up', 'Diseño de líneas definidas en barba y cabello', 'BARBA_BIGOTE', 15, 12.00, true),
            ('Barba Desvanecida', 'Barba con transición gradual', 'BARBA_BIGOTE', 25, 22.00, true),
            
            -- Tratamientos Capilares
            ('Tratamiento Anticaída', 'Tratamiento para prevenir caída de cabello', 'TRATAMIENTO_CAPILAR', 45, 50.00, true),
            ('Tratamiento Anticaspa', 'Tratamiento para controlar caspa', 'TRATAMIENTO_CAPILAR', 30, 35.00, true),
            ('Hidratación Capilar', 'Tratamiento hidratante para cabello seco', 'TRATAMIENTO_CAPILAR', 40, 40.00, true),
            ('Nutrición Capilar', 'Tratamiento nutritivo para cabello dañado', 'TRATAMIENTO_CAPILAR', 50, 45.00, true),
            ('Reconstrucción Capilar', 'Tratamiento intensivo para cabello muy dañado', 'TRATAMIENTO_CAPILAR', 60, 65.00, true),
            ('Alisado Natural', 'Alisado con productos naturales', 'TRATAMIENTO_CAPILAR', 90, 80.00, true),
            ('Keratina', 'Tratamiento de queratina para alisado', 'TRATAMIENTO_CAPILAR', 120, 150.00, true),
            ('Botox Capilar', 'Tratamiento rejuvenecedor para cabello', 'TRATAMIENTO_CAPILAR', 75, 90.00, true),
            ('Tintura', 'Coloración de cabello', 'TRATAMIENTO_CAPILAR', 60, 70.00, true),
            ('Mechas', 'Mechas o reflejos en el cabello', 'TRATAMIENTO_CAPILAR', 90, 95.00, true),
            
            -- Diseño y Estilo
            ('Diseño de Cejas', 'Diseño y depilación de cejas', 'DISEÑO_ESTILO', 15, 10.00, true),
            ('Diseño de Patillas', 'Diseño de patillas laterales', 'DISEÑO_ESTILO', 10, 8.00, true),
            ('Corte con Diseño', 'Corte con diseños geométricos o artísticos', 'DISEÑO_ESTILO', 45, 35.00, true),
            ('Raya al Centro', 'Peinado con raya en el centro', 'DISEÑO_ESTILO', 10, 5.00, true),
            ('Raya al Lado', 'Peinado con raya lateral', 'DISEÑO_ESTILO', 10, 5.00, true),
            ('Peinado Formal', 'Peinado para ocasiones especiales', 'DISEÑO_ESTILO', 20, 15.00, true),
            ('Peinado Casual', 'Peinado para uso diario', 'DISEÑO_ESTILO', 15, 10.00, true),
            ('Estilo Vintage', 'Peinado retro o vintage', 'DISEÑO_ESTILO', 25, 20.00, true),
            ('Estilo Moderno', 'Peinado con tendencias actuales', 'DISEÑO_ESTILO', 20, 18.00, true),
            ('Asesoría de Imagen', 'Consulta sobre estilo y cuidado personal', 'DISEÑO_ESTILO', 30, 25.00, true),
            
            -- Servicios Especiales
            ('Corte y Barba', 'Combo de corte de cabello y barba', 'SERVICIO_ESPECIAL', 50, 40.00, true),
            ('Paquete Ejecutivo', 'Corte, barba y tratamiento capilar', 'SERVICIO_ESPECIAL', 75, 65.00, true),
            ('Paquete Novio', 'Servicio completo para ocasiones especiales', 'SERVICIO_ESPECIAL', 90, 85.00, true),
            ('Servicio a Domicilio', 'Servicio a domicilio dentro del radio permitido', 'SERVICIO_ESPECIAL', 60, 50.00, true),
            ('Servicio Express', 'Servicio rápido en menos tiempo', 'SERVICIO_ESPECIAL', 20, 25.00, true),
            ('Servicio VIP', 'Servicio premium con productos de lujo', 'SERVICIO_ESPECIAL', 120, 120.00, true),
            ('Corte con Terapia', 'Corte con masaje craneal relajante', 'SERVICIO_ESPECIAL', 45, 45.00, true),
            ('Paquete Familiar', 'Servicio para padre e hijo', 'SERVICIO_ESPECIAL', 60, 50.00, true),
            ('Servicio de Emergencia', 'Servicio urgente fuera de horario', 'SERVICIO_ESPECIAL', 30, 75.00, true),
            ('Membresía Mensual', 'Servicio mensual con descuento', 'SERVICIO_ESPECIAL', 0, 200.00, true)
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Delete all specialties
        await queryRunner.query(`DELETE FROM "specialties"`);
    }
}
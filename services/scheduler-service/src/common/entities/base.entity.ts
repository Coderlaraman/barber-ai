import {
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  VersionColumn,
  BeforeUpdate,
  BeforeRemove,
  AfterLoad,
} from 'typeorm';
import { Exclude } from 'class-transformer';

/**
 * Entidad base abstracta que proporciona:
 * - Auditoría completa (creación, modificación, eliminación)
 * - Soft delete con recuperación
 * - Control de versiones para optimistic locking
 * - Gestión de históricos para análisis y métricas
 * - Trazabilidad de cambios
 */
export abstract class BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamptz',
    comment: 'Timestamp de creación del registro',
  })
  createdAt!: Date;

  @Column({
    name: 'created_by',
    type: 'uuid',
    nullable: true,
    comment: 'ID del usuario que creó el registro',
  })
  createdBy?: string;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamptz',
    comment: 'Timestamp de última modificación',
  })
  updatedAt!: Date;

  @Column({
    name: 'updated_by',
    type: 'uuid',
    nullable: true,
    comment: 'ID del usuario que realizó la última modificación',
  })
  updatedBy?: string;

  @DeleteDateColumn({
    name: 'deleted_at',
    type: 'timestamptz',
    nullable: true,
    comment: 'Timestamp de eliminación lógica (soft delete)',
  })
  @Exclude()
  deletedAt?: Date;

  @Column({
    name: 'deleted_by',
    type: 'uuid',
    nullable: true,
    comment: 'ID del usuario que realizó la eliminación lógica',
  })
  @Exclude()
  deletedBy?: string;

  @Column({
    name: 'is_active',
    type: 'boolean',
    default: true,
    comment: 'Indica si el registro está activo (no eliminado)',
  })
  isActive!: boolean;

  @Column({
    name: 'metadata',
    type: 'jsonb',
    nullable: true,
    default: {},
    comment: 'Metadatos adicionales en formato JSON',
  })
  metadata?: Record<string, any>;

  @VersionColumn({
    name: 'version',
    type: 'integer',
    default: 1,
    comment: 'Control de versiones para optimistic locking',
  })
  version!: number;

  @Column({
    name: 'tenant_id',
    type: 'uuid',
    nullable: true,
    comment: 'ID del tenant para multi-tenancy (futura escalabilidad)',
  })
  @Exclude()
  tenantId?: string;

  // Propiedades transientes para lógica de negocio
  @AfterLoad()
  updateActiveStatus() {
    this.isActive = !this.deletedAt;
  }

  @BeforeUpdate()
  updateMetadata() {
    if (!this.metadata) {
      this.metadata = {};
    }
    this.metadata.lastUpdated = new Date().toISOString();
  }

  @BeforeRemove()
  preventHardDelete() {
    throw new Error('Hard delete is not allowed. Use soft delete instead.');
  }

  /**
   * Método para soft delete con auditoría
   */
  async softDelete(userId?: string): Promise<void> {
    this.deletedAt = new Date();
    this.deletedBy = userId;
    this.isActive = false;
  }

  /**
   * Método para recuperar un registro eliminado
   */
  async restore(): Promise<void> {
    this.deletedAt = undefined;
    this.deletedBy = undefined;
    this.isActive = true;
  }

  /**
   * Verificar si el registro está eliminado
   */
  isDeleted(): boolean {
    return !!this.deletedAt;
  }

  /**
   * Obtener tiempo de vida del registro
   */
  getLifetime(): number {
    return Date.now() - this.createdAt.getTime();
  }

  /**
   * Verificar si el registro es reciente (últimos 30 días)
   */
  isRecent(days: number = 30): boolean {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - days);
    return this.createdAt > thirtyDaysAgo;
  }

  /**
   * Actualizar campos de auditoría
   */
  async updateAuditFields(userId?: string): Promise<void> {
    this.updatedAt = new Date();
    this.updatedBy = userId;
  }
}
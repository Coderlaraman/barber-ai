import {
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Column,
  VersionColumn,
} from 'typeorm';

export abstract class BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @VersionColumn()
  version: number;

  @Column({ nullable: true })
  createdBy: string;

  @Column({ nullable: true })
  updatedBy: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'boolean', default: false })
  isDeleted: boolean;

  @Column({ nullable: true })
  deletedAt: Date;

  @Column({ nullable: true })
  deletedBy: string;

  async softDelete(userId?: string): Promise<void> {
    this.isDeleted = true;
    this.deletedAt = new Date();
    this.deletedBy = userId;
    this.isActive = false;
  }

  async restore(): Promise<void> {
    this.isDeleted = false;
    this.deletedAt = null;
    this.deletedBy = null;
    this.isActive = true;
  }

  async updateAuditFields(userId?: string): Promise<void> {
    this.updatedAt = new Date();
    this.updatedBy = userId;
  }
}
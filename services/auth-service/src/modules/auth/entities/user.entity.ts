import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm'

export enum UserRole {
  BARBER = 'BARBER',
  CLIENT = 'CLIENT',
  ADMIN = 'ADMIN'
}

export enum AuthProvider {
  LOCAL = 'local',
  GOOGLE = 'google',
  FACEBOOK = 'facebook'
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ unique: true })
  email!: string

  @Column({ nullable: true })
  name?: string

  @Column({ nullable: true })
  passwordHash?: string

  @Column({ type: 'enum', enum: UserRole })
  role!: UserRole

  @Column({ type: 'enum', enum: AuthProvider, default: AuthProvider.LOCAL })
  authProvider!: AuthProvider

  @Column({ nullable: true })
  failedLoginAttempts?: number

  @Column({ nullable: true })
  lockedUntil?: Date

  @CreateDateColumn()
  createdAt!: Date

  @UpdateDateColumn()
  updatedAt!: Date
}
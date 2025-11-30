import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm'

@Entity('token_blacklist')
export class TokenBlacklist {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ unique: true })
  token!: string

  @Column()
  expiresAt!: Date

  @CreateDateColumn()
  createdAt!: Date
}

@Injectable()
export class TokenBlacklistService {
  constructor(
    @InjectRepository(TokenBlacklist)
    private readonly blacklistRepository: Repository<TokenBlacklist>
  ) {}

  async addToBlacklist(token: string): Promise<void> {
    // Extract expiration from JWT token
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString())
    const expiresAt = new Date(payload.exp * 1000)
    
    const blacklistEntry = this.blacklistRepository.create({
      token,
      expiresAt
    })
    
    await this.blacklistRepository.save(blacklistEntry)
  }

  async isBlacklisted(token: string): Promise<boolean> {
    const entry = await this.blacklistRepository.findOne({
      where: { token }
    })
    
    return !!entry
  }

  async cleanupExpiredTokens(): Promise<void> {
    await this.blacklistRepository
      .createQueryBuilder()
      .delete()
      .where('expiresAt < :now', { now: new Date() })
      .execute()
  }
}
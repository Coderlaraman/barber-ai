import { describe, it, expect } from '@jest/globals'
import { Test } from '@nestjs/testing'
import { JwtModule } from '@nestjs/jwt'
import { getRepositoryToken } from '@nestjs/typeorm'
import { AuthService } from '../src/modules/auth/auth.service'
import { User, UserRole } from '../src/modules/auth/entities/user.entity'

describe('AuthService', () => {
  it('registers a user and returns tokens', async () => {
    const store: User[] = []
    const repoMock = {
      findOne: async (opts: { where: { email?: string; id?: string } }) => {
        const { email, id } = opts.where
        return store.find((u) => (email ? u.email === email : true) && (id ? u.id === id : true)) || null
      },
      create: (data: Partial<User>) => ({ ...data } as User),
      save: async (user: User) => {
        if (!user.id) user.id = Math.random().toString(36).slice(2)
        const existingIdx = store.findIndex((u) => u.id === user.id)
        if (existingIdx >= 0) store[existingIdx] = user
        else store.push(user)
        return user
      }
    }

    const moduleRef = await Test.createTestingModule({
      imports: [JwtModule.register({ secret: 'test', signOptions: { expiresIn: '1h' } })],
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: repoMock }
      ]
    }).compile()

    const svc = moduleRef.get(AuthService)
    const res = await svc.register('unit@example.com', 'password123', UserRole.BARBER)
    expect(res.user.email).toBe('unit@example.com')
    expect(res.accessToken).toBeDefined()
    expect(res.refreshToken).toBeDefined()
  })
})
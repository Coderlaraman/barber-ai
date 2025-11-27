import { Injectable } from '@nestjs/common'

@Injectable()
export class RedisSubscriber {
  subscribe(_channel: string) {}
}
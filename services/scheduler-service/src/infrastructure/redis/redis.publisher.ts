import { Injectable } from '@nestjs/common'

@Injectable()
export class RedisPublisher {
  publish(_channel: string, _message: any) {}
}
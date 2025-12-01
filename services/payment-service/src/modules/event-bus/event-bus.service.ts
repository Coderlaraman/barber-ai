import { Injectable } from '@nestjs/common'
import { EventEmitter2 } from '@nestjs/event-emitter'

export interface EventPayload {
  eventId: string
  eventType: string
  aggregateId: string
  aggregateType: string
  payload: any
  metadata: any
}

@Injectable()
export class EventBusService {
  constructor(private eventEmitter: EventEmitter2) {}

  async publish(event: EventPayload): Promise<void> {
    this.eventEmitter.emit(event.eventType, event)
  }

  async subscribe(eventType: string, handler: (event: EventPayload) => void): Promise<void> {
    this.eventEmitter.on(eventType, handler)
  }
}
export interface ScheduleBlockedEvent {
  blockId: string
  barberId: string
  start: string
  end: string
}

export interface ScheduleReleasedEvent {
  blockId: string
  barberId: string
}
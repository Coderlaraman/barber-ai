export interface BookingCreatedEvent {
  appointmentId: string
  barberId: string
  clientId: string
  start: string
  end: string
}

export interface BookingCancelledEvent {
  appointmentId: string
  reason?: string
}
/**
 * @deprecated Use booking-events.ts instead
 * Eventos de booking legacy - serán removidos en versión futura
 */
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
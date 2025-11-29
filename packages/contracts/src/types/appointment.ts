export interface Appointment {
  id: string
  barberId: string
  clientId: string
  serviceId: string
  start: string
  end: string
  status: 'REQUESTED' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED'
}
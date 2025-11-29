export interface ReviewCreatedEvent {
  reviewId: string
  appointmentId: string
  barberId: string
  rating: number
}
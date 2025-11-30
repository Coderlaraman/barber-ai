export enum NotificationChannel {
  EMAIL = 'email',
  PUSH = 'push',
  SMS = 'sms',
  IN_APP = 'in_app'
}

export enum NotificationStatus {
  PENDING = 'pending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export enum NotificationType {
  // Appointment notifications
  APPOINTMENT_CONFIRMED = 'appointment_confirmed',
  APPOINTMENT_REMINDER = 'appointment_reminder',
  APPOINTMENT_CANCELLED = 'appointment_cancelled',
  APPOINTMENT_RESCHEDULED = 'appointment_rescheduled',
  APPOINTMENT_COMPLETED = 'appointment_completed',
  
  // Payment notifications
  PAYMENT_CONFIRMED = 'payment_confirmed',
  PAYMENT_FAILED = 'payment_failed',
  PAYMENT_REMINDER = 'payment_reminder',
  REFUND_PROCESSED = 'refund_processed',
  
  // Review notifications
  REVIEW_REQUEST = 'review_request',
  REVIEW_RECEIVED = 'review_received',
  
  // User account notifications
  WELCOME = 'welcome',
  EMAIL_VERIFICATION = 'email_verification',
  PASSWORD_RESET = 'password_reset',
  PROFILE_UPDATED = 'profile_updated',
  
  // Barber/Professional notifications
  NEW_BOOKING = 'new_booking',
  BOOKING_CANCELLED = 'booking_cancelled',
  BOOKING_REMINDER = 'booking_reminder',
  AVAILABILITY_REMINDER = 'availability_reminder',
  
  // System notifications
  SYSTEM_UPDATE = 'system_update',
  MAINTENANCE_NOTICE = 'maintenance_notice',
  
  // Promotional notifications
  PROMOTIONAL = 'promotional',
  SPECIAL_OFFER = 'special_offer',
  LOYALTY_REWARD = 'loyalty_reward'
}
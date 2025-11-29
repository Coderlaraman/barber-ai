export interface User {
  id: string
  email: string
  role: 'CLIENT' | 'BARBER' | 'ADMIN'
}
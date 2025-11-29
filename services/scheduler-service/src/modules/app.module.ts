import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { SchedulerModule } from './scheduler.module'
import { TypeOrmModule } from '@nestjs/typeorm'
import { HealthModule } from './health/health.module'
import { Appointment } from './appointments/entities/appointment.entity'
import { AppointmentHistory } from './appointments/entities/appointment-history.entity'
import { BarberAvailability } from './availability/entities/barber-availability.entity'
import { Service } from './services/entities/service.entity'
import { TimeSlot } from './time-slots/entities/time-slot.entity'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      useFactory: () => {
        const url = process.env.DATABASE_URL
        const base: any = { 
          type: 'postgres', 
          entities: [
            Appointment, 
            AppointmentHistory, 
            BarberAvailability, 
            Service, 
            TimeSlot
          ], 
          synchronize: false 
        }
        if (url) return { ...base, url }
        return {
          ...base,
          host: process.env.DB_HOST || 'postgres',
          port: Number(process.env.DB_PORT || 5432),
          username: process.env.DB_USER || 'barber',
          password: process.env.DB_PASSWORD || 'barber',
          database: process.env.DB_NAME || 'barber'
        }
      }
    }),
    HealthModule,
    SchedulerModule
  ]
})
export class AppModule {}
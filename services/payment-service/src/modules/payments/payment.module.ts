import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { PaymentService } from './payment.service'
import { PaymentController } from './payment.controller'
import { WalletService } from './wallet.service'
import { CommissionService } from './commission.service'
import { StripeService } from './providers/stripe.service'
import { PayPalService } from './providers/paypal.service'
import { Payment } from './entities/payment.entity'
import { Transaction } from './entities/transaction.entity'
import { Wallet } from './entities/wallet.entity'
import { Commission } from './entities/commission.entity'
import { EventBusModule } from '../event-bus/event-bus.module'

@Module({
  imports: [
    TypeOrmModule.forFeature([Payment, Transaction, Wallet, Commission]),
    EventBusModule,
  ],
  controllers: [PaymentController],
  providers: [PaymentService, WalletService, CommissionService, StripeService, PayPalService],
  exports: [PaymentService, WalletService, CommissionService],
})
export class PaymentModule {}
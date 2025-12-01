import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  ValidationPipe,
  UsePipes,
  Logger,
  ParseUUIDPipe,
} from '@nestjs/common'
import { PaymentService } from './payment.service'
import { CreatePaymentDto } from './dto/create-payment.dto'
import { ProcessPaymentDto } from './dto/process-payment.dto'

@Controller('payments')
export class PaymentController {
  private readonly logger = new Logger(PaymentController.name)

  constructor(private readonly paymentService: PaymentService) {}

  @Post()
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async createPayment(@Body() createPaymentDto: CreatePaymentDto) {
    this.logger.log(`Creating payment for user ${createPaymentDto.userId}`)
    const payment = await this.paymentService.createPayment(createPaymentDto)
    return {
      success: true,
      data: payment,
      message: 'Payment created successfully',
    }
  }

  @Post('process')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async processPayment(@Body() processPaymentDto: ProcessPaymentDto) {
    this.logger.log(`Processing payment ${processPaymentDto.paymentId}`)
    const payment = await this.paymentService.processPayment(processPaymentDto)
    return {
      success: true,
      data: payment,
      message: 'Payment processed successfully',
    }
  }

  @Post(':id/capture')
  async capturePayment(@Param('id', ParseUUIDPipe) id: string) {
    this.logger.log(`Capturing payment ${id}`)
    const payment = await this.paymentService.capturePayment(id)
    return {
      success: true,
      data: payment,
      message: 'Payment captured successfully',
    }
  }

  @Post(':id/refund')
  async refundPayment(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('amount') amount?: number,
    @Query('reason') reason?: string,
  ) {
    this.logger.log(`Refunding payment ${id}`)
    const payment = await this.paymentService.refundPayment(id, amount, reason)
    return {
      success: true,
      data: payment,
      message: 'Payment refunded successfully',
    }
  }

  @Get(':id')
  async getPayment(@Param('id', ParseUUIDPipe) id: string) {
    this.logger.log(`Getting payment ${id}`)
    const payment = await this.paymentService.getPaymentById(id)
    return {
      success: true,
      data: payment,
      message: 'Payment retrieved successfully',
    }
  }

  @Get('user/:userId')
  async getUserPayments(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Query('limit') limit?: number,
  ) {
    this.logger.log(`Getting payments for user ${userId}`)
    const payments = await this.paymentService.getPaymentsByUserId(userId, limit)
    return {
      success: true,
      data: payments,
      message: 'User payments retrieved successfully',
    }
  }

  @Get('booking/:bookingId')
  async getBookingPayments(@Param('bookingId', ParseUUIDPipe) bookingId: string) {
    this.logger.log(`Getting payments for booking ${bookingId}`)
    const payments = await this.paymentService.getPaymentsByBookingId(bookingId)
    return {
      success: true,
      data: payments,
      message: 'Booking payments retrieved successfully',
    }
  }
}
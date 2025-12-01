import { Injectable, Logger } from '@nestjs/common'
import Stripe from 'stripe'
import { ConfigService } from '@nestjs/config'
import { Payment } from '../entities/payment.entity'
import { ProcessPaymentDto } from '../dto/process-payment.dto'

@Injectable()
export class StripeService {
  private stripe: Stripe
  private readonly logger = new Logger(StripeService.name)

  constructor(private configService: ConfigService) {
    const stripeSecretKey = this.configService.get<string>('STRIPE_SECRET_KEY')
    if (!stripeSecretKey) {
      this.logger.warn('Stripe secret key not configured')
    } else {
      this.stripe = new Stripe(stripeSecretKey, {
        apiVersion: '2024-04-10',
      })
    }
  }

  async processPayment(payment: Payment, processPaymentDto: ProcessPaymentDto): Promise<any> {
    try {
      this.logger.log(`Processing Stripe payment for ${payment.id}`)

      const paymentIntentData: Stripe.PaymentIntentCreateParams = {
        amount: Math.round(payment.amount * 100), // Convert to cents
        currency: payment.currency.toLowerCase(),
        customer: processPaymentDto.customerId,
        payment_method: processPaymentDto.paymentMethodId,
        confirm: false, // We'll confirm separately
        metadata: {
          paymentId: payment.id,
          userId: payment.userId,
          bookingId: payment.bookingId,
        },
      }

      const paymentIntent = await this.stripe.paymentIntents.create(paymentIntentData)

      this.logger.log(`Stripe payment intent created: ${paymentIntent.id}`)
      return {
        id: paymentIntent.id,
        status: paymentIntent.status,
        clientSecret: paymentIntent.client_secret,
        amount: paymentIntent.amount / 100, // Convert back to dollars
        currency: paymentIntent.currency,
      }
    } catch (error) {
      this.logger.error(`Stripe payment processing failed:`, error)
      throw new Error(`Stripe payment failed: ${error.message}`)
    }
  }

  async capturePayment(payment: Payment): Promise<any> {
    try {
      this.logger.log(`Capturing Stripe payment for ${payment.id}`)

      if (!payment.providerReference) {
        throw new Error('No Stripe payment intent ID found')
      }

      const paymentIntent = await this.stripe.paymentIntents.capture(payment.providerReference)

      this.logger.log(`Stripe payment captured: ${paymentIntent.id}`)
      return {
        id: paymentIntent.id,
        status: paymentIntent.status,
        amount: paymentIntent.amount_received / 100,
        currency: paymentIntent.currency,
      }
    } catch (error) {
      this.logger.error(`Stripe payment capture failed:`, error)
      throw new Error(`Stripe payment capture failed: ${error.message}`)
    }
  }

  async refundPayment(payment: Payment, amount: number, reason?: string): Promise<any> {
    try {
      this.logger.log(`Refunding Stripe payment for ${payment.id}`)

      if (!payment.providerReference) {
        throw new Error('No Stripe payment intent ID found')
      }

      const refundData: Stripe.RefundCreateParams = {
        payment_intent: payment.providerReference,
        amount: Math.round(amount * 100), // Convert to cents
        reason: this.mapRefundReason(reason),
        metadata: {
          paymentId: payment.id,
          originalAmount: payment.amount,
          refundReason: reason,
        },
      }

      const refund = await this.stripe.refunds.create(refundData)

      this.logger.log(`Stripe refund created: ${refund.id}`)
      return {
        id: refund.id,
        status: refund.status,
        amount: refund.amount / 100,
        currency: refund.currency,
        reason: refund.reason,
      }
    } catch (error) {
      this.logger.error(`Stripe refund failed:`, error)
      throw new Error(`Stripe refund failed: ${error.message}`)
    }
  }

  private mapRefundReason(reason?: string): Stripe.RefundCreateParams.Reason | undefined {
    if (!reason) return undefined

    const reasonLower = reason.toLowerCase()
    if (reasonLower.includes('duplicate')) return 'duplicate'
    if (reasonLower.includes('fraud') || reasonLower.includes('fraudulent')) return 'fraudulent'
    if (reasonLower.includes('request') || reasonLower.includes('customer')) return 'requested_by_customer'
    
    return undefined
  }

  async createCustomer(email: string, name?: string, metadata?: any): Promise<Stripe.Customer> {
    try {
      const customerData: Stripe.CustomerCreateParams = {
        email,
        metadata,
      }

      if (name) {
        customerData.name = name
      }

      const customer = await this.stripe.customers.create(customerData)
      this.logger.log(`Stripe customer created: ${customer.id}`)
      return customer
    } catch (error) {
      this.logger.error(`Stripe customer creation failed:`, error)
      throw new Error(`Stripe customer creation failed: ${error.message}`)
    }
  }

  async getCustomer(customerId: string): Promise<Stripe.Customer> {
    try {
      const customer = await this.stripe.customers.retrieve(customerId)
      this.logger.log(`Stripe customer retrieved: ${customer.id}`)
      return customer as Stripe.Customer
    } catch (error) {
      this.logger.error(`Stripe customer retrieval failed:`, error)
      throw new Error(`Stripe customer retrieval failed: ${error.message}`)
    }
  }

  async createSetupIntent(customerId: string): Promise<Stripe.SetupIntent> {
    try {
      const setupIntent = await this.stripe.setupIntents.create({
        customer: customerId,
        usage: 'off_session',
      })

      this.logger.log(`Stripe setup intent created: ${setupIntent.id}`)
      return setupIntent
    } catch (error) {
      this.logger.error(`Stripe setup intent creation failed:`, error)
      throw new Error(`Stripe setup intent creation failed: ${error.message}`)
    }
  }

  async listPaymentMethods(customerId: string): Promise<Stripe.PaymentMethod[]> {
    try {
      const paymentMethods = await this.stripe.paymentMethods.list({
        customer: customerId,
        type: 'card',
      })

      this.logger.log(`Retrieved ${paymentMethods.data.length} payment methods for customer ${customerId}`)
      return paymentMethods.data
    } catch (error) {
      this.logger.error(`Stripe payment methods listing failed:`, error)
      throw new Error(`Stripe payment methods listing failed: ${error.message}`)
    }
  }
}
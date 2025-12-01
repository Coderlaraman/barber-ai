import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Payment } from '../entities/payment.entity'
import { ProcessPaymentDto } from '../dto/process-payment.dto'

@Injectable()
export class PayPalService {
  private readonly logger = new Logger(PayPalService.name)
  private paypalClientId: string
  private paypalClientSecret: string
  private paypalEnvironment: string
  private accessToken: string
  private tokenExpiry: Date

  constructor(private configService: ConfigService) {
    this.paypalClientId = this.configService.get<string>('PAYPAL_CLIENT_ID')
    this.paypalClientSecret = this.configService.get<string>('PAYPAL_CLIENT_SECRET')
    this.paypalEnvironment = this.configService.get<string>('PAYPAL_ENVIRONMENT', 'sandbox')

    if (!this.paypalClientId || !this.paypalClientSecret) {
      this.logger.warn('PayPal credentials not configured')
    }
  }

  async processPayment(payment: Payment, processPaymentDto: ProcessPaymentDto): Promise<any> {
    try {
      this.logger.log(`Processing PayPal payment for ${payment.id}`)

      await this.ensureValidToken()

      const orderData = {
        intent: 'AUTHORIZE',
        purchase_units: [
          {
            reference_id: payment.id,
            amount: {
              currency_code: payment.currency,
              value: payment.amount.toString(),
            },
            description: payment.description || `Payment for ${payment.type}`,
          },
        ],
        payer: {
          email_address: payment.customerEmail,
          name: {
            given_name: payment.customerName?.split(' ')[0] || 'Customer',
            surname: payment.customerName?.split(' ')[1] || '',
          },
        },
      }

      const response = await this.makePayPalRequest('/v2/checkout/orders', 'POST', orderData)

      this.logger.log(`PayPal order created: ${response.id}`)
      return {
        id: response.id,
        status: response.status,
        links: response.links,
        amount: payment.amount,
        currency: payment.currency,
      }
    } catch (error) {
      this.logger.error(`PayPal payment processing failed:`, error)
      throw new Error(`PayPal payment failed: ${error.message}`)
    }
  }

  async capturePayment(payment: Payment): Promise<any> {
    try {
      this.logger.log(`Capturing PayPal payment for ${payment.id}`)

      if (!payment.providerReference) {
        throw new Error('No PayPal order ID found')
      }

      await this.ensureValidToken()

      const captureData = {
        amount: {
          currency_code: payment.currency,
          value: payment.amount.toString(),
        },
      }

      const response = await this.makePayPalRequest(
        `/v2/checkout/orders/${payment.providerReference}/capture`,
        'POST',
        captureData
      )

      this.logger.log(`PayPal payment captured: ${response.id}`)
      return {
        id: response.id,
        status: response.status,
        amount: payment.amount,
        currency: payment.currency,
      }
    } catch (error) {
      this.logger.error(`PayPal payment capture failed:`, error)
      throw new Error(`PayPal payment capture failed: ${error.message}`)
    }
  }

  async refundPayment(payment: Payment, amount: number, reason?: string): Promise<any> {
    try {
      this.logger.log(`Refunding PayPal payment for ${payment.id}`)

      if (!payment.providerReference) {
        throw new Error('No PayPal order ID found')
      }

      await this.ensureValidToken()

      // First, get the capture ID from the order
      const orderResponse = await this.makePayPalRequest(
        `/v2/checkout/orders/${payment.providerReference}`,
        'GET'
      )

      const captureId = this.extractCaptureId(orderResponse)
      if (!captureId) {
        throw new Error('No capture ID found for PayPal order')
      }

      const refundData = {
        amount: {
          currency_code: payment.currency,
          value: amount.toString(),
        },
        note_to_payer: reason || 'Refund for payment',
      }

      const response = await this.makePayPalRequest(
        `/v2/payments/captures/${captureId}/refund`,
        'POST',
        refundData
      )

      this.logger.log(`PayPal refund created: ${response.id}`)
      return {
        id: response.id,
        status: response.status,
        amount: amount,
        currency: payment.currency,
      }
    } catch (error) {
      this.logger.error(`PayPal refund failed:`, error)
      throw new Error(`PayPal refund failed: ${error.message}`)
    }
  }

  private async ensureValidToken(): Promise<void> {
    if (!this.accessToken || !this.tokenExpiry || new Date() >= this.tokenExpiry) {
      await this.getAccessToken()
    }
  }

  private async getAccessToken(): Promise<void> {
    try {
      const auth = Buffer.from(`${this.paypalClientId}:${this.paypalClientSecret}`).toString('base64')
      
      const response = await fetch(`${this.getPayPalBaseUrl()}/v1/oauth2/token`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'grant_type=client_credentials',
      })

      if (!response.ok) {
        throw new Error(`PayPal authentication failed: ${response.statusText}`)
      }

      const data = await response.json()
      this.accessToken = data.access_token
      this.tokenExpiry = new Date(Date.now() + (data.expires_in * 1000) - 60000) // Refresh 1 minute before expiry

      this.logger.log('PayPal access token obtained successfully')
    } catch (error) {
      this.logger.error('Failed to get PayPal access token:', error)
      throw new Error('PayPal authentication failed')
    }
  }

  private async makePayPalRequest(endpoint: string, method: string, data?: any): Promise<any> {
    const url = `${this.getPayPalBaseUrl()}${endpoint}`
    
    const options: RequestInit = {
      method,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
    }

    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      options.body = JSON.stringify(data)
    }

    const response = await fetch(url, options)

    if (!response.ok) {
      const errorData = await response.text()
      throw new Error(`PayPal API error: ${response.status} ${response.statusText} - ${errorData}`)
    }

    return response.json()
  }

  private getPayPalBaseUrl(): string {
    return this.paypalEnvironment === 'live' 
      ? 'https://api.paypal.com' 
      : 'https://api.sandbox.paypal.com'
  }

  private extractCaptureId(orderResponse: any): string | null {
    // Extract capture ID from PayPal order response
    if (orderResponse.purchase_units && orderResponse.purchase_units.length > 0) {
      const purchaseUnit = orderResponse.purchase_units[0]
      if (purchaseUnit.payments && purchaseUnit.payments.captures && purchaseUnit.payments.captures.length > 0) {
        return purchaseUnit.payments.captures[0].id
      }
    }
    return null
  }

  async createCustomer(email: string, name?: string): Promise<any> {
    // PayPal doesn't have a direct customer creation API like Stripe
    // This would typically be handled through the order creation process
    this.logger.log(`PayPal customer creation not implemented - handled through orders`)
    return {
      id: `paypal_customer_${Date.now()}`,
      email,
      name,
    }
  }
}
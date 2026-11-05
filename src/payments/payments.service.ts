import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Razorpay from 'razorpay';
import * as crypto from 'crypto';
import { UsersService } from '../users/users.service';

@Injectable()
export class PaymentsService {
  private razorpay: any;

  constructor(
    private usersService: UsersService,
    private configService: ConfigService,
  ) {
    const key_id = this.configService.get<string>('RAZORPAY_KEY_ID') || process.env.RAZORPAY_KEY_ID || '';
    const key_secret = this.configService.get<string>('RAZORPAY_KEY_SECRET') || process.env.RAZORPAY_KEY_SECRET || '';

    if (!key_id || !key_secret) {
      console.warn('⚠️ RAZORPAY KEYS MISSING FROM .ENV! Payments will not work.');
      this.razorpay = null;
    } else {
      this.razorpay = new Razorpay({ key_id, key_secret });
    }
  }

  async createOrder(amount: number) {
    if (!this.razorpay) {
      throw new BadRequestException('Razorpay keys are not configured on the server.');
    }
    try {
      const options = {
        amount: amount * 100, // Amount in paise
        currency: 'INR',
        receipt: 'receipt_' + Date.now(),
      };
      const order = await this.razorpay.orders.create(options);
      return order;
    } catch (error: any) {
      console.error('Razorpay Error:', error);
      throw new BadRequestException('Failed to create Razorpay order');
    }
  }

  async verifyPayment(
    userId: string,
    orderId: string,
    paymentId: string,
    signature: string,
  ) {
    const secret = this.configService.get<string>('RAZORPAY_KEY_SECRET') || '';
    if (!secret) {
      throw new BadRequestException('Razorpay secret missing on server.');
    }

    // 1. Verify the signature to prevent fake payments
    const body = orderId + '|' + paymentId;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body.toString())
      .digest('hex');

    if (expectedSignature !== signature) {
      console.error('❌ Signature Mismatch!', { expectedSignature, signature });
      throw new BadRequestException('Invalid payment signature');
    }

    // 2. Payment is real! Upgrade the user.
    await this.usersService.subscribe(userId, paymentId);
    
    return { success: true, message: 'Payment verified, account upgraded!' };
  }
}
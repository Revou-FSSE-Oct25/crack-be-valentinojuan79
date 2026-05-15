import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

const Midtrans = require('midtrans-client');

export interface SnapResult {
  snap_token: string;
  payment_url: string;
  expired_at: Date;
}

@Injectable()
export class MidtransService {
  private readonly logger = new Logger(MidtransService.name);
  private snap: any;
  private serverKey: string;

  constructor(private config: ConfigService) {
    this.serverKey = this.config.get<string>('MIDTRANS_SERVER_KEY') || '';
    const isProduction = this.config.get<string>('MIDTRANS_ENV') === 'production';

    this.snap = new Midtrans.Snap({
      isProduction,
      serverKey: this.serverKey,
      clientKey: this.config.get<string>('MIDTRANS_CLIENT_KEY') || '',
    });
  }

  async createSnapToken(params: {
    orderId: string;
    amount: number;
    method: string;
    customerName: string;
    customerEmail: string;
    customerPhone?: string;
    itemName: string;
  }): Promise<SnapResult> {
    const enabledPayments = this.mapMethodToMidtrans(params.method);

    const transaction = {
      transaction_details: {
        order_id: params.orderId,
        gross_amount: Math.ceil(params.amount), 
      },
      customer_details: {
        first_name: params.customerName,
        email: params.customerEmail,
        phone: params.customerPhone || '',
      },
      item_details: [
        {
          id: params.orderId,
          price: Math.ceil(params.amount),
          quantity: 1,
          name: params.itemName,
        },
      ],
      enabled_payments: enabledPayments,
      expiry: {
        unit: 'hours',
        duration: 24, 
      },
    };

    try {
      const response = await this.snap.createTransaction(transaction);
      const expiredAt = new Date();
      expiredAt.setHours(expiredAt.getHours() + 24);

      return {
        snap_token: response.token,
        payment_url: response.redirect_url,
        expired_at: expiredAt,
      };
    } catch (err) {
      this.logger.error('Midtrans createSnapToken error', err);
      throw new InternalServerErrorException('Gagal membuat transaksi ke payment gateway');
    }
  }

  verifyWebhookSignature(
    orderId: string,
    statusCode: string,
    grossAmount: string,
    receivedSignature: string,
  ): boolean {
    const raw = `${orderId}${statusCode}${grossAmount}${this.serverKey}`;
    const expected = crypto.createHash('sha512').update(raw).digest('hex');
    return expected === receivedSignature;
  }

  private mapMethodToMidtrans(method: string): string[] {
    const map: Record<string, string[]> = {
      VA_BCA:     ['bca_va'],
      VA_BNI:     ['bni_va'],
      VA_BRI:     ['bri_va'],
      VA_MANDIRI: ['echannel'],
      QRIS:       ['other_qris'],
      GOPAY:      ['gopay'],
    };
    return map[method] || [];
  }
}

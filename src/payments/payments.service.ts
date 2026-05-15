import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MidtransService } from './midtrans.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentStatusDto } from './dto/update-payment.dto';
import { CreateGatewayPaymentDto } from './dto/create-gateway-payment.dto';
import { Role } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private prisma: PrismaService,
    private midtrans: MidtransService,
  ) {}

  async create(userId: string, dto: CreatePaymentDto) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: dto.booking_id },
      include: { payment: true },
    });

    if (!booking) throw new NotFoundException('Booking tidak ditemukan');
    if (booking.user_id !== userId) throw new ForbiddenException('Kamu tidak punya akses ke booking ini');
    if (booking.status !== 'CONFIRMED') throw new BadRequestException('Pembayaran hanya bisa dilakukan untuk booking CONFIRMED');
    if (booking.payment) throw new ConflictException('Booking ini sudah memiliki data pembayaran');

    const payment = await this.prisma.payment.create({
      data: {
        booking_id: dto.booking_id,
        method: dto.method,
        amount_to_pay: booking.total_price,
        status: 'PENDING',
      },
      include: { booking: { select: { id: true, status: true, schedule: true, total_price: true,
        user: { select: { id: true, full_name: true, email: true } },
        services: { select: { id: true, services_name: true } },
      }}},
    });

    return { message: 'Data pembayaran berhasil dibuat', data: payment };
  }

  async createGatewayPayment(userId: string, dto: CreateGatewayPaymentDto) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: dto.booking_id },
      include: {
        payment: true,
        user: { select: { id: true, full_name: true, email: true, phone_number: true } },
        services: { select: { services_name: true } },
      },
    });

    if (!booking) throw new NotFoundException('Booking tidak ditemukan');
    if (booking.user_id !== userId) throw new ForbiddenException('Kamu tidak punya akses ke booking ini');
    if (booking.status !== 'CONFIRMED') throw new BadRequestException('Booking harus berstatus CONFIRMED sebelum bayar');

    if (booking.payment) {
      // Sudah lunas → tolak
      if (booking.payment.status === 'SUCCESS') {
        throw new ConflictException('Booking ini sudah lunas');
      }

      if (
        booking.payment.snap_token &&
        booking.payment.expired_at &&
        booking.payment.expired_at > new Date()
      ) {
        return {
          message: 'Tagihan sudah dibuat sebelumnya, silakan selesaikan pembayaran',
          data: {
            payment_id: booking.payment.id,
            method: booking.payment.method,
            amount: booking.payment.amount_to_pay,
            snap_token: booking.payment.snap_token,
            payment_url: booking.payment.payment_url,
            expired_at: booking.payment.expired_at,
          },
        };
      }

      const isExpiredOrFailed =
        booking.payment.status === 'FAILED' ||
        (booking.payment.expired_at && booking.payment.expired_at <= new Date());

      const needsToken = !booking.payment.snap_token || isExpiredOrFailed;

      if (needsToken) {
        const gatewayOrderId = booking.payment.gateway_order_id ||
          `SOLVIO-${booking.id}-${uuidv4().slice(0, 8).toUpperCase()}`;

        const { snap_token, payment_url, expired_at } = await this.midtrans.createSnapToken({
          orderId: gatewayOrderId,
          amount: booking.total_price,
          method: dto.method,
          customerName: booking.user.full_name,
          customerEmail: booking.user.email,
          customerPhone: booking.user.phone_number || undefined,
          itemName: booking.services.services_name,
        });

        const updated = await this.prisma.payment.update({
          where: { id: booking.payment.id },
          data: {
            method: dto.method,
            gateway_order_id: gatewayOrderId,
            snap_token,
            payment_url,
            expired_at,
            status: 'PENDING',
          },
        });

        return {
          message: 'Tagihan berhasil dibuat, silakan selesaikan pembayaran',
          data: {
            payment_id: updated.id,
            method: updated.method,
            amount: updated.amount_to_pay,
            snap_token: updated.snap_token,
            payment_url: updated.payment_url,
            expired_at: updated.expired_at,
          },
        };
      }
    }


    const gatewayOrderId = `SOLVIO-${booking.id}-${uuidv4().slice(0, 8).toUpperCase()}`;

    const { snap_token, payment_url, expired_at } = await this.midtrans.createSnapToken({
      orderId: gatewayOrderId,
      amount: booking.total_price,
      method: dto.method,
      customerName: booking.user.full_name,
      customerEmail: booking.user.email,
      customerPhone: booking.user.phone_number || undefined,
      itemName: booking.services.services_name,
    });

    const payment = await this.prisma.payment.create({
      data: {
        booking_id: dto.booking_id,
        method: dto.method,
        amount_to_pay: booking.total_price,
        status: 'PENDING',
        gateway_order_id: gatewayOrderId,
        snap_token,
        payment_url,
        expired_at,
      },
    });

    return {
      message: 'Tagihan berhasil dibuat, silakan selesaikan pembayaran',
      data: {
        payment_id: payment.id,
        method: payment.method,
        amount: payment.amount_to_pay,
        snap_token: payment.snap_token,     
        payment_url: payment.payment_url,    
        expired_at: payment.expired_at,
      },
    };
  }

  async handleMidtransWebhook(body: any) {
    const {
      order_id,
      transaction_status,
      fraud_status,
      status_code,
      gross_amount,
      signature_key,
      payment_type,
      va_numbers,
      qr_code_url,
      settlement_time,
    } = body;

    const isValid = this.midtrans.verifyWebhookSignature(
      order_id,
      status_code,
      gross_amount,
      signature_key,
    );

    if (!isValid) {
      this.logger.warn(`Webhook signature tidak valid untuk order: ${order_id}`);
      throw new UnauthorizedException('Signature tidak valid');
    }

    const payment = await this.prisma.payment.findUnique({
      where: { gateway_order_id: order_id },
      include: { booking: true },
    });

    if (!payment) {
      this.logger.warn(`Payment tidak ditemukan untuk order_id: ${order_id}`);
      return { message: 'Order tidak ditemukan, diabaikan' };
    }

    if (payment.status === 'SUCCESS') {
      return { message: 'Sudah diproses sebelumnya' };
    }

    let newStatus: 'PENDING' | 'SUCCESS' | 'FAILED' = 'PENDING';
    let paidAt: Date | undefined;
    let vaNumber: string | undefined;
    let qrUrl: string | undefined;

    if (transaction_status === 'settlement' ||
        (transaction_status === 'capture' && fraud_status === 'accept')) {
      newStatus = 'SUCCESS';
      paidAt = settlement_time ? new Date(settlement_time) : new Date();
    } else if (
      transaction_status === 'deny' ||
      transaction_status === 'cancel' ||
      transaction_status === 'expire' ||
      transaction_status === 'failure'
    ) {
      newStatus = 'FAILED';
    }

    if (va_numbers && va_numbers.length > 0) {
      vaNumber = va_numbers[0].va_number;
    }
    if (qr_code_url) qrUrl = qr_code_url;

    // 4. Update payment di DB
    await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: newStatus,
        ...(paidAt ? { paid_at: paidAt } : {}),
        ...(vaNumber ? { va_number: vaNumber } : {}),
        ...(qrUrl ? { qr_url: qrUrl } : {}),
      },
    });

    this.logger.log(
      `Webhook OK — order: ${order_id}, status: ${newStatus}, booking: ${payment.booking_id}`,
    );

    return { message: 'Notifikasi berhasil diproses' };
  }

  async findAll() {
    const payments = await this.prisma.payment.findMany({
      include: {
        booking: {
          select: {
            id: true, status: true, schedule: true,
            user: { select: { id: true, full_name: true, email: true } },
            services: { select: { id: true, services_name: true } },
          },
        },
      },
      orderBy: { booking: { schedule: 'desc' } },
    });
    return { message: 'Berhasil mengambil semua data pembayaran', data: payments };
  }

  async findMyPayments(userId: string) {
    const payments = await this.prisma.payment.findMany({
      where: { booking: { user_id: userId } },
      include: {
        booking: {
          select: {
            id: true, status: true, schedule: true, total_price: true,
            services: { select: { id: true, services_name: true } },
          },
        },
      },
      orderBy: { booking: { schedule: 'desc' } },
    });
    return { message: 'Berhasil mengambil riwayat pembayaran kamu', data: payments };
  }

  async findOne(id: string, userId: string, userRole: Role) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: {
        booking: {
          include: {
            user: { select: { id: true, full_name: true, email: true } },
            services: { select: { id: true, services_name: true } },
          },
        },
      },
    });

    if (!payment) throw new NotFoundException('Data pembayaran tidak ditemukan');
    if (userRole === Role.CUSTOMER && payment.booking.user_id !== userId) {
      throw new ForbiddenException('Kamu tidak punya akses ke data pembayaran ini');
    }

    return { message: 'Berhasil mengambil detail pembayaran', data: payment };
  }

  async updateStatus(id: string, dto: UpdatePaymentStatusDto) {
    const payment = await this.prisma.payment.findUnique({ where: { id } });
    if (!payment) throw new NotFoundException('Data pembayaran tidak ditemukan');

    const updated = await this.prisma.payment.update({
      where: { id },
      data: { status: dto.status },
      include: {
        booking: { select: { id: true, status: true, user: { select: { id: true, full_name: true } } } },
      },
    });

    return { message: 'Status pembayaran berhasil diperbarui', data: updated };
  }
}
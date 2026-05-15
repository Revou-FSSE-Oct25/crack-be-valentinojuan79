import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentStatusDto } from './dto/update-payment.dto';
import { Role } from '@prisma/client';

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreatePaymentDto) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: dto.booking_id },
      include: { payment: true },
    });

    if (!booking) {
      throw new NotFoundException('Booking tidak ditemukan');
    }

    if (booking.user_id !== userId) {
      throw new ForbiddenException('Kamu tidak punya akses ke booking ini');
    }

    if (booking.status !== 'CONFIRMED') {
      throw new BadRequestException(
        'Pembayaran hanya bisa dilakukan untuk booking dengan status CONFIRMED',
      );
    }

    if (booking.payment) {
      throw new ConflictException('Booking ini sudah memiliki data pembayaran');
    }

    const payment = await this.prisma.payment.create({
      data: {
        booking_id: dto.booking_id,
        method: dto.method,
        amount_to_pay: booking.total_price,
        status: 'PENDING',
      },
      include: {
        booking: {
          select: {
            id: true,
            status: true,
            schedule: true,
            total_price: true,
            user: { select: { id: true, full_name: true, email: true } },
            services: { select: { id: true, services_name: true } },
          },
        },
      },
    });

    return {
      message: 'Data pembayaran berhasil dibuat',
      data: payment,
    };
  }

  async findAll() {
    const payments = await this.prisma.payment.findMany({
      include: {
        booking: {
          select: {
            id: true,
            status: true,
            schedule: true,
            user: { select: { id: true, full_name: true, email: true } },
            services: { select: { id: true, services_name: true } },
          },
        },
      },
      orderBy: { booking: { schedule: 'desc' } },
    });

    return {
      message: 'Berhasil mengambil semua data pembayaran',
      data: payments,
    };
  }

  async findMyPayments(userId: string) {
    const payments = await this.prisma.payment.findMany({
      where: {
        booking: { user_id: userId },
      },
      include: {
        booking: {
          select: {
            id: true,
            status: true,
            schedule: true,
            total_price: true,
            services: { select: { id: true, services_name: true } },
          },
        },
      },
      orderBy: { booking: { schedule: 'desc' } },
    });

    return {
      message: 'Berhasil mengambil riwayat pembayaran kamu',
      data: payments,
    };
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

    if (!payment) {
      throw new NotFoundException('Data pembayaran tidak ditemukan');
    }

    if (userRole === Role.CUSTOMER && payment.booking.user_id !== userId) {
      throw new ForbiddenException('Kamu tidak punya akses ke data pembayaran ini');
    }

    return {
      message: 'Berhasil mengambil detail pembayaran',
      data: payment,
    };
  }

  async updateStatus(id: string, dto: UpdatePaymentStatusDto) {
    const payment = await this.prisma.payment.findUnique({ where: { id } });

    if (!payment) {
      throw new NotFoundException('Data pembayaran tidak ditemukan');
    }

    const updated = await this.prisma.payment.update({
      where: { id },
      data: { status: dto.status },
      include: {
        booking: {
          select: {
            id: true,
            status: true,
            user: { select: { id: true, full_name: true } },
          },
        },
      },
    });

    return {
      message: 'Status pembayaran berhasil diperbarui',
      data: updated,
    };
  }
}

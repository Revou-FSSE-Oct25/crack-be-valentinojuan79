import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';
import { Role } from '@prisma/client';

@Injectable()
export class BookingsService {
  constructor(private prisma: PrismaService) {}

  private readonly bookingInclude = {
    user: {
      select: {
        id: true,
        full_name: true,
        email: true,
        phone_number: true,
        address: true,
        province: true,
        city: true,
      },
    },
    services: {
      include: {
        category: {
          select: { id: true, category_name: true },
        },
        variants: true,
      },
    },
    provider: {
      select: {
        id: true,
        full_name: true,
        email: true,
        phone_number: true,
      },
    },
    payment: true,
    review: true,
  };

  async create(userId: string, dto: CreateBookingDto) {
    const service = await this.prisma.services.findUnique({
      where: { id: dto.services_id },
      include: { variants: true },
    });

    if (!service) {
      throw new NotFoundException('Layanan tidak ditemukan');
    }

    const scheduleDate = new Date(dto.schedule);
    if (scheduleDate <= new Date()) {
      throw new BadRequestException('Jadwal harus di masa depan');
    }

    let finalPrice = service.price;
    if (service.variants.length > 0) {
      if (!dto.variant_id) {
        throw new BadRequestException(
          'Layanan ini memiliki beberapa pilihan, harap pilih salah satu varian',
        );
      }
      const variant = service.variants.find((v) => v.id === dto.variant_id);
      if (!variant) {
        throw new BadRequestException('Varian tidak ditemukan pada layanan ini');
      }
      finalPrice = variant.price;
    }

    const booking = await this.prisma.booking.create({
      data: {
        user_id: userId,
        services_id: dto.services_id,
        schedule: scheduleDate,
        total_price: finalPrice,
        address: dto.address,
        province: dto.province,
        city: dto.city,
        status: 'PENDING',
      },
      include: this.bookingInclude,
    });

    await this.prisma.payment.create({
      data: {
        booking_id: booking.id,
        method: dto.payment_method,
        amount_to_pay: finalPrice,
        status: 'PENDING',
      },
    });

    const bookingWithPayment = await this.prisma.booking.findUnique({
      where: { id: booking.id },
      include: this.bookingInclude,
    });

    return {
      message: 'Booking berhasil dibuat, menunggu konfirmasi admin',
      data: bookingWithPayment,
    };
  }

  async findAll(status?: string) {
    const bookings = await this.prisma.booking.findMany({
      where: status ? { status: status as any } : undefined,
      include: this.bookingInclude,
      orderBy: { schedule: 'asc' },
    });

    return {
      message: 'Berhasil mengambil semua booking',
      data: bookings,
    };
  }

  async findMyBookings(userId: string, status?: string) {
    const bookings = await this.prisma.booking.findMany({
      where: {
        user_id: userId,
        ...(status ? { status: status as any } : {}),
      },
      include: this.bookingInclude,
      orderBy: { schedule: 'desc' },
    });

    return {
      message: 'Berhasil mengambil riwayat booking kamu',
      data: bookings,
    };
  }

  async findMyTasks(technicianId: string, status?: string) {
    const tasks = await this.prisma.booking.findMany({
      where: {
        provider_id: technicianId,
        ...(status ? { status: status as any } : {}),
      },
      include: this.bookingInclude,
      orderBy: { schedule: 'asc' },
    });

    return {
      message: 'Berhasil mengambil tugas kamu',
      data: tasks,
    };
  }

  async findOne(id: string, userId: string, userRole: Role) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: this.bookingInclude,
    });

    if (!booking) {
      throw new NotFoundException('Booking tidak ditemukan');
    }

    if (userRole === Role.CUSTOMER && booking.user_id !== userId) {
      throw new ForbiddenException('Kamu tidak punya akses ke booking ini');
    }

    if (userRole === Role.TECHNICIAN && booking.provider_id !== userId) {
      throw new ForbiddenException('Booking ini tidak di-assign ke kamu');
    }

    return {
      message: 'Berhasil mengambil detail booking',
      data: booking,
    };
  }

  async updateStatus(id: string, dto: UpdateBookingStatusDto) {
    const booking = await this.prisma.booking.findUnique({ where: { id } });

    if (!booking) {
      throw new NotFoundException('Booking tidak ditemukan');
    }

    if (dto.provider_id) {
      const technician = await this.prisma.user.findUnique({
        where: { id: dto.provider_id },
      });

      if (!technician || technician.role !== Role.TECHNICIAN) {
        throw new BadRequestException('Provider harus merupakan user dengan role TECHNICIAN');
      }
    }

    const updated = await this.prisma.booking.update({
      where: { id },
      data: {
        status: dto.status,
        ...(dto.provider_id !== undefined ? { provider_id: dto.provider_id } : {}),
      },
      include: this.bookingInclude,
    });

    return {
      message: 'Status booking berhasil diperbarui',
      data: updated,
    };
  }

  /**
   * Teknisi update status ke ON_PROGRESS atau COMPLETED.
   * Saat COMPLETED:
   *  - proof_url wajib dikirim
   *  - Jika metode pembayaran TUNAI, konfirmasi bahwa customer sudah bayar
   *  - Jika sudah konfirmasi, payment langsung SUCCESS
   */
  async updateTaskStatus(
    bookingId: string,
    technicianId: string,
    status: 'ON_PROGRESS' | 'COMPLETED',
    proofUrl?: string,
    cashConfirmed?: boolean,
  ) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { payment: true },
    });

    if (!booking) {
      throw new NotFoundException('Booking tidak ditemukan');
    }

    if (booking.provider_id !== technicianId) {
      throw new ForbiddenException('Booking ini tidak di-assign ke kamu');
    }

    if (!['CONFIRMED', 'ON_PROGRESS'].includes(booking.status)) {
      throw new BadRequestException(`Tidak bisa mengubah status dari ${booking.status}`);
    }

    if (status === 'COMPLETED') {
      if (!proofUrl) {
        throw new BadRequestException('Bukti pengerjaan (proof_url) wajib dikirim saat menandai selesai');
      }

      const isCash = booking.payment?.method?.toLowerCase() === 'tunai' ||
                     booking.payment?.method?.toLowerCase() === 'cash';

      if (isCash && !cashConfirmed) {
        throw new BadRequestException(
          'Untuk pembayaran tunai, konfirmasi bahwa customer sudah membayar (cash_confirmed: true)',
        );
      }

      // Update booking status + proof
      const updated = await this.prisma.booking.update({
        where: { id: bookingId },
        data: { status: 'COMPLETED', proof_url: proofUrl },
        include: this.bookingInclude,
      });

      // Jika tunai dan dikonfirmasi, langsung set payment SUCCESS
      if (isCash && cashConfirmed && booking.payment) {
        await this.prisma.payment.update({
          where: { id: booking.payment.id },
          data: { status: 'SUCCESS' },
        });
      }

      // Reload dengan data payment terbaru
      const final = await this.prisma.booking.findUnique({
        where: { id: bookingId },
        include: this.bookingInclude,
      });

      return {
        message: 'Tugas ditandai selesai',
        data: final,
      };
    }

    // ON_PROGRESS
    const updated = await this.prisma.booking.update({
      where: { id: bookingId },
      data: { status },
      include: this.bookingInclude,
    });

    return {
      message: 'Status tugas berhasil diperbarui',
      data: updated,
    };
  }

  async cancelBooking(id: string, userId: string) {
    const booking = await this.prisma.booking.findUnique({ where: { id } });

    if (!booking) {
      throw new NotFoundException('Booking tidak ditemukan');
    }

    if (booking.user_id !== userId) {
      throw new ForbiddenException('Kamu tidak punya akses ke booking ini');
    }

    const cancellableStatuses = ['PENDING', 'CONFIRMED'];
    if (!cancellableStatuses.includes(booking.status)) {
      throw new BadRequestException(
        `Booking dengan status ${booking.status} tidak dapat dibatalkan`,
      );
    }

    const updated = await this.prisma.booking.update({
      where: { id },
      data: { status: 'CANCELLED' },
      include: this.bookingInclude,
    });

    return {
      message: 'Booking berhasil dibatalkan',
      data: updated,
    };
  }
}

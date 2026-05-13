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
        city: true,
      },
    },
    services: {
      include: {
        category: {
          select: { id: true, category_name: true },
        },
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
  };

  async create(userId: string, dto: CreateBookingDto) {
    // Cek service ada
    const service = await this.prisma.services.findUnique({
      where: { id: dto.services_id },
    });

    if (!service) {
      throw new NotFoundException('Layanan tidak ditemukan');
    }

    // Validasi schedule tidak boleh di masa lalu
    const scheduleDate = new Date(dto.schedule);
    if (scheduleDate <= new Date()) {
      throw new BadRequestException('Jadwal harus di masa depan');
    }

    const booking = await this.prisma.booking.create({
      data: {
        user_id: userId,
        services_id: dto.services_id,
        schedule: scheduleDate,
        total_price: service.price,
        status: 'PENDING',
      },
      include: this.bookingInclude,
    });

    return {
      message: 'Booking berhasil dibuat, menunggu konfirmasi admin',
      data: booking,
    };
  }

  // Admin: lihat semua booking
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

  // Customer: lihat booking milik sendiri
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

  // Teknisi: lihat tugas yang di-assign ke mereka
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

    // Customer hanya bisa lihat booking miliknya sendiri
    if (userRole === Role.CUSTOMER && booking.user_id !== userId) {
      throw new ForbiddenException('Kamu tidak punya akses ke booking ini');
    }

    // Teknisi hanya bisa lihat booking yang di-assign ke mereka
    if (userRole === Role.TECHNICIAN && booking.provider_id !== userId) {
      throw new ForbiddenException('Booking ini tidak di-assign ke kamu');
    }

    return {
      message: 'Berhasil mengambil detail booking',
      data: booking,
    };
  }

  // Admin: update status booking dan assign teknisi
  async updateStatus(id: string, dto: UpdateBookingStatusDto) {
    const booking = await this.prisma.booking.findUnique({ where: { id } });

    if (!booking) {
      throw new NotFoundException('Booking tidak ditemukan');
    }

    // Validasi provider_id kalau dikirim, harus user dengan role TECHNICIAN
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

  // Teknisi: update status task mereka sendiri (ON_PROGRESS atau COMPLETED)
  async updateTaskStatus(bookingId: string, technicianId: string, status: 'ON_PROGRESS' | 'COMPLETED') {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
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

  // Customer: cancel booking
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

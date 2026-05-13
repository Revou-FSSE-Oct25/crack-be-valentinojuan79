import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

@Injectable()
export class ServicesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateServiceDto) {
    // Validasi: pastikan category_id yang dikirim memang ada
    const category = await this.prisma.category.findUnique({
      where: { id: dto.category_id },
    });

    if (!category) {
      throw new NotFoundException('Kategori tidak ditemukan');
    }

    const service = await this.prisma.services.create({
      data: {
        services_name: dto.services_name,
        price: dto.price,
        category_id: dto.category_id,
      },
      include: {
        category: {
          select: { id: true, category_name: true },
        },
      },
    });

    return {
      message: 'Layanan berhasil dibuat',
      data: service,
    };
  }

  async findAll(categoryId?: string) {
    const services = await this.prisma.services.findMany({
      where: categoryId ? { category_id: categoryId } : undefined,
      include: {
        category: {
          select: { id: true, category_name: true },
        },
      },
      orderBy: { services_name: 'asc' },
    });

    return {
      message: 'Berhasil mengambil semua layanan',
      data: services,
    };
  }

  async findOne(id: string) {
    const service = await this.prisma.services.findUnique({
      where: { id },
      include: {
        category: {
          select: { id: true, category_name: true },
        },
      },
    });

    if (!service) {
      throw new NotFoundException('Layanan tidak ditemukan');
    }

    return {
      message: 'Berhasil mengambil data layanan',
      data: service,
    };
  }

  async update(id: string, dto: UpdateServiceDto) {
    const service = await this.prisma.services.findUnique({ where: { id } });

    if (!service) {
      throw new NotFoundException('Layanan tidak ditemukan');
    }

    // Kalau category_id diubah, validasi dulu category barunya ada
    if (dto.category_id) {
      const category = await this.prisma.category.findUnique({
        where: { id: dto.category_id },
      });

      if (!category) {
        throw new NotFoundException('Kategori tidak ditemukan');
      }
    }

    const updated = await this.prisma.services.update({
      where: { id },
      data: dto,
      include: {
        category: {
          select: { id: true, category_name: true },
        },
      },
    });

    return {
      message: 'Layanan berhasil diperbarui',
      data: updated,
    };
  }

  async remove(id: string) {
    const service = await this.prisma.services.findUnique({
      where: { id },
      include: { bookings: { take: 1 } },
    });

    if (!service) {
      throw new NotFoundException('Layanan tidak ditemukan');
    }

    if (service.bookings.length > 0) {
      throw new BadRequestException(
        'Layanan tidak bisa dihapus karena sudah memiliki riwayat booking',
      );
    }

    await this.prisma.services.delete({ where: { id } });

    return {
      message: 'Layanan berhasil dihapus',
    };
  }
}

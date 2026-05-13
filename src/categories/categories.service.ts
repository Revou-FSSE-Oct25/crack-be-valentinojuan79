import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateCategoryDto) {
    const exists = await this.prisma.category.findUnique({
      where: { category_name: dto.category_name },
    });

    if (exists) {
      throw new ConflictException('Nama kategori sudah digunakan');
    }

    const category = await this.prisma.category.create({
      data: { category_name: dto.category_name },
    });

    return {
      message: 'Kategori berhasil dibuat',
      data: category,
    };
  }

  async findAll() {
    const categories = await this.prisma.category.findMany({
      include: {
        services: {
          select: {
            id: true,
            services_name: true,
            price: true,
          },
        },
      },
      orderBy: { category_name: 'asc' },
    });

    return {
      message: 'Berhasil mengambil semua kategori',
      data: categories,
    };
  }

  async findOne(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        services: {
          select: {
            id: true,
            services_name: true,
            price: true,
          },
        },
      },
    });

    if (!category) {
      throw new NotFoundException('Kategori tidak ditemukan');
    }

    return {
      message: 'Berhasil mengambil data kategori',
      data: category,
    };
  }

  async update(id: string, dto: UpdateCategoryDto) {
    const category = await this.prisma.category.findUnique({ where: { id } });

    if (!category) {
      throw new NotFoundException('Kategori tidak ditemukan');
    }

    if (dto.category_name && dto.category_name !== category.category_name) {
      const nameExists = await this.prisma.category.findUnique({
        where: { category_name: dto.category_name },
      });
      if (nameExists) {
        throw new ConflictException('Nama kategori sudah digunakan');
      }
    }

    const updated = await this.prisma.category.update({
      where: { id },
      data: dto,
    });

    return {
      message: 'Kategori berhasil diperbarui',
      data: updated,
    };
  }

  async remove(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: { services: true },
    });

    if (!category) {
      throw new NotFoundException('Kategori tidak ditemukan');
    }

    if (category.services.length > 0) {
      throw new ConflictException(
        'Kategori tidak bisa dihapus karena masih memiliki layanan terkait',
      );
    }

    await this.prisma.category.delete({ where: { id } });

    return {
      message: 'Kategori berhasil dihapus',
    };
  }
}

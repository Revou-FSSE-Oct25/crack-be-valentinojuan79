import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const users = await this.prisma.user.findMany({
      select: {
        id: true,
        full_name: true,
        email: true,
        phone_number: true,
        address: true,
        city: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      message: 'Berhasil mengambil data semua user',
      data: users,
    };
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        full_name: true,
        email: true,
        phone_number: true,
        address: true,
        city: true,
        id_number: true,
        id_photo: true,
        role: true,
        createdAt: true,
        bookings: {
          select: {
            id: true,
            status: true,
            schedule: true,
            total_price: true,
          },
          orderBy: { schedule: 'desc' },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User tidak ditemukan');
    }

    return {
      message: 'Berhasil mengambil data user',
      data: user,
    };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        full_name: true,
        email: true,
        phone_number: true,
        address: true,
        city: true,
        id_number: true,
        id_photo: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User tidak ditemukan');
    }

    return {
      message: 'Berhasil mengambil profil',
      data: user,
    };
  }

  async updateProfile(userId: string, dto: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User tidak ditemukan');
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: dto,
      select: {
        id: true,
        full_name: true,
        email: true,
        phone_number: true,
        address: true,
        city: true,
        id_number: true,
        id_photo: true,
        role: true,
        createdAt: true,
      },
    });

    return {
      message: 'Profil berhasil diperbarui',
      data: updated,
    };
  }

  async findTechnicians() {
    const technicians = await this.prisma.user.findMany({
      where: { role: 'TECHNICIAN' },
      select: {
        id: true,
        full_name: true,
        email: true,
        phone_number: true,
        city: true,
        specialities: true,
        assignedTasks: {
          where: {
            status: { in: ['CONFIRMED', 'ON_PROGRESS'] },
          },
          select: { id: true },
        },
      },
    });

    return {
      message: 'Berhasil mengambil data teknisi',
      data: technicians,
    };
  }

  async deleteUser(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });

    if (!user) {
      throw new NotFoundException('User tidak ditemukan');
    }

    await this.prisma.user.delete({ where: { id } });

    return {
      message: 'User berhasil dihapus',
    };
  }
}

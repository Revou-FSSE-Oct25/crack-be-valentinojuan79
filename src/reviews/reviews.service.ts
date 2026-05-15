import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  async createReview(userId: string, bookingId: string, dto: CreateReviewDto) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { review: true, payment: true },
    });

    if (!booking) throw new NotFoundException('Booking tidak ditemukan');
    if (booking.user_id !== userId) throw new ForbiddenException('Bukan booking kamu');
    if (booking.status !== 'COMPLETED') throw new BadRequestException('Booking belum selesai');
    if (!booking.provider_id) throw new BadRequestException('Booking belum ada teknisi');
    if (booking.review) throw new ConflictException('Ulasan sudah pernah diberikan');

    const review = await this.prisma.review.create({
      data: {
        booking_id: bookingId,
        technician_id: booking.provider_id,
        rating: dto.rating,
        comment: dto.comment,
      },
      include: {
        booking: { select: { id: true, services: { select: { services_name: true } } } },
        technician: { select: { id: true, full_name: true } },
      },
    });

    return { message: 'Ulasan berhasil dikirim', data: review };
  }

  async getTechnicianRatings() {
    const technicians = await this.prisma.user.findMany({
      where: { role: 'TECHNICIAN' },
      select: {
        id: true,
        full_name: true,
        email: true,
        phone_number: true,
        city: true,
        province: true,
        address: true,
        role: true,
        createdAt: true,
        specialities: true,
        reviews: {
          select: { rating: true, comment: true, createdAt: true,
            booking: { select: { services: { select: { services_name: true } } } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    const result = technicians.map((t) => {
      const count = t.reviews.length;
      const avg = count > 0
        ? Math.round((t.reviews.reduce((s, r) => s + r.rating, 0) / count) * 10) / 10
        : null;
      return { ...t, average_rating: avg, review_count: count };
    });

    result.sort((a, b) => {
      if (a.average_rating === null && b.average_rating === null) return 0;
      if (a.average_rating === null) return 1;
      if (b.average_rating === null) return -1;
      return b.average_rating - a.average_rating;
    });

    return { message: 'Rating teknisi berhasil diambil', data: result };
  }

}
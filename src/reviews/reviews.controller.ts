import { Controller, Post, Get, Param, Body, UseGuards } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { GetUser } from '../common/decorators/get-user.decorator';
import { Role } from '@prisma/client';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Reviews')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @ApiOperation({ summary: 'Create a review for a completed booking' })
  @Roles(Role.CUSTOMER)
  @Post(':bookingId')
  createReview(
    @GetUser('userId') userId: string,
    @Param('bookingId') bookingId: string,
    @Body() dto: CreateReviewDto,
  ) {
    return this.reviewsService.createReview(userId, bookingId, dto);
  }

  @ApiOperation({ summary: 'Get ratings for all technicians (Admin only)' })
  @Roles(Role.ADMIN)
  @Get('technicians')
  getTechnicianRatings() {
    return this.reviewsService.getTechnicianRatings();
  }
}

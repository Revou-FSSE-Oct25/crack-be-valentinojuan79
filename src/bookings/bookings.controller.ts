import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { GetUser } from '../common/decorators/get-user.decorator';
import { Role } from '@prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Roles(Role.CUSTOMER)
  @Post()
  create(
    @GetUser('userId') userId: string,
    @Body() dto: CreateBookingDto,
  ) {
    return this.bookingsService.create(userId, dto);
  }

  @Roles(Role.ADMIN)
  @Get()
  findAll(@Query('status') status?: string) {
    return this.bookingsService.findAll(status);
  }

  @Roles(Role.CUSTOMER)
  @Get('my')
  findMyBookings(
    @GetUser('userId') userId: string,
    @Query('status') status?: string,
  ) {
    return this.bookingsService.findMyBookings(userId, status);
  }

  @Roles(Role.TECHNICIAN)
  @Get('tasks')
  findMyTasks(
    @GetUser('userId') technicianId: string,
    @Query('status') status?: string,
  ) {
    return this.bookingsService.findMyTasks(technicianId, status);
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @GetUser('userId') userId: string,
    @GetUser('role') userRole: Role,
  ) {
    return this.bookingsService.findOne(id, userId, userRole);
  }

  @Roles(Role.ADMIN)
  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateBookingStatusDto,
  ) {
    return this.bookingsService.updateStatus(id, dto);
  }

  /**
   * PATCH /bookings/:id/progress
   * Body: { status, proof_url?, cash_confirmed? }
   * - status ON_PROGRESS: mulai kerjakan
   * - status COMPLETED: wajib proof_url, jika tunai wajib cash_confirmed: true
   */
  @Roles(Role.TECHNICIAN)
  @Patch(':id/progress')
  updateTaskStatus(
    @Param('id') bookingId: string,
    @GetUser('userId') technicianId: string,
    @Body('status') status: string,
    @Body('proof_url') proofUrl?: string,
    @Body('cash_confirmed') cashConfirmed?: boolean,
  ) {
    if (!['ON_PROGRESS', 'COMPLETED'].includes(status)) {
      throw new BadRequestException('Status harus ON_PROGRESS atau COMPLETED');
    }
    return this.bookingsService.updateTaskStatus(
      bookingId,
      technicianId,
      status as 'ON_PROGRESS' | 'COMPLETED',
      proofUrl,
      cashConfirmed,
    );
  }

  @Roles(Role.CUSTOMER)
  @Patch(':id/cancel')
  cancelBooking(
    @Param('id') id: string,
    @GetUser('userId') userId: string,
  ) {
    return this.bookingsService.cancelBooking(id, userId);
  }
}

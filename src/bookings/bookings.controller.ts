import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
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

  // POST /bookings — Customer buat booking baru
  @Roles(Role.CUSTOMER)
  @Post()
  create(
    @GetUser('userId') userId: string,
    @Body() dto: CreateBookingDto,
  ) {
    return this.bookingsService.create(userId, dto);
  }

  // GET /bookings — Admin lihat semua booking, support ?status=PENDING
  @Roles(Role.ADMIN)
  @Get()
  findAll(@Query('status') status?: string) {
    return this.bookingsService.findAll(status);
  }

  // GET /bookings/my — Customer lihat booking mereka sendiri
  @Roles(Role.CUSTOMER)
  @Get('my')
  findMyBookings(
    @GetUser('userId') userId: string,
    @Query('status') status?: string,
  ) {
    return this.bookingsService.findMyBookings(userId, status);
  }

  // GET /bookings/tasks — Teknisi lihat tugas yang di-assign ke mereka
  @Roles(Role.TECHNICIAN)
  @Get('tasks')
  findMyTasks(
    @GetUser('userId') technicianId: string,
    @Query('status') status?: string,
  ) {
    return this.bookingsService.findMyTasks(technicianId, status);
  }

  // GET /bookings/:id — Semua role, tapi dengan pembatasan akses di service
  @Get(':id')
  findOne(
    @Param('id') id: string,
    @GetUser('userId') userId: string,
    @GetUser('role') userRole: Role,
  ) {
    return this.bookingsService.findOne(id, userId, userRole);
  }

  // PATCH /bookings/:id/status — Admin update status & assign teknisi
  @Roles(Role.ADMIN)
  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateBookingStatusDto,
  ) {
    return this.bookingsService.updateStatus(id, dto);
  }

  // PATCH /bookings/:id/progress — Teknisi update status tugas mereka
  @Roles(Role.TECHNICIAN)
  @Patch(':id/progress')
  updateTaskStatus(
    @Param('id') bookingId: string,
    @GetUser('userId') technicianId: string,
    @Body('status') status: 'ON_PROGRESS' | 'COMPLETED',
  ) {
    return this.bookingsService.updateTaskStatus(bookingId, technicianId, status);
  }

  // PATCH /bookings/:id/cancel — Customer cancel booking
  @Roles(Role.CUSTOMER)
  @Patch(':id/cancel')
  cancelBooking(
    @Param('id') id: string,
    @GetUser('userId') userId: string,
  ) {
    return this.bookingsService.cancelBooking(id, userId);
  }
}

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
  HttpCode,
} from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { GetUser } from '../common/decorators/get-user.decorator';
import { Role } from '@prisma/client';
import { Public } from '../auth/decorators/public.decorator';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Bookings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Public()
  @ApiOperation({ summary: 'Handle Midtrans payment webhook' })
  @Post('webhook/midtrans')
  @HttpCode(200)
  handleMidtransWebhook(@Body() payload: any) {
    return this.bookingsService.handleMidtransWebhook(payload);
  }

  @Roles(Role.CUSTOMER)
  @ApiOperation({ summary: 'Create a new booking' })
  @Post()
  create(
    @GetUser('userId') userId: string,
    @Body() dto: CreateBookingDto,
  ) {
    return this.bookingsService.create(userId, dto);
  }

  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Find all bookings' })
  @Get()
  findAll(@Query('status') status?: string) {
    return this.bookingsService.findAll(status);
  }

  @Roles(Role.CUSTOMER)
  @ApiOperation({ summary: 'Find my bookings' })
  @Get('my')
  findMyBookings(
    @GetUser('userId') userId: string,
    @Query('status') status?: string,
  ) {
    return this.bookingsService.findMyBookings(userId, status);
  }

  @Roles(Role.TECHNICIAN)
  @ApiOperation({ summary: 'Find my tasks' })
  @Get('tasks')
  findMyTasks(
    @GetUser('userId') technicianId: string,
    @Query('status') status?: string,
  ) {
    return this.bookingsService.findMyTasks(technicianId, status);
  }

  @ApiOperation({ summary: 'Get booking details' })
  @Get(':id')
  findOne(
    @Param('id') id: string,
    @GetUser('userId') userId: string,
    @GetUser('role') userRole: Role,
  ) {
    return this.bookingsService.findOne(id, userId, userRole);
  }


  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update booking status' })
  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateBookingStatusDto,
  ) {
    return this.bookingsService.updateStatus(id, dto);
  }

  @Roles(Role.TECHNICIAN)
  @ApiOperation({ summary: 'Update task status (ON_PROGRESS or COMPLETED)' })
  @Patch(':id/progress')
  updateTaskStatus(
    @Param('id') bookingId: string,
    @GetUser('userId') technicianId: string,
    @Body() body: { status: string; proof_url?: string; cash_confirmed?: boolean },
  ) {
    const { status, proof_url, cash_confirmed } = body;

    if (!['ON_PROGRESS', 'COMPLETED'].includes(status)) {
      throw new BadRequestException('Status harus ON_PROGRESS atau COMPLETED');
    }

    const cashConfirmed = cash_confirmed === true || (cash_confirmed as any) === 'true';

    return this.bookingsService.updateTaskStatus(
      bookingId,
      technicianId,
      status as 'ON_PROGRESS' | 'COMPLETED',
      proof_url,
      cashConfirmed,
    );
  }

  @Roles(Role.CUSTOMER)
  @ApiOperation({ summary: 'Cancel a booking' })
  @Patch(':id/cancel')
  cancelBooking(
    @Param('id') id: string,
    @GetUser('userId') userId: string,
  ) {
    return this.bookingsService.cancelBooking(id, userId);
  }
}
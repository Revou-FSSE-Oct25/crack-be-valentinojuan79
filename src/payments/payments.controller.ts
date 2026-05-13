import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentStatusDto } from './dto/update-payment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { GetUser } from '../common/decorators/get-user.decorator';
import { Role } from '@prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  // POST /payments — Customer buat data pembayaran untuk booking yang sudah CONFIRMED
  @Roles(Role.CUSTOMER)
  @Post()
  create(@GetUser('userId') userId: string, @Body() dto: CreatePaymentDto) {
    return this.paymentsService.create(userId, dto);
  }

  // GET /payments — Admin lihat semua pembayaran
  @Roles(Role.ADMIN)
  @Get()
  findAll() {
    return this.paymentsService.findAll();
  }

  // GET /payments/my — Customer lihat riwayat pembayaran sendiri
  @Roles(Role.CUSTOMER)
  @Get('my')
  findMyPayments(@GetUser('userId') userId: string) {
    return this.paymentsService.findMyPayments(userId);
  }

  // GET /payments/:id — Semua role, dengan pembatasan di service
  @Get(':id')
  findOne(
    @Param('id') id: string,
    @GetUser('userId') userId: string,
    @GetUser('role') userRole: Role,
  ) {
    return this.paymentsService.findOne(id, userId, userRole);
  }

  // PATCH /payments/:id/status — Admin konfirmasi atau tolak pembayaran
  @Roles(Role.ADMIN)
  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdatePaymentStatusDto) {
    return this.paymentsService.updateStatus(id, dto);
  }
}

import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentStatusDto } from './dto/update-payment.dto';
import { CreateGatewayPaymentDto } from './dto/create-gateway-payment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { GetUser } from '../common/decorators/get-user.decorator';
import { Role } from '@prisma/client';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags  ('Payments')
@ApiBearerAuth()  
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @ApiOperation({ summary: 'Handle Midtrans payment webhook' })
  @Post('webhook/midtrans')
  @HttpCode(HttpStatus.OK)
  handleMidtransWebhook(@Body() body: any) {
    return this.paymentsService.handleMidtransWebhook(body);
  }

  @ApiOperation({ summary: 'Create a new payment' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CUSTOMER)
  @Post()
  create(@GetUser('userId') userId: string, @Body() dto: CreatePaymentDto) {
    return this.paymentsService.create(userId, dto);
  }

  @ApiOperation({ summary: 'Create a gateway payment' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CUSTOMER)
  @Post('gateway')
  createGatewayPayment(
    @GetUser('userId') userId: string,
    @Body() dto: CreateGatewayPaymentDto,
  ) {
    return this.paymentsService.createGatewayPayment(userId, dto);
  }

  @ApiOperation({ summary: 'Find all payments (Admin only)' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Get()
  findAll() {
    return this.paymentsService.findAll();
  }

  @ApiOperation({ summary: 'Find my payments' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CUSTOMER)
  @Get('my')
  findMyPayments(@GetUser('userId') userId: string) {
    return this.paymentsService.findMyPayments(userId);
  }

  @ApiOperation({ summary: 'Find payment by ID' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get(':id')
  findOne(
    @Param('id') id: string,
    @GetUser('userId') userId: string,
    @GetUser('role') userRole: Role,
  ) {
    return this.paymentsService.findOne(id, userId, userRole);
  }

  @ApiOperation({ summary: 'Update payment status (Admin only)' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdatePaymentStatusDto) {
    return this.paymentsService.updateStatus(id, dto);
  }
}

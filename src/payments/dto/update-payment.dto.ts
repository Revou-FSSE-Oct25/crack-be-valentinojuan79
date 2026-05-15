import { IsEnum } from 'class-validator';
import { PaymentStatus } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class UpdatePaymentStatusDto {
  @ApiProperty({ example: 'PAID' })
  @IsEnum(PaymentStatus, { message: 'Status pembayaran tidak valid' })
  status!: PaymentStatus;
}

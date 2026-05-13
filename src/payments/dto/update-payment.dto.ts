import { IsEnum } from 'class-validator';
import { PaymentStatus } from '@prisma/client';

export class UpdatePaymentStatusDto {
  @IsEnum(PaymentStatus, { message: 'Status pembayaran tidak valid' })
  status: PaymentStatus;
}

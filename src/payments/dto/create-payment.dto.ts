import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class CreatePaymentDto {
  @ApiProperty({ example: 'booking-123' })
  @IsString()
  @IsNotEmpty({ message: 'Booking ID tidak boleh kosong' })
  booking_id!: string;

  @ApiProperty({ example: 'VA_BCA' })
  @IsString()
  @IsNotEmpty({ message: 'Metode pembayaran tidak boleh kosong' })
  method!: string;
}

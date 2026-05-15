import { IsString, IsNotEmpty } from 'class-validator';

export class CreatePaymentDto {
  @IsString()
  @IsNotEmpty({ message: 'Booking ID tidak boleh kosong' })
  booking_id!: string;

  @IsString()
  @IsNotEmpty({ message: 'Metode pembayaran tidak boleh kosong' })
  method!: string;
}

import { IsString, IsNotEmpty, IsIn } from 'class-validator';

// Metode yang di-support Midtrans Snap
export type GatewayMethod = 'VA_BCA' | 'VA_BNI' | 'VA_BRI' | 'VA_MANDIRI' | 'QRIS' | 'GOPAY';

export class CreateGatewayPaymentDto {
  @IsString()
  @IsNotEmpty({ message: 'Booking ID tidak boleh kosong' })
  booking_id!: string;

  @IsString()
  @IsIn(['VA_BCA', 'VA_BNI', 'VA_BRI', 'VA_MANDIRI', 'QRIS', 'GOPAY'], {
    message: 'Metode tidak valid. Pilih: VA_BCA, VA_BNI, VA_BRI, VA_MANDIRI, QRIS, atau GOPAY',
  })
  method!: GatewayMethod;
}

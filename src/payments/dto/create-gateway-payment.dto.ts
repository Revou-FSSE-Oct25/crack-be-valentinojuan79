import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsIn } from 'class-validator';


export type GatewayMethod = 'VA_BCA' | 'VA_BNI' | 'VA_BRI' | 'VA_MANDIRI' | 'QRIS' | 'GOPAY';

export class CreateGatewayPaymentDto {
  @ApiProperty({ example: 'booking-123' })
  @IsString()
  @IsNotEmpty({ message: 'Booking ID tidak boleh kosong' })
  booking_id!: string;

  @ApiProperty({ example: 'VA_BCA' })
  @IsString()
  @IsIn(['VA_BCA', 'VA_BNI', 'VA_BRI', 'VA_MANDIRI', 'QRIS', 'GOPAY'], {
    message: 'Metode tidak valid. Pilih: VA_BCA, VA_BNI, VA_BRI, VA_MANDIRI, QRIS, atau GOPAY',
  })
  method!: GatewayMethod;
}

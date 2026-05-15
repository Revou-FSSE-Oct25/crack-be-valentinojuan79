import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsDateString, IsOptional } from 'class-validator';

export class CreateBookingDto {
  @ApiProperty({ example: 'service-123' })
  @IsString()
  @IsNotEmpty({ message: 'Service ID tidak boleh kosong' })
  services_id!: string;

  @ApiProperty({ example: 'variant-456' })
  @IsOptional()
  @IsString()
  variant_id?: string;

  @ApiProperty({ example: '2024-07-01T10:00:00Z' })
  @IsDateString({}, { message: 'Format jadwal tidak valid, gunakan format ISO 8601' })
  @IsNotEmpty({ message: 'Jadwal tidak boleh kosong' })
  schedule!: string;

  @ApiProperty({ example: 'Jl. Raya No. 123' })
  @IsString()
  @IsNotEmpty({ message: 'Alamat tidak boleh kosong' })
  address!: string;

  @ApiProperty({ example: 'Jakarta' })
  @IsString()
  @IsNotEmpty({ message: 'Provinsi tidak boleh kosong' })
  province!: string;

  @ApiProperty({ example: 'Jakarta' })
  @IsString()
  @IsNotEmpty({ message: 'Kota tidak boleh kosong' })
  city!: string;

  @ApiProperty({ example: 'Cash, QRIS' })
  @IsString()
  @IsNotEmpty({ message: 'Metode pembayaran tidak boleh kosong' })
  payment_method!: string;
}

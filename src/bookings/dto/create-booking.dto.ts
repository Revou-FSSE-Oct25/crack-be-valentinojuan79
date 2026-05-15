import { IsString, IsNotEmpty, IsDateString, IsOptional } from 'class-validator';

export class CreateBookingDto {
  @IsString()
  @IsNotEmpty({ message: 'Service ID tidak boleh kosong' })
  services_id!: string;

  @IsOptional()
  @IsString()
  variant_id?: string;

  @IsDateString({}, { message: 'Format jadwal tidak valid, gunakan format ISO 8601' })
  @IsNotEmpty({ message: 'Jadwal tidak boleh kosong' })
  schedule!: string;

  @IsString()
  @IsNotEmpty({ message: 'Alamat tidak boleh kosong' })
  address!: string;

  @IsString()
  @IsNotEmpty({ message: 'Provinsi tidak boleh kosong' })
  province!: string;

  @IsString()
  @IsNotEmpty({ message: 'Kota tidak boleh kosong' })
  city!: string;

  @IsString()
  @IsNotEmpty({ message: 'Metode pembayaran tidak boleh kosong' })
  payment_method!: string;
}

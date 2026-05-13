import { IsString, IsNotEmpty, IsDateString } from 'class-validator';

export class CreateBookingDto {
  @IsString()
  @IsNotEmpty({ message: 'Service ID tidak boleh kosong' })
  services_id!: string;

  @IsDateString({}, { message: 'Format jadwal tidak valid, gunakan format ISO 8601' })
  @IsNotEmpty({ message: 'Jadwal tidak boleh kosong' })
  schedule!: string;

  @IsString()
  @IsNotEmpty({ message: 'Alamat tidak boleh kosong' })
  address!: string;

  @IsString()
  @IsNotEmpty({ message: 'Catatan tidak boleh kosong' })
  payment_method!: string;
}

import { IsString, IsNotEmpty, IsNumber, IsPositive, MinLength } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateServiceDto {
  @IsString()
  @IsNotEmpty({ message: 'Nama layanan tidak boleh kosong' })
  @MinLength(3, { message: 'Nama layanan minimal 3 karakter' })
  services_name: string;

  @IsNumber({}, { message: 'Harga harus berupa angka' })
  @IsPositive({ message: 'Harga harus lebih dari 0' })
  @Type(() => Number)
  price: number;

  @IsString()
  @IsNotEmpty({ message: 'Category ID tidak boleh kosong' })
  category_id: string;
}

import { IsString, IsOptional, IsNumber, IsPositive, MinLength } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateServiceDto {
  @IsOptional()
  @IsString()
  @MinLength(3, { message: 'Nama layanan minimal 3 karakter' })
  services_name?: string;

  @IsOptional()
  @IsNumber({}, { message: 'Harga harus berupa angka' })
  @IsPositive({ message: 'Harga harus lebih dari 0' })
  @Type(() => Number)
  price?: number;

  @IsOptional()
  @IsString()
  category_id?: string;
}

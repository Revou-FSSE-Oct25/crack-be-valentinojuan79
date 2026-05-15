import { IsString, IsNotEmpty, IsNumber, IsPositive, MinLength } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateServiceDto {
  @ApiProperty({ example: 'Jasa Pipa Bocor' })
  @IsString()
  @IsNotEmpty({ message: 'Nama layanan tidak boleh kosong' })
  @MinLength(3, { message: 'Nama layanan minimal 3 karakter' })
  services_name!: string;

  @ApiProperty({ example: 'Layanan perbaikan pipa bocor untuk rumah dan kantor' })
  @IsNumber({}, { message: 'Harga harus berupa angka' })
  @IsPositive({ message: 'Harga harus lebih dari 0' })
  @Type(() => Number)
  price!: number;

  @ApiProperty({ example: 'category-123' })
  @IsString()
  @IsNotEmpty({ message: 'Category ID tidak boleh kosong' })
  category_id!: string;
}

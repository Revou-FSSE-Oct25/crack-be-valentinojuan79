import { IsString, IsOptional, IsNumber, IsPositive, MinLength } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateServiceDto {

  @ApiProperty({ example: 'Jasa Pipa Bocor' })
  @IsOptional()
  @IsString()
  @MinLength(3, { message: 'Nama layanan minimal 3 karakter' })
  services_name?: string;

  @ApiProperty({ example: 'Layanan perbaikan pipa bocor untuk rumah dan kantor' })
  @IsOptional()
  @IsNumber({}, { message: 'Harga harus berupa angka' })
  @IsPositive({ message: 'Harga harus lebih dari 0' })
  @Type(() => Number)
  price?: number;

  @ApiProperty({ example: 'category-123' })
  @IsOptional()
  @IsString()
  category_id?: string;
}

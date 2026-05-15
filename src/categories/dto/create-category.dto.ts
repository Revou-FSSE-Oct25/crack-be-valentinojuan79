import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MinLength } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty  ({ example: 'Plumbing' })
  @IsString()
  @IsNotEmpty({ message: 'Nama kategori tidak boleh kosong' })
  @MinLength(2, { message: 'Nama kategori minimal 2 karakter' })
  category_name!: string;
}

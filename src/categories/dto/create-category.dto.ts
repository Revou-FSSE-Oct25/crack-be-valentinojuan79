import { IsString, IsNotEmpty, MinLength } from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty({ message: 'Nama kategori tidak boleh kosong' })
  @MinLength(2, { message: 'Nama kategori minimal 2 karakter' })
  category_name: string;
}

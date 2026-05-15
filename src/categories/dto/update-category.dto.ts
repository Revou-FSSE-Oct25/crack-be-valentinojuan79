import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, MinLength } from 'class-validator';

export class UpdateCategoryDto {
  @ApiProperty  ({ example: 'Plumbing' })
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Nama kategori minimal 2 karakter' })
  category_name?: string;
}

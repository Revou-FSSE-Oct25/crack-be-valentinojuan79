import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class UpdateUserDto {
  @ApiProperty({ example: 'John Doe' })
  @IsOptional()
  @IsString()
  full_name?: string;

  @ApiProperty({ example: '081234567890' })
  @IsOptional()
  @IsString()
  phone_number?: string;

  @ApiProperty({ example: 'Jl. Merdeka No. 123' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ example: 'Jakarta' })
  @IsOptional()
  @IsString()
  province?: string;

  @ApiProperty({ example: 'Jakarta' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiProperty({ example: '1234567890' })
  @IsOptional()
  @IsString()
  id_number?: string;

  @ApiProperty({ example: 'path/to/id_photo.jpg' })
  @IsOptional()
  @IsString()
  id_photo?: string;

  @ApiProperty({ example: 'Plumber, Electrician' })
  @IsOptional()
  @IsString()
  specialities?: string;
}

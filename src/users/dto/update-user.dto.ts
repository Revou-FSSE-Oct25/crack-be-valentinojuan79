import { IsString, IsOptional } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  full_name?: string;

  @IsOptional()
  @IsString()
  phone_number?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  province?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  id_number?: string;

  @IsOptional()
  @IsString()
  id_photo?: string;

  @IsOptional()
  @IsString()
  specialities?: string;
}

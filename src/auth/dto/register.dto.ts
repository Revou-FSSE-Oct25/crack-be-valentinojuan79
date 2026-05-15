import { IsEmail, IsNotEmpty, IsString, MinLength, IsOptional, IsEnum } from 'class-validator';

export enum UserRole {
  CUSTOMER = 'CUSTOMER',
  TECHNICIAN = 'TECHNICIAN',
}

export class RegisterDto {
  @IsEmail({}, { message: 'Format email tidak valid' })
  @IsNotEmpty()
  email!: string;

  @IsString()
  @IsNotEmpty()
  full_name!: string;

  @IsString()
  @MinLength(6, { message: 'Password minimal 6 karakter' })
  password!: string;

  @IsOptional()
  @IsEnum(UserRole, { message: 'Role hanya boleh CUSTOMER atau TECHNICIAN' })
  role?: UserRole;

  @IsOptional()
  @IsString()
  phone_number?: string;

  @IsOptional()
  @IsString()
  province?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  specialities?: string;

  @IsOptional()
  @IsString()
  id_number?: string;
}
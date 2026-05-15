import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength, IsOptional, IsEnum } from 'class-validator';

export enum UserRole {
  CUSTOMER = 'CUSTOMER',
  TECHNICIAN = 'TECHNICIAN',
}

export class RegisterDto {

  @ApiProperty({ example: 'user@example.com' })
  @IsEmail({}, { message: 'Format email tidak valid' })
  @IsNotEmpty()
  email!: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  full_name!: string;

  @ApiProperty({ example: 'password123', minLength: 6 })
  @IsString()
  @MinLength(6, { message: 'Password minimal 6 karakter' })
  password!: string;

  @ApiProperty({ example: 'CUSTOMER', enum: UserRole })
  @IsOptional()
  @IsEnum(UserRole, { message: 'Role hanya boleh CUSTOMER atau TECHNICIAN' })
  role?: UserRole;

  @ApiProperty({ example: '081234567890' })
  @IsOptional()
  @IsString()
  phone_number?: string;

  @ApiProperty({ example: 'Jakarta' })
  @IsOptional()
  @IsString()
  province?: string;

  @ApiProperty({ example: 'Jakarta' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiProperty({ example: 'Plumber, Electrician' })
  @IsOptional()
  @IsString()
  specialities?: string;

  @ApiProperty({ example: '1234567890' })
  @IsOptional()
  @IsString()
  id_number?: string;
}
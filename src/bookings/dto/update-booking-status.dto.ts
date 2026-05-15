import { IsEnum, IsOptional, IsString } from 'class-validator';
import { BookingStatus } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateBookingStatusDto {

  @ApiProperty({ example: 'CONFIRMED', enum: BookingStatus })
  @IsEnum(BookingStatus, { message: 'Status booking tidak valid' })
  status!: BookingStatus;

  @ApiProperty({ example: 'provider-789' })
  @IsOptional()
  @IsString()
  provider_id?: string;
}

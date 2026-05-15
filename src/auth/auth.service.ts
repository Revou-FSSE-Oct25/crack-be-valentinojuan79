import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { RegisterDto, UserRole } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const userExists = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (userExists) {
      throw new BadRequestException('Email sudah digunakan, silakan gunakan email lain');
    }


    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        full_name: dto.full_name,
        password: hashedPassword,
        role: dto.role || UserRole.CUSTOMER,
        phone_number: dto.phone_number,
        province: dto.province,
        city: dto.city,
        id_number: dto.id_number,
        specialities: dto.specialities,
      },
    });

    const { password, ...result } = user;
    
    return {
      message: 'Registrasi berhasil',
      data: result,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Email atau password salah');
    }

    const isPasswordMatch = await bcrypt.compare(dto.password, user.password);

    if (!isPasswordMatch) {
      throw new UnauthorizedException('Email atau password salah');
    }

    const payload = { 
      sub: user.id, 
      email: user.email, 
      role: user.role 
    };

    const { password, ...result } = user;
    return {
      message: 'Login berhasil',
      access_token: this.jwtService.sign(payload),
      user: result,
    };
  }

  async validateUserById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });
    
    if (!user) return null;
    
    const { password, ...result } = user;
    return result;
  }
}
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
    // 1. Cek apakah email sudah terdaftar di database
    const userExists = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (userExists) {
      throw new BadRequestException('Email sudah digunakan, silakan gunakan email lain');
    }

    // 2. Hashing password agar tidak tersimpan dalam bentuk teks biasa
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // 3. Simpan user baru ke database
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        full_name: dto.full_name,
        password: hashedPassword,
        role: dto.role || UserRole.CUSTOMER,
        phone_number: dto.phone_number,
        id_number: dto.id_number,
        ...(dto.specialities ? { address: dto.specialities } : {}),
      },
    });

    // 4. Hapus password dari object sebelum dikirim sebagai response (Destructuring)
    const { password, ...result } = user;
    
    return {
      message: 'Registrasi berhasil',
      data: result,
    };
  }

  async login(dto: LoginDto) {
    // 1. Cari user berdasarkan email
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    // 2. Jika user tidak ditemukan
    if (!user) {
      throw new UnauthorizedException('Email atau password salah');
    }

    // 3. Bandingkan password yang diinput dengan yang ada di database (bcrypt)
    const isPasswordMatch = await bcrypt.compare(dto.password, user.password);

    if (!isPasswordMatch) {
      throw new UnauthorizedException('Email atau password salah');
    }

    // 4. Buat Payload untuk JWT (Data yang akan disimpan di dalam token)
    const payload = { 
      sub: user.id, 
      email: user.email, 
      role: user.role 
    };

    // 5. Hilangkan password dari data user yang dikembalikan
    const { password, ...result } = user;

    // 6. Kembalikan token dan data user singkat
    return {
      message: 'Login berhasil',
      access_token: this.jwtService.sign(payload),
      user: result,
    };
  }

  // Fungsi tambahan untuk memvalidasi user saat menggunakan JwtStrategy
  async validateUserById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });
    
    if (!user) return null;
    
    const { password, ...result } = user;
    return result;
  }
}
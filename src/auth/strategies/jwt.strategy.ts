import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') { // Tambahkan 'jwt' di sini
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'secret', // Gunakan fallback jika env belum terbaca
    });
  }

  // Definisikan tipe payload agar TS tidak menebak-nebak
  async validate(payload: any) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user) {
      throw new UnauthorizedException('Akses ditolak, user tidak ditemukan');
    }

    // Apa yang direturn di sini akan masuk ke req.user
    return { 
      userId: user.id, 
      email: user.email, 
      role: user.role 
    };
  }
}
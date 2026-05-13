import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    // PassportModule diperlukan untuk integrasi dengan passport-jwt
    PassportModule.register({ defaultStrategy: 'jwt' }),
    
    // Konfigurasi JWT menggunakan secret dari .env kamu
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: process.env.JWT_SECRET || 'fallback_secret', // Gunakan fallback jika env belum terbaca
        signOptions: { 
          expiresIn: '24h', // Token berlaku selama 24 jam
        },
      }),
    }),
  ],
  providers: [AuthService, JwtStrategy], // PrismaService otomatis masuk lewat @Global() PrismaModule
  controllers: [AuthController],
  exports: [AuthService, JwtStrategy, PassportModule], // Export jika module lain butuh mengecek auth
})
export class AuthModule {}
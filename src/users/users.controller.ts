import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { GetUser } from '../common/decorators/get-user.decorator';
import { Role } from '@prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // GET /users — Admin only
  @Get()
  @Roles(Role.ADMIN)
  findAll() {
    return this.usersService.findAll();
  }

  // GET /users/me — Semua user yang sudah login
  @Get('me')
  getProfile(@GetUser('userId') userId: string) {
    return this.usersService.getProfile(userId);
  }

  // PATCH /users/me — Update profil sendiri
  @Patch('me')
  updateProfile(@GetUser('userId') userId: string, @Body() dto: UpdateUserDto) {
    return this.usersService.updateProfile(userId, dto);
  }

  // GET /users/technicians — Admin only, untuk assign teknisi ke booking
  @Get('technicians')
  @Roles(Role.ADMIN)
  findTechnicians() {
    return this.usersService.findTechnicians();
  }

  // GET /users/:id — Admin only
  @Get(':id')
  @Roles(Role.ADMIN)
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  // DELETE /users/:id — Admin only
  @Delete(':id')
  @Roles(Role.ADMIN)
  deleteUser(@Param('id') id: string) {
    return this.usersService.deleteUser(id);
  }
}

import {
  Controller,
  UseGuards,
  Get,
  Patch,
  Param,
  Post,
  Body,
  Delete,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { UserRole } from '../entities/user.entity';
import { Roles } from './roles.decorator';
import { RolesGuard } from './roles.guard';
import { AdminService } from './admin.service';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('users-list')
  async getUsersList() {
    return this.adminService.getAllUsersWithBookCount();
  }

  @Get('stats-global')
  async getGlobalStats() {
    return this.adminService.getGlobalStats();
  }

  @Get('stats')
  getAppStats() {
    return this.adminService.getMainStats();
  }

  @Get('libreros')
  getAllLibreros() {
    return this.adminService.findAllLibreros();
  }

  // APROBAR LIBRERO PENDIENTE
  @Patch('verify-librero/:id')
  verifyLibrero(@Param('id') id: string) {
    return this.adminService.approveLibrero(id);
  }

  @Delete('reject-librero/:id')
  rejectLibrero(@Param('id') id: string) {
    return this.adminService.rejectLibrero(id);
  }

  // SUSPENDER / ACTIVAR USUARIO
  @Patch('toggle-status/:id')
  toggleUserStatus(@Param('id') id: string) {
    return this.adminService.toggleUserStatus(id);
  }
}

@Controller('librero')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.LIBRERO)
export class LibreroController {
  @Post('catalog')
  updateCatalog() {
    return { message: 'Catálogo actualizado (lógica pendiente)' };
  }
}

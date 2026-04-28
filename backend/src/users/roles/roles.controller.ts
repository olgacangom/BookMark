import {
  Controller,
  UseGuards,
  Get,
  Patch,
  Param,
  Post,
  Body,
  Delete,
  Req,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { User, UserRole } from '../entities/user.entity';
import { Roles } from './roles.decorator';
import { RolesGuard } from './roles.guard';
import { AdminService } from './admin.service';
import { LibrerosService } from './libreros.service';
import { LibraryEvent } from '../entities/library-event.entity';

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
  constructor(private readonly librerosService: LibrerosService) {}

  // OBTENER MI STOCK
  @Get('inventory')
  getMyInventory(@Req() req: { user: User }) {
    return this.librerosService.getMyInventory(req.user.id);
  }

  @Post('inventory/:bookId')
  addBook(
    @Param('bookId') bookId: string,
    @Body() data: { price: number; inStock: boolean },
    @Req() req: { user: User },
  ) {
    return this.librerosService.addToInventory(req.user.id, bookId, data);
  }

  @Patch('inventory/:inventoryId')
  updateInventory(
    @Param('inventoryId') inventoryId: string,
    @Body() data: { price: number; inStock: boolean },
    @Req() req: { user: User },
  ) {
    return this.librerosService.updateInventoryItem(
      req.user.id,
      inventoryId,
      data,
    );
  }

  @Delete('inventory/:inventoryId')
  removeBook(
    @Param('inventoryId') inventoryId: string,
    @Req() req: { user: User },
  ) {
    return this.librerosService.removeFromInventory(req.user.id, inventoryId);
  }

  @Post('catalog')
  updateCatalog() {
    return { message: 'Lógica de catálogo masivo pendiente' };
  }

  @Get('stats')
  getStats(@Req() req: { user: User }) {
    return this.librerosService.getStats(req.user.id);
  }

  @Patch('profile')
  updateProfile(
    @Req() req: { user: User },
    @Body() updateData: { libraryPhone?: string; librarySchedule?: string },
  ) {
    return this.librerosService.updateProfile(req.user.id, updateData);
  }

  @Get('find-stores/:bookId')
  @Roles(UserRole.USER, UserRole.LIBRERO, UserRole.ADMIN)
  findStores(@Param('bookId') bookId: string) {
    return this.librerosService.findStoresByBook(bookId);
  }

  // Eventos/Quedadas físicas
  @Get('events')
  getMyEvents(@Req() req: { user: User }) {
    return this.librerosService.getMyEvents(req.user.id);
  }

  @Post('events')
  createEvent(@Req() req: { user: User }, @Body() data: Partial<LibraryEvent>) {
    return this.librerosService.createEvent(req.user.id, data);
  }

  @Patch('events/:id')
  updateEvent(
    @Req() req: { user: User },
    @Param('id') id: string,
    @Body() data: Partial<LibraryEvent>,
  ) {
    return this.librerosService.updateEvent(req.user.id, id, data);
  }

  @Delete('events/:id')
  deleteEvent(@Req() req: { user: User }, @Param('id') id: string) {
    return this.librerosService.deleteEvent(req.user.id, id);
  }

  @Get('events/all')
  @Roles(UserRole.USER, UserRole.LIBRERO, UserRole.ADMIN)
  async getAllEvents() {
    return this.librerosService.getAllFutureEvents();
  }

  @Post('events/:id/join')
  @Roles(UserRole.USER, UserRole.LIBRERO, UserRole.ADMIN)
  async joinEvent(@Param('id') eventId: string, @Req() req: { user: User }) {
    return this.librerosService.joinEvent(req.user.id, eventId);
  }

  @Get('events/:id/attendees')
  @Roles(UserRole.LIBRERO)
  async getAttendees(@Param('id') eventId: string, @Req() req: { user: User }) {
    return this.librerosService.getEventAttendees(req.user.id, eventId);
  }
}

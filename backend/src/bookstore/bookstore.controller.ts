import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { BookstoreService } from './bookstore.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { UserRole } from 'src/users/entities/user.entity';
import { Roles } from 'src/users/roles/roles.decorator';
import { RolesGuard } from 'src/users/roles/roles.guard';

@Controller('bookstores')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.USER)
export class BookstoreController {
  constructor(private readonly bookstoreService: BookstoreService) {}

  @Get('nearby')
  getNearby(@Query('lat') lat: string, @Query('lon') lon: string) {
    return this.bookstoreService.findNearby(Number(lat), Number(lon));
  }
}

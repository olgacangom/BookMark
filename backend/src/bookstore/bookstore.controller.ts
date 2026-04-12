import { Controller, Get, Query } from '@nestjs/common';
import { BookstoreService } from './bookstore.service';

@Controller('bookstores')
export class BookstoreController {
  constructor(private readonly bookstoreService: BookstoreService) {}

  @Get('nearby')
  getNearby(@Query('lat') lat: string, @Query('lon') lon: string) {
    return this.bookstoreService.findNearby(Number(lat), Number(lon));
  }
}

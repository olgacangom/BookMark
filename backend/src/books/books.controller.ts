import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { BooksService } from './books.service';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

export interface RequestWithUser {
  user: {
    id: string;
  };
}

@Controller('books')
@UseGuards(JwtAuthGuard)
export class BooksController {
  constructor(private readonly booksService: BooksService) {}

  @Post()
  create(
    @Body() createBookDto: CreateBookDto,
    @Request() req: RequestWithUser,
  ) {
    return this.booksService.create(createBookDto, req.user.id);
  }

  @Get()
  findAll(@Request() req: RequestWithUser) {
    return this.booksService.findAll(req.user.id);
  }

  @Get('search/:isbn')
  async search(@Param('isbn') isbn: string) {
    return this.booksService.searchByIsbn(isbn);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req: RequestWithUser) {
    return this.booksService.findOne(+id, req.user.id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateBookDto: UpdateBookDto,
    @Request() req: RequestWithUser,
  ) {
    return this.booksService.update(+id, updateBookDto, req.user.id);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req: RequestWithUser) {
    return this.booksService.remove(+id, req.user.id);
  }
}

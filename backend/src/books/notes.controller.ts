import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  ParseIntPipe,
} from '@nestjs/common';
import { BooksService } from './books.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserRole } from 'src/users/entities/user.entity';
import { Roles } from 'src/users/roles/roles.decorator';
import { RolesGuard } from 'src/users/roles/roles.guard';

interface RequestWithUser {
  user: {
    id: string;
    email?: string;
  };
}

@Controller('notes')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.USER)
export class NotesController {
  constructor(private readonly booksService: BooksService) {}

  @Post(':bookId')
  create(
    @Param('bookId', ParseIntPipe) bookId: number,
    @Body('content') content: string,
    @Request() req: RequestWithUser,
  ) {
    return this.booksService.createNote(bookId, content, req.user.id);
  }

  @Get('book/:bookId')
  findAllByBook(
    @Param('bookId', ParseIntPipe) bookId: number,
    @Request() req: RequestWithUser,
  ) {
    return this.booksService.findNotesByBook(bookId, req.user.id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body('content') content: string,
    @Request() req: RequestWithUser,
  ) {
    return this.booksService.updateNote(id, content, req.user.id);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req: RequestWithUser) {
    return this.booksService.deleteNote(id, req.user.id);
  }
}

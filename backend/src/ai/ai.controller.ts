import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { AIService } from './ai.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { Book } from '../books/entities/book.entity';
import { BookListing } from 'src/users/entities/book-listing.entity';
import { Club } from 'src/club/entities/club.entity';
import { LibraryEvent } from 'src/users/entities/library-event.entity';
import { Request } from 'express';

interface RequestWithUser extends Request {
  user: {
    id: string;
  };
}

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AIController {
  constructor(
    private readonly aiService: AIService,
    @InjectRepository(Book) private bookRepo: Repository<Book>,
    @InjectRepository(BookListing) private listingRepo: Repository<BookListing>,
    @InjectRepository(LibraryEvent) private eventRepo: Repository<LibraryEvent>,
    @InjectRepository(Club) private clubRepo: Repository<Club>,
  ) {}

  @Post('chat')
  async chat(
    @Req() req: RequestWithUser,
    @Body() body: { prompt: string; history: any[] },
  ) {
    const userId = req.user.id;

    const bookSearchCriteria: FindOptionsWhere<Book> = {
      user: { id: userId },
    };

    const [userBooks, listings, events, clubs] = await Promise.all([
      this.bookRepo.find({
        where: bookSearchCriteria,
        select: ['title', 'author'],
      }),
      this.listingRepo.find({
        where: { isAvailable: true },
        relations: ['book', 'user'],
        take: 10,
      }),
      this.eventRepo.find({
        take: 5,
        order: { eventDate: 'ASC' },
      }),
      this.clubRepo.find({ take: 5 }),
    ]);

    const context = `
[MI BIBLIOTECA (LO QUE YA TENGO)]:
${userBooks.map((b) => `- ${b.title}`).join('\n') || 'Sin libros aún'}

[CATÁLOGO PARA INTERCAMBIO]:
${listings.map((l) => `- "${l.book.title}" (${l.type} con ${l.user.fullName})`).join('\n')}

[PRÓXIMOS EVENTOS Y QUEDADAS]:
${
  events
    .map((e) => {
      const dateStr = new Date(e.eventDate).toLocaleDateString('es-ES');
      return `- ${e.title}: el ${dateStr}. Aforo máximo: ${e.maxCapacity || 'Ilimitado'}. Descripción: ${e.description}`;
    })
    .join('\n') || 'No hay eventos programados'
}

[CLUBES DE LECTURA ACTIVOS]:
${clubs.map((c) => `- ${c.name}: ${c.description}`).join('\n') || 'No hay clubes activos'}
        `;

    return this.aiService.getChatResponse(body.prompt, body.history, context);
  }
}

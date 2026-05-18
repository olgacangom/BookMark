import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { AIService } from './ai.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Request } from 'express';
import { User } from '../users/entities/user.entity';
import { Book } from '../books/entities/book.entity';
import { LibraryEvent } from '../users/entities/library-event.entity';
import { Activity } from 'src/users/entities/activity.entity';
import { Club } from '../club/entities/club.entity';
import { BookListing } from 'src/users/entities/book-listing.entity';

interface RequestWithUser extends Request {
  user: { id: string; role: string };
}

interface EventRegistrationTarget {
  user?: { id: string };
  userId?: string;
}

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AIController {
  constructor(
    private readonly aiService: AIService,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Book) private readonly bookRepo: Repository<Book>,
    @InjectRepository(Activity)
    private readonly activityRepo: Repository<Activity>,
    @InjectRepository(LibraryEvent)
    private readonly eventRepo: Repository<LibraryEvent>,
    @InjectRepository(Club) private readonly clubRepo: Repository<Club>,
    @InjectRepository(BookListing)
    private readonly listingRepo: Repository<BookListing>,
  ) {}

  @Post('chat')
  async chat(
    @Req() req: RequestWithUser,
    @Body() body: { prompt: string; history: unknown[] },
  ) {
    try {
      const { id: userId, role } = req.user;
      let context = '';

      if (role === 'admin') {
        context = await this.getAdminContext();
      } else if (role === 'librero') {
        context = await this.getLibreroContext(userId);
      } else {
        context = await this.getLectorContext(userId);
      }

      return await this.aiService.getChatResponse(
        body.prompt,
        body.history,
        context,
        role,
      );
    } catch (error) {
      console.error('❌ ERROR CRÍTICO AI_CONTROLLER:', error);
      return 'Biblios se ha despistado buscando en los archivos. ¿Puedes repetir la pregunta? 📚';
    }
  }

  private async getAdminContext(): Promise<string> {
    const mostActive = (await this.activityRepo
      .createQueryBuilder('act')
      .select('user.fullName', 'name')
      .leftJoin('act.user', 'user')
      .groupBy('user.id')
      .orderBy('COUNT(act.id)', 'DESC')
      .getRawOne()) as unknown as { name: string | null } | undefined;

    return `[MÉTRICAS ADMIN]: Usuario top interacción: ${mostActive?.name || 'N/A'}.`;
  }

  private async getLibreroContext(userId: string): Promise<string> {
    const count = await this.bookRepo.count({ where: { userId } });
    return `[DATOS LIBRERÍA]: El catálogo cuenta con ${count} libros registrados.`;
  }

  private async getLectorContext(userId: string): Promise<string> {
    try {
      const now = new Date();
      const [books, allClubs, allEvents, listings] = await Promise.all([
        this.bookRepo.find({ where: { userId }, select: ['title'] }),
        this.clubRepo.find({ relations: ['members'] }),
        this.eventRepo.find({
          relations: ['registrations', 'registrations.user', 'organizer'],
        }),
        this.listingRepo.find({
          where: { isAvailable: true },
          relations: ['book', 'user'],
          take: 10,
        }),
      ]);

      const joinedClubs = allClubs
        .filter((c) => c.members?.some((m) => m.id === userId))
        .map((c) => c.name);
      const availClubs = allClubs
        .filter((c) => !c.members?.some((m) => m.id === userId))
        .map((c) => c.name);
      const myEvents = allEvents
        .filter(
          (e) =>
            new Date(e.eventDate) >= now &&
            e.registrations?.some((r) => {
              const reg = r as EventRegistrationTarget;
              return (reg.user?.id || reg.userId) === userId;
            }),
        )
        .map(
          (e) => `${e.title} (${new Date(e.eventDate).toLocaleDateString()})`,
        );
      const availEvents = allEvents
        .filter(
          (e) =>
            new Date(e.eventDate) >= now &&
            !e.registrations?.some((r) => {
              const reg = r as EventRegistrationTarget;
              return (reg.user?.id || reg.userId) === userId;
            }),
        )
        .map((e) => `${e.title} en ${e.organizer?.libraryName}`);

      return `
        FECHA ACTUAL: ${now.toLocaleDateString()}
        [SECCIÓN_LIBROS_USUARIO]: ${books.map((b) => b.title).join(', ') || 'Ninguno'}.
        [SECCIÓN_CLUBES_UNIDOS]: ${joinedClubs.join(', ') || 'Ninguno'}.
        [SECCIÓN_CLUBES_DISPONIBLES]: ${availClubs.join(', ') || 'Ninguno'}.
        [SECCIÓN_EVENTOS_INSCRITO]: ${myEvents.join(', ') || 'Sin citas próximas'}.
        [SECCIÓN_EVENTOS_DISPONIBLES]: ${availEvents.join(', ') || 'Sin eventos próximos'}.
        [SECCIÓN_MERCADO_GLOBAL]: ${listings.map((l) => l.book.title).join(' | ')}.
      `;
    } catch {
      return 'Error al obtener datos de la base de datos.';
    }
  }
}

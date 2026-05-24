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
import { EventRegistration } from 'src/bookstore/entities/event-registration.entity';

interface RequestWithUser extends Request {
  user: { id: string; role: string };
}

interface EventRegistrationTarget {
  user?: { id: string };
  userId?: string;
}

interface BookAggregationResult {
  title: string;
  author: string;
  totalRegistrations: string | number;
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
    @InjectRepository(EventRegistration)
    private readonly registrationRepo: Repository<EventRegistration>,
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

      const directAnswer = await this.getDirectAnswer(
        role,
        userId,
        body.prompt,
      );
      if (directAnswer) {
        return directAnswer;
      }

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

  private normalizePrompt(prompt: string): string {
    return prompt?.toLowerCase().trim() || '';
  }

  private async getDirectAnswer(
    role: string,
    userId: string,
    prompt: string,
  ): Promise<string | null> {
    const normalized = this.normalizePrompt(prompt);

    const thanksPatterns = [
      'gracias',
      'muchas gracias',
      'gracias.',
      'gracias!',
      'gracias por tu ayuda',
    ];
    if (thanksPatterns.includes(normalized)) {
      return 'Un gusto apoyarte. Si quieres, puedo mostrarte alguna métrica específica de tu librería.';
    }

    if (
      role === 'librero' &&
      /franja hor(á|a)ria|horario|asisten m[áa]s|asisten.*lectores|p[úu]blico/.test(
        normalized,
      )
    ) {
      return this.getLibreroPeakTimeSlot(userId);
    }

    return null;
  }

  private getTimeSlotLabel(slot: string): string {
    switch (slot) {
      case 'madrugada':
        return 'madrugada (00:00-06:00)';
      case 'mañana':
        return 'mañana (06:00-12:00)';
      case 'tarde':
        return 'tarde (12:00-18:00)';
      case 'noche':
        return 'noche (18:00-24:00)';
      default:
        return slot;
    }
  }

  private async getLibreroPeakTimeSlot(libreroId: string): Promise<string> {
    const events = await this.eventRepo.find({
      where: { organizer: { id: libreroId } },
      relations: ['registrations'],
    });

    if (!events.length) {
      return 'No hay datos de eventos para tu librería que permitan determinar la franja horaria de mayor asistencia.';
    }

    const now = new Date();
    const pastEvents = events.filter(
      (event) => new Date(event.eventDate) < now,
    );
    const futureEvents = events.filter(
      (event) => new Date(event.eventDate) >= now,
    );

    const slotCounts: Record<string, number> = {
      madrugada: 0,
      mañana: 0,
      tarde: 0,
      noche: 0,
    };

    let totalAttendees = 0;
    for (const event of events) {
      const date = new Date(event.eventDate);
      if (Number.isNaN(date.getTime())) continue;
      const hour = date.getHours();
      const slot =
        hour >= 0 && hour < 6
          ? 'madrugada'
          : hour < 12
            ? 'mañana'
            : hour < 18
              ? 'tarde'
              : 'noche';
      const attendees = event.registrations?.length || 0;
      slotCounts[slot] += attendees;
      totalAttendees += attendees;
    }

    if (totalAttendees === 0) {
      return 'Hay eventos registrados, pero ninguno tiene asistentes apuntados aún.';
    }

    const sortedSlots = Object.entries(slotCounts).sort((a, b) => b[1] - a[1]);
    const [bestSlot, bestCount] = sortedSlots[0];

    const slotDetails = sortedSlots
      .filter(([, count]) => count > 0)
      .map(
        ([slot, count]) =>
          `- ${this.getTimeSlotLabel(slot)}: ${count} asistente${
            count === 1 ? '' : 's'
          }`,
      )
      .join('\n');

    return `He evaluado ${pastEvents.length} evento${
      pastEvents.length === 1 ? '' : 's'
    } pasad${pastEvents.length === 1 ? 'o' : 'os'} y ${futureEvents.length} evento${
      futureEvents.length === 1 ? '' : 's'
    } próxim${futureEvents.length === 1 ? 'o' : 'os'}.

La franja horaria con más asistentes, considerando tanto eventos pasados como próximos, es la **${this.getTimeSlotLabel(
      bestSlot,
    )}** con ${bestCount} lector${bestCount === 1 ? '' : 'es'} registrados.

Detalle por franja:
${slotDetails}`;
  }

  private async getAdminContext(): Promise<string> {
    const mostActive = (await this.activityRepo
      .createQueryBuilder('act')
      .select('user.fullName', 'name')
      .addSelect('COUNT(act.id)', 'totalInteractions')
      .leftJoin('act.user', 'user')
      .groupBy('user.id')
      .orderBy('COUNT(act.id)', 'DESC')
      .limit(1)
      .getRawOne()) as unknown as
      | { name: string | null; totalInteractions: string | number }
      | undefined;

    const leastActive = (await this.activityRepo
      .createQueryBuilder('act')
      .select('user.fullName', 'name')
      .addSelect('COUNT(act.id)', 'totalInteractions')
      .leftJoin('act.user', 'user')
      .groupBy('user.id')
      .orderBy('COUNT(act.id)', 'ASC')
      .limit(1)
      .getRawOne()) as unknown as
      | { name: string | null; totalInteractions: string | number }
      | undefined;

    const topBooks = await this.bookRepo
      .createQueryBuilder('book')
      .select('book.title', 'title')
      .addSelect('book.author', 'author')
      .addSelect('COUNT(book.id)', 'totalRegistrations')
      .groupBy('book.title')
      .addGroupBy('book.author')
      .orderBy('COUNT(book.id)', 'DESC')
      .limit(5)
      .getRawMany<BookAggregationResult>();

    const leastBooks = await this.bookRepo
      .createQueryBuilder('book')
      .select('book.title', 'title')
      .addSelect('book.author', 'author')
      .addSelect('COUNT(book.id)', 'totalRegistrations')
      .groupBy('book.title')
      .addGroupBy('book.author')
      .orderBy('COUNT(book.id)', 'ASC')
      .limit(5)
      .getRawMany<BookAggregationResult>();

    const formatBooks = (books: BookAggregationResult[]) =>
      books
        .map(
          (book, index) =>
            `${index + 1}. ${book.title} de ${book.author} (${Number(
              book.totalRegistrations,
            )} registros)`,
        )
        .join(' | ');

    const topBooksText = topBooks.length ? formatBooks(topBooks) : 'N/A';
    const leastBooksText = leastBooks.length ? formatBooks(leastBooks) : 'N/A';

    return `
      [MÉTRICAS_ADMIN_USUARIO_TOP]: ${mostActive?.name || 'N/A'} (${Number(
        mostActive?.totalInteractions || 0,
      )} interacciones).
      [MÉTRICAS_ADMIN_USUARIO_MENOS]: ${leastActive?.name || 'N/A'} (${Number(
        leastActive?.totalInteractions || 0,
      )} interacciones).
      [SECCIÓN_MERCADO_GLOBAL_TOP]: ${topBooksText}.
      [SECCIÓN_MERCADO_GLOBAL_MENOS]: ${leastBooksText}.
    `;
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

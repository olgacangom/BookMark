import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  Repository,
  SelectQueryBuilder,
  ObjectLiteral,
  DeepPartial,
} from 'typeorm';
import { Request } from 'express';
import { AIController } from './ai.controller';
import { AIService } from './ai.service';
import { AdminService } from '../users/roles/admin.service';
import { User } from '../users/entities/user.entity';
import { Book } from '../books/entities/book.entity';
import { Activity } from '../users/entities/activity.entity';
import { LibraryEvent } from '../users/entities/library-event.entity';
import { Club } from '../club/entities/club.entity';
import { BookListing } from '../users/entities/book-listing.entity';

interface RequestWithUser extends Request {
  user: { id: string; role: string };
}

describe('AIController', () => {
  let controller: AIController;
  let aiService: jest.Mocked<AIService>;
  let adminService: jest.Mocked<AdminService>;

  const createMockRepo = <T extends ObjectLiteral>(): jest.Mocked<
    Repository<T>
  > =>
    ({
      find: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        addGroupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getRawOne: jest.fn(),
        getRawMany: jest.fn(),
      } as unknown as SelectQueryBuilder<T>),
    }) as unknown as jest.Mocked<Repository<T>>;

  const userRepo = createMockRepo<User>();
  const bookRepo = createMockRepo<Book>();
  const activityRepo = createMockRepo<Activity>();
  const eventRepo = createMockRepo<LibraryEvent>();
  const clubRepo = createMockRepo<Club>();
  const listingRepo = createMockRepo<BookListing>();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AIController],
      providers: [
        { provide: AIService, useValue: { getChatResponse: jest.fn() } },
        {
          provide: AdminService,
          useValue: { getMostRequestedBook: jest.fn() },
        },
        { provide: getRepositoryToken(User), useValue: userRepo },
        { provide: getRepositoryToken(Book), useValue: bookRepo },
        { provide: getRepositoryToken(Activity), useValue: activityRepo },
        { provide: getRepositoryToken(LibraryEvent), useValue: eventRepo },
        { provide: getRepositoryToken(Club), useValue: clubRepo },
        { provide: getRepositoryToken(BookListing), useValue: listingRepo },
      ],
    }).compile();

    controller = module.get<AIController>(AIController);
    aiService = module.get(AIService);
    adminService = module.get(AdminService);
  });

  const createMockReq = (role: string, id: string = 'u1'): RequestWithUser =>
    ({ user: { id, role } }) as RequestWithUser;

  it('responde a agradecimientos sin invocar IA', async () => {
    const req = createMockReq('user');
    const res = await controller.chat(req, { prompt: 'gracias', history: [] });
    expect(res).toContain('Un gusto apoyarte');
    expect(aiService.getChatResponse).not.toHaveBeenCalled();
  });

  it('maneja contexto ADMIN con datos', async () => {
    const req = createMockReq('admin');
    const qb = activityRepo.createQueryBuilder();

    (qb.getRawOne as jest.Mock).mockResolvedValue({
      name: 'Test',
      totalInteractions: 1,
    });
    (bookRepo.createQueryBuilder().getRawMany as jest.Mock).mockResolvedValue(
      [],
    );

    aiService.getChatResponse.mockResolvedValue('Admin Response');

    const res = await controller.chat(req, { prompt: 'metrics', history: [] });
    expect(res).toBe('Admin Response');
  });

  it('maneja errores críticos de forma segura', async () => {
    const req = createMockReq('user');
    aiService.getChatResponse.mockRejectedValue(new Error('Fail'));

    const res = await controller.chat(req, { prompt: 'hi', history: [] });
    expect(res).toContain('Biblios se ha despistado');
  });

  describe('getLectorContext Logic', () => {
    it('debe clasificar correctamente clubes y eventos del usuario', async () => {
      const userId = 'user-123';
      const now = new Date();
      const futureDate = new Date(now.getTime() + 86400000); // Mañana

      const clubs = [
        { name: 'Club Unido', members: [{ id: userId }] },
        { name: 'Club Disponible', members: [{ id: 'otros' }] },
      ] as Club[];

      const events = [
        {
          title: 'Evento Inscrito',
          eventDate: futureDate,
          registrations: [{ user: { id: userId } }],
          organizer: { libraryName: 'Biblio 1' },
        },
        {
          title: 'Evento Disponible',
          eventDate: futureDate,
          registrations: [{ user: { id: 'otros' } }],
          organizer: { libraryName: 'Biblio 2' },
        },
      ] as LibraryEvent[];

      clubRepo.find.mockResolvedValue(clubs);
      eventRepo.find.mockResolvedValue(events);
      bookRepo.find.mockResolvedValue([{ title: 'Libro A' } as Book]);
      listingRepo.find.mockResolvedValue([
        { book: { title: 'Libro Venta' } } as BookListing,
      ]);

      aiService.getChatResponse.mockResolvedValue('Respuesta IA');
      await controller.chat(createMockReq('user', userId), {
        prompt: 'hola',
        history: [],
      });

      const context = aiService.getChatResponse.mock.calls[0][2];

      expect(context).toContain('[SECCIÓN_CLUBES_UNIDOS]: Club Unido');
      expect(context).toContain(
        '[SECCIÓN_CLUBES_DISPONIBLES]: Club Disponible',
      );
      expect(context).toContain('[SECCIÓN_EVENTOS_INSCRITO]: Evento Inscrito');
      expect(context).toContain(
        '[SECCIÓN_EVENTOS_DISPONIBLES]: Evento Disponible en Biblio 2',
      );
    });

    it('debe manejar casos vacíos (Sin citas/Sin eventos)', async () => {
      clubRepo.find.mockResolvedValue([]);
      eventRepo.find.mockResolvedValue([]);
      bookRepo.find.mockResolvedValue([]);
      listingRepo.find.mockResolvedValue([]);
      aiService.getChatResponse.mockResolvedValue('OK');

      await controller.chat(createMockReq('user', 'u1'), {
        prompt: 'hola',
        history: [],
      });

      const context = aiService.getChatResponse.mock.calls[0][2];
      expect(context).toContain('[SECCIÓN_CLUBES_UNIDOS]: Ninguno');
      expect(context).toContain(
        '[SECCIÓN_EVENTOS_INSCRITO]: Sin citas próximas',
      );
      expect(context).toContain(
        '[SECCIÓN_EVENTOS_DISPONIBLES]: Sin eventos próximos',
      );
    });

    it('debe manejar eventos pasados filtrándolos correctamente', async () => {
      const pastDate = new Date(Date.now() - 86400000);

      const mockEvents: DeepPartial<LibraryEvent>[] = [
        {
          title: 'Evento Pasado',
          eventDate: pastDate,
          registrations: [],
        },
      ];

      eventRepo.find.mockResolvedValue(mockEvents as unknown as LibraryEvent[]);

      aiService.getChatResponse.mockResolvedValue('OK');
      await controller.chat(createMockReq('user', 'u1'), {
        prompt: 'hola',
        history: [],
      });
      const context = aiService.getChatResponse.mock.calls[0][2];

      expect(context).toContain('Sin citas próximas');
      expect(context).toContain('Sin eventos próximos');
    });
  });

  describe('getLibreroContext integration', () => {
    it('debe obtener contexto de librero y llamar a la IA cuando el rol es librero', async () => {
      adminService.getMostRequestedBook.mockResolvedValue({
        title: 'El Principito',
        author: 'Antoine de Saint-Exupéry',
      });

      aiService.getChatResponse.mockResolvedValue('Respuesta IA LIBRERO');
      const res = await controller.chat(createMockReq('librero', 'lib-123'), {
        prompt: 'hola',
        history: [],
      });
      expect(adminService.getMostRequestedBook).toHaveBeenCalled();

      const contextPassedToAi = aiService.getChatResponse.mock.calls[0][2];
      expect(contextPassedToAi).toContain(
        'El Principito de Antoine de Saint-Exupéry',
      );

      expect(res).toBe('Respuesta IA LIBRERO');
    });

    it('debe manejar el caso donde no hay libro solicitado (getLibreroContext vacío)', async () => {
      adminService.getMostRequestedBook.mockResolvedValue(null);
      aiService.getChatResponse.mockResolvedValue('Respuesta con advertencia');

      await controller.chat(createMockReq('librero', 'lib-123'), {
        prompt: 'hola',
        history: [],
      });

      const contextPassedToAi = aiService.getChatResponse.mock.calls[0][2];
      expect(contextPassedToAi).toContain('Aún no hay suficientes solicitudes');
    });
  });

  describe('getLibreroPeakTimeSlot (via getDirectAnswer)', () => {
    it('debe invocar getLibreroPeakTimeSlot cuando el usuario es librero y pregunta por franjas horarias', async () => {
      const pastDate = new Date();
      pastDate.setHours(10); // Mañana

      eventRepo.find.mockResolvedValue([
        {
          eventDate: pastDate,
          registrations: [{ user: { id: 'user-1' } }],
        },
      ] as unknown as LibraryEvent[]);

      const res = await controller.chat(
        createMockReq('librero', 'librero-123'),
        {
          prompt: 'franja horaria',
          history: [],
        },
      );

      expect(res).toContain('mañana');
      expect(res).toContain('1 asistente');

      expect(aiService.getChatResponse).not.toHaveBeenCalled();
    });

    it('debe devolver mensaje si no hay eventos en la franja horaria', async () => {
      eventRepo.find.mockResolvedValue([]);

      const res = await controller.chat(
        createMockReq('librero', 'librero-123'),
        {
          prompt: 'asisten más lectores',
          history: [],
        },
      );

      expect(res).toContain('No hay datos de eventos');
    });
  });

  describe('getTimeSlotLabel', () => {
    const getLabel = (slot: string): string =>
      (controller as any).getTimeSlotLabel(slot);

    it('debe retornar el label correcto para "madrugada"', () => {
      expect(getLabel('madrugada')).toBe('madrugada (00:00-06:00)');
    });

    it('debe retornar el label correcto para "tarde"', () => {
      expect(getLabel('tarde')).toBe('tarde (12:00-18:00)');
    });

    it('debe retornar el label correcto para "noche"', () => {
      expect(getLabel('noche')).toBe('noche (18:00-24:00)');
    });

    it('debe retornar el mismo valor para una franja desconocida (default)', () => {
      const unknownSlot = 'siesta';
      expect(getLabel(unknownSlot)).toBe(unknownSlot);
    });
  });

  it('debe retornar mensaje si los eventos registrados no tienen asistentes', async () => {
    const eventWithoutRegistrations: DeepPartial<LibraryEvent> = {
      organizer: { id: 'librero-123' },
      eventDate: new Date(),
      registrations: [],
    };

    eventRepo.find.mockResolvedValue([
      eventWithoutRegistrations as unknown as LibraryEvent,
    ]);

    const res = await controller.chat(createMockReq('librero', 'librero-123'), {
      prompt: 'asisten más lectores',
      history: [],
    });

    expect(res).toBe(
      'Hay eventos registrados, pero ninguno tiene asistentes apuntados aún.',
    );
  });

  it('debe formatear correctamente la lista de libros top', async () => {
    const bookQB = bookRepo.createQueryBuilder();
    (bookQB.getRawMany as jest.Mock).mockResolvedValueOnce([
      {
        title: 'El Principito',
        author: 'Saint-Exupéry',
        totalRegistrations: '10',
      },
    ]);
    (bookQB.getRawMany as jest.Mock).mockResolvedValueOnce([]);

    const actQB = activityRepo.createQueryBuilder();
    (actQB.getRawOne as jest.Mock).mockResolvedValue(undefined);

    aiService.getChatResponse.mockResolvedValue('OK');

    await controller.chat(createMockReq('admin', 'admin-123'), {
      prompt: 'metrics',
      history: [],
    });

    const context = aiService.getChatResponse.mock.calls[0][2];
    expect(context).toContain(
      '1. El Principito de Saint-Exupéry (10 registros)',
    );
  });
});

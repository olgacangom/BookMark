import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AIController } from './ai.controller';
import { AIService } from './ai.service';
import { AdminService } from '../users/roles/admin.service';
import { User, UserRole } from '../users/entities/user.entity';
import { Book } from '../books/entities/book.entity';
import { Activity } from '../users/entities/activity.entity';
import { LibraryEvent } from '../users/entities/library-event.entity';
import { Club } from '../club/entities/club.entity';
import { BookListing } from '../users/entities/book-listing.entity';

describe('AIController', () => {
  let controller: AIController;
  let aiService: jest.Mocked<AIService>;
  let adminService: jest.Mocked<AdminService>;
  let userRepo: any;
  let bookRepo: any;
  let activityRepo: any;
  let eventRepo: any;
  let clubRepo: any;
  let listingRepo: any;

  const mockRequest = (role: string = 'USER', userId: string = 'user-123') => ({
    user: { id: userId, role },
  });

  beforeEach(async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    userRepo = {
      find: jest.fn(),
    };

    bookRepo = {
      find: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    activityRepo = {
      find: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    eventRepo = {
      find: jest.fn(),
    };

    clubRepo = {
      find: jest.fn(),
    };

    listingRepo = {
      find: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AIController],
      providers: [
        {
          provide: AIService,
          useValue: {
            getChatResponse: jest.fn(),
          },
        },
        {
          provide: AdminService,
          useValue: {
            getMostRequestedBook: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(User),
          useValue: userRepo,
        },
        {
          provide: getRepositoryToken(Book),
          useValue: bookRepo,
        },
        {
          provide: getRepositoryToken(Activity),
          useValue: activityRepo,
        },
        {
          provide: getRepositoryToken(LibraryEvent),
          useValue: eventRepo,
        },
        {
          provide: getRepositoryToken(Club),
          useValue: clubRepo,
        },
        {
          provide: getRepositoryToken(BookListing),
          useValue: listingRepo,
        },
      ],
    }).compile();

    controller = module.get<AIController>(AIController);
    aiService = module.get<jest.Mocked<AIService>>(AIService);
    adminService = module.get<jest.Mocked<AdminService>>(AdminService);
  });

  afterEach(() => {
    (console.error as jest.Mock).mockRestore();
    jest.clearAllMocks();
  });

  describe('POST /chat', () => {
    it('debe retornar respuesta directa para "gracias"', async () => {
      const req = mockRequest('USER', 'user-123');

      const result = await controller.chat(req as any, {
        prompt: 'gracias',
        history: [],
      });

      expect(result).toContain('Un gusto apoyarte');
      expect(aiService.getChatResponse).not.toHaveBeenCalled();
    });

    it('debe retornar respuesta directa para "muchas gracias"', async () => {
      const req = mockRequest('USER', 'user-123');

      const result = await controller.chat(req as any, {
        prompt: 'muchas gracias',
        history: [],
      });

      expect(result).toContain('Un gusto apoyarte');
    });

    it('debe retornar respuesta directa para "gracias!"', async () => {
      const req = mockRequest('USER', 'user-123');

      const result = await controller.chat(req as any, {
        prompt: 'Gracias!',
        history: [],
      });

      expect(result).toContain('Un gusto apoyarte');
    });

    it('debe obtener contexto ADMIN y llamar AIService para admin', async () => {
      const req = mockRequest('admin', 'admin-123');
      const mockResponse = 'Respuesta del admin';

      activityRepo.createQueryBuilder.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        addGroupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValueOnce({
          name: 'Top User',
          totalInteractions: '100',
        }).mockResolvedValueOnce({
          name: 'Least User',
          totalInteractions: '5',
        }),
      });

      bookRepo.createQueryBuilder.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        addGroupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getRawMany: jest.fn()
          .mockResolvedValueOnce([
            { title: 'Book 1', author: 'Author 1', totalRegistrations: '10' },
          ])
          .mockResolvedValueOnce([
            { title: 'Book 5', author: 'Author 5', totalRegistrations: '1' },
          ]),
      });

      aiService.getChatResponse.mockResolvedValueOnce(mockResponse);

      const result = await controller.chat(req as any, {
        prompt: 'una pregunta',
        history: [],
      });

      expect(aiService.getChatResponse).toHaveBeenCalled();
      expect(result).toBe(mockResponse);
    });

    it('debe obtener contexto LIBRERO y llamar AIService para librero', async () => {
      const req = mockRequest('librero', 'librero-123');
      const mockResponse = 'Respuesta del librero';

      adminService.getMostRequestedBook.mockResolvedValueOnce({
        title: 'Popular Book',
        author: 'Popular Author',
      });

      aiService.getChatResponse.mockResolvedValueOnce(mockResponse);

      const result = await controller.chat(req as any, {
        prompt: 'una pregunta',
        history: [],
      });

      expect(aiService.getChatResponse).toHaveBeenCalled();
      expect(result).toBe(mockResponse);
    });

    it('debe obtener contexto LECTOR y llamar AIService para lector', async () => {
      const req = mockRequest('user', 'user-123');
      const mockResponse = 'Respuesta del lector';

      bookRepo.find.mockResolvedValueOnce([
        { title: 'My Book 1', userId: 'user-123' },
      ]);

      clubRepo.find.mockResolvedValueOnce([
        { name: 'Club 1', members: [{ id: 'user-123' }] },
        { name: 'Club 2', members: [] },
      ]);

      eventRepo.find.mockResolvedValueOnce([
        {
          title: 'Event 1',
          eventDate: new Date(Date.now() + 1000000),
          registrations: [{ userId: 'user-123' }],
          organizer: { libraryName: 'Library 1' },
        },
      ]);

      listingRepo.find.mockResolvedValueOnce([
        { book: { title: 'Listed Book 1' } },
      ]);

      aiService.getChatResponse.mockResolvedValueOnce(mockResponse);

      const result = await controller.chat(req as any, {
        prompt: 'una pregunta',
        history: [],
      });

      expect(aiService.getChatResponse).toHaveBeenCalled();
      expect(result).toBe(mockResponse);
    });

    it('debe manejar error y retornar mensaje de error', async () => {
      const req = mockRequest('user', 'user-123');

      aiService.getChatResponse.mockRejectedValueOnce(
        new Error('Service Error'),
      );

      const result = await controller.chat(req as any, {
        prompt: 'una pregunta',
        history: [],
      });

      expect(result).toContain('Biblios se ha despistado');
    });
  });

  describe('getDirectAnswer - Franja horaria librero', () => {
    it('debe retornar franja horaria con mayor asistencia para librero', async () => {
      const req = mockRequest('librero', 'librero-123');

      const futureDate = new Date();
      futureDate.setHours(14); // tarde

      eventRepo.find.mockResolvedValueOnce([
        {
          organizer: { id: 'librero-123' },
          eventDate: futureDate,
          registrations: [{ user: { id: 'user-1' } }, { user: { id: 'user-2' } }],
        },
      ]);

      const result = await controller.chat(req as any, {
        prompt: 'franja horaria',
        history: [],
      });

      expect(result).toContain('franja horaria');
      expect(result).toContain('tarde');
    });

    it('debe retornar mensaje si no hay eventos', async () => {
      const req = mockRequest('librero', 'librero-123');

      eventRepo.find.mockResolvedValueOnce([]);

      const result = await controller.chat(req as any, {
        prompt: 'horario',
        history: [],
      });

      expect(result).toContain('No hay datos de eventos');
    });

    it('debe retornar mensaje si eventos no tienen asistentes', async () => {
      const req = mockRequest('librero', 'librero-123');

      eventRepo.find.mockResolvedValueOnce([
        {
          organizer: { id: 'librero-123' },
          eventDate: new Date(),
          registrations: [],
        },
      ]);

      const result = await controller.chat(req as any, {
        prompt: 'asisten más lectores',
        history: [],
      });

      expect(result).toContain('ninguno tiene asistentes');
    });

    it('debe calcular correctamente franja madrugada', async () => {
      const req = mockRequest('librero', 'librero-123');

      const madrigadaDate = new Date();
      madrigadaDate.setHours(3); // madrugada

      eventRepo.find.mockResolvedValueOnce([
        {
          organizer: { id: 'librero-123' },
          eventDate: madrigadaDate,
          registrations: [{ user: { id: 'user-1' } }],
        },
      ]);

      const result = await controller.chat(req as any, {
        prompt: 'p público con más asistencia',
        history: [],
      });

      expect(result).toContain('madrugada');
    });

    it('debe calcular correctamente franja mañana', async () => {
      const req = mockRequest('librero', 'librero-123');

      const mañanaDate = new Date();
      mañanaDate.setHours(9);

      eventRepo.find.mockResolvedValueOnce([
        {
          organizer: { id: 'librero-123' },
          eventDate: mañanaDate,
          registrations: [{ user: { id: 'user-1' } }],
        },
      ]);

      const result = await controller.chat(req as any, {
        prompt: 'franja horaria',
        history: [],
      });

      expect(result).toContain('mañana');
    });

    it('debe calcular correctamente franja noche', async () => {
      const req = mockRequest('librero', 'librero-123');

      const nocheDate = new Date();
      nocheDate.setHours(20);

      eventRepo.find.mockResolvedValueOnce([
        {
          organizer: { id: 'librero-123' },
          eventDate: nocheDate,
          registrations: [{ user: { id: 'user-1' } }],
        },
      ]);

      const result = await controller.chat(req as any, {
        prompt: 'asisten más',
        history: [],
      });

      expect(result).toContain('noche');
    });

    it('debe mostrar detalles de todas las franjas', async () => {
      const req = mockRequest('librero', 'librero-123');

      const events: any[] = [];
      for (let hour of [3, 9, 14, 20]) {
        const date = new Date();
        date.setHours(hour);
        events.push({
          organizer: { id: 'librero-123' },
          eventDate: date,
          registrations: [{ user: { id: 'user-1' } }, { user: { id: 'user-2' } }],
        });
      }

      eventRepo.find.mockResolvedValueOnce(events);

      const result = await controller.chat(req as any, {
        prompt: 'franja horaria',
        history: [],
      });

      expect(result).toContain('madrugada');
      expect(result).toContain('mañana');
      expect(result).toContain('tarde');
      expect(result).toContain('noche');
    });
  });

  describe('getAdminContext', () => {
    it('debe obtener contexto admin completo', async () => {
      const req = mockRequest('admin', 'admin-123');

      activityRepo.createQueryBuilder.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getRawOne: jest.fn()
          .mockResolvedValueOnce({
            name: 'User A',
            totalInteractions: '50',
          })
          .mockResolvedValueOnce({
            name: 'User B',
            totalInteractions: '10',
          }),
      });

      bookRepo.createQueryBuilder.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        addGroupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getRawMany: jest.fn()
          .mockResolvedValueOnce([
            { title: 'Book 1', author: 'Author 1', totalRegistrations: '100' },
            { title: 'Book 2', author: 'Author 2', totalRegistrations: '50' },
          ])
          .mockResolvedValueOnce([
            { title: 'Book 10', author: 'Author 10', totalRegistrations: '1' },
          ]),
      });

      aiService.getChatResponse.mockResolvedValueOnce('response');

      await controller.chat(req as any, {
        prompt: 'metrics',
        history: [],
      });

      expect(aiService.getChatResponse).toHaveBeenCalledWith(
        'metrics',
        [],
        expect.stringContaining('MÉTRICAS_ADMIN_USUARIO_TOP'),
        'admin',
      );
    });

    it('debe manejar N/A cuando no hay datos', async () => {
      const req = mockRequest('admin', 'admin-123');

      activityRepo.createQueryBuilder.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getRawOne: jest.fn()
          .mockResolvedValueOnce(undefined)
          .mockResolvedValueOnce(undefined),
      });

      bookRepo.createQueryBuilder.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        addGroupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getRawMany: jest.fn()
          .mockResolvedValueOnce([])
          .mockResolvedValueOnce([]),
      });

      aiService.getChatResponse.mockResolvedValueOnce('response');

      await controller.chat(req as any, {
        prompt: 'metrics',
        history: [],
      });

      const callArgs = aiService.getChatResponse.mock.calls[0][2];
      expect(callArgs).toContain('N/A');
    });
  });

  describe('getLibreroContext', () => {
    it('debe obtener contexto librero con libro popular', async () => {
      const req = mockRequest('librero', 'librero-123');

      adminService.getMostRequestedBook.mockResolvedValueOnce({
        title: 'Popular Book',
        author: 'Popular Author',
      });

      aiService.getChatResponse.mockResolvedValueOnce('response');

      await controller.chat(req as any, {
        prompt: 'pregunta',
        history: [],
      });

      const context = aiService.getChatResponse.mock.calls[0][2];
      expect(context).toContain('Popular Book');
      expect(context).toContain('Popular Author');
    });

    it('debe manejar cuando no hay libro popular', async () => {
      const req = mockRequest('librero', 'librero-123');

      adminService.getMostRequestedBook.mockResolvedValueOnce(null);

      aiService.getChatResponse.mockResolvedValueOnce('response');

      await controller.chat(req as any, {
        prompt: 'pregunta',
        history: [],
      });

      const context = aiService.getChatResponse.mock.calls[0][2];
      expect(context).toContain('no hay suficientes solicitudes');
    });
  });

  describe('getLectorContext', () => {
    it('debe obtener contexto lector completo', async () => {
      const req = mockRequest('user', 'user-123');

      bookRepo.find.mockResolvedValueOnce([
        { title: 'My Book 1' },
        { title: 'My Book 2' },
      ]);

      clubRepo.find.mockResolvedValueOnce([
        { name: 'Club 1', members: [{ id: 'user-123' }] },
        { name: 'Club 2', members: [] },
      ]);

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);

      eventRepo.find.mockResolvedValueOnce([
        {
          title: 'Event 1',
          eventDate: futureDate,
          registrations: [{ userId: 'user-123' }],
          organizer: { libraryName: 'Library 1' },
        },
        {
          title: 'Event 2',
          eventDate: futureDate,
          registrations: [{ userId: 'other-user' }],
          organizer: { libraryName: 'Library 2' },
        },
      ]);

      listingRepo.find.mockResolvedValueOnce([
        { book: { title: 'Listed Book 1' } },
        { book: { title: 'Listed Book 2' } },
      ]);

      aiService.getChatResponse.mockResolvedValueOnce('response');

      await controller.chat(req as any, {
        prompt: 'pregunta',
        history: [],
      });

      const context = aiService.getChatResponse.mock.calls[0][2];
      expect(context).toContain('SECCIÓN_LIBROS_USUARIO');
      expect(context).toContain('SECCIÓN_CLUBES_UNIDOS');
      expect(context).toContain('SECCIÓN_CLUBES_DISPONIBLES');
      expect(context).toContain('SECCIÓN_EVENTOS_INSCRITO');
      expect(context).toContain('SECCIÓN_EVENTOS_DISPONIBLES');
      expect(context).toContain('SECCIÓN_MERCADO_GLOBAL');
    });

    it('debe manejar sin libros, clubes ni eventos', async () => {
      const req = mockRequest('user', 'user-123');

      bookRepo.find.mockResolvedValueOnce([]);
      clubRepo.find.mockResolvedValueOnce([]);
      eventRepo.find.mockResolvedValueOnce([]);
      listingRepo.find.mockResolvedValueOnce([]);

      aiService.getChatResponse.mockResolvedValueOnce('response');

      await controller.chat(req as any, {
        prompt: 'pregunta',
        history: [],
      });

      const context = aiService.getChatResponse.mock.calls[0][2];
      expect(context).toContain('Ninguno');
      expect(context).toContain('Sin citas próximas');
      expect(context).toContain('Sin eventos próximos');
    });

    it('debe manejar eventos con fecha inválida', async () => {
      const req = mockRequest('user', 'user-123');

      bookRepo.find.mockResolvedValueOnce([]);
      clubRepo.find.mockResolvedValueOnce([]);

      eventRepo.find.mockResolvedValueOnce([
        {
          title: 'Event 1',
          eventDate: 'invalid-date',
          registrations: [],
          organizer: { libraryName: 'Library 1' },
        },
      ]);

      listingRepo.find.mockResolvedValueOnce([]);

      aiService.getChatResponse.mockResolvedValueOnce('response');

      await controller.chat(req as any, {
        prompt: 'pregunta',
        history: [],
      });

      expect(aiService.getChatResponse).toHaveBeenCalled();
    });

    it('debe manejar registrations con estructura user.id', async () => {
      const req = mockRequest('user', 'user-123');

      bookRepo.find.mockResolvedValueOnce([]);
      clubRepo.find.mockResolvedValueOnce([]);

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);

      eventRepo.find.mockResolvedValueOnce([
        {
          title: 'Event 1',
          eventDate: futureDate,
          registrations: [{ user: { id: 'user-123' } }],
          organizer: { libraryName: 'Library 1' },
        },
      ]);

      listingRepo.find.mockResolvedValueOnce([]);

      aiService.getChatResponse.mockResolvedValueOnce('response');

      await controller.chat(req as any, {
        prompt: 'pregunta',
        history: [],
      });

      const context = aiService.getChatResponse.mock.calls[0][2];
      expect(context).toContain('Event 1');
    });
  });

  describe('normalizePrompt', () => {
    it('debe normalizar prompts con diferentes casos', async () => {
      const req = mockRequest('user', 'user-123');

      const result = await controller.chat(req as any, {
        prompt: '  GRACIAS  ',
        history: [],
      });

      expect(result).toContain('Un gusto apoyarte');
    });

    it('debe manejar prompts vacíos', async () => {
      const req = mockRequest('user', 'user-123');

      bookRepo.find.mockResolvedValueOnce([]);
      clubRepo.find.mockResolvedValueOnce([]);
      eventRepo.find.mockResolvedValueOnce([]);
      listingRepo.find.mockResolvedValueOnce([]);

      aiService.getChatResponse.mockResolvedValueOnce('response');

      await controller.chat(req as any, {
        prompt: '',
        history: [],
      });

      expect(aiService.getChatResponse).toHaveBeenCalled();
    });
  });

  describe('getTimeSlotLabel', () => {
    it('debe retornar labels correctos para todas las franjas', async () => {
      const req = mockRequest('librero', 'librero-123');

      const events: any[] = [];
      const hours = [
        { hour: 2, slot: 'madrugada' },
        { hour: 8, slot: 'mañana' },
        { hour: 15, slot: 'tarde' },
        { hour: 22, slot: 'noche' },
      ];

      for (const { hour } of hours) {
        const date = new Date();
        date.setHours(hour);
        events.push({
          organizer: { id: 'librero-123' },
          eventDate: date,
          registrations: [{ user: { id: 'user-1' } }],
        });
      }

      eventRepo.find.mockResolvedValueOnce(events);

      aiService.getChatResponse.mockResolvedValueOnce('response');

      const result = await controller.chat(req as any, {
        prompt: 'franja horaria',
        history: [],
      });

      expect(result).toContain('madrugada (00:00-06:00)');
      expect(result).toContain('mañana (06:00-12:00)');
      expect(result).toContain('tarde (12:00-18:00)');
      expect(result).toContain('noche (18:00-24:00)');
    });

    it('debe retornar la misma cadena para una franja desconocida', () => {
      const unknown = (controller as any).getTimeSlotLabel('siesta');
      expect(unknown).toBe('siesta');
    });
  });

  describe('multiple events filtering', () => {
    it('debe diferenciar entre eventos pasados y futuros', async () => {
      const req = mockRequest('librero', 'librero-123');

      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);

      eventRepo.find.mockResolvedValueOnce([
        {
          organizer: { id: 'librero-123' },
          eventDate: pastDate,
          registrations: [{ user: { id: 'user-1' } }],
        },
        {
          organizer: { id: 'librero-123' },
          eventDate: futureDate,
          registrations: [{ user: { id: 'user-2' } }],
        },
      ]);

      const result = await controller.chat(req as any, {
        prompt: 'franja horaria',
        history: [],
      });

      expect(result).toContain('1 evento');
      expect(result).toContain('1 evento');
    });
  });

  describe('PassThrough - Historia y Contexto', () => {
    it('debe pasar el historial al AIService', async () => {
      const req = mockRequest('user', 'user-123');
      const mockHistory = [
        { role: 'user', parts: [{ text: 'Hello' }] },
      ];

      bookRepo.find.mockResolvedValueOnce([]);
      clubRepo.find.mockResolvedValueOnce([]);
      eventRepo.find.mockResolvedValueOnce([]);
      listingRepo.find.mockResolvedValueOnce([]);

      aiService.getChatResponse.mockResolvedValueOnce('response');

      await controller.chat(req as any, {
        prompt: 'pregunta',
        history: mockHistory,
      });

      expect(aiService.getChatResponse).toHaveBeenCalledWith(
        'pregunta',
        mockHistory,
        expect.any(String),
        'user',
      );
    });

    it('debe pasar el rol correcto al AIService', async () => {
      const req = mockRequest('librero', 'librero-456');

      adminService.getMostRequestedBook.mockResolvedValueOnce({
        title: 'Book',
        author: 'Author',
      });

      aiService.getChatResponse.mockResolvedValueOnce('response');

      await controller.chat(req as any, {
        prompt: 'pregunta',
        history: [],
      });

      expect(aiService.getChatResponse).toHaveBeenCalledWith(
        'pregunta',
        [],
        expect.any(String),
        'librero',
      );
    });
  });
});

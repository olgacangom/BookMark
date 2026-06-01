import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { InternalServerErrorException } from '@nestjs/common';
import { AIService } from './ai.service';

// Variables globales para el mock
let mockSendMessage: jest.Mock;
let mockStartChat: jest.Mock;
let mockGetGenerativeModel: jest.Mock;

jest.mock('@google/generative-ai', () => {
  return {
    GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
      getGenerativeModel: jest.fn(function() {
        return {
          startChat: jest.fn(function() {
            return {
              sendMessage: jest.fn(),
            };
          }),
        };
      }),
    })),
  };
});

import { GoogleGenerativeAI } from '@google/generative-ai';

describe('AIService', () => {
  let service: AIService;
  let configService: ConfigService;
  let mockSendMessage: jest.Mock;

  beforeEach(async () => {
    jest.clearAllMocks();

    // Configurar el mock
    mockSendMessage = jest.fn();

    const mockGenerativeAI = GoogleGenerativeAI as jest.MockedClass<typeof GoogleGenerativeAI>;
    mockGenerativeAI.mockImplementation(() => {
      const mockChat = {
        sendMessage: mockSendMessage,
      };

      return {
        getGenerativeModel: jest.fn().mockReturnValue({
          startChat: jest.fn().mockReturnValue(mockChat),
        }),
      } as any;
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AIService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'GEMINI_API_KEY') {
                return 'test-api-key';
              }
              return null;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<AIService>(AIService);
    configService = module.get<ConfigService>(ConfigService);
    service.onModuleInit();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('onModuleInit', () => {
    it('debe inicializar GoogleGenerativeAI con la API key correcta', () => {
      expect(GoogleGenerativeAI).toHaveBeenCalledWith('test-api-key');
    });

    it('debe obtener el modelo generativo correctamente', () => {
      const instance = (GoogleGenerativeAI as jest.MockedClass<typeof GoogleGenerativeAI>).mock.results[0].value;
      expect(instance.getGenerativeModel).toHaveBeenCalledWith({
        model: 'gemini-3-flash-preview',
      });
    });

    it('debe manejar el caso cuando no hay API key', () => {
      jest.clearAllMocks();
      jest.spyOn(configService, 'get').mockReturnValueOnce(undefined);

      service.onModuleInit();

      expect(GoogleGenerativeAI).toHaveBeenCalledWith('');
    });
  });

  describe('getChatResponse', () => {
    it('debe retornar la respuesta correcta para rol admin', async () => {
      const mockResponse = 'Respuesta del admin';
      mockSendMessage.mockResolvedValueOnce({
        response: {
          text: () => mockResponse,
        },
      });

      const result = await service.getChatResponse(
        '¿Cuál es el libro más registrado?',
        [],
        'contexto de prueba',
        'admin',
      );

      expect(result).toBe(mockResponse);
      expect(mockSendMessage).toHaveBeenCalled();
    });

    it('debe incluir la instrucción de rol admin en el mensaje', async () => {
      mockSendMessage.mockResolvedValueOnce({
        response: {
          text: () => 'Respuesta',
        },
      });

      await service.getChatResponse(
        'pregunta',
        [],
        'contexto',
        'admin',
      );

      const callArgs = mockSendMessage.mock.calls[0][0];
      expect(callArgs).toContain('Analista Jefe');
      expect(callArgs).toContain('administrador');
    });

    it('debe incluir la instrucción de rol librero en el mensaje', async () => {
      mockSendMessage.mockResolvedValueOnce({
        response: {
          text: () => 'Respuesta',
        },
      });

      await service.getChatResponse(
        'pregunta',
        [],
        'contexto',
        'librero',
      );

      const callArgs = mockSendMessage.mock.calls[0][0];
      expect(callArgs).toContain('Consultor Estratégico');
      expect(callArgs).toContain('librerías');
    });

    it('debe incluir la instrucción de rol default (Biblios) en el mensaje', async () => {
      mockSendMessage.mockResolvedValueOnce({
        response: {
          text: () => 'Respuesta',
        },
      });

      await service.getChatResponse(
        'pregunta',
        [],
        'contexto',
        'usuario',
      );

      const callArgs = mockSendMessage.mock.calls[0][0];
      expect(callArgs).toContain('Biblios');
      expect(callArgs).toContain('bibliotecario sabio');
    });

    it('debe pasar el historial al iniciar el chat', async () => {
      const mockHistory = [
        { role: 'user', parts: [{ text: 'Pregunta 1' }] },
        { role: 'model', parts: [{ text: 'Respuesta 1' }] },
      ];

      mockSendMessage.mockResolvedValueOnce({
        response: {
          text: () => 'Respuesta',
        },
      });

      const instance = (GoogleGenerativeAI as jest.MockedClass<typeof GoogleGenerativeAI>).mock.results[0].value;
      const startChatMock = (instance.getGenerativeModel().startChat as jest.Mock);

      await service.getChatResponse(
        'pregunta 2',
        mockHistory,
        'contexto',
        'admin',
      );

      expect(startChatMock).toHaveBeenCalledWith({
        history: mockHistory,
      });
    });

    it('debe usar historial vacío cuando no se proporciona', async () => {
      mockSendMessage.mockResolvedValueOnce({
        response: {
          text: () => 'Respuesta',
        },
      });

      const instance = (GoogleGenerativeAI as jest.MockedClass<typeof GoogleGenerativeAI>).mock.results[0].value;
      const startChatMock = (instance.getGenerativeModel().startChat as jest.Mock);

      await service.getChatResponse(
        'pregunta',
        [],
        'contexto',
        'admin',
      );

      expect(startChatMock).toHaveBeenCalledWith({
        history: [],
      });
    });

    it('debe incluir el contexto en el mensaje de sistema', async () => {
      const contexto = 'Datos importantes del contexto';
      mockSendMessage.mockResolvedValueOnce({
        response: {
          text: () => 'Respuesta',
        },
      });

      await service.getChatResponse(
        'pregunta',
        [],
        contexto,
        'admin',
      );

      const callArgs = mockSendMessage.mock.calls[0][0];
      expect(callArgs).toContain(contexto);
      expect(callArgs).toContain('CONTEXTO REAL DE LA BASE DE DATOS');
    });

    it('debe incluir la pregunta del usuario en el mensaje', async () => {
      const userPrompt = '¿Cuál es el libro más popular?';
      mockSendMessage.mockResolvedValueOnce({
        response: {
          text: () => 'Respuesta',
        },
      });

      await service.getChatResponse(
        userPrompt,
        [],
        'contexto',
        'admin',
      );

      const callArgs = mockSendMessage.mock.calls[0][0];
      expect(callArgs).toContain(userPrompt);
      expect(callArgs).toContain('Pregunta:');
    });

    it('debe trimear la respuesta', async () => {
      mockSendMessage.mockResolvedValueOnce({
        response: {
          text: () => '  Respuesta con espacios  ',
        },
      });

      const result = await service.getChatResponse(
        'pregunta',
        [],
        'contexto',
        'admin',
      );

      expect(result).toBe('Respuesta con espacios');
    });

    it('debe manejar error con status 429 (Quota exceeded)', async () => {
      mockSendMessage.mockRejectedValueOnce({
        message: 'Some error',
        status: 429,
      });

      const result = await service.getChatResponse(
        'pregunta',
        [],
        'contexto',
        'admin',
      );

      expect(result).toBe(
        'Biblios no está disponible temporalmente por límite de cuota. Intenta de nuevo en unos segundos.',
      );
    });

    it('debe manejar error con mensaje Quota exceeded', async () => {
      mockSendMessage.mockRejectedValueOnce({
        message: 'Quota exceeded for quota group',
        status: 500,
      });

      const result = await service.getChatResponse(
        'pregunta',
        [],
        'contexto',
        'admin',
      );

      expect(result).toBe(
        'Biblios no está disponible temporalmente por límite de cuota. Intenta de nuevo en unos segundos.',
      );
    });

    it('debe lanzar InternalServerErrorException para otros errores', async () => {
      mockSendMessage.mockRejectedValueOnce({
        message: 'Error desconocido',
        status: 500,
      });

      await expect(
        service.getChatResponse('pregunta', [], 'contexto', 'admin'),
      ).rejects.toThrow(InternalServerErrorException);

      await expect(
        service.getChatResponse('pregunta', [], 'contexto', 'admin'),
      ).rejects.toThrow('Error en la comunicación con Biblios.');
    });

    it('debe manejar error sin propiedades status ni message', async () => {
      mockSendMessage.mockRejectedValueOnce(new Error('Error genérico'));

      await expect(
        service.getChatResponse('pregunta', [], 'contexto', 'admin'),
      ).rejects.toThrow(InternalServerErrorException);
    });

    it('debe incluir las REGLAS DE ORO en el system instruction', async () => {
      mockSendMessage.mockResolvedValueOnce({
        response: {
          text: () => 'Respuesta',
        },
      });

      await service.getChatResponse(
        'pregunta',
        [],
        'contexto',
        'admin',
      );

      const callArgs = mockSendMessage.mock.calls[0][0];
      expect(callArgs).toContain('REGLAS DE ORO');
      expect(callArgs).toContain('SEPARACIÓN ESTRICTA');
      expect(callArgs).toContain('RESPUESTA DIRECTA');
      expect(callArgs).toContain('FORMATO VISUAL');
    });

    it('debe incluir instrucciones específicas de formato visual', async () => {
      mockSendMessage.mockResolvedValueOnce({
        response: {
          text: () => 'Respuesta',
        },
      });

      await service.getChatResponse(
        'pregunta',
        [],
        'contexto',
        'admin',
      );

      const callArgs = mockSendMessage.mock.calls[0][0];
      expect(callArgs).toContain('###');
      expect(callArgs).toContain('**negrita**');
    });

    it('debe combinar correctamente roleInstruction con systemInstruction', async () => {
      mockSendMessage.mockResolvedValueOnce({
        response: {
          text: () => 'Respuesta',
        },
      });

      await service.getChatResponse(
        'pregunta',
        [],
        'contexto',
        'admin',
      );

      const callArgs = mockSendMessage.mock.calls[0][0];
      expect(callArgs).toContain('Analista Jefe');
      expect(callArgs).toContain('CONTEXTO REAL');
    });

    it('debe manejar múltiples llamadas consecutivas', async () => {
      mockSendMessage.mockResolvedValue({
        response: {
          text: () => 'Respuesta',
        },
      });

      const result1 = await service.getChatResponse(
        'pregunta 1',
        [],
        'contexto',
        'admin',
      );

      const result2 = await service.getChatResponse(
        'pregunta 2',
        [],
        'contexto',
        'librero',
      );

      expect(result1).toBe('Respuesta');
      expect(result2).toBe('Respuesta');
      expect(mockSendMessage).toHaveBeenCalledTimes(2);
    });
  });
});

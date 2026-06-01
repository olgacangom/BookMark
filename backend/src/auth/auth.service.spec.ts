import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import {
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as nodemailer from 'nodemailer';
import * as uuid from 'uuid';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { User, UserRole } from '../users/entities/user.entity';
import { UserStats } from '../users/entities/user-stats.entity';

jest.mock('bcrypt');
jest.mock('nodemailer');
jest.mock('uuid');

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let jwtService: jest.Mocked<JwtService>;
  let configService: jest.Mocked<ConfigService>;
  let userRepository: any;
  let userStatsRepository: any;

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    password: 'hashed_password',
    fullName: 'Test User',
    province: 'Madrid',
    role: UserRole.USER,
    libraryName: null,
    libraryAddress: null,
    document: null,
    libraryPhone: null,
    librarySchedule: null,
    bio: null,
    avatarUrl: null,
    isPublic: true,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    resetPasswordToken: null,
    resetPasswordExpires: null,
    address: null,
    city: null,
    books: [],
    followerRelations: [],
    followingRelations: [],
    stats: {} as any,
    badges: [],
    clubs: [],
    registrations: [],
    events: [],
  } as any;

  const mockInactiveUser = {
    ...mockUser,
    isActive: false,
  } as any;

  const mockLibreroPendienteUser = {
    ...mockUser,
    role: UserRole.LIBRERO_PENDIENTE,
  } as any;

  beforeEach(async () => {
    userRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
    };

    userStatsRepository = {
      create: jest.fn(),
      save: jest.fn(),
    };

    usersService = {
      findOneByEmail: jest.fn(),
      create: jest.fn(),
    } as any;

    jwtService = {
      sign: jest.fn(),
    } as any;

    configService = {
      get: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: usersService,
        },
        {
          provide: JwtService,
          useValue: jwtService,
        },
        {
          provide: ConfigService,
          useValue: configService,
        },
        {
          provide: getRepositoryToken(User),
          useValue: userRepository,
        },
        {
          provide: getRepositoryToken(UserStats),
          useValue: userStatsRepository,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validateUser', () => {

    it('debe retornar null con contraseña incorrecta', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(false);
      usersService.findOneByEmail.mockResolvedValueOnce(mockUser);

      const result = await service.validateUser(
        'test@example.com',
        'wrongpassword',
      );

      expect(result).toBeNull();
    });

    it('debe retornar null si usuario no existe', async () => {
      usersService.findOneByEmail.mockResolvedValueOnce(null);

      const result = await service.validateUser(
        'nonexistent@example.com',
        'password123',
      );

      expect(result).toBeNull();
    });

    it('debe lanzar BadRequestException si usuario es LIBRERO_PENDIENTE', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      usersService.findOneByEmail.mockResolvedValue(mockLibreroPendienteUser);

      await expect(
        service.validateUser('librero@example.com', 'password123'),
      ).rejects.toThrow(
        'Tu cuenta de librería está pendiente de aprobación por el administrador.',
      );
    });

    it('debe lanzar BadRequestException si usuario está inactivo', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      usersService.findOneByEmail.mockResolvedValue(mockInactiveUser);

      await expect(
        service.validateUser('test@example.com', 'password123'),
      ).rejects.toThrow('Esta cuenta ha sido desactivada.');
    });

    it('debe retornar usuario sin la propiedad password cuando las credenciales son correctas', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(true);
      usersService.findOneByEmail.mockResolvedValueOnce(mockUser);

      const result = await service.validateUser('test@example.com', 'password123');

      expect(result).not.toHaveProperty('password');
      expect(result?.email).toBe(mockUser.email);
    });
  });

  describe('register', () => {
    it('debe registrar un nuevo usuario y crear stats iniciales', async () => {
      const registerDto = {
        email: 'newuser@example.com',
        password: 'password123',
        fullName: 'New User',
        province: 'Madrid',
        role: UserRole.USER,
      };

      const newUser = { ...mockUser, ...registerDto };

      (bcrypt.hash as jest.Mock).mockResolvedValueOnce('hashed_password');
      usersService.findOneByEmail.mockResolvedValueOnce(null);
      userRepository.create.mockReturnValueOnce(newUser);
      userRepository.save.mockResolvedValueOnce(newUser);
      userStatsRepository.create.mockReturnValueOnce({});
      userStatsRepository.save.mockResolvedValueOnce({});

      const result = await service.register(registerDto);

      expect(usersService.findOneByEmail).toHaveBeenCalledWith(
        registerDto.email,
      );
      expect(bcrypt.hash).toHaveBeenCalledWith(registerDto.password, 10);
      expect(userRepository.create).toHaveBeenCalled();
      expect(userRepository.save).toHaveBeenCalled();
      expect(userStatsRepository.create).toHaveBeenCalled();
      expect(userStatsRepository.save).toHaveBeenCalled();
    });

    it('debe lanzar BadRequestException si email ya existe', async () => {
      const registerDto = {
        email: 'test@example.com',
        password: 'password123',
        fullName: 'Duplicate User',
        province: 'Madrid',
        role: UserRole.USER,
      };

      usersService.findOneByEmail.mockResolvedValue(mockUser);

      await expect(service.register(registerDto)).rejects.toThrow(
        'El correo electrónico ya está registrado',
      );
    });

    it('debe crear usuario con isActive=false para LIBRERO', async () => {
      const librerDto = {
        email: 'librero@example.com',
        password: 'password123',
        fullName: 'Librero User',
        province: 'Madrid',
        role: UserRole.LIBRERO,
      };

      const newUser = { ...mockUser, ...librerDto };

      (bcrypt.hash as jest.Mock).mockResolvedValueOnce('hashed_password');
      usersService.findOneByEmail.mockResolvedValueOnce(null);
      userRepository.create.mockReturnValueOnce(newUser);
      userRepository.save.mockResolvedValueOnce(newUser);
      userStatsRepository.create.mockReturnValueOnce({});
      userStatsRepository.save.mockResolvedValueOnce({});

      await service.register(librerDto);

      const createCall = userRepository.create.mock.calls[0][0];
      expect(createCall.isActive).toBe(false);
    });

    it('debe retornar el usuario sin la contraseña después de registrar', async () => {
      const registerDto = {
        email: 'another@example.com',
        password: 'password123',
        fullName: 'Another User',
        province: 'Madrid',
        role: UserRole.USER,
      };

      const savedUser = { ...mockUser, email: registerDto.email, password: 'hashed_pw' };

      (bcrypt.hash as jest.Mock).mockResolvedValueOnce('hashed_pw');
      usersService.findOneByEmail.mockResolvedValueOnce(null);
      userRepository.create.mockReturnValueOnce(savedUser);
      userRepository.save.mockResolvedValueOnce(savedUser);
      userStatsRepository.create.mockReturnValueOnce({});
      userStatsRepository.save.mockResolvedValueOnce({});

      const result = await service.register(registerDto as any);

      expect(result).not.toHaveProperty('password');
      expect(result.email).toBe(registerDto.email);
    });
  });

  describe('login', () => {
    it('debe retornar token JWT y usuario', () => {
      const userWithoutPassword = {
        id: mockUser.id,
        email: mockUser.email,
        fullName: mockUser.fullName,
        role: mockUser.role,
        isActive: mockUser.isActive,
      };

      jwtService.sign.mockReturnValueOnce('jwt-token-123');

      const result = service.login(userWithoutPassword as any);

      expect(jwtService.sign).toHaveBeenCalledWith({
        email: userWithoutPassword.email,
        sub: userWithoutPassword.id,
        role: userWithoutPassword.role,
      });
      expect(result.access_token).toBe('jwt-token-123');
      expect(result.user).toEqual(userWithoutPassword);
    });
  });

  describe('forgotPassword', () => {
    it('debe generar token y enviar email de recuperación', async () => {
      const mockTransporter = {
        sendMail: jest.fn().mockResolvedValueOnce({}),
      };

      (nodemailer.createTransport as jest.Mock).mockReturnValueOnce(
        mockTransporter,
      );
      (uuid.v4 as jest.Mock).mockReturnValueOnce('uuid-token');
      userRepository.findOne.mockResolvedValueOnce(mockUser);
      userRepository.save.mockResolvedValueOnce({
        ...mockUser,
        resetPasswordToken: 'uuid-token',
        resetPasswordExpires: new Date(Date.now() + 3600000),
      });
      configService.get.mockReturnValue('email@gmail.com');

      const result = await service.forgotPassword('test@example.com');

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
      expect(userRepository.save).toHaveBeenCalled();
      expect(mockTransporter.sendMail).toHaveBeenCalled();
      expect(result.message).toBe('Correo enviado correctamente');
    });

    it('debe lanzar NotFoundException si email no está registrado', async () => {
      userRepository.findOne.mockResolvedValueOnce(null);

      await expect(service.forgotPassword('unknown@example.com')).rejects.toThrow(
        'El correo no está registrado',
      );
    });

    it('debe incluir token en email de recuperación', async () => {
      const mockTransporter = {
        sendMail: jest.fn().mockResolvedValueOnce({}),
      };

      const mockToken = 'specific-uuid-token';

      (nodemailer.createTransport as jest.Mock).mockReturnValueOnce(
        mockTransporter,
      );
      (uuid.v4 as jest.Mock).mockReturnValueOnce(mockToken);
      userRepository.findOne.mockResolvedValueOnce(mockUser);
      userRepository.save.mockResolvedValueOnce({
        ...mockUser,
        resetPasswordToken: mockToken,
        resetPasswordExpires: new Date(Date.now() + 3600000),
      });
      configService.get.mockReturnValue('test@gmail.com');

      await service.forgotPassword('test@example.com');

      const emailCall = mockTransporter.sendMail.mock.calls[0][0];
      expect(emailCall.html).toContain(mockToken);
      expect(emailCall.to).toBe('test@example.com');
    });
  });

  describe('resetPassword', () => {
    it('debe actualizar contraseña con token válido', async () => {
      const futureDate = new Date(Date.now() + 3600000);
      const userWithToken = {
        ...mockUser,
        resetPasswordToken: 'valid-token',
        resetPasswordExpires: futureDate,
      };

      (bcrypt.hash as jest.Mock).mockResolvedValueOnce('new_hashed_password');
      userRepository.findOne.mockResolvedValueOnce(userWithToken);
      userRepository.save.mockResolvedValueOnce({
        ...userWithToken,
        password: 'new_hashed_password',
        resetPasswordToken: null,
        resetPasswordExpires: null,
      });

      const result = await service.resetPassword('valid-token', 'newpassword123');

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { resetPasswordToken: 'valid-token' },
      });
      expect(bcrypt.hash).toHaveBeenCalledWith('newpassword123', 10);
      expect(userRepository.save).toHaveBeenCalled();
      expect(result.message).toBe('Contraseña actualizada con éxito');
    });

    it('debe lanzar BadRequestException si token es inválido', async () => {
      userRepository.findOne.mockResolvedValueOnce(null);

      await expect(
        service.resetPassword('invalid-token', 'newpassword123'),
      ).rejects.toThrow('El enlace es inválido o ha caducado');
    });

    it('debe lanzar BadRequestException si token ha expirado', async () => {
      const pastDate = new Date(Date.now() - 3600000);
      const expiredUser = {
        ...mockUser,
        resetPasswordToken: 'expired-token',
        resetPasswordExpires: pastDate,
      };

      userRepository.findOne.mockResolvedValueOnce(expiredUser);

      await expect(
        service.resetPassword('expired-token', 'newpassword123'),
      ).rejects.toThrow('El enlace es inválido o ha caducado');
    });

    it('debe limpiar token y expiration después de reset', async () => {
      const futureDate = new Date(Date.now() + 3600000);
      const userWithToken = {
        ...mockUser,
        resetPasswordToken: 'valid-token',
        resetPasswordExpires: futureDate,
      };

      (bcrypt.hash as jest.Mock).mockResolvedValueOnce('new_hashed_password');
      userRepository.findOne.mockResolvedValueOnce(userWithToken);
      userRepository.save.mockResolvedValueOnce({});

      await service.resetPassword('valid-token', 'newpassword123');

      const saveCall = userRepository.save.mock.calls[0][0];
      expect(saveCall.resetPasswordToken).toBeNull();
      expect(saveCall.resetPasswordExpires).toBeNull();
    });
  });

  describe('sendNotificationEmail', () => {
    it('debe enviar email de notificación', async () => {
      const mockTransporter = {
        sendMail: jest.fn().mockResolvedValueOnce({}),
      };

      (nodemailer.createTransport as jest.Mock).mockReturnValueOnce(
        mockTransporter,
      );
      configService.get.mockReturnValue('email@gmail.com');

      await service.sendNotificationEmail(
        'user@example.com',
        'Test Subject',
        'Test message content',
      );

      expect(nodemailer.createTransport).toHaveBeenCalled();
      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: '"BookMark Team" <noreply@bookmark.com>',
        to: 'user@example.com',
        subject: 'Test Subject',
        html: expect.stringContaining('Test message content'),
      });
    });

    it('debe incluir el mensaje personalizado en el email', async () => {
      const mockTransporter = {
        sendMail: jest.fn().mockResolvedValueOnce({}),
      };

      (nodemailer.createTransport as jest.Mock).mockReturnValueOnce(
        mockTransporter,
      );
      configService.get.mockReturnValue('email@gmail.com');

      const customMessage = 'Tu librería ha sido aprobada';

      await service.sendNotificationEmail(
        'librero@example.com',
        'Aprobación de Librería',
        customMessage,
      );

      const emailCall = mockTransporter.sendMail.mock.calls[0][0];
      expect(emailCall.html).toContain(customMessage);
      expect(emailCall.to).toBe('librero@example.com');
      expect(emailCall.subject).toBe('Aprobación de Librería');
    });
  });

  describe('JWT Payload', () => {
    it('debe incluir email, id y role en JWT payload', () => {
      const user = {
        id: 'user-456',
        email: 'custom@example.com',
        role: UserRole.LIBRERO,
      };

      jwtService.sign.mockReturnValueOnce('custom-token');

      service.login(user as any);

      expect(jwtService.sign).toHaveBeenCalledWith({
        email: 'custom@example.com',
        sub: 'user-456',
        role: UserRole.LIBRERO,
      });
    });
  });

  describe('Password hashing', () => {
    it('debe hashear contraseña en register', async () => {
      const registerDto = {
        email: 'test@example.com',
        password: 'plaintext_password',
        fullName: 'Test User',
        province: 'Madrid',
        role: UserRole.USER,
      };

      (bcrypt.hash as jest.Mock).mockResolvedValueOnce('hashed_result');
      usersService.findOneByEmail.mockResolvedValueOnce(null);
      userRepository.create.mockReturnValueOnce({});
      userRepository.save.mockResolvedValueOnce({});
      userStatsRepository.create.mockReturnValueOnce({});
      userStatsRepository.save.mockResolvedValueOnce({});

      await service.register(registerDto);

      expect(bcrypt.hash).toHaveBeenCalledWith('plaintext_password', 10);
    });

    it('debe hashear contraseña en resetPassword', async () => {
      const futureDate = new Date(Date.now() + 3600000);
      const userWithToken = {
        ...mockUser,
        resetPasswordToken: 'valid-token',
        resetPasswordExpires: futureDate,
      };

      (bcrypt.hash as jest.Mock).mockResolvedValueOnce('new_hashed_result');
      userRepository.findOne.mockResolvedValueOnce(userWithToken);
      userRepository.save.mockResolvedValueOnce({});

      await service.resetPassword('valid-token', 'newpassword');

      expect(bcrypt.hash).toHaveBeenCalledWith('newpassword', 10);
    });
  });

  describe('User stats creation', () => {
    it('debe crear stats iniciales con valores correctos', async () => {
      const registerDto = {
        email: 'test@example.com',
        password: 'password123',
        fullName: 'Test User',
        province: 'Madrid',
        role: UserRole.USER,
      };

      (bcrypt.hash as jest.Mock).mockResolvedValueOnce('hashed_password');
      usersService.findOneByEmail.mockResolvedValueOnce(null);
      userRepository.create.mockReturnValueOnce({});
      userRepository.save.mockResolvedValueOnce({ id: 'user-123' });
      userStatsRepository.create.mockReturnValueOnce({});
      userStatsRepository.save.mockResolvedValueOnce({});

      await service.register(registerDto);

      const statsCall = userStatsRepository.create.mock.calls[0][0];
      expect(statsCall.xp).toBe(0);
      expect(statsCall.level).toBe(1);
      expect(statsCall.totalBooksFinished).toBe(0);
      expect(statsCall.currentStreak).toBe(0);
    });
  });
});

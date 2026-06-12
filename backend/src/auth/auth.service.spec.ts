import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as nodemailer from 'nodemailer';
import { v4 as uuidv4 } from 'uuid';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { User, UserRole } from '../users/entities/user.entity';
import { UserStats } from '../users/entities/user-stats.entity';
import { Repository } from 'typeorm';

jest.mock('bcrypt');
jest.mock('nodemailer');
jest.mock('uuid', () => ({
  v4: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let jwtService: jest.Mocked<JwtService>;
  let configService: jest.Mocked<ConfigService>;
  let userRepository: jest.Mocked<Repository<User>>;
  let userStatsRepository: jest.Mocked<Repository<UserStats>>;

  const createMockUser = (overrides: Partial<User> = {}): User =>
    ({
      id: 'user-123',
      email: 'test@example.com',
      password: 'hashed_password',
      fullName: 'Test User',
      role: UserRole.USER,
      isActive: true,
      followers: [],
      following: [],
      ...overrides,
    }) as User;

  beforeEach(async () => {
    userRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
    } as any;

    userStatsRepository = {
      create: jest.fn(),
      save: jest.fn(),
    } as any;

    usersService = {
      findOneByEmail: jest.fn(),
      create: jest.fn(),
    } as any;

    jwtService = {
      sign: jest.fn(),
    } as any;

    configService = {
      get: jest.fn(),
      getOrThrow: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
        { provide: ConfigService, useValue: configService },
        { provide: getRepositoryToken(User), useValue: userRepository },
        { provide: getRepositoryToken(UserStats), useValue: userStatsRepository },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // =========================
  // VALIDATE USER
  // =========================
  describe('validateUser', () => {
    it('debe retornar null con contraseña incorrecta', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(false);
      usersService.findOneByEmail.mockResolvedValueOnce(createMockUser());

      const result = await service.validateUser(
        'test@example.com',
        'wrongpassword',
      );

      expect(result).toBeNull();
    });

    it('debe retornar null si usuario no existe', async () => {
      usersService.findOneByEmail.mockResolvedValueOnce(null);

      const result = await service.validateUser(
        'notfound@example.com',
        'password',
      );

      expect(result).toBeNull();
    });

    it('debe lanzar error si LIBRERO_PENDIENTE', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(true);

      usersService.findOneByEmail.mockResolvedValueOnce(
        createMockUser({ role: UserRole.LIBRERO_PENDIENTE }),
      );

      await expect(
        service.validateUser('lib@example.com', 'pass'),
      ).rejects.toThrow(
        'Tu cuenta de librería está pendiente de aprobación por el administrador.',
      );
    });

    it('debe lanzar error si usuario inactivo', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(true);

      usersService.findOneByEmail.mockResolvedValueOnce(
        createMockUser({ isActive: false }),
      );

      await expect(
        service.validateUser('test@example.com', 'pass'),
      ).rejects.toThrow('Esta cuenta ha sido desactivada.');
    });

    it('debe devolver usuario sin password', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(true);

      const user = createMockUser();

      usersService.findOneByEmail.mockResolvedValueOnce(user);

      const result = await service.validateUser('test@example.com', 'pass');

      expect(result).not.toHaveProperty('password');
      expect(result?.email).toBe(user.email);
    });
  });

  // =========================
  // REGISTER
  // =========================
  describe('register', () => {
    it('debe registrar usuario y crear stats', async () => {
      const dto = {
        email: 'new@example.com',
        password: '123456',
        fullName: 'User',
        province: 'Madrid',
        role: UserRole.USER,
      };

      (bcrypt.hash as jest.Mock).mockResolvedValueOnce('hashed_pw');

      usersService.findOneByEmail.mockResolvedValueOnce(null);

      userRepository.create.mockReturnValue(createMockUser());
      userRepository.save.mockResolvedValue(createMockUser());

      userStatsRepository.create.mockReturnValue({
        xp: 0,
        level: 1,
        totalBooksFinished: 0,
        currentStreak: 0,
      } as UserStats);

      userStatsRepository.save.mockResolvedValue({} as UserStats);

      const result = await service.register(dto);

      expect(bcrypt.hash).toHaveBeenCalledWith('123456', 10);
      expect(userRepository.create).toHaveBeenCalled();
      expect(userStatsRepository.create).toHaveBeenCalled();
      expect(result).not.toHaveProperty('password');
    });

    it('debe lanzar error si email existe', async () => {
      usersService.findOneByEmail.mockResolvedValueOnce(
        createMockUser(),
      );

      await expect(
        service.register({
          email: 'test@example.com',
          password: '123',
          fullName: 'Test',
          province: 'Madrid',
          role: UserRole.USER,
        }),
      ).rejects.toThrow('El correo electrónico ya está registrado');
    });

    it('LIBRERO debe ser inactivo por defecto', async () => {
      (bcrypt.hash as jest.Mock).mockResolvedValueOnce('hashed');

      usersService.findOneByEmail.mockResolvedValueOnce(null);

      const savedUser = createMockUser({ role: UserRole.LIBRERO });

      userRepository.create.mockReturnValue(savedUser);
      userRepository.save.mockResolvedValue(savedUser);

      userStatsRepository.create.mockReturnValue({} as UserStats);
      userStatsRepository.save.mockResolvedValue({} as UserStats);

      await service.register({
        email: 'lib@example.com',
        password: '123',
        fullName: 'Lib',
        province: 'Madrid',
        role: UserRole.LIBRERO,
      });

      const createCall = userRepository.create.mock.calls[0][0];
      expect(createCall.isActive).toBe(false);
    });
  });

  // =========================
  // LOGIN
  // =========================
  describe('login', () => {
    it('debe generar token', () => {
      const user = createMockUser();

      jwtService.sign.mockReturnValue('token');

      const result = service.login(user);

      expect(result.access_token).toBe('token');
      expect(jwtService.sign).toHaveBeenCalled();
    });
  });

  // =========================
  // FORGOT PASSWORD
  // =========================
  describe('forgotPassword', () => {
    it('debe enviar email', async () => {
      const transporter = {
        sendMail: jest.fn().mockResolvedValue({}),
      };

      (nodemailer.createTransport as jest.Mock).mockReturnValue(transporter);

      (uuidv4 as jest.Mock).mockReturnValue('token-123');

      userRepository.findOne.mockResolvedValue(createMockUser());

      userRepository.save.mockResolvedValue(createMockUser());

      configService.getOrThrow.mockReturnValue('test@mail.com');

      const result = await service.forgotPassword('test@example.com');

      expect(result.message).toBe('Correo enviado correctamente');
      expect(transporter.sendMail).toHaveBeenCalled();
    });

    it('debe lanzar error si no existe usuario', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(
        service.forgotPassword('no@exists.com'),
      ).rejects.toThrow('El correo no está registrado');
    });
  });

  // =========================
  // RESET PASSWORD
  // =========================
  describe('resetPassword', () => {
    it('debe resetear password', async () => {
      const user = createMockUser({
        resetPasswordToken: 'token',
        resetPasswordExpires: new Date(Date.now() + 10000),
      });

      userRepository.findOne.mockResolvedValue(user);

      (bcrypt.hash as jest.Mock).mockResolvedValue('new_hash');

      userRepository.save.mockResolvedValue(user);

      const result = await service.resetPassword('token', 'newpass');

      expect(result.message).toBe('Contraseña actualizada con éxito');
    });

    it('debe fallar si token inválido', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(
        service.resetPassword('bad', 'pass'),
      ).rejects.toThrow('El enlace es inválido o ha caducado');
    });
  });

  // =========================
  // NOTIFICATIONS
  // =========================
  describe('sendNotificationEmail', () => {
    it('debe enviar email', async () => {
      const transporter = {
        sendMail: jest.fn().mockResolvedValue({}),
      };

      (nodemailer.createTransport as jest.Mock).mockReturnValue(transporter);

      configService.getOrThrow.mockReturnValue('mail@test.com');

      await service.sendNotificationEmail(
        'user@test.com',
        'Subject',
        'Message',
      );

      expect(transporter.sendMail).toHaveBeenCalled();
    });
  });
});
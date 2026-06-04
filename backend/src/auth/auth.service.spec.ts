import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as nodemailer from 'nodemailer';
import * as uuid from 'uuid';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { User, UserRole } from '../users/entities/user.entity';
import { UserStats } from '../users/entities/user-stats.entity';
import { Repository } from 'typeorm';

jest.mock('bcrypt');
jest.mock('nodemailer');
jest.mock('uuid');

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
    } as unknown as jest.Mocked<Repository<User>>;

    userStatsRepository = {
      create: jest.fn(),
      save: jest.fn(),
    } as unknown as jest.Mocked<Repository<UserStats>>;

    usersService = {
      findOneByEmail: jest.fn(),
      create: jest.fn(),
    } as unknown as jest.Mocked<UsersService>;

    jwtService = { sign: jest.fn() } as unknown as jest.Mocked<JwtService>;
    configService = { get: jest.fn() } as unknown as jest.Mocked<ConfigService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
        { provide: ConfigService, useValue: configService },
        { provide: getRepositoryToken(User), useValue: userRepository },
        {
          provide: getRepositoryToken(UserStats),
          useValue: userStatsRepository,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

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
        'nonexistent@example.com',
        'password123',
      );

      expect(result).toBeNull();
    });

    it('debe lanzar BadRequestException si usuario es LIBRERO_PENDIENTE', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      usersService.findOneByEmail.mockResolvedValue(
        createMockUser({ role: UserRole.LIBRERO_PENDIENTE }),
      );

      await expect(
        service.validateUser('librero@example.com', 'password123'),
      ).rejects.toThrow(
        'Tu cuenta de librería está pendiente de aprobación por el administrador.',
      );
    });

    it('debe lanzar BadRequestException si usuario está inactivo', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      usersService.findOneByEmail.mockResolvedValue(
        createMockUser({ isActive: false }),
      );

      await expect(
        service.validateUser('test@example.com', 'password123'),
      ).rejects.toThrow('Esta cuenta ha sido desactivada.');
    });

    it('debe retornar usuario sin la propiedad password cuando las credenciales son correctas', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(true);
      const user = createMockUser({ email: 'test@example.com' });

      usersService.findOneByEmail.mockResolvedValueOnce(user);
      const result = await service.validateUser(
        'test@example.com',
        'password123',
      );

      expect(result).not.toHaveProperty('password');
      expect(result?.email).toBe(user.email);
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

      const mockStats: Partial<UserStats> = {
        xp: 0,
        level: 1,
        totalBooksFinished: 0,
        currentStreak: 0,
      };

      (bcrypt.hash as jest.Mock).mockResolvedValueOnce('hashed_password');
      usersService.findOneByEmail.mockResolvedValueOnce(null);
      userRepository.create.mockReturnValueOnce(createMockUser());
      userRepository.save.mockResolvedValueOnce(createMockUser());
      userStatsRepository.create.mockReturnValueOnce(mockStats as UserStats);
      userStatsRepository.save.mockResolvedValueOnce(mockStats as UserStats);

      await service.register(registerDto);

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

      usersService.findOneByEmail.mockResolvedValue(createMockUser());

      await expect(service.register(registerDto)).rejects.toThrow(
        'El correo electrónico ya está registrado',
      );
    });

    it('debe crear usuario con isActive=false para LIBRERO', async () => {
      const libreroDto = {
        email: 'librero@example.com',
        password: 'password123',
        fullName: 'Librero User',
        province: 'Madrid',
        role: UserRole.LIBRERO,
      };

      const newUser = createMockUser({
        ...libreroDto,
      });

      (bcrypt.hash as jest.Mock).mockResolvedValueOnce('hashed_password');
      usersService.findOneByEmail.mockResolvedValueOnce(null);
      userRepository.create.mockReturnValueOnce(newUser);
      userRepository.save.mockResolvedValueOnce(newUser);
      userStatsRepository.create.mockReturnValue({
        xp: 0,
        level: 1,
      } as UserStats);
      userStatsRepository.save.mockResolvedValue({
        xp: 0,
        level: 1,
      } as UserStats);

      await service.register(libreroDto);

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

      const savedUser = createMockUser({
        email: registerDto.email,
        password: 'hashed_pw',
      });

      (bcrypt.hash as jest.Mock).mockResolvedValueOnce('hashed_pw');
      usersService.findOneByEmail.mockResolvedValueOnce(null);
      userRepository.create.mockReturnValue(savedUser);
      userRepository.save.mockResolvedValue(savedUser);
      const mockStats: Partial<UserStats> = { xp: 0, level: 1 };
      userStatsRepository.create.mockReturnValue(mockStats as UserStats);
      userStatsRepository.save.mockResolvedValue(mockStats as UserStats);

      const result = await service.register(registerDto);

      expect(result).not.toHaveProperty('password');
      expect(result.email).toBe(registerDto.email);
    });
  });

  describe('login', () => {
    it('debe retornar token JWT y usuario', () => {
      const user = createMockUser();
      const userWithoutPassword = { ...user };
      delete (userWithoutPassword as any).password;
      const resultPayload = userWithoutPassword as unknown as Omit<
        User,
        'password'
      >;

      jwtService.sign.mockReturnValue('jwt-token-123');

      const result = service.login(resultPayload);

      expect(result.access_token).toBe('jwt-token-123');
      expect(result.user).toEqual(resultPayload);
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

      const userWithToken = createMockUser({ email: 'test@example.com' });
      userWithToken.resetPasswordToken = 'uuid-token';
      userWithToken.resetPasswordExpires = new Date(Date.now() + 3600000);

      userRepository.findOne.mockResolvedValueOnce(
        createMockUser({ email: 'test@example.com' }),
      );
      userRepository.save.mockResolvedValueOnce(userWithToken);
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

      await expect(
        service.forgotPassword('unknown@example.com'),
      ).rejects.toThrow('El correo no está registrado');
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

      const userWithToken = createMockUser({ email: 'test@example.com' });

      Object.assign(userWithToken, {
        resetPasswordToken: mockToken,
        resetPasswordExpires: new Date(Date.now() + 3600000),
      });

      userRepository.findOne.mockResolvedValueOnce(
        createMockUser({ email: 'test@example.com' }),
      );
      userRepository.save.mockResolvedValueOnce(userWithToken);
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
      const userWithToken = createMockUser();
      userWithToken.resetPasswordToken = 'valid-token';
      userWithToken.resetPasswordExpires = futureDate;

      (bcrypt.hash as jest.Mock).mockResolvedValueOnce('new_hashed_password');
      userRepository.findOne.mockResolvedValueOnce(userWithToken);

      const savedUser = { ...userWithToken, password: 'new_hashed_password' };
      savedUser.resetPasswordToken = null;
      savedUser.resetPasswordExpires = null;

      userRepository.save.mockResolvedValueOnce(savedUser as User);

      const result = await service.resetPassword(
        'valid-token',
        'newpassword123',
      );

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { resetPasswordToken: 'valid-token' },
      });
      expect(bcrypt.hash).toHaveBeenCalledWith('newpassword123', 10);
      expect(userRepository.save).toHaveBeenCalledWith(savedUser);
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
      const expiredUser = createMockUser();
      expiredUser.resetPasswordToken = 'expired-token';
      expiredUser.resetPasswordExpires = pastDate;
      userRepository.findOne.mockResolvedValueOnce(expiredUser);

      await expect(
        service.resetPassword('expired-token', 'newpassword123'),
      ).rejects.toThrow('El enlace es inválido o ha caducado');
    });

    it('debe limpiar token y expiration después de reset', async () => {
      const futureDate = new Date(Date.now() + 3600000);
      const baseUser = createMockUser({
        resetPasswordToken: 'valid-token',
        resetPasswordExpires: futureDate,
      });

      (bcrypt.hash as jest.Mock).mockResolvedValueOnce('new_hashed_password');
      userRepository.findOne.mockResolvedValueOnce(baseUser);
      userRepository.save.mockResolvedValueOnce(baseUser);

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
      configService.getOrThrow = jest.fn().mockReturnValue('email@gmail.com');

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
      configService.getOrThrow = jest.fn().mockReturnValue('email@gmail.com');
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
      const user: Omit<User, 'password' | 'followers' | 'following'> = {
        id: 'user-456',
        email: 'custom@example.com',
        role: UserRole.LIBRERO,
      } as Omit<User, 'password'>;

      jwtService.sign.mockReturnValueOnce('custom-token');

      service.login(user as Omit<User, 'password'>);

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

      const newUser = createMockUser(registerDto);
      const mockStats: Partial<UserStats> = { xp: 0, level: 1 };

      (bcrypt.hash as jest.Mock).mockResolvedValueOnce('hashed_result');
      usersService.findOneByEmail.mockResolvedValueOnce(null);

      userRepository.create.mockReturnValue(newUser);
      userRepository.save.mockResolvedValue(newUser);

      userStatsRepository.create.mockReturnValue(mockStats as UserStats);
      userStatsRepository.save.mockResolvedValue(mockStats as UserStats);

      await service.register(registerDto);

      expect(bcrypt.hash).toHaveBeenCalledWith('plaintext_password', 10);
    });

    it('debe hashear contraseña en resetPassword', async () => {
      const futureDate = new Date(Date.now() + 3600000);
      const userWithToken = createMockUser({
        resetPasswordToken: 'valid-token',
        resetPasswordExpires: futureDate,
      });

      (bcrypt.hash as jest.Mock).mockResolvedValueOnce('new_hashed_result');
      userRepository.findOne.mockResolvedValueOnce(userWithToken);
      userWithToken.password = 'new_hashed_password';
      userRepository.save.mockResolvedValueOnce(userWithToken);

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

      const newUser = createMockUser({ email: registerDto.email });

      (bcrypt.hash as jest.Mock).mockResolvedValueOnce('hashed_password');
      usersService.findOneByEmail.mockResolvedValueOnce(null);
      userRepository.create.mockReturnValue(newUser);
      userRepository.save.mockResolvedValue(newUser);

      const initialStats: Partial<UserStats> = {
        xp: 0,
        level: 1,
        totalBooksFinished: 0,
        currentStreak: 0,
      };

      userStatsRepository.create.mockReturnValue(initialStats as UserStats);
      userStatsRepository.save.mockResolvedValue(initialStats as UserStats);

      await service.register(registerDto);
      const statsCall = userStatsRepository.create.mock.calls[0][0];

      expect(statsCall.xp).toBe(0);
      expect(statsCall.level).toBe(1);
      expect(statsCall.totalBooksFinished).toBe(0);
      expect(statsCall.currentStreak).toBe(0);
    });
  });
});

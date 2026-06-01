import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { generateLicenseFilename } from './auth.controller';
import { multerFilenameCallback } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { UnauthorizedException } from '@nestjs/common';
import { UserRole } from '../users/entities/user.entity';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;
  let usersService: jest.Mocked<UsersService>;

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

  const mockFile = {
    path: './uploads/licencias/file.pdf',
    originalname: 'document.pdf',
  } as Express.Multer.File;

  beforeEach(async () => {
    authService = {
      validateUser: jest.fn(),
      login: jest.fn(),
      forgotPassword: jest.fn(),
      resetPassword: jest.fn(),
    } as any;

    usersService = {
      create: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: authService,
        },
        {
          provide: UsersService,
          useValue: usersService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /register', () => {
    it('debe registrar un usuario con documento', async () => {
      const registerDto = {
        email: 'newuser@example.com',
        password: 'password123',
        fullName: 'New User',
        province: 'Madrid',
        role: UserRole.USER,
      };

      usersService.create.mockResolvedValueOnce(mockUser);

      const result = await controller.register(registerDto, mockFile);

      expect(usersService.create).toHaveBeenCalledWith(registerDto);
      expect(result).toEqual(mockUser);
    });

    it('debe registrar un usuario sin documento', async () => {
      const registerDto = {
        email: 'newuser@example.com',
        password: 'password123',
        fullName: 'New User',
        province: 'Madrid',
        role: UserRole.USER,
      };

      usersService.create.mockResolvedValueOnce(mockUser);

      const result = await controller.register(registerDto, undefined as any);

      expect(usersService.create).toHaveBeenCalledWith(registerDto);
      expect(result).toEqual(mockUser);
    });
  });

  describe('POST /login', () => {
    it('debe retornar token y usuario con credenciales válidas', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      const mockResponse = {
        access_token: 'jwt-token',
        user: mockUser,
      };

      authService.validateUser.mockResolvedValueOnce(mockUser);
      authService.login.mockReturnValueOnce(mockResponse);

      const result = await controller.login(loginDto);

      expect(authService.validateUser).toHaveBeenCalledWith(
        loginDto.email,
        loginDto.password,
      );
      expect(authService.login).toHaveBeenCalledWith(mockUser);
      expect(result).toEqual(mockResponse);
    });

    it('debe lanzar UnauthorizedException con credenciales inválidas', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      authService.validateUser.mockResolvedValueOnce(null);

      await expect(controller.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(controller.login(loginDto)).rejects.toThrow(
        'Credenciales inválidas',
      );
    });
  });

  describe('POST /forgot-password', () => {
    it('debe enviar correo de recuperación', async () => {
      const mockResponse = { message: 'Correo enviado correctamente' };
      authService.forgotPassword.mockResolvedValueOnce(mockResponse);

      const result = await controller.forgotPassword('test@example.com');

      expect(authService.forgotPassword).toHaveBeenCalledWith(
        'test@example.com',
      );
      expect(result).toEqual(mockResponse);
    });

    it('debe manejar email no registrado', async () => {
      authService.forgotPassword.mockRejectedValueOnce(
        new Error('El correo no está registrado'),
      );

      await expect(controller.forgotPassword('unknown@example.com')).rejects.toThrow(
        'El correo no está registrado',
      );
    });
  });

  describe('POST /reset-password', () => {
    it('debe resetear contraseña con token válido', async () => {
      const body = {
        token: 'valid-token',
        newPass: 'newpassword123',
      };

      const mockResponse = { message: 'Contraseña actualizada con éxito' };
      authService.resetPassword.mockResolvedValueOnce(mockResponse);

      const result = await controller.resetPassword(body);

      expect(authService.resetPassword).toHaveBeenCalledWith(
        body.token,
        body.newPass,
      );
      expect(result).toEqual(mockResponse);
    });

    it('debe manejar token inválido', async () => {
      const body = {
        token: 'invalid-token',
        newPass: 'newpassword123',
      };

      authService.resetPassword.mockRejectedValueOnce(
        new Error('El enlace es inválido o ha caducado'),
      );

      await expect(controller.resetPassword(body)).rejects.toThrow(
        'El enlace es inválido o ha caducado',
      );
    });

    it('debe manejar token expirado', async () => {
      const body = {
        token: 'expired-token',
        newPass: 'newpassword123',
      };

      authService.resetPassword.mockRejectedValueOnce(
        new Error('El enlace es inválido o ha caducado'),
      );

      await expect(controller.resetPassword(body)).rejects.toThrow(
        'El enlace es inválido o ha caducado',
      );
    });
  });

  describe('filename generator', () => {
    it('genera un nombre único con la extensión correcta', () => {
      const file = { originalname: 'document.pdf' } as Express.Multer.File;
      const name = generateLicenseFilename(file);
      expect(name).toMatch(/^[0-9]+-[0-9]+\.pdf$/);
    });

    it('invoca el callback de multer y devuelve el nombre generado', () => {
      const file = { originalname: 'doc.pdf' } as Express.Multer.File;
      const cb = jest.fn();
      const fn = multerFilenameCallback();
      fn({}, file, cb);
      expect(cb).toHaveBeenCalledWith(null, expect.stringMatching(/\.pdf$/));
    });
  });
});

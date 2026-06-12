import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import {
  generateLicenseFilename,
  multerFilenameCallback,
} from './auth.controller';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { UnauthorizedException } from '@nestjs/common';
import { User, UserRole } from '../users/entities/user.entity';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;
  let usersService: jest.Mocked<UsersService>;
  let cloudinaryService: jest.Mocked<CloudinaryService>;

  const mockUser: User = {
    id: 'user-123',
    email: 'test@example.com',
    password: 'hashed_password',
    role: UserRole.USER,
  } as User;

  const mockFile: Express.Multer.File = {
    fieldname: 'document',
    originalname: 'document.pdf',
    encoding: '7bit',
    mimetype: 'application/pdf',
    size: 1234,
    destination: '',
    filename: 'document.pdf',
    path: '',
    buffer: Buffer.from('pdf-content'),
    stream: {} as any,
  };

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

    cloudinaryService = {
      uploadFile: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: UsersService, useValue: usersService },
        { provide: CloudinaryService, useValue: cloudinaryService },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // =========================
  // REGISTER
  // =========================
  describe('POST /register', () => {
    it('debe registrar un usuario con documento', async () => {
      const registerDto = {
        email: 'newuser@example.com',
        password: 'password123',
        fullName: 'New User',
        province: 'Madrid',
        role: UserRole.USER,
      };

      cloudinaryService.uploadFile.mockResolvedValue({
        secure_url: 'http://cloudinary.com/file.pdf',
        resource_type: 'raw',
        public_id: 'abc',
      } as any);

      usersService.create.mockResolvedValueOnce(mockUser);

      const result = await controller.register(registerDto, mockFile);

      expect(cloudinaryService.uploadFile).toHaveBeenCalledWith(
        mockFile,
        'licencias',
      );

      expect(usersService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          ...registerDto,
          document: 'http://cloudinary.com/file.pdf',
        }),
      );

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

      const result = await controller.register(
        registerDto,
        undefined as unknown as Express.Multer.File,
      );

      expect(cloudinaryService.uploadFile).not.toHaveBeenCalled();
      expect(usersService.create).toHaveBeenCalledWith(registerDto);
      expect(result).toEqual(mockUser);
    });
  });

  // =========================
  // LOGIN
  // =========================
  describe('POST /login', () => {
    it('debe retornar token con credenciales válidas', async () => {
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
    });
  });

  // =========================
  // FORGOT PASSWORD
  // =========================
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

      await expect(
        controller.forgotPassword('unknown@example.com'),
      ).rejects.toThrow('El correo no está registrado');
    });
  });

  // =========================
  // RESET PASSWORD
  // =========================
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
  });

  // =========================
  // HELPERS
  // =========================
  describe('filename generator', () => {
    it('genera un nombre único con extensión correcta', () => {
      const file = {
        originalname: 'document.pdf',
      } as Express.Multer.File;

      const name = generateLicenseFilename(file);

      expect(name).toMatch(/^\d+-[a-f0-9]{32}\.pdf$/);
    });

    it('invoca callback de multer correctamente', () => {
      const file = {
        originalname: 'doc.pdf',
      } as Express.Multer.File;

      const cb = jest.fn();

      const fn = multerFilenameCallback();
      fn({}, file, cb);

      expect(cb).toHaveBeenCalledWith(
        null,
        expect.stringMatching(/\.pdf$/),
      );
    });
  });
});
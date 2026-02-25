import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';

describe('AuthController', () => {
  let controller: AuthController;

  const mockAuthService = { 
    validateUser: jest.fn().mockResolvedValue({ id: '1' }),
    login: jest.fn().mockResolvedValue({ access_token: 'token' }) 
  };
  const mockUsersService = { create: jest.fn().mockResolvedValue({ id: '1' }) };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: UsersService, useValue: mockUsersService },
      ],
    }).compile();
    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should register a new user', async () => {
    const dto = { email: 'new@test.com', password: 'password123', fullName: 'New' }; // NOSONAR
    const result = await controller.register(dto);
    expect(result).toBeDefined();
    expect(mockUsersService.create).toHaveBeenCalled();
  });

  it('should throw UnauthorizedException on failed login', async () => {
    mockAuthService.validateUser.mockResolvedValue(null);
    const dto = { email: 'wrong@test.com', password: 'wrong' }; // NOSONAR
    await expect(controller.login(dto)).rejects.toThrow('Credenciales inválidas');
  });

  it('should login successfully', async () => {
    mockAuthService.validateUser.mockResolvedValue({ id: '1', email: 'test@test.com' });
    const loginDto = { email: 'test@test.com', password: 'password123' }; // NOSONAR
    
    const result = await controller.login(loginDto);
    expect(result).toEqual({ access_token: 'token' });
    expect(mockAuthService.login).toHaveBeenCalled();
  });
});
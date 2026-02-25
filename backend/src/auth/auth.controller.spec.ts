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

  it('should throw UnauthorizedException if login fails', async () => {
    mockAuthService.validateUser.mockResolvedValue(null);
    const loginDto = { email: 'wrong@test.com', password: 'wrongPassword' }; // NOSONAR
    
    await expect(controller.login(loginDto)).rejects.toThrow('Credenciales inválidas');
  });
});
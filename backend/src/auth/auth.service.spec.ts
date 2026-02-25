import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';

// Mockeamos bcrypt antes de los tests
jest.mock('bcrypt', () => ({
  compare: jest.fn().mockResolvedValue(true),
}));

describe('AuthService', () => {
  let service: AuthService;

  const mockUser = { id: 'uuid', email: 'test@test.com', password: 'non-secret-mock-value' }; // NOSONAR
  const mockUsersService = { findOneByEmail: jest.fn().mockResolvedValue(mockUser) };
  const mockJwtService = { sign: jest.fn().mockReturnValue('mockToken') };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();
    service = module.get<AuthService>(AuthService);
  });

  it('should validate user correctly', async () => {
    const result = await service.validateUser('test@test.com', 'password123'); // NOSONAR
    expect(result).not.toBeNull();
    expect(result!.email).toBe(mockUser.email);
  });

  it('should return access token on login', () => {
    const result = service.login(mockUser);
    expect(result.access_token).toBe('mockToken');
  });

  it('should return null if validation fails', async () => {
    // Usamos el mock definido arriba para que devuelva false
    const bcrypt = require('bcrypt');
    jest.spyOn(bcrypt, 'compare').mockResolvedValue(false);
    
    const result = await service.validateUser('test@test.com', 'wrong'); // NOSONAR
    expect(result).toBeNull();
  });
});
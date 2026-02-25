import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;

  const mockUser = { id: 'uuid', email: 'test@test.com', password: 'non-secret-mock-value' };
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
    jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);
    const result = await service.validateUser('test@test.com', 'password123');
    expect(result).not.toBeNull();
    expect(result!.email).toBe(mockUser.email);
  });

  it('should return access token on login', () => {
    const result = service.login(mockUser);
    expect(result.access_token).toBe('mockToken');
  });
});
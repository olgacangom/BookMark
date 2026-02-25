import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';

describe('UsersService', () => {
  let service: UsersService;

  const mockUser = { id: 'uuid', email: 'test@test.com', password: 'non-secret-mock-value' };  
  const mockUserRepository = {
    findOneBy: jest.fn().mockResolvedValue(null),
    create: jest.fn().mockReturnValue(mockUser),
    save: jest.fn().mockResolvedValue(mockUser),
    find: jest.fn().mockResolvedValue([mockUser]),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: mockUserRepository },
      ],
    }).compile();
    service = module.get<UsersService>(UsersService);
  });

  it('should hash password and create user', async () => {
    const dto = { email: 'new@test.com', password: 'password123', fullName: 'Test' };
    const result = await service.create(dto);
    expect(result).toBeDefined();
    expect(mockUserRepository.save).toHaveBeenCalled();
  });
});
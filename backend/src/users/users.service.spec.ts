import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';

describe('UsersService', () => {
  let service: UsersService;

  const mockUser = { id: 'uuid', email: 'test@test.com', password: 'non-secret-mock-value' };  // NOSONAR
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
    const dto = { email: 'new@test.com', password: 'password123', fullName: 'Test' }; //NOSONAR
    const result = await service.create(dto);
    expect(result).toBeDefined();
    expect(mockUserRepository.save).toHaveBeenCalled();
  });

  it('should return all users', async () => {
    const result = await service.findAll();
    expect(result).toEqual([mockUser]);
    expect(mockUserRepository.find).toHaveBeenCalled();
  });

  it('should find one user by email', async () => {
    mockUserRepository.findOneBy.mockResolvedValue(mockUser);
    const result = await service.findOneByEmail('test@test.com');
    expect(result).toEqual(mockUser);
  });

  it('should update a user', async () => {
    mockUserRepository.save.mockResolvedValue({ ...mockUser, fullName: 'Updated Name' });
    const result = await service.update('uuid', { fullName: 'Updated Name' });
    expect(result.fullName).toEqual('Updated Name');
  });

  it('should remove a user', async () => {
    mockUserRepository.findOneBy.mockResolvedValue(mockUser);
    mockUserRepository.save.mockResolvedValue({ ...mockUser, isActive: false });
    const result = await service.remove('uuid');
    expect(result).toBeDefined();
  });
});
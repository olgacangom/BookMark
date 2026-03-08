import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import {
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';

describe('UsersService', () => {
  let service: UsersService;

  const mockUser = {
    id: 'uuid',
    email: 'test@test.com',
    password: 'hash',
    isPublic: true,
    bio: 'My bio',
  }; // NOSONAR

  const mockUserRepository = {
    findOneBy: jest.fn(),
    create: jest.fn().mockReturnValue(mockUser),
    save: jest.fn().mockResolvedValue(mockUser),
    find: jest.fn().mockResolvedValue([mockUser]),
    preload: jest.fn(),
    remove: jest.fn().mockResolvedValue(mockUser),
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

  it('should throw BadRequestException if email exists', async () => {
    mockUserRepository.findOneBy.mockResolvedValue(mockUser);
    const dto = { email: 'test@test.com', password: '123', fullName: 'Test' }; // NOSONAR
    await expect(service.create(dto)).rejects.toThrow(BadRequestException);
  });

  it('should throw NotFoundException in findOne if user missing', async () => {
    mockUserRepository.findOneBy.mockResolvedValue(null);
    await expect(service.findOne('any-id')).rejects.toThrow(NotFoundException);
  });

  it('should update user successfully', async () => {
    mockUserRepository.preload.mockResolvedValue(mockUser);
    const result = await service.update('uuid', { fullName: 'New' });
    expect(result).toBeDefined();
  });

  it('should throw NotFoundException in update if user missing', async () => {
    mockUserRepository.preload.mockResolvedValue(null);
    await expect(service.update('uuid', { fullName: 'New' })).rejects.toThrow(
      NotFoundException,
    );
  });

  it('should remove user successfully', async () => {
    mockUserRepository.findOneBy.mockResolvedValue(mockUser);
    const result = await service.remove('uuid');
    expect(result).toBeDefined();
  });

  it('should find one user by email', async () => {
    mockUserRepository.findOneBy.mockResolvedValue(mockUser);
    const result = await service.findOneByEmail('test@test.com');
    expect(result).toEqual(mockUser);
    expect(mockUserRepository.findOneBy).toHaveBeenCalledWith({
      email: 'test@test.com',
    });
  });

  it('should return all users', async () => {
    const result = await service.findAll();
    expect(result).toEqual([mockUser]);
    expect(mockUserRepository.find).toHaveBeenCalled();
  });

  it('should return profile if user is public (findOneProfile)', async () => {
    mockUserRepository.findOneBy.mockResolvedValue({
      ...mockUser,
      isPublic: true,
    });
    const result = await service.findOneProfile('uuid', 'visitor-uuid');
    expect(result).toBeDefined();
  });

  it('should return profile if user is private but owner (findOneProfile)', async () => {
    mockUserRepository.findOneBy.mockResolvedValue({
      ...mockUser,
      isPublic: false,
    });
    const result = await service.findOneProfile('uuid', 'uuid');
    expect(result).toBeDefined();
  });

  it('should throw ForbiddenException if user is private and not owner (findOneProfile)', async () => {
    mockUserRepository.findOneBy.mockResolvedValue({
      ...mockUser,
      isPublic: false,
    });
    await expect(service.findOneProfile('uuid', 'other-uuid')).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('should throw ForbiddenException in getPublicProfile if user is private', async () => {
    mockUserRepository.findOneBy.mockResolvedValue({
      ...mockUser,
      isPublic: false,
    });
    await expect(service.getPublicProfile('uuid')).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('should return data in getPublicProfile if user is public', async () => {
    mockUserRepository.findOneBy.mockResolvedValue({
      ...mockUser,
      isPublic: true,
    });
    const result = await service.getPublicProfile('uuid');
    expect(result).toBeDefined();
    expect(result).not.toHaveProperty('password');
  });

  it('should create a new user successfully', async () => {
    mockUserRepository.findOneBy.mockResolvedValue(null);

    const dto = {
      email: 'nuevo@test.com',
      password: '123',
      fullName: 'Nuevo Usuario',
    };

    const result = await service.create(dto);

    expect(result).toBeDefined();
    expect(result).not.toHaveProperty('password');
    expect(mockUserRepository.save).toHaveBeenCalled();
  });
});

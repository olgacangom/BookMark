import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersController', () => {
  let controller: UsersController;
  const mockUsersService = {
    create: jest.fn().mockResolvedValue({ id: '1' }),
    findAll: jest.fn().mockResolvedValue([]),
    findOne: jest.fn().mockResolvedValue({ id: '1' }),
    update: jest.fn().mockResolvedValue({ id: '1' }),
    remove: jest.fn().mockResolvedValue({ deleted: true }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: mockUsersService }],
    }).compile();
    controller = module.get<UsersController>(UsersController);
  });

  it('should cover all CRUD endpoints', async () => {
    const dto = { email: 'test@test.com', password: '123', fullName: 'Test' }; // NOSONAR
    expect(await controller.create(dto)).toBeDefined();
    expect(await controller.findAll()).toEqual([]);
    expect(await controller.findOne('1')).toBeDefined();
    expect(await controller.update('1', { fullName: 'Updated' })).toBeDefined();
    expect(await controller.remove('1')).toBeDefined();
  });

  it('should update user profile including bio and privacy', async () => {
    const updateDto = { 
      bio: 'Nueva bio profesional', 
      isPublic: false 
    };
    
    const result = await controller.update('uuid-1', updateDto);
    expect(result).toBeDefined();
    expect(mockUsersService.update).toHaveBeenCalledWith('uuid-1', updateDto);
  });
});
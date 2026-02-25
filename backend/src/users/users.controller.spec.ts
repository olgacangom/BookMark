import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersController', () => {
  let controller: UsersController;

  const mockUsersService = {
    create: jest.fn().mockResolvedValue({ id: '1', email: 'test@test.com' }),
    findAll: jest.fn().mockResolvedValue([]),
    findOne: jest.fn().mockResolvedValue({ id: '1', email: 'test@test.com' }),
    remove: jest.fn().mockResolvedValue({ deleted: true }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        { provide: UsersService, useValue: mockUsersService },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
  it('should create a user', async () => {
    const dto = { email: 'test@test.com', password: 'password123', fullName: 'Test' }; // NOSONAR
    expect(await controller.create(dto)).toEqual({ id: '1', email: 'test@test.com' });
  });

  it('should find all users', async () => {
    expect(await controller.findAll()).toEqual([]);
  });

  it('should delete a user', async () => {
    expect(await controller.remove('1')).toEqual({ deleted: true });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

interface RequestWithUser {
  user: {
    id: string;
    email: string;
  };
}

describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;

  const mockUsersService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService);
  });

  it('should be defined and have the service injected', () => {
    expect(controller).toBeDefined();
    expect(service).toBeDefined();
  });

  describe('CRUD Operations', () => {
    it('should call create', async () => {
      const dto: CreateUserDto = { email: 'test@test.com', password: '123', fullName: 'Test' };
      mockUsersService.create.mockResolvedValue({ id: '1', ...dto });
      expect(await controller.create(dto)).toBeDefined();
    });

    it('should call findAll', async () => {
      mockUsersService.findAll.mockResolvedValue([]);
      expect(await controller.findAll()).toEqual([]);
    });

    it('should call findOne', async () => {
      mockUsersService.findOne.mockResolvedValue({ id: '1' });
      expect(await controller.findOne('1')).toBeDefined();
    });

    it('should call update with id and dto', async () => {
      const id = 'uuid-test';
      const updateDto: UpdateUserDto = { fullName: 'Olga Modificado', bio: 'Nueva Bio' };
      const expectedResponse = { id, ...updateDto };

      mockUsersService.update.mockResolvedValue(expectedResponse);

      const result = await controller.update(id, updateDto);

      expect(result).toEqual(expectedResponse);
      expect(mockUsersService.update).toHaveBeenCalledWith(id, updateDto);
    });

    it('should call remove ', async () => {
      mockUsersService.remove.mockResolvedValue({ deleted: true });
      expect(await controller.remove('1')).toBeDefined();
    });
  });

  describe('updateProfile', () => {
    it('should update the profile of the authenticated user', async () => {
      const mockReq: RequestWithUser = { 
        user: { id: 'uuid-auth', email: 'auth@test.com' } 
      };
      const dto: UpdateUserDto = { fullName: 'Perfil Editado' };

      mockUsersService.update.mockResolvedValue({ id: 'uuid-auth', ...dto });

      const result = await controller.updateProfile(mockReq as unknown as RequestWithUser, dto);

      expect(result).toBeDefined();
      expect(mockUsersService.update).toHaveBeenCalledWith('uuid-auth', dto);
    });
  });
});
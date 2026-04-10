import { Test, TestingModule } from '@nestjs/testing';
import { GamificationListener } from './gamification.listener';
import { UsersService } from './users.service';
import { Badge } from './badge.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { jest, describe, it, expect, beforeEach } from '@jest/globals';

type MockType<T> = {
  [P in keyof T]?: jest.Mock<any>;
};

describe('GamificationListener', () => {
  let listener: GamificationListener;
  let usersService: MockType<UsersService>;
  let badgeRepository: MockType<Repository<Badge>>;

  const mockPayload = { userId: 'user-123', points: 50 };

  const mockUser = {
    id: 'user-123',
    fullName: 'Olguí Test',
    stats: { totalBooksFinished: 5, xp: 100 },
    badges: [{ id: 1 }],
  };

  const mockBadges = [
    {
      id: 1,
      name: 'Primer Libro',
      requirementType: 'BOOKS_READ',
      requirementValue: 1,
    },
    {
      id: 2,
      name: 'Lector Experto',
      requirementType: 'BOOKS_READ',
      requirementValue: 5,
    },
    {
      id: 3,
      name: 'Socio de Honor',
      requirementType: 'XP_REACHED',
      requirementValue: 1000,
    },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GamificationListener,
        {
          provide: UsersService,
          useValue: {
            addExperience: jest.fn(),
            updateStreak: jest.fn(),
            findOne: jest.fn(),
            assignBadge: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Badge),
          useValue: {
            find: jest.fn(),
          },
        },
      ],
    }).compile();

    listener = module.get<GamificationListener>(GamificationListener);
    usersService = module.get(UsersService);
    badgeRepository = module.get(getRepositoryToken(Badge));

    usersService.findOne?.mockResolvedValue(mockUser);
    badgeRepository.find?.mockResolvedValue(mockBadges);

    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('debe procesar el evento, añadir XP y actualizar racha', async () => {
    await listener.handleBookFinished(mockPayload);

    expect(usersService.addExperience).toHaveBeenCalledWith('user-123', 50);
    expect(usersService.updateStreak).toHaveBeenCalledWith('user-123');
  });

  it('debe asignar una medalla si el usuario cumple requisitos y NO la tiene', async () => {
    await listener.handleBookFinished(mockPayload);

    expect(usersService.assignBadge).toHaveBeenCalledWith('user-123', 2);
    expect(usersService.assignBadge).not.toHaveBeenCalledWith('user-123', 1);
  });

  it('debe manejar correctamente cuando user.stats o user.badges son undefined (cobertura de || 0 y || [])', async () => {
    usersService.findOne?.mockResolvedValue({
      id: 'user-123',
      fullName: 'User Sin Stats',
      stats: undefined,
      badges: undefined,
    });

    await listener.handleBookFinished(mockPayload);

    expect(usersService.assignBadge).not.toHaveBeenCalled();
  });

  it('debe ignorar medallas que no son de tipo BOOKS_READ', async () => {
    await listener.handleBookFinished(mockPayload);
    expect(usersService.assignBadge).not.toHaveBeenCalledWith('user-123', 3);
  });

  it('debe capturar y loguear errores en el bloque catch', async () => {
    const errorSpy = jest.spyOn(console, 'error');
    usersService.addExperience?.mockRejectedValue(new Error('DB Error'));

    await listener.handleBookFinished(mockPayload);

    expect(errorSpy).toHaveBeenCalledWith(
      '❌ Error en GamificationListener:',
      expect.any(Error),
    );
  });

  it('no debe asignar medalla si el conteo de libros es insuficiente', async () => {
    usersService.findOne?.mockResolvedValue({
      ...mockUser,
      stats: { totalBooksFinished: 1, xp: 100 },
      badges: [],
    });

    await listener.handleBookFinished(mockPayload);

    expect(usersService.assignBadge).not.toHaveBeenCalledWith('user-123', 2);
  });
});

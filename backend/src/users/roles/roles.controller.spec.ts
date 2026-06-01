import { Test, TestingModule } from '@nestjs/testing';
import { AdminController, LibreroController } from './roles.controller';
import { AdminService } from './admin.service';
import { LibrerosService } from './libreros.service';
import { User } from '../entities/user.entity';
import { LibraryEvent } from '../entities/library-event.entity';

describe('Roles Controllers', () => {
  let adminController: AdminController;
  let libreroController: LibreroController;

  let adminService: any;
  let librerosService: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminController, LibreroController],
      providers: [
        {
          provide: AdminService,
          useValue: {
            getAllUsersWithBookCount: jest.fn().mockResolvedValue([]),
            getGlobalStats: jest.fn().mockResolvedValue({}),
            getMonthlyUserGrowth: jest.fn().mockResolvedValue([]),
            getMainStats: jest.fn().mockResolvedValue({ total: 1 }),
            findAllLibreros: jest.fn().mockResolvedValue([]),
            approveLibrero: jest.fn().mockResolvedValue({ ok: true }),
            rejectLibrero: jest.fn().mockResolvedValue({ ok: true }),
            toggleUserStatus: jest.fn().mockResolvedValue({ status: 'ok' }),
          },
        },
        {
          provide: LibrerosService,
          useValue: {
            getMyInventory: jest.fn().mockResolvedValue([]),
            addToInventory: jest.fn().mockResolvedValue({ id: 'inv' }),
            updateInventoryItem: jest.fn().mockResolvedValue({ id: 'inv' }),
            removeFromInventory: jest.fn().mockResolvedValue(undefined),
            getStats: jest.fn().mockResolvedValue({ total: 1 }),
            updateProfile: jest.fn().mockResolvedValue({ id: 'u1' }),

            findStoresByBook: jest.fn().mockResolvedValue([]),

            getMyEvents: jest.fn().mockResolvedValue([]),
            createEvent: jest.fn().mockResolvedValue({ id: 'e1' }),
            updateEvent: jest.fn().mockResolvedValue({ id: 'e1' }),
            deleteEvent: jest.fn().mockResolvedValue(undefined),
            getAllFutureEvents: jest.fn().mockResolvedValue([]),
            joinEvent: jest.fn().mockResolvedValue({ id: 'r1' }),
            getEventAttendees: jest.fn().mockResolvedValue([]),
          },
        },
      ],
    }).compile();

    adminController = module.get(AdminController);
    libreroController = module.get(LibreroController);

    adminService = module.get(AdminService);
    librerosService = module.get(LibrerosService);
  });

  /* =========================================================
   * ADMIN CONTROLLER
   * ========================================================= */

  it('should get users list', async () => {
    await adminController.getUsersList();
    expect(adminService.getAllUsersWithBookCount).toHaveBeenCalled();
  });

  it('should get global stats', async () => {
    await adminController.getGlobalStats();
    expect(adminService.getGlobalStats).toHaveBeenCalled();
  });

  it('should get monthly growth', async () => {
    await adminController.getMonthlyGrowth();
    expect(adminService.getMonthlyUserGrowth).toHaveBeenCalled();
  });

  it('should get app stats', async () => {
    const res = await adminController.getAppStats();
    expect(adminService.getMainStats).toHaveBeenCalled();
    expect(res).toEqual({ total: 1 });
  });

  it('should get all libreros', () => {
    adminController.getAllLibreros();
    expect(adminService.findAllLibreros).toHaveBeenCalled();
  });

  it('should verify librero', () => {
    adminController.verifyLibrero('123');
    expect(adminService.approveLibrero).toHaveBeenCalledWith('123');
  });

  it('should reject librero', () => {
    adminController.rejectLibrero('123');
    expect(adminService.rejectLibrero).toHaveBeenCalledWith('123');
  });

  it('should toggle user status', () => {
    adminController.toggleUserStatus('123');
    expect(adminService.toggleUserStatus).toHaveBeenCalledWith('123');
  });

  /* =========================================================
   * LIBRERO CONTROLLER
   * ========================================================= */

  const req = { user: { id: 'u1' } } as any;

  it('should get my inventory', async () => {
    await libreroController.getMyInventory(req);
    expect(librerosService.getMyInventory).toHaveBeenCalledWith('u1');
  });

  it('should add book to inventory', async () => {
    await libreroController.addBook('b1', { price: 10, inStock: true }, req);

    expect(librerosService.addToInventory).toHaveBeenCalledWith(
      'u1',
      'b1',
      { price: 10, inStock: true },
    );
  });

  it('should update inventory item', async () => {
    await libreroController.updateInventory('inv1', { price: 20, inStock: false }, req);

    expect(librerosService.updateInventoryItem).toHaveBeenCalledWith(
      'u1',
      'inv1',
      { price: 20, inStock: false },
    );
  });

  it('should remove book', async () => {
    await libreroController.removeBook('inv1', req);

    expect(librerosService.removeFromInventory).toHaveBeenCalledWith(
      'u1',
      'inv1',
    );
  });

  it('should return catalog message', () => {
    const res = libreroController.updateCatalog();
    expect(res).toEqual({
      message: 'Lógica de catálogo masivo pendiente',
    });
  });

  it('should get stats', async () => {
    await libreroController.getStats(req);
    expect(librerosService.getStats).toHaveBeenCalledWith('u1');
  });

  it('should update profile', async () => {
    await libreroController.updateProfile(req, {
      libraryPhone: '123',
    });

    expect(librerosService.updateProfile).toHaveBeenCalledWith('u1', {
      libraryPhone: '123',
    });
  });

  it('should find stores by book', async () => {
    await libreroController.findStores('b1');
    expect(librerosService.findStoresByBook).toHaveBeenCalledWith('b1');
  });

  it('should get my events', async () => {
    await libreroController.getMyEvents(req);
    expect(librerosService.getMyEvents).toHaveBeenCalledWith('u1');
  });

  it('should create event', async () => {
    await libreroController.createEvent(req, { title: 'event' } as LibraryEvent);

    expect(librerosService.createEvent).toHaveBeenCalledWith('u1', {
      title: 'event',
    });
  });

  it('should update event', async () => {
    await libreroController.updateEvent(req, 'e1', { title: 'x' });

    expect(librerosService.updateEvent).toHaveBeenCalledWith(
      'u1',
      'e1',
      { title: 'x' },
    );
  });

  it('should delete event', async () => {
    await libreroController.deleteEvent(req, 'e1');

    expect(librerosService.deleteEvent).toHaveBeenCalledWith('u1', 'e1');
  });

  it('should get all events', async () => {
    await libreroController.getAllEvents();

    expect(librerosService.getAllFutureEvents).toHaveBeenCalled();
  });

  it('should join event', async () => {
    await libreroController.joinEvent('e1', req);

    expect(librerosService.joinEvent).toHaveBeenCalledWith('u1', 'e1');
  });

  it('should get attendees', async () => {
    await libreroController.getAttendees('e1', req);

    expect(librerosService.getEventAttendees).toHaveBeenCalledWith('u1', 'e1');
  });
});
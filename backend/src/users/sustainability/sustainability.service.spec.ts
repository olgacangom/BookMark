import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  SustainabilityService,
  CreateListingDto,
} from './sustainability.service';
import {
  BookListing,
  ListingType,
  BookCondition,
} from '../entities/book-listing.entity';
import { DonationPoint } from '../entities/donation-point.entity';
import { SustainabilityRequest } from '../entities/sustainability-request.entity';
import { UsersService } from '../users.service';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

describe('SustainabilityService', () => {
  let service: SustainabilityService;

  const repoFactory = () => ({
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn(),
    manager: {
      findOne: jest.fn(),
    },
  });

  const listingRepo = repoFactory();
  const donationRepo = repoFactory();
  const requestRepo = repoFactory();

  const usersService = {
    getFollowingIds: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SustainabilityService,
        { provide: getRepositoryToken(BookListing), useValue: listingRepo },
        { provide: getRepositoryToken(DonationPoint), useValue: donationRepo },
        {
          provide: getRepositoryToken(SustainabilityRequest),
          useValue: requestRepo,
        },
        { provide: UsersService, useValue: usersService },
      ],
    }).compile();

    service = module.get(SustainabilityService);

    jest.clearAllMocks();
  });

  // ---------------- CREATE LISTING ----------------
  it('createListing should create and save listing', async () => {
    const dto: CreateListingDto = {
      type: ListingType.SALE,
      condition: BookCondition.GOOD,
      price: 10,
      bookId: 1,
    };

    listingRepo.create.mockReturnValue({ id: '1' });
    listingRepo.save.mockResolvedValue({ id: '1' });

    const result = await service.createListing('u1', dto);

    expect(listingRepo.create).toHaveBeenCalled();
    expect(listingRepo.save).toHaveBeenCalled();
    expect(result).toEqual({ id: '1' });
  });

  // ---------------- FIND ALL LISTINGS ----------------
  it('findAllListings without type', async () => {
    const qb: any = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([{ id: 1 }]),
    };

    listingRepo.createQueryBuilder.mockReturnValue(qb);

    const result = await service.findAllListings();

    expect(result).toEqual([{ id: 1 }]);
  });

  it('findAllListings with type', async () => {
    const qb: any = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([{ id: 1 }]),
    };

    listingRepo.createQueryBuilder.mockReturnValue(qb);

    const result = await service.findAllListings(ListingType.SALE);

    expect(qb.andWhere).toHaveBeenCalled();
    expect(result).toEqual([{ id: 1 }]);
  });

  // ---------------- MY LISTINGS ----------------
  it('findMyListings should return user listings', async () => {
    listingRepo.find.mockResolvedValue([{ id: 1 }]);

    const result = await service.findMyListings('u1');

    expect(listingRepo.find).toHaveBeenCalled();
    expect(result).toEqual([{ id: 1 }]);
  });

  // ---------------- UPDATE LISTING ----------------
  it('updateListing throws if not found', async () => {
    listingRepo.findOne.mockResolvedValue(null);

    await expect(service.updateListing('u1', 'l1', {})).rejects.toThrow(
      NotFoundException,
    );
  });

  it('updateListing updates fields', async () => {
    const listing = {
      id: 'l1',
      type: ListingType.SALE,
      condition: BookCondition.GOOD,
      price: 10,
    };

    listingRepo.findOne.mockResolvedValue(listing);
    listingRepo.save.mockResolvedValue({ ...listing, price: 20 });

    const result = await service.updateListing('u1', 'l1', {
      price: 20,
      description: 'desc',
    });

    expect(result.price).toBe(20);
  });

  // ---------------- DELETE LISTING ----------------
  it('deleteListing not found', async () => {
    listingRepo.findOne.mockResolvedValue(null);

    await expect(service.deleteListing('u1', 'l1')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('deleteListing forbidden', async () => {
    listingRepo.findOne.mockResolvedValue({
      id: 'l1',
      user: { id: 'other' },
    });

    await expect(service.deleteListing('u1', 'l1')).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('deleteListing success', async () => {
    const listing = { id: 'l1', user: { id: 'u1' } };

    listingRepo.findOne.mockResolvedValue(listing);
    listingRepo.remove.mockResolvedValue(listing);

    const result = await service.deleteListing('u1', 'l1');

    expect(result).toEqual(listing);
  });

  // ---------------- TOGGLE ----------------
  it('toggleAvailability not found', async () => {
    listingRepo.findOne.mockResolvedValue(null);

    await expect(service.toggleAvailability('u1', 'l1')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('toggleAvailability flips value', async () => {
    const listing = { id: 'l1', isAvailable: true };

    listingRepo.findOne.mockResolvedValue(listing);
    listingRepo.save.mockResolvedValue({ ...listing, isAvailable: false });

    const result = await service.toggleAvailability('u1', 'l1');

    expect(result.isAvailable).toBe(false);
  });

  // ---------------- DONATION POINTS ----------------
  it('findAllDonationPoints', async () => {
    donationRepo.find.mockResolvedValue([{ id: 1 }]);

    const result = await service.findAllDonationPoints();

    expect(result).toEqual([{ id: 1 }]);
  });

  // ---------------- CREATE REQUEST ----------------
  it('createRequest listing not found', async () => {
    listingRepo.findOne.mockResolvedValue(null);

    await expect(service.createRequest('u1', 'l1')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('createRequest own listing forbidden', async () => {
    listingRepo.findOne.mockResolvedValue({
      id: 'l1',
      user: { id: 'u1' },
    });

    await expect(service.createRequest('u1', 'l1')).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('createRequest duplicate forbidden', async () => {
    listingRepo.findOne.mockResolvedValue({
      id: 'l1',
      user: { id: 'u2' },
    });

    requestRepo.findOne.mockResolvedValue({ id: 'r1' });

    await expect(service.createRequest('u1', 'l1')).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('createRequest success', async () => {
    listingRepo.findOne.mockResolvedValue({
      id: 'l1',
      user: { id: 'u2' },
    });

    requestRepo.findOne.mockResolvedValue(null);
    requestRepo.create.mockReturnValue({ id: 'r1' });
    requestRepo.save.mockResolvedValue({ id: 'r1' });

    const result = await service.createRequest('u1', 'l1');

    expect(result).toEqual({ id: 'r1' });
  });

  // ---------------- CANCEL REQUEST ----------------
  it('cancelRequest not found', async () => {
    requestRepo.findOne.mockResolvedValue(null);

    await expect(service.cancelRequest('u1', 'l1')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('cancelRequest success', async () => {
    const req = { id: 'r1' };

    requestRepo.findOne.mockResolvedValue(req);
    requestRepo.remove.mockResolvedValue(req);

    const result = await service.cancelRequest('u1', 'l1');

    expect(result).toEqual(req);
  });

  // ---------------- MARK RETURNED ----------------
  it('markAsReturned forbidden', async () => {
    requestRepo.findOne.mockResolvedValue(null);

    await expect(service.markAsReturned('u1', 'r1')).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('markAsReturned success', async () => {
    const request = {
      id: 'r1',
      listing: { id: 'l1', user: { id: 'u1' } },
    };

    requestRepo.findOne.mockResolvedValue(request);
    listingRepo.update.mockResolvedValue({});
    requestRepo.save.mockResolvedValue({ ...request, status: 'completed' });

    const result = await service.markAsReturned('u1', 'r1');

    expect(result.status).toBe('completed');
  });

  // ---------------- MARK DONATED ----------------
  it('markAsDonated not found', async () => {
    listingRepo.findOne.mockResolvedValue(null);

    await expect(service.markAsDonated('u1', 'l1')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('markAsDonated success', async () => {
    listingRepo.findOne.mockResolvedValue({
      id: 'l1',
      user: { id: 'u1' },
    });

    listingRepo.save.mockResolvedValue({});

    const result = await service.markAsDonated('u1', 'l1');

    expect(result.message).toBe('Libro donado con éxito');
  });

  // ---------------- SOCIAL LISTINGS ----------------
  it('getSocialListings empty follows', async () => {
    usersService.getFollowingIds.mockResolvedValue([]);

    const result = await service.getSocialListings('u1');

    expect(result).toEqual([]);
  });

  it('getSocialListings returns listings', async () => {
    usersService.getFollowingIds.mockResolvedValue(['u2']);

    listingRepo.find.mockResolvedValue([{ id: 1 }]);

    const result = await service.getSocialListings('u1');

    expect(result).toEqual([{ id: 1 }]);
  });

  it('getUserRequests should filter and map requests with isOwner flag', async () => {
    const userId = 'u1';

    const requests = [
      {
        id: 'r1',
        listing: {
          user: { id: 'u1' },
          book: {},
        },
        requester: { id: 'u2' },
      },
      {
        id: 'r2',
        listing: {
          user: { id: 'u2' },
          book: {},
        },
        requester: { id: 'u1' },
      },
      {
        id: 'r3',
        listing: {
          user: { id: 'u2' },
          book: {},
        },
        requester: { id: 'u3' },
      },
    ];

    requestRepo.find.mockResolvedValue(requests);

    const result = await service.getUserRequests(userId);

    expect(result).toHaveLength(2);

    const r1 = result.find((r) => r.id === 'r1');
    const r2 = result.find((r) => r.id === 'r2');

    expect(r1?.isOwner).toBe(true);
    expect(r2?.isOwner).toBe(false);
  });

  it('updateRequestStatus should throw NotFoundException', async () => {
    requestRepo.findOne.mockResolvedValue(null);

    await expect(
      service.updateRequestStatus('u1', 'r1', 'accepted'),
    ).rejects.toThrow(NotFoundException);
  });

  it('updateRequestStatus should throw ForbiddenException when user is not owner', async () => {
    requestRepo.findOne.mockResolvedValue({
      id: 'r1',
      listing: {
        id: 'l1',
        user: { id: 'other' },
      },
    });

    await expect(
      service.updateRequestStatus('u1', 'r1', 'accepted'),
    ).rejects.toThrow(ForbiddenException);
  });

  it('updateRequestStatus should accept request and update listing', async () => {
    requestRepo.findOne.mockResolvedValue({
      id: 'r1',
      listing: {
        id: 'l1',
        user: { id: 'u1' },
      },
    });

    listingRepo.update.mockResolvedValue({ affected: 1 });
    requestRepo.save.mockResolvedValue({
      id: 'r1',
      status: 'accepted',
    });

    const result = await service.updateRequestStatus('u1', 'r1', 'accepted');

    expect(listingRepo.update).toHaveBeenCalledWith('l1', {
      isAvailable: false,
    });

    expect(result.status).toBe('accepted');
  });

  it('updateRequestStatus should reject request without updating listing', async () => {
    requestRepo.findOne.mockResolvedValue({
      id: 'r1',
      listing: {
        id: 'l1',
        user: { id: 'u1' },
      },
    });

    requestRepo.save.mockResolvedValue({
      id: 'r1',
      status: 'rejected',
    });

    const result = await service.updateRequestStatus('u1', 'r1', 'rejected');

    expect(listingRepo.update).not.toHaveBeenCalled();
    expect(result.status).toBe('rejected');
  });

  it('findByBookId should return empty array if book does not exist', async () => {
    listingRepo.manager.findOne.mockResolvedValue(null);

    const result = await service.findByBookId(1);

    expect(result).toEqual([]);
  });

  it('findByBookId should return listings when book exists', async () => {
    listingRepo.manager.findOne.mockResolvedValue({
      id: 1,
      title: 'Libro',
      author: 'Autor',
    });

    const listings = [{ id: 'l1' }];

    listingRepo.find.mockResolvedValue(listings);

    const result = await service.findByBookId(1);

    expect(listingRepo.find).toHaveBeenCalledWith({
      where: {
        book: {
          title: 'Libro',
          author: 'Autor',
        },
        isAvailable: true,
      },
      relations: ['user', 'book'],
    });

    expect(result).toEqual(listings);
  });
});

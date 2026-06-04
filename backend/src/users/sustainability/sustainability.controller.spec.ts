import { Test, TestingModule } from '@nestjs/testing';
import { SustainabilityController } from './sustainability.controller';
import {
  SustainabilityService,
  CreateListingDto,
} from './sustainability.service';
import { ListingType, BookCondition } from '../entities/book-listing.entity';
import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';

interface UserPayload {
  id: string;
  email?: string;
}

interface RequestWithUser extends Request {
  user: UserPayload;
}

describe('SustainabilityController', () => {
  let controller: SustainabilityController;
  let mockService: jest.Mocked<SustainabilityService>;

  const mockReq: RequestWithUser = {
    user: { id: 'u1' },
  } as RequestWithUser;

  beforeEach(async () => {
    const serviceMock = {
      findAllListings: jest.fn<SustainabilityService['findAllListings']>(),
      getSocialListings: jest.fn<SustainabilityService['getSocialListings']>(),
      findAllDonationPoints:
        jest.fn<SustainabilityService['findAllDonationPoints']>(),
      findByBookId: jest.fn<SustainabilityService['findByBookId']>(),
      createListing: jest.fn<SustainabilityService['createListing']>(),
      findMyListings: jest.fn<SustainabilityService['findMyListings']>(),
      markAsDonated: jest.fn<SustainabilityService['markAsDonated']>(),
      updateListing: jest.fn<SustainabilityService['updateListing']>(),
      deleteListing: jest.fn<SustainabilityService['deleteListing']>(),
      createRequest: jest.fn<SustainabilityService['createRequest']>(),
      getUserRequests: jest.fn<SustainabilityService['getUserRequests']>(),
      updateRequestStatus:
        jest.fn<SustainabilityService['updateRequestStatus']>(),
      markAsReturned: jest.fn<SustainabilityService['markAsReturned']>(),
      cancelRequest: jest.fn<SustainabilityService['cancelRequest']>(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SustainabilityController],
      providers: [
        {
          provide: SustainabilityService,
          useValue: serviceMock,
        },
      ],
    }).compile();

    controller = module.get<SustainabilityController>(SustainabilityController);
    mockService = module.get(SustainabilityService);
  });

  it('getAll delegates to service', async () => {
    await controller.getAll(ListingType.SALE);
    expect(mockService.findAllListings).toHaveBeenCalledWith(ListingType.SALE);
  });

  it('getSocial delegates to service with user id', async () => {
    mockService.getSocialListings.mockResolvedValue([]);

    await controller.getSocial(mockReq);

    expect(mockService.getSocialListings).toHaveBeenCalledWith('u1');
  });

  it('getDonations delegates to service', async () => {
    await controller.getDonations();
    expect(mockService.findAllDonationPoints).toHaveBeenCalled();
  });

  it('getByBook delegates to service', async () => {
    await controller.getByBook(5);
    expect(mockService.findByBookId).toHaveBeenCalledWith(5);
  });

  it('create delegates to service with user id', async () => {
    const data: CreateListingDto = {
      type: ListingType.SALE,
      condition: BookCondition.GOOD,
      price: 10,
      bookId: 1,
    };

    await controller.create(mockReq, data);

    expect(mockService.createListing).toHaveBeenCalledWith('u1', data);
  });

  it('getMyListings delegates to service', async () => {
    await controller.getMyListings(mockReq);
    expect(mockService.findMyListings).toHaveBeenCalledWith('u1');
  });

  it('markDonated delegates to service', async () => {
    await controller.markDonated(mockReq, 'l1');
    expect(mockService.markAsDonated).toHaveBeenCalledWith('u1', 'l1');
  });

  it('update delegates to service', async () => {
    const data = { price: 5 };

    await controller.update(mockReq, 'l1', data);

    expect(mockService.updateListing).toHaveBeenCalledWith('u1', 'l1', data);
  });

  it('remove delegates to service', async () => {
    await controller.remove(mockReq, 'l1');

    expect(mockService.deleteListing).toHaveBeenCalledWith('u1', 'l1');
  });

  it('createRequest delegates to service', async () => {
    await controller.createRequest(mockReq, 'l1');

    expect(mockService.createRequest).toHaveBeenCalledWith('u1', 'l1');
  });

  it('getMyRequests delegates to service', async () => {
    await controller.getMyRequests(mockReq);

    expect(mockService.getUserRequests).toHaveBeenCalledWith('u1');
  });

  it('updateStatus delegates to service', async () => {
    await controller.updateStatus(mockReq, 'r1', 'accepted');

    expect(mockService.updateRequestStatus).toHaveBeenCalledWith(
      'u1',
      'r1',
      'accepted',
    );
  });

  it('markReturned delegates to service', async () => {
    await controller.markReturned(mockReq, 'r1');

    expect(mockService.markAsReturned).toHaveBeenCalledWith('u1', 'r1');
  });

  it('cancel delegates to service', async () => {
    await controller.cancel(mockReq, 'l1');

    expect(mockService.cancelRequest).toHaveBeenCalledWith('u1', 'l1');
  });

  it('getSocial should throw UnauthorizedException when user id is missing', async () => {
    const req: RequestWithUser = {
      user: {} as UserPayload,
    } as RequestWithUser;

    await expect(controller.getSocial(req)).rejects.toThrow(
      UnauthorizedException,
    );
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { SustainabilityController } from './sustainability.controller';
import {
  SustainabilityService,
  CreateListingDto,
} from './sustainability.service';
import { ListingType, BookCondition } from '../entities/book-listing.entity';
import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { UnauthorizedException } from '@nestjs/common';

describe('SustainabilityController', () => {
  let controller: SustainabilityController;
  const mockService: any = {
    findAllListings: jest.fn(),
    getSocialListings: jest.fn(),
    findAllDonationPoints: jest.fn(),
    findByBookId: jest.fn(),
    createListing: jest.fn(),
    findMyListings: jest.fn(),
    markAsDonated: jest.fn(),
    updateListing: jest.fn(),
    deleteListing: jest.fn(),
    createRequest: jest.fn(),
    getUserRequests: jest.fn(),
    updateRequestStatus: jest.fn(),
    markAsReturned: jest.fn(),
    cancelRequest: jest.fn(),
  };
  const mockReq = { user: { id: 'u1' } } as any;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SustainabilityController],
      providers: [{ provide: SustainabilityService, useValue: mockService }],
    }).compile();

    controller = module.get<SustainabilityController>(SustainabilityController);
  });

  it('getAll delegates to service', () => {
    controller.getAll(ListingType.SALE);
    expect(mockService.findAllListings).toHaveBeenCalledWith(ListingType.SALE);
  });

  it('getSocial delegates to service with user id', async () => {
    mockService.getSocialListings.mockResolvedValue([]);
    await controller.getSocial(mockReq);
    expect(mockService.getSocialListings).toHaveBeenCalledWith('u1');
  });

  it('getDonations delegates to service', () => {
    controller.getDonations();
    expect(mockService.findAllDonationPoints).toHaveBeenCalled();
  });

  it('getByBook delegates to service', async () => {
    await controller.getByBook(5);
    expect(mockService.findByBookId).toHaveBeenCalledWith(5);
  });

  it('create delegates to service with user id', () => {
    const data: CreateListingDto = {
      type: ListingType.SALE,
      condition: BookCondition.GOOD,
      price: 10,
      bookId: 1,
    };
    controller.create(mockReq, data);
    expect(mockService.createListing).toHaveBeenCalledWith('u1', data);
  });

  it('getMyListings delegates to service', () => {
    controller.getMyListings(mockReq);
    expect(mockService.findMyListings).toHaveBeenCalledWith('u1');
  });

  it('markDonated delegates to service', () => {
    controller.markDonated(mockReq, 'l1');
    expect(mockService.markAsDonated).toHaveBeenCalledWith('u1', 'l1');
  });

  it('update delegates to service', () => {
    const data = { price: 5 };
    controller.update(mockReq, 'l1', data);
    expect(mockService.updateListing).toHaveBeenCalledWith('u1', 'l1', data);
  });

  it('remove delegates to service', () => {
    controller.remove(mockReq, 'l1');
    expect(mockService.deleteListing).toHaveBeenCalledWith('u1', 'l1');
  });

  it('createRequest delegates to service', () => {
    controller.createRequest(mockReq, 'l1');
    expect(mockService.createRequest).toHaveBeenCalledWith('u1', 'l1');
  });

  it('getMyRequests delegates to service', async () => {
    await controller.getMyRequests(mockReq);
    expect(mockService.getUserRequests).toHaveBeenCalledWith('u1');
  });

  it('updateStatus delegates to service', async () => {
    await controller.updateStatus(mockReq, 'r1', 'accepted');
    expect(mockService.updateRequestStatus).toHaveBeenCalledWith('u1', 'r1', 'accepted');
  });

  it('markReturned delegates to service', () => {
    controller.markReturned(mockReq, 'r1');
    expect(mockService.markAsReturned).toHaveBeenCalledWith('u1', 'r1');
  });

  it('cancel delegates to service', async () => {
    await controller.cancel(mockReq, 'l1');
    expect(mockService.cancelRequest).toHaveBeenCalledWith('u1', 'l1');
  });

  it('getSocial should throw UnauthorizedException when user id is missing', async () => {
    const req: any = {
      user: {},
    };

    await expect(controller.getSocial(req)).rejects.toThrow(
      new UnauthorizedException('No se pudo identificar al usuario'),
    );
  });
});

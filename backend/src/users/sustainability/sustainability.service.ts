import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  BookListing,
  ListingType,
  BookCondition,
} from '../entities/book-listing.entity';
import { DonationPoint } from '../entities/donation-point.entity';
import { User } from '../entities/user.entity';
import { SustainabilityRequest } from '../entities/sustainability-request.entity';
import { Book } from 'src/books/entities/book.entity';

export interface CreateListingDto {
  type: ListingType;
  condition: BookCondition;
  price: number;
  maxLoanDays?: number;
  description?: string;
  bookId: number;
}

export interface UpdateListingDto {
  type?: ListingType;
  condition?: BookCondition;
  price?: number;
  maxLoanDays?: number;
  description?: string;
}

@Injectable()
export class SustainabilityService {
  constructor(
    @InjectRepository(BookListing)
    private readonly listingRepository: Repository<BookListing>,
    @InjectRepository(DonationPoint)
    private readonly donationRepository: Repository<DonationPoint>,
    @InjectRepository(SustainabilityRequest)
    private readonly requestRepository: Repository<SustainabilityRequest>,
  ) {}

  // --- MARKETPLACE & PRÉSTAMOS ---

  async createListing(userId: string, data: CreateListingDto) {
    const { bookId, ...rest } = data;
    const listing = this.listingRepository.create({
      ...rest,
      user: { id: userId } as User,
      book: { id: bookId } as Book,
    });
    return this.listingRepository.save(listing);
  }

  async findAllListings(type?: ListingType) {
    const query = this.listingRepository
      .createQueryBuilder('listing')
      .leftJoinAndSelect('listing.book', 'book')
      .leftJoinAndSelect('listing.user', 'user')
      .where('listing.isAvailable = :available', { available: true });

    if (type) {
      query.andWhere('listing.type = :type', { type });
    }

    return query.orderBy('listing.createdAt', 'DESC').getMany();
  }

  async findMyListings(userId: string) {
    return this.listingRepository.find({
      where: { user: { id: userId } },
      relations: ['book'],
      order: { createdAt: 'DESC' },
    });
  }

  async updateListing(
    userId: string,
    listingId: string,
    data: UpdateListingDto,
  ) {
    const listing = await this.listingRepository.findOne({
      where: { id: listingId, user: { id: userId } },
    });

    if (!listing) throw new NotFoundException('Anuncio no encontrado');

    if (data.type) listing.type = data.type;
    if (data.condition) listing.condition = data.condition;
    if (data.price !== undefined) listing.price = data.price;
    if (data.maxLoanDays !== undefined) listing.maxLoanDays = data.maxLoanDays;
    if (data.description !== undefined) listing.description = data.description;

    return this.listingRepository.save(listing);
  }

  async deleteListing(userId: string, listingId: string) {
    const listing = await this.listingRepository.findOne({
      where: { id: listingId },
      relations: ['user'],
    });

    if (!listing) throw new NotFoundException('Anuncio no encontrado');
    if (listing.user.id !== userId)
      throw new ForbiddenException('No puedes borrar este anuncio');

    return this.listingRepository.remove(listing);
  }

  async toggleAvailability(userId: string, listingId: string) {
    const listing = await this.listingRepository.findOne({
      where: { id: listingId, user: { id: userId } },
    });
    if (!listing) throw new NotFoundException('Anuncio no encontrado');

    listing.isAvailable = !listing.isAvailable;
    return this.listingRepository.save(listing);
  }

  // --- DONACIONES ---

  async findAllDonationPoints() {
    return this.donationRepository.find();
  }

  async createRequest(requesterId: string, listingId: string) {
    const listing = await this.listingRepository.findOne({
      where: { id: listingId },
      relations: ['user'],
    });

    if (!listing) throw new NotFoundException('El libro ya no está disponible');
    if (listing.user.id === requesterId)
      throw new ForbiddenException('No puedes solicitar tu propio libro');

    const existing = await this.requestRepository.findOne({
      where: { listing: { id: listingId }, requester: { id: requesterId } },
    });
    if (existing) throw new ForbiddenException('Ya has solicitado este libro');

    const request = this.requestRepository.create({
      listing: { id: listingId },
      requester: { id: requesterId },
      status: 'pending',
    });
    return this.requestRepository.save(request);
  }

  async getUserRequests(userId: string) {
    const requests = await this.requestRepository.find({
      relations: ['listing', 'listing.book', 'listing.user', 'requester'],
      order: { createdAt: 'DESC' },
    });

    return requests
      .filter(
        (req) => req.listing.user.id === userId || req.requester.id === userId,
      )
      .map((req) => ({
        ...req,
        isOwner: req.listing.user.id === userId,
      }));
  }

  async updateRequestStatus(
    userId: string,
    requestId: string,
    status: 'accepted' | 'rejected',
  ) {
    const request = await this.requestRepository.findOne({
      where: { id: requestId },
      relations: ['listing', 'listing.user'],
    });

    if (!request) {
      throw new NotFoundException('Solicitud no encontrada');
    }

    if (request.listing.user.id !== userId) {
      throw new ForbiddenException(
        'No tienes permiso para gestionar esta solicitud',
      );
    }

    request.status = status;

    if (status === 'accepted') {
      await this.listingRepository.update(request.listing.id, {
        isAvailable: false,
      });
    }

    return this.requestRepository.save(request);
  }

  async findByBookId(bookId: number) {
    const referenceBook = await this.listingRepository.manager.findOne(Book, {
      where: { id: bookId },
    });
    if (!referenceBook) return [];

    return this.listingRepository.find({
      where: {
        book: { title: referenceBook.title, author: referenceBook.author },
        isAvailable: true,
      },
      relations: ['user', 'book'],
    });
  }

  async cancelRequest(userId: string, listingId: string) {
    const request = await this.requestRepository.findOne({
      where: {
        requester: { id: userId },
        listing: { id: listingId },
        status: 'pending',
      },
    });

    if (!request) {
      throw new NotFoundException(
        'No se encontró ninguna petición pendiente para cancelar',
      );
    }

    return this.requestRepository.remove(request);
  }

  async markAsReturned(userId: string, requestId: string) {
    const request = await this.requestRepository.findOne({
      where: { id: requestId },
      relations: ['listing', 'listing.user'],
    });

    if (!request || request.listing.user.id !== userId) {
      throw new ForbiddenException('No puedes gestionar esta devolución');
    }

    await this.listingRepository.update(request.listing.id, {
      isAvailable: true,
    });

    request.status = 'completed';
    return this.requestRepository.save(request);
  }

  async markAsDonated(userId: string, listingId: string) {
    const listing = await this.listingRepository.findOne({
      where: { id: listingId, user: { id: userId } },
      relations: ['book'],
    });

    if (!listing) throw new NotFoundException('Anuncio no encontrado');

    listing.isAvailable = false;
    await this.listingRepository.save(listing);

    return { message: 'Libro donado con éxito' };
  }
}

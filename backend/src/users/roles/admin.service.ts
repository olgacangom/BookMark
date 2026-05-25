import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from '../entities/user.entity';
import { Book } from 'src/books/entities/book.entity';
import { BookListing, ListingType } from '../entities/book-listing.entity';
import { LibraryEvent } from '../entities/library-event.entity';
import { EventRegistration } from 'src/bookstore/entities/event-registration.entity';
import { SustainabilityRequest } from '../entities/sustainability-request.entity';
import { Club } from 'src/club/entities/club.entity';

interface RawCreatedAt {
  createdAt: string | Date;
}

interface RawBookResult {
  title: string;
  author: string;
  requestcount: string | number;
}

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Book)
    private readonly bookRepository: Repository<Book>,
    @InjectRepository(BookListing)
    private readonly listingRepository: Repository<BookListing>,
    @InjectRepository(LibraryEvent)
    private readonly eventRepository: Repository<LibraryEvent>,
    @InjectRepository(EventRegistration)
    private readonly eventRegistrationRepository: Repository<EventRegistration>,
    @InjectRepository(SustainabilityRequest)
    private readonly requestRepository: Repository<SustainabilityRequest>,
    @InjectRepository(Club)
    private readonly clubRepository: Repository<Club>,
  ) {}

  // Cambiar el estado de un usuario registrado
  async toggleUserStatus(id: string) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    user.isActive = !user.isActive;
    await this.userRepository.save(user);

    return {
      message: `Usuario ${user.isActive ? 'activado' : 'suspendido'} con éxito`,
    };
  }

  // Gestión de Usuarios
  async getAllUsersWithBookCount() {
    return await this.userRepository
      .createQueryBuilder('user')
      .loadRelationCountAndMap('user.booksCount', 'user.books')
      .select([
        'user.id',
        'user.fullName',
        'user.email',
        'user.role',
        'user.avatarUrl',
        'user.createdAt',
        'user.isActive',
        'user.libraryName',
        'user.libraryAddress',
        'user.document',
      ])
      .orderBy('user.createdAt', 'DESC')
      .getMany();
  }

  // Estadísticas app-usuarios
  private formatWeeklyGrowth(records: { createdAt: Date }[], days = 7) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const labels = Array.from({ length: days }, (_, index) => {
      const date = new Date(today);
      date.setDate(today.getDate() - (days - 1 - index));
      const label = date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short',
      });
      return { label, count: 0, key: date.toISOString().slice(0, 10) };
    });

    const grouped = records.reduce(
      (acc, record) => {
        const key = record.createdAt.toISOString().slice(0, 10);
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    return labels.map(({ label, count, key }) => ({
      label,
      value: grouped[key] ?? count,
    }));
  }

  async getGlobalStats() {
    try {
      const totalUsers = await this.userRepository.count();
      const activeUsers = await this.userRepository.count({
        where: { isActive: true },
      });
      const totalLibreros = await this.userRepository.count({
        where: { role: UserRole.LIBRERO },
      });
      const pendingLibreros = await this.userRepository.count({
        where: { role: UserRole.LIBRERO_PENDIENTE },
      });
      const totalBooks = await this.bookRepository.count();
      const totalListings = await this.listingRepository.count();
      const totalAvailableListings = await this.listingRepository.count({
        where: { isAvailable: true },
      });
      const totalLoanListings = await this.listingRepository.count({
        where: { type: ListingType.LOAN },
      });
      const totalSaleListings = await this.listingRepository.count({
        where: { type: ListingType.SALE },
      });
      const totalRequests = await this.requestRepository.count();
      const acceptedRequests = await this.requestRepository.count({
        where: { status: 'accepted' },
      });
      const completedRequests = await this.requestRepository.count({
        where: { status: 'completed' },
      });
      const totalEvents = await this.eventRepository.count();
      const upcomingEvents = await this.eventRepository
        .createQueryBuilder('event')
        .where('event.eventDate > :now', { now: new Date().toISOString() })
        .getCount();
      const totalRegistrations = await this.eventRegistrationRepository.count();

      const totalClubs = await this.clubRepository.count();

      const topGenres = await this.bookRepository
        .createQueryBuilder('book')
        .select('book.genre', 'genre')
        .addSelect('COUNT(*)', 'count')
        .groupBy('book.genre')
        .orderBy('COUNT(*)', 'DESC')
        .limit(5)
        .getRawMany();

      const topBooks = await this.requestRepository
        .createQueryBuilder('req')
        .innerJoin('req.listing', 'listing')
        .innerJoin('listing.book', 'book')
        .select('book.id', 'bookId')
        .addSelect('book.title', 'title')
        .addSelect('book.author', 'author')
        .addSelect('book.urlPortada', 'urlPortada')
        .addSelect('COUNT(req.id)', 'count')
        .where('req.status IN (:...statuses)', {
          statuses: ['accepted', 'completed'],
        })
        .groupBy('book.id')
        .addGroupBy('book.title')
        .addGroupBy('book.author')
        .addGroupBy('book.urlPortada')
        .orderBy('COUNT(req.id)', 'DESC')
        .limit(5)
        .getRawMany();

      const topLibreros = await this.listingRepository
        .createQueryBuilder('listing')
        .innerJoin('listing.user', 'user')
        .select('user.id', 'userId')
        .addSelect('user.fullName', 'fullName')
        .addSelect('user.email', 'email')
        .addSelect('user.avatarUrl', 'avatarUrl')
        .addSelect('COUNT(listing.id)', 'listingsCount')
        .groupBy('user.id')
        .addGroupBy('user.fullName')
        .addGroupBy('user.email')
        .addGroupBy('user.avatarUrl')
        .orderBy('COUNT(listing.id)', 'DESC')
        .limit(5)
        .getRawMany();

      const recentUsers = await this.userRepository
        .createQueryBuilder('user')
        .select('user.createdAt', 'createdAt')
        .where('user.createdAt >= :since', {
          since: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .getRawMany<RawCreatedAt>();

      const recentLibreros = await this.userRepository
        .createQueryBuilder('user')
        .select('user.createdAt', 'createdAt')
        .where('user.role = :role', { role: UserRole.LIBRERO })
        .andWhere('user.createdAt >= :since', {
          since: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
        })
        .getRawMany<RawCreatedAt>();

      const recentListings = await this.listingRepository
        .createQueryBuilder('listing')
        .select('listing.createdAt', 'createdAt')
        .where('listing.createdAt >= :since', {
          since: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .getRawMany<RawCreatedAt>();

      const weeklyUserGrowth = this.formatWeeklyGrowth(
        recentUsers.map((item) => ({
          createdAt: new Date(item.createdAt),
        })),
      );
      const weeklyLibreroGrowth = this.formatWeeklyGrowth(
        recentLibreros.map((item) => ({
          createdAt: new Date(item.createdAt),
        })),
      );
      const weeklyListingGrowth = this.formatWeeklyGrowth(
        recentListings.map((item) => ({ createdAt: new Date(item.createdAt) })),
      );

      return {
        totalUsers,
        activeUsers,
        totalLibreros,
        pendingLibreros,
        totalBooks,
        totalListings,
        totalAvailableListings,
        totalLoanListings,
        totalSaleListings,
        totalRequests,
        acceptedRequests,
        completedRequests,
        totalEvents,
        upcomingEvents,
        totalRegistrations,
        totalInteractions: totalRequests + totalRegistrations,
        avgRegistrationsPerEvent: totalEvents
          ? Number((totalRegistrations / totalEvents).toFixed(1))
          : 0,
        totalClubs,
        topGenres,
        topBooks,
        topLibreros,
        weeklyUserGrowth,
        weeklyLibreroGrowth,
        weeklyListingGrowth,
      };
    } catch (error) {
      console.error('Error en getGlobalStats:', error);
      throw error;
    }
  }

  async getMainStats() {
    const totalUsers = await this.userRepository.count();
    const totalLibreros = await this.userRepository.count({
      where: { role: UserRole.LIBRERO },
    });
    const pendientes = await this.userRepository.count({
      where: { role: UserRole.LIBRERO_PENDIENTE },
    });

    return {
      totalUsers,
      totalLibreros,
      pendientes,
    };
  }

  async approveLibrero(id: string) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    user.role = UserRole.LIBRERO;
    user.isActive = true;
    await this.userRepository.save(user);

    return { message: `El usuario ${user.fullName} ahora es Librero oficial.` };
  }

  async rejectLibrero(id: string) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    // Si lo rechazamos, borramos la cuenta
    await this.userRepository.remove(user);
    return {
      message: `Solicitud de '${user.fullName}' rechazada y eliminada.`,
    };
  }

  async findAllLibreros() {
    return this.userRepository.find({
      where: [{ role: UserRole.LIBRERO }, { role: UserRole.LIBRERO_PENDIENTE }],
    });
  }

  async getMostRequestedBook(): Promise<{
    title: string;
    author: string;
  } | null> {
    const result = await this.requestRepository
      .createQueryBuilder('req')
      .innerJoin('req.listing', 'listing')
      .innerJoin('listing.book', 'book')
      .select('book.title', 'title')
      .addSelect('book.author', 'author')
      .addSelect('COUNT(req.id)', 'requestcount')
      .groupBy('book.id')
      .addGroupBy('book.title')
      .addGroupBy('book.author')
      .orderBy('requestcount', 'DESC')
      .limit(1)
      .getRawOne<RawBookResult>();

    return result ? { title: result.title, author: result.author } : null;
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from '../entities/user.entity';
import { Book } from 'src/books/entities/book.entity';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Book)
    private readonly bookRepository: Repository<Book>,
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
  async getGlobalStats() {
    try {
      const totalUsers = await this.userRepository.count();
      const totalBooks = await this.bookRepository.count();

      const topGenres = await this.bookRepository
        .createQueryBuilder('book')
        .select('book.genre', 'genre')
        .addSelect('COUNT(*)', 'count')
        .groupBy('book.genre')
        .orderBy('count', 'DESC')
        .limit(5)
        .getRawMany();

      const topBooks = await this.bookRepository
        .createQueryBuilder('book')
        .select('book.title', 'title')
        .addSelect('book.author', 'author')
        .addSelect('COUNT(*)', 'totalSaves')
        .groupBy('book.title')
        .addGroupBy('book.author')
        .orderBy('COUNT(*)', 'DESC')
        .limit(5)
        .getRawMany();

      return {
        totalUsers,
        totalBooks,
        topGenres,
        topBooks,
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
}

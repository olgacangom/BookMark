import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';

import { UpdateUserDto } from './dto/update-user.dto';
import { User, UserRole } from './entities/user.entity';
import { Follow, FollowStatus } from './entities/follow.entity';
import { ActivitiesService } from './activities.service';
import { ActivityType } from './entities/activity.entity';
import { UserStats } from './entities/user-stats.entity';
import { Badge } from './badge.entity';
import { RegisterDto } from 'src/auth/dto/register.dto';

interface GrowthData {
  month: string;
  count: string | number;
}

@Injectable()
export class UsersService implements OnModuleInit {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Follow)
    private readonly followRepository: Repository<Follow>,
    @InjectRepository(UserStats)
    private readonly userStatsRepository: Repository<UserStats>,
    @InjectRepository(Badge)
    private readonly badgeRepository: Repository<Badge>,
    private readonly activitiesService: ActivitiesService,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    console.log('📦 Inicializando sistema de usuarios...');
    await this.setupAdmin();
    await this.setupInitialBadges();
  }

  // --- SECCIÓN SEEDERS ---

  private async setupAdmin() {
    const adminEmail = this.configService.get<string>('ADMIN_EMAIL');
    const adminPass = this.configService.get<string>('ADMIN_PASSWORD');

    if (!adminEmail || !adminPass) {
      console.warn(
        'No se han configurado las credenciales de ADMIN en el .env',
      );
      return;
    }

    const adminExists = await this.usersRepository.findOne({
      where: { role: UserRole.ADMIN },
    });

    if (!adminExists) {
      console.log('🚀 Creando usuario administrador inicial...');
      const hashedPassword = await bcrypt.hash(adminPass, 10);

      const admin = this.usersRepository.create({
        email: adminEmail,
        password: hashedPassword,
        fullName: 'Administrador de BookMark',
        role: UserRole.ADMIN,
        isPublic: true,
      });

      await this.usersRepository.save(admin);
      console.log('Admin creado con éxito');
    }
  }

  private async setupInitialBadges() {
    const count = await this.badgeRepository.count();
    if (count === 0) {
      await this.badgeRepository.save([
        {
          name: 'Primeras Páginas',
          description: '¡Has terminado tu primer libro!',
          icon: '📚',
          requirementType: 'BOOKS_READ',
          requirementValue: 1,
        },
        {
          name: 'Erudito',
          description: 'Has leído 5 libros. ¡Increíble!',
          icon: '🎓',
          requirementType: 'BOOKS_READ',
          requirementValue: 5,
        },
      ]);
      console.log('Medallas inicializadas');
    }
  }

  // --- MÉTODOS DE USUARIO ---

  async create(registerDto: RegisterDto) {
    const existingUser = await this.findOneByEmail(registerDto.email);
    if (existingUser) {
      throw new BadRequestException('El email ya está registrado');
    }
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);
    const newUser = this.usersRepository.create({
      ...registerDto,
      password: hashedPassword,
    });
    const savedUser = await this.usersRepository.save(newUser);

    const initialStats = this.userStatsRepository.create({
      user: savedUser,
      xp: 0,
      level: 1,
      totalBooksFinished: 0,
      currentStreak: 0,
    });
    await this.userStatsRepository.save(initialStats);

    return savedUser;
  }

  async findOneByEmail(email: string): Promise<User | null> {
    return await this.usersRepository.findOneBy({ email });
  }

  async findAll() {
    return await this.usersRepository.find({
      relations: ['followerRelations', 'followerRelations.follower'],
      select: {
        id: true,
        email: true,
        fullName: true,
        avatarUrl: true,
        bio: true,
        isPublic: true,
        role: true,
      },
    });
  }

  async findOne(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: [
        'followerRelations',
        'followerRelations.follower',
        'followingRelations',
        'followingRelations.following',
        'stats',
        'badges',
        'clubs',
        'clubs.creator',
        'clubs.members',
      ],
    });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return user;
  }

  /**
   * Obtiene el perfil de un usuario aplicando lógica de privacidad
   * y calculando estados de seguimiento para el usuario solicitante.
   */
  async findOneProfile(id: string, requesterId: string) {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: [
        'followerRelations',
        'followerRelations.follower',
        'followingRelations',
        'followingRelations.following',
        'stats',
        'badges',
        'clubs',
        'clubs.creator',
        'clubs.members',
        'registrations',
        'registrations.event',
        'registrations.event.organizer',
      ],
    });

    if (!user) throw new NotFoundException('Usuario no encontrado');

    const isFollowing = user.followerRelations.some(
      (f) =>
        f.follower.id === requesterId && f.status === FollowStatus.ACCEPTED,
    );

    const hasPendingRequest = user.followerRelations.some(
      (f) => f.follower.id === requesterId && f.status === FollowStatus.PENDING,
    );

    // Verificamos privacidad: si es privado y no soy yo ni le sigo, Forbidden
    if (!user.isPublic && user.id !== requesterId && !isFollowing) {
      throw new ForbiddenException('Este perfil es privado');
    }

    const attendedEvents =
      user.registrations?.map((reg) => ({
        ...reg.event,
        registrationId: reg.id,
      })) || [];

    const userInstance = user as Partial<User>;
    delete userInstance.password;

    return {
      ...userInstance,
      isFollowing,
      hasPendingRequest,
      events: attendedEvents,
    };
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const user = await this.usersRepository.preload({
      id: id,
      ...updateUserDto,
    });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    await this.usersRepository.save(user);
    return this.findOne(id);
  }

  // --- SISTEMA SOCIAL ---

  async followUser(followerId: string, targetUserId: string) {
    if (followerId === targetUserId) {
      throw new BadRequestException('No puedes seguirte a ti mismo');
    }

    const targetUser = await this.usersRepository.findOneBy({
      id: targetUserId,
    });
    if (!targetUser) throw new NotFoundException('Usuario no encontrado');

    let follow = await this.followRepository.findOne({
      where: { follower: { id: followerId }, following: { id: targetUserId } },
    });

    if (follow) return follow;

    follow = this.followRepository.create({
      follower: { id: followerId },
      following: { id: targetUserId },
      status: targetUser.isPublic
        ? FollowStatus.ACCEPTED
        : FollowStatus.PENDING,
    });

    return await this.followRepository.save(follow);
  }

  async unfollowUser(followerId: string, targetUserId: string) {
    const follow = await this.followRepository.findOne({
      where: { follower: { id: followerId }, following: { id: targetUserId } },
    });

    if (!follow) return { message: 'No había relación previa' };

    await this.followRepository.remove(follow);
    return { message: 'Relación eliminada' };
  }

  async getPendingRequests(userId: string) {
    return await this.followRepository.find({
      where: {
        following: { id: userId },
        status: FollowStatus.PENDING,
      },
      relations: ['follower'],
    });
  }

  async acceptFollowRequest(requestId: string) {
    const request = await this.followRepository.findOne({
      where: { id: requestId },
      relations: ['follower', 'following'],
    });

    if (!request) throw new NotFoundException('Solicitud no encontrada');

    request.status = FollowStatus.ACCEPTED;
    await this.followRepository.save(request);

    await this.activitiesService.create(
      request.follower.id,
      ActivityType.FOLLOW,
      request.following.id,
    );

    return request;
  }

  async declineFollowRequest(requestId: string) {
    const request = await this.followRepository.findOneBy({ id: requestId });
    if (!request) throw new NotFoundException('Solicitud no encontrada');
    return await this.followRepository.remove(request);
  }

  async searchUsers(query: string) {
    return this.usersRepository.find({
      where: [
        { fullName: ILike(`%${query}%`) },
        { email: ILike(`%${query}%`) },
      ],
      select: ['id', 'fullName', 'avatarUrl', 'bio', 'isPublic'],
    });
  }

  async remove(id: string) {
    const user = await this.usersRepository.findOneBy({ id });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return this.usersRepository.remove(user);
  }

  async getFollowingIds(userId: string): Promise<string[]> {
    const follows = await this.followRepository.find({
      where: {
        follower: { id: userId },
        status: FollowStatus.ACCEPTED,
      },
      relations: ['following'],
    });

    return follows.map((f) => f.following.id);
  }

  // --- GAMIFICACIÓN ---

  async addExperience(userId: string, xpAmount: number) {
    let stats = await this.userStatsRepository.findOne({
      where: { user: { id: userId } },
    });

    if (!stats) {
      stats = this.userStatsRepository.create({
        user: { id: userId },
        xp: 0,
        level: 1,
        totalBooksFinished: 0,
        currentStreak: 1,
        lastActivityDate: new Date(),
      });
    }

    stats.xp += xpAmount;
    stats.level = Math.floor(0.1 * Math.sqrt(stats.xp)) + 1;

    return await this.userStatsRepository.save(stats);
  }

  async updateStreak(userId: string) {
    const stats = await this.userStatsRepository.findOne({
      where: { user: { id: userId } },
    });
    if (!stats) return;

    stats.totalBooksFinished += 1;
    const now = new Date();
    const lastActivity = stats.lastActivityDate;

    if (!lastActivity) {
      stats.currentStreak = 1;
      stats.lastActivityDate = now;
    } else {
      const diffInHours =
        (now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60);
      if (diffInHours >= 24 && diffInHours < 48) {
        stats.currentStreak += 1;
        stats.lastActivityDate = now;
      } else if (diffInHours >= 48) {
        stats.currentStreak = 1;
        stats.lastActivityDate = now;
      }
    }
    await this.userStatsRepository.save(stats);
  }

  async assignBadge(userId: string, badgeId: string) {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: ['badges'],
    });

    const badge = await this.badgeRepository.findOneBy({ id: badgeId });

    if (user && badge) {
      if (!user.badges.find((b) => b.id === badge.id)) {
        user.badges.push(badge);
        await this.usersRepository.save(user);
      }
    }
  }

  async getBooksGrowth(userId: string): Promise<GrowthData[]> {
    const queryBuilder = this.usersRepository.createQueryBuilder('user');
    return await queryBuilder
      .leftJoin('user.books', 'book')
      .select("TO_CHAR(book.createdAt, 'YYYY-MM')", 'month')
      .addSelect('COUNT(book.id)', 'count')
      .where('user.id = :userId', { userId })
      .groupBy('month')
      .orderBy('month', 'ASC')
      .getRawMany();
  }

  async updateAvatar(userId: string, url: string) {
    const user = await this.findOne(userId);
    user.avatarUrl = url;
    return this.usersRepository.save(user);
  }

  async deleteAvatar(userId: string) {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    user.avatarUrl = null;
    return this.usersRepository.save(user);
  }
}

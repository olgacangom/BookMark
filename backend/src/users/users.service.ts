import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { Follow, FollowStatus } from './entities/follow.entity';
import { ActivitiesService } from './activities.service';
import { ActivityType } from './entities/activity.entity';
import { UserStats } from './entities/user-stats.entity';
import { Badge } from './badge.entity';

interface GrowthData {
  month: string;
  count: string | number;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Follow)
    private readonly followRepository: Repository<Follow>,
    @InjectRepository(UserStats)
    private readonly userStatsRepository: Repository<UserStats>,
    private readonly activitiesService: ActivitiesService,
    @InjectRepository(Badge)
    private readonly badgeRepository: Repository<Badge>,
  ) {}

  async create(createUserDto: CreateUserDto) {
    const existingUser = await this.findOneByEmail(createUserDto.email);
    if (existingUser) {
      throw new BadRequestException('El email ya está registrado');
    }
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const newUser = this.usersRepository.create({
      ...createUserDto,
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

  async findOneByEmail(email: string) {
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
      },
    });
  }

  async findOne(id: string) {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: [
        'followerRelations',
        'followerRelations.follower',
        'followingRelations',
        'followingRelations.following',
        'stats',
        'badges',
      ],
    });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return user;
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

    if (!follow) {
      return { message: 'No había relación previa' };
    }

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

  async findOneProfile(id: string, requesterId: string) {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: [
        'followerRelations',
        'followerRelations.follower',
        'stats',
        'badges',
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

    if (!user.isPublic && user.id !== requesterId && !isFollowing) {
      throw new ForbiddenException('Este perfil es privado');
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _password, ...result } = user;
    return {
      ...result,
      isFollowing,
      hasPendingRequest,
    };
  }

  async remove(id: string) {
    const user = await this.usersRepository.findOneBy({ id });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return this.usersRepository.remove(user);
  }

  async addExperience(userId: string, xpAmount: number) {
    let stats = await this.userStatsRepository.findOne({
      where: { user: { id: userId } },
    });

    // SI NO EXISTEN, LAS CREAMOS
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
    console.log(
      `📈 Sumando libro terminado. Total ahora: ${stats.totalBooksFinished}`,
    );

    const now = new Date();
    const lastActivity = stats.lastActivityDate;

    if (!lastActivity) {
      stats.currentStreak = 1;
      stats.lastActivityDate = now;
    } else {
      const diffInMs = now.getTime() - lastActivity.getTime();
      const diffInHours = diffInMs / (1000 * 60 * 60);

      if (diffInHours >= 24 && diffInHours < 48) {
        // Ha pasado un día: aumenta racha
        stats.currentStreak += 1;
        stats.lastActivityDate = now;
      } else if (diffInHours >= 48) {
        // Ha pasado demasiado tiempo: reset racha
        stats.currentStreak = 1;
        stats.lastActivityDate = now;
      }
      // Si diffInHours < 24, simplemente NO tocamos la racha ni la fecha,
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
        console.log(`🏅 Medalla '${badge.name}' asignada a ${user.fullName}`);
      }
    }
  }

  async onModuleInit() {
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
      console.log('✅ Medallas de BookMark inicializadas');
    }
  }

  async getBooksGrowth(userId: string): Promise<GrowthData[]> {
    const queryBuilder = this.usersRepository.createQueryBuilder('user');

    const result = await queryBuilder
      .leftJoin('user.books', 'book')
      .select('TO_CHAR(book."createdAt", \'YYYY-MM\')', 'month')
      .addSelect('COUNT(book.id)', 'count')
      .where('user.id = :userId', { userId })
      .groupBy('month')
      .orderBy('month', 'ASC')
      .getRawMany();

    return result as GrowthData[];
  }
}

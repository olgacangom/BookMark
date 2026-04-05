import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Activity, ActivityType } from './entities/activity.entity';
import { User } from './entities/user.entity';
import { FollowStatus } from './entities/follow.entity'; // <--- IMPORTADO
import { Book } from 'src/books/entities/book.entity'; // <--- IMPORTADO

@Injectable()
export class ActivitiesService {
  constructor(
    @InjectRepository(Activity)
    private readonly activityRepository: Repository<Activity>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(userId: string, type: ActivityType, targetId?: string) {
    const user = await this.userRepository.findOneBy({ id: userId });

    if (!user) {
      throw new NotFoundException(`Usuario con ID ${userId} no encontrado`);
    }

    const activity = this.activityRepository.create({
      user: user,
      type: type,
    });

    if (targetId) {
      if (type === ActivityType.FOLLOW) {
        activity.targetUser = { id: targetId } as User;
      } else {
        // Casteo seguro para evitar el error de 'any'
        activity.targetBook = { id: Number(targetId) } as unknown as Book;
      }
    }

    return await this.activityRepository.save(activity);
  }

  async getFeed(userId: string) {
    const userWithFollowing = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['followingRelations', 'followingRelations.following'],
    });

    const followingIds =
      userWithFollowing?.followingRelations
        .filter((rel) => rel.status === FollowStatus.ACCEPTED) // <--- USAR ENUM
        .map((rel) => rel.following.id) || [];

    const idsToFetch = [...followingIds, userId];

    return await this.activityRepository.find({
      where: { user: { id: In(idsToFetch) } },
      relations: ['user', 'targetUser', 'targetBook'],
      order: { createdAt: 'DESC' },
      take: 20,
    });
  }
}

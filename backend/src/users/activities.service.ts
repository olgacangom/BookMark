import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Not } from 'typeorm';
import { Activity, ActivityType } from './entities/activity.entity';
import { User } from './entities/user.entity';
import { FollowStatus } from './entities/follow.entity';
import { Book } from 'src/books/entities/book.entity';
import { ActivityLike } from './entities/activity-like.entity';
import { ActivityIgnore } from './entities/activity-ignore.entity';
import { ActivityComment } from './entities/activity-comment';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';

@Injectable()
export class ActivitiesService {
  constructor(
    @InjectRepository(Activity)
    private readonly activityRepository: Repository<Activity>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(ActivityLike)
    private readonly likesRepository: Repository<ActivityLike>,
    @InjectRepository(ActivityComment)
    private readonly commentsRepository: Repository<ActivityComment>,
    @InjectRepository(ActivityIgnore)
    private readonly ignoresRepository: Repository<ActivityIgnore>,
  ) {}

  /**
   * Usuario crea una publicación
   */
  async createPost(userId: string, dto: CreateActivityDto) {
    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) throw new NotFoundException(`Usuario no encontrado`);

    const activity = new Activity();
    activity.user = user;
    activity.type = ActivityType.POST;
    activity.content = dto.content;
    activity.imageUrl = dto.imageUrl ?? null;
    activity.pollOptions = dto.pollOptions ?? null;
    activity.likesCount = 0;
    activity.commentsCount = 0;

    if (dto.bookId) {
      activity.targetBook = { id: dto.bookId } as Book;
    }

    const savedActivity = await this.activityRepository.save(activity);

    const fullActivity = await this.activityRepository.findOne({
      where: { id: savedActivity.id },
      relations: ['user', 'targetBook'],
    });

    return {
      ...fullActivity,
      isLiked: false,
      comments: [],
    };
  }

  async update(userId: string, activityId: string, dto: UpdateActivityDto) {
    const activity = await this.activityRepository.findOne({
      where: { id: activityId },
      relations: ['user', 'targetBook'],
    });

    if (!activity) throw new NotFoundException('Actividad no encontrada');
    if (activity.user.id !== userId)
      throw new ForbiddenException('No tienes permiso');

    if (dto.content !== undefined) activity.content = dto.content;
    if (dto.imageUrl !== undefined) activity.imageUrl = dto.imageUrl;
    if (dto.pollOptions !== undefined) activity.pollOptions = dto.pollOptions;

    if (dto.bookId !== undefined) {
      activity.targetBook = dto.bookId ? ({ id: dto.bookId } as Book) : null;
    }

    await this.activityRepository.save(activity);

    return this.activityRepository.findOne({
      where: { id: activityId },
      relations: ['user', 'targetBook'],
    });
  }

  async remove(userId: string, activityId: string) {
    const activity = await this.activityRepository.findOne({
      where: { id: activityId },
      relations: ['user'],
    });

    if (!activity) throw new NotFoundException(`La actividad no existe`);

    if (String(activity.user.id) !== String(userId)) {
      throw new ForbiddenException('No puedes borrar un post ajeno');
    }

    await this.activityRepository.remove(activity);
    return { success: true };
  }

  /**
   * Crea una actividad automática del sistema (FOLLOW, BOOK_ADDED, etc.)
   */
  async create(userId: string, type: ActivityType, targetId?: string) {
    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) throw new NotFoundException(`Usuario no encontrado`);

    const activity = new Activity();
    activity.user = user;
    activity.type = type;

    if (targetId) {
      if (type === ActivityType.FOLLOW) {
        activity.targetUser = { id: targetId } as User;
      } else {
        activity.targetBook = { id: Number(targetId) } as unknown as Book;
      }
    }

    return await this.activityRepository.save(activity);
  }

  /**
   * Obtiene el feed personalizado para el usuario
   */
  async getFeed(userId: string) {
    const userWithFollowing = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['followingRelations', 'followingRelations.following'],
    });

    const followingIds =
      userWithFollowing?.followingRelations
        .filter((rel) => rel.status === FollowStatus.ACCEPTED)
        .map((rel) => rel.following.id) || [];

    const idsToFetch = [...followingIds, userId];

    const ignoredRecords = await this.ignoresRepository.find({
      where: { user: { id: userId } },
      relations: ['activity'],
    });
    const ignoredIds = ignoredRecords.map((rec) => rec.activity.id);

    const activities = await this.activityRepository.find({
      where: {
        user: { id: In(idsToFetch) },
        ...(ignoredIds.length > 0 && { id: Not(In(ignoredIds)) }),
      },
      relations: [
        'user',
        'targetUser',
        'targetBook',
        'comments',
        'comments.user',
      ],
      order: { createdAt: 'DESC' },
      take: 20,
    });

    return Promise.all(
      activities.map(async (activity) => {
        const like = await this.likesRepository.findOne({
          where: { user: { id: userId }, activity: { id: activity.id } },
        });
        return {
          ...activity,
          isLiked: !!like,
          likesCount: Number(activity.likesCount) || 0,
          commentsCount: Number(activity.commentsCount) || 0,
          comments:
            activity.comments?.sort(
              (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
            ) || [],
        };
      }),
    );
  }

  async toggleLike(userId: string, activityId: string) {
    const activity = await this.activityRepository.findOne({
      where: { id: activityId },
    });
    if (!activity) throw new NotFoundException('Actividad no encontrada');

    const existingLike = await this.likesRepository.findOne({
      where: { user: { id: userId }, activity: { id: activityId } },
    });

    if (existingLike) {
      await this.likesRepository.remove(existingLike);
      activity.likesCount = Math.max(0, (activity.likesCount || 0) - 1);
    } else {
      const newLike = this.likesRepository.create({
        user: { id: userId },
        activity: activity,
      });
      await this.likesRepository.save(newLike);
      activity.likesCount = (activity.likesCount || 0) + 1;
    }

    await this.activityRepository.save(activity);
    return { liked: !existingLike, count: activity.likesCount };
  }

  async addComment(userId: string, activityId: string, text: string) {
    const activity = await this.activityRepository.findOneBy({
      id: activityId,
    });
    if (!activity) throw new NotFoundException('Actividad no encontrada');

    const comment = this.commentsRepository.create({
      text,
      user: { id: userId },
      activity: { id: activityId },
    });

    const savedComment = await this.commentsRepository.save(comment);

    activity.commentsCount = (activity.commentsCount || 0) + 1;
    await this.activityRepository.save(activity);

    return await this.commentsRepository.findOne({
      where: { id: savedComment.id },
      relations: ['user'],
    });
  }

  async ignoreActivity(userId: string, activityId: string) {
    const existingIgnore = await this.ignoresRepository.findOne({
      where: { user: { id: userId }, activity: { id: activityId } },
    });
    if (existingIgnore) return;

    const ignore = this.ignoresRepository.create({
      user: { id: userId },
      activity: { id: activityId },
    });
    await this.ignoresRepository.save(ignore);
  }
}

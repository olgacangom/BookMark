import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Club } from './entities/club.entity';
import { Thread } from './entities/thread.entity';
import { ThreadPost } from './entities/thread-post.entity';
import { User } from '../users/entities/user.entity';
import { Book } from '../books/entities/book.entity'; 

@Injectable()
export class ClubsService {
  constructor(
    @InjectRepository(Club) private clubRepo: Repository<Club>,
    @InjectRepository(Thread) private threadRepo: Repository<Thread>,
    @InjectRepository(ThreadPost) private postRepo: Repository<ThreadPost>,
    @InjectRepository(User) private userRepo: Repository<User>,
  ) {}

  async createClub(
    userId: string,
    data: { name: string; description: string; coverUrl?: string },
  ) {
    const creator = await this.userRepo.findOneBy({ id: userId });
    if (!creator) throw new NotFoundException('Usuario creador no encontrado');

    const club = this.clubRepo.create({
      name: data.name,
      description: data.description,
      coverUrl: data.coverUrl,
      creator: creator,
      members: [creator],
    });

    return this.clubRepo.save(club);
  }

  async findAllClubs() {
    return this.clubRepo.find({ relations: ['creator', 'members'] });
  }

  async findOneClub(id: string) {
    const club = await this.clubRepo.findOne({
      where: { id },
      relations: ['creator', 'members'],
    });

    if (!club) throw new NotFoundException('El club no existe');
    return club;
  }

  async joinClub(userId: string, clubId: string) {
    const club = await this.clubRepo.findOne({
      where: { id: clubId },
      relations: ['members'],
    });
    const user = await this.userRepo.findOneBy({ id: userId });

    if (!club || !user)
      throw new NotFoundException('Club o Usuario no encontrado');

    if (club.members.some((m) => m.id === userId)) return club;

    club.members.push(user);
    return this.clubRepo.save(club);
  }

  async createThread(
    clubId: string,
    data: { title: string; relatedBookId?: number },
  ) {
    const club = await this.clubRepo.findOneBy({ id: clubId });
    if (!club) throw new NotFoundException('Club no encontrado');

    const thread = this.threadRepo.create({
      title: data.title,
      club: club,
      relatedBook: data.relatedBookId
        ? ({ id: data.relatedBookId } as unknown as Book)
        : null,
    });
    return this.threadRepo.save(thread);
  }

  async findOneThread(threadId: string) {
    return this.threadRepo.findOne({
      where: { id: threadId },
      relations: ['relatedBook'],
    });
  }

  async findThreadsByClub(clubId: string) {
    return this.threadRepo.find({
      where: { club: { id: clubId } },
      relations: ['relatedBook'],
    });
  }

  async createPost(
    userId: string,
    threadId: string,
    data: { content: string; spoilerPage: number },
  ) {
    const thread = await this.threadRepo.findOneBy({ id: threadId });
    const author = await this.userRepo.findOneBy({ id: userId });

    if (!thread) throw new NotFoundException('Hilo no encontrado');
    if (!author) throw new NotFoundException('Usuario no encontrado');

    const post = this.postRepo.create({
      content: data.content,
      spoilerPage: data.spoilerPage || 0,
      author: author,
      thread: thread,
    });

    return this.postRepo.save(post);
  }

  async getThreadContent(threadId: string) {
    return this.postRepo.find({
      where: { thread: { id: threadId } },
      relations: ['author'],
      order: { createdAt: 'ASC' },
    });
  }

  async deleteClub(userId: string, clubId: string) {
    const club = await this.clubRepo.findOne({
      where: { id: clubId },
      relations: ['creator'],
    });

    if (!club) throw new NotFoundException('El club no existe');

    if (club.creator.id !== userId) {
      throw new ForbiddenException('Solo el creador puede eliminar este club');
    }

    return this.clubRepo.remove(club);
  }
}
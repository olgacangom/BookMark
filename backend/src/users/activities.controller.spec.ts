import { Test, TestingModule } from '@nestjs/testing';
import { ActivitiesController } from './activities.controller';
import { ActivitiesService } from './activities.service';
import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';

interface RequestWithUser {
  user: {
    id: string;
    email: string;
  };
}
describe('ActivitiesController', () => {
  let controller: ActivitiesController;
  let service: jest.Mocked<ActivitiesService>;

  beforeEach(async () => {
    const serviceMock = {
      createPost: jest.fn(),
      getFeed: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      toggleLike: jest.fn(),
      addComment: jest.fn(),
      ignoreActivity: jest.fn(),
      votePoll: jest.fn(),
      create: jest.fn(),
    } as unknown as jest.Mocked<ActivitiesService>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ActivitiesController],
      providers: [{ provide: ActivitiesService, useValue: serviceMock }],
    }).compile();

    controller = module.get<ActivitiesController>(ActivitiesController);
    service = module.get(ActivitiesService);
  });

  it('should call createPost with request user id and body', async () => {
    const req: RequestWithUser = {
      user: {
        id: 'user-1',
        email: 'test@test.com',
      },
    };
    const dto: CreateActivityDto = { content: 'new post' };
    await controller.create(dto, req);
    expect(service.createPost).toHaveBeenCalledWith('user-1', dto);
  });

  it('should call getFeed with request user id', async () => {
    const req: RequestWithUser = {
      user: {
        id: 'user-1',
        email: 'test@test.com',
      },
    };
    service.getFeed.mockResolvedValue([]);
    const result = await controller.getFeed(req);
    expect(result).toEqual([]);
    expect(service.getFeed).toHaveBeenCalledWith('user-1');
  });

  it('should call update with id and current user', async () => {
    const req: RequestWithUser = {
      user: {
        id: 'user-1',
        email: 'test@test.com',
      },
    };
    const dto: UpdateActivityDto = { content: 'updated' };
    await controller.update('activity-1', dto, req);
    expect(service.update).toHaveBeenCalledWith('user-1', 'activity-1', dto);
  });

  it('should call remove with id and current user', async () => {
    const req: RequestWithUser = {
      user: {
        id: 'user-1',
        email: 'test@test.com',
      },
    };
    await controller.remove('activity-1', req);
    expect(service.remove).toHaveBeenCalledWith('user-1', 'activity-1');
  });

  it('should toggle like on activity by current user', async () => {
    const req: RequestWithUser = {
      user: {
        id: 'user-1',
        email: 'test@test.com',
      },
    };
    await controller.toggleLike('activity-1', req);
    expect(service.toggleLike).toHaveBeenCalledWith('user-1', 'activity-1');
  });

  it('should add comment with correct text and user', async () => {
    const req: RequestWithUser = {
      user: {
        id: 'user-1',
        email: 'test@test.com',
      },
    };
    await controller.addComment('activity-1', 'nice post', req);
    expect(service.addComment).toHaveBeenCalledWith(
      'user-1',
      'activity-1',
      'nice post',
    );
  });

  it('should ignore activity with current user id', async () => {
    const req: RequestWithUser = {
      user: {
        id: 'user-1',
        email: 'test@test.com',
      },
    };
    await controller.ignoreActivity('activity-1', req);
    expect(service.ignoreActivity).toHaveBeenCalledWith('user-1', 'activity-1');
  });

  it('should vote poll with activity id and option index', async () => {
    const req: RequestWithUser = {
      user: {
        id: 'user-1',
        email: 'test@test.com',
      },
    };
    await controller.votePoll('activity-1', { optionIndex: 2 }, req);
    expect(service.votePoll).toHaveBeenCalledWith('activity-1', 'user-1', 2);
  });
});

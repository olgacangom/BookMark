import { Test, TestingModule } from '@nestjs/testing';
import { ActivitiesController } from './activities.controller';
import { ActivitiesService } from './activities.service';
import { jest, describe, it, expect, beforeEach } from '@jest/globals';

interface RequestWithUser {
  user: {
    id: string;
    email: string;
  };
}

type MockType<T> = {
  [P in keyof T]?: jest.Mock<any>;
};

describe('ActivitiesController', () => {
  let controller: ActivitiesController;
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ActivitiesController],
      providers: [
        {
          provide: ActivitiesService,
          useValue: {
            createPost: (jest.fn() as any).mockResolvedValue({}),
            getFeed: (jest.fn() as any).mockResolvedValue([]),
            update: (jest.fn() as any).mockResolvedValue({}),
            remove: (jest.fn() as any).mockResolvedValue({}),
            toggleLike: (jest.fn() as any).mockResolvedValue({}),
            addComment: (jest.fn() as any).mockResolvedValue({}),
            ignoreActivity: (jest.fn() as any).mockResolvedValue(undefined),
            votePoll: (jest.fn() as any).mockResolvedValue({}),
          },
        },
      ],
    }).compile();

    controller = module.get<ActivitiesController>(ActivitiesController);
    service = module.get(ActivitiesService);
  });

  it('should call createPost with request user id and body', async () => {
    const req = { user: { id: 'user-1' } } as any;
    const dto = { content: 'new post' };
    await controller.create(dto as any, req);
    expect(service.createPost).toHaveBeenCalledWith('user-1', dto);
  });

  it('should call getFeed with request user id', async () => {
    const req = { user: { id: 'user-1' } } as any;
    const result = await controller.getFeed(req);
    expect(result).toEqual([]);
    expect(service.getFeed).toHaveBeenCalledWith('user-1');
  });

  it('should call update with id and current user', async () => {
    const req = { user: { id: 'user-1' } } as any;
    const dto = { content: 'updated' };
    await controller.update('activity-1', dto as any, req);
    expect(service.update).toHaveBeenCalledWith('user-1', 'activity-1', dto);
  });

  it('should call remove with id and current user', async () => {
    const req = { user: { id: 'user-1' } } as any;
    await controller.remove('activity-1', req);
    expect(service.remove).toHaveBeenCalledWith('user-1', 'activity-1');
  });

  it('should toggle like on activity by current user', async () => {
    const req = { user: { id: 'user-1' } } as any;
    await controller.toggleLike('activity-1', req);
    expect(service.toggleLike).toHaveBeenCalledWith('user-1', 'activity-1');
  });

  it('should add comment with correct text and user', async () => {
    const req = { user: { id: 'user-1' } } as any;
    await controller.addComment('activity-1', 'nice post', req);
    expect(service.addComment).toHaveBeenCalledWith('user-1', 'activity-1', 'nice post');
  });

  it('should ignore activity with current user id', async () => {
    const req = { user: { id: 'user-1' } } as any;
    await controller.ignoreActivity('activity-1', req);
    expect(service.ignoreActivity).toHaveBeenCalledWith('user-1', 'activity-1');
  });

  it('should vote poll with activity id and option index', async () => {
    const req = { user: { id: 'user-1' } } as any;
    await controller.votePoll('activity-1', { optionIndex: 2 }, req);
    expect(service.votePoll).toHaveBeenCalledWith('activity-1', 'user-1', 2);
  });
});

import api from "../../services/api";

export enum ActivityType {
  FOLLOW = 'FOLLOW',
  BOOK_ADDED = 'BOOK_ADDED',
  BOOK_FINISHED = 'BOOK_FINISHED',
}

export interface Activity {
  id: string;
  type: ActivityType;
  createdAt: string;
  user: {
    fullName: string;
    email: string;
    avatarUrl?: string;
  };
  targetUser?: {
    fullName: string;
    avatarUrl?: string;
  };
  targetBook?: {
    id: number;
    title: string;
    authors: string[];
    thumbnail?: string;
  };
}

export const activityService = {
  getFeed: async (): Promise<Activity[]> => {
    const { data } = await api.get<Activity[]>('/activities/feed');
    return data;
  }
};
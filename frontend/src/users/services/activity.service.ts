import api from "../../services/api";

export enum ActivityType {
    FOLLOW = 'FOLLOW',
    BOOK_ADDED = 'BOOK_ADDED',
    BOOK_FINISHED = 'BOOK_FINISHED',
}

export interface Comment {
    id: string;
    text: string;
    createdAt: string;
    user: {
        id: string;
        fullName: string;
        avatarUrl?: string;
    };
}

export interface Activity {
    id: string;
    type: ActivityType;
    createdAt: string;
    user: {
        id: string;
        fullName: string;
        avatarUrl?: string;
    };
    likesCount: number;
    isLiked: boolean;
    commentsCount: number;
    comments: Comment[];
    targetUser?: {
        id: string;
        fullName: string;
        avatarUrl?: string;
    };
    targetBook?: {
        id: number;
        title: string;
        authors: string[];
        urlPortada?: string;
        rating?: number;
    };
}

export const activityService = {
    getFeed: async (): Promise<Activity[]> => {
        const { data } = await api.get<Activity[]>('/activities/feed');
        return data;
    },

    toggleLike: async (activityId: string): Promise<{ liked: boolean, count: number }> => {
        const { data } = await api.post(`/activities/${activityId}/like`);
        return data;
    }, 

    addComment: async (activityId: string, text: string): Promise<any> => {
        const { data } = await api.post(`/activities/${activityId}/comments`, { text });
        return data;
    }, 

    ignoreActivity: async (activityId: string): Promise<void> => {
        await api.post(`/activities/${activityId}/ignore`);
    }
};
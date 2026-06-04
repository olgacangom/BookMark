import api from "../../services/api";

export enum ActivityType {
    FOLLOW = 'FOLLOW',
    BOOK_ADDED = 'BOOK_ADDED',
    BOOK_FINISHED = 'BOOK_FINISHED',
    POST = 'POST',
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

export interface PollOption {
    text: string;
    votes: number;
}

export interface Poll {
    options: PollOption[];
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

    content?: string;
    imageUrl?: string;

    poll?: {
        options: {
            text: string;
            votes: number;
        }[];
    };

    selectedPollOption?: number | null;

    targetUser?: {
        id: string;
        fullName: string;
        avatarUrl?: string;
    };

    targetBook?: {
        id: number;
        title: string;
        author: string;
        urlPortada?: string;
        rating?: number;
    };
}

export const activityService = {
    getFeed: async (): Promise<Activity[]> => {
        const { data } = await api.get<Activity[]>('/activities/feed');
        return data;
    },

    createActivity: async (payload: any): Promise<Activity> => {
        const { data } = await api.post<Activity>('/activities', payload);
        return data;
    },

    updateActivity: async (
        id: string,
        payload: {
            content: string;
            imageUrl?: string | null;
            poll?: {
                options: {
                    text: string;
                    votes: number;
                }[];
            };

            selectedPollOption?: number | null;
            bookId?: number | null;
        }
    ): Promise<Activity> => {
        const { data } = await api.patch<Activity>(
            `/activities/${id}`,
            payload
        );
        return data;
    },

    deleteActivity: async (id: string): Promise<void> => {
        await api.delete(`/activities/${id}`);
    },

    toggleLike: async (
        activityId: string
    ): Promise<{ liked: boolean; count: number }> => {
        const { data } = await api.post(
            `/activities/${activityId}/like`
        );
        return data;
    },

    addComment: async (
        activityId: string,
        text: string
    ): Promise<any> => {
        const { data } = await api.post(
            `/activities/${activityId}/comments`,
            { text }
        );
        return data;
    },

    ignoreActivity: async (
        activityId: string
    ): Promise<void> => {
        await api.post(
            `/activities/${activityId}/ignore`
        );
    },

    votePoll: async (activityId: string, optionIndex: number): Promise<Activity> => {
        const { data } = await api.post<Activity>(`/activities/${activityId}/vote`, { optionIndex });
        return data;
    }
};
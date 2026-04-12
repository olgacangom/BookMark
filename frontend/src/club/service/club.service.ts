import api from "../../services/api";

export interface Club {
    id: string;
    name: string;
    description: string;
    coverUrl?: string;
    createdAt: string;
    creator: { id: string; fullName: string };
    members: { id: string }[];
    _count?: { threads: number };
}

export interface Thread {
    id: string;
    title: string;
    relatedBook?: {
        id: number;
        title: string;
        urlPortada: string;
        isbn: string;
    };
}

export interface ThreadPost {
    id: string;
    content: string;
    spoilerPage: number;
    createdAt: string;
    author: {
        id: string;
        fullName: string;
        avatarUrl?: string;
    };
}

export const clubsService = {
    createClub: async (data: { name: string; description: string }) => {
        const response = await api.post<Club>('/clubs', data);
        return response.data;
    },

    getClubs: async () => {
        const { data } = await api.get<Club[]>('/clubs');
        return data;
    },

    getClubById: async (id: string) => {
        const { data } = await api.get<Club>(`/clubs/${id}`);
        return data;
    },

    joinClub: async (id: string) => {
        const { data } = await api.post(`/clubs/${id}/join`);
        return data;
    },

    createThread: async(clubId: string, title: string, relatedBookId?: number) => {
        const { data } = await api.post<Thread>(`/clubs/${clubId}/threads`, {
            title,
            relatedBookId
        });
        return data;
    },

    getThreads: async (clubId: string) => {
        const { data } = await api.get<Thread[]>(`/clubs/${clubId}/threads`);
        return data;
    },

    getThreadById: async (threadId: string) => {
        const { data } = await api.get<Thread>(`/clubs/threads/${threadId}`);
        return data;
    },

    getPosts: async (threadId: string) => {
        const { data } = await api.get<ThreadPost[]>(`/clubs/threads/${threadId}/posts`);
        return data;
    },

    createPost: async (threadId: string, content: string, spoilerPage: number) => {
        const { data } = await api.post(`/clubs/threads/${threadId}/posts`, {
            content,
            spoilerPage
        });
        return data;
    },

    deleteClub: async (id: string) => {
        const response = await api.delete(`/clubs/${id}`);
        return response.data;
    },
};
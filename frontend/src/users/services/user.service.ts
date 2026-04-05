import api from "../../services/api";

export interface UserProfile {
  id: string;
  fullName: string;
  bio?: string;
  avatarUrl?: string;
  isPublic: boolean;
  isFollowing?: boolean;
}

export const userService = {
  getProfile: async (id: string): Promise<UserProfile> => {
    const { data } = await api.get<UserProfile>(`/users/profile/${id}`);
    return data;
  },

  follow: async (id: string): Promise<void> => {
    await api.post(`/users/follow/${id}`);
  },

  unfollow: async (id: string): Promise<void> => {
    await api.post(`/users/unfollow/${id}`);
  },

  searchUsers: async (query: string): Promise<UserProfile[]> => {
    const { data } = await api.get<UserProfile[]>(`/users/search?q=${query}`);
    return data;
  }
};
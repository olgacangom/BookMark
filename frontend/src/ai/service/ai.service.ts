import api from "../../services/api";

export const aiService = {
    sendMessage: async (prompt: string, history: any[]) => {
        const { data } = await api.post('/ai/chat', { prompt, history });
        return data;
    }
};
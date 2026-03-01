import axios from 'axios';
import { RegisterFormData, LoginFormData } from '../schemas/auth.schema';

const API_URL = `${import.meta.env.VITE_API_URL}/auth`;

export const authService = {
  register: async (data: RegisterFormData) => {
    const response = await axios.post(`${API_URL}/register`, data);
    return response.data; // Aquí recibiremos el objeto con ID y Email que vimos en Postman
  },

  login: async (data: LoginFormData) => {
    const response = await axios.post(`${API_URL}/login`, data);
    return response.data; // Aquí recibiremos el access_token
  }
};
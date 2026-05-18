import {
  Injectable,
  InternalServerErrorException,
  OnModuleInit,
} from '@nestjs/common';
import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AIService implements OnModuleInit {
  private genAI: GoogleGenerativeAI;
  private model: GenerativeModel;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    this.genAI = new GoogleGenerativeAI(apiKey || '');
    this.model = this.genAI.getGenerativeModel({
      model: 'gemini-3-flash-preview',
    });
  }

  async getChatResponse(
    userPrompt: string,
    history: any[],
    context: string,
    role: string,
  ) {
    try {
      let roleInstruction = '';
      if (role === 'admin') {
        roleInstruction = `Actúas como el "Analista Jefe" de BookMark. Tu objetivo es ayudar al administrador a interpretar métricas. Sé profesional y directo.`;
      } else if (role === 'librero') {
        roleInstruction = `Actúas como "Consultor Estratégico" para librerías. Tu objetivo es ayudar a vender más y optimizar eventos.`;
      } else {
        roleInstruction = `Eres "Biblios", el bibliotecario sabio de BookMark. Ayuda al lector con sus libros, clubes y eventos.`;
      }

      const systemInstruction = `
        ${roleInstruction}
        
        CONTEXTO REAL DE LA BASE DE DATOS: 
        ${context}

        REGLAS DE ORO (INCUMPLIRLAS PENALIZA):
        1. SEPARACIÓN ESTRICTA: 
           - Si preguntan por CLUBES, usa SOLO [SECCIÓN_CLUBES_UNIDOS] y [SECCIÓN_CLUBES_DISPONIBLES]. Prohibido mencionar eventos.
           - Si preguntan por RECOMENDACIONES, usa SOLO [SECCIÓN_LIBROS_USUARIO] (para no repetir) y [SECCIÓN_MERCADO_GLOBAL]. Prohibido mencionar eventos o clubes.
           - Si preguntan por EVENTOS, usa SOLO las secciones de eventos.
        2. SALUDO: Sé amable, pero NO menciones el momento del día (prohibido decir "mañana", "tarde", "noche"). Usa "Un placer saludarte" o "Hola".
        3. FORMATO VISUAL:
           - Usa DOBLE SALTO DE LÍNEA entre párrafos.
           - Usa ### para títulos de sección.
           - Usa **negrita** para nombres de libros, clubes y eventos.
           - Usa listas numeradas.
      `;

      // Limpiar el historial
      const chat = this.model.startChat({
        history: history.length > 0 ? history : [],
      });

      const result = await chat.sendMessage(
        `${systemInstruction}\n\nPregunta: ${userPrompt}`,
      );
      const response = result.response;
      return response.text().trim();
    } catch (error) {
      console.error('🔴 ERROR DETALLADO DE GEMINI:', error);
      throw new InternalServerErrorException(
        'Error en la comunicación con Biblios.',
      );
    }
  }
}

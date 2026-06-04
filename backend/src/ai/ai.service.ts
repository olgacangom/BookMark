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
        2. SALUDO: Si el usuario solo dice "gracias" o un saludo, responde brevemente y sin añadir análisis adicional.
        3. RESPUESTA DIRECTA:
           - Nunca menciones los nombres de las secciones en la respuesta final.
           - Si el contexto contiene los valores TOP o MENOS, responde con ellos de forma directa y clara.
           - No inventes datos ni agregues explicaciones innecesarias.
        4. MÉTRICAS DE LIBROS:
           - Si te preguntan por el libro más registrado, el menos registrado o por estadísticas de registros, usa SOLO [SECCIÓN_MERCADO_GLOBAL_TOP] y [SECCIÓN_MERCADO_GLOBAL_MENOS].
           - Para cualquier pregunta de usuarios, usa SOLO [MÉTRICAS_ADMIN_USUARIO_TOP] y [MÉTRICAS_ADMIN_USUARIO_MENOS].
           - Si se pregunta por el libro más registrado o el menos registrado, responde con los títulos, autores y totales.
        5. FORMATO VISUAL:
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
    } catch (error: unknown) {
      console.error('🔴 ERROR DETALLADO DE GEMINI:', error);

      const err = error as { message?: string; status?: number };

      const message = err?.message || '';
      const status = err?.status;

      if (status === 429 || message.includes('Quota exceeded')) {
        return 'Biblios no está disponible temporalmente por límite de cuota. Intenta de nuevo en unos segundos.';
      }

      throw new InternalServerErrorException(
        'Error en la comunicación con Biblios.',
      );
    }
  }
}

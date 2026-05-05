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
    this.model = this.genAI.getGenerativeModel(
      { model: 'gemini-3-flash-preview' },
      { apiVersion: 'v1beta' },
    );
  }

  async getChatResponse(userPrompt: string, history: any[], context: string) {
    try {
      const systemInstruction = `
            Eres "Biblios", el asistente inteligente y bibliotecario de la plataforma BookMark. 
            
            CONOCIMIENTO DE LA PLATAFORMA (CONTEXTO):
            ${context}

            TUS CAPACIDADES:
            1. ANALISTA: Si preguntan por un libro específico, usa tu conocimiento interno para decir género, estilo y de qué trata.
            2. GUÍA DE COMUNIDAD: Informa sobre Eventos y Clubes usando SOLO los datos del contexto.
            3. RECOMENDADOR: Sugiere libros que NO estén en "MI BIBLIOTECA", priorizando el "CATÁLOGO PARA INTERCAMBIO".

            REGLAS DE FORMATO:
            - Saludo corto.
            - Si das una lista de recomendaciones o eventos, usa LISTA NUMERADA con SALTOS DE LÍNEA dobles.
            - Formato de lista: "X. **Nombre** porque [explicación]."
            - Sé amable y usa un tono literario.
        `;

      const chat = this.model.startChat({ history });
      const result = await chat.sendMessage(
        `${systemInstruction}\n\nPregunta: ${userPrompt}`,
      );

      const response = result.response;

      return response.text().trim();
    } catch {
      throw new InternalServerErrorException('Error en Biblios.');
    }
  }
}

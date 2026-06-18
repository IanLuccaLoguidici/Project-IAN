import { Injectable, InternalServerErrorException, Logger, RequestTimeoutException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import axiosRetry from 'axios-retry';
import CircuitBreaker from 'opossum';

@Injectable()
export class OpenAIService {
  private readonly logger = new Logger(OpenAIService.name);
  private readonly apiKey: string;
  private readonly axiosInstance;
  private readonly breaker: CircuitBreaker;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (!this.apiKey) {
      throw new InternalServerErrorException('OpenAI API key not configured');
    }

    this.axiosInstance = axios.create({
      baseURL: 'https://api.openai.com/v1',
      timeout: 5000, // 5 segundos de timeout para la petición HTTP
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    // Configurar axios-retry con 3 reintentos y backoff exponencial
    axiosRetry(this.axiosInstance, {
      retries: 3,
      retryDelay: axiosRetry.exponentialDelay,
      onRetry: (retryCount, error) => {
        this.logger.warn(`Reintento ${retryCount} de la API externa debido al error: ${error.message}`);
      },
      retryCondition: (error) => {
        return axiosRetry.isNetworkOrIdempotentRequestError(error) || (error.response && error.response.status >= 500);
      },
    });

    // Configurar opossum Circuit Breaker
    const breakerOptions = {
      timeout: 5000, // Tiempo máximo de espera para la petición (5s)
      errorThresholdPercentage: 50, // Si falla el 50% de las peticiones, se abre
      resetTimeout: 30000, // Tiempo antes de pasar a half-open (30s)
    };

    this.breaker = new CircuitBreaker(this.executeOpenAICall.bind(this), breakerOptions);

    // Eventos del Circuit Breaker
    this.breaker.on('open', () => this.logger.warn('El Circuit Breaker está ABIERTO (Open). Se devolverá fallback temporalmente.'));
    this.breaker.on('halfOpen', () => this.logger.log('El Circuit Breaker está MEDIO ABIERTO (Half-Open). Probando la conexión...'));
    this.breaker.on('close', () => this.logger.log('El Circuit Breaker está CERRADO (Closed). Conexión normalizada.'));
    
    // Configurar el fallback
    this.breaker.fallback((description: string, error?: any) => {
      this.logger.warn('Ejecutando fallback debido a que el circuito está abierto o la petición falló.');
      
      // Si es un error de timeout, retornamos un error claro al cliente
      if (error && (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT' || error.code === 'E_TIME' || error.message?.includes('timeout'))) {
        throw new RequestTimeoutException('La petición a la API externa excedió el tiempo de espera de 5 segundos.');
      }
      
      return 'Título generado (Fallback)';
    });
  }

  /**
   * Petición interna hacia la API
   */
  private async executeOpenAICall(description: string): Promise<string> {
    try {
      const response = await this.axiosInstance.post('/chat/completions', {
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are a helpful assistant that suggests concise todo titles.' },
          { role: 'user', content: `Suggest a short todo title (max 5 words) for the following description: ${description}` },
        ],
        temperature: 0.7,
        max_tokens: 20,
      });

      const title = response.data.choices[0]?.message?.content?.trim();
      return title ?? 'Untitled';
    } catch (err) {
      this.logger.error('Error al llamar a OpenAI dentro del Circuit Breaker', err);
      throw err; // El breaker intercepta este error para contabilizarlo
    }
  }

  /**
   * Calls OpenAI to generate a concise todo title based on a description.
   * Uses Circuit Breaker and returns fallback string if it fails or is open.
   */
  async suggestTitle(description: string): Promise<string> {
    // Fire ejecuta la función envuelta en el circuit breaker
    return this.breaker.fire(description);
  }
}

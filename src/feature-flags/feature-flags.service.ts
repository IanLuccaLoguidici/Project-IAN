import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../common/redis/redis.service';

@Injectable()
export class FeatureFlagService {
  private readonly logger = new Logger(FeatureFlagService.name);
  private readonly FLAG_PREFIX = 'fflag:';

  constructor(private readonly redisService: RedisService) {}

  /**
   * Verifica si un feature flag está habilitado.
   * Si no existe en Redis, asume que está deshabilitado por defecto.
   * @param flagName Nombre del flag (ej. 'new-ui', 'beta-feature')
   */
  async isEnabled(flagName: string): Promise<boolean> {
    try {
      const cacheKey = `${this.FLAG_PREFIX}${flagName}`;
      // Esperamos un valor en Redis como 'true', '1', o JSON de boolean
      const value = await this.redisService.get<string | boolean>(cacheKey);
      
      if (value === null || value === undefined) {
        return false;
      }
      
      // Manejar valores string 'true'/'1' o booleanos reales
      return value === true || value === 'true' || value === '1';
    } catch (error) {
      this.logger.error(`Error al verificar el flag ${flagName}`, error);
      return false; // Por seguridad, si hay error con Redis, deshabilitamos la feature
    }
  }

  /**
   * (Opcional) Método para establecer un flag directamente desde código
   */
  async setFlag(flagName: string, enabled: boolean): Promise<void> {
    const cacheKey = `${this.FLAG_PREFIX}${flagName}`;
    // Guardamos el flag sin expiración (o un tiempo muy largo si es necesario)
    await this.redisService.set(cacheKey, enabled.toString(), 31536000); // 1 año
  }
}

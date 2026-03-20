import { Injectable } from '@nestjs/common';

@Injectable()
export class MetricsService {
  private cacheHits = 0;
  private cacheMisses = 0;

  incrementHit() {
    this.cacheHits++;
  }

  incrementMiss() {
    this.cacheMisses++;
  }

  getMetrics() {
    const totalRequests = this.cacheHits + this.cacheMisses;
    const hitRatio = totalRequests === 0 ? 0 : this.cacheHits / totalRequests;

    return {
      cacheHits: this.cacheHits,
      cacheMisses: this.cacheMisses,
      hitRatio: Number(hitRatio.toFixed(2)),
      totalRequests,
    };
  }
}

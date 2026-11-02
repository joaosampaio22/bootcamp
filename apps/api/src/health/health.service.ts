import { Inject, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { DATABASE_PROBE } from './database-probe.js';
import type { DatabaseProbe } from './database-probe.js';

@Injectable()
export class HealthService {
  constructor(@Inject(DATABASE_PROBE) private readonly database: DatabaseProbe) {}

  async check(): Promise<{ status: 'ok'; service: 'estudo-em-dia-api'; database: 'up' }> {
    try {
      await this.database.ping();
    } catch {
      throw new ServiceUnavailableException();
    }
    return { status: 'ok', service: 'estudo-em-dia-api', database: 'up' };
  }
}

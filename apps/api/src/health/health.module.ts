import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { HealthController } from './health.controller.js';
import { HealthService } from './health.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { DATABASE_PROBE } from './database-probe.js';
import type { DatabaseProbe } from './database-probe.js';

@Module({
  imports: [PrismaModule], controllers: [HealthController],
  providers: [HealthService, {
    provide: DATABASE_PROBE, inject: [PrismaService],
    useFactory: (prisma: PrismaService): DatabaseProbe => ({
      async ping() { await prisma.$queryRaw`SELECT 1`; }
    })
  }]
})
export class HealthModule {}

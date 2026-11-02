import { Inject, Injectable } from '@nestjs/common';
import type { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client.js';
import { ENVIRONMENT } from '../common/environment.js';
import type { Environment } from '../common/environment.js';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor(@Inject(ENVIRONMENT) environment: Environment) {
    super({ adapter: new PrismaPg({
      connectionString: environment.databaseUrl,
      connectionTimeoutMillis: 5000,
      query_timeout: 5000,
      max: 5
    }) });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}

import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service.js';
import type { Prisma } from '../generated/prisma/client.js';

@Injectable()
export class UserTransactionService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}
  run<T>(userId: string, work: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${userId}::uuid FOR UPDATE`;
      return work(tx);
    }, { maxWait: 10000, timeout: 10000 });
  }
}

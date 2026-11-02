import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service.js';
import { UserTransactionService } from './user-transaction.service.js';

@Module({ providers: [PrismaService, UserTransactionService], exports: [PrismaService, UserTransactionService] })
export class PrismaModule {}

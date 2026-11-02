import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { UserTransactionService } from '../prisma/user-transaction.service.js';
import { ClockService } from '../common/clock.service.js';
import type { CreateSubjectDto, UpdateSubjectDto } from './subject.dto.js';

function normalizedName(name: string): string { return name.normalize('NFC').toLocaleLowerCase('pt-BR'); }

@Injectable()
export class SubjectsService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService, @Inject(ClockService) private readonly clock: ClockService, @Inject(UserTransactionService) private readonly transactions: UserTransactionService) {}

  list(userId: string, archived: boolean, page: number, pageSize: number) {
    const where = { userId, archivedAt: archived ? { not: null } : null };
    return this.prisma.$transaction(async (tx) => ({
      items: await tx.subject.findMany({ where, orderBy: [{ createdAt: 'desc' }, { id: 'asc' }], skip: (page - 1) * pageSize, take: pageSize }),
      total: await tx.subject.count({ where }), page, pageSize
    }));
  }

  async get(userId: string, id: string) {
    const subject = await this.prisma.subject.findFirst({ where: { id, userId } });
    if (!subject) throw new NotFoundException();
    return subject;
  }

  private conflict(error: unknown): never {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002') throw new ConflictException('Você já possui uma disciplina ativa com esse nome.');
    throw error;
  }

  async create(userId: string, dto: CreateSubjectDto) {
    try { return await this.transactions.run(userId, (tx) => tx.subject.create({ data: { userId, name: dto.name, normalizedName: normalizedName(dto.name) } })); }
    catch (error) { this.conflict(error); }
  }

  async update(userId: string, id: string, dto: UpdateSubjectDto) {
    if (dto.name === undefined && dto.archived === undefined) throw new BadRequestException('Informe um nome ou estado de arquivamento.');
    try {
      return await this.transactions.run(userId, async (tx) => {
        const result = await tx.subject.updateMany({ where: { id, userId }, data: {
          ...(dto.name !== undefined ? { name: dto.name, normalizedName: normalizedName(dto.name) } : {}),
          ...(dto.archived !== undefined ? { archivedAt: dto.archived ? this.clock.now() : null } : {})
        } });
        if (result.count !== 1) throw new NotFoundException();
        return tx.subject.findFirstOrThrow({ where: { id, userId } });
      });
    } catch (error) { this.conflict(error); }
  }
}

import { BadRequestException, Inject, Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { UserTransactionService } from '../prisma/user-transaction.service.js';
import { ClockService } from '../common/clock.service.js';
import type { Prisma, ReturnPoint } from '../generated/prisma/client.js';
import type { CreateReturnPointDto, ReturnPointQuery, UpdateReturnPointDto } from './return-point.dto.js';

export const RETURN_INCLUDE = { subject: { select: { id: true, name: true, archivedAt: true } }, content: { select: { id: true, title: true, archivedAt: true } } } as const;
@Injectable()
export class ContinuityService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService, @Inject(UserTransactionService) private readonly transactions: UserTransactionService, @Inject(ClockService) private readonly clock: ClockService) {}
  list(userId: string, query: ReturnPointQuery) {
    const where = { userId, status: query.status };
    return this.prisma.$transaction(async (tx) => ({ items: await tx.returnPoint.findMany({ where, include: RETURN_INCLUDE, orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }], skip: (query.page - 1) * query.pageSize, take: query.pageSize }), total: await tx.returnPoint.count({ where }), page: query.page, pageSize: query.pageSize }));
  }
  async get(userId: string, id: string) {
    const point = await this.prisma.returnPoint.findFirst({ where: { userId, id }, include: RETURN_INCLUDE });
    if (!point) throw new NotFoundException(); return point;
  }
  private async links(tx: Prisma.TransactionClient, userId: string, dto: CreateReturnPointDto | UpdateReturnPointDto, existing?: ReturnPoint) {
    const contentId = dto.contentId !== undefined ? dto.contentId : existing?.contentId ?? null;
    let subjectId = dto.subjectId !== undefined ? dto.subjectId : existing?.subjectId ?? null;
    if (contentId) {
      const content = await tx.studyContent.findFirst({ where: { id: contentId, userId } });
      if (!content) throw new NotFoundException('Conteúdo não encontrado.');
      if (dto.subjectId && dto.subjectId !== content.subjectId) throw new UnprocessableEntityException('A disciplina precisa corresponder ao conteúdo.');
      subjectId = content.subjectId;
    }
    if (subjectId && !await tx.subject.findFirst({ where: { id: subjectId, userId } })) throw new NotFoundException('Disciplina não encontrada.');
    return { contentId, subjectId };
  }
  create(userId: string, dto: CreateReturnPointDto) {
    return this.transactions.run(userId, async (tx) => {
      const links = await this.links(tx, userId, dto); const now = this.clock.now();
      return tx.returnPoint.create({ data: { userId, ...links, nextAction: dto.nextAction, context: dto.context, materialUrl: dto.materialUrl ?? null, createdAt: now, updatedAt: now }, include: RETURN_INCLUDE });
    });
  }
  update(userId: string, id: string, dto: UpdateReturnPointDto) {
    if (!Object.values(dto).some((v) => v !== undefined)) throw new BadRequestException('Informe ao menos uma alteração.');
    return this.transactions.run(userId, async (tx) => {
      const existing = await tx.returnPoint.findFirst({ where: { id, userId } }); if (!existing) throw new NotFoundException();
      const links = await this.links(tx, userId, dto, existing);
      return tx.returnPoint.update({ where: { id }, data: { ...dto, ...links, updatedAt: this.clock.now() }, include: RETURN_INCLUDE });
    });
  }
}

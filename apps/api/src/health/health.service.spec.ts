import 'reflect-metadata';
import { describe, expect, it, jest } from '@jest/globals';
import { Test } from '@nestjs/testing';
import { ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { HealthService } from './health.service.js';

describe('HealthService', () => {
  async function setup() {
    const query = jest.fn<() => Promise<unknown>>();
    const module = await Test.createTestingModule({
      providers: [HealthService, { provide: PrismaService, useValue: { $queryRaw: query } }]
    }).compile();
    return { module, query, service: module.get(HealthService) };
  }

  it('confirma saúde somente depois de consultar o banco', async () => {
    const { module, query, service } = await setup();
    try {
      query.mockResolvedValue([{ '?column?': 1 }]);
      await expect(service.check()).resolves.toEqual({ status: 'ok', service: 'estudo-em-dia-api', database: 'up' });
      expect(query).toHaveBeenCalledTimes(1);
    } finally { await module.close(); }
  });

  it('retorna indisponibilidade sem expor erro do driver', async () => {
    const { module, query, service } = await setup();
    try {
      query.mockRejectedValue(new Error('postgresql://private:password@db/private'));
      await expect(service.check()).rejects.toBeInstanceOf(ServiceUnavailableException);
    } finally { await module.close(); }
  });
});

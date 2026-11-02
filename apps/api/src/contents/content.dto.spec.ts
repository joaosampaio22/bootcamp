import 'reflect-metadata';
import { describe, expect, it } from '@jest/globals';
import { ValidationPipe } from '@nestjs/common';
import { CreateContentDto, isCivilDate, UpdateContentDto } from './content.dto.js';
import { CreateReturnPointDto, UpdateReturnPointDto } from '../continuity/return-point.dto.js';
import { tomorrow } from './contents.service.js';

describe('conteúdos, URLs e datas civis', () => {
  const pipe = new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true });
  const content = { subjectId: '00000000-0000-4000-8000-000000000001', title: '  Assunto livre  ' };
  it('aplica os mínimos sem exigir nota ou link', async () => {
    expect(await pipe.transform(content, { type: 'body', metatype: CreateContentDto })).toMatchObject({ title: 'Assunto livre', notes: '', reviewEnabled: true });
    expect(await pipe.transform({ nextAction: '  Abrir o livro  ' }, { type: 'body', metatype: CreateReturnPointDto })).toMatchObject({ nextAction: 'Abrir o livro', context: '' });
  });
  it.each(['javascript:alert(1)','data:text/html,test','ftp://example.test/file','https://user:password@example.test'])('recusa link inseguro %s', async (materialUrl) => {
    await expect(pipe.transform({ ...content, materialUrl }, { type: 'body', metatype: CreateContentDto })).rejects.toThrow();
    await expect(pipe.transform({ nextAction: 'Continuar', materialUrl }, { type: 'body', metatype: CreateReturnPointDto })).rejects.toThrow();
  });
  it('aceita HTTP(S), limpa link vazio e não ativa revisão implicitamente num patch', async () => {
    expect(await pipe.transform({ ...content, materialUrl: ' https://example.test/aula ' }, { type: 'body', metatype: CreateContentDto })).toMatchObject({ materialUrl: 'https://example.test/aula' });
    expect(await pipe.transform({ materialUrl: '' }, { type: 'body', metatype: UpdateContentDto })).toMatchObject({ materialUrl: null, reviewEnabled: undefined });
    await expect(pipe.transform({ status: 'DONE' }, { type: 'body', metatype: UpdateReturnPointDto })).resolves.toMatchObject({ status: 'DONE' });
  });
  it.each([{ title: '  ' },{ notes: 'x'.repeat(10001) },{ studiedOn: '2026-02-30' },{ subjectId: null },{ reviewEnabled: 'false' },{ userId: content.subjectId },{ xp: 500 }])('recusa campos fora do contrato', async (extra) => {
    await expect(pipe.transform({ ...content, ...extra }, { type: 'body', metatype: CreateContentDto })).rejects.toThrow();
  });
  it.each([['2024-02-29',true],['2026-02-29',false],['2026-02-30',false],['2026-2-01',false],['2026-11-02',true],['0000-01-01',false]])('valida data civil %s', (date, expected) => {
    expect(isCivilDate(date)).toBe(expected);
  });
  it.each([
    ['2026-11-03T01:00:00Z','America/Sao_Paulo','2026-11-03'],
    ['2026-03-08T06:59:00Z','America/New_York','2026-03-09'],
    ['2026-03-08T07:01:00Z','America/New_York','2026-03-09'],
    ['2026-12-31T23:30:00Z','UTC','2027-01-01']
  ])('primeira revisão usa amanhã civil (%s, %s)', (instant, zone, expected) => {
    expect(tomorrow(new Date(instant), zone).toISOString().slice(0,10)).toBe(expected);
  });
});

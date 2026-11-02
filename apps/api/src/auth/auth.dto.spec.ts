import 'reflect-metadata';
import { describe, expect, it } from '@jest/globals';
import { ValidationPipe } from '@nestjs/common';
import { RegisterDto } from './auth.dto.js';
import { CreateSubjectDto, UpdateSubjectDto } from '../subjects/subject.dto.js';
import { isIanaTimeZone } from '../common/iana-time-zone.js';

describe('DTOs de entrada / RF-001, RF-010, RN-001, RN-010', () => {
  const pipe = new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true });
  const register = { name: '  Pessoa fictícia  ', email: '  EXEMPLO@EXAMPLE.TEST ', password: 'Senha fictícia de teste' };

  it('normaliza e-mail e nome sem modificar a senha e aplica fuso inicial', async () => {
    const result = await pipe.transform(register, { type: 'body', metatype: RegisterDto });
    expect(result).toEqual({ name: 'Pessoa fictícia', email: 'exemplo@example.test', password: register.password, timeZone: 'America/Sao_Paulo' });
  });

  it.each([
    { name: '   ' }, { email: 'inválido' }, { password: 'curta' },
    { password: 'x'.repeat(129) }, { timeZone: '+03:00' }, { timeZone: 'Mars/Olympus' },
    { userId: 'identidade-forjada' }, { xp: 999 }, { timeZone: null }
  ])('recusa campos inválidos e campos de autoridade do servidor', async (override) => {
    await expect(pipe.transform({ ...register, ...override }, { type: 'body', metatype: RegisterDto })).rejects.toThrow();
  });

  it('aceita nomes de disciplinas livres, sem catálogo', async () => {
    await expect(pipe.transform({ name: '  História da Arte  ' }, { type: 'body', metatype: CreateSubjectDto })).resolves.toEqual({ name: 'História da Arte' });
    await expect(pipe.transform({ name: ' ' }, { type: 'body', metatype: CreateSubjectDto })).rejects.toThrow();
    await expect(pipe.transform({ name: 'x'.repeat(81) }, { type: 'body', metatype: CreateSubjectDto })).rejects.toThrow();
  });

  it('arquivamento exige booleano real e não converte string ou null', async () => {
    await expect(pipe.transform({ archived: true }, { type: 'body', metatype: UpdateSubjectDto })).resolves.toEqual({ archived: true });
    for (const archived of ['false', null, 1]) {
      await expect(pipe.transform({ archived }, { type: 'body', metatype: UpdateSubjectDto })).rejects.toThrow();
    }
  });

  it('valida fusos IANA sem aceitar offsets ou abreviações ambíguas', () => {
    for (const zone of ['America/Sao_Paulo', 'America/Argentina/Buenos_Aires', 'Etc/GMT+3', 'UTC']) expect(isIanaTimeZone(zone)).toBe(true);
    for (const zone of ['BRT', '+03:00', 'Mars/Olympus', null]) expect(isIanaTimeZone(zone)).toBe(false);
  });
});

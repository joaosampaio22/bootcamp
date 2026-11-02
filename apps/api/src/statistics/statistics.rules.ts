import { BadRequestException } from '@nestjs/common';
import { localDate } from '../focus/focus.rules.js';
import { isCivilDate } from '../contents/content.dto.js';
import type { StatisticsQuery } from './statistics.dto.js';

export function statisticsRange(query: StatisticsQuery, now: Date, timeZone: string) {
  if ((query.from === undefined) !== (query.to === undefined)) throw new BadRequestException('Informe início e fim do período.');
  const today = localDate(now,timeZone);
  const start = new Date(today); start.setUTCDate(start.getUTCDate() - 6);
  const from = query.from ?? start.toISOString().slice(0,10);
  const to = query.to ?? today.toISOString().slice(0,10);
  if (!isCivilDate(from) || !isCivilDate(to)) throw new BadRequestException('Informe datas válidas no formato YYYY-MM-DD.');
  const days = (Date.parse(to) - Date.parse(from)) / 86400000 + 1;
  if (days < 1 || days > 366) throw new BadRequestException('Escolha um período de 1 a 366 dias.');
  return { from, to, days };
}

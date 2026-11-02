import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../auth/auth-context';
import { useRemote } from '../study/use-remote';
import { dateLabel, today } from '../study/study-types';
import { durationLabel } from './progress-types';
import type { DailyActivity, Statistics } from './progress-types';

export function StatisticsPage() {
  const [params,setParams] = useSearchParams(); const { session } = useAuth();
  const from = params.get('from') ?? ''; const to = params.get('to') ?? '';
  const query = new URLSearchParams({ ...(from ? { from } : {}), ...(to ? { to } : {}) });
  const resource = useRemote<Statistics>('/statistics/summary' + (query.size ? '?' + query.toString() : ''));
  function preset(days: number) {
    const end = today(session?.user.timeZone ?? 'America/Sao_Paulo');
    const start = new Date(end + 'T00:00:00Z'); start.setUTCDate(start.getUTCDate() - days + 1);
    setParams({ from: start.toISOString().slice(0,10), to: end });
  }
  const data = resource.data;
  return <><header className="workspace-heading"><p className="eyebrow">O ESTUDO QUE FICOU REGISTRADO</p><h1>Seu caminho em números</h1><p>Tempo, sessões e revisões para acompanhar sua prática, sem medir aprendizado ou atenção.</p></header>
    <section className="workspace-card statistics-filter"><h2>Escolha um período</h2><div className="duration-presets">{[7,30,90].map((days) => <button key={days} onClick={() => preset(days)}>{days} dias</button>)}</div><PeriodForm key={(data?.range.from ?? from) + ':' + (data?.range.to ?? to)} from={data?.range.from ?? from} to={data?.range.to ?? to} apply={(start,end) => setParams({ from: start, to: end })} /></section>
    {resource.loading ? <p role="status" className="app-loading">Consultando seus registros…</p> : resource.error ? <div className="form-error"><p role="alert">{resource.error}</p><button className="text-button" onClick={resource.reload}>Tentar novamente</button></div> : data && <StatisticsResults key={data.range.from + data.range.to + data.timeZone} data={data} />}
  </>;
}
function PeriodForm({ from,to,apply }: { from: string; to: string; apply: (from: string,to: string) => void }) {
  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const data = new FormData(event.currentTarget); apply(String(data.get('from')),String(data.get('to'))); }
  return <form className="app-form period-form" onSubmit={submit}><label>De<input type="date" name="from" defaultValue={from} required /></label><label>Até<input type="date" name="to" defaultValue={to} required /></label><button className="app-button">Aplicar período</button><small>Inclui as duas datas, até 366 dias por consulta.</small></form>;
}
function StatisticsResults({ data }: { data: Statistics }) {
  const [selected,setSelected] = useState<DailyActivity | null>(null);
  const { metrics,daily } = data;
  const maximum = Math.max(1,...daily.map((day) => day.focusSeconds));
  return <><p className="statistics-period">De {dateLabel(data.range.from)} a {dateLabel(data.range.to)} · Fuso: {data.timeZone}</p><div className="progress-metrics"><article className="workspace-card"><p>Tempo registrado</p><strong>{durationLabel(metrics.focusSeconds)}</strong><span>Foco concluído ou interrompido</span></article><article className="workspace-card"><p>Sessões finalizadas</p><strong>{metrics.finishedSessions}</strong><span>{metrics.completedSessions} {metrics.completedSessions === 1 ? 'concluída' : 'concluídas'} · {metrics.interruptedSessions} {metrics.interruptedSessions === 1 ? 'interrompida' : 'interrompidas'}</span></article><article className="workspace-card"><p>Revisões realizadas</p><strong>{metrics.reviewCount}</strong><span>Autoavaliações confirmadas</span></article><article className="workspace-card"><p>Dias com estudo</p><strong>{metrics.daysWithStudy}</strong><span>Ao menos um foco de 5 min no dia</span></article></div>
    {!metrics.finishedSessions && !metrics.reviewCount && <section className="workspace-card empty-state"><h2>Seu próximo registro pode começar hoje.</h2><p>Ainda não há sessões finalizadas ou revisões neste período.</p><Link className="text-button" to="/app/focus">Começar um foco</Link></section>}
    <section className="workspace-card"><h2>Foco ao longo dos dias</h2><p className="focus-caption">Selecione um dia para consultar os registros. O tempo continua contando quando o teto de XP é atingido.</p><div className="activity-chart" role="group" aria-label="Gráfico de tempo registrado por dia"><div className="activity-bars" style={{ minWidth: Math.max(280,daily.length * 36) }}>{daily.map((day) => <button key={day.date} className="activity-day" aria-pressed={selected?.date === day.date} aria-label={dateLabel(day.date) + ': ' + durationLabel(day.focusSeconds)} onClick={() => setSelected(day)}><span className="activity-track"><span style={{ height: `${day.focusSeconds / maximum * 100}%` }} /></span><span>{dateLabel(day.date).slice(0,5)}</span></button>)}</div></div>
      <p className="activity-selection" role="status">{selected ? `${dateLabel(selected.date)} · ${durationLabel(selected.focusSeconds)} · ${selected.finishedSessions} ${selected.finishedSessions === 1 ? 'sessão finalizada' : 'sessões finalizadas'} · ${selected.reviewCount} ${selected.reviewCount === 1 ? 'revisão' : 'revisões'}` : 'Nenhum dia selecionado.'}</p>
      <details className="daily-details"><summary>Ver dados por dia em tabela</summary><div className="table-scroll"><table><caption>Registros diários no fuso do perfil</caption><thead><tr><th scope="col">Dia</th><th scope="col">Tempo de foco</th><th scope="col">Sessões</th><th scope="col">Revisões</th></tr></thead><tbody>{daily.map((day) => <tr key={day.date}><th scope="row">{dateLabel(day.date)}</th><td>{durationLabel(day.focusSeconds)}</td><td>{day.finishedSessions}</td><td>{day.reviewCount}</td></tr>)}</tbody></table></div></details>
    </section><p className="focus-caption">Sessões em andamento, pausadas, pendentes ou descartadas não entram nestes totais. Datas são agrupadas pelo fuso atual do perfil; os dias de XP no extrato preservam o fuso usado ao concedê-lo.</p>
  </>;
}

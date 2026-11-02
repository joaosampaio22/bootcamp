import { ConnectionStatus } from '../components/ConnectionStatus';
import { StudyIllustration } from '../components/StudyIllustration';
import { ArrowIcon } from '../components/ArrowIcon';

const principles = [
  { number: '01', title: 'O seu conteúdo', text: 'Livros, aulas, cursos ou projetos. Um espaço para qualquer assunto que você escolher.' },
  { number: '02', title: 'O seu próximo passo', text: 'Guardar onde você parou para voltar com clareza, mesmo depois de uma pausa.' },
  { number: '03', title: 'O seu ritmo', text: 'Revisões e progresso sem cobranças por dias ausentes. Um passo de cada vez.' }
];

export function App() {
  return (
    <div className="page-shell">
      <a className="skip-link" href="#conteudo">Pular para o conteúdo</a>
      <header className="site-header">
        <a className="brand" href="/" aria-label="Estudo em Dia — início">
          <span className="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 32 32" fill="none"><path d="M5 7h6c3 0 5 2 5 2s2-2 5-2h6v17h-6c-3 0-5 2-5 2s-2-2-5-2H5V7Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /><path d="M16 9v17" stroke="currentColor" strokeWidth="1.8" /></svg>
          </span>
          <span>estudo<span className="brand-light">em</span>dia<span className="brand-period">.</span></span>
        </a>
        <nav className="flex items-center gap-5" aria-label="Acesso"><a className="about-link" href="/login">Entrar</a><a className="primary-link" style={{ marginTop: 0 }} href="/register">Criar conta <ArrowIcon /></a></nav>
      </header>

      <main id="conteudo">
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero-copy">
            <span className="eyebrow"><span aria-hidden="true" className="eyebrow-line" /> UM PASSO DE CADA VEZ</span>
            <h1 id="hero-title">Estudar é um caminho.<br /><span>Encontre o seu ritmo.</span></h1>
            <p className="hero-description">Um espaço para estudar o que quiser, lembrar onde parou e continuar com mais leveza.</p>
            <div className="development-note">
              <span className="development-icon" aria-hidden="true">✳</span>
              <div>
                <p className="development-title">Seu espaço está em construção</p>
                <p className="development-description">Cadastro e disciplinas já estão disponíveis. Sessões de foco, revisões e Academia Viva chegam nas próximas etapas.</p>
              </div>
            </div>
            <a className="primary-link" href="#projeto">Veja o que vem por aí <ArrowIcon down /></a>
          </div>
          <div className="hero-art">
            <div className="art-label"><span aria-hidden="true">✦</span> Pequenos passos. Novos caminhos.</div>
            <StudyIllustration />
            <div className="art-caption"><span aria-hidden="true" /> FEITO PARA O SEU JEITO DE APRENDER</div>
          </div>
        </section>

        <section id="projeto" className="principles" aria-labelledby="principles-title">
          <div className="principles-heading">
            <h2 id="principles-title">Menos atrito. Mais continuidade.</h2>
            <span>O QUE ESTAMOS CONSTRUINDO</span>
          </div>
          <div className="principle-grid">
            {principles.map((principle) => (
              <article className="principle" key={principle.number}>
                <span className="principle-number">{principle.number}</span>
                <h3>{principle.title}</h3>
                <p>{principle.text}</p>
              </article>
            ))}
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <p>Estudo em Dia <span aria-hidden="true">·</span> Feito para continuar.</p>
        <ConnectionStatus />
      </footer>
    </div>
  );
}

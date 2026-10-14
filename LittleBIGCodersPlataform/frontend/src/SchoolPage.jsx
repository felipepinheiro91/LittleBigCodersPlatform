import React from "react";

const proposal = name => `/landing/proposal/${name}.webp`;
const whatsapp = "https://wa.me/5575981223074";
export function SchoolPage() {
  return <div className="lbc-school-proposal">
    <section className="lbc-school-section lbc-school-yellow" data-source-slide="2"><div className="lbc-container lbc-school-grid">
      <div><h1>A escola precisa <span>agir agora!</span></h1><p className="lbc-school-lead">Ensinar tecnologia deixou de ser apenas uma atividade extracurricular.</p><ul className="lbc-school-reasons"><li>Estudantes vivem entre algoritmos, IA e redes digitais</li><li>Famílias buscam escolas que preparem para o futuro</li><li>Currículos precisam tratar tecnologia com continuidade</li></ul><p className="lbc-school-callout">A questão não é mais se a escola ensinará Computação, mas como fará isso com qualidade.</p></div>
      <img className="lbc-school-photo" src={proposal("school-urgency")} alt="Estudante explorando tecnologia com celular e fones de ouvido" fetchPriority="high" />
    </div></section>

    <section className="lbc-school-section lbc-school-blue" data-source-slide="3" id="curriculo"><div className="lbc-container">
      <h2>Computação já é <span>responsabilidade curricular</span></h2>
      <ol className="lbc-curriculum-timeline"><li><span>2022</span><h3>BNCC Computação</h3></li><li><span>2023</span><h3>Política Nacional de Educação Digital</h3></li><li><span>2025</span><h3>Educação Digital e Midiática</h3></li></ol>
      <h3 className="lbc-curriculum-axis-title">Três eixos da BNCC Computação</h3><ul className="lbc-curriculum-axes"><li>🧠 Pensamento Computacional</li><li>💻 Mundo Digital</li><li>🤝 Cultura Digital</li></ul>
      <div className="lbc-curriculum-message"><p>Adequação não precisa ser burocracia: pode virar diferencial pedagógico.</p><p>A Little BIG Coders ajuda a transformar a exigência em uma proposta completa.</p></div><p className="lbc-curriculum-sources">Fontes: Resolução CNE/CEB nº 1/2022; Lei nº 14.533/2023; Resolução CNE/CEB nº 2/2025.</p>
    </div></section>

    <section className="lbc-school-section lbc-school-navy" data-source-slide="5"><div className="lbc-container lbc-school-grid">
      <img className="lbc-school-diagram" src={proposal("program-diagram")} alt="Little BIG Coders conecta programação, robótica, eletrônica, jogos e inteligência artificial" loading="lazy" /><div><h2>Um programa completo para implantar <span>Computação como disciplina regular</span></h2></div>
    </div></section>

    <section className="lbc-school-section lbc-school-lilac" data-source-slide="6"><div className="lbc-container">
      <img className="lbc-school-books" src="/landing/school-books.webp" alt="Coleção de livros Little BIG Coders do Ensino Fundamental" loading="lazy" />
      <h2>A escola recebe currículo, materiais, suporte pedagógico e acompanhamento, <span>sem precisar criar tudo do zero.</span></h2>
      <ul className="lbc-school-offerings"><li><span aria-hidden="true">📘</span>Livros dos estudantes</li><li><span aria-hidden="true">🤖</span>Kits de robótica</li><li><span aria-hidden="true">🏅</span>Challenge com certificados e medalhas</li></ul>
      <p className="lbc-school-attendance">Atendimento: Ensino Fundamental I e II, com uma aula semanal de 50 minutos.</p>
    </div></section>

    <section className="lbc-school-section lbc-school-yellow" data-source-slide="9"><div className="lbc-container">
      <h2>O que a sua escola <span>ganha?</span></h2><ul className="lbc-school-benefits">{["Adequação às novas demandas curriculares", "Diferencial pedagógico percebido pelas famílias", "Projetos e experiências que valorizam a marca da escola", "Suporte para o corpo docente"].map(text => <li key={text}><span aria-hidden="true">✓</span>{text}</li>)}</ul>
    </div></section>

    <section className="lbc-school-section lbc-school-navy" data-source-slide="10"><div className="lbc-container lbc-school-grid">
      <div><h2>Aproveite a estrutura <span>que já existe</span></h2><ul className="lbc-school-steps"><li>A implantação começa com uma avaliação da estrutura disponível.</li><li>Não é necessário montar um laboratório sofisticado.</li><li>A escola pode aproveitar os professores da instituição.</li><li>O planejamento é construído com os professores para fazer sentido na realidade da escola.</li></ul></div>
      <img className="lbc-school-photo classroom" src={proposal("school-classroom")} alt="Professora e estudantes usando materiais e projetos de Computação em sala de aula" loading="lazy" />
    </div></section>

    <section className="lbc-school-section lbc-school-cyan" data-source-slide="11"><div className="lbc-container">
      <h2>A Little BIG Coders reduz o <span>trabalho operacional da escola</span></h2>
      <div className="lbc-school-responsibilities"><article><h3>Entregamos</h3><ul><li>Currículo, livros e kits</li><li>Planejamento e suporte</li><li>Challenge, rubricas e apoio a eventos</li></ul></article><article><h3>Você organiza</h3><ul><li>Horários da disciplina</li><li>Espaço e computadores</li><li>Corpo docente e comunicação com famílias</li></ul></article></div>
      <p className="lbc-school-callout">Implantação simples, com mínimo impacto na rotina administrativa da escola.</p>
    </div></section>

    <section className="lbc-school-section lbc-school-navy" data-source-slide="15"><div className="lbc-container lbc-school-grid">
      <div><h2>Descubra como a Computação pode <span>funcionar na sua escola</span></h2><p className="lbc-school-lead">Em uma conversa de 30 minutos, analisamos a estrutura disponível, anos atendidos, professores, número de estudantes e investimento necessário.</p><a className="lbc-button lbc-school-schedule" href={whatsapp} target="_blank" rel="noopener noreferrer">Agende uma conversa sem compromisso ↗</a></div>
      <img className="lbc-school-diagram" src={proposal("program-diagram")} alt="Programa Little BIG Coders para o ensino de Computação" loading="lazy" />
    </div></section>
  </div>;
}

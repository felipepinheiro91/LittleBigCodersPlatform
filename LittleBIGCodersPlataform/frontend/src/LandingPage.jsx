import React, { useEffect, useRef, useState } from "react";
import "./landing.css";

const asset = name => `/landing/${name}.webp`;
function WhatsAppIcon() { return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M20.5 11.6a8.6 8.6 0 0 1-12.8 7.5L3 20.5l1.4-4.6A8.6 8.6 0 1 1 20.5 11.6Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" /><path d="m8.2 7.5 1.4 2.3-.9 1c.7 1.6 1.8 2.7 3.5 3.4l1-.9 2.3 1.3c.3.2.4.5.2.8-.5.8-1.2 1.2-2 1.1-3.7-.5-6.8-3.5-7.2-7.1-.1-.8.3-1.5 1-2 .3-.2.5-.2.7.1Z" fill="currentColor" /></svg>; }
function Arrow({ diagonal = false }) { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d={diagonal ? "M6 18 18 6M6 6h12v12" : "M4 12h16m-6-6 6 6-6 6"} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>; }
const subjects = ["Programação", "Eletrônica", "Robótica", "Inteligência Artificial", "Criação de sites", "Ética e tecnologia", "Jogos e animações", "Informática"];
const courses = [
  { image: "first-steps", age: "A partir dos 7 anos", title: "Primeiros Passos na Computação", text: "Livro para desenvolver habilidades associadas ao letramento digital e Pensamento Computacional.", href: "https://www.littlebigcoders.com/homeschool" },
  { image: "programming", age: "A partir dos 8 anos", title: "Algoritmos e Programação", text: "Livro para desenvolver a lógica e a programação de computadores, por meio da criação de jogos e animações, com a plataforma Scratch.", href: "https://www.littlebigcoders.com/homeschool" },
  { image: "robotics", age: "A partir dos 10 anos", title: "Aprender para Criar", text: "Livro que trabalha eletrônica e robótica com Arduino. Os estudantes conhecem os principais componentes eletrônicos e desenvolvem circuitos que possam ser programados.", href: "https://www.littlebigcoders.com/homeschool" },
];

function publicPage() {
  const hash = window.location.hash;
  if (hash === "#/escolas" || hash === "#escolas") return "escolas";
  if (hash === "#/familias" || hash === "#homeschool") return "familias";
  return "inicio";
}

export function LandingPage() {
  const [page, setPage] = useState(publicPage);
  useEffect(() => {
    const update = () => {
      setPage(publicPage());
      if (["", "#/", "#/escolas", "#/familias", "#escolas", "#homeschool"].includes(window.location.hash)) window.scrollTo({ top: 0, behavior: "instant" });
    };
    window.addEventListener("hashchange", update);
    return () => window.removeEventListener("hashchange", update);
  }, []);
  useEffect(() => {
    document.title = `${page === "escolas" ? "Para escolas" : page === "familias" ? "Para famílias" : "Educação em Computação"} | Little BIG Coders`;
  }, [page]);
  const [menuOpen, setMenuOpen] = useState(false);
  const landingRef = useRef(null);
  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const animations = new Set();
    const observer = new IntersectionObserver(entries => {
      if (reducedMotion.matches) return;
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const heading = entry.target.querySelector("h2");
        if (!heading) return;
        const animation = heading.animate([{ opacity: .55, transform: "translateY(18px)" }, { opacity: 1, transform: "translateY(0)" }], { duration: 550, easing: "cubic-bezier(.22,1,.36,1)" });
        animations.add(animation);
        animation.onfinish = () => animations.delete(animation);
      });
    }, { rootMargin: "-100px 0px -10% 0px", threshold: 0 });
    landingRef.current.querySelectorAll("section[id]").forEach(section => observer.observe(section));
    return () => { observer.disconnect(); animations.forEach(animation => animation.cancel()); };
  }, [page]);
  function navigateSection(event) {
    const link = event.target.closest("a[href^='#']");
    if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const hash = link.getAttribute("href");
    if (hash.startsWith("#/")) return;
    const target = landingRef.current.querySelector(hash);
    if (!target) return;
    event.preventDefault();
    setMenuOpen(false);
    const address = page === "inicio" ? hash : `#/${page}`;
    if (window.location.hash !== address) window.history.pushState(null, "", address);
    target.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth", block: "start" });
    target.setAttribute("tabindex", "-1");
    target.focus({ preventScroll: true });
  }
  useEffect(() => {
    if (!menuOpen) return;
    const close = event => { if (event.key === "Escape") setMenuOpen(false); };
    document.addEventListener("keydown", close);
    return () => document.removeEventListener("keydown", close);
  }, [menuOpen]);
  return <div className="lbc-landing" ref={landingRef} onClick={navigateSection}>
    <a className="lbc-skip" href="#conteudo">Ir para o conteúdo</a>
    <header className="lbc-header">
      <div className="lbc-header-inner">
        <a className="lbc-brand" href="#/" aria-label="Little BIG Coders — início"><img src={asset("logo")} alt="Little BIG Coders" width="405" height="176" /></a>
        <nav className={`lbc-nav ${menuOpen ? "is-open" : ""}`} id="landing-navigation" aria-label="Navegação do site">
          {[["#/", "Início"], ["#/escolas", "Para escolas"], ["#/familias", "Para famílias"], ...(page === "inicio" ? [["#abordagem", "Nossa abordagem"]] : []), ["#contato", "Contato"]].map(([href, text]) => <a key={href} href={href} aria-current={href === `#/${page === "inicio" ? "" : page}` ? "page" : undefined} onClick={() => setMenuOpen(false)}>{text}</a>)}
        </nav>
        <div className="lbc-header-actions"><button className="lbc-menu-toggle" type="button" aria-label={menuOpen ? "Fechar menu" : "Abrir menu"} aria-expanded={menuOpen} aria-controls="landing-navigation" onClick={() => setMenuOpen(current => !current)}>{menuOpen ? "✕" : "☰"}</button><a className="lbc-login" href="#login">Login <Arrow /></a></div>
      </div>
    </header>
    <main id="conteudo" key={page} className="lbc-page-content">
      {page === "inicio" && <><div className="lbc-hero-band"><section className="lbc-hero lbc-container" aria-labelledby="hero-title">
        <div className="lbc-hero-copy"><p className="lbc-eyebrow"><span /> EDUCAÇÃO EM COMPUTAÇÃO</p><h1 id="hero-title">Aqui aprender sobre <span>tecnologia</span> é simples, divertido e acessível!</h1><p className="lbc-hero-description">Recursos educacionais para o ensino de Computação na sala de estar e na sala de aula.</p><div className="lbc-actions"><a className="lbc-button lbc-button-dark" href="#/escolas">Para minha escola <Arrow /></a><a className="lbc-text-link" href="#/familias">Para minha família <Arrow diagonal /></a></div><div className="lbc-hero-note"><span className="lbc-note-icon" aria-hidden="true">&lt;/&gt;</span><p>Ensino Fundamental I e II<br /><strong>Estudantes entre 7 e 14 anos</strong></p></div></div>
        <div className="lbc-hero-visual"><div className="lbc-photo-frame"><img src={asset("hero")} alt="Crianças explorando a tecnologia juntas, com computadores e robótica" width="1800" height="1200" fetchPriority="high" /></div><div className="lbc-photo-caption"><span aria-hidden="true">✦</span> Preparando os estudantes para um mundo repleto de tecnologia!</div></div>
      </section></div>
      <div className="lbc-subject-strip"><div className="lbc-container">{["Pensamento Computacional", "Programação", "Robótica", "Criatividade"].map(subject => <span key={subject}><span aria-hidden="true">✦</span>{subject}</span>)}</div></div>

      <div className="lbc-why-band"><section className="lbc-why lbc-container" id="por-que" aria-labelledby="why-title"><div className="lbc-section-heading"><p className="lbc-eyebrow">01 / DESCOBRIR</p><h2 id="why-title">Por que aprender<br /><span>Computação?</span></h2></div><div className="lbc-why-grid"><div className="lbc-why-image"><img src={asset("why-computing")} alt="Estudante aprendendo Computação com um projeto de robótica" width="1800" height="1000" loading="lazy" /></div><div className="lbc-why-copy"><span className="lbc-large-symbol" aria-hidden="true">&lt;/&gt;</span><h3>Produzir tecnologia.<br />Além de consumi-la.</h3><p>A aprendizagem de Computação torna os jovens capazes de produzir tecnologia, além de consumi-la de maneira consciente!</p><a className="lbc-text-link" href="https://www.littlebigcoders.com/por-que-aprender-computa%C3%A7%C3%A3o">Saiba mais <Arrow diagonal /></a></div></div></section></div>

      <section className="lbc-approach" id="abordagem" aria-labelledby="approach-title"><div className="lbc-container lbc-approach-grid"><div className="lbc-approach-art"><img src={asset("approach")} alt="Programação, robótica, jogos, eletrônica e inteligência artificial conectados ao Pensamento Computacional" width="687" height="671" loading="lazy" /></div><div><p className="lbc-eyebrow">02 / NOSSA ABORDAGEM</p><h2 id="approach-title">Uma abordagem baseada em <span>conceitos e contextos.</span></h2><p>Currículo abrangente para a aprendizagem de Computação no Ensino Fundamental I e II (estudantes entre 7 e 14 anos). Conteúdos que preparam os estudantes para um mundo repleto de tecnologia.</p><ul className="lbc-subjects">{subjects.map((subject, index) => <li key={subject}><span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>{subject}</li>)}</ul><a className="lbc-text-link" href="https://www.littlebigcoders.com/abordagem-littlebigcoders">Conheça a nossa abordagem <Arrow diagonal /></a></div></div></section></>}

      {page === "escolas" && <div className="lbc-schools-band"><section className="lbc-schools lbc-container" id="escolas" aria-labelledby="schools-title"><a className="lbc-text-link lbc-page-back" href="#/">← Voltar ao início</a><div className="lbc-section-heading"><p className="lbc-eyebrow">03 / NA SALA DE AULA</p><h1 id="schools-title">Computação integrada ao<br /><span>currículo da sua escola.</span></h1><p>Abordagem completa para o ensino de Computação no Ensino Fundamental I e II. Com conexão à BNCC de Computação.</p></div><div className="lbc-schools-grid"><div className="lbc-school-art"><img src={asset("school-books")} alt="Coleção de livros de Computação Little BIG Coders para o Ensino Fundamental" width="1280" height="772" loading="lazy" /><span>Material impresso + plataforma digital</span></div><div className="lbc-school-details"><article><span className="lbc-detail-number">01</span><h3>Material Didático</h3><p>Livro impresso e Plataforma com conteúdo digital com videoaulas, jogos e atividades. Os estudantes aprendem na sala de aula e em casa!</p></article><article><span className="lbc-detail-number">02</span><h3>Assessoria</h3><p>Assessoria pedagógica, para implantação e continuidade do projeto. Reuniões regulares para auxílio no planejamento e condução das aulas.</p></article><a className="lbc-button lbc-button-dark" href="mailto:littlebigcoders@gmail.com?subject=Quero%20ser%20uma%20escola%20parceira">Seja uma escola parceira <Arrow /></a></div></div></section></div>}

      {page === "familias" && <section className="lbc-homeschool" id="homeschool" aria-labelledby="home-title"><div className="lbc-container"><a className="lbc-text-link lbc-page-back" href="#/">← Voltar ao início</a><div className="lbc-home-heading"><div><p className="lbc-eyebrow">04 / NA SALA DE ESTAR</p><h1 id="home-title">Homeschool<br /><span>com confiança.</span></h1></div><p>Com a Little BIG Coders você pode introduzir a Computação como um tópico regular de estudos, respeitando o ritmo de aprendizagem e os interesses pessoais dos seus filhos.</p></div><div className="lbc-course-heading"><h3>Trilha de aprendizagem</h3><p>Três materiais que introduzem o estudante ao universo da Computação.</p></div><div className="lbc-courses">{courses.map((course, index) => <article className="lbc-course" key={course.title}><a href={course.href} className="lbc-course-image" aria-label={`Saiba mais sobre ${course.title}`}><img src={asset(course.image)} alt={`Ilustração do livro ${course.title}`} width="600" height="340" loading="lazy" /></a><div className="lbc-course-meta"><span>{String(index + 1).padStart(2, "0")}</span><span>{course.age}</span></div><h3>{course.title}</h3><p>{course.text}</p><a className="lbc-text-link" href={course.href}>Saiba mais <Arrow diagonal /></a></article>)}</div><div className="lbc-home-support"><img src={asset("learning-contexts")} alt="Computação em casa e na escola, com projetos e atividades práticas" width="834" height="653" loading="lazy" /><div><h3>Na sala de estar e na sala de aula.</h3><p>Todos os materiais promovem Educação em Computação em casa, usando livros didáticos, videoaulas, jogos e muito mais!</p><a className="lbc-text-link" href="https://www.littlebigcoders.com/homeschool">Conheça o homeschool <Arrow diagonal /></a></div></div></div></section>}

      <div className="lbc-contact-band"><section className="lbc-contact lbc-container" id="contato" aria-labelledby="contact-title"><div><p className="lbc-eyebrow">VAMOS CONVERSAR?</p><h2 id="contact-title">Agende uma conversa<br /><span>sem compromisso.</span></h2></div><div className="lbc-contact-details"><a className="lbc-contact-email" href="mailto:littlebigcoders@gmail.com">littlebigcoders@gmail.com <Arrow diagonal /></a><a className="lbc-contact-whatsapp" href="https://wa.me/5575981223074" target="_blank" rel="noopener noreferrer"><WhatsAppIcon /> Fale conosco</a><div className="lbc-socials"><a href="https://www.facebook.com/littleBIGcoders" target="_blank" rel="noopener noreferrer">Facebook <Arrow diagonal /></a><a href="https://www.instagram.com/littlebigcoders/" target="_blank" rel="noopener noreferrer">Instagram <Arrow diagonal /></a><a href="https://www.youtube.com/channel/UC7KWerMUGfo_sCzjQq429mA" target="_blank" rel="noopener noreferrer">YouTube <Arrow diagonal /></a></div></div></section></div>
    </main>
    <footer className="lbc-footer"><div className="lbc-container"><a className="lbc-brand" href="#/" aria-label="Voltar ao início"><img src={asset("logo")} alt="Little BIG Coders" width="405" height="176" loading="lazy" /></a><p>Copyright © 2022 LittleBIGCoders<br />Todos os direitos reservados.</p><a href="#login">Já é aluno(a) ou parceiro(a)? <strong>Login <Arrow /></strong></a></div></footer>
  </div>;
}

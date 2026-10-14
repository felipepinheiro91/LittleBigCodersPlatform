import React, { useEffect, useRef, useState } from "react";
import "./landing.css";
import legacyContent from "./legacyContent.json";
import { LegacyPage } from "./LegacyPage";
import { SchoolPage } from "./SchoolPage";
import { ContactPage } from "./ContactPage";

const asset = name => `/landing/${name}.webp`;
function WhatsAppIcon() { return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M20.5 11.6a8.6 8.6 0 0 1-12.8 7.5L3 20.5l1.4-4.6A8.6 8.6 0 1 1 20.5 11.6Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" /><path d="m8.2 7.5 1.4 2.3-.9 1c.7 1.6 1.8 2.7 3.5 3.4l1-.9 2.3 1.3c.3.2.4.5.2.8-.5.8-1.2 1.2-2 1.1-3.7-.5-6.8-3.5-7.2-7.1-.1-.8.3-1.5 1-2 .3-.2.5-.2.7.1Z" fill="currentColor" /></svg>; }
function Arrow({ diagonal = false }) { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d={diagonal ? "M6 18 18 6M6 6h12v12" : "M4 12h16m-6-6 6 6-6 6"} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>; }
const subjects = ["Programação", "Eletrônica", "Robótica", "Inteligência Artificial", "Criação de sites", "Ética e tecnologia", "Jogos e animações", "Informática"];


function publicPage() {
  const hash = window.location.hash;
  if (hash === "#/escolas" || hash === "#escolas") return "escolas";
  if (hash === "#/familias" || hash === "#homeschool") return "familias";
  const route = hash.replace(/^#\//, "");
  if (["sobre", "porque", "abordagem", "contato"].includes(route)) return route;
  return "inicio";
}

export function LandingPage() {
  const [page, setPage] = useState(publicPage);
  useEffect(() => {
    const update = () => {
      setPage(publicPage());
      if (["", "#/", "#/escolas", "#/familias", "#escolas", "#homeschool", "#/sobre", "#/porque", "#/abordagem", "#/contato"].includes(window.location.hash)) window.scrollTo({ top: 0, behavior: "instant" });
    };
    window.addEventListener("hashchange", update);
    return () => window.removeEventListener("hashchange", update);
  }, []);
  useEffect(() => {
    document.title = `${page === "escolas" ? "Para escolas" : page === "familias" ? "Para famílias" : ({ sobre: "Sobre nós", porque: "Por que aprender Computação?", abordagem: "Nossa abordagem", contato: "Contato" }[page] || "Educação em Computação")} | Little BIG Coders`;
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
          {[["#/", "Início"], ["#/escolas", "Para escolas"], ["#/familias", "Para famílias"], ["#/abordagem", "Nossa abordagem"], ["#/sobre", "Sobre nós"], ["#/contato", "Contato"]].map(([href, text]) => <a key={href} href={href} aria-current={href === `#/${page === "inicio" ? "" : page}` ? "page" : undefined} onClick={() => setMenuOpen(false)}>{text}</a>)}
        </nav>
        <div className="lbc-header-actions"><button className="lbc-menu-toggle" type="button" aria-label={menuOpen ? "Fechar menu" : "Abrir menu"} aria-expanded={menuOpen} aria-controls="landing-navigation" onClick={() => setMenuOpen(current => !current)}>{menuOpen ? "✕" : "☰"}</button><a className="lbc-login" href="#login">Login <Arrow /></a></div>
      </div>
    </header>
    <main id="conteudo" key={page} className="lbc-page-content">
      {page === "inicio" && <><div className="lbc-hero-band"><section className="lbc-hero lbc-container" aria-labelledby="hero-title">
        <div className="lbc-hero-copy"><h1 id="hero-title">Aqui aprender sobre <span>tecnologia</span> é simples, divertido e acessível!</h1><p className="lbc-hero-description">Recursos educacionais para o ensino de Computação na sala de estar e na sala de aula.</p><div className="lbc-actions"><a className="lbc-button lbc-button-dark" href="#/escolas">Para minha escola <Arrow /></a><a className="lbc-text-link" href="#/familias">Para minha família <Arrow diagonal /></a></div><div className="lbc-hero-note"><span className="lbc-note-icon" aria-hidden="true">&lt;/&gt;</span><p>Ensino Fundamental I e II<br /><strong>Estudantes entre 7 e 14 anos</strong></p></div></div>
        <div className="lbc-hero-visual"><div className="lbc-photo-frame"><img src={asset("hero")} alt="Crianças explorando a tecnologia juntas, com computadores e robótica" width="1800" height="1200" fetchPriority="high" /></div><div className="lbc-photo-caption"><span aria-hidden="true">✦</span> Preparando os estudantes para um mundo repleto de tecnologia!</div></div>
      </section></div>
      <div className="lbc-subject-strip"><div className="lbc-container">{legacyContent.symbols.map((src, index) => <img key={src} src={src} alt={["Pensamento Computacional", "Programação", "Robótica", "Jogos e criatividade"][index]} width="64" height="64" />)}</div></div>

      <div className="lbc-why-band"><section className="lbc-why lbc-container" id="por-que" aria-labelledby="why-title"><div className="lbc-section-heading"><h2 id="why-title">Por que aprender<br /><span>Computação?</span></h2></div><div className="lbc-why-grid"><div className="lbc-why-image"><img src={asset("why-computing")} alt="Estudante aprendendo Computação com um projeto de robótica" width="1800" height="1000" loading="lazy" /></div><div className="lbc-why-copy"><h3>Produzir tecnologia.<br />Além de consumi-la.</h3><p>A aprendizagem de Computação torna os jovens capazes de produzir tecnologia, além de consumi-la de maneira consciente!</p><a className="lbc-text-link" href="#/porque">Saiba mais <Arrow diagonal /></a></div></div></section></div>

      <section className="lbc-approach" id="abordagem" aria-labelledby="approach-title"><div className="lbc-container lbc-approach-grid"><div className="lbc-approach-art"><img src={asset("approach")} alt="Programação, robótica, jogos, eletrônica e inteligência artificial conectados ao Pensamento Computacional" width="687" height="671" loading="lazy" /></div><div><h2 id="approach-title">Uma abordagem baseada em <span>conceitos e contextos.</span></h2><p>Currículo abrangente para a aprendizagem de Computação no Ensino Fundamental I e II (estudantes entre 7 e 14 anos). Conteúdos que preparam os estudantes para um mundo repleto de tecnologia.</p><ul className="lbc-subjects">{subjects.map((subject, index) => <li key={subject}><span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>{subject}</li>)}</ul><a className="lbc-text-link" href="#/abordagem">Conheça a nossa abordagem <Arrow diagonal /></a></div></div></section></>}



      {page === "escolas" ? <SchoolPage /> : page === "contato" ? <ContactPage whatsappIcon={<WhatsAppIcon />} /> : page !== "inicio" && <LegacyPage name={page} />}



      {page !== "contato" && <div className="lbc-contact-band"><section className="lbc-contact lbc-container" id="contato" aria-labelledby="contact-title"><div><p className="lbc-contact-intro">Vamos adorar te conhecer melhor e oferecer uma proposta.</p><h2 id="contact-title">Agende uma conversa<br /><span>sem compromisso.</span></h2></div><div className="lbc-contact-details"><a className="lbc-contact-email" href="mailto:littlebigcoders@gmail.com">littlebigcoders@gmail.com <Arrow diagonal /></a><a className="lbc-contact-whatsapp" href="https://wa.me/5575981223074" target="_blank" rel="noopener noreferrer"><WhatsAppIcon /> Fale conosco</a><div className="lbc-socials">{[["https://www.facebook.com/littleBIGcoders", "Facebook"], ["https://www.instagram.com/littlebigcoders/", "Instagram"], ["https://www.youtube.com/channel/UC7KWerMUGfo_sCzjQq429mA", "YouTube"]].map(([href, label], index) => <a key={label} href={href} aria-label={label} target="_blank" rel="noopener noreferrer"><img src={legacyContent.socials[index]} alt="" width="40" height="40" /></a>)}</div></div></section></div>}
    </main>
    <footer className="lbc-footer"><div className="lbc-container"><a className="lbc-brand" href="#/" aria-label="Voltar ao início"><img src={asset("logo")} alt="Little BIG Coders" width="405" height="176" loading="lazy" /></a><p>Copyright © 2022 LittleBIGCoders<br />Todos os direitos reservados.<br />CNPJ: 53.739.987/0001-27</p><a href="#login">Já é aluno(a) ou parceiro(a)? <strong>Login <Arrow /></strong></a></div></footer>
  </div>;
}

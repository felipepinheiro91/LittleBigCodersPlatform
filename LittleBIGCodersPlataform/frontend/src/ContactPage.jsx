import React from "react";
import content from "./legacyContent.json";

export function ContactPage({ whatsappIcon }) {
  return <section className="lbc-school-section lbc-school-navy lbc-contact-page" id="contato" aria-labelledby="contact-page-title" data-source-slide="15"><div className="lbc-container">
    <div className="lbc-school-grid">
      <div><h1 id="contact-page-title">Descubra como a Computação pode <span>funcionar na sua escola</span></h1><p className="lbc-school-lead">Em uma conversa de 30 minutos, analisamos a estrutura disponível, anos atendidos, professores, número de estudantes e investimento necessário.</p><a className="lbc-button lbc-school-schedule" href="https://wa.me/5575981223074" target="_blank" rel="noopener noreferrer">{whatsappIcon} Agende uma conversa sem compromisso</a></div>
      <img className="lbc-school-diagram" src="/landing/proposal/program-diagram.webp" alt="Programa Little BIG Coders para o ensino de Computação" />
    </div>
    <div className="lbc-contact-page-details"><a href="mailto:littlebigcoders@gmail.com">littlebigcoders@gmail.com</a><div className="lbc-socials">{[["https://www.facebook.com/littleBIGcoders", "Facebook"], ["https://www.instagram.com/littlebigcoders/", "Instagram"], ["https://www.youtube.com/channel/UC7KWerMUGfo_sCzjQq429mA", "YouTube"]].map(([href, label], index) => <a key={label} href={href} aria-label={label} target="_blank" rel="noopener noreferrer"><img src={content.socials[index]} alt="" width="40" height="40" /></a>)}</div></div>
  </div></section>;
}

import React from "react";
import content from "./legacyContent.json";

const safeHref = value => /^(https?:\/\/|mailto:|tel:|#)/.test(value) ? value : "#/";
export function LegacyPage({ name }) {
  const page = content[name];
  let hasTitle = false;
  return <div className={`lbc-legacy-page lbc-legacy-${name}`}>
    <div className="lbc-container"><a className="lbc-text-link lbc-page-back" href="#/">← Voltar ao início</a></div>
    {page.blocks.map((block, index) => {
      const isCourses = name === "familias" && block.images.length === 3 && block.paragraphs.length === 6;
      const isTopics = name === "abordagem" && block.images.length === 2 && block.paragraphs.length === 4;
      if (isCourses || isTopics) return <section className="lbc-legacy-section" key={index}><div className={`lbc-container ${isCourses ? "lbc-courses" : "lbc-legacy-topics"}`}>{block.images.map((src, position) => <article className={isCourses ? "lbc-course" : "lbc-legacy-topic"} key={src}>
        <img src={src} alt={block.paragraphs[position * 2]} loading="lazy" />
        <h3>{block.paragraphs[position * 2]}</h3><p>{block.paragraphs[position * 2 + 1]}</p>
        {block.links[position] && <a className="lbc-text-link" href={safeHref(block.links[position].href)} aria-label={`Saiba mais: ${block.paragraphs[position * 2]}`}>{block.links[position].text} ↗</a>}
      </article>)}</div></section>;
      const [first, ...rest] = block.paragraphs;
      const isHeading = first && (first.length < 130 || !hasTitle);
      const Heading = hasTitle ? "h2" : "h1";
      if (isHeading) hasTitle = true;
      const paragraphs = isHeading ? rest : block.paragraphs;
      return <section className={`lbc-legacy-section ${block.images.length === 1 && block.paragraphs.length ? "has-image" : ""}`} key={index}>
        <div className="lbc-container lbc-legacy-block">
          {block.paragraphs.length > 0 && <div className="lbc-legacy-copy">
            {isHeading && <Heading>{first}</Heading>}
            {paragraphs.map((paragraph, position) => <p key={position}>{paragraph}</p>)}
            {first === "Alta demanda por profissionais de tecnologia no Brasil" && <p className="lbc-legacy-note">Referência histórica do site original: projeção para 2025.</p>}
          </div>}
          {block.images.length > 0 && <div className={`lbc-legacy-images ${block.images.length > 1 ? "multiple" : ""}`}>{block.images.map((src, position) => <img key={`${src}-${position}`} src={src} alt={block.images.length === 1 ? first || "Imagem original da Little BIG Coders" : `Ilustração original ${position + 1}: ${first || page.title}`} loading="lazy" />)}</div>}
          {block.gallery && <div className="lbc-family-gallery">{block.gallery.map(photo => <figure key={photo.caption}><img src={photo.src} alt={photo.caption} loading="lazy" /><figcaption>{photo.caption}</figcaption></figure>)}</div>}
          {block.embeds.map(src => <div className="lbc-testimonial" key={src}>{block.embedUnavailable ? <div className="lbc-testimonial-unavailable"><span aria-hidden="true">▶</span><p>O vídeo de depoimento do site antigo estava indisponível durante a migração. A reprodução depende das permissões do responsável pela publicação.</p><a className="lbc-text-link" href={safeHref(src)} target="_blank" rel="noopener noreferrer">Ver depoimento original ↗</a></div> : <iframe src={src} title="Depoimento de uma família Little BIG Coders" loading="lazy" allow="fullscreen; picture-in-picture" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" />}</div>)}
          {block.links.length > 0 && <div className="lbc-legacy-links">{block.links.map((link, position) => <a className="lbc-button lbc-button-dark" key={`${link.href}-${position}`} href={safeHref(link.href)}>{link.text}</a>)}</div>}
        </div>
      </section>;
    })}
    {!hasTitle && <h1 className="lbc-container">{page.title}</h1>}
  </div>;
}

import React from "react";
import content from "./legacyContent.json";
import { ImageCarousel } from "./ImageCarousel";

const safeHref = value => /^(https?:\/\/|mailto:|tel:|#)/.test(value) ? value : "#/";
const sectionColors = {
  porque: ["blue", "navy", "lilac", "purple", "yellow", "blue", "lilac", "cyan", "yellow"],
  abordagem: ["blue", "navy", "yellow", "lilac", "navy", "blue", "yellow", "purple", "blue", "navy", "lilac"],
};
function Paragraph({ text, link }) {
  const position = link ? text.indexOf(link.text) : -1;
  if (position < 0) return <p>{text}</p>;
  return <p>{text.slice(0, position)}<a className="lbc-inline-reference" href={safeHref(link.href)}>{link.text}</a>{text.slice(position + link.text.length)}</p>;
}
export function LegacyPage({ name }) {
  const page = content[name];
  let hasTitle = false;
  return <div className={`lbc-legacy-page lbc-legacy-${name}`}>
    {page.blocks.map((block, index) => {
      const colorClass = sectionColors[name]?.[index] ? ` lbc-tone-${sectionColors[name][index]}` : "";
      const isCourses = name === "familias" && block.images.length === 3 && block.paragraphs.length === 6;
      const isTopics = name === "abordagem" && block.images.length === 2 && block.paragraphs.length === 4;
      if (isCourses || isTopics) return <section className={`lbc-legacy-section${colorClass}`} key={index}><div className="lbc-container"><ImageCarousel cards label={isCourses ? "Trilha de aprendizagem" : block.paragraphs[0]}>{block.images.map((src, position) => <article className={isCourses ? "lbc-course" : "lbc-legacy-topic"} key={src}>
        <img src={src} alt={block.paragraphs[position * 2]} loading="lazy" />
        <h3>{block.paragraphs[position * 2]}</h3><p>{block.paragraphs[position * 2 + 1]}</p>
        {block.links[position] && <a className="lbc-text-link" href={safeHref(block.links[position].href)} aria-label={`Saiba mais: ${block.paragraphs[position * 2]}`}>{block.links[position].text} ↗</a>}
      </article>)}</ImageCarousel></div></section>;
      const [first, ...rest] = block.paragraphs;
      const isHeading = first && (first.length < 130 || !hasTitle);
      const Heading = hasTitle ? "h2" : "h1";
      if (isHeading) hasTitle = true;
      const paragraphs = isHeading ? rest : block.paragraphs;
      return <section className={`lbc-legacy-section${colorClass} ${block.images.length === 1 && block.paragraphs.length ? "has-image" : ""}`} key={index}>
        <div className="lbc-container lbc-legacy-block">
          {block.paragraphs.length > 0 && <div className="lbc-legacy-copy">
            {isHeading && <Heading>{first}</Heading>}
            {paragraphs.map((paragraph, position) => <Paragraph key={position} text={paragraph} link={block.inlineLink} />)}
            {first === "Alta demanda por profissionais de tecnologia no Brasil" && <p className="lbc-legacy-note">Referência histórica do site original: projeção para 2025.</p>}
          </div>}
          {block.images.length === 1 && <div className="lbc-legacy-images"><img src={block.images[0]} alt={first || "Imagem original da Little BIG Coders"} loading="lazy" /></div>}
          {block.images.length > 1 && <ImageCarousel label={first || page.title}>{block.images.map((src, position) => <img key={`${src}-${position}`} src={src} alt={`Ilustração original ${position + 1}: ${first || page.title}`} loading="lazy" />)}</ImageCarousel>}
          {block.gallery && <ImageCarousel label="Famílias em todo o Brasil">{block.gallery.map(photo => <figure key={photo.caption}><img src={photo.src} alt={photo.caption} loading="lazy" /><figcaption>{photo.caption}</figcaption></figure>)}</ImageCarousel>}
          {block.embeds.map(src => <div className="lbc-testimonial" key={src}>{block.embedUnavailable ? <div className="lbc-testimonial-unavailable"><span aria-hidden="true">▶</span><p>O vídeo de depoimento do site antigo estava indisponível durante a migração. A reprodução depende das permissões do responsável pela publicação.</p><a className="lbc-text-link" href={safeHref(src)} target="_blank" rel="noopener noreferrer">Ver depoimento original ↗</a></div> : <iframe src={src} title="Depoimento de uma família Little BIG Coders" loading="lazy" allow="fullscreen; picture-in-picture" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" />}</div>)}
          {block.links.length > 0 && <div className="lbc-legacy-links">{block.links.map((link, position) => <a className="lbc-button lbc-button-dark" key={`${link.href}-${position}`} href={safeHref(link.href)}>{link.text}</a>)}</div>}
        </div>
      </section>;
    })}
    {!hasTitle && <h1 className="lbc-container">{page.title}</h1>}
  </div>;
}

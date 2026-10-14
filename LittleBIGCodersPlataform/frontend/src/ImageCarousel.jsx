import React, { Children, useId, useRef, useState } from "react";

export function ImageCarousel({ children, label = "Imagens", cards = false }) {
  const slides = Children.toArray(children);
  const viewportRef = useRef(null);
  const viewportId = useId();
  const [active, setActive] = useState(0);
  function move(index) {
    const viewport = viewportRef.current;
    const slide = viewport.children[Math.max(0, Math.min(index, slides.length - 1))];
    const left = viewport.scrollLeft + slide.getBoundingClientRect().left - viewport.getBoundingClientRect().left;
    viewport.scrollTo({ left, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
  }
  function sync() {
    const viewport = viewportRef.current;
    const left = viewport.getBoundingClientRect().left;
    const distances = [...viewport.children].map(slide => Math.abs(slide.getBoundingClientRect().left - left));
    setActive(distances.indexOf(Math.min(...distances)));
  }
  return <div className={`lbc-carousel ${cards ? "is-cards" : ""}`} role="region" aria-roledescription="carrossel" aria-label={label}>
    <div ref={viewportRef} id={viewportId} className="lbc-carousel-viewport" tabIndex={0} aria-label={`${label}: use as setas para navegar`} onScroll={sync} onKeyDown={event => {
      if (event.target !== event.currentTarget) return;
      if (event.key === "ArrowRight") { event.preventDefault(); move(active + 1); }
      if (event.key === "ArrowLeft") { event.preventDefault(); move(active - 1); }
      if (event.key === "Home") { event.preventDefault(); move(0); }
      if (event.key === "End") { event.preventDefault(); move(slides.length - 1); }
    }}>
      {slides.map((slide, index) => <div className="lbc-carousel-slide" key={slide.key ?? index} role="group" aria-roledescription="slide" aria-label={`${index + 1} de ${slides.length}`}>{slide}</div>)}
    </div>
    <div className="lbc-carousel-controls"><button type="button" aria-label={`Imagem anterior: ${label}`} aria-controls={viewportId} disabled={active === 0} onClick={() => move(active - 1)}>←</button><span aria-live="polite" aria-atomic="true">{active + 1} / {slides.length}</span><button type="button" aria-label={`Próxima imagem: ${label}`} aria-controls={viewportId} disabled={active === slides.length - 1} onClick={() => move(active + 1)}>→</button></div>
  </div>;
}

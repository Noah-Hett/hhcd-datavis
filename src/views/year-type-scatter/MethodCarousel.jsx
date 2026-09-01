import { useCallback, useId, useLayoutEffect, useRef, useState } from "react";

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export default function MethodCarousel({ methods, selected, onToggle, onClear }) {
  const scrollerRef = useRef(null);
  const labelId = useId();
  const [overflow, setOverflow] = useState({
    canScroll: false,
    atStart: true,
    atEnd: true,
  });

  const updateOverflow = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    const canScroll = maxScroll > 1;
    setOverflow({
      canScroll,
      atStart: el.scrollLeft <= 1,
      atEnd: el.scrollLeft >= maxScroll - 1,
    });
  }, []);

  useLayoutEffect(() => {
    const el = scrollerRef.current;
    if (!el) return undefined;

    const read = () => updateOverflow();
    read();
    const raf = requestAnimationFrame(read);
    const observer = new ResizeObserver(read);
    observer.observe(el);
    const list = el.querySelector(".method-pills");
    if (list) observer.observe(list);
    el.addEventListener("scroll", read, { passive: true });
    window.addEventListener("resize", read);
    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      el.removeEventListener("scroll", read);
      window.removeEventListener("resize", read);
    };
  }, [methods, updateOverflow]);

  function scrollByDir(dir) {
    const el = scrollerRef.current;
    if (!el) return;
    const amount = Math.max(el.clientWidth * 0.65, 180);
    el.scrollBy({
      left: dir * amount,
      behavior: prefersReducedMotion() ? "auto" : "smooth",
    });
  }

  function handleListKeyDown(event) {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    const buttons = [...(scrollerRef.current?.querySelectorAll(".method-pill") ?? [])];
    const index = buttons.indexOf(event.target);
    if (index < 0) return;
    event.preventDefault();
    const next = event.key === "ArrowRight" ? index + 1 : index - 1;
    const target = buttons[Math.max(0, Math.min(buttons.length - 1, next))];
    target?.focus();
    target?.scrollIntoView({
      inline: "nearest",
      block: "nearest",
      behavior: prefersReducedMotion() ? "auto" : "smooth",
    });
  }

  const selectedCount = selected.size;

  return (
    <div className="method-carousel" role="group" aria-labelledby={labelId}>
      <div className="method-carousel-meta">
        <span className="method-carousel-label" id={labelId}>
          methods
        </span>
        {selectedCount > 0 ? (
          <button type="button" className="method-clear" onClick={onClear}>
            Show all
          </button>
        ) : null}
      </div>
      <div
        className={[
          "method-carousel-frame",
          overflow.canScroll ? "is-overflow" : "",
          overflow.atStart ? "is-start" : "",
          overflow.atEnd ? "is-end" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {overflow.canScroll ? (
          <button
            type="button"
            className="method-nav method-nav-prev"
            aria-label="Scroll methods left"
            disabled={overflow.atStart}
            onClick={() => scrollByDir(-1)}
          >
            ‹
          </button>
        ) : null}
        <div className="method-carousel-scroll" ref={scrollerRef}>
          <ul
            className="method-pills"
            onKeyDown={handleListKeyDown}
          >
            {methods.map((method) => {
              const pressed = selected.has(method.label);
              const inactive = selectedCount > 0 && !pressed;
              return (
                <li key={method.label}>
                  <button
                    type="button"
                    className={[
                      "method-pill",
                      pressed ? "is-selected" : "",
                      inactive ? "is-inactive" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    aria-pressed={pressed}
                    onClick={() => onToggle(method.label)}
                  >
                    {method.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
        {overflow.canScroll ? (
          <button
            type="button"
            className="method-nav method-nav-next"
            aria-label="Scroll methods right"
            disabled={overflow.atEnd}
            onClick={() => scrollByDir(1)}
          >
            ›
          </button>
        ) : null}
      </div>
    </div>
  );
}

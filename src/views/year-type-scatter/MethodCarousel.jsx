import { useCallback, useId, useLayoutEffect, useRef, useState } from "react";
import { methodPillClassName, methodPillState } from "./mapFilters.js";

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export default function MethodCarousel({
  methods,
  selected,
  onToggle,
  onClear,
  variant = "carousel",
}) {
  const scrollerRef = useRef(null);
  const labelId = useId();
  const isSheet = variant === "sheet";
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
    if (isSheet) return undefined;
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
  }, [isSheet, methods, updateOverflow]);

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
    const keys = isSheet
      ? ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"]
      : ["ArrowLeft", "ArrowRight"];
    if (!keys.includes(event.key)) return;
    const buttons = [
      ...(scrollerRef.current?.querySelectorAll(".method-pill") ?? []),
    ];
    const index = buttons.indexOf(event.target);
    if (index < 0) return;
    event.preventDefault();
    const delta =
      event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 : -1;
    const target = buttons[Math.max(0, Math.min(buttons.length - 1, index + delta))];
    target?.focus();
    target?.scrollIntoView({
      inline: "nearest",
      block: "nearest",
      behavior: prefersReducedMotion() ? "auto" : "smooth",
    });
  }

  const selectedCount = selected.size;
  const showNav = !isSheet && overflow.canScroll;

  return (
    <div
      className={isSheet ? "method-carousel is-sheet" : "method-carousel"}
      role="group"
      aria-labelledby={labelId}
    >
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
          !isSheet && overflow.canScroll ? "is-overflow" : "",
          overflow.atStart ? "is-start" : "",
          overflow.atEnd ? "is-end" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {showNav ? (
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
          <ul className="method-pills" onKeyDown={handleListKeyDown}>
            {methods.map((method) => {
              const { pressed, inactive } = methodPillState(
                method.label,
                selected,
              );
              return (
                <li key={method.label}>
                  <button
                    type="button"
                    className={methodPillClassName({ pressed, inactive })}
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
        {showNav ? (
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

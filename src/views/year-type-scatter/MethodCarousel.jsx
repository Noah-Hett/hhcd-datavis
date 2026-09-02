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
  const normalizingRef = useRef(false);
  const labelId = useId();
  const isSheet = variant === "sheet";
  const [looping, setLooping] = useState(false);
  const [canScroll, setCanScroll] = useState(false);

  const canonicalCopy = looping ? 1 : 0;
  const copies = !isSheet && looping ? [0, 1, 2] : [0];

  const measureSetWidth = useCallback((el) => {
    const first = el.querySelector('[data-copy="0"]');
    const second = el.querySelector('[data-copy="1"]');
    if (!first || !second) return 0;
    return second.offsetLeft - first.offsetLeft;
  }, []);

  const normalizeScroll = useCallback(
    (el) => {
      if (!el || normalizingRef.current) return;
      const setWidth = measureSetWidth(el);
      if (setWidth <= 0) return;
      const { scrollLeft } = el;
      if (scrollLeft < setWidth * 0.5) {
        normalizingRef.current = true;
        el.scrollLeft = scrollLeft + setWidth;
        normalizingRef.current = false;
      } else if (scrollLeft >= setWidth * 1.5) {
        normalizingRef.current = true;
        el.scrollLeft = scrollLeft - setWidth;
        normalizingRef.current = false;
      }
    },
    [measureSetWidth],
  );

  const syncScroller = useCallback(() => {
    const el = scrollerRef.current;
    if (!el || isSheet) return;

    if (!looping) {
      const overflows = el.scrollWidth - el.clientWidth > 1;
      setCanScroll(false);
      if (overflows) setLooping(true);
      return;
    }

    const setWidth = measureSetWidth(el);
    const overflows = setWidth > el.clientWidth + 1;
    if (!overflows) {
      setLooping(false);
      setCanScroll(false);
      return;
    }

    setCanScroll(true);
    // Keep the viewport over the center copy when we first enter loop mode
    // or after a layout change that left us near 0.
    if (el.scrollLeft < setWidth * 0.25 || el.scrollLeft >= setWidth * 2.5) {
      normalizingRef.current = true;
      el.scrollLeft = setWidth;
      normalizingRef.current = false;
    } else {
      normalizeScroll(el);
    }
  }, [isSheet, looping, measureSetWidth, normalizeScroll]);

  useLayoutEffect(() => {
    if (isSheet) return undefined;
    const el = scrollerRef.current;
    if (!el) return undefined;

    const onScroll = () => {
      if (looping) normalizeScroll(el);
    };
    const onResize = () => syncScroller();

    syncScroller();
    const raf = requestAnimationFrame(() => syncScroller());
    const observer = new ResizeObserver(onResize);
    observer.observe(el);
    const list = el.querySelector(".method-pills");
    if (list) observer.observe(list);
    el.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      el.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, [isSheet, methods, looping, normalizeScroll, syncScroller]);

  function scrollByDir(dir) {
    const el = scrollerRef.current;
    if (!el) return;
    const amount = Math.max(el.clientWidth * 0.65, 180);
    // Instant paging while looping avoids mid-animation recenter fights.
    const behavior =
      looping || prefersReducedMotion() ? "auto" : "smooth";
    el.scrollBy({
      left: dir * amount,
      behavior,
    });
    if (looping) normalizeScroll(el);
  }

  function handleListKeyDown(event) {
    const keys = isSheet
      ? ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"]
      : ["ArrowLeft", "ArrowRight"];
    if (!keys.includes(event.key)) return;

    const root = scrollerRef.current;
    if (!root) return;
    const buttons = isSheet
      ? [...root.querySelectorAll(".method-pill")]
      : [
          ...root.querySelectorAll(
            `.method-pill[data-copy="${canonicalCopy}"]`,
          ),
        ];
    const index = buttons.indexOf(event.target);
    if (index < 0 || buttons.length === 0) return;
    event.preventDefault();
    const delta =
      event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 : -1;
    const target =
      buttons[(index + delta + buttons.length) % buttons.length];
    target?.focus();
    target?.scrollIntoView({
      inline: "nearest",
      block: "nearest",
      behavior: prefersReducedMotion() ? "auto" : "smooth",
    });
  }

  const selectedCount = selected.size;
  const showNav = !isSheet && canScroll;

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
          !isSheet && canScroll ? "is-overflow" : "",
          // While looping there is no real start/end — keep both edge fades.
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {showNav ? (
          <button
            type="button"
            className="method-nav method-nav-prev"
            aria-label="Scroll methods left"
            onClick={() => scrollByDir(-1)}
          >
            ‹
          </button>
        ) : null}
        <div className="method-carousel-scroll" ref={scrollerRef}>
          <ul className="method-pills" onKeyDown={handleListKeyDown}>
            {copies.flatMap((copy) =>
              methods.map((method) => {
                const { pressed, inactive } = methodPillState(
                  method.label,
                  selected,
                );
                const isCanonical = copy === canonicalCopy;
                return (
                  <li
                    key={`${copy}-${method.label}`}
                    data-copy={copy}
                    aria-hidden={isCanonical ? undefined : true}
                  >
                    <button
                      type="button"
                      data-copy={copy}
                      className={methodPillClassName({ pressed, inactive })}
                      aria-pressed={isCanonical ? pressed : undefined}
                      tabIndex={isCanonical ? undefined : -1}
                      onClick={() => onToggle(method.label)}
                    >
                      {method.label}
                    </button>
                  </li>
                );
              }),
            )}
          </ul>
        </div>
        {showNav ? (
          <button
            type="button"
            className="method-nav method-nav-next"
            aria-label="Scroll methods right"
            onClick={() => scrollByDir(1)}
          >
            ›
          </button>
        ) : null}
      </div>
    </div>
  );
}

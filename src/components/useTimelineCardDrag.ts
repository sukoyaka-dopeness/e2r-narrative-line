import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type RefObject } from "react";

export type TimelineCardDrop = { sourceId: string; targetId: string; position: "before" | "after" };
export type TimelineCardDragState = TimelineCardDrop | { sourceId: string; targetId: null; position: null };

type DragSession = { cancel: () => void };

/** Pointer drag is a supplementary input; touch keeps native scrolling until a short hold. */
export function useTimelineCardDrag({
  enabled,
  cardRefs,
  onDrop,
}: {
  enabled: boolean;
  cardRefs: RefObject<Map<string, HTMLLIElement>>;
  onDrop: (drop: TimelineCardDrop) => void;
}) {
  const [dragState, setDragState] = useState<TimelineCardDragState | null>(null);
  const sessionRef = useRef<DragSession | null>(null);
  const suppressClickRef = useRef(false);

  useEffect(() => {
    if (!enabled) sessionRef.current?.cancel();
    return () => sessionRef.current?.cancel();
  }, [enabled]);

  const onPointerDown = (eventId: string, event: ReactPointerEvent<HTMLLIElement>) => {
    if (!enabled || sessionRef.current || event.isPrimary === false ||
        (event.pointerType === "mouse" && event.button !== 0)) return;
    const target = event.target as HTMLElement;
    if (target.closest("button, summary, a, input, textarea, select, [contenteditable='true']")) return;

    const pointerId = event.pointerId;
    const card = event.currentTarget;
    const startX = event.clientX;
    const startY = event.clientY;
    let currentX = startX;
    let currentY = startY;
    let active = false;
    let drop: TimelineCardDrop | null = null;
    let holdTimer: number | undefined;
    let scrollTimer: number | undefined;

    const findDrop = (x: number, y: number): TimelineCardDrop | null => {
      const rectangles = [...cardRefs.current.entries()].map(([id, node]) => ({ id, rect: node.getBoundingClientRect() }));
      if (rectangles.length === 0) return null;
      const left = Math.min(...rectangles.map(({ rect }) => rect.left));
      const right = Math.max(...rectangles.map(({ rect }) => rect.right));
      const top = Math.min(...rectangles.map(({ rect }) => rect.top));
      const bottom = Math.max(...rectangles.map(({ rect }) => rect.bottom));
      if (x < left - 32 || x > right + 32 || y < top - 32 || y > bottom + 32) return null;
      const containing = rectangles.find(({ rect }) =>
        x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom);
      const target = containing ?? rectangles.reduce((best, item) =>
        Math.max(item.rect.top - y, 0, y - item.rect.bottom) <
        Math.max(best.rect.top - y, 0, y - best.rect.bottom) ? item : best);
      if (target.id === eventId) return null;
      return {
        sourceId: eventId,
        targetId: target.id,
        position: y < (target.rect.top + target.rect.bottom) / 2 ? "before" : "after",
      };
    };

    const updateDrop = () => {
      const next = findDrop(currentX, currentY);
      if (next?.targetId === drop?.targetId && next?.position === drop?.position) return;
      drop = next;
      setDragState(next ?? { sourceId: eventId, targetId: null, position: null });
    };

    const preventTouchScroll = (touchEvent: TouchEvent) => {
      if (active && touchEvent.cancelable) touchEvent.preventDefault();
    };
    const preventContextMenu = (contextEvent: MouseEvent) => {
      if (active) contextEvent.preventDefault();
    };
    const preventSelection = (selectionEvent: Event) => {
      if (selectionEvent.cancelable) selectionEvent.preventDefault();
    };
    const stop = (wasActive: boolean) => {
      if (holdTimer !== undefined) window.clearTimeout(holdTimer);
      if (scrollTimer !== undefined) window.clearInterval(scrollTimer);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", cancel);
      window.removeEventListener("keydown", keyDown);
      window.removeEventListener("blur", cancel);
      window.removeEventListener("touchmove", preventTouchScroll);
      window.removeEventListener("contextmenu", preventContextMenu);
      card.removeEventListener("selectstart", preventSelection);
      if (card.hasPointerCapture?.(pointerId)) card.releasePointerCapture(pointerId);
      sessionRef.current = null;
      if (wasActive) {
        suppressClickRef.current = true;
        window.setTimeout(() => { suppressClickRef.current = false; }, 0);
        setDragState(null);
      }
    };
    const cancel = () => stop(active);
    const keyDown = (keyEvent: KeyboardEvent) => {
      if (keyEvent.key !== "Escape") return;
      if (active) {
        keyEvent.preventDefault();
        cardRefs.current.get(eventId)?.focus();
      }
      cancel();
    };
    const up = (pointerEvent: PointerEvent) => {
      if (pointerEvent.pointerId !== pointerId) return;
      if (active) {
        currentX = pointerEvent.clientX;
        currentY = pointerEvent.clientY;
        drop = findDrop(currentX, currentY);
      }
      const completed = active ? drop : null;
      stop(active);
      if (completed) onDrop(completed);
    };
    const activate = () => {
      if (active || sessionRef.current === null) return;
      active = true;
      try { card.setPointerCapture?.(pointerId); } catch { /* The pointer may have been cancelled. */ }
      setDragState({ sourceId: eventId, targetId: null, position: null });
      if (event.pointerType === "touch") {
        window.addEventListener("touchmove", preventTouchScroll, { passive: false });
      }
      window.addEventListener("contextmenu", preventContextMenu);
      scrollTimer = window.setInterval(() => {
        const edge = 56;
        const speed = currentY < edge ? -Math.min(18, edge - currentY)
          : currentY > window.innerHeight - edge ? Math.min(18, currentY - (window.innerHeight - edge)) : 0;
        if (speed !== 0) {
          window.scrollBy(0, speed);
          updateDrop();
        }
      }, 32);
    };
    const move = (pointerEvent: PointerEvent) => {
      if (pointerEvent.pointerId !== pointerId) return;
      currentX = pointerEvent.clientX;
      currentY = pointerEvent.clientY;
      const distance = Math.hypot(currentX - startX, currentY - startY);
      if (!active) {
        if (event.pointerType === "touch") {
          if (distance > 8) cancel(); // A moving touch remains native page scrolling.
          return;
        }
        if (distance < 6) return;
        activate();
      }
      pointerEvent.preventDefault();
      updateDrop();
    };

    sessionRef.current = { cancel };
    card.addEventListener("selectstart", preventSelection);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", cancel);
    window.addEventListener("keydown", keyDown);
    window.addEventListener("blur", cancel);
    if (event.pointerType === "touch") holdTimer = window.setTimeout(activate, 280);
  };

  const consumeClick = () => {
    if (!suppressClickRef.current) return false;
    suppressClickRef.current = false;
    return true;
  };

  return { dragState, onPointerDown, consumeClick };
}

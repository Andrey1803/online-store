import { useCallback, useEffect, useRef, useState, type FocusEvent } from 'react';

/** Скрыть блок через 0,4 с после ухода курсора */
const COLLAPSE_DELAY_MS = 400;

export function useHoverCollapse() {
  const [canHover, setCanHover] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(hover: hover)').matches,
  );
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set());
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    setCanHover(window.matchMedia('(hover: hover)').matches);
  }, []);

  useEffect(
    () => () => {
      timersRef.current.forEach((t) => clearTimeout(t));
    },
    [],
  );

  const open = useCallback((id: string) => {
    const t = timersRef.current.get(id);
    if (t) {
      clearTimeout(t);
      timersRef.current.delete(id);
    }
    setExpandedIds((prev) => new Set(prev).add(id));
  }, []);

  const scheduleClose = useCallback(
    (id: string) => {
      if (!canHover) return;
      const prev = timersRef.current.get(id);
      if (prev) clearTimeout(prev);
      timersRef.current.set(
        id,
        setTimeout(() => {
          setExpandedIds((prev) => {
            const next = new Set(prev);
            next.delete(id);
            return next;
          });
          timersRef.current.delete(id);
        }, COLLAPSE_DELAY_MS),
      );
    },
    [canHover],
  );

  const isOpen = useCallback((id: string) => expandedIds.has(id), [expandedIds]);

  const toggle = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const bind = useCallback(
    (id: string) => ({
      onMouseEnter: canHover ? () => open(id) : undefined,
      onMouseLeave: canHover ? () => scheduleClose(id) : undefined,
      onFocusCapture: canHover ? () => open(id) : undefined,
      onBlurCapture: canHover
        ? (e: FocusEvent<HTMLElement>) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node)) {
              scheduleClose(id);
            }
          }
        : undefined,
    }),
    [canHover, open, scheduleClose],
  );

  return { canHover, isOpen, bind, toggle };
}

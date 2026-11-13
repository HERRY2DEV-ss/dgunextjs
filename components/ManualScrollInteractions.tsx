'use client';
import { useEffect } from 'react';

const scrollableOverflow = (value: string) => value === 'auto' || value === 'scroll' || value === 'overlay';

function scrollAxes(element: HTMLElement) {
  const style = window.getComputedStyle(element);
  return {
    horizontal: scrollableOverflow(style.overflowX) && element.scrollWidth > element.clientWidth + 1,
    vertical: scrollableOverflow(style.overflowY) && element.scrollHeight > element.clientHeight + 1,
  };
}

export function hasScrollableAncestor(target: EventTarget | null) {
  if (!(target instanceof Element)) return false;
  for (let element: Element | null = target; element && element !== document.body && element !== document.documentElement; element = element.parentElement) {
    if (element instanceof HTMLElement) {
      const axes = scrollAxes(element);
      if (axes.horizontal || axes.vertical) return true;
    }
  }
  return false;
}

export default function ManualScrollInteractions() {
  useEffect(() => {
    let active: { element: HTMLElement; x: number; y: number; left: number; top: number; axis?: 'horizontal' | 'vertical'; dragging: boolean } | null = null;
    let suppressClick: HTMLElement | null = null;
    let clearSuppressedClick = 0;

    const scrollableElement = (target: EventTarget | null) => {
      if (!(target instanceof Element)) return null;
      for (let element: Element | null = target; element && element !== document.body && element !== document.documentElement; element = element.parentElement) {
        if (!(element instanceof HTMLElement)) continue;
        const axes = scrollAxes(element);
        if (axes.horizontal || axes.vertical) return { element, ...axes };
      }
      return null;
    };

    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse' || event.button !== 0) return;
      const scrollable = scrollableElement(event.target);
      if (!scrollable) return;
      const isTab = Boolean((event.target as Element).closest('[role="tablist"]'));
      if (!isTab && (event.target as Element).closest('a,button,input,select,textarea,summary,[contenteditable="true"]')) return;
      active = {
        element: scrollable.element,
        x: event.clientX,
        y: event.clientY,
        left: scrollable.element.scrollLeft,
        top: scrollable.element.scrollTop,
        dragging: false,
      };
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!active) return;
      const dx = event.clientX - active.x;
      const dy = event.clientY - active.y;
      if (!active.dragging) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) < 6) return;
        const axes = scrollAxes(active.element);
        const horizontal = Math.abs(dx) >= Math.abs(dy);
        const maxLeft = active.element.scrollWidth - active.element.clientWidth;
        const maxTop = active.element.scrollHeight - active.element.clientHeight;
        const canMove = horizontal
          ? axes.horizontal && Math.max(0, Math.min(maxLeft, active.left - dx)) !== active.left
          : axes.vertical && Math.max(0, Math.min(maxTop, active.top - dy)) !== active.top;
        if (!canMove) return;
        active.axis = horizontal ? 'horizontal' : 'vertical';
        active.dragging = true;
        active.element.classList.add('is-manual-scrolling');
        suppressClick = active.element;
      }
      event.preventDefault();
      if (active.axis === 'horizontal') active.element.scrollLeft = active.left - dx;
      else active.element.scrollTop = active.top - dy;
    };

    const onPointerUp = () => {
      if (active?.dragging) active.element.classList.remove('is-manual-scrolling');
      active = null;
      if (suppressClick) {
        window.clearTimeout(clearSuppressedClick);
        clearSuppressedClick = window.setTimeout(() => { suppressClick = null; }, 0);
      }
    };

    const onWheel = (event: WheelEvent) => {
      if (event.defaultPrevented || Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
      const scrollable = scrollableElement(event.target);
      if (!scrollable?.horizontal || scrollable.vertical) return;
      const element = scrollable.element;
      const next = Math.max(0, Math.min(element.scrollWidth - element.clientWidth, element.scrollLeft + event.deltaY));
      if (Math.abs(next - element.scrollLeft) < 1) return;
      event.preventDefault();
      element.scrollLeft = next;
    };

    const onClick = (event: MouseEvent) => {
      if (!suppressClick || !(event.target instanceof Node) || !suppressClick.contains(event.target)) return;
      event.preventDefault();
      event.stopPropagation();
      suppressClick = null;
      window.clearTimeout(clearSuppressedClick);
    };

    document.addEventListener('pointerdown', onPointerDown, true);
    document.addEventListener('pointermove', onPointerMove, { capture: true, passive: false });
    document.addEventListener('pointerup', onPointerUp, true);
    document.addEventListener('pointercancel', onPointerUp, true);
    document.addEventListener('wheel', onWheel, { capture: true, passive: false });
    document.addEventListener('click', onClick, true);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true);
      document.removeEventListener('pointermove', onPointerMove, true);
      document.removeEventListener('pointerup', onPointerUp, true);
      document.removeEventListener('pointercancel', onPointerUp, true);
      document.removeEventListener('wheel', onWheel, true);
      document.removeEventListener('click', onClick, true);
      if (active?.dragging) active.element.classList.remove('is-manual-scrolling');
      window.clearTimeout(clearSuppressedClick);
    };
  }, []);

  return null;
}

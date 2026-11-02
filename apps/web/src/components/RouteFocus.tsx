import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export function RouteFocus() {
  const { pathname } = useLocation();
  useEffect(() => {
    const observer = new MutationObserver(focusHeading);
    function focusHeading() {
      const heading = document.querySelector<HTMLElement>('main h1');
      if (!heading) return;
      heading.tabIndex = -1;
      heading.focus({ preventScroll: true });
      document.title = `${heading.textContent?.trim() || 'Seu espaço'} · Estudo em Dia`;
      document.documentElement.scrollTop = 0; document.body.scrollTop = 0;
      observer.disconnect();
    }
    observer.observe(document.body,{ childList: true, subtree: true });
    focusHeading();
    return () => observer.disconnect();
  },[pathname]);
  return null;
}

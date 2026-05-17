import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

function ScrollToTop() {
  const { pathname, search, state } = useLocation();
  const browserWindow = typeof globalThis !== 'undefined' ? globalThis.window : null;

  useEffect(() => {
    if (!browserWindow) {
      return;
    }

    if (state?.preserveScroll) {
      return;
    }

    try {
      browserWindow.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    } catch {
      browserWindow.scrollTo(0, 0);
    }
  }, [browserWindow, pathname, search, state]);

  return null;
}

export default ScrollToTop;

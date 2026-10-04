import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

/** Accessible dialog: Esc to close, focus moves inside, background scroll locked, focus restored on close. */
export default function Modal({ children, onClose, small = false, labelledBy, hideClose = false }) {
  const ref = useRef(null);

  useEffect(() => {
    const previous = document.activeElement;
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';

    const target = ref.current?.querySelector('[autofocus], input, select, textarea') || ref.current;
    target?.focus?.();

    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key !== 'Tab' || !ref.current) return;
      const items = ref.current.querySelectorAll('button:not(:disabled), [href], input:not(:disabled), select, textarea');
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
      previous?.focus?.();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={ref} className={`modal ${small ? 'sm' : ''}`} role="dialog" aria-modal="true" aria-labelledby={labelledBy} tabIndex={-1} style={{ position: 'relative' }}>
        {!hideClose && (
          <button className="icon-btn" onClick={onClose} aria-label="Close dialog" style={{ position: 'absolute', top: 14, right: 14 }}>
            <X size={18} />
          </button>
        )}
        {children}
      </div>
    </div>
  );
}

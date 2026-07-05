import { useEffect, useLayoutEffect, useRef, useState } from 'react';

export default function Popover({ trigger, children, panelHeight = 320, panelClassName = '' }) {
  const [open, setOpen] = useState(false);
  const [dropUp, setDropUp] = useState(false);
  const rootRef = useRef(null);
  const triggerRef = useRef(null);

  useLayoutEffect(() => {
    if (!open) return;
    const r = triggerRef.current?.getBoundingClientRect();
    if (!r) return;
    const below = window.innerHeight - r.bottom;
    const above = r.top;
    setDropUp(below < panelHeight && above > below);
  }, [open, panelHeight]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="pop" ref={rootRef}>
      <div ref={triggerRef} className="pop-anchor">
        {trigger({ open, toggle: () => setOpen((o) => !o) })}
      </div>
      {open && (
        <div className={`pop-panel ${dropUp ? 'up' : 'down'} ${panelClassName}`}>
          {children({ close: () => setOpen(false) })}
        </div>
      )}
    </div>
  );
}

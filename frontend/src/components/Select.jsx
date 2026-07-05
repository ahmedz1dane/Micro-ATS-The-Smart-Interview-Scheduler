import Popover from './Popover.jsx';
import { ChevronDown, Check } from './icons.jsx';

export default function Select({ value, onChange, options, lead = null, placeholder = 'Select…' }) {
  const current = options.find((o) => o.value === value);

  return (
    <Popover
      panelHeight={280}
      panelClassName="select-panel"
      trigger={({ open, toggle }) => (
        <button
          type="button"
          className={`field-trigger ${open ? 'open' : ''}`}
          onClick={toggle}
          aria-haspopup="listbox"
          aria-expanded={open}
        >
          {lead && <span className="ft-lead">{lead}</span>}
          <span className="ft-value">
            {current ? (
              <>
                {current.label}
                {current.hint && <span className="ft-hint"> — {current.hint}</span>}
              </>
            ) : (
              <span className="ft-ph">{placeholder}</span>
            )}
          </span>
          <ChevronDown size={16} className="ft-chev" />
        </button>
      )}
    >
      {({ close }) => (
        <ul className="select-menu" role="listbox">
          {options.map((o) => {
            const selected = o.value === value;
            return (
              <li
                key={o.value}
                role="option"
                aria-selected={selected}
                className={`select-opt ${selected ? 'sel' : ''}`}
                onClick={() => {
                  onChange(o.value);
                  close();
                }}
              >
                <span className="opt-main">
                  <span className="opt-label">{o.label}</span>
                  {o.hint && <span className="opt-sub">{o.hint}</span>}
                </span>
                {selected && <Check size={15} />}
              </li>
            );
          })}
        </ul>
      )}
    </Popover>
  );
}

const base = (size) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
});

export const Globe = ({ size = 16, ...p }) => (
  <svg {...base(size)} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18M12 3c2.5 2.4 2.5 15.6 0 18M12 3c-2.5 2.4-2.5 15.6 0 18" />
  </svg>
);

export const Calendar = ({ size = 16, ...p }) => (
  <svg {...base(size)} {...p}>
    <rect x="3" y="4.5" width="18" height="16" rx="2.5" />
    <path d="M3 9h18M8 3v3M16 3v3" />
  </svg>
);

export const CalendarCheck = ({ size = 16, ...p }) => (
  <svg {...base(size)} {...p}>
    <rect x="3" y="4.5" width="18" height="16" rx="2.5" />
    <path d="M3 9h18M8 3v3M16 3v3M9 14.5l2 2 4-4" />
  </svg>
);

export const ChevronDown = ({ size = 16, ...p }) => (
  <svg {...base(size)} {...p}>
    <path d="M6 9l6 6 6-6" />
  </svg>
);

export const AlertTriangle = ({ size = 16, ...p }) => (
  <svg {...base(size)} {...p}>
    <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
    <path d="M12 9v4M12 17h.01" />
  </svg>
);

export const CheckCircle = ({ size = 16, ...p }) => (
  <svg {...base(size)} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M8.5 12.5l2.5 2.5 4.5-5" />
  </svg>
);

export const X = ({ size = 16, ...p }) => (
  <svg {...base(size)} {...p}>
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);

export const User = ({ size = 16, ...p }) => (
  <svg {...base(size)} {...p}>
    <circle cx="12" cy="8" r="3.5" />
    <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
  </svg>
);

export const Clock = ({ size = 16, ...p }) => (
  <svg {...base(size)} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7.5V12l3 2" />
  </svg>
);

export const Sparkle = ({ size = 16, ...p }) => (
  <svg {...base(size)} {...p}>
    <path d="M12 3c.4 4.6 1.4 5.6 6 6-4.6.4-5.6 1.4-6 6-.4-4.6-1.4-5.6-6-6 4.6-.4 5.6-1.4 6-6Z" />
  </svg>
);

export const Users = ({ size = 16, ...p }) => (
  <svg {...base(size)} {...p}>
    <circle cx="9" cy="8" r="3" />
    <path d="M3.5 20a5.5 5.5 0 0 1 11 0" />
    <path d="M16 5.3a3 3 0 0 1 0 5.4M18.5 20a5.5 5.5 0 0 0-4-5.3" />
  </svg>
);

export const Check = ({ size = 16, ...p }) => (
  <svg {...base(size)} {...p}>
    <path d="M5 12.5l4.5 4.5L19 7" />
  </svg>
);

export const ChevronLeft = ({ size = 16, ...p }) => (
  <svg {...base(size)} {...p}>
    <path d="M15 6l-6 6 6 6" />
  </svg>
);

export const ChevronRight = ({ size = 16, ...p }) => (
  <svg {...base(size)} {...p}>
    <path d="M9 6l6 6-6 6" />
  </svg>
);

/** Minimal stroke icons (original), sized for the tab bar and headers. */

function base(path: React.ReactNode, viewBox = '0 0 24 24') {
  return function Icon({ size = 22, className = '' }: { size?: number; className?: string }) {
    return (
      <svg
        width={size}
        height={size}
        viewBox={viewBox}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        aria-hidden
      >
        {path}
      </svg>
    )
  }
}

export const IconToday = base(
  <>
    <rect x="3.5" y="5" width="17" height="15.5" rx="3" />
    <path d="M3.5 9.5h17M8 3v3.5M16 3v3.5" />
    <circle cx="12" cy="15" r="2.6" />
  </>,
)

export const IconPath = base(
  <>
    <circle cx="6" cy="18" r="2.4" />
    <circle cx="12" cy="7" r="2.4" />
    <circle cx="18" cy="16" r="2.4" />
    <path d="M7.6 16.2 10.5 9M13.6 8.6l3 5.6" />
  </>,
)

export const IconCoach = base(
  <>
    <path d="M12 3.5c4.7 0 8.5 3 8.5 6.8 0 3.7-3.8 6.7-8.5 6.7-.9 0-1.8-.1-2.6-.3L5 19.5l.9-3.6c-1.5-1.2-2.4-2.9-2.4-4.6C3.5 6.5 7.3 3.5 12 3.5Z" />
    <path d="M8.5 9.5h7M8.5 12.5h4.5" />
  </>,
)

export const IconPractice = base(
  <>
    <rect x="3.5" y="3.5" width="7.4" height="7.4" rx="2" />
    <rect x="13.1" y="3.5" width="7.4" height="7.4" rx="2" />
    <rect x="3.5" y="13.1" width="7.4" height="7.4" rx="2" />
    <path d="M16.8 13.4v6.8M13.4 16.8h6.8" />
  </>,
)

export const IconProgress = base(
  <>
    <path d="M4 20V10M9.3 20V4.5M14.7 20v-9M20 20V8" />
  </>,
)

export const IconSettings = base(
  <>
    {/* A gear that reads as a gear: solid ring + hub, with stout teeth. */}
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2.1" />
    <g strokeWidth={3.1}>
      <path d="M12 2.9v1.9M12 19.2v1.9M2.9 12h1.9M19.2 12h1.9M5.6 5.6l1.35 1.35M17.05 17.05l1.35 1.35M18.4 5.6l-1.35 1.35M6.95 17.05 5.6 18.4" />
    </g>
  </>,
)

export const IconBack = base(<path d="M14.5 5.5 8 12l6.5 6.5" />)
export const IconCheck = base(<path d="M4.5 12.5 10 18 19.5 6.5" />)
export const IconHint = base(
  <>
    <path d="M9.5 18h5M10 21h4" />
    <path d="M12 3a6.2 6.2 0 0 0-3.5 11.3c.8.6 1 1.2 1 1.7h5c0-.5.2-1.1 1-1.7A6.2 6.2 0 0 0 12 3Z" />
  </>,
)
export const IconFlag = base(<path d="M6 21V4.5M6 4.5h11.5l-2.6 4 2.6 4H6" />)
export const IconRotate = base(
  <>
    <path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3" />
    <path d="M19.7 3.5v3.4h-3.4" />
  </>,
)
export const IconClock = base(
  <>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
  </>,
)

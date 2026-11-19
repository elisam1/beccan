interface SchoolCrestProps {
  variant?: 'navy' | 'gold' | 'light';
  className?: string;
}

/**
 * Temporary geometric monogram wordmark emblem.
 * Does not fabricate an official school crest; displays a simple architectural "B" frame.
 */
export function SchoolCrest({ variant = 'navy', className = 'w-9 h-9' }: SchoolCrestProps) {
  const strokeColor =
    variant === 'light'
      ? '#FBF9F5'
      : variant === 'gold'
        ? '#D4B46E'
        : '#0F213E';

  const accentColor =
    variant === 'light'
      ? '#D4B46E'
      : variant === 'gold'
        ? '#FBF9F5'
        : '#B58E43';

  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M7 5.5H33V20.5C33 28.2 26.8 33.4 20 35.8C13.2 33.4 7 28.2 7 20.5V5.5Z"
        stroke={strokeColor}
        strokeWidth="1.75"
      />
      <path
        d="M11 9.5H29V20.2C29 25.5 24.8 29.4 20 31.3C15.2 29.4 11 25.5 11 20.2V9.5Z"
        stroke={accentColor}
        strokeWidth="1"
        strokeOpacity="0.8"
      />
      <text
        x="20"
        y="24"
        textAnchor="middle"
        fill={strokeColor}
        fontFamily="Cormorant Garamond, Georgia, serif"
        fontSize="16"
        fontWeight="700"
      >
        B
      </text>
    </svg>
  );
}

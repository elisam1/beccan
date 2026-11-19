interface SchoolWordmarkProps {
  variant?: 'navy' | 'light';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function SchoolWordmark({
  variant = 'navy',
  size = 'md',
  className = '',
}: SchoolWordmarkProps) {
  const textColor = variant === 'light' ? 'text-[#FBF9F5]' : 'text-[#0F213E]';
  const accentColor = variant === 'light' ? 'bg-[#D4B46E]' : 'bg-[#B58E43]';
  const sizeClass =
    size === 'sm'
      ? 'text-base sm:text-lg'
      : size === 'lg'
        ? 'text-xl sm:text-2xl'
        : 'text-lg sm:text-xl';

  return (
    <span className={`inline-flex flex-col items-start whitespace-nowrap shrink-0 ${className}`}>
      <span
        className={`font-serif ${sizeClass} font-semibold uppercase tracking-[0.12em] leading-none ${textColor}`}
      >
        Beccan School
      </span>
      <span className={`mt-1.5 h-[2px] w-8 ${accentColor}`} aria-hidden="true" />
    </span>
  );
}

interface SectionHeadingProps {
  kicker?: string;
  title: string;
  subtitle?: string;
  align?: 'left' | 'center';
  theme?: 'light' | 'dark';
  className?: string;
}

export function SectionHeading({
  kicker,
  title,
  subtitle,
  align = 'left',
  theme = 'light',
  className = '',
}: SectionHeadingProps) {
  const isCentered = align === 'center';
  const kickerColor = theme === 'dark' ? 'text-[#D4B46E]' : 'text-[#8D6A26]';
  const titleColor = theme === 'dark' ? 'text-[#FBF9F5]' : 'text-[#0F213E]';
  const subtitleColor = theme === 'dark' ? 'text-[#D4DCE8]' : 'text-[#4A5568]';

  return (
    <div
      className={`${isCentered ? 'text-center mx-auto max-w-2xl' : 'max-w-2xl'} ${className}`}
    >
      {kicker && (
        <p
          className={`text-xs uppercase tracking-[0.18em] font-medium mb-3 ${kickerColor}`}
        >
          {kicker}
        </p>
      )}
      <h2
        className={`font-serif text-3xl sm:text-4xl font-semibold leading-[1.15] tracking-tight ${titleColor}`}
      >
        {title}
      </h2>
      {subtitle && (
        <p className={`mt-4 text-base sm:text-lg leading-relaxed ${subtitleColor}`}>
          {subtitle}
        </p>
      )}
    </div>
  );
}

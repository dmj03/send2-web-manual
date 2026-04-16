interface SettingsSectionCardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  /** Extra Tailwind classes for the card container. */
  className?: string;
}

export function SettingsSectionCard({
  title,
  description,
  children,
  className = '',
}: SettingsSectionCardProps) {
  return (
    <section
      className={`rounded-xl border border-gray-200 bg-white shadow-sm ${className}`}
      aria-labelledby={`section-${title.toLowerCase().replace(/\s+/g, '-')}`}
    >
      <div className="border-b border-gray-100 px-6 py-4">
        <h2
          id={`section-${title.toLowerCase().replace(/\s+/g, '-')}`}
          className="text-base font-semibold text-gray-900"
        >
          {title}
        </h2>
        {description && (
          <p className="mt-0.5 text-sm text-gray-500">{description}</p>
        )}
      </div>
      <div className="px-6 py-5">{children}</div>
    </section>
  );
}

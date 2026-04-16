interface Section {
  id: string;
  title: string;
  content: React.ReactNode;
}

interface LegalPageContentProps {
  title: string;
  lastUpdated: string;
  effectiveDate: string;
  intro: string;
  sections: Section[];
}

export function LegalPageContent({
  title,
  lastUpdated,
  effectiveDate,
  intro,
  sections,
}: LegalPageContentProps) {
  return (
    <div className="bg-white">
      {/* Header */}
      <div className="border-b border-gray-100 bg-gray-50 py-12">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            {title}
          </h1>
          <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm text-gray-500">
            <span>
              <span className="font-medium">Last updated:</span> {lastUpdated}
            </span>
            <span>
              <span className="font-medium">Effective:</span> {effectiveDate}
            </span>
          </div>
          <p className="mt-4 text-base leading-relaxed text-gray-600">{intro}</p>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        {/* Table of contents */}
        <nav
          aria-label="Page contents"
          className="mb-10 rounded-xl border border-gray-200 bg-gray-50 p-5"
        >
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
            Contents
          </p>
          <ol className="space-y-1.5">
            {sections.map((section, index) => (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  className="text-sm text-blue-600 transition-colors hover:text-blue-700 hover:underline"
                >
                  {index + 1}. {section.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        {/* Sections */}
        <div className="space-y-10">
          {sections.map((section, index) => (
            <section key={section.id} id={section.id} aria-labelledby={`heading-${section.id}`}>
              <h2
                id={`heading-${section.id}`}
                className="mb-4 flex items-baseline gap-3 text-lg font-semibold text-gray-900"
              >
                <span className="text-sm font-normal text-gray-400">
                  {index + 1}.
                </span>
                {section.title}
              </h2>
              <div className="prose prose-sm prose-gray max-w-none text-gray-600">
                {section.content}
              </div>
            </section>
          ))}
        </div>

        {/* Footer note */}
        <div className="mt-12 rounded-xl border border-blue-100 bg-blue-50 p-5">
          <p className="text-sm text-blue-700">
            If you have questions about this document, please{' '}
            <a
              href="/contact-us"
              className="font-medium underline hover:text-blue-800"
            >
              contact us
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}

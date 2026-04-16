"use client";

import { useState } from 'react';

export interface FaqItem {
  id: string;
  question: string;
  answer: React.ReactNode;
  category: string;
}

interface FaqAccordionProps {
  items: FaqItem[];
  searchQuery: string;
  activeCategory: string;
}

export function FaqAccordion({ items, searchQuery, activeCategory }: FaqAccordionProps) {
  const [openId, setOpenId] = useState<string | null>(null);

  const filtered = items.filter((item) => {
    const matchesCategory =
      activeCategory === 'all' || item.category === activeCategory;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      item.question.toLowerCase().includes(q) ||
      (typeof item.answer === 'string' && item.answer.toLowerCase().includes(q));
    return matchesCategory && matchesSearch;
  });

  if (filtered.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-sm text-gray-500">
          No results for &ldquo;{searchQuery}&rdquo;. Try a different search term.
        </p>
      </div>
    );
  }

  return (
    <dl className="divide-y divide-gray-100">
      {filtered.map((item) => {
        const isOpen = openId === item.id;
        return (
          <div key={item.id}>
            <dt>
              <button
                type="button"
                onClick={() => setOpenId(isOpen ? null : item.id)}
                aria-expanded={isOpen}
                aria-controls={`faq-answer-${item.id}`}
                className="flex w-full items-start justify-between gap-4 py-5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
              >
                <span className="text-sm font-medium text-gray-900 sm:text-base">
                  {item.question}
                </span>
                <span
                  className="mt-0.5 shrink-0 text-gray-400 transition-transform"
                  style={{ transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)' }}
                  aria-hidden="true"
                >
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.5}
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 4.5v15m7.5-7.5h-15"
                    />
                  </svg>
                </span>
              </button>
            </dt>
            <dd
              id={`faq-answer-${item.id}`}
              hidden={!isOpen}
              className="pb-5 pr-8 text-sm leading-relaxed text-gray-600"
            >
              {item.answer}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}

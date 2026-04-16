'use client';

import { useState, useId } from 'react';
import { DESTINATION_OPTIONS } from '../types';

interface QuizDestinationStepProps {
  initial: string | null;
  onAnswer: (countryCode: string) => void;
}

export function QuizDestinationStep({ initial, onAnswer }: QuizDestinationStepProps) {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<string | null>(initial);
  const inputId = useId();

  const filtered = query.trim()
    ? DESTINATION_OPTIONS.filter(
        (d) =>
          d.name.toLowerCase().includes(query.toLowerCase()) ||
          d.code.toLowerCase().includes(query.toLowerCase()),
      )
    : DESTINATION_OPTIONS;

  function handleSelect(code: string) {
    setSelected(code);
    onAnswer(code);
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Search */}
      <div>
        <label htmlFor={inputId} className="sr-only">
          Search for a country
        </label>
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
            <svg
              className="h-4 w-4 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
              />
            </svg>
          </div>
          <input
            id={inputId}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search country…"
            className="block w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Country grid */}
      <div
        role="radiogroup"
        aria-label="Destination country"
        className="grid grid-cols-2 gap-2 sm:grid-cols-3 max-h-80 overflow-y-auto pr-1"
      >
        {filtered.map((dest) => {
          const isSelected = selected === dest.code;
          return (
            <button
              key={dest.code}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => handleSelect(dest.code)}
              className={[
                'flex items-center gap-2 rounded-xl border-2 px-3 py-2.5 text-left transition-all duration-150',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
                isSelected
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-gray-50',
              ].join(' ')}
            >
              <span className="text-xl leading-none" aria-hidden="true">
                {dest.flag}
              </span>
              <div className="min-w-0">
                <p
                  className={[
                    'truncate text-xs font-semibold leading-tight',
                    isSelected ? 'text-blue-900' : 'text-gray-900',
                  ].join(' ')}
                >
                  {dest.name}
                </p>
                <p className="text-xs text-gray-400">{dest.currency}</p>
              </div>
            </button>
          );
        })}

        {filtered.length === 0 && (
          <p className="col-span-full py-6 text-center text-sm text-gray-400">
            No countries match &ldquo;{query}&rdquo;
          </p>
        )}
      </div>

      {!selected && (
        <p className="text-xs text-gray-400 text-center">
          Select a destination to continue
        </p>
      )}
    </div>
  );
}

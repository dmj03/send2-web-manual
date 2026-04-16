'use client';

import { useState } from 'react';
import { QuizOptionCard } from './QuizOptionCard';
import type { QuizOptionDef } from '../types';

interface QuizChoiceStepProps<V extends string> {
  options: QuizOptionDef<V>[];
  initial: V | null;
  onAnswer: (value: V) => void;
  /** If true, a "Continue" button is shown and the selection doesn't auto-advance. */
  requireConfirm?: boolean;
}

export function QuizChoiceStep<V extends string>({
  options,
  initial,
  onAnswer,
  requireConfirm = false,
}: QuizChoiceStepProps<V>) {
  const [selected, setSelected] = useState<V | null>(initial);

  function handleSelect(value: string) {
    const typedValue = value as V;
    setSelected(typedValue);
    if (!requireConfirm) {
      onAnswer(typedValue);
    }
  }

  return (
    <div
      className="flex flex-col gap-3"
      role="radiogroup"
      aria-label="Select an option"
    >
      {options.map((opt) => (
        <QuizOptionCard
          key={opt.value}
          value={opt.value}
          label={opt.label}
          description={opt.description}
          icon={opt.icon}
          isSelected={selected === opt.value}
          onSelect={handleSelect}
        />
      ))}

      {requireConfirm && (
        <button
          type="button"
          disabled={selected === null}
          onClick={() => selected !== null && onAnswer(selected)}
          className={[
            'mt-2 w-full rounded-xl py-3.5 text-base font-semibold shadow-sm transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
            selected !== null
              ? 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed',
          ].join(' ')}
          aria-disabled={selected === null}
        >
          See my results
        </button>
      )}
    </div>
  );
}

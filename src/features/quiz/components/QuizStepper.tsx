'use client';

import { QUIZ_STEPS, type QuizStepId } from '../types';

interface QuizStepperProps {
  currentStepIndex: number;
  completedSteps: Set<QuizStepId>;
  onStepClick: (stepId: QuizStepId) => void;
}

export function QuizStepper({
  currentStepIndex,
  completedSteps,
  onStepClick,
}: QuizStepperProps) {
  return (
    <nav aria-label="Quiz progress" className="w-full">
      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-600">
            Step {currentStepIndex + 1} of {QUIZ_STEPS.length}
          </span>
          <span className="text-sm text-gray-500">
            {Math.round(((currentStepIndex + 1) / QUIZ_STEPS.length) * 100)}% complete
          </span>
        </div>
        <div
          className="h-2 w-full rounded-full bg-gray-200"
          role="progressbar"
          aria-valuenow={currentStepIndex + 1}
          aria-valuemin={1}
          aria-valuemax={QUIZ_STEPS.length}
        >
          <div
            className="h-2 rounded-full bg-blue-600 transition-all duration-500 ease-out"
            style={{
              width: `${((currentStepIndex + 1) / QUIZ_STEPS.length) * 100}%`,
            }}
          />
        </div>
      </div>

      {/* Step dots — desktop */}
      <ol className="hidden sm:flex items-center justify-between">
        {QUIZ_STEPS.map((step, idx) => {
          const isCompleted = completedSteps.has(step.id);
          const isCurrent = idx === currentStepIndex;
          const isClickable = isCompleted || idx < currentStepIndex;

          return (
            <li key={step.id} className="flex flex-col items-center gap-1 flex-1">
              {/* Connector line */}
              {idx > 0 && (
                <div className="absolute" style={{ display: 'none' }} />
              )}
              <button
                type="button"
                disabled={!isClickable}
                onClick={() => isClickable && onStepClick(step.id)}
                className={[
                  'flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-colors',
                  isCurrent
                    ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                    : isCompleted
                    ? 'bg-blue-600 text-white hover:bg-blue-700 cursor-pointer'
                    : 'bg-gray-200 text-gray-500 cursor-default',
                ].join(' ')}
                aria-current={isCurrent ? 'step' : undefined}
                aria-label={`${step.title}${isCompleted ? ' (completed)' : ''}`}
              >
                {isCompleted && !isCurrent ? (
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  idx + 1
                )}
              </button>
              <span
                className={[
                  'text-xs text-center max-w-[80px] leading-tight',
                  isCurrent ? 'text-blue-600 font-medium' : 'text-gray-500',
                ].join(' ')}
              >
                {step.title.split(' ').slice(0, 3).join(' ')}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

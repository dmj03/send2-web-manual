'use client';

import { useMemo } from 'react';
import { QuizStepper } from './QuizStepper';
import { QuizAmountStep } from './QuizAmountStep';
import { QuizDestinationStep } from './QuizDestinationStep';
import { QuizChoiceStep } from './QuizChoiceStep';
import { QuizResults } from './QuizResults';
import { useQuiz } from '../hooks/useQuiz';
import {
  QUIZ_STEPS,
  FREQUENCY_OPTIONS,
  URGENCY_OPTIONS,
  PRIORITY_OPTIONS,
  type QuizStepId,
} from '../types';

export function QuizContainer() {
  const {
    currentStepIndex,
    currentStepId,
    answers,
    isComplete,
    isFirstStep,
    goBack,
    goTo,
    answerAmount,
    answerDestination,
    answerFrequency,
    answerUrgency,
    answerPriority,
    reset,
  } = useQuiz();

  const currentStepMeta = QUIZ_STEPS[currentStepIndex]!;

  // Track which steps have been answered for stepper nav
  const completedSteps = useMemo<Set<QuizStepId>>(() => {
    const set = new Set<QuizStepId>();
    if (answers.amount) set.add('amount');
    if (answers.destination) set.add('destination');
    if (answers.frequency) set.add('frequency');
    if (answers.urgency) set.add('urgency');
    if (answers.priority) set.add('priority');
    return set;
  }, [answers]);

  return (
    <div className="mx-auto w-full max-w-xl">
      {/* Card wrapper */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        {/* Card header */}
        <div className="border-b border-gray-100 px-6 pt-6 pb-5">
          <QuizStepper
            currentStepIndex={currentStepIndex}
            completedSteps={completedSteps}
            onStepClick={goTo}
          />
        </div>

        {/* Card body — question or results */}
        <div className="px-6 py-6">
          {!isComplete ? (
            <>
              {/* Step title */}
              <div className="mb-6">
                <h2 className="text-lg font-bold text-gray-900 sm:text-xl">
                  {currentStepMeta.title}
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  {currentStepMeta.subtitle}
                </p>
              </div>

              {/* Step content */}
              {currentStepId === 'amount' && (
                <QuizAmountStep
                  initial={answers.amount}
                  onAnswer={answerAmount}
                />
              )}

              {currentStepId === 'destination' && (
                <QuizDestinationStep
                  initial={answers.destination}
                  onAnswer={answerDestination}
                />
              )}

              {currentStepId === 'frequency' && (
                <QuizChoiceStep
                  options={FREQUENCY_OPTIONS}
                  initial={answers.frequency}
                  onAnswer={answerFrequency}
                />
              )}

              {currentStepId === 'urgency' && (
                <QuizChoiceStep
                  options={URGENCY_OPTIONS}
                  initial={answers.urgency}
                  onAnswer={answerUrgency}
                />
              )}

              {currentStepId === 'priority' && (
                <QuizChoiceStep
                  options={PRIORITY_OPTIONS}
                  initial={answers.priority}
                  onAnswer={answerPriority}
                  requireConfirm
                />
              )}

              {/* Back navigation */}
              {!isFirstStep && (
                <button
                  type="button"
                  onClick={goBack}
                  className="mt-4 flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                  Back
                </button>
              )}
            </>
          ) : (
            <QuizResults answers={answers} onRetake={reset} />
          )}
        </div>
      </div>

      {/* Trust signals */}
      {!isComplete && (
        <p className="mt-4 text-center text-xs text-gray-400">
          🔒 No account required · Live rates from 30+ providers · Takes 60 seconds
        </p>
      )}
    </div>
  );
}

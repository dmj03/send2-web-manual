'use client';

import { useState, useCallback } from 'react';
import {
  QUIZ_STEPS,
  type QuizAnswers,
  type QuizStepId,
  type AmountAnswer,
  type FrequencyValue,
  type UrgencyValue,
  type PriorityValue,
} from '../types';

const INITIAL_ANSWERS: QuizAnswers = {
  amount: null,
  destination: null,
  frequency: null,
  urgency: null,
  priority: null,
};

export interface UseQuizReturn {
  /** Index of the currently visible step (0-based). */
  currentStepIndex: number;
  /** ID of the current step. */
  currentStepId: QuizStepId;
  /** Accumulated answers so far. */
  answers: QuizAnswers;
  /** Whether all 5 steps have been answered and the quiz is complete. */
  isComplete: boolean;
  /** Whether the quiz is on the first step. */
  isFirstStep: boolean;
  /** Whether the quiz is on the last step. */
  isLastStep: boolean;
  /** Advance to the next step (no-op on last step). */
  goNext: () => void;
  /** Go back to the previous step (no-op on first step). */
  goBack: () => void;
  /** Jump directly to a step by id. */
  goTo: (stepId: QuizStepId) => void;
  /** Save the amount + currency answer and advance. */
  answerAmount: (answer: AmountAnswer) => void;
  /** Save the destination country code and advance. */
  answerDestination: (countryCode: string) => void;
  /** Save the frequency answer and advance. */
  answerFrequency: (frequency: FrequencyValue) => void;
  /** Save the urgency answer and advance. */
  answerUrgency: (urgency: UrgencyValue) => void;
  /** Save the priority answer (final step — marks quiz complete). */
  answerPriority: (priority: PriorityValue) => void;
  /** Reset the quiz back to the beginning. */
  reset: () => void;
}

export function useQuiz(): UseQuizReturn {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswers>(INITIAL_ANSWERS);

  const totalSteps = QUIZ_STEPS.length;
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === totalSteps - 1;
  const currentStepId = QUIZ_STEPS[currentStepIndex]!.id;

  const isComplete =
    answers.amount !== null &&
    answers.destination !== null &&
    answers.frequency !== null &&
    answers.urgency !== null &&
    answers.priority !== null;

  const goNext = useCallback(() => {
    setCurrentStepIndex((i) => Math.min(i + 1, totalSteps - 1));
  }, [totalSteps]);

  const goBack = useCallback(() => {
    setCurrentStepIndex((i) => Math.max(i - 1, 0));
  }, []);

  const goTo = useCallback((stepId: QuizStepId) => {
    const idx = QUIZ_STEPS.findIndex((s) => s.id === stepId);
    if (idx !== -1) setCurrentStepIndex(idx);
  }, []);

  const answerAmount = useCallback((answer: AmountAnswer) => {
    setAnswers((prev) => ({ ...prev, amount: answer }));
    setCurrentStepIndex((i) => Math.min(i + 1, totalSteps - 1));
  }, [totalSteps]);

  const answerDestination = useCallback((countryCode: string) => {
    setAnswers((prev) => ({ ...prev, destination: countryCode }));
    setCurrentStepIndex((i) => Math.min(i + 1, totalSteps - 1));
  }, [totalSteps]);

  const answerFrequency = useCallback((frequency: FrequencyValue) => {
    setAnswers((prev) => ({ ...prev, frequency }));
    setCurrentStepIndex((i) => Math.min(i + 1, totalSteps - 1));
  }, [totalSteps]);

  const answerUrgency = useCallback((urgency: UrgencyValue) => {
    setAnswers((prev) => ({ ...prev, urgency }));
    setCurrentStepIndex((i) => Math.min(i + 1, totalSteps - 1));
  }, [totalSteps]);

  const answerPriority = useCallback((priority: PriorityValue) => {
    setAnswers((prev) => ({ ...prev, priority }));
    // Final step — no advance; quiz completion is derived from answers
  }, []);

  const reset = useCallback(() => {
    setAnswers(INITIAL_ANSWERS);
    setCurrentStepIndex(0);
  }, []);

  return {
    currentStepIndex,
    currentStepId,
    answers,
    isComplete,
    isFirstStep,
    isLastStep,
    goNext,
    goBack,
    goTo,
    answerAmount,
    answerDestination,
    answerFrequency,
    answerUrgency,
    answerPriority,
    reset,
  };
}

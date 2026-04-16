'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const contactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Enter a valid email address'),
  subject: z.string().min(5, 'Subject must be at least 5 characters'),
  message: z
    .string()
    .min(20, 'Message must be at least 20 characters')
    .max(2000, 'Message must be under 2000 characters'),
});

type ContactFormValues = z.infer<typeof contactSchema>;

type SubmitStatus = 'idle' | 'success' | 'error';

export function ContactForm() {
  const [status, setStatus] = useState<SubmitStatus>('idle');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
  });

  const onSubmit = async (data: ContactFormValues) => {
    try {
      const baseUrl = process.env['NEXT_PUBLIC_API_BASE_URL'] ?? '';
      const res = await fetch(`${baseUrl}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        throw new Error('Submission failed');
      }

      setStatus('success');
      reset();
    } catch {
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
          <svg
            className="h-7 w-7 text-emerald-600"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900">
          Message sent — thank you!
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          We&apos;ll get back to you within 1–2 business days.
        </p>
        <button
          type="button"
          onClick={() => setStatus('idle')}
          className="mt-4 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="space-y-5"
      aria-label="Contact form"
    >
      {status === 'error' && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          Something went wrong. Please try again or email us directly.
        </div>
      )}

      {/* Name */}
      <div>
        <label
          htmlFor="contact-name"
          className="block text-sm font-medium text-gray-700"
        >
          Full name <span aria-hidden="true" className="text-red-500">*</span>
        </label>
        <input
          id="contact-name"
          type="text"
          autoComplete="name"
          {...register('name')}
          aria-describedby={errors.name ? 'contact-name-error' : undefined}
          aria-invalid={!!errors.name}
          className={[
            'mt-1.5 block w-full rounded-lg border px-4 py-2.5 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors',
            errors.name ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white',
          ].join(' ')}
          placeholder="Jane Smith"
        />
        {errors.name && (
          <p id="contact-name-error" role="alert" className="mt-1 text-xs text-red-600">
            {errors.name.message}
          </p>
        )}
      </div>

      {/* Email */}
      <div>
        <label
          htmlFor="contact-email"
          className="block text-sm font-medium text-gray-700"
        >
          Email address <span aria-hidden="true" className="text-red-500">*</span>
        </label>
        <input
          id="contact-email"
          type="email"
          autoComplete="email"
          {...register('email')}
          aria-describedby={errors.email ? 'contact-email-error' : undefined}
          aria-invalid={!!errors.email}
          className={[
            'mt-1.5 block w-full rounded-lg border px-4 py-2.5 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors',
            errors.email ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white',
          ].join(' ')}
          placeholder="jane@example.com"
        />
        {errors.email && (
          <p id="contact-email-error" role="alert" className="mt-1 text-xs text-red-600">
            {errors.email.message}
          </p>
        )}
      </div>

      {/* Subject */}
      <div>
        <label
          htmlFor="contact-subject"
          className="block text-sm font-medium text-gray-700"
        >
          Subject <span aria-hidden="true" className="text-red-500">*</span>
        </label>
        <input
          id="contact-subject"
          type="text"
          {...register('subject')}
          aria-describedby={errors.subject ? 'contact-subject-error' : undefined}
          aria-invalid={!!errors.subject}
          className={[
            'mt-1.5 block w-full rounded-lg border px-4 py-2.5 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors',
            errors.subject
              ? 'border-red-300 bg-red-50'
              : 'border-gray-300 bg-white',
          ].join(' ')}
          placeholder="Question about a transfer quote"
        />
        {errors.subject && (
          <p id="contact-subject-error" role="alert" className="mt-1 text-xs text-red-600">
            {errors.subject.message}
          </p>
        )}
      </div>

      {/* Message */}
      <div>
        <label
          htmlFor="contact-message"
          className="block text-sm font-medium text-gray-700"
        >
          Message <span aria-hidden="true" className="text-red-500">*</span>
        </label>
        <textarea
          id="contact-message"
          rows={6}
          {...register('message')}
          aria-describedby={
            errors.message ? 'contact-message-error' : 'contact-message-hint'
          }
          aria-invalid={!!errors.message}
          className={[
            'mt-1.5 block w-full resize-y rounded-lg border px-4 py-2.5 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors',
            errors.message
              ? 'border-red-300 bg-red-50'
              : 'border-gray-300 bg-white',
          ].join(' ')}
          placeholder="Tell us how we can help…"
        />
        <p id="contact-message-hint" className="mt-1 text-xs text-gray-400">
          Max 2,000 characters.
        </p>
        {errors.message && (
          <p id="contact-message-error" role="alert" className="mt-1 text-xs text-red-600">
            {errors.message.message}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? (
          <>
            <svg
              className="h-4 w-4 animate-spin"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            Sending…
          </>
        ) : (
          'Send message'
        )}
      </button>
    </form>
  );
}

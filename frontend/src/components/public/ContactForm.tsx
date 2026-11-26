'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { RollUpButton } from '@/components/motion/RollUpButton';
import { isApiError } from '@/lib/api-error';
import { submitPublicEnquiry } from '@/services/public-api';

const PROJECT_TYPES = [
  'Industrial',
  'Commercial',
  'Institutional',
  'Healthcare',
  'Hospitality',
  'Residential',
  'Other',
] as const;

const contactFormSchema = z.object({
  name: z.string().trim().min(2, 'Please enter your full name.').max(120),
  company: z.string().trim().max(160).optional(),
  email: z.string().trim().email('Please enter a valid work email address.').max(254),
  phone: z.string().trim().min(5, 'Please enter a valid phone number.').max(40),
  projectType: z.enum(PROJECT_TYPES, {
    message: 'Please select a project type.',
  }),
  projectLocation: z.string().trim().max(160).optional(),
  projectArea: z.string().trim().max(80).optional(),
  expectedStart: z.string().trim().max(80).optional(),
  message: z
    .string()
    .trim()
    .min(10, 'Please share a brief overview of your project (at least 10 characters).')
    .max(5000),
  consent: z.boolean().refine((val) => val === true, {
    message: 'Please confirm that Northline Build may use these details to respond.',
  }),
});

type ContactFormValues = z.infer<typeof contactFormSchema>;

export function ContactForm() {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: '',
      company: '',
      email: '',
      phone: '',
      projectType: 'Commercial',
      projectLocation: '',
      projectArea: '',
      expectedStart: '',
      message: '',
      consent: false,
    },
  });

  const onSubmit = async (values: ContactFormValues) => {
    setSubmitError(null);
    setSubmitted(false);

    try {
      await submitPublicEnquiry({
        name: values.name,
        company: values.company || undefined,
        email: values.email,
        phone: values.phone,
        projectType: values.projectType,
        projectLocation: values.projectLocation || undefined,
        projectArea: values.projectArea || undefined,
        expectedStart: values.expectedStart || undefined,
        message: values.message,
      });
      setSubmitted(true);
      reset();
    } catch (error) {
      if (isApiError(error)) {
        for (const detail of error.details) {
          if (detail.field && detail.field in values) {
            setError(detail.field as keyof ContactFormValues, {
              type: 'server',
              message: detail.message,
            });
          }
        }
        setSubmitError(
          'We couldn’t submit your enquiry just now. Please check the required fields and try again.',
        );
        return;
      }
      setSubmitError(
        'We couldn’t submit your enquiry just now. Please check the required fields and try again.',
      );
    }
  };

  const inputClass =
    'mt-2 w-full rounded-2xl border border-[#0E0E0E]/12 bg-[#F5F5F7] px-4 py-3.5 text-[0.94rem] text-[#0E0E0E] transition-colors focus:border-[#0E0E0E] focus:bg-white focus:outline-none';

  return (
    <form
      noValidate
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-6 rounded-3xl border border-[#0E0E0E]/12 bg-white p-6 sm:p-10"
    >
      {submitted ? (
        <div
          role="status"
          className="rounded-2xl border border-[#0E0E0E]/15 bg-[#F5F5F7] p-5 text-[#0E0E0E]"
        >
          <p className="text-[0.75rem] font-medium tracking-[0.08em] text-[#5C5C5C] uppercase">
            Enquiry received
          </p>
          <p className="mt-2 text-[0.94rem] leading-[1.6]">
            Thank you for reaching out. Your enquiry has been received. Our team will review the
            details and get back to you.
          </p>
        </div>
      ) : null}

      {submitError ? (
        <div
          role="alert"
          className="rounded-2xl border border-[#0E0E0E] bg-[#F5F5F7] p-4 text-[0.94rem] text-[#0E0E0E]"
        >
          {submitError}
        </div>
      ) : null}

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label
            htmlFor="contact-name"
            className="block text-[0.75rem] font-medium tracking-[0.08em] text-[#5C5C5C] uppercase"
          >
            Full Name *
          </label>
          <input
            id="contact-name"
            type="text"
            autoComplete="name"
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? 'contact-name-error' : undefined}
            {...register('name')}
            className={inputClass}
          />
          {errors.name ? (
            <p id="contact-name-error" className="mt-1.5 text-xs text-[#0E0E0E]">
              {errors.name.message}
            </p>
          ) : null}
        </div>

        <div>
          <label
            htmlFor="contact-company"
            className="block text-[0.75rem] font-medium tracking-[0.08em] text-[#5C5C5C] uppercase"
          >
            Company / Organisation
          </label>
          <input
            id="contact-company"
            type="text"
            autoComplete="organization"
            aria-invalid={Boolean(errors.company)}
            {...register('company')}
            className={inputClass}
          />
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label
            htmlFor="contact-email"
            className="block text-[0.75rem] font-medium tracking-[0.08em] text-[#5C5C5C] uppercase"
          >
            Work Email *
          </label>
          <input
            id="contact-email"
            type="email"
            autoComplete="email"
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? 'contact-email-error' : undefined}
            {...register('email')}
            className={inputClass}
          />
          {errors.email ? (
            <p id="contact-email-error" className="mt-1.5 text-xs text-[#0E0E0E]">
              {errors.email.message}
            </p>
          ) : null}
        </div>

        <div>
          <label
            htmlFor="contact-phone"
            className="block text-[0.75rem] font-medium tracking-[0.08em] text-[#5C5C5C] uppercase"
          >
            Phone Number *
          </label>
          <input
            id="contact-phone"
            type="tel"
            autoComplete="tel"
            aria-invalid={Boolean(errors.phone)}
            aria-describedby={errors.phone ? 'contact-phone-error' : undefined}
            {...register('phone')}
            className={inputClass}
          />
          {errors.phone ? (
            <p id="contact-phone-error" className="mt-1.5 text-xs text-[#0E0E0E]">
              {errors.phone.message}
            </p>
          ) : null}
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label
            htmlFor="contact-project-type"
            className="block text-[0.75rem] font-medium tracking-[0.08em] text-[#5C5C5C] uppercase"
          >
            Project Type
          </label>
          <select
            id="contact-project-type"
            aria-invalid={Boolean(errors.projectType)}
            {...register('projectType')}
            className={inputClass}
          >
            {PROJECT_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          {errors.projectType ? (
            <p className="mt-1.5 text-xs text-[#0E0E0E]">{errors.projectType.message}</p>
          ) : null}
        </div>

        <div>
          <label
            htmlFor="contact-location"
            className="block text-[0.75rem] font-medium tracking-[0.08em] text-[#5C5C5C] uppercase"
          >
            Project Location
          </label>
          <input
            id="contact-location"
            type="text"
            placeholder="City, State"
            aria-invalid={Boolean(errors.projectLocation)}
            {...register('projectLocation')}
            className={inputClass}
          />
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label
            htmlFor="contact-area"
            className="block text-[0.75rem] font-medium tracking-[0.08em] text-[#5C5C5C] uppercase"
          >
            Approximate Project Area (optional)
          </label>
          <input
            id="contact-area"
            type="text"
            placeholder="e.g. 50,000 sq. ft."
            aria-invalid={Boolean(errors.projectArea)}
            {...register('projectArea')}
            className={inputClass}
          />
        </div>

        <div>
          <label
            htmlFor="contact-start"
            className="block text-[0.75rem] font-medium tracking-[0.08em] text-[#5C5C5C] uppercase"
          >
            Expected Project Start (optional)
          </label>
          <input
            id="contact-start"
            type="text"
            placeholder="e.g. Q3 2026"
            aria-invalid={Boolean(errors.expectedStart)}
            {...register('expectedStart')}
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="contact-message"
          className="block text-[0.75rem] font-medium tracking-[0.08em] text-[#5C5C5C] uppercase"
        >
          Project Brief / Message *
        </label>
        <textarea
          id="contact-message"
          rows={5}
          aria-invalid={Boolean(errors.message)}
          aria-describedby={errors.message ? 'contact-message-error' : undefined}
          {...register('message')}
          className={inputClass}
        />
        {errors.message ? (
          <p id="contact-message-error" className="mt-1.5 text-xs text-[#0E0E0E]">
            {errors.message.message}
          </p>
        ) : null}
      </div>

      <div>
        <label className="flex items-start gap-3 text-[0.94rem] text-[#5C5C5C]">
          <input
            type="checkbox"
            {...register('consent')}
            aria-invalid={Boolean(errors.consent)}
            aria-describedby={errors.consent ? 'contact-consent-error' : undefined}
            className="mt-1 h-4 w-4 accent-[#0E0E0E]"
          />
          <span>
            I consent to Northline Build storing and reviewing the submitted information to respond
            to this enquiry.
          </span>
        </label>
        {errors.consent ? (
          <p id="contact-consent-error" className="mt-1.5 text-xs text-[#0E0E0E]">
            {errors.consent.message}
          </p>
        ) : null}
      </div>

      <div className="pt-2">
        <RollUpButton
          type="submit"
          disabled={isSubmitting}
          className="border border-[#0E0E0E] bg-[#0E0E0E] text-white"
          fillClassName="bg-[#5C5C5C]"
          hoverTextClassName="text-white"
        >
          {isSubmitting ? 'Sending enquiry...' : 'SEND PROJECT ENQUIRY'}
        </RollUpButton>
      </div>
    </form>
  );
}

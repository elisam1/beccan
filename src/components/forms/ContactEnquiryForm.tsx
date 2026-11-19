import { AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { schoolRepository } from '../../services/schoolRepository';
import { isNonEmpty, isValidEmail, isValidGhanaPhone } from '../../utils/validation';

interface ContactFormState {
  fullName: string;
  phone: string;
  email: string;
  subject: string;
  message: string;
}

type ContactErrors = Partial<Record<keyof ContactFormState, string>>;

const initialContactState: ContactFormState = {
  fullName: '',
  phone: '',
  email: '',
  subject: 'General School Enquiry',
  message: '',
};

export function ContactEnquiryForm() {
  const profile = schoolRepository.getProfile();
  const [form, setForm] = useState<ContactFormState>(initialContactState);
  const [errors, setErrors] = useState<ContactErrors>({});
  const [submitted, setSubmitted] = useState<ContactFormState | null>(null);

  const validate = (values: ContactFormState): ContactErrors => {
    const nextErrors: ContactErrors = {};
    if (!isNonEmpty(values.fullName, 3)) {
      nextErrors.fullName = 'Please enter your full name.';
    }
    if (!isValidGhanaPhone(values.phone)) {
      nextErrors.phone =
        'Enter a valid Ghanaian telephone number (e.g. 024-740-1641).';
    }
    if (!isValidEmail(values.email)) {
      nextErrors.email = 'Please enter a valid email address.';
    }
    if (!isNonEmpty(values.message, 10)) {
      nextErrors.message = 'Please enter a short message (at least 10 characters).';
    }
    return nextErrors;
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validationErrors = validate(form);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length === 0) {
      setSubmitted(form);
    }
  };

  if (submitted) {
    return (
      <div
        className="bg-[#FFFFFF] border border-[#E6DFD3] p-6 sm:p-8 space-y-5"
        role="status"
        aria-live="polite"
      >
        <div className="flex items-start gap-3">
          <CheckCircle2 className="w-6 h-6 text-[#8D6A26] shrink-0 mt-0.5" />
          <div>
            <h3 className="font-serif text-2xl font-semibold text-[#0F213E]">
              Message Ready (Demonstration Mode)
            </h3>
            <p className="mt-1 text-sm text-[#333D4D] leading-relaxed">
              Thank you, {submitted.fullName}. Your enquiry has been validated
              locally. As this demonstration website is not yet connected to a
              live email relay, you can send it directly via your email app or
              call {profile.contact.telephoneDisplay}.
            </p>
          </div>
        </div>

        <div className="pt-4 border-t border-[#E6DFD3] flex flex-wrap gap-3">
          <a
            href={`mailto:${profile.contact.email}?subject=${encodeURIComponent(
              submitted.subject,
            )}&body=${encodeURIComponent(
              `From: ${submitted.fullName}\nPhone: ${submitted.phone}\nEmail: ${submitted.email}\n\n${submitted.message}`,
            )}`}
            className="min-h-[44px] inline-flex items-center justify-center px-5 py-2.5 bg-[#0F213E] text-[#FBF9F5] text-sm font-medium hover:bg-[#172E54] transition-colors"
          >
            Send via Email Client
          </a>
          <button
            type="button"
            onClick={() => {
              setForm(initialContactState);
              setSubmitted(null);
            }}
            className="min-h-[44px] inline-flex items-center justify-center px-5 py-2.5 border border-[#D4C8B4] bg-[#FBF9F5] text-sm font-medium text-[#0F213E] hover:border-[#0F213E] transition-colors"
          >
            Write Another Message
          </button>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="bg-[#FFFFFF] border border-[#E6DFD3] p-6 sm:p-8 space-y-5"
    >
      <div className="flex items-start gap-3 p-4 bg-[#F4EFE6] border border-[#E6DFD3] text-xs sm:text-sm text-[#333D4D]">
        <Info className="w-4 h-4 text-[#8D6A26] shrink-0 mt-0.5" />
        <p>
          <strong>Demonstration Contact Form:</strong> Validates your message on
          this page until connected to the school’s official mail server. For
          immediate assistance, call{' '}
          <a
            href={profile.contact.telephoneHref}
            className="underline font-medium text-[#0F213E] tabular-nums"
          >
            {profile.contact.telephoneDisplay}
          </a>
          .
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label
            htmlFor="contact-name"
            className="block text-sm font-medium text-[#0F213E] mb-1.5"
          >
            Full Name <span className="text-[#8D6A26]">*</span>
          </label>
          <input
            id="contact-name"
            type="text"
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            aria-invalid={Boolean(errors.fullName)}
            className="w-full min-h-[44px] px-3.5 py-2.5 bg-[#FBF9F5] border border-[#D4C8B4] text-sm text-[#141B29] focus:border-[#0F213E] focus:outline-none"
            placeholder="Your full name"
          />
          {errors.fullName && (
            <p className="mt-1.5 flex items-center gap-1.5 text-xs text-[#9A3412]">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errors.fullName}</span>
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="contact-phone"
            className="block text-sm font-medium text-[#0F213E] mb-1.5"
          >
            Telephone Number <span className="text-[#8D6A26]">*</span>
          </label>
          <input
            id="contact-phone"
            type="tel"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            aria-invalid={Boolean(errors.phone)}
            className="w-full min-h-[44px] px-3.5 py-2.5 bg-[#FBF9F5] border border-[#D4C8B4] text-sm text-[#141B29] focus:border-[#0F213E] focus:outline-none tabular-nums"
            placeholder="024-000-0000"
          />
          {errors.phone && (
            <p className="mt-1.5 flex items-center gap-1.5 text-xs text-[#9A3412]">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errors.phone}</span>
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="contact-email"
            className="block text-sm font-medium text-[#0F213E] mb-1.5"
          >
            Email Address <span className="text-[#8D6A26]">*</span>
          </label>
          <input
            id="contact-email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            aria-invalid={Boolean(errors.email)}
            className="w-full min-h-[44px] px-3.5 py-2.5 bg-[#FBF9F5] border border-[#D4C8B4] text-sm text-[#141B29] focus:border-[#0F213E] focus:outline-none"
            placeholder="you@example.com"
          />
          {errors.email && (
            <p className="mt-1.5 flex items-center gap-1.5 text-xs text-[#9A3412]">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errors.email}</span>
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="contact-subject"
            className="block text-sm font-medium text-[#0F213E] mb-1.5"
          >
            Enquiry Topic
          </label>
          <select
            id="contact-subject"
            value={form.subject}
            onChange={(e) => setForm({ ...form, subject: e.target.value })}
            className="w-full min-h-[44px] px-3.5 py-2.5 bg-[#FBF9F5] border border-[#D4C8B4] text-sm text-[#141B29] focus:border-[#0F213E] focus:outline-none"
          >
            <option value="General School Enquiry">General School Enquiry</option>
            <option value="Admissions & Campus Visit">
              Admissions & Campus Visit
            </option>
            <option value="Academics & Curriculum">Academics & Curriculum</option>
            <option value="Parent / Community Partnership">
              Parent / Community Partnership
            </option>
          </select>
        </div>

        <div className="sm:col-span-2">
          <label
            htmlFor="contact-message"
            className="block text-sm font-medium text-[#0F213E] mb-1.5"
          >
            Message <span className="text-[#8D6A26]">*</span>
          </label>
          <textarea
            id="contact-message"
            rows={4}
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            aria-invalid={Boolean(errors.message)}
            className="w-full px-3.5 py-2.5 bg-[#FBF9F5] border border-[#D4C8B4] text-sm text-[#141B29] focus:border-[#0F213E] focus:outline-none"
            placeholder="How can Beccan School help your family?"
          />
          {errors.message && (
            <p className="mt-1.5 flex items-center gap-1.5 text-xs text-[#9A3412]">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errors.message}</span>
            </p>
          )}
        </div>
      </div>

      <div className="pt-2 flex justify-end">
        <button
          type="submit"
          className="min-h-[44px] px-7 py-3 bg-[#0F213E] text-[#FBF9F5] text-sm font-medium tracking-wide hover:bg-[#172E54] transition-colors cursor-pointer"
        >
          Validate & Send Message
        </button>
      </div>
    </form>
  );
}

import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { schoolRepository } from '../../services/schoolRepository';
import {
  isNonEmpty,
  isPastDate,
  isValidEmail,
  isValidGhanaPhone,
} from '../../utils/validation';
import {
  buildAdmissionWhatsAppMessage,
  buildWhatsAppUrl,
  openWhatsAppUrl,
} from '../../utils/whatsapp';
import { WhatsAppIcon } from '../common/WhatsAppIcon';

interface AdmissionFormState {
  studentName: string;
  dateOfBirth: string;
  gender: string;
  targetClass: string;
  parentName: string;
  phone: string;
  email: string;
  notes: string;
}

type FormErrors = Partial<Record<keyof AdmissionFormState, string>>;

const initialFormState: AdmissionFormState = {
  studentName: '',
  dateOfBirth: '',
  gender: '',
  targetClass: '',
  parentName: '',
  phone: '',
  email: '',
  notes: '',
};

const classOptions = [
  'Early Years / Crèche & Nursery',
  'Kindergarten (KG 1 / KG 2)',
  'Lower Primary (Basic 1 – 3)',
  'Upper Primary (Basic 4 – 6)',
  'Junior High School (JHS 1 – 3)',
];

export function AdmissionEnquiryForm() {
  const profile = schoolRepository.getProfile();
  const [form, setForm] = useState<AdmissionFormState>(initialFormState);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submittedData, setSubmittedData] = useState<{
    data: AdmissionFormState;
    whatsappUrl: string;
  } | null>(null);

  const validate = (values: AdmissionFormState): FormErrors => {
    const nextErrors: FormErrors = {};
    if (!isNonEmpty(values.studentName, 3)) {
      nextErrors.studentName = 'Please enter the learner’s full name.';
    }
    if (!isPastDate(values.dateOfBirth)) {
      nextErrors.dateOfBirth = 'Please enter a valid date of birth.';
    }
    if (!values.gender) {
      nextErrors.gender = 'Please select gender.';
    }
    if (!values.targetClass) {
      nextErrors.targetClass = 'Please select the preferred class level.';
    }
    if (!isNonEmpty(values.parentName, 3)) {
      nextErrors.parentName = 'Please enter the parent or guardian’s full name.';
    }
    if (!isValidGhanaPhone(values.phone)) {
      nextErrors.phone =
        'Enter a valid Ghanaian telephone number (e.g. 024-740-1641).';
    }
    if (values.email.trim() !== '' && !isValidEmail(values.email)) {
      nextErrors.email = 'Please enter a valid email address or leave this blank.';
    }
    return nextErrors;
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validationErrors = validate(form);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length === 0) {
      const message = buildAdmissionWhatsAppMessage(form);
      const whatsappUrl = buildWhatsAppUrl(message);
      openWhatsAppUrl(whatsappUrl);
      setSubmittedData({ data: form, whatsappUrl });
    }
  };

  const handleReset = () => {
    setForm(initialFormState);
    setErrors({});
    setSubmittedData(null);
  };

  if (submittedData) {
    const { data, whatsappUrl } = submittedData;
    return (
      <div
        className="bg-[#FFFFFF] border border-[#E6DFD3] p-6 sm:p-8 space-y-5"
        role="status"
        aria-live="polite"
      >
        <div className="flex items-start gap-3 text-[#0F213E]">
          <CheckCircle2 className="w-6 h-6 text-[#15803D] shrink-0 mt-0.5" />
          <div>
            <h3 className="font-serif text-2xl font-semibold">
              WhatsApp Prepared — Please Press Send to Complete
            </h3>
            <p className="mt-1.5 text-sm text-[#333D4D] leading-relaxed">
              Thank you, {data.parentName}. Your admission enquiry for{' '}
              <strong>{data.studentName}</strong> has been formatted for WhatsApp.
              To submit it to Beccan School ({profile.contact.whatsappDisplay}),
              please review the message in WhatsApp and press <strong>Send</strong>.
            </p>
          </div>
        </div>

        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-[#E6DFD3] text-sm">
          <div>
            <dt className="text-xs uppercase tracking-[0.12em] text-[#5B6472]">
              Applicant
            </dt>
            <dd className="mt-1 font-medium text-[#0F213E]">
              {data.studentName} ({data.gender})
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-[0.12em] text-[#5B6472]">
              Class Applying For
            </dt>
            <dd className="mt-1 font-medium text-[#0F213E]">
              {data.targetClass}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-[0.12em] text-[#5B6472]">
              Parent / Guardian Contact
            </dt>
            <dd className="mt-1 font-medium text-[#0F213E] tabular-nums">
              {data.phone}
              {data.email.trim() ? ` · ${data.email.trim()}` : ''}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-[0.12em] text-[#5B6472]">
              School WhatsApp Line
            </dt>
            <dd className="mt-1 font-medium text-[#0F213E] tabular-nums">
              {profile.contact.whatsappDisplay}
            </dd>
          </div>
        </dl>

        <div className="pt-4 border-t border-[#E6DFD3] flex flex-wrap items-center gap-3">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="min-h-[44px] inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#15803D] text-[#FFFFFF] text-sm font-semibold hover:bg-[#166534] transition-colors"
          >
            <WhatsAppIcon className="w-4 h-4 shrink-0" />
            <span>Open WhatsApp Again</span>
          </a>
          <button
            type="button"
            onClick={handleReset}
            className="min-h-[44px] inline-flex items-center justify-center px-5 py-2.5 border border-[#D4C8B4] bg-[#FBF9F5] text-sm font-medium text-[#0F213E] hover:border-[#0F213E] transition-colors cursor-pointer"
          >
            Prepare Another Application
          </button>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="bg-[#FFFFFF] border border-[#E6DFD3] p-6 sm:p-8 space-y-6"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="sm:col-span-2">
          <label
            htmlFor="adm-student-name"
            className="block text-sm font-medium text-[#0F213E] mb-1.5"
          >
            Applicant’s Full Name <span className="text-[#8D6A26]">*</span>
          </label>
          <input
            id="adm-student-name"
            type="text"
            value={form.studentName}
            onChange={(e) => setForm({ ...form, studentName: e.target.value })}
            aria-invalid={Boolean(errors.studentName)}
            className="w-full min-h-[44px] px-3.5 py-2.5 bg-[#FBF9F5] border border-[#D4C8B4] text-[#141B29] text-sm focus:border-[#0F213E] focus:outline-none"
            placeholder="e.g. Kwame Mensah"
          />
          {errors.studentName && (
            <p className="mt-1.5 flex items-center gap-1.5 text-xs text-[#9A3412]">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errors.studentName}</span>
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="adm-dob"
            className="block text-sm font-medium text-[#0F213E] mb-1.5"
          >
            Date of Birth <span className="text-[#8D6A26]">*</span>
          </label>
          <input
            id="adm-dob"
            type="date"
            value={form.dateOfBirth}
            onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
            aria-invalid={Boolean(errors.dateOfBirth)}
            className="w-full min-h-[44px] px-3.5 py-2.5 bg-[#FBF9F5] border border-[#D4C8B4] text-[#141B29] text-sm focus:border-[#0F213E] focus:outline-none tabular-nums"
          />
          {errors.dateOfBirth && (
            <p className="mt-1.5 flex items-center gap-1.5 text-xs text-[#9A3412]">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errors.dateOfBirth}</span>
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="adm-gender"
            className="block text-sm font-medium text-[#0F213E] mb-1.5"
          >
            Gender <span className="text-[#8D6A26]">*</span>
          </label>
          <select
            id="adm-gender"
            value={form.gender}
            onChange={(e) => setForm({ ...form, gender: e.target.value })}
            aria-invalid={Boolean(errors.gender)}
            className="w-full min-h-[44px] px-3.5 py-2.5 bg-[#FBF9F5] border border-[#D4C8B4] text-[#141B29] text-sm focus:border-[#0F213E] focus:outline-none"
          >
            <option value="">Select gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
          {errors.gender && (
            <p className="mt-1.5 flex items-center gap-1.5 text-xs text-[#9A3412]">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errors.gender}</span>
            </p>
          )}
        </div>

        <div className="sm:col-span-2">
          <label
            htmlFor="adm-class"
            className="block text-sm font-medium text-[#0F213E] mb-1.5"
          >
            Class Applying For <span className="text-[#8D6A26]">*</span>
          </label>
          <select
            id="adm-class"
            value={form.targetClass}
            onChange={(e) => setForm({ ...form, targetClass: e.target.value })}
            aria-invalid={Boolean(errors.targetClass)}
            className="w-full min-h-[44px] px-3.5 py-2.5 bg-[#FBF9F5] border border-[#D4C8B4] text-[#141B29] text-sm focus:border-[#0F213E] focus:outline-none"
          >
            <option value="">Select class level</option>
            {classOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          {errors.targetClass && (
            <p className="mt-1.5 flex items-center gap-1.5 text-xs text-[#9A3412]">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errors.targetClass}</span>
            </p>
          )}
        </div>

        <div className="sm:col-span-2">
          <label
            htmlFor="adm-parent"
            className="block text-sm font-medium text-[#0F213E] mb-1.5"
          >
            Parent / Guardian’s Full Name <span className="text-[#8D6A26]">*</span>
          </label>
          <input
            id="adm-parent"
            type="text"
            value={form.parentName}
            onChange={(e) => setForm({ ...form, parentName: e.target.value })}
            aria-invalid={Boolean(errors.parentName)}
            className="w-full min-h-[44px] px-3.5 py-2.5 bg-[#FBF9F5] border border-[#D4C8B4] text-[#141B29] text-sm focus:border-[#0F213E] focus:outline-none"
            placeholder="e.g. Abena Mensah"
          />
          {errors.parentName && (
            <p className="mt-1.5 flex items-center gap-1.5 text-xs text-[#9A3412]">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errors.parentName}</span>
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="adm-phone"
            className="block text-sm font-medium text-[#0F213E] mb-1.5"
          >
            Parent / Guardian Phone Number <span className="text-[#8D6A26]">*</span>
          </label>
          <input
            id="adm-phone"
            type="tel"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            aria-invalid={Boolean(errors.phone)}
            className="w-full min-h-[44px] px-3.5 py-2.5 bg-[#FBF9F5] border border-[#D4C8B4] text-[#141B29] text-sm focus:border-[#0F213E] focus:outline-none tabular-nums"
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
            htmlFor="adm-email"
            className="block text-sm font-medium text-[#0F213E] mb-1.5"
          >
            Parent / Guardian Email (Optional)
          </label>
          <input
            id="adm-email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            aria-invalid={Boolean(errors.email)}
            className="w-full min-h-[44px] px-3.5 py-2.5 bg-[#FBF9F5] border border-[#D4C8B4] text-[#141B29] text-sm focus:border-[#0F213E] focus:outline-none"
            placeholder="parent@example.com"
          />
          {errors.email && (
            <p className="mt-1.5 flex items-center gap-1.5 text-xs text-[#9A3412]">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errors.email}</span>
            </p>
          )}
        </div>

        <div className="sm:col-span-2">
          <label
            htmlFor="adm-notes"
            className="block text-sm font-medium text-[#0F213E] mb-1.5"
          >
            Additional Questions or Notes (Optional)
          </label>
          <textarea
            id="adm-notes"
            rows={3}
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            className="w-full px-3.5 py-2.5 bg-[#FBF9F5] border border-[#D4C8B4] text-[#141B29] text-sm focus:border-[#0F213E] focus:outline-none"
            placeholder="Preferred campus visit day or questions about term dates"
          />
        </div>
      </div>

      <div className="pt-4 border-t border-[#E6DFD3] space-y-4">
        <p className="text-xs sm:text-sm text-[#4A5568] leading-relaxed">
          Your application details will open in WhatsApp. Please review the
          information and press Send to submit your enquiry to the school.
        </p>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="text-xs text-[#5B6472]">
            Fields marked with <span className="text-[#8D6A26]">*</span> are required.
          </p>
          <button
            type="submit"
            className="min-h-[44px] inline-flex items-center justify-center gap-2 px-7 py-3 bg-[#15803D] text-[#FFFFFF] text-sm font-semibold tracking-wide hover:bg-[#166534] transition-colors cursor-pointer"
          >
            <WhatsAppIcon className="w-4 h-4 shrink-0" />
            <span>Submit via WhatsApp</span>
          </button>
        </div>
      </div>
    </form>
  );
}

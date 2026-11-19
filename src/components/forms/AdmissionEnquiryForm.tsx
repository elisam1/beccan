import { AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { schoolRepository } from '../../services/schoolRepository';
import {
  isNonEmpty,
  isPastDate,
  isValidEmail,
  isValidGhanaPhone,
} from '../../utils/validation';

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
  'Early Years / Crèche & Nursery (Availability to be confirmed)',
  'Kindergarten (KG 1 / KG 2)',
  'Lower Primary (Basic 1 – 3)',
  'Upper Primary (Basic 4 – 6)',
  'Junior High School (JHS 1 – 3 · Availability to be confirmed)',
];

export function AdmissionEnquiryForm() {
  const profile = schoolRepository.getProfile();
  const [form, setForm] = useState<AdmissionFormState>(initialFormState);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submittedData, setSubmittedData] = useState<AdmissionFormState | null>(
    null,
  );

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
    if (!isValidEmail(values.email)) {
      nextErrors.email = 'Please enter a valid email address.';
    }
    return nextErrors;
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validationErrors = validate(form);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length === 0) {
      setSubmittedData(form);
    }
  };

  const handleReset = () => {
    setForm(initialFormState);
    setErrors({});
    setSubmittedData(null);
  };

  if (submittedData) {
    return (
      <div
        className="bg-[#FFFFFF] border border-[#E6DFD3] p-6 sm:p-8 space-y-5"
        role="status"
        aria-live="polite"
      >
        <div className="flex items-start gap-3 text-[#0F213E]">
          <CheckCircle2 className="w-6 h-6 text-[#8D6A26] shrink-0 mt-0.5" />
          <div>
            <h3 className="font-serif text-2xl font-semibold">
              Admission Enquiry Validated (Demonstration Mode)
            </h3>
            <p className="mt-1 text-sm text-[#333D4D] leading-relaxed">
              Thank you, {submittedData.parentName}. Your enquiry details for{' '}
              <strong>{submittedData.studentName}</strong> passed client-side
              validation. Because this demonstration site is not yet connected to
              a live school database, no record has been transmitted automatically.
            </p>
          </div>
        </div>

        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-[#E6DFD3] text-sm">
          <div>
            <dt className="text-xs uppercase tracking-[0.12em] text-[#5B6472]">
              Learner
            </dt>
            <dd className="mt-1 font-medium text-[#0F213E]">
              {submittedData.studentName} ({submittedData.gender})
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-[0.12em] text-[#5B6472]">
              Preferred Level
            </dt>
            <dd className="mt-1 font-medium text-[#0F213E]">
              {submittedData.targetClass}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-[0.12em] text-[#5B6472]">
              Parent Contact
            </dt>
            <dd className="mt-1 font-medium text-[#0F213E] tabular-nums">
              {submittedData.phone} · {submittedData.email}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-[0.12em] text-[#5B6472]">
              Direct School Office
            </dt>
            <dd className="mt-1 font-medium text-[#0F213E] tabular-nums">
              Call {profile.contact.telephoneDisplay} or email{' '}
              {profile.contact.email}
            </dd>
          </div>
        </dl>

        <div className="pt-4 border-t border-[#E6DFD3] flex flex-wrap items-center gap-4">
          <a
            href={`mailto:${profile.contact.email}?subject=${encodeURIComponent(
              `Admission Enquiry: ${submittedData.studentName}`,
            )}&body=${encodeURIComponent(
              `Learner: ${submittedData.studentName}\nDOB: ${submittedData.dateOfBirth}\nClass: ${submittedData.targetClass}\nParent: ${submittedData.parentName}\nPhone: ${submittedData.phone}\nNotes: ${submittedData.notes}`,
            )}`}
            className="min-h-[44px] inline-flex items-center justify-center px-5 py-2.5 bg-[#0F213E] text-[#FBF9F5] text-sm font-medium hover:bg-[#172E54] transition-colors"
          >
            Open in Email Client
          </a>
          <button
            type="button"
            onClick={handleReset}
            className="min-h-[44px] inline-flex items-center justify-center px-5 py-2.5 border border-[#D4C8B4] bg-[#FBF9F5] text-sm font-medium text-[#0F213E] hover:border-[#0F213E] transition-colors"
          >
            Submit Another Enquiry
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
      <div className="flex items-start gap-3 p-4 bg-[#F4EFE6] border border-[#E6DFD3] text-xs sm:text-sm text-[#333D4D]">
        <Info className="w-4 h-4 text-[#8D6A26] shrink-0 mt-0.5" />
        <p>
          <strong>Demonstration Enquiry Form:</strong> Inputs are validated on
          your device. Until connected to the school’s intake backend, please
          follow up directly via{' '}
          <a
            href={profile.contact.telephoneHref}
            className="underline font-medium text-[#0F213E] tabular-nums"
          >
            {profile.contact.telephoneDisplay}
          </a>{' '}
          or{' '}
          <a
            href={`mailto:${profile.contact.email}`}
            className="underline font-medium text-[#0F213E]"
          >
            {profile.contact.email}
          </a>
          .
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="sm:col-span-2">
          <label
            htmlFor="adm-student-name"
            className="block text-sm font-medium text-[#0F213E] mb-1.5"
          >
            Learner’s Full Name <span className="text-[#8D6A26]">*</span>
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
            Parent / Guardian Name <span className="text-[#8D6A26]">*</span>
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
            Telephone Number <span className="text-[#8D6A26]">*</span>
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
            Email Address <span className="text-[#8D6A26]">*</span>
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

      <div className="pt-2 flex flex-wrap items-center justify-between gap-4">
        <p className="text-xs text-[#5B6472]">
          Fields marked with <span className="text-[#8D6A26]">*</span> are required.
        </p>
        <button
          type="submit"
          className="min-h-[44px] px-7 py-3 bg-[#0F213E] text-[#FBF9F5] text-sm font-medium tracking-wide hover:bg-[#172E54] transition-colors cursor-pointer"
        >
          Validate & Review Enquiry
        </button>
      </div>
    </form>
  );
}

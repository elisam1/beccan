import { AdmissionFaq, AdmissionStep } from '../types/school';

export const admissionSteps: AdmissionStep[] = [
  {
    stepNumber: '01',
    title: 'Submit an Admission Enquiry',
    description:
      'Complete the admission enquiry form below to send your child’s details directly to the school office via WhatsApp, or call 024-740-1641.',
  },
  {
    stepNumber: '02',
    title: 'Campus Visit & Office Consultation',
    description:
      'Arrange a visit to the Beccan School campus in Dodowa to meet administration, tour the school compound, and confirm class availability for the upcoming term.',
  },
  {
    stepNumber: '03',
    title: 'Readiness Review & Document Check',
    description:
      'Provide standard learner records requested by administration, such as a birth certificate copy, immunisation card where applicable, and previous school report for transfers.',
  },
  {
    stepNumber: '04',
    title: 'Enrolment Confirmation',
    description:
      'Receive placement confirmation, term fee schedule, uniform guidance, and orientation dates directly from Beccan School administration.',
  },
];

export const admissionRequirements: { item: string; note: string }[] = [
  {
    item: 'Completed Admission Enquiry',
    note: 'Learner full name, date of birth, gender, target class, and parent or guardian contact details submitted via our WhatsApp-assisted form.',
  },
  {
    item: 'Learner Identity & Age Record',
    note: 'A copy of the learner’s birth certificate and health/immunisation record where applicable for early years placements.',
  },
  {
    item: 'Previous Academic Records (Transfer Pupils)',
    note: 'Most recent school report card or transfer record for learners joining from another school.',
  },
  {
    item: 'Fee Schedule & Uniform Guidance',
    note: 'Current term fee details and uniform requirements are provided directly by the school office upon enquiry.',
  },
];

export const admissionFaqs: AdmissionFaq[] = [
  {
    id: 'faq-classes',
    question: 'Which class levels are open for admission?',
    answer:
      'Beccan School serves learners across basic education in Dodowa. Message us on WhatsApp or call 024-740-1641 to check current vacancies and term openings for your child’s class level.',
  },
  {
    id: 'faq-fees',
    question: 'How can parents obtain the school fee schedule?',
    answer:
      'Current term fee schedules and payment details are shared directly by the admissions office when you reach out on WhatsApp or visit the campus in Dodowa.',
  },
  {
    id: 'faq-visit',
    question: 'Can parents visit the Dodowa campus before applying?',
    answer:
      'Yes—parents and guardians are warmly encouraged to message us on WhatsApp, call 024-740-1641, or email info@beccanschool.com to schedule an in-person campus visit.',
  },
  {
    id: 'faq-form',
    question: 'How does the online admission form work?',
    answer:
      'Submitting the form validates your child’s details and opens a pre-filled admission enquiry in WhatsApp addressed to Beccan School (024-740-1641). Review the message and press Send in WhatsApp so our admissions office can assist you with the next steps.',
  },
];

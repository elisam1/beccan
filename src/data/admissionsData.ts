import { AdmissionFaq, AdmissionStep } from '../types/school';

export const admissionSteps: AdmissionStep[] = [
  {
    stepNumber: '01',
    title: 'Submit an Admission Enquiry',
    description:
      'Complete the online admission enquiry form below with your child’s details and preferred class level, or contact the school office directly by phone on 024-740-1641.',
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
      'Provide standard learner records requested by administration (such as birth certificate copy, immunisation card where applicable, and previous school report for transfers).',
  },
  {
    stepNumber: '04',
    title: 'Enrolment Confirmation',
    description:
      'Receive official placement confirmation, term fee schedule, uniform guidance, and orientation dates directly from the Beccan School administration.',
  },
];

export const admissionRequirements: { item: string; note: string }[] = [
  {
    item: 'Completed Admission Enquiry / Application Form',
    note: 'Capturing learner full name, date of birth, gender, target class, and parent/guardian contact details (aligned with existing admission.html fields).',
  },
  {
    item: 'Learner Identity & Age Verification',
    note: 'Specific required documents (e.g., Ghana Card / Birth Certificate / Health Weighing Card for early years) to be confirmed with the school office.',
  },
  {
    item: 'Previous Academic Records (Transfer Pupils)',
    note: 'Most recent school report card or transfer record, where applicable—requirements confirmed during consultation.',
  },
  {
    item: 'Fee Schedule & Uniform Details',
    note: 'Official tuition, feeding/transport options (if offered), and uniform requirements are issued strictly by school administration upon enquiry.',
  },
];

export const admissionFaqs: AdmissionFaq[] = [
  {
    id: 'faq-classes',
    question: 'Which class levels are currently open for admission?',
    answer:
      'Ghana’s national school directory lists Beccan School as a Basic School in the Shai-Osudoku District. Please contact 024-740-1641 or submit an enquiry to confirm exact vacancies across Early Years, Primary, and Junior High streams for the current term.',
    requiresConfirmation: true,
  },
  {
    id: 'faq-fees',
    question: 'Are school fees published on the website?',
    answer:
      'Official fee schedules are not published publicly online until verified for the active academic year by school management. Prospective parents receive the current term fee breakdown directly from the admissions office.',
    requiresConfirmation: true,
  },
  {
    id: 'faq-visit',
    question: 'Can parents visit the Dodowa campus before applying?',
    answer:
      'Yes—parents and guardians are warmly encouraged to call 024-740-1641 or email info@beccanschool.com to schedule an in-person campus visit and speak with school leadership.',
    requiresConfirmation: false,
  },
  {
    id: 'faq-form',
    question: 'Does submitting the online form immediately enrol my child?',
    answer:
      'In this demonstration redesign, submitting the form validates your details and prepares an enquiry summary for review. Once connected to the school’s live intake system, administration will follow up directly to complete placement.',
    requiresConfirmation: false,
  },
];

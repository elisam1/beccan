export const BECCAN_WHATSAPP_NUMBER = '233247401641';
export const BECCAN_WHATSAPP_DISPLAY = '024-740-1641';

export const WHATSAPP_MESSAGES = {
  general:
    'Hello Beccan School. I would like to make a general enquiry. Please assist me.',
  floating:
    'Hello Beccan School. I would like to make an enquiry. Please assist me.',
  admissions:
    'Hello Beccan School. I would like to enquire about admission for my child. Please assist me.',
  academics:
    'Hello Beccan School. I would like to enquire about your academic programmes and class options. Please assist me.',
  facilities:
    'Hello Beccan School. I would like to enquire about your school facilities and campus visits. Please assist me.',
  campusVisit:
    'Hello Beccan School. I would like to schedule a visit to the campus in Dodowa. Please let me know the available hours.',
  directions:
    'Hello Beccan School. Please share directions to the Dodowa campus for a visit.',
  newsAndEvents:
    'Hello Beccan School. I would like to enquire about recent school announcements or upcoming events. Please assist me.',
} as const;

export function buildWhatsAppUrl(message: string): string {
  return `https://wa.me/${BECCAN_WHATSAPP_NUMBER}?text=${encodeURIComponent(
    message.trim(),
  )}`;
}

export function openWhatsAppUrl(url: string): void {
  const link = document.createElement('a');
  link.href = url;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  link.remove();
}

export interface AdmissionWhatsAppPayload {
  studentName: string;
  dateOfBirth: string;
  gender: string;
  targetClass: string;
  parentName: string;
  phone: string;
  email?: string;
  notes?: string;
}

export function buildAdmissionWhatsAppMessage(
  data: AdmissionWhatsAppPayload,
): string {
  const lines = [
    'BECCAN SCHOOL',
    'NEW ADMISSION ENQUIRY',
    '',
    'Applicant Information',
    `Full Name: ${data.studentName.trim()}`,
    `Date of Birth: ${data.dateOfBirth.trim()}`,
    `Gender: ${data.gender.trim()}`,
    `Class Applying For: ${data.targetClass.trim()}`,
    '',
    'Parent/Guardian Information',
    `Name: ${data.parentName.trim()}`,
    `Phone: ${data.phone.trim()}`,
  ];

  const cleanEmail = data.email?.trim();
  if (cleanEmail) {
    lines.push(`Email: ${cleanEmail}`);
  }

  const cleanNotes = data.notes?.trim();
  if (cleanNotes) {
    lines.push('', 'Additional Notes', cleanNotes);
  }

  lines.push(
    '',
    'I would like to apply for admission to Beccan School. Please contact me with the next steps.',
  );

  return lines.join('\n');
}

export interface ContactWhatsAppPayload {
  fullName: string;
  phone: string;
  email?: string;
  subject: string;
  message: string;
}

export function buildContactWhatsAppMessage(
  data: ContactWhatsAppPayload,
): string {
  const lines = [
    'BECCAN SCHOOL',
    'SCHOOL ENQUIRY',
    '',
    `Topic: ${data.subject.trim()}`,
    `Name: ${data.fullName.trim()}`,
    `Phone: ${data.phone.trim()}`,
  ];

  const cleanEmail = data.email?.trim();
  if (cleanEmail) {
    lines.push(`Email: ${cleanEmail}`);
  }

  lines.push('', 'Message', data.message.trim());

  return lines.join('\n');
}

export function buildAnnouncementWhatsAppMessage(title: string): string {
  return `Hello Beccan School. I would like to enquire about the school announcement: "${title.trim()}". Please assist me.`;
}

export function buildEventWhatsAppMessage(
  title: string,
  eventDateLabel?: string,
): string {
  const dateSuffix = eventDateLabel ? ` (${eventDateLabel})` : '';
  return `Hello Beccan School. I would like to enquire about the school event "${title.trim()}"${dateSuffix}. Please assist me.`;
}

export function buildArticleWhatsAppMessage(title: string): string {
  return `Hello Beccan School. I would like to enquire about your news article: "${title.trim()}". Please assist me.`;
}

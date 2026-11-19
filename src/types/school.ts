export interface SchoolContact {
  campusLabel: string;
  town: string;
  district: string;
  region: string;
  country: string;
  streetAddressNote: string;
  telephoneDisplay: string;
  telephoneHref: string;
  whatsappNumber: string;
  whatsappDisplay: string;
  email: string;
  officeHoursNote: string;
}

export interface CoreValue {
  id: string;
  title: string;
  summary: string;
}

export interface SchoolProfile {
  tenantId: string;
  name: string;
  shortName: string;
  motto: string;
  mottoParts: [string, string, string];
  registryClassification: string;
  welcomeHeadline: string;
  welcomeParagraphs: string[];
  vision: string;
  mission: string;
  anthem: {
    title: string;
    stanza: string[];
  };
  coreValues: CoreValue[];
  historyNote: string;
  contact: SchoolContact;
}

export interface AcademicDivision {
  id: string;
  title: string;
  summary: string;
  learningFocus: string[];
}

export interface AcademicPillar {
  id: string;
  number: string;
  title: string;
  description: string;
}

export interface AdmissionStep {
  stepNumber: string;
  title: string;
  description: string;
}

export interface AdmissionFaq {
  id: string;
  question: string;
  answer: string;
}

export interface FacilityItem {
  id: string;
  title: string;
  category: 'Campus' | 'Learning Spaces' | 'Recreation';
  summary: string;
  observedDetails: string[];
  imageUrl?: string;
  imageAlt?: string;
}

export type GalleryCategory =
  | 'All'
  | 'Campus & Grounds'
  | 'Learning Spaces'
  | 'Student Life & Events';

export interface GalleryItem {
  id: string;
  title: string;
  category: Exclude<GalleryCategory, 'All'>;
  caption: string;
  dateLabel: string;
  imageUrl?: string;
  imageAlt?: string;
}

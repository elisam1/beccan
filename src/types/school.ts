export type VerificationStatus =
  | 'verified'
  | 'pending-confirmation'
  | 'safeguarding-hold';

export interface SchoolContact {
  campusLabel: string;
  town: string;
  district: string;
  region: string;
  country: string;
  streetAddressNote: string;
  telephoneDisplay: string;
  telephoneHref: string;
  email: string;
  officeHoursNote: string;
  mapVerificationNote: string;
}

export interface CoreValue {
  id: string;
  title: string;
  summary: string;
  sourceBasis: string;
}

export interface LeadershipSlot {
  role: string;
  occupantStatus: string;
  messageTitle: string;
  messageBody: string;
  verificationStatus: VerificationStatus;
}

export interface SchoolProfile {
  tenantId: string;
  name: string;
  shortName: string;
  motto: string;
  mottoParts: [string, string, string];
  establishedNote: string;
  registryClassification: string;
  welcomeHeadline: string;
  welcomeParagraphs: string[];
  vision: string;
  mission: string;
  anthem: {
    title: string;
    stanza: string[];
    sourceNote: string;
  };
  coreValues: CoreValue[];
  leadership: LeadershipSlot[];
  historyNote: string;
  contact: SchoolContact;
}

export interface AcademicDivision {
  id: string;
  title: string;
  registryNote: string;
  summary: string;
  learningFocus: string[];
  verificationStatus: VerificationStatus;
}

export interface AcademicPillar {
  id: string;
  number: string;
  title: string;
  description: string;
  sourceBasis: string;
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
  requiresConfirmation: boolean;
}

export interface FacilityItem {
  id: string;
  title: string;
  category: 'Campus' | 'Learning Spaces' | 'Recreation' | 'Digital & Resources';
  summary: string;
  observedDetails: string[];
  imageUrl?: string;
  imageAlt?: string;
  imageSourceNote?: string;
  verificationStatus: VerificationStatus;
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
  sourceAttribution: string;
  dateLabel: string;
  imageUrl?: string;
  imageAlt?: string;
  verificationStatus: VerificationStatus;
  safeguardingNote?: string;
}

export type NewsCategory = 'Announcement' | 'Admissions' | 'Campus Update' | 'Community';

export interface NewsArticle {
  slug: string;
  title: string;
  category: NewsCategory;
  publishedLabel: string;
  readTime: string;
  excerpt: string;
  body: string[];
  isEditorialPlaceholder: boolean;
  verificationNote: string;
}

export interface ResearchRecord {
  topic: string;
  discoveredInfo: string;
  source: string;
  officialSupport: 'Official Website' | 'Public Registry' | 'Conflict Flagged' | 'Unverified';
  needsConfirmation: boolean;
}

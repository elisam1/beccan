import { academicDivisions, academicPillars } from '../data/academicsData';
import {
  admissionFaqs,
  admissionRequirements,
  admissionSteps,
} from '../data/admissionsData';
import { campusHeroPhoto, facilitiesList } from '../data/facilitiesData';
import { researchInventory } from '../data/researchData';
import { schoolProfile } from '../data/schoolData';
import {
  AcademicDivision,
  AcademicPillar,
  AdmissionFaq,
  AdmissionStep,
  FacilityItem,
  ResearchRecord,
  SchoolProfile,
} from '../types/school';

/**
 * Repository for verified static institutional content (school profile,
 * academics, admissions guidance, facilities, and research audit).
 * Dynamic media, news, announcements, and events are served via src/services/cmsApi.ts.
 */
export interface SchoolContentRepository {
  getProfile(tenantId?: string): SchoolProfile;
  getCampusHeroPhoto(): typeof campusHeroPhoto;
  getAcademicDivisions(): AcademicDivision[];
  getAcademicPillars(): AcademicPillar[];
  getAdmissionSteps(): AdmissionStep[];
  getAdmissionRequirements(): typeof admissionRequirements;
  getAdmissionFaqs(): AdmissionFaq[];
  getFacilities(): FacilityItem[];
  getResearchInventory(): ResearchRecord[];
}

export const schoolRepository: SchoolContentRepository = {
  getProfile: () => schoolProfile,
  getCampusHeroPhoto: () => campusHeroPhoto,
  getAcademicDivisions: () => academicDivisions,
  getAcademicPillars: () => academicPillars,
  getAdmissionSteps: () => admissionSteps,
  getAdmissionRequirements: () => admissionRequirements,
  getAdmissionFaqs: () => admissionFaqs,
  getFacilities: () => facilitiesList,
  getResearchInventory: () => researchInventory,
};

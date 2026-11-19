import { academicDivisions, academicPillars } from '../data/academicsData';
import {
  admissionFaqs,
  admissionRequirements,
  admissionSteps,
} from '../data/admissionsData';
import { campusHeroPhoto, facilitiesList } from '../data/facilitiesData';
import { schoolProfile } from '../data/schoolData';
import {
  AcademicDivision,
  AcademicPillar,
  AdmissionFaq,
  AdmissionStep,
  FacilityItem,
  SchoolProfile,
} from '../types/school';

export interface SchoolContentRepository {
  getProfile(tenantId?: string): SchoolProfile;
  getCampusHeroPhoto(): typeof campusHeroPhoto;
  getAcademicDivisions(): AcademicDivision[];
  getAcademicPillars(): AcademicPillar[];
  getAdmissionSteps(): AdmissionStep[];
  getAdmissionRequirements(): typeof admissionRequirements;
  getAdmissionFaqs(): AdmissionFaq[];
  getFacilities(): FacilityItem[];
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
};

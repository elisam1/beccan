import campusPhoto from '../assets/images/beccan_campus_building.jpg';
import { FacilityItem } from '../types/school';

export const campusHeroPhoto = {
  src: campusPhoto,
  alt: 'Beccan School campus in Dodowa showing the two-storey main school building, adjacent classroom block, covered porch, trampoline, and painted tire courtyard.',
  caption:
    'Beccan School campus and courtyard in Dodowa, Greater Accra — sourced from the existing school website (beccanschool.site), pending confirmation as current-year photography.',
};

export const facilitiesList: FacilityItem[] = [
  {
    id: 'main-campus-building',
    title: 'Main School Building & Classroom Wing',
    category: 'Campus',
    summary:
      'A multi-unit campus compound featuring a two-storey main academic and administrative building with a covered veranda alongside a single-storey classroom block opening onto a central courtyard.',
    observedDetails: [
      'Two-storey main structure with pitched metal roof and stone-clad base',
      'Covered front porch and adjacent single-storey classroom wing',
      'Open central courtyard separating teaching spaces and play areas',
    ],
    imageUrl: campusPhoto,
    imageAlt:
      'Two-storey main building and adjacent single-storey classroom wing at Beccan School in Dodowa.',
    imageSourceNote:
      'Verified photograph from beccanschool.site (photo_2026-03-18_00-54-33.jpg); pending current-year confirmation by management.',
    verificationStatus: 'verified',
  },
  {
    id: 'courtyard-playground',
    title: 'Courtyard & Outdoor Play Area',
    category: 'Recreation',
    summary:
      'An enclosed central compound supporting supervised physical activity and early-years movement, visible in the school’s campus photograph.',
    observedDetails: [
      'Enclosed safety-netted trampoline visible beside the main porch',
      'Row of painted courtyard tires forming a dedicated activity border',
      'Open sandy compound suitable for assembly and supervised recreation',
    ],
    verificationStatus: 'verified',
  },
  {
    id: 'classrooms',
    title: 'Classrooms & Learning Spaces',
    category: 'Learning Spaces',
    summary:
      'Dedicated classrooms housed across the main building and single-storey wing. Detailed room capacities, furniture configurations, and interior photographs are awaiting official documentation from school management.',
    observedDetails: [
      'Multiple classroom bays visible along the single-storey wing',
      'Interior capacity, ventilation, and teaching-aid specifications pending verification',
    ],
    verificationStatus: 'pending-confirmation',
  },
  {
    id: 'library',
    title: 'Library & Reading Resources',
    category: 'Digital & Resources',
    summary:
      'While Beccan School’s mission emphasises literacy, curiosity, and inquiry, the presence, collection size, and room setup of a dedicated school library remain to be verified with administration.',
    observedDetails: [
      'Facility profile reserved for official management confirmation',
      'Awaiting verified interior photography and book-borrowing details',
    ],
    verificationStatus: 'pending-confirmation',
  },
  {
    id: 'ict-facilities',
    title: 'ICT & Technology Integration',
    category: 'Digital & Resources',
    summary:
      'The school’s vision highlights integrating modern technology into learning. Specific computer lab equipment, student-to-device ratios, and digital learning schedules await official confirmation.',
    observedDetails: [
      'Technology integration stated in official Vision statement',
      'Dedicated ICT lab inventory and photography pending school verification',
    ],
    verificationStatus: 'pending-confirmation',
  },
];

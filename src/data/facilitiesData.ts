import campusPhoto from '../assets/images/beccan_campus_building.jpg';
import { FacilityItem } from '../types/school';

export const campusHeroPhoto = {
  src: campusPhoto,
  alt: 'Beccan School campus in Dodowa showing the two-storey main school building, adjacent classroom block, covered porch, trampoline, and courtyard.',
  caption: 'Beccan School campus and courtyard in Dodowa, Greater Accra Region.',
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
      'Two-storey main school building and adjacent single-storey classroom wing at Beccan School in Dodowa.',
  },
  {
    id: 'courtyard-playground',
    title: 'Courtyard & Outdoor Play Area',
    category: 'Recreation',
    summary:
      'An enclosed central compound supporting supervised physical activity, assemblies, and early-years outdoor play.',
    observedDetails: [
      'Enclosed safety-netted trampoline beside the main porch',
      'Painted courtyard activity border along the play compound',
      'Open compound suited for morning assemblies and supervised recreation',
    ],
  },
  {
    id: 'classrooms',
    title: 'Classrooms & Learning Spaces',
    category: 'Learning Spaces',
    summary:
      'Dedicated classrooms arranged across the main building and single-storey classroom wing to support focused daily teaching and small-group engagement.',
    observedDetails: [
      'Multiple classroom bays across the two-storey building and classroom wing',
      'Guided campus tours available for prospective families to inspect learning spaces in person',
    ],
  },
];

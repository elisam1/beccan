import { AcademicDivision, AcademicPillar } from '../types/school';

export const academicDivisions: AcademicDivision[] = [
  {
    id: 'early-years',
    title: 'Early Years & Kindergarten',
    summary:
      'A nurturing, emotionally supportive entry into school life focused on foundational literacy, early numeracy, social confidence, and curiosity through guided play and structured routines.',
    learningFocus: [
      'Early phonics, spoken English, and listening habits',
      'Foundational number sense and hands-on discovery',
      'Social-emotional readiness and cooperative play',
      'Safe outdoor movement and motor-skill coordination',
    ],
  },
  {
    id: 'primary',
    title: 'Primary School',
    summary:
      'Structured foundational academics designed to build strong reading fluency, mathematical reasoning, scientific inquiry, and disciplined study habits.',
    learningFocus: [
      'Core literacy, composition, and comprehension',
      'Applied mathematics and structured problem solving',
      'Introductory science, arts, and civic awareness',
      'Character education and personal responsibility',
    ],
  },
  {
    id: 'junior-high',
    title: 'Junior High School (JHS)',
    summary:
      'Focused academic preparation bridging basic education with real-world critical thinking, technology readiness, and disciplined personal accountability.',
    learningFocus: [
      'Critical thinking and analytical writing across subjects',
      'Science, technology integration, and practical inquiry',
      'Leadership, ethics, and community responsibility',
      'Structured preparation and academic guidance',
    ],
  },
];

export const academicPillars: AcademicPillar[] = [
  {
    id: 'curriculum',
    number: '01',
    title: 'Curriculum & Standards',
    description:
      'A balanced programme uniting core sciences, arts, modern technology awareness, and character education to build solid academic readiness across basic education.',
  },
  {
    id: 'teaching',
    number: '02',
    title: 'Teaching & Learning Approach',
    description:
      'Classroom instruction blends enduring values—respect, diligence, and discipline—with interactive, inquiry-led practices so every child feels seen, heard, and encouraged to connect learning with real-world application.',
  },
  {
    id: 'assessment',
    number: '03',
    title: 'Assessment & Student Progress',
    description:
      'Continuous classroom observation, regular classwork, and close parent-teacher communication support each learner’s steady academic progress throughout the term.',
  },
  {
    id: 'extracurricular',
    number: '04',
    title: 'Co-Curricular & Whole-Child Growth',
    description:
      'Co-curricular activities and supervised outdoor play complement classroom lessons, supporting learners’ intellectual, social, and physical well-being.',
  },
];

import { AcademicDivision, AcademicPillar } from '../types/school';

export const academicDivisions: AcademicDivision[] = [
  {
    id: 'early-years',
    title: 'Early Years & Kindergarten',
    registryNote: 'Listed under Basic School level in Ministry of Education directory · Exact Crèche/Nursery/KG streams pending confirmation',
    summary:
      'A nurturing, emotionally supportive entry into school life focused on foundational literacy, early numeracy, social confidence, and curiosity through guided play and structured routines.',
    learningFocus: [
      'Early phonics, spoken English, and listening habits',
      'Foundational number sense and hands-on discovery',
      'Social-emotional readiness and cooperative play',
      'Safe outdoor movement and motor-skill coordination',
    ],
    verificationStatus: 'pending-confirmation',
  },
  {
    id: 'primary',
    title: 'Primary School',
    registryNote: 'Listed under Basic School level in Ministry of Education directory · Active grade range (Basic 1–6) pending confirmation',
    summary:
      'Structured foundational academics designed to build strong reading fluency, mathematical reasoning, scientific inquiry, and disciplined study habits.',
    learningFocus: [
      'Core literacy, composition, and comprehension',
      'Applied mathematics and structured problem solving',
      'Introductory science, arts, and civic awareness',
      'Character education and personal responsibility',
    ],
    verificationStatus: 'pending-confirmation',
  },
  {
    id: 'junior-high',
    title: 'Junior High School (JHS)',
    registryNote: 'Included in Ghana Basic School registry classification · Active JHS class status pending management confirmation',
    summary:
      'Focused academic preparation bridging basic education with real-world critical thinking, technology readiness, and disciplined personal accountability.',
    learningFocus: [
      'Critical thinking and analytical writing across subjects',
      'Science, technology integration, and practical inquiry',
      'Leadership, ethics, and community responsibility',
      'Structured academic guidance (specific exam tracks pending confirmation)',
    ],
    verificationStatus: 'pending-confirmation',
  },
];

export const academicPillars: AcademicPillar[] = [
  {
    id: 'curriculum',
    number: '01',
    title: 'Curriculum & Standards',
    description:
      'Beccan School’s official website emphasises a balanced programme uniting science, arts, modern technology integration, and character education. Specific curriculum framework details (such as NaCCA / Ghana Education Service Standards-Based Curriculum subjects and textbooks by class) are awaiting confirmation from the Academic Office.',
    sourceBasis: 'Vision & Mission Statements (beccanschool.site)',
  },
  {
    id: 'teaching',
    number: '02',
    title: 'Teaching & Learning Approach',
    description:
      'Classroom instruction blends enduring Ghanaian values—respect, diligence, and discipline—with interactive, inquiry-led practices so every child feels seen, heard, and encouraged to connect learning with real-world application.',
    sourceBasis: 'Welcome & Mission Statements (beccanschool.site)',
  },
  {
    id: 'assessment',
    number: '03',
    title: 'Assessment & Student Progress',
    description:
      'Continuous classroom observation, regular classwork, and parent-teacher collaboration form the heart of student support. Formal termly examination schedules and grading rubrics will be published upon school confirmation.',
    sourceBasis: 'Mission Statement · Specific term policies pending confirmation',
  },
  {
    id: 'extracurricular',
    number: '04',
    title: 'Co-Curricular & Whole-Child Growth',
    description:
      'The school highlights diverse extracurricular experiences to support intellectual, social, and physical well-being—including supervised outdoor play and co-curricular activities (official club lists and term schedules pending confirmation).',
    sourceBasis: 'Welcome Statement & Verified Campus Observation',
  },
];

import { SchoolProfile } from '../types/school';

export const schoolProfile: SchoolProfile = {
  tenantId: 'beccan-school-dodowa',
  name: 'Beccan School',
  shortName: 'Beccan',
  motto: 'Excellence • Discipline • Success',
  mottoParts: ['Excellence', 'Discipline', 'Success'],
  establishedNote:
    'Founding year and formal historical timeline are pending confirmation from Beccan School management.',
  registryClassification:
    'Private Basic School · Shai-Osudoku District (Dodowa), Greater Accra Region, Ghana',
  welcomeHeadline: 'Building a legacy of excellence in the heart of Dodowa.',
  welcomeParagraphs: [
    'At Beccan School, we believe that education is the foundation of a bright and purposeful future. Our school is more than a place for academic instruction; it is a vibrant learning community where students are encouraged to explore their potential, stretch their capabilities, and cultivate a lifelong love of learning.',
    'We take pride in fostering an environment that is both intellectually stimulating and emotionally supportive, ensuring that every learner feels seen, heard, and inspired. Our educators are committed to blending enduring traditional values with thoughtful modern practices to prepare students for the opportunities and responsibilities of the 21st century.',
    'Through a balanced focus on classroom learning, character formation, and co-curricular growth, we strive to nurture well-rounded young people who are ready to lead and serve. Whether you are a prospective parent, a current learner, or a member of the Dodowa community, we welcome you to the Beccan School family.',
  ],
  vision:
    'To become a leading centre of academic excellence and innovation, nurturing ethical, creative, and globally conscious leaders. We envision a learning environment that integrates modern technology with deep social responsibility—empowering every student to discover their unique strengths, cultivate curiosity and resilience, and thrive in a changing world.',
  mission:
    'To provide a transformative educational experience that equips every student with the knowledge, integrity, and critical thinking skills necessary to excel. We are dedicated to maintaining a safe, inclusive environment where high academic standards meet personal growth, bridging classroom instruction with practical application through strong partnership among educators, parents, and our community.',
  anthem: {
    title: 'The Beccan School Anthem',
    stanza: [
      'Beccan School, our pride and joy,',
      'We stand together strong and true.',
      'With knowledge, strength, and unity,',
      'We rise to make our dreams come true.',
    ],
    sourceNote:
      'Lyrics preserved verbatim from the official school website (beccanschool.site). Any additional verses or audio recordings are pending confirmation from school leadership.',
  },
  coreValues: [
    {
      id: 'excellence',
      title: 'Excellence',
      summary:
        'A commitment to high academic expectations, diligent study habits, and continuous personal improvement across every stage of basic education.',
      sourceBasis: 'School Motto & Mission Statement (beccanschool.site)',
    },
    {
      id: 'discipline',
      title: 'Discipline',
      summary:
        'Cultivating self-respect, responsibility, strong work ethic, and respectful conduct within a safe and orderly school community.',
      sourceBasis: 'School Motto & Mission Statement (beccanschool.site)',
    },
    {
      id: 'integrity',
      title: 'Integrity & Unity',
      summary:
        'Nurturing honest, compassionate citizens who stand together with strength, respect diversity, and contribute positively to society.',
      sourceBasis: 'School Vision, Mission & Anthem (beccanschool.site)',
    },
    {
      id: 'success',
      title: 'Purposeful Success',
      summary:
        'Preparing learners intellectually, socially, and physically to bridge classroom knowledge with real-world readiness.',
      sourceBasis: 'School Motto & Mission Statement (beccanschool.site)',
    },
  ],
  leadership: [
    {
      role: 'Proprietor / School Management',
      occupantStatus: 'Name & biography pending official confirmation from school administration',
      messageTitle: 'Leadership Profile Awaiting Confirmation',
      messageBody:
        'Official names, photographs, and biographical profiles of Beccan School’s Proprietor and senior leadership team will be published here once formally verified and approved by school management.',
      verificationStatus: 'pending-confirmation',
    },
    {
      role: 'Headteacher',
      occupantStatus: 'Name & official welcome letter pending confirmation from school administration',
      messageTitle: "Headteacher's Welcome Message",
      messageBody:
        'A dedicated welcome address from the Headteacher—detailing term priorities, pastoral care, and academic expectations for Dodowa families—is scheduled for publication upon management verification.',
      verificationStatus: 'pending-confirmation',
    },
  ],
  historyNote:
    'Beccan School serves families in Dodowa within the Shai-Osudoku District of the Greater Accra Region and is listed in Ghana’s Ministry of Education basic school register. To uphold strict factual accuracy, our founding date, milestone timeline, and enrolment figures are withheld pending direct verification from school management.',
  contact: {
    campusLabel: 'Beccan School Campus, Dodowa',
    town: 'Dodowa',
    district: 'Shai-Osudoku District',
    region: 'Greater Accra Region',
    country: 'Ghana',
    streetAddressNote:
      'Exact street address, GhanaPost GPS digital address, and verified map coordinates are pending confirmation from school management.',
    telephoneDisplay: '024-740-1641',
    telephoneHref: 'tel:+233247401641',
    email: 'info@beccanschool.com',
    officeHoursNote:
      'Please call or email ahead to confirm school office visiting hours and campus tour availability.',
    mapVerificationNote:
      'Interactive street-level pin is withheld until Beccan School provides its verified GhanaPost GPS code or exact campus coordinates.',
  },
};

import type { Amenity, Category, PropertyType, RoomOccupancy, GenderPreference, FurnishingStatus } from '../types';

export const JABALPUR_CENTER: { lat: number; lng: number } = {
  lat: 23.1686,
  lng: 79.9339,
};

export const SUPPORTED_CITIES = ['Jabalpur'];

export const BUDGET_OPTIONS: Array<{ value: string; label: string }> = [
  { value: '2000', label: 'Up to ₹2,000' },
  { value: '3000', label: 'Up to ₹3,000' },
  { value: '4000', label: 'Up to ₹4,000' },
  { value: '5000', label: 'Up to ₹5,000' },
  { value: '6000', label: 'Up to ₹6,000' },
  { value: '8000', label: 'Up to ₹8,000' },
  { value: '10000', label: 'Up to ₹10,000' },
  { value: '15000', label: 'Up to ₹15,000' },
];

export interface JabalpurLocality {
  name: string;
  summary: string;
  nearbyHubs: string;
  sampleRange: string;
  searchQuery: string;
}

export const JABALPUR_LOCALITIES: JabalpurLocality[] = [
  {
    name: 'Vijay Nagar',
    summary: 'Planned residential blocks with broad roads, cafes, and coaching centres.',
    nearbyHubs: 'MR-4 Road, Deendayal Chowk',
    sampleRange: 'Quiet student study zone',
    searchQuery: 'Vijay Nagar, Jabalpur, Madhya Pradesh, India',
  },
  {
    name: 'Wright Town',
    summary: 'Central coaching and college corridor with easy auto & bus connectivity.',
    nearbyHubs: 'Stadium Road, Teen Patti, Gol Bazar',
    sampleRange: 'High PG & hostel density',
    searchQuery: 'Wright Town, Jabalpur, Madhya Pradesh, India',
  },
  {
    name: 'Gol Bazar',
    summary: 'Busy central student & library hub right beside D.N. Jain College.',
    nearbyHubs: 'D.N. Jain College, Shaheed Smarak',
    sampleRange: 'Coaching & PG zone',
    searchQuery: 'Gol Bazar, Jabalpur, Madhya Pradesh, India',
  },
  {
    name: 'Civil Lines',
    summary: 'Green, well-connected neighbourhood close to university departments.',
    nearbyHubs: 'RDVV Campus, Govt. Science & Mahakoshal College',
    sampleRange: 'University & library access',
    searchQuery: 'Civil Lines, Jabalpur, Madhya Pradesh, India',
  },
  {
    name: 'Pachpedi',
    summary: 'Academic pocket directly beside RDVV campus gates and South Civil Lines.',
    nearbyHubs: 'RDVV Gate, South Civil Lines',
    sampleRange: 'RDVV student stays',
    searchQuery: 'Pachpedi, Civil Lines, Jabalpur, Madhya Pradesh, India',
  },
  {
    name: 'South Civil Lines',
    summary: 'Calm university neighbourhood adjacent to veterinary and polytechnic campuses.',
    nearbyHubs: 'NDVSU Veterinary Univ., Kalaniketan Polytechnic',
    sampleRange: 'Quiet university rooms',
    searchQuery: 'South Civil Lines, Jabalpur, Madhya Pradesh, India',
  },
  {
    name: 'Napier Town',
    summary: 'Accessible central locality near markets, banks, and transit routes.',
    nearbyHubs: 'M.H. Home Science College, Russell Chowk',
    sampleRange: 'Flats & private rooms',
    searchQuery: 'Napier Town, Jabalpur, Madhya Pradesh, India',
  },
  {
    name: 'Marhatal',
    summary: 'Central city pocket steps away from Mata Gujri & Civic Centre.',
    nearbyHubs: 'Mata Gujri College, Civic Centre',
    sampleRange: 'Girls PGs & student rooms',
    searchQuery: 'Marhatal, Jabalpur, Madhya Pradesh, India',
  },
  {
    name: 'Madan Mahal',
    summary: 'Key transit hub beside Madan Mahal railway station and coaching lanes.',
    nearbyHubs: 'Madan Mahal Station, Rani Durgavati Chowk',
    sampleRange: 'Budget rooms & shared stays',
    searchQuery: 'Madan Mahal, Jabalpur, Madhya Pradesh, India',
  },
  {
    name: 'Gupteshwar',
    summary: 'Student neighbourhood along Sharda Mandir Road near Takshshila Institute.',
    nearbyHubs: 'Takshshila Institute, Sharda Mandir Road',
    sampleRange: 'Engineering & shared rooms',
    searchQuery: 'Gupteshwar, Jabalpur, Madhya Pradesh, India',
  },
  {
    name: 'Gorakhpur',
    summary: 'Popular residential & market belt serving Hawabagh College and Narmada Road.',
    nearbyHubs: 'Hawabagh College, Narmada Road',
    sampleRange: 'Hostels & family-run PGs',
    searchQuery: 'Gorakhpur, Jabalpur, Madhya Pradesh, India',
  },
  {
    name: 'Rampur',
    summary: 'Well-connected southern stretch linking Gwarighat Road, Hawabagh & Tilwara.',
    nearbyHubs: 'Gwarighat Road, Rampur Chowk',
    sampleRange: 'Independent rooms & flats',
    searchQuery: 'Rampur, Gwarighat Road, Jabalpur, Madhya Pradesh, India',
  },
  {
    name: 'Shakti Nagar',
    summary: 'Quiet student residential pocket between Madan Mahal, Gupteshwar & Garha.',
    nearbyHubs: 'Yadav Colony, Garha Road',
    sampleRange: 'Affordable single rooms',
    searchQuery: 'Shakti Nagar, Jabalpur, Madhya Pradesh, India',
  },
  {
    name: 'Garha',
    summary: 'Popular among medical and health-sciences students near NSCB Medical College.',
    nearbyHubs: 'NSCB Medical College, Tripuri Chowk',
    sampleRange: 'Medical student corridor',
    searchQuery: 'Garha, Jabalpur, Madhya Pradesh, India',
  },
  {
    name: 'Medical College Road',
    summary: 'Immediate walking-distance belt serving NSCB Medical College & MPMSU.',
    nearbyHubs: 'NSCB Medical College, MPMSU',
    sampleRange: 'Medical hostels & PGs',
    searchQuery: 'Medical College Road, Garha, Jabalpur, Madhya Pradesh, India',
  },
  {
    name: 'Dhanwantari Nagar',
    summary: 'High-demand student PG & flat colony right next to Medical Bypass.',
    nearbyHubs: 'MPMSU, Medical Bypass, Bhedaghat Link',
    sampleRange: 'Medical & engineering stays',
    searchQuery: 'Dhanwantari Nagar, Jabalpur, Madhya Pradesh, India',
  },
  {
    name: 'Bhedaghat Road',
    summary: 'Western college belt home to LNCT Jabalpur and Oriental Institute.',
    nearbyHubs: 'LNCT Jabalpur, Oriental Institute (OIST)',
    sampleRange: 'College hostels & rooms',
    searchQuery: 'Bhedaghat Road, Jabalpur, Madhya Pradesh, India',
  },
  {
    name: 'Tilwara',
    summary: 'Scenic southern academic corridor serving Gyan Ganga and Bargi Hills colleges.',
    nearbyHubs: 'GGITS, GGCT, Tilwara Ghat',
    sampleRange: 'Engineering student stays',
    searchQuery: 'Tilwara, Jabalpur, Madhya Pradesh, India',
  },
  {
    name: 'Bargi Hills',
    summary: 'Hillside campus belt right outside GGITS, GGCT & DNLU transit route.',
    nearbyHubs: 'Gyan Ganga Colleges, Bargi Hills',
    sampleRange: 'Hostels & shared flats',
    searchQuery: 'Bargi Hills, Tilwara, Jabalpur, Madhya Pradesh, India',
  },
  {
    name: 'Ranjhi',
    summary: 'Student-friendly corridor connecting toward Jabalpur Engineering College.',
    nearbyHubs: 'JEC Campus, Ranjhi Bazar',
    sampleRange: 'Engineering student belt',
    searchQuery: 'Ranjhi, Jabalpur, Madhya Pradesh, India',
  },
  {
    name: 'Gokalpur',
    summary: 'Immediate neighbourhood outside Jabalpur Engineering College (JEC) gate.',
    nearbyHubs: 'JEC Main Gate, Gokalpur Pond',
    sampleRange: 'Budget JEC student rooms',
    searchQuery: 'Gokalpur, Ranjhi, Jabalpur, Madhya Pradesh, India',
  },
  {
    name: 'Khamaria',
    summary: 'Green eastern residential area linking JEC (Ranjhi) and IIITDM (Dumna Road).',
    nearbyHubs: 'Westland Khamaria, Dumna Link',
    sampleRange: 'Quiet rooms & shared stays',
    searchQuery: 'Khamaria, Jabalpur, Madhya Pradesh, India',
  },
  {
    name: 'Barela',
    summary: 'Eastern Mandla Road town pocket serving Guru Ramdas Khalsa Institute.',
    nearbyHubs: 'GRKIST Campus, Mandla Road',
    sampleRange: 'Affordable college stays',
    searchQuery: 'Barela, Jabalpur, Madhya Pradesh, India',
  },
  {
    name: 'Adhartal',
    summary: 'Affordable northern belt near agricultural and engineering institutions.',
    nearbyHubs: 'JNKVV Campus, Adhartal Square',
    sampleRange: 'Affordable hostels & rooms',
    searchQuery: 'Adhartal, Jabalpur, Madhya Pradesh, India',
  },
  {
    name: 'Suhagi',
    summary: 'Northern student pocket adjacent to JNKVV Agricultural University & Maharajpur.',
    nearbyHubs: 'JNKVV Krishi Nagar, Suhagi Chowk',
    sampleRange: 'Budget PGs & rooms',
    searchQuery: 'Suhagi, Adhartal, Jabalpur, Madhya Pradesh, India',
  },
  {
    name: 'Madhotal',
    summary: 'Growing northern student pocket near ITI, Damoh Naka, and Patan Bypass.',
    nearbyHubs: 'SRIT, Global Engineering, ITI Crossing',
    sampleRange: 'Budget rooms & hostels',
    searchQuery: 'Madhotal, Jabalpur, Madhya Pradesh, India',
  },
  {
    name: 'Karmeta',
    summary: 'Rapidly growing Patan Bypass locality serving Global Engineering, SRIT & Vijay Nagar.',
    nearbyHubs: 'Baderia Global Institute, Patan Bypass',
    sampleRange: 'Modern flats & student rooms',
    searchQuery: 'Karmeta, Jabalpur, Madhya Pradesh, India',
  },
  {
    name: 'Damoh Naka',
    summary: 'Major city junction connecting Wright Town, Vijay Nagar, Madhotal & Adhartal.',
    nearbyHubs: 'Damoh Naka Crossing, Cherital',
    sampleRange: 'Well-connected hostels & rooms',
    searchQuery: 'Damoh Naka, Jabalpur, Madhya Pradesh, India',
  },
  {
    name: 'Dumna Road',
    summary: 'Peaceful academic stretch leading toward IIITDM Jabalpur and Hitkarini campuses.',
    nearbyHubs: 'IIITDM Jabalpur, Hitkarini (HCET & Dental)',
    sampleRange: 'Quiet independent flats',
    searchQuery: 'Dumna Road, Jabalpur, Madhya Pradesh, India',
  },
  {
    name: 'Bilhari',
    summary: 'Peaceful residential corridor connecting Dumna Road, IIITDM & Sadar.',
    nearbyHubs: 'Bilhari Square, Mandla Road Link',
    sampleRange: 'Student flats & single rooms',
    searchQuery: 'Bilhari, Jabalpur, Madhya Pradesh, India',
  },
  {
    name: 'Sadar',
    summary: 'Clean, organized cantonment area with grocery stores and transit links.',
    nearbyHubs: 'St. Aloysius College, Sadar Bazar',
    sampleRange: 'Well-kept rooms & PGs',
    searchQuery: 'Sadar Bazar, Jabalpur, Madhya Pradesh, India',
  },
  {
    name: 'Katanga',
    summary: 'Leafy cantonment neighbourhood right beside St. Aloysius College and South Civil Lines.',
    nearbyHubs: 'St. Aloysius Campus, Katanga Crossing',
    sampleRange: 'Quiet PGs & student rooms',
    searchQuery: 'Katanga, Jabalpur, Madhya Pradesh, India',
  },
];

export interface JabalpurCollege {
  name: string;
  shortName: string;
  locality: string;
  nearbyLocalities: string[];
  category: 'Engineering & Tech' | 'Medical & Health' | 'University & Degree' | 'Law & Management';
  searchQuery: string;
}

export const JABALPUR_COLLEGES_LIST: JabalpurCollege[] = [
  {
    name: 'Jabalpur Engineering College (JEC)',
    shortName: 'JEC Jabalpur',
    locality: 'Gokalpur',
    nearbyLocalities: ['Gokalpur', 'Ranjhi', 'Khamaria', 'Civil Lines'],
    category: 'Engineering & Tech',
    searchQuery: 'Jabalpur Engineering College, Gokalpur, Jabalpur, Madhya Pradesh',
  },
  {
    name: 'PDPM IIITDM Jabalpur',
    shortName: 'IIITDM Jabalpur',
    locality: 'Dumna Road',
    nearbyLocalities: ['Dumna Road', 'Khamaria', 'Bilhari', 'Ranjhi'],
    category: 'Engineering & Tech',
    searchQuery: 'PDPM Indian Institute of Information Technology Design and Manufacturing Jabalpur',
  },
  {
    name: 'Rani Durgavati Vishwavidyalaya (RDVV)',
    shortName: 'RDVV University',
    locality: 'Pachpedi',
    nearbyLocalities: ['Pachpedi', 'Civil Lines', 'South Civil Lines', 'Katanga'],
    category: 'University & Degree',
    searchQuery: 'Rani Durgavati Vishwavidyalaya, Pachpedi, Jabalpur, Madhya Pradesh',
  },
  {
    name: 'NSCB Medical College, Jabalpur',
    shortName: 'NSCB Medical College',
    locality: 'Medical College Road',
    nearbyLocalities: ['Medical College Road', 'Garha', 'Dhanwantari Nagar', 'Shakti Nagar'],
    category: 'Medical & Health',
    searchQuery: 'Netaji Subhash Chandra Bose Medical College, Garha, Jabalpur, Madhya Pradesh',
  },
  {
    name: 'MP Medical Science University (MPMSU)',
    shortName: 'MPMSU',
    locality: 'Medical College Road',
    nearbyLocalities: ['Medical College Road', 'Garha', 'Dhanwantari Nagar', 'Tilwara'],
    category: 'Medical & Health',
    searchQuery: 'Madhya Pradesh Medical Science University, Jabalpur, Madhya Pradesh',
  },
  {
    name: 'Jawaharlal Nehru Krishi Vishwa Vidyalaya (JNKVV)',
    shortName: 'JNKVV Agricultural Univ.',
    locality: 'Adhartal',
    nearbyLocalities: ['Adhartal', 'Suhagi', 'Damoh Naka', 'Madhotal'],
    category: 'University & Degree',
    searchQuery: 'Jawaharlal Nehru Krishi Vishwa Vidyalaya, Adhartal, Jabalpur, Madhya Pradesh',
  },
  {
    name: 'Nanaji Deshmukh Veterinary Science University (NDVSU)',
    shortName: 'NDVSU Veterinary Univ.',
    locality: 'South Civil Lines',
    nearbyLocalities: ['South Civil Lines', 'Civil Lines', 'Pachpedi', 'Katanga'],
    category: 'Medical & Health',
    searchQuery: 'Nanaji Deshmukh Veterinary Science University, South Civil Lines, Jabalpur',
  },
  {
    name: 'Dharmashastra National Law University (DNLU)',
    shortName: 'DNLU Jabalpur',
    locality: 'Civil Lines',
    nearbyLocalities: ['Civil Lines', 'South Civil Lines', 'Bargi Hills', 'Tilwara'],
    category: 'Law & Management',
    searchQuery: 'Dharmashastra National Law University, Jabalpur, Madhya Pradesh',
  },
  {
    name: 'St. Aloysius College (Autonomous)',
    shortName: 'St. Aloysius College',
    locality: 'Sadar',
    nearbyLocalities: ['Sadar', 'Katanga', 'Bilhari', 'South Civil Lines'],
    category: 'University & Degree',
    searchQuery: "St. Aloysius' College, Sadar, Jabalpur, Madhya Pradesh",
  },
  {
    name: 'Government Science College, Jabalpur',
    shortName: 'Govt. Science College',
    locality: 'Civil Lines',
    nearbyLocalities: ['Civil Lines', 'South Civil Lines', 'Pachpedi', 'Napier Town'],
    category: 'University & Degree',
    searchQuery: 'Government Science College, Civil Lines, Jabalpur, Madhya Pradesh',
  },
  {
    name: 'Govt. Mahakoshal Arts & Commerce College',
    shortName: 'Mahakoshal College',
    locality: 'Civil Lines',
    nearbyLocalities: ['Civil Lines', 'South Civil Lines', 'Napier Town', 'Pachpedi'],
    category: 'University & Degree',
    searchQuery: 'Government Mahakoshal Arts and Commerce College, Civil Lines, Jabalpur',
  },
  {
    name: 'Govt. M.H. College of Home Science & Science for Women',
    shortName: 'M.H. Home Science College',
    locality: 'Napier Town',
    nearbyLocalities: ['Napier Town', 'Marhatal', 'Wright Town', 'Gol Bazar'],
    category: 'University & Degree',
    searchQuery: 'Govt. M.H. College of Home Science and Science for Women, Napier Town, Jabalpur',
  },
  {
    name: 'Hitkarini College of Engineering & Technology (HCET)',
    shortName: 'Hitkarini Engineering',
    locality: 'Dumna Road',
    nearbyLocalities: ['Dumna Road', 'Bilhari', 'Khamaria', 'Sadar'],
    category: 'Engineering & Tech',
    searchQuery: 'Hitkarini College of Engineering and Technology, Dumna Road, Jabalpur',
  },
  {
    name: 'Hitkarini Dental College & Hospital',
    shortName: 'Hitkarini Dental',
    locality: 'Dumna Road',
    nearbyLocalities: ['Dumna Road', 'Bilhari', 'Khamaria', 'Sadar'],
    category: 'Medical & Health',
    searchQuery: 'Hitkarini Dental College and Hospital, Dumna Road, Jabalpur',
  },
  {
    name: 'Gyan Ganga Institute of Technology & Sciences (GGITS)',
    shortName: 'GGITS Tilwara',
    locality: 'Bargi Hills',
    nearbyLocalities: ['Bargi Hills', 'Tilwara', 'Dhanwantari Nagar', 'Rampur'],
    category: 'Engineering & Tech',
    searchQuery: 'Gyan Ganga Institute of Technology and Sciences, Tilwara, Jabalpur',
  },
  {
    name: 'Gyan Ganga College of Technology (GGCT)',
    shortName: 'GGCT Tilwara',
    locality: 'Bargi Hills',
    nearbyLocalities: ['Bargi Hills', 'Tilwara', 'Dhanwantari Nagar', 'Rampur'],
    category: 'Engineering & Tech',
    searchQuery: 'Gyan Ganga College of Technology, Bargi Hills, Tilwara, Jabalpur',
  },
  {
    name: 'Baderia Global Institute of Engineering & Management',
    shortName: 'Global Engineering',
    locality: 'Karmeta',
    nearbyLocalities: ['Karmeta', 'Madhotal', 'Vijay Nagar', 'Damoh Naka'],
    category: 'Engineering & Tech',
    searchQuery: 'Baderia Global Institute of Engineering and Management, Patan Bypass, Jabalpur',
  },
  {
    name: 'Shri Ram Institute of Technology (SRIT)',
    shortName: 'SRIT Jabalpur',
    locality: 'Madhotal',
    nearbyLocalities: ['Madhotal', 'Karmeta', 'Vijay Nagar', 'Damoh Naka'],
    category: 'Engineering & Tech',
    searchQuery: 'Shri Ram Institute of Technology, Madhotal, Jabalpur, Madhya Pradesh',
  },
  {
    name: 'Takshshila Institute of Engineering & Technology',
    shortName: 'Takshshila Institute',
    locality: 'Gupteshwar',
    nearbyLocalities: ['Gupteshwar', 'Madan Mahal', 'Shakti Nagar', 'Gorakhpur'],
    category: 'Engineering & Tech',
    searchQuery: 'Takshshila Institute of Engineering and Technology, Sharda Mandir Road, Jabalpur',
  },
  {
    name: 'Lakshmi Narain College of Technology (LNCT Jabalpur)',
    shortName: 'LNCT Jabalpur',
    locality: 'Bhedaghat Road',
    nearbyLocalities: ['Bhedaghat Road', 'Dhanwantari Nagar', 'Garha', 'Tilwara'],
    category: 'Engineering & Tech',
    searchQuery: 'Lakshmi Narain College of Technology, Bhedaghat Road, Jabalpur',
  },
  {
    name: 'Oriental Institute of Science & Technology (OIST)',
    shortName: 'Oriental Institute',
    locality: 'Bhedaghat Road',
    nearbyLocalities: ['Bhedaghat Road', 'Dhanwantari Nagar', 'Garha', 'Tilwara'],
    category: 'Engineering & Tech',
    searchQuery: 'Oriental Institute of Science and Technology, Jabalpur, Madhya Pradesh',
  },
  {
    name: 'Mata Gujri Mahila Mahavidyalaya',
    shortName: 'Mata Gujri College',
    locality: 'Marhatal',
    nearbyLocalities: ['Marhatal', 'Napier Town', 'Wright Town', 'Gol Bazar'],
    category: 'University & Degree',
    searchQuery: 'Mata Gujri Mahila Mahavidyalaya, Marhatal, Jabalpur, Madhya Pradesh',
  },
  {
    name: 'D.N. Jain College',
    shortName: 'D.N. Jain College',
    locality: 'Gol Bazar',
    nearbyLocalities: ['Gol Bazar', 'Wright Town', 'Napier Town', 'Madan Mahal'],
    category: 'University & Degree',
    searchQuery: 'D.N. Jain College, Gol Bazar, Wright Town, Jabalpur',
  },
  {
    name: "Hawabagh Women's College",
    shortName: 'Hawabagh College',
    locality: 'Gorakhpur',
    nearbyLocalities: ['Gorakhpur', 'Rampur', 'Madan Mahal', 'Katanga'],
    category: 'University & Degree',
    searchQuery: "Hawabagh Women's College, Narmada Road, Jabalpur, Madhya Pradesh",
  },
  {
    name: 'Kalaniketan Polytechnic College',
    shortName: 'Kalaniketan Polytechnic',
    locality: 'South Civil Lines',
    nearbyLocalities: ['South Civil Lines', 'Civil Lines', 'Katanga', 'Pachpedi'],
    category: 'Engineering & Tech',
    searchQuery: 'Kalaniketan Polytechnic College, South Civil Lines, Jabalpur',
  },
  {
    name: 'Guru Ramdas Khalsa Institute (GRKIST)',
    shortName: 'GRKIST Jabalpur',
    locality: 'Barela',
    nearbyLocalities: ['Barela', 'Bilhari', 'Ranjhi', 'Sadar'],
    category: 'Engineering & Tech',
    searchQuery: 'Guru Ramdas Khalsa Institute of Science and Technology, Barela, Jabalpur',
  },
];

export const JABALPUR_COLLEGES = JABALPUR_COLLEGES_LIST.map((c) => c.name);

export const PROPERTY_TYPES: PropertyType[] = ['Room', 'PG', 'Hostel', 'Flat', 'Shared'];

export const ROOM_OCCUPANCIES: RoomOccupancy[] = [
  'Single',
  'Double Sharing',
  'Triple Sharing',
  'Dormitory',
  'Full Flat',
];

export const GENDER_PREFERENCES: GenderPreference[] = ['Boys', 'Girls', 'Co-ed', 'Any'];

export const FURNISHING_STATUSES: FurnishingStatus[] = [
  'Furnished',
  'Semi-Furnished',
  'Unfurnished',
];

export const DEFAULT_CATEGORIES: Category[] = [
  {
    id: 1,
    slug: 'rooms',
    name: 'Rooms',
    description: 'Private single or shared rooms near colleges and coaching hubs',
    is_active: true,
    sort_order: 1,
  },
  {
    id: 2,
    slug: 'pg',
    name: 'PG',
    description: 'Paying Guest stays with home-style meals and utilities included',
    is_active: true,
    sort_order: 2,
  },
  {
    id: 3,
    slug: 'hostels',
    name: 'Hostels',
    description: 'Structured student hostels with study lounges and security',
    is_active: true,
    sort_order: 3,
  },
  {
    id: 4,
    slug: 'flats',
    name: 'Flats',
    description: 'Independent 1BHK and 2BHK student flats for small groups',
    is_active: true,
    sort_order: 4,
  },
  {
    id: 5,
    slug: 'shared',
    name: 'Shared Accommodation',
    description: 'Budget-friendly shared beds and flatmate options',
    is_active: true,
    sort_order: 5,
  },
];

export const DEFAULT_AMENITIES: Amenity[] = [
  { id: 1, slug: 'wifi', name: 'Wi-Fi', icon_name: 'Wifi' },
  { id: 2, slug: 'electricity', name: 'Electricity', icon_name: 'Zap' },
  { id: 3, slug: 'water', name: 'Water', icon_name: 'Droplets' },
  { id: 4, slug: 'food', name: 'Food', icon_name: 'Utensils' },
  { id: 5, slug: 'ac', name: 'AC', icon_name: 'Wind' },
  { id: 6, slug: 'washing-machine', name: 'Washing machine', icon_name: 'WashingMachine' },
  { id: 7, slug: 'parking', name: 'Parking', icon_name: 'Bike' },
  { id: 8, slug: 'attached-bathroom', name: 'Attached bathroom', icon_name: 'Bath' },
  { id: 9, slug: 'study-table', name: 'Study table', icon_name: 'BookOpen' },
  { id: 10, slug: 'cctv', name: 'CCTV', icon_name: 'Cctv' },
  { id: 11, slug: 'security', name: 'Security', icon_name: 'ShieldCheck' },
];

export interface RoomAvailabilityInfo {
  isAvailable: boolean;
  availableRooms: number;
  statusLabel: string;
  badgeText: string;
  shortBadgeText: string;
  moveInNote: string;
  updatedLabel: string | null;
}

export function getRoomAvailabilityInfo(
  availableRooms: number,
  availableFrom?: string | null,
  updatedAt?: string | null
): RoomAvailabilityInfo {
  const count = Math.max(0, Math.floor(Number(availableRooms) || 0));
  const isAvailable = count > 0;
  const today = new Date().toISOString().slice(0, 10);

  let moveInNote = 'All rooms currently occupied';
  if (isAvailable) {
    if (!availableFrom || availableFrom <= today) {
      moveInNote = 'Ready to move in now';
    } else {
      const parsed = new Date(availableFrom);
      const formatted = Number.isNaN(parsed.getTime())
        ? availableFrom
        : parsed.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
      moveInNote = `Available from ${formatted}`;
    }
  }

  let updatedLabel: string | null = null;
  if (updatedAt) {
    const parsedUpdated = new Date(updatedAt);
    if (!Number.isNaN(parsedUpdated.getTime())) {
      updatedLabel = parsedUpdated.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    }
  }

  return {
    isAvailable,
    availableRooms: count,
    statusLabel: isAvailable ? 'Room Available' : 'Not Available',
    badgeText: isAvailable
      ? count === 1
        ? '1 Room Available'
        : `${count} Rooms Available`
      : 'Not Available',
    shortBadgeText: isAvailable ? `${count} Open` : 'Full',
    moveInNote,
    updatedLabel,
  };
}

export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function buildDirectionsUrl(lat: number, lng: number, _label?: string): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}

export function buildGoogleDirectionsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}

export function buildWhatsAppUrl(phone: string, propertyTitle: string): string {
  const cleanDigits = phone.replace(/\D/g, '');
  const withCountry = cleanDigits.length === 10 ? `91${cleanDigits}` : cleanDigits;
  const text = encodeURIComponent(
    `Namaste! I found your listing "${propertyTitle}" on THIKANO and would like to know about current room availability.`
  );
  return `https://wa.me/${withCountry}?text=${text}`;
}

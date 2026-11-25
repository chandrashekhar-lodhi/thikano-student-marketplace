import 'dotenv/config';
import express, { type Request, type Response, type NextFunction } from 'express';
import { createServer as createHttpServer } from 'node:http';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';

// Types kept self-contained in server.ts so Node/tsx never imports client asset modules
type UserRole = 'student' | 'owner' | 'admin';

interface PreviewUser {
  id: string;
  full_name: string;
  email: string;
  password_hash: string;
  phone: string | null;
  whatsapp_number: string | null;
  role: UserRole;
  college: string | null;
  preferred_location: string | null;
  budget_preference: number | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

interface PreviewProperty {
  id: string;
  owner_id: string | null;
  owner_name: string | null;
  title: string;
  property_type: 'Room' | 'PG' | 'Hostel' | 'Flat' | 'Shared';
  description: string;
  monthly_rent: number;
  security_deposit: number;
  available_rooms: number;
  room_occupancy: 'Single' | 'Double Sharing' | 'Triple Sharing' | 'Dormitory' | 'Full Flat';
  gender_preference: 'Boys' | 'Girls' | 'Co-ed' | 'Any';
  furnishing_status: 'Furnished' | 'Semi-Furnished' | 'Unfurnished';
  available_from: string;
  rules_restrictions: string | null;
  nearby_landmark: string | null;
  city: string;
  locality: string;
  full_address: string;
  latitude: number | null;
  longitude: number | null;
  has_verified_coordinates: boolean;
  contact_phone: string | null;
  whatsapp_number: string | null;
  share_phone: boolean;
  share_whatsapp: boolean;
  is_published: boolean;
  moderation_status: 'pending' | 'approved' | 'rejected';
  rejection_reason: string | null;
  is_demo: boolean;
  created_at: string;
  updated_at: string;
  images: Array<{
    id: string;
    property_id: string;
    image_url: string;
    is_cover: boolean;
    sort_order: number;
  }>;
  amenities: Array<{
    id: number;
    slug: string;
    name: string;
    icon_name: string;
  }>;
}

interface PreviewEnquiry {
  id: string;
  property_id: string;
  student_id: string;
  owner_id: string | null;
  student_name: string;
  student_phone: string;
  message: string;
  preferred_move_in: string | null;
  status: 'pending' | 'contacted' | 'resolved' | 'archived';
  created_at: string;
  updated_at: string;
}

interface PreviewSaved {
  id: string;
  student_id: string;
  property_id: string;
  created_at: string;
}

interface PreviewReport {
  id: string;
  property_id: string;
  reporter_id: string | null;
  reason: string;
  details: string | null;
  status: 'open' | 'reviewed' | 'resolved' | 'dismissed';
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

interface PreviewCategory {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  is_active: boolean;
  sort_order: number;
}

interface PreviewDatabase {
  users: PreviewUser[];
  sessions: Record<string, string>; // token -> userId
  properties: PreviewProperty[];
  enquiries: PreviewEnquiry[];
  saved: PreviewSaved[];
  reports: PreviewReport[];
  categories: PreviewCategory[];
}

const DEFAULT_AMENITIES = [
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

function pickAmenities(slugs: string[]) {
  return DEFAULT_AMENITIES.filter((a) => slugs.includes(a.slug));
}

function hashPassword(pw: string): string {
  return crypto.createHash('sha256').update(`thikano_preview_${pw}`).digest('hex');
}

function createInitialPreviewDb(): PreviewDatabase {
  const now = new Date().toISOString();
  return {
    users: [
      {
        id: 'preview-student-1',
        full_name: 'Demo Student (Jabalpur)',
        email: 'student@thikano.demo',
        password_hash: hashPassword('student123'),
        phone: null,
        whatsapp_number: null,
        role: 'student',
        college: 'Jabalpur Engineering College (JEC)',
        preferred_location: 'Vijay Nagar',
        budget_preference: 6500,
        avatar_url: null,
        created_at: now,
        updated_at: now,
      },
      {
        id: 'preview-owner-1',
        full_name: 'Demo Property Owner',
        email: 'owner@thikano.demo',
        password_hash: hashPassword('owner123'),
        phone: null,
        whatsapp_number: null,
        role: 'owner',
        college: null,
        preferred_location: 'Civil Lines',
        budget_preference: null,
        avatar_url: null,
        created_at: now,
        updated_at: now,
      },
      {
        id: 'preview-admin-1',
        full_name: 'THIKANO Moderator (Preview)',
        email: 'admin@thikano.demo',
        password_hash: hashPassword('admin123'),
        phone: null,
        whatsapp_number: null,
        role: 'admin',
        college: null,
        preferred_location: null,
        budget_preference: null,
        avatar_url: null,
        created_at: now,
        updated_at: now,
      },
    ],
    sessions: {},
    categories: [
      { id: 1, slug: 'rooms', name: 'Rooms', description: 'Private single or shared rooms near colleges and coaching hubs', is_active: true, sort_order: 1 },
      { id: 2, slug: 'pg', name: 'PG', description: 'Paying Guest stays with home-style meals and utilities included', is_active: true, sort_order: 2 },
      { id: 3, slug: 'hostels', name: 'Hostels', description: 'Structured student hostels with study lounges and security', is_active: true, sort_order: 3 },
      { id: 4, slug: 'flats', name: 'Flats', description: 'Independent 1BHK and 2BHK student flats for small groups', is_active: true, sort_order: 4 },
      { id: 5, slug: 'shared', name: 'Shared Accommodation', description: 'Budget-friendly shared beds and flatmate options', is_active: true, sort_order: 5 },
    ],
    properties: [
      {
        id: 'demo-prop-01',
        owner_id: 'preview-owner-1',
        owner_name: 'Demo Property Owner',
        title: 'DEMO: Sunlit Single Study Room — Vijay Nagar',
        property_type: 'Room',
        description:
          'Sample demonstration listing showing how a furnished single student room appears on THIKANO. Includes dedicated study desk, natural cross-ventilation, and transparent electricity billing. Marked as DEMO until real owners publish verified listings.',
        monthly_rent: 5500,
        security_deposit: 5500,
        available_rooms: 2,
        room_occupancy: 'Single',
        gender_preference: 'Boys',
        furnishing_status: 'Furnished',
        available_from: '2026-12-01',
        rules_restrictions: 'Demo placeholder: Quiet study hours after 10:30 PM. Visitors allowed in ground lobby.',
        nearby_landmark: 'Near MR-4 Road, Vijay Nagar',
        city: 'Jabalpur',
        locality: 'Vijay Nagar',
        full_address: 'Sample Block A, Vijay Nagar, Jabalpur, MP (DEMO)',
        latitude: null,
        longitude: null,
        has_verified_coordinates: false,
        contact_phone: null,
        whatsapp_number: null,
        share_phone: false,
        share_whatsapp: false,
        is_published: true,
        moderation_status: 'approved',
        rejection_reason: null,
        is_demo: true,
        created_at: '2026-11-10T10:00:00.000Z',
        updated_at: '2026-11-10T10:00:00.000Z',
        images: [
          {
            id: 'demo-img-01',
            property_id: 'demo-prop-01',
            image_url: '/src/assets/images/property_private_room_1795064714785.jpg',
            is_cover: true,
            sort_order: 0,
          },
          {
            id: 'demo-img-01b',
            property_id: 'demo-prop-01',
            image_url: '/src/assets/images/hero_jabalpur_student_room_1795064714452.jpg',
            is_cover: false,
            sort_order: 1,
          },
        ],
        amenities: pickAmenities(['wifi', 'electricity', 'water', 'study-table', 'attached-bathroom', 'parking']),
      },
      {
        id: 'demo-prop-02',
        owner_id: 'preview-owner-1',
        owner_name: 'Demo Property Owner',
        title: 'DEMO: Girls Twin-Sharing PG — Wright Town',
        property_type: 'PG',
        description:
          'Sample demonstration PG listing illustrating meal-included student accommodation in Wright Town. Built for students attending nearby coaching hubs and colleges. Clearly marked as DEMO test data.',
        monthly_rent: 6800,
        security_deposit: 5000,
        available_rooms: 3,
        room_occupancy: 'Double Sharing',
        gender_preference: 'Girls',
        furnishing_status: 'Furnished',
        available_from: '2026-11-25',
        rules_restrictions: 'Demo placeholder: Entry timing 9:30 PM. Fresh tiffin meals included twice daily.',
        nearby_landmark: 'Near Stadium Road, Wright Town',
        city: 'Jabalpur',
        locality: 'Wright Town',
        full_address: 'Sample Lane 3, Wright Town, Jabalpur, MP (DEMO)',
        latitude: null,
        longitude: null,
        has_verified_coordinates: false,
        contact_phone: null,
        whatsapp_number: null,
        share_phone: false,
        share_whatsapp: false,
        is_published: true,
        moderation_status: 'approved',
        rejection_reason: null,
        is_demo: true,
        created_at: '2026-11-12T10:00:00.000Z',
        updated_at: '2026-11-12T10:00:00.000Z',
        images: [
          {
            id: 'demo-img-02',
            property_id: 'demo-prop-02',
            image_url: '/src/assets/images/property_pg_shared_1795064714142.jpg',
            is_cover: true,
            sort_order: 0,
          },
        ],
        amenities: pickAmenities(['wifi', 'electricity', 'water', 'food', 'washing-machine', 'cctv', 'security']),
      },
      {
        id: 'demo-prop-03',
        owner_id: 'preview-owner-1',
        owner_name: 'Demo Property Owner',
        title: 'DEMO: Scholar Hostel & Reading Lounge — Civil Lines',
        property_type: 'Hostel',
        description:
          'Sample demonstration hostel listing showcasing a quiet reading lounge, shared dining area, and 24/7 security format for university students near Civil Lines and Pachpedi.',
        monthly_rent: 6200,
        security_deposit: 6000,
        available_rooms: 5,
        room_occupancy: 'Double Sharing',
        gender_preference: 'Co-ed',
        furnishing_status: 'Semi-Furnished',
        available_from: '2026-12-01',
        rules_restrictions: 'Demo placeholder: Valid college ID card required at check-in.',
        nearby_landmark: 'Near RDVV & Pachpedi, Civil Lines',
        city: 'Jabalpur',
        locality: 'Civil Lines',
        full_address: 'Sample Campus Road, Civil Lines, Jabalpur, MP (DEMO)',
        latitude: null,
        longitude: null,
        has_verified_coordinates: false,
        contact_phone: null,
        whatsapp_number: null,
        share_phone: false,
        share_whatsapp: false,
        is_published: true,
        moderation_status: 'approved',
        rejection_reason: null,
        is_demo: true,
        created_at: '2026-11-14T10:00:00.000Z',
        updated_at: '2026-11-14T10:00:00.000Z',
        images: [
          {
            id: 'demo-img-03',
            property_id: 'demo-prop-03',
            image_url: '/src/assets/images/property_hostel_common_1795064714178.jpg',
            is_cover: true,
            sort_order: 0,
          },
          {
            id: 'demo-img-03b',
            property_id: 'demo-prop-03',
            image_url: '/src/assets/images/property_pg_shared_1795064714142.jpg',
            is_cover: false,
            sort_order: 1,
          },
        ],
        amenities: pickAmenities(['wifi', 'electricity', 'water', 'food', 'study-table', 'cctv', 'security', 'parking']),
      },
      {
        id: 'demo-prop-04',
        owner_id: 'preview-owner-1',
        owner_name: 'Demo Property Owner',
        title: 'DEMO: Independent 1BHK Student Flat — Napier Town',
        property_type: 'Flat',
        description:
          'Sample demonstration 1BHK student flat for two senior students seeking quiet independent living with kitchenette, AC option, and balcony daylight.',
        monthly_rent: 9500,
        security_deposit: 10000,
        available_rooms: 1,
        room_occupancy: 'Full Flat',
        gender_preference: 'Any',
        furnishing_status: 'Furnished',
        available_from: '2026-12-05',
        rules_restrictions: 'Demo placeholder: Standard 11-month student rental agreement.',
        nearby_landmark: 'Near Russell Chowk, Napier Town',
        city: 'Jabalpur',
        locality: 'Napier Town',
        full_address: 'Sample Residency, Napier Town, Jabalpur, MP (DEMO)',
        latitude: null,
        longitude: null,
        has_verified_coordinates: false,
        contact_phone: null,
        whatsapp_number: null,
        share_phone: false,
        share_whatsapp: false,
        is_published: true,
        moderation_status: 'approved',
        rejection_reason: null,
        is_demo: true,
        created_at: '2026-11-15T10:00:00.000Z',
        updated_at: '2026-11-15T10:00:00.000Z',
        images: [
          {
            id: 'demo-img-04',
            property_id: 'demo-prop-04',
            image_url: '/src/assets/images/property_student_flat_1795064714302.jpg',
            is_cover: true,
            sort_order: 0,
          },
        ],
        amenities: pickAmenities(['wifi', 'electricity', 'water', 'ac', 'attached-bathroom', 'study-table', 'parking']),
      },
      {
        id: 'demo-prop-05',
        owner_id: 'preview-owner-1',
        owner_name: 'Demo Property Owner',
        title: 'DEMO: Budget Shared Accommodation — Madan Mahal',
        property_type: 'Shared',
        description:
          'Sample demonstration shared room near Madan Mahal transit corridor, showing affordable rent structure and essential utilities for newcomers.',
        monthly_rent: 3600,
        security_deposit: 3600,
        available_rooms: 3,
        room_occupancy: 'Triple Sharing',
        gender_preference: 'Boys',
        furnishing_status: 'Semi-Furnished',
        available_from: '2026-11-20',
        rules_restrictions: 'Demo placeholder: Electricity charged on sub-meter reading.',
        nearby_landmark: 'Near Madan Mahal Station',
        city: 'Jabalpur',
        locality: 'Madan Mahal',
        full_address: 'Sample Street 2, Madan Mahal, Jabalpur, MP (DEMO)',
        latitude: null,
        longitude: null,
        has_verified_coordinates: false,
        contact_phone: null,
        whatsapp_number: null,
        share_phone: false,
        share_whatsapp: false,
        is_published: true,
        moderation_status: 'approved',
        rejection_reason: null,
        is_demo: true,
        created_at: '2026-11-16T10:00:00.000Z',
        updated_at: '2026-11-16T10:00:00.000Z',
        images: [
          {
            id: 'demo-img-05',
            property_id: 'demo-prop-05',
            image_url: '/src/assets/images/property_pg_shared_1795064714142.jpg',
            is_cover: true,
            sort_order: 0,
          },
        ],
        amenities: pickAmenities(['wifi', 'electricity', 'water', 'parking']),
      },
      {
        id: 'demo-prop-06',
        owner_id: 'preview-owner-1',
        owner_name: 'Demo Property Owner',
        title: 'DEMO: Quiet Medical Student Room — Garha',
        property_type: 'Room',
        description:
          'Sample demonstration private room tailored for students studying around Medical College Road in Garha. Features study desk and attached washroom.',
        monthly_rent: 5000,
        security_deposit: 5000,
        available_rooms: 0,
        room_occupancy: 'Single',
        gender_preference: 'Girls',
        furnishing_status: 'Furnished',
        available_from: '2026-12-01',
        rules_restrictions: 'Demo placeholder: Dedicated study environment; no loud music.',
        nearby_landmark: 'Near Medical College Road, Garha',
        city: 'Jabalpur',
        locality: 'Garha',
        full_address: 'Sample Avenue, Garha, Jabalpur, MP (DEMO)',
        latitude: null,
        longitude: null,
        has_verified_coordinates: false,
        contact_phone: null,
        whatsapp_number: null,
        share_phone: false,
        share_whatsapp: false,
        is_published: true,
        moderation_status: 'approved',
        rejection_reason: null,
        is_demo: true,
        created_at: '2026-11-17T10:00:00.000Z',
        updated_at: '2026-11-17T10:00:00.000Z',
        images: [
          {
            id: 'demo-img-06',
            property_id: 'demo-prop-06',
            image_url: '/src/assets/images/hero_jabalpur_student_room_1795064714452.jpg',
            is_cover: true,
            sort_order: 0,
          },
        ],
        amenities: pickAmenities(['wifi', 'electricity', 'water', 'attached-bathroom', 'study-table', 'security']),
      },
      {
        id: 'demo-prop-07',
        owner_id: 'preview-owner-1',
        owner_name: 'Demo Property Owner',
        title: 'DEMO: Budget Shared Student Bed — Ranjhi (Near JEC)',
        property_type: 'Shared',
        description:
          'Sample demonstration budget accommodation near JEC Jabalpur illustrating ₹2,000/month shared stays on THIKANO. Clearly marked as DEMO test data.',
        monthly_rent: 2000,
        security_deposit: 2000,
        available_rooms: 4,
        room_occupancy: 'Dormitory',
        gender_preference: 'Boys',
        furnishing_status: 'Semi-Furnished',
        available_from: '2026-11-22',
        rules_restrictions: 'Demo placeholder: Shared storage and drinking water included.',
        nearby_landmark: 'Near JEC Campus, Ranjhi',
        city: 'Jabalpur',
        locality: 'Ranjhi',
        full_address: 'Sample Street, Gokulpur, Ranjhi, Jabalpur, MP (DEMO)',
        latitude: null,
        longitude: null,
        has_verified_coordinates: false,
        contact_phone: null,
        whatsapp_number: null,
        share_phone: false,
        share_whatsapp: false,
        is_published: true,
        moderation_status: 'approved',
        rejection_reason: null,
        is_demo: true,
        created_at: '2026-11-18T10:00:00.000Z',
        updated_at: '2026-11-18T10:00:00.000Z',
        images: [
          {
            id: 'demo-img-07',
            property_id: 'demo-prop-07',
            image_url: '/src/assets/images/property_pg_shared_1795064714142.jpg',
            is_cover: true,
            sort_order: 0,
          },
        ],
        amenities: pickAmenities(['electricity', 'water', 'parking']),
      },
      {
        id: 'demo-prop-08',
        owner_id: 'preview-owner-1',
        owner_name: 'Demo Property Owner',
        title: 'DEMO: Affordable Student Room — Adhartal (Near JNKVV)',
        property_type: 'Room',
        description:
          'Sample demonstration budget room in Adhartal near JNKVV campus, illustrating low-cost student rooms starting around ₹3,200/month.',
        monthly_rent: 3200,
        security_deposit: 3000,
        available_rooms: 2,
        room_occupancy: 'Double Sharing',
        gender_preference: 'Any',
        furnishing_status: 'Unfurnished',
        available_from: '2026-11-25',
        rules_restrictions: 'Demo placeholder: Water included; electricity on sub-meter.',
        nearby_landmark: 'Near JNKVV Campus, Adhartal',
        city: 'Jabalpur',
        locality: 'Adhartal',
        full_address: 'Sample Block, Adhartal, Jabalpur, MP (DEMO)',
        latitude: null,
        longitude: null,
        has_verified_coordinates: false,
        contact_phone: null,
        whatsapp_number: null,
        share_phone: false,
        share_whatsapp: false,
        is_published: true,
        moderation_status: 'approved',
        rejection_reason: null,
        is_demo: true,
        created_at: '2026-11-18T12:00:00.000Z',
        updated_at: '2026-11-18T12:00:00.000Z',
        images: [
          {
            id: 'demo-img-08',
            property_id: 'demo-prop-08',
            image_url: '/src/assets/images/property_private_room_1795064714785.jpg',
            is_cover: true,
            sort_order: 0,
          },
        ],
        amenities: pickAmenities(['wifi', 'electricity', 'water', 'parking']),
      },
    ],
    enquiries: [],
    saved: [],
    reports: [],
  };
}

const DB_FILE = path.resolve(process.cwd(), 'data', 'preview-db.json');

function loadDb(): PreviewDatabase {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(raw) as PreviewDatabase;
    }
  } catch {
    // Fallback to fresh seed if read fails
  }
  const initial = createInitialPreviewDb();
  saveDb(initial);
  return initial;
}

function saveDb(db: PreviewDatabase): void {
  try {
    fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch {
    // Keep operating in-memory if filesystem is ephemeral/read-only
  }
}

const db = loadDb();

function sanitizeUser(u: PreviewUser) {
  const { password_hash: _, ...rest } = u;
  return rest;
}

function getSessionUser(req: Request): PreviewUser | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7).trim();
  const userId = db.sessions[token];
  if (!userId) return null;
  return db.users.find((u) => u.id === userId) || null;
}

function requireAuth(req: Request, res: Response, next: NextFunction) {
  const user = getSessionUser(req);
  if (!user) {
    res.status(401).json({ error: 'Authentication required. Please log in.' });
    return;
  }
  (req as Request & { user: PreviewUser }).user = user;
  next();
}

function requireRole(roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as Request & { user?: PreviewUser }).user;
    if (!user || !roles.includes(user.role)) {
      res.status(403).json({ error: 'Access denied. You do not have permission for this action.' });
      return;
    }
    next();
  };
}

async function startServer() {
  const app = express();
  const server = createHttpServer(app);
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '12mb' }));

  // Healthcheck
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ ok: true, mode: 'preview-hybrid' });
  });

  // Google Maps client config helper (supports VITE_GOOGLE_MAPS_API_KEY or GOOGLE_MAPS_API_KEY in runtime env)
  app.get('/api/maps/config', (_req: Request, res: Response) => {
    const apiKey = process.env.VITE_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY || '';
    res.json({ apiKey, configured: Boolean(apiKey) });
  });

  // --- AUTH ENDPOINTS (Local Preview Mode when Supabase is not configured) ---
  app.post('/api/preview/auth/signup', (req: Request, res: Response) => {
    const { full_name, email, password, role } = req.body || {};
    if (!full_name || String(full_name).trim().length < 2) {
      res.status(400).json({ error: 'Please enter your full name (at least 2 characters).' });
      return;
    }
    if (!email || !String(email).includes('@')) {
      res.status(400).json({ error: 'Please enter a valid email address.' });
      return;
    }
    if (!password || String(password).length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters.' });
      return;
    }
    const cleanEmail = String(email).trim().toLowerCase();
    if (db.users.some((u) => u.email.toLowerCase() === cleanEmail)) {
      res.status(409).json({ error: 'An account with this email already exists.' });
      return;
    }
    // Never allow self-registration as admin
    const safeRole: UserRole = role === 'owner' ? 'owner' : 'student';
    const now = new Date().toISOString();
    const newUser: PreviewUser = {
      id: `user-${crypto.randomUUID()}`,
      full_name: String(full_name).trim(),
      email: cleanEmail,
      password_hash: hashPassword(String(password)),
      phone: null,
      whatsapp_number: null,
      role: safeRole,
      college: null,
      preferred_location: null,
      budget_preference: null,
      avatar_url: null,
      created_at: now,
      updated_at: now,
    };
    db.users.push(newUser);
    const token = crypto.randomBytes(24).toString('hex');
    db.sessions[token] = newUser.id;
    saveDb(db);
    res.status(201).json({ token, user: sanitizeUser(newUser) });
  });

  app.post('/api/preview/auth/login', (req: Request, res: Response) => {
    const { email, password } = req.body || {};
    const cleanEmail = String(email || '').trim().toLowerCase();
    const user = db.users.find((u) => u.email.toLowerCase() === cleanEmail);
    if (!user || user.password_hash !== hashPassword(String(password || ''))) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }
    const token = crypto.randomBytes(24).toString('hex');
    db.sessions[token] = user.id;
    saveDb(db);
    res.json({ token, user: sanitizeUser(user) });
  });

  app.post('/api/preview/auth/logout', (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      delete db.sessions[authHeader.slice(7).trim()];
      saveDb(db);
    }
    res.json({ ok: true });
  });

  app.get('/api/preview/auth/me', requireAuth, (req: Request, res: Response) => {
    const user = (req as Request & { user: PreviewUser }).user;
    res.json({ user: sanitizeUser(user) });
  });

  app.put('/api/preview/profile', requireAuth, (req: Request, res: Response) => {
    const user = (req as Request & { user: PreviewUser }).user;
    const { full_name, phone, whatsapp_number, college, preferred_location, budget_preference } = req.body || {};
    if (full_name !== undefined && String(full_name).trim().length < 2) {
      res.status(400).json({ error: 'Name must be at least 2 characters.' });
      return;
    }
    if (full_name !== undefined) user.full_name = String(full_name).trim();
    if (phone !== undefined) user.phone = phone ? String(phone).trim() : null;
    if (whatsapp_number !== undefined) user.whatsapp_number = whatsapp_number ? String(whatsapp_number).trim() : null;
    if (college !== undefined) user.college = college ? String(college).trim() : null;
    if (preferred_location !== undefined) user.preferred_location = preferred_location ? String(preferred_location).trim() : null;
    if (budget_preference !== undefined) {
      user.budget_preference = budget_preference === null || budget_preference === '' ? null : Number(budget_preference);
    }
    user.updated_at = new Date().toISOString();
    saveDb(db);
    res.json({ user: sanitizeUser(user) });
  });

  app.post('/api/preview/auth/reset-password', (req: Request, res: Response) => {
    const { email, new_password } = req.body || {};
    const cleanEmail = String(email || '').trim().toLowerCase();
    const user = db.users.find((u) => u.email.toLowerCase() === cleanEmail);
    if (!user) {
      // Do not leak whether email exists unless updating password directly in preview
      res.json({ ok: true, message: 'If that email exists in preview mode, password reset instructions were prepared.' });
      return;
    }
    if (new_password) {
      if (String(new_password).length < 6) {
        res.status(400).json({ error: 'New password must be at least 6 characters.' });
        return;
      }
      user.password_hash = hashPassword(String(new_password));
      user.updated_at = new Date().toISOString();
      saveDb(db);
      res.json({ ok: true, message: 'Password updated in Local Preview Mode. You can log in now.' });
      return;
    }
    res.json({ ok: true, message: 'Preview reset verified. Enter a new password below to complete reset.' });
  });

  // --- CATEGORIES ---
  app.get('/api/preview/categories', (_req: Request, res: Response) => {
    res.json({ categories: db.categories.filter((c) => c.is_active).sort((a, b) => a.sort_order - b.sort_order) });
  });

  // --- PROPERTIES ---
  app.get('/api/preview/properties', (req: Request, res: Response) => {
    const viewer = getSessionUser(req);
    const {
      query,
      locality,
      propertyType,
      maxRent,
      minRent,
      genderPreference,
      furnishingStatus,
      amenities,
      availableOnly,
      sortBy,
      ownerOnly,
    } = req.query;

    let items = [...db.properties];

    if (ownerOnly === 'true') {
      if (!viewer) {
        res.status(401).json({ error: 'Login required.' });
        return;
      }
      items = items.filter((p) => p.owner_id === viewer.id);
    } else {
      items = items.filter((p) => p.is_published && p.moderation_status === 'approved');
    }

    if (query && String(query).trim()) {
      const q = String(query).trim().toLowerCase();
      items = items.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.locality.toLowerCase().includes(q) ||
          p.full_address.toLowerCase().includes(q) ||
          (p.nearby_landmark || '').toLowerCase().includes(q)
      );
    }
    if (locality && locality !== 'All') {
      items = items.filter((p) => p.locality.toLowerCase() === String(locality).toLowerCase());
    }
    if (propertyType && propertyType !== 'All') {
      items = items.filter((p) => p.property_type.toLowerCase() === String(propertyType).toLowerCase());
    }
    if (minRent) {
      const min = Number(minRent);
      if (!Number.isNaN(min)) items = items.filter((p) => p.monthly_rent >= min);
    }
    if (maxRent) {
      const max = Number(maxRent);
      if (!Number.isNaN(max)) items = items.filter((p) => p.monthly_rent <= max);
    }
    if (genderPreference && genderPreference !== 'All') {
      items = items.filter((p) => p.gender_preference === genderPreference);
    }
    if (furnishingStatus && furnishingStatus !== 'All') {
      items = items.filter((p) => p.furnishing_status === furnishingStatus);
    }
    if (availableOnly === 'true') {
      items = items.filter((p) => p.available_rooms > 0);
    }
    if (amenities && String(amenities).trim()) {
      const requiredSlugs = String(amenities)
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      if (requiredSlugs.length > 0) {
        items = items.filter((p) => requiredSlugs.every((slug) => p.amenities.some((a) => a.slug === slug)));
      }
    }

    if (sortBy === 'rent_asc') {
      items.sort((a, b) => a.monthly_rent - b.monthly_rent);
    } else if (sortBy === 'rent_desc') {
      items.sort((a, b) => b.monthly_rent - a.monthly_rent);
    } else {
      items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    res.json({ properties: items });
  });

  app.get('/api/preview/properties/:id', (req: Request, res: Response) => {
    const viewer = getSessionUser(req);
    const prop = db.properties.find((p) => p.id === req.params.id);
    if (!prop) {
      res.status(404).json({ error: 'Property not found.' });
      return;
    }
    const isVisible =
      (prop.is_published && prop.moderation_status === 'approved') ||
      (viewer && (viewer.id === prop.owner_id || viewer.role === 'admin'));
    if (!isVisible) {
      res.status(403).json({ error: 'This listing is currently unavailable.' });
      return;
    }
    res.json({ property: prop });
  });

  app.post('/api/preview/properties', requireAuth, requireRole(['owner', 'admin']), (req: Request, res: Response) => {
    const user = (req as Request & { user: PreviewUser }).user;
    const body = req.body || {};

    if (!body.title || String(body.title).trim().length < 5) {
      res.status(400).json({ error: 'Property title must be at least 5 characters.' });
      return;
    }
    if (!body.description || String(body.description).trim().length < 20) {
      res.status(400).json({ error: 'Description must be at least 20 characters.' });
      return;
    }
    const rent = Number(body.monthly_rent);
    if (!rent || rent < 500) {
      res.status(400).json({ error: 'Monthly rent must be at least ₹500.' });
      return;
    }

    const propId = `prop-${crypto.randomUUID()}`;
    const now = new Date().toISOString();
    const amenitySlugs: string[] = Array.isArray(body.amenity_slugs) ? body.amenity_slugs : [];
    const imagesInput: Array<{ image_url: string; is_cover?: boolean }> = Array.isArray(body.images) ? body.images : [];
    const lat = body.latitude !== null && body.latitude !== undefined && body.latitude !== '' ? Number(body.latitude) : null;
    const lng = body.longitude !== null && body.longitude !== undefined && body.longitude !== '' ? Number(body.longitude) : null;
    const hasCoords = lat !== null && lng !== null && !Number.isNaN(lat) && !Number.isNaN(lng);

    const newProp: PreviewProperty = {
      id: propId,
      owner_id: user.id,
      owner_name: user.full_name,
      title: String(body.title).trim(),
      property_type: body.property_type || 'Room',
      description: String(body.description).trim(),
      monthly_rent: rent,
      security_deposit: Number(body.security_deposit) || 0,
      available_rooms: Math.max(0, Number(body.available_rooms ?? 1)),
      room_occupancy: body.room_occupancy || 'Single',
      gender_preference: body.gender_preference || 'Any',
      furnishing_status: body.furnishing_status || 'Semi-Furnished',
      available_from: body.available_from || new Date().toISOString().slice(0, 10),
      rules_restrictions: body.rules_restrictions ? String(body.rules_restrictions).trim() : null,
      nearby_landmark: body.nearby_landmark ? String(body.nearby_landmark).trim() : null,
      city: body.city || 'Jabalpur',
      locality: String(body.locality || 'Vijay Nagar').trim(),
      full_address: String(body.full_address || '').trim(),
      latitude: hasCoords ? lat : null,
      longitude: hasCoords ? lng : null,
      has_verified_coordinates: hasCoords,
      contact_phone: body.contact_phone ? String(body.contact_phone).trim() : null,
      whatsapp_number: body.whatsapp_number ? String(body.whatsapp_number).trim() : null,
      share_phone: Boolean(body.share_phone && body.contact_phone),
      share_whatsapp: Boolean(body.share_whatsapp && body.whatsapp_number),
      is_published: Boolean(body.is_published ?? true),
      moderation_status: 'approved', // Auto-visible in local preview; admin can still reject/moderate
      rejection_reason: null,
      is_demo: false,
      created_at: now,
      updated_at: now,
      images: imagesInput.map((img, idx) => ({
        id: `img-${crypto.randomUUID()}`,
        property_id: propId,
        image_url: img.image_url,
        is_cover: idx === 0 ? (imagesInput.some((i) => i.is_cover) ? Boolean(img.is_cover) : true) : Boolean(img.is_cover),
        sort_order: idx,
      })),
      amenities: pickAmenities(amenitySlugs),
    };

    db.properties.unshift(newProp);
    saveDb(db);
    res.status(201).json({ property: newProp });
  });

  app.put('/api/preview/properties/:id', requireAuth, requireRole(['owner', 'admin']), (req: Request, res: Response) => {
    const user = (req as Request & { user: PreviewUser }).user;
    const prop = db.properties.find((p) => p.id === req.params.id);
    if (!prop) {
      res.status(404).json({ error: 'Property not found.' });
      return;
    }
    if (prop.owner_id !== user.id && user.role !== 'admin') {
      res.status(403).json({ error: 'You can only edit your own listings.' });
      return;
    }

    const body = req.body || {};
    if (body.title !== undefined) prop.title = String(body.title).trim();
    if (body.property_type !== undefined) prop.property_type = body.property_type;
    if (body.description !== undefined) prop.description = String(body.description).trim();
    if (body.monthly_rent !== undefined) prop.monthly_rent = Number(body.monthly_rent);
    if (body.security_deposit !== undefined) prop.security_deposit = Number(body.security_deposit);
    if (body.available_rooms !== undefined) prop.available_rooms = Math.max(0, Number(body.available_rooms));
    if (body.room_occupancy !== undefined) prop.room_occupancy = body.room_occupancy;
    if (body.gender_preference !== undefined) prop.gender_preference = body.gender_preference;
    if (body.furnishing_status !== undefined) prop.furnishing_status = body.furnishing_status;
    if (body.available_from !== undefined) prop.available_from = body.available_from;
    if (body.rules_restrictions !== undefined) prop.rules_restrictions = body.rules_restrictions;
    if (body.nearby_landmark !== undefined) prop.nearby_landmark = body.nearby_landmark;
    if (body.city !== undefined) prop.city = body.city;
    if (body.locality !== undefined) prop.locality = body.locality;
    if (body.full_address !== undefined) prop.full_address = body.full_address;
    if (body.latitude !== undefined && body.longitude !== undefined) {
      const lat = body.latitude === null || body.latitude === '' ? null : Number(body.latitude);
      const lng = body.longitude === null || body.longitude === '' ? null : Number(body.longitude);
      const hasCoords = lat !== null && lng !== null && !Number.isNaN(lat) && !Number.isNaN(lng);
      prop.latitude = hasCoords ? lat : null;
      prop.longitude = hasCoords ? lng : null;
      prop.has_verified_coordinates = hasCoords;
    }
    if (body.contact_phone !== undefined) prop.contact_phone = body.contact_phone || null;
    if (body.whatsapp_number !== undefined) prop.whatsapp_number = body.whatsapp_number || null;
    if (body.share_phone !== undefined) prop.share_phone = Boolean(body.share_phone && prop.contact_phone);
    if (body.share_whatsapp !== undefined) prop.share_whatsapp = Boolean(body.share_whatsapp && prop.whatsapp_number);
    if (body.is_published !== undefined) prop.is_published = Boolean(body.is_published);
    if (Array.isArray(body.amenity_slugs)) prop.amenities = pickAmenities(body.amenity_slugs);
    if (Array.isArray(body.images)) {
      prop.images = body.images.map((img: { id?: string; image_url: string; is_cover?: boolean }, idx: number) => ({
        id: img.id || `img-${crypto.randomUUID()}`,
        property_id: prop.id,
        image_url: img.image_url,
        is_cover: Boolean(img.is_cover),
        sort_order: idx,
      }));
    }
    prop.updated_at = new Date().toISOString();
    saveDb(db);
    res.json({ property: prop });
  });

  app.patch('/api/preview/properties/:id/availability', requireAuth, requireRole(['owner', 'admin']), (req: Request, res: Response) => {
    const user = (req as Request & { user: PreviewUser }).user;
    const prop = db.properties.find((p) => p.id === req.params.id);
    if (!prop) {
      res.status(404).json({ error: 'Property not found.' });
      return;
    }
    if (prop.owner_id !== user.id && user.role !== 'admin') {
      res.status(403).json({ error: 'You can only update your own listings.' });
      return;
    }
    const { available_rooms, available_from } = req.body || {};
    const parsedRooms = Number(available_rooms);
    if (Number.isNaN(parsedRooms) || parsedRooms < 0) {
      res.status(400).json({ error: 'Available rooms must be 0 or greater.' });
      return;
    }
    prop.available_rooms = Math.floor(parsedRooms);
    if (typeof available_from === 'string' && available_from.trim()) {
      prop.available_from = available_from.trim();
    }
    prop.updated_at = new Date().toISOString();
    saveDb(db);
    res.json({ property: prop });
  });

  app.delete('/api/preview/properties/:id', requireAuth, requireRole(['owner', 'admin']), (req: Request, res: Response) => {
    const user = (req as Request & { user: PreviewUser }).user;
    const idx = db.properties.findIndex((p) => p.id === req.params.id);
    if (idx === -1) {
      res.status(404).json({ error: 'Property not found.' });
      return;
    }
    if (db.properties[idx].owner_id !== user.id && user.role !== 'admin') {
      res.status(403).json({ error: 'You can only delete your own listings.' });
      return;
    }
    db.properties.splice(idx, 1);
    db.saved = db.saved.filter((s) => s.property_id !== req.params.id);
    saveDb(db);
    res.json({ ok: true });
  });

  // --- SAVED PROPERTIES ---
  app.get('/api/preview/saved', requireAuth, (req: Request, res: Response) => {
    const user = (req as Request & { user: PreviewUser }).user;
    const savedRows = db.saved
      .filter((s) => s.student_id === user.id)
      .map((s) => ({
        ...s,
        property: db.properties.find((p) => p.id === s.property_id),
      }))
      .filter((s) => Boolean(s.property));
    res.json({ saved: savedRows });
  });

  app.post('/api/preview/saved/:propertyId', requireAuth, (req: Request, res: Response) => {
    const user = (req as Request & { user: PreviewUser }).user;
    const { propertyId } = req.params;
    const existingIdx = db.saved.findIndex((s) => s.student_id === user.id && s.property_id === propertyId);
    if (existingIdx >= 0) {
      db.saved.splice(existingIdx, 1);
      saveDb(db);
      res.json({ saved: false });
      return;
    }
    db.saved.push({
      id: `sav-${crypto.randomUUID()}`,
      student_id: user.id,
      property_id: propertyId,
      created_at: new Date().toISOString(),
    });
    saveDb(db);
    res.json({ saved: true });
  });

  // --- ENQUIRIES ---
  app.get('/api/preview/enquiries', requireAuth, (req: Request, res: Response) => {
    const user = (req as Request & { user: PreviewUser }).user;
    let items = db.enquiries;
    if (user.role === 'student') {
      items = items.filter((e) => e.student_id === user.id);
    } else if (user.role === 'owner') {
      items = items.filter((e) => e.owner_id === user.id);
    }
    const enriched = items
      .map((e) => {
        const prop = db.properties.find((p) => p.id === e.property_id);
        return {
          ...e,
          property_title: prop?.title || 'Property',
          property_locality: prop?.locality || 'Jabalpur',
        };
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    res.json({ enquiries: enriched });
  });

  app.post('/api/preview/enquiries', requireAuth, (req: Request, res: Response) => {
    const user = (req as Request & { user: PreviewUser }).user;
    const { property_id, student_name, student_phone, message, preferred_move_in } = req.body || {};
    const prop = db.properties.find((p) => p.id === property_id && p.is_published && p.moderation_status === 'approved');
    if (!prop) {
      res.status(404).json({ error: 'Property not found or unavailable for enquiries.' });
      return;
    }
    if (!message || String(message).trim().length < 10) {
      res.status(400).json({ error: 'Please write a short message (at least 10 characters).' });
      return;
    }
    if (!student_phone || String(student_phone).trim().length < 8) {
      res.status(400).json({ error: 'Please enter a valid contact number.' });
      return;
    }
    const duplicate = db.enquiries.find(
      (e) => e.property_id === property_id && e.student_id === user.id && (e.status === 'pending' || e.status === 'contacted')
    );
    if (duplicate) {
      res.status(409).json({ error: 'You already have an active enquiry for this property.' });
      return;
    }
    const now = new Date().toISOString();
    const enq: PreviewEnquiry = {
      id: `enq-${crypto.randomUUID()}`,
      property_id,
      student_id: user.id,
      owner_id: prop.owner_id,
      student_name: String(student_name || user.full_name).trim(),
      student_phone: String(student_phone).trim(),
      message: String(message).trim(),
      preferred_move_in: preferred_move_in || null,
      status: 'pending',
      created_at: now,
      updated_at: now,
    };
    db.enquiries.unshift(enq);
    saveDb(db);
    res.status(201).json({ enquiry: { ...enq, property_title: prop.title, property_locality: prop.locality } });
  });

  app.patch('/api/preview/enquiries/:id', requireAuth, requireRole(['owner', 'admin']), (req: Request, res: Response) => {
    const user = (req as Request & { user: PreviewUser }).user;
    const enq = db.enquiries.find((e) => e.id === req.params.id);
    if (!enq) {
      res.status(404).json({ error: 'Enquiry not found.' });
      return;
    }
    if (enq.owner_id !== user.id && user.role !== 'admin') {
      res.status(403).json({ error: 'You can only update enquiries for your properties.' });
      return;
    }
    const { status } = req.body || {};
    if (['pending', 'contacted', 'resolved', 'archived'].includes(status)) {
      enq.status = status;
      enq.updated_at = new Date().toISOString();
      saveDb(db);
    }
    res.json({ enquiry: enq });
  });

  // --- REPORTS ---
  app.post('/api/preview/reports', requireAuth, (req: Request, res: Response) => {
    const user = (req as Request & { user: PreviewUser }).user;
    const { property_id, reason, details } = req.body || {};
    if (!property_id || !reason) {
      res.status(400).json({ error: 'Please select a reason for reporting.' });
      return;
    }
    const now = new Date().toISOString();
    const report: PreviewReport = {
      id: `rep-${crypto.randomUUID()}`,
      property_id,
      reporter_id: user.id,
      reason: String(reason).trim(),
      details: details ? String(details).trim() : null,
      status: 'open',
      admin_notes: null,
      created_at: now,
      updated_at: now,
    };
    db.reports.unshift(report);
    saveDb(db);
    res.status(201).json({ report });
  });

  // --- ADMIN ENDPOINTS (Strict Server-Side Admin Role Check) ---
  app.get('/api/preview/admin/overview', requireAuth, requireRole(['admin']), (_req: Request, res: Response) => {
    const users = db.users.map(sanitizeUser);
    const properties = [...db.properties];
    const enquiries = db.enquiries.map((e) => {
      const prop = db.properties.find((p) => p.id === e.property_id);
      return { ...e, property_title: prop?.title || 'Property', property_locality: prop?.locality || 'Jabalpur' };
    });
    const reports = db.reports.map((r) => {
      const prop = db.properties.find((p) => p.id === r.property_id);
      const repUser = db.users.find((u) => u.id === r.reporter_id);
      return {
        ...r,
        property_title: prop?.title || 'Removed Property',
        reporter_name: repUser?.full_name || 'User',
      };
    });

    res.json({
      stats: {
        totalUsers: users.length,
        totalOwners: users.filter((u) => u.role === 'owner').length,
        totalStudents: users.filter((u) => u.role === 'student').length,
        totalProperties: properties.length,
        approvedProperties: properties.filter((p) => p.moderation_status === 'approved').length,
        pendingModeration: properties.filter((p) => p.moderation_status === 'pending').length,
        totalEnquiries: enquiries.length,
        openReports: reports.filter((r) => r.status === 'open').length,
      },
      users,
      properties,
      enquiries,
      reports,
      categories: db.categories,
    });
  });

  app.patch('/api/preview/admin/properties/:id/moderate', requireAuth, requireRole(['admin']), (req: Request, res: Response) => {
    const prop = db.properties.find((p) => p.id === req.params.id);
    if (!prop) {
      res.status(404).json({ error: 'Property not found.' });
      return;
    }
    const { moderation_status, rejection_reason } = req.body || {};
    if (!['pending', 'approved', 'rejected'].includes(moderation_status)) {
      res.status(400).json({ error: 'Invalid moderation status.' });
      return;
    }
    prop.moderation_status = moderation_status;
    prop.rejection_reason = rejection_reason || null;
    prop.updated_at = new Date().toISOString();
    saveDb(db);
    res.json({ property: prop });
  });

  app.patch('/api/preview/admin/reports/:id', requireAuth, requireRole(['admin']), (req: Request, res: Response) => {
    const report = db.reports.find((r) => r.id === req.params.id);
    if (!report) {
      res.status(404).json({ error: 'Report not found.' });
      return;
    }
    const { status, admin_notes } = req.body || {};
    if (['open', 'reviewed', 'resolved', 'dismissed'].includes(status)) {
      report.status = status;
    }
    if (admin_notes !== undefined) report.admin_notes = admin_notes;
    report.updated_at = new Date().toISOString();
    saveDb(db);
    res.json({ report });
  });

  app.post('/api/preview/admin/categories', requireAuth, requireRole(['admin']), (req: Request, res: Response) => {
    const { name, description } = req.body || {};
    if (!name || String(name).trim().length < 2) {
      res.status(400).json({ error: 'Category name is required.' });
      return;
    }
    const slug = String(name)
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-');
    const newCat: PreviewCategory = {
      id: Math.max(0, ...db.categories.map((c) => c.id)) + 1,
      slug,
      name: String(name).trim(),
      description: description ? String(description).trim() : null,
      is_active: true,
      sort_order: db.categories.length + 1,
    };
    db.categories.push(newCat);
    saveDb(db);
    res.status(201).json({ category: newCat });
  });

  app.patch('/api/preview/admin/categories/:id', requireAuth, requireRole(['admin']), (req: Request, res: Response) => {
    const cat = db.categories.find((c) => c.id === Number(req.params.id));
    if (!cat) {
      res.status(404).json({ error: 'Category not found.' });
      return;
    }
    if (req.body.is_active !== undefined) cat.is_active = Boolean(req.body.is_active);
    if (req.body.name !== undefined) cat.name = String(req.body.name).trim();
    if (req.body.description !== undefined) cat.description = req.body.description;
    saveDb(db);
    res.json({ category: cat });
  });

  // Serve generated 5th Semester PowerPoint presentation directly for download
  app.get('/THIKANO_5th_Sem_Project.pptx', (_req: Request, res: Response) => {
    const publicPptx = path.resolve(process.cwd(), 'public', 'THIKANO_5th_Sem_Project.pptx');
    const distPptx = path.resolve(process.cwd(), 'dist', 'THIKANO_5th_Sem_Project.pptx');
    const filePath = fs.existsSync(publicPptx) ? publicPptx : distPptx;
    if (!fs.existsSync(filePath)) {
      res.status(404).send('Presentation file not found.');
      return;
    }
    res.download(filePath, 'THIKANO_5th_Sem_Project.pptx');
  });

  // Serve full website ZIP archive directly for download
  app.get('/THIKANO_Full_Website_Project.zip', (_req: Request, res: Response) => {
    const zipPath = path.resolve(process.cwd(), 'THIKANO_Full_Website_Project.zip');
    if (!fs.existsSync(zipPath)) {
      res.status(404).send('ZIP archive not found.');
      return;
    }
    res.download(zipPath, 'THIKANO_Full_Website_Project.zip');
  });

  // Vite dev middleware vs static production serving
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true, ws: { server } },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`THIKANO server running on http://0.0.0.0:${PORT}`);
  });

  server.on('error', (error: NodeJS.ErrnoException) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`Port ${PORT} is already in use. Set PORT to an available port or stop the process using it.`);
      process.exitCode = 1;
      return;
    }
    throw error;
  });
}

startServer();

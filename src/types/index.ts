export type UserRole = 'student' | 'owner' | 'admin';

export type PropertyType = 'Room' | 'PG' | 'Hostel' | 'Flat' | 'Shared';

export type RoomOccupancy =
  | 'Single'
  | 'Double Sharing'
  | 'Triple Sharing'
  | 'Dormitory'
  | 'Full Flat';

export type GenderPreference = 'Boys' | 'Girls' | 'Co-ed' | 'Any';

export type FurnishingStatus = 'Furnished' | 'Semi-Furnished' | 'Unfurnished';

export type ModerationStatus = 'pending' | 'approved' | 'rejected';

export type EnquiryStatus = 'pending' | 'contacted' | 'resolved' | 'archived';

export type ReportStatus = 'open' | 'reviewed' | 'resolved' | 'dismissed';

export interface Profile {
  id: string;
  full_name: string;
  email: string;
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

export interface Category {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  is_active: boolean;
  sort_order: number;
}

export interface Amenity {
  id: number;
  slug: string;
  name: string;
  icon_name: string;
}

export interface PropertyImage {
  id: string;
  property_id: string;
  image_url: string;
  storage_path?: string | null;
  is_cover: boolean;
  sort_order: number;
}

export interface Property {
  id: string;
  owner_id: string | null;
  owner_name?: string | null;
  title: string;
  property_type: PropertyType;
  description: string;
  monthly_rent: number;
  security_deposit: number;
  available_rooms: number;
  room_occupancy: RoomOccupancy;
  gender_preference: GenderPreference;
  furnishing_status: FurnishingStatus;
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
  moderation_status: ModerationStatus;
  rejection_reason: string | null;
  is_demo: boolean;
  created_at: string;
  updated_at: string;
  images: PropertyImage[];
  amenities: Amenity[];
}

export interface Enquiry {
  id: string;
  property_id: string;
  property_title?: string;
  property_locality?: string;
  student_id: string;
  owner_id: string | null;
  student_name: string;
  student_phone: string;
  message: string;
  preferred_move_in: string | null;
  status: EnquiryStatus;
  created_at: string;
  updated_at: string;
}

export interface SavedProperty {
  id: string;
  student_id: string;
  property_id: string;
  created_at: string;
  property?: Property;
}

export interface PropertyReport {
  id: string;
  property_id: string;
  property_title?: string;
  reporter_id: string | null;
  reporter_name?: string | null;
  reason: string;
  details: string | null;
  status: ReportStatus;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface PropertySearchFilters {
  query: string;
  city: string;
  locality: string;
  propertyType: string;
  maxRent: number | null;
  minRent: number | null;
  genderPreference: string;
  furnishingStatus: string;
  amenities: string[];
  availableOnly: boolean;
  sortBy: 'newest' | 'rent_asc' | 'rent_desc';
}

export interface AdminStats {
  totalUsers: number;
  totalOwners: number;
  totalStudents: number;
  totalProperties: number;
  approvedProperties: number;
  pendingModeration: number;
  totalEnquiries: number;
  openReports: number;
}

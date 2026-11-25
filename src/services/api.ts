import { isSupabaseConfigured, supabase } from '../lib/supabase';
import type {
  AdminStats,
  Category,
  Enquiry,
  EnquiryStatus,
  ModerationStatus,
  Profile,
  Property,
  PropertyReport,
  PropertySearchFilters,
  ReportStatus,
  SavedProperty,
  UserRole,
} from '../types';
import { DEFAULT_AMENITIES, DEFAULT_CATEGORIES } from '../utils/constants';

const PREVIEW_TOKEN_KEY = 'thikano_preview_token';

function getPreviewToken(): string | null {
  try {
    return localStorage.getItem(PREVIEW_TOKEN_KEY);
  } catch {
    return null;
  }
}

function setPreviewToken(token: string | null) {
  try {
    if (token) localStorage.setItem(PREVIEW_TOKEN_KEY, token);
    else localStorage.removeItem(PREVIEW_TOKEN_KEY);
  } catch {
    // ignore storage restrictions
  }
}

async function previewFetch<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = getPreviewToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(url, { ...options, headers });
  const rawText = await res.text();
  let data: Record<string, unknown> = {};
  if (rawText) {
    try {
      data = JSON.parse(rawText) as Record<string, unknown>;
    } catch {
      if (!res.ok) {
        throw new Error(`Request failed (${res.status})`);
      }
      throw new Error('Unexpected non-JSON response from API.');
    }
  }
  if (!res.ok) {
    const errMsg = typeof data.error === 'string' ? data.error : `Request failed (${res.status})`;
    throw new Error(errMsg);
  }
  return data as T;
}

// Helper to normalize Supabase property rows with joined images + amenities
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapSupabaseProperty(row: any): Property {
  const images = Array.isArray(row.property_images)
    ? [...row.property_images].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    : [];
  const amenities = Array.isArray(row.property_amenities)
    ? row.property_amenities
        .map((pa: { amenities?: unknown }) => pa.amenities)
        .filter(Boolean)
    : [];

  return {
    id: row.id,
    owner_id: row.owner_id,
    owner_name: row.profiles?.full_name || null,
    title: row.title,
    property_type: row.property_type,
    description: row.description,
    monthly_rent: row.monthly_rent,
    security_deposit: row.security_deposit ?? 0,
    available_rooms: row.available_rooms ?? 0,
    room_occupancy: row.room_occupancy,
    gender_preference: row.gender_preference,
    furnishing_status: row.furnishing_status,
    available_from: row.available_from,
    rules_restrictions: row.rules_restrictions,
    nearby_landmark: row.nearby_landmark,
    city: row.city,
    locality: row.locality,
    full_address: row.full_address,
    latitude: row.latitude,
    longitude: row.longitude,
    has_verified_coordinates: Boolean(row.has_verified_coordinates),
    contact_phone: row.contact_phone,
    whatsapp_number: row.whatsapp_number,
    share_phone: Boolean(row.share_phone),
    share_whatsapp: Boolean(row.share_whatsapp),
    is_published: Boolean(row.is_published),
    moderation_status: row.moderation_status,
    rejection_reason: row.rejection_reason,
    is_demo: Boolean(row.is_demo),
    created_at: row.created_at,
    updated_at: row.updated_at,
    images,
    amenities,
  };
}

export interface PropertyInput {
  title: string;
  property_type: Property['property_type'];
  description: string;
  monthly_rent: number;
  security_deposit: number;
  available_rooms: number;
  room_occupancy: Property['room_occupancy'];
  gender_preference: Property['gender_preference'];
  furnishing_status: Property['furnishing_status'];
  available_from: string;
  rules_restrictions?: string | null;
  nearby_landmark?: string | null;
  city: string;
  locality: string;
  full_address: string;
  latitude: number | null;
  longitude: number | null;
  contact_phone?: string | null;
  whatsapp_number?: string | null;
  share_phone: boolean;
  share_whatsapp: boolean;
  is_published: boolean;
  amenity_slugs: string[];
  images: Array<{ id?: string; image_url: string; storage_path?: string | null; is_cover: boolean }>;
}

export const authService = {
  async getCurrentProfile(): Promise<Profile | null> {
    if (isSupabaseConfigured && supabase) {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session?.user) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', sessionData.session.user.id)
        .single();
      if (error) return null;
      return data as Profile;
    }

    const token = getPreviewToken();
    if (!token) return null;
    try {
      const res = await previewFetch<{ user: Profile }>('/api/preview/auth/me');
      return res.user;
    } catch {
      setPreviewToken(null);
      return null;
    }
  },

  async signUp(params: {
    full_name: string;
    email: string;
    password: string;
    role: 'student' | 'owner';
  }): Promise<{ profile: Profile | null; needsEmailVerification: boolean }> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signUp({
        email: params.email.trim(),
        password: params.password,
        options: {
          data: {
            full_name: params.full_name.trim(),
            role: params.role,
          },
        },
      });
      if (error) throw new Error(error.message);
      const needsEmailVerification = !data.session;
      const profile = data.session ? await this.getCurrentProfile() : null;
      return { profile, needsEmailVerification };
    }

    const res = await previewFetch<{ token: string; user: Profile }>('/api/preview/auth/signup', {
      method: 'POST',
      body: JSON.stringify(params),
    });
    setPreviewToken(res.token);
    return { profile: res.user, needsEmailVerification: false };
  },

  async login(email: string, password: string): Promise<Profile> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) throw new Error(error.message);
      const profile = await this.getCurrentProfile();
      if (!profile) throw new Error('Account signed in, but profile record could not be loaded.');
      return profile;
    }

    const res = await previewFetch<{ token: string; user: Profile }>('/api/preview/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setPreviewToken(res.token);
    return res.user;
  },

  async logout(): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
      return;
    }
    try {
      await previewFetch('/api/preview/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    }
    setPreviewToken(null);
  },

  async updateProfile(updates: Partial<Profile>): Promise<Profile> {
    if (isSupabaseConfigured && supabase) {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('You must be signed in.');
      const { data, error } = await supabase
        .from('profiles')
        .update({
          full_name: updates.full_name,
          phone: updates.phone,
          whatsapp_number: updates.whatsapp_number,
          college: updates.college,
          preferred_location: updates.preferred_location,
          budget_preference: updates.budget_preference,
        })
        .eq('id', userData.user.id)
        .select('*')
        .single();
      if (error) throw new Error(error.message);
      return data as Profile;
    }

    const res = await previewFetch<{ user: Profile }>('/api/preview/profile', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    return res.user;
  },

  async requestPasswordReset(email: string, newPassword?: string): Promise<string> {
    if (isSupabaseConfigured && supabase) {
      const redirectTo = `${window.location.origin}/auth?mode=reset`;
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo });
      if (error) throw new Error(error.message);
      return 'Password reset email sent. Check your inbox for the reset link.';
    }

    const res = await previewFetch<{ message: string }>('/api/preview/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email, new_password: newPassword }),
    });
    return res.message;
  },

  async updatePassword(newPassword: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw new Error(error.message);
      return;
    }
    throw new Error('Use the preview password reset form to update password.');
  },
};

export const categoryService = {
  async listActive(): Promise<Category[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      if (error || !data?.length) return DEFAULT_CATEGORIES;
      return data as Category[];
    }
    try {
      const res = await previewFetch<{ categories?: Category[] }>('/api/preview/categories');
      return Array.isArray(res?.categories) && res.categories.length > 0
        ? res.categories
        : DEFAULT_CATEGORIES;
    } catch {
      return DEFAULT_CATEGORIES;
    }
  },
};

export const propertyService = {
  async search(filters: Partial<PropertySearchFilters> = {}): Promise<Property[]> {
    if (isSupabaseConfigured && supabase) {
      let query = supabase
        .from('properties')
        .select(
          `
          *,
          profiles:owner_id(full_name),
          property_images(*),
          property_amenities(amenities(*))
        `
        )
        .eq('is_published', true)
        .eq('moderation_status', 'approved');

      if (filters.locality && filters.locality !== 'All') {
        query = query.ilike('locality', filters.locality);
      }
      if (filters.propertyType && filters.propertyType !== 'All') {
        query = query.eq('property_type', filters.propertyType);
      }
      if (filters.minRent) {
        query = query.gte('monthly_rent', filters.minRent);
      }
      if (filters.maxRent) {
        query = query.lte('monthly_rent', filters.maxRent);
      }
      if (filters.genderPreference && filters.genderPreference !== 'All') {
        query = query.eq('gender_preference', filters.genderPreference);
      }
      if (filters.furnishingStatus && filters.furnishingStatus !== 'All') {
        query = query.eq('furnishing_status', filters.furnishingStatus);
      }
      if (filters.availableOnly) {
        query = query.gt('available_rooms', 0);
      }
      if (filters.query && filters.query.trim()) {
        const q = filters.query.trim();
        query = query.or(
          `title.ilike.%${q}%,locality.ilike.%${q}%,full_address.ilike.%${q}%,nearby_landmark.ilike.%${q}%`
        );
      }

      if (filters.sortBy === 'rent_asc') {
        query = query.order('monthly_rent', { ascending: true });
      } else if (filters.sortBy === 'rent_desc') {
        query = query.order('monthly_rent', { ascending: false });
      } else {
        query = query.order('created_at', { ascending: false });
      }

      const { data, error } = await query;
      if (error) throw new Error(error.message);
      let results = (data || []).map(mapSupabaseProperty);
      if (filters.amenities && filters.amenities.length > 0) {
        results = results.filter((p) =>
          filters.amenities!.every((slug) => p.amenities.some((a) => a.slug === slug))
        );
      }
      return results;
    }

    const params = new URLSearchParams();
    if (filters.query) params.set('query', filters.query);
    if (filters.locality) params.set('locality', filters.locality);
    if (filters.propertyType) params.set('propertyType', filters.propertyType);
    if (filters.minRent) params.set('minRent', String(filters.minRent));
    if (filters.maxRent) params.set('maxRent', String(filters.maxRent));
    if (filters.genderPreference) params.set('genderPreference', filters.genderPreference);
    if (filters.furnishingStatus) params.set('furnishingStatus', filters.furnishingStatus);
    if (filters.amenities?.length) params.set('amenities', filters.amenities.join(','));
    if (filters.availableOnly) params.set('availableOnly', 'true');
    if (filters.sortBy) params.set('sortBy', filters.sortBy);

    const res = await previewFetch<{ properties?: Property[] }>(`/api/preview/properties?${params.toString()}`);
    return Array.isArray(res?.properties) ? res.properties : [];
  },

  async getById(id: string): Promise<Property> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('properties')
        .select(
          `
          *,
          profiles:owner_id(full_name),
          property_images(*),
          property_amenities(amenities(*))
        `
        )
        .eq('id', id)
        .single();
      if (error || !data) throw new Error('Property not found.');
      return mapSupabaseProperty(data);
    }

    const res = await previewFetch<{ property: Property }>(`/api/preview/properties/${id}`);
    return res.property;
  },

  async listMine(): Promise<Property[]> {
    if (isSupabaseConfigured && supabase) {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Login required.');
      const { data, error } = await supabase
        .from('properties')
        .select(
          `
          *,
          property_images(*),
          property_amenities(amenities(*))
        `
        )
        .eq('owner_id', userData.user.id)
        .order('created_at', { ascending: false });
      if (error) throw new Error(error.message);
      return (data || []).map(mapSupabaseProperty);
    }

    const res = await previewFetch<{ properties?: Property[] }>('/api/preview/properties?ownerOnly=true');
    return Array.isArray(res?.properties) ? res.properties : [];
  },

  async create(input: PropertyInput): Promise<Property> {
    if (isSupabaseConfigured && supabase) {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Please log in as a property owner.');
      const hasCoords = input.latitude !== null && input.longitude !== null;

      const { data: created, error } = await supabase
        .from('properties')
        .insert({
          owner_id: userData.user.id,
          title: input.title.trim(),
          property_type: input.property_type,
          description: input.description.trim(),
          monthly_rent: input.monthly_rent,
          security_deposit: input.security_deposit,
          available_rooms: input.available_rooms,
          room_occupancy: input.room_occupancy,
          gender_preference: input.gender_preference,
          furnishing_status: input.furnishing_status,
          available_from: input.available_from,
          rules_restrictions: input.rules_restrictions || null,
          nearby_landmark: input.nearby_landmark || null,
          city: input.city,
          locality: input.locality,
          full_address: input.full_address,
          latitude: hasCoords ? input.latitude : null,
          longitude: hasCoords ? input.longitude : null,
          has_verified_coordinates: hasCoords,
          contact_phone: input.contact_phone || null,
          whatsapp_number: input.whatsapp_number || null,
          share_phone: Boolean(input.share_phone && input.contact_phone),
          share_whatsapp: Boolean(input.share_whatsapp && input.whatsapp_number),
          is_published: input.is_published,
          moderation_status: 'pending',
          is_demo: false,
        })
        .select('*')
        .single();

      if (error || !created) throw new Error(error?.message || 'Failed to create property.');

      if (input.images.length > 0) {
        const imgRows = input.images.map((img, idx) => ({
          property_id: created.id,
          image_url: img.image_url,
          storage_path: img.storage_path || null,
          is_cover: img.is_cover || idx === 0,
          sort_order: idx,
        }));
        await supabase.from('property_images').insert(imgRows);
      }

      if (input.amenity_slugs.length > 0) {
        const { data: amenityRows } = await supabase
          .from('amenities')
          .select('id, slug')
          .in('slug', input.amenity_slugs);
        if (amenityRows?.length) {
          await supabase.from('property_amenities').insert(
            amenityRows.map((a) => ({
              property_id: created.id,
              amenity_id: a.id,
            }))
          );
        }
      }

      return this.getById(created.id);
    }

    const res = await previewFetch<{ property: Property }>('/api/preview/properties', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    return res.property;
  },

  async update(id: string, input: Partial<PropertyInput>): Promise<Property> {
    if (isSupabaseConfigured && supabase) {
      const updatePayload: Record<string, unknown> = {};
      if (input.title !== undefined) updatePayload.title = input.title.trim();
      if (input.property_type !== undefined) updatePayload.property_type = input.property_type;
      if (input.description !== undefined) updatePayload.description = input.description.trim();
      if (input.monthly_rent !== undefined) updatePayload.monthly_rent = input.monthly_rent;
      if (input.security_deposit !== undefined) updatePayload.security_deposit = input.security_deposit;
      if (input.available_rooms !== undefined) updatePayload.available_rooms = input.available_rooms;
      if (input.room_occupancy !== undefined) updatePayload.room_occupancy = input.room_occupancy;
      if (input.gender_preference !== undefined) updatePayload.gender_preference = input.gender_preference;
      if (input.furnishing_status !== undefined) updatePayload.furnishing_status = input.furnishing_status;
      if (input.available_from !== undefined) updatePayload.available_from = input.available_from;
      if (input.rules_restrictions !== undefined) updatePayload.rules_restrictions = input.rules_restrictions;
      if (input.nearby_landmark !== undefined) updatePayload.nearby_landmark = input.nearby_landmark;
      if (input.city !== undefined) updatePayload.city = input.city;
      if (input.locality !== undefined) updatePayload.locality = input.locality;
      if (input.full_address !== undefined) updatePayload.full_address = input.full_address;
      if (input.latitude !== undefined && input.longitude !== undefined) {
        const hasCoords = input.latitude !== null && input.longitude !== null;
        updatePayload.latitude = hasCoords ? input.latitude : null;
        updatePayload.longitude = hasCoords ? input.longitude : null;
        updatePayload.has_verified_coordinates = hasCoords;
      }
      if (input.contact_phone !== undefined) updatePayload.contact_phone = input.contact_phone || null;
      if (input.whatsapp_number !== undefined) updatePayload.whatsapp_number = input.whatsapp_number || null;
      if (input.share_phone !== undefined) updatePayload.share_phone = input.share_phone;
      if (input.share_whatsapp !== undefined) updatePayload.share_whatsapp = input.share_whatsapp;
      if (input.is_published !== undefined) updatePayload.is_published = input.is_published;

      if (Object.keys(updatePayload).length > 0) {
        const { error } = await supabase.from('properties').update(updatePayload).eq('id', id);
        if (error) throw new Error(error.message);
      }

      if (input.images !== undefined) {
        await supabase.from('property_images').delete().eq('property_id', id);
        if (input.images.length > 0) {
          await supabase.from('property_images').insert(
            input.images.map((img, idx) => ({
              property_id: id,
              image_url: img.image_url,
              storage_path: img.storage_path || null,
              is_cover: img.is_cover,
              sort_order: idx,
            }))
          );
        }
      }

      if (input.amenity_slugs !== undefined) {
        await supabase.from('property_amenities').delete().eq('property_id', id);
        if (input.amenity_slugs.length > 0) {
          const { data: amenityRows } = await supabase
            .from('amenities')
            .select('id, slug')
            .in('slug', input.amenity_slugs);
          if (amenityRows?.length) {
            await supabase.from('property_amenities').insert(
              amenityRows.map((a) => ({ property_id: id, amenity_id: a.id }))
            );
          }
        }
      }

      return this.getById(id);
    }

    const res = await previewFetch<{ property: Property }>(`/api/preview/properties/${id}`, {
      method: 'PUT',
      body: JSON.stringify(input),
    });
    return res.property;
  },

  async updateAvailability(id: string, availableRooms: number, availableFrom?: string): Promise<Property> {
    const cleanRooms = Math.max(0, Math.floor(availableRooms));
    if (isSupabaseConfigured && supabase) {
      const payload: Record<string, unknown> = { available_rooms: cleanRooms };
      if (availableFrom) payload.available_from = availableFrom;
      const { error } = await supabase.from('properties').update(payload).eq('id', id);
      if (error) throw new Error(error.message);
      return this.getById(id);
    }

    const res = await previewFetch<{ property: Property }>(`/api/preview/properties/${id}/availability`, {
      method: 'PATCH',
      body: JSON.stringify({
        available_rooms: cleanRooms,
        ...(availableFrom ? { available_from: availableFrom } : {}),
      }),
    });
    return res.property;
  },

  async remove(id: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('properties').delete().eq('id', id);
      if (error) throw new Error(error.message);
      return;
    }

    await previewFetch(`/api/preview/properties/${id}`, { method: 'DELETE' });
  },
};

export const storageService = {
  async uploadPropertyImage(file: File, userId: string): Promise<{ image_url: string; storage_path?: string }> {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Only JPG, PNG, and WEBP images are supported.');
    }
    if (file.size > 5 * 1024 * 1024) {
      throw new Error('Image file must be smaller than 5 MB.');
    }

    if (isSupabaseConfigured && supabase) {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const filePath = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage.from('property-images').upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });
      if (error) throw new Error(error.message);
      const { data: publicUrlData } = supabase.storage.from('property-images').getPublicUrl(filePath);
      return { image_url: publicUrlData.publicUrl, storage_path: filePath };
    }

    // Preview mode: read as compressed/scaled data URL for immediate preview & save
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error('Could not read image file.'));
      reader.readAsDataURL(file);
    });
    return { image_url: dataUrl };
  },
};

export const savedService = {
  async list(): Promise<SavedProperty[]> {
    if (isSupabaseConfigured && supabase) {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return [];
      const { data, error } = await supabase
        .from('saved_properties')
        .select(
          `
          id, student_id, property_id, created_at,
          properties(*, property_images(*), property_amenities(amenities(*)))
        `
        )
        .eq('student_id', userData.user.id)
        .order('created_at', { ascending: false });
      if (error) throw new Error(error.message);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (data || []).map((row: any) => ({
        id: row.id,
        student_id: row.student_id,
        property_id: row.property_id,
        created_at: row.created_at,
        property: row.properties ? mapSupabaseProperty(row.properties) : undefined,
      }));
    }

    const res = await previewFetch<{ saved?: SavedProperty[] }>('/api/preview/saved');
    return Array.isArray(res?.saved) ? res.saved : [];
  },

  async toggle(propertyId: string): Promise<boolean> {
    if (isSupabaseConfigured && supabase) {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Please log in to save properties.');
      const { data: existing } = await supabase
        .from('saved_properties')
        .select('id')
        .eq('student_id', userData.user.id)
        .eq('property_id', propertyId)
        .maybeSingle();

      if (existing) {
        await supabase.from('saved_properties').delete().eq('id', existing.id);
        return false;
      }
      const { error } = await supabase.from('saved_properties').insert({
        student_id: userData.user.id,
        property_id: propertyId,
      });
      if (error) throw new Error(error.message);
      return true;
    }

    const res = await previewFetch<{ saved: boolean }>(`/api/preview/saved/${propertyId}`, {
      method: 'POST',
    });
    return res.saved;
  },
};

export const enquiryService = {
  async listForCurrentUser(role: UserRole): Promise<Enquiry[]> {
    if (isSupabaseConfigured && supabase) {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return [];
      let query = supabase
        .from('enquiries')
        .select('*, properties(title, locality)')
        .order('created_at', { ascending: false });

      if (role === 'student') {
        query = query.eq('student_id', userData.user.id);
      } else if (role === 'owner') {
        query = query.eq('owner_id', userData.user.id);
      }

      const { data, error } = await query;
      if (error) throw new Error(error.message);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (data || []).map((row: any) => ({
        ...row,
        property_title: row.properties?.title || 'Property',
        property_locality: row.properties?.locality || 'Jabalpur',
      }));
    }

    const res = await previewFetch<{ enquiries?: Enquiry[] }>('/api/preview/enquiries');
    return Array.isArray(res?.enquiries) ? res.enquiries : [];
  },

  async create(payload: {
    property_id: string;
    owner_id: string | null;
    student_name: string;
    student_phone: string;
    message: string;
    preferred_move_in?: string | null;
  }): Promise<Enquiry> {
    if (isSupabaseConfigured && supabase) {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Please log in to submit an enquiry.');
      const { data, error } = await supabase
        .from('enquiries')
        .insert({
          property_id: payload.property_id,
          student_id: userData.user.id,
          owner_id: payload.owner_id,
          student_name: payload.student_name.trim(),
          student_phone: payload.student_phone.trim(),
          message: payload.message.trim(),
          preferred_move_in: payload.preferred_move_in || null,
        })
        .select('*')
        .single();
      if (error) {
        if (error.code === '23505') {
          throw new Error('You already have an active enquiry for this property.');
        }
        throw new Error(error.message);
      }
      return data as Enquiry;
    }

    const res = await previewFetch<{ enquiry: Enquiry }>('/api/preview/enquiries', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res.enquiry;
  },

  async updateStatus(id: string, status: EnquiryStatus): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('enquiries').update({ status }).eq('id', id);
      if (error) throw new Error(error.message);
      return;
    }
    await previewFetch(`/api/preview/enquiries/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },
};

export const reportService = {
  async create(payload: { property_id: string; reason: string; details?: string }): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Please log in to report a listing.');
      const { error } = await supabase.from('reports').insert({
        property_id: payload.property_id,
        reporter_id: userData.user.id,
        reason: payload.reason,
        details: payload.details || null,
      });
      if (error) throw new Error(error.message);
      return;
    }

    await previewFetch('/api/preview/reports', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};

export const adminService = {
  async getOverview(): Promise<{
    stats: AdminStats;
    users: Profile[];
    properties: Property[];
    enquiries: Enquiry[];
    reports: PropertyReport[];
    categories: Category[];
  }> {
    if (isSupabaseConfigured && supabase) {
      // RLS enforces that only verified admins can read all rows here
      const [usersRes, propsRes, enqRes, repRes, catRes] = await Promise.all([
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase
          .from('properties')
          .select('*, profiles:owner_id(full_name), property_images(*), property_amenities(amenities(*))')
          .order('created_at', { ascending: false }),
        supabase.from('enquiries').select('*, properties(title, locality)').order('created_at', { ascending: false }),
        supabase
          .from('reports')
          .select('*, properties(title), profiles:reporter_id(full_name)')
          .order('created_at', { ascending: false }),
        supabase.from('categories').select('*').order('sort_order', { ascending: true }),
      ]);

      if (usersRes.error) throw new Error(usersRes.error.message);
      const users = (usersRes.data || []) as Profile[];
      const properties = (propsRes.data || []).map(mapSupabaseProperty);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const enquiries = (enqRes.data || []).map((e: any) => ({
        ...e,
        property_title: e.properties?.title || 'Property',
        property_locality: e.properties?.locality || 'Jabalpur',
      })) as Enquiry[];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const reports = (repRes.data || []).map((r: any) => ({
        ...r,
        property_title: r.properties?.title || 'Property',
        reporter_name: r.profiles?.full_name || 'User',
      })) as PropertyReport[];
      const categories = (catRes.data || DEFAULT_CATEGORIES) as Category[];

      return {
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
        categories,
      };
    }

    return previewFetch('/api/preview/admin/overview');
  },

  async moderateProperty(id: string, status: ModerationStatus, rejectionReason?: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase
        .from('properties')
        .update({ moderation_status: status, rejection_reason: rejectionReason || null })
        .eq('id', id);
      if (error) throw new Error(error.message);
      return;
    }

    await previewFetch(`/api/preview/admin/properties/${id}/moderate`, {
      method: 'PATCH',
      body: JSON.stringify({ moderation_status: status, rejection_reason: rejectionReason }),
    });
  },

  async updateReport(id: string, status: ReportStatus, adminNotes?: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase
        .from('reports')
        .update({ status, admin_notes: adminNotes ?? null })
        .eq('id', id);
      if (error) throw new Error(error.message);
      return;
    }

    await previewFetch(`/api/preview/admin/reports/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status, admin_notes: adminNotes }),
    });
  },

  async createCategory(name: string, description: string): Promise<Category> {
    if (isSupabaseConfigured && supabase) {
      const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const { data, error } = await supabase
        .from('categories')
        .insert({ name: name.trim(), slug, description: description.trim() || null, is_active: true })
        .select('*')
        .single();
      if (error) throw new Error(error.message);
      return data as Category;
    }

    const res = await previewFetch<{ category: Category }>('/api/preview/admin/categories', {
      method: 'POST',
      body: JSON.stringify({ name, description }),
    });
    return res.category;
  },

  async toggleCategory(id: number, isActive: boolean): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('categories').update({ is_active: isActive }).eq('id', id);
      if (error) throw new Error(error.message);
      return;
    }

    await previewFetch(`/api/preview/admin/categories/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ is_active: isActive }),
    });
  },
};

export { DEFAULT_AMENITIES };

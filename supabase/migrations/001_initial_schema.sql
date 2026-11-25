-- THIKANO Initial Database Schema
-- Run this first in Supabase SQL Editor

create extension if not exists "pgcrypto";

-- 1. Helper trigger function for updated_at timestamps
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$;

-- 2. Profiles table (linked 1:1 with auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null check (char_length(trim(full_name)) >= 2),
  email text not null unique,
  phone text,
  whatsapp_number text,
  role text not null default 'student' check (role in ('student', 'owner', 'admin')),
  college text,
  preferred_location text,
  budget_preference integer check (budget_preference is null or budget_preference >= 0),
  avatar_url text,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create trigger trg_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create index if not exists idx_profiles_role on public.profiles(role);

-- Auto-create profile row when a new auth user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_role text;
begin
  requested_role := coalesce(new.raw_user_meta_data ->> 'role', 'student');
  if requested_role not in ('student', 'owner') then
    requested_role := 'student';
  end if;

  insert into public.profiles (id, full_name, email, role)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), split_part(new.email, '@', 1)),
    new.email,
    requested_role
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- 3. Categories table (admin manageable)
create table if not exists public.categories (
  id serial primary key,
  slug text not null unique,
  name text not null unique,
  description text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc'::text, now())
);

-- 4. Properties table
create table if not exists public.properties (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.profiles(id) on delete cascade,
  title text not null check (char_length(trim(title)) >= 5),
  property_type text not null check (property_type in ('Room', 'PG', 'Hostel', 'Flat', 'Shared')),
  description text not null check (char_length(trim(description)) >= 20),
  monthly_rent integer not null check (monthly_rent >= 500 and monthly_rent <= 200000),
  security_deposit integer not null default 0 check (security_deposit >= 0),
  available_rooms integer not null default 1 check (available_rooms >= 0),
  room_occupancy text not null default 'Single' check (room_occupancy in ('Single', 'Double Sharing', 'Triple Sharing', 'Dormitory', 'Full Flat')),
  gender_preference text not null default 'Any' check (gender_preference in ('Boys', 'Girls', 'Co-ed', 'Any')),
  furnishing_status text not null default 'Semi-Furnished' check (furnishing_status in ('Furnished', 'Semi-Furnished', 'Unfurnished')),
  available_from date not null default current_date,
  rules_restrictions text,
  nearby_landmark text,
  city text not null default 'Jabalpur',
  locality text not null,
  full_address text not null,
  latitude double precision check (latitude is null or (latitude >= -90 and latitude <= 90)),
  longitude double precision check (longitude is null or (longitude >= -180 and longitude <= 180)),
  has_verified_coordinates boolean not null default false,
  contact_phone text,
  whatsapp_number text,
  share_phone boolean not null default false,
  share_whatsapp boolean not null default false,
  is_published boolean not null default false,
  moderation_status text not null default 'pending' check (moderation_status in ('pending', 'approved', 'rejected')),
  rejection_reason text,
  is_demo boolean not null default false,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create trigger trg_properties_updated_at
before update on public.properties
for each row execute function public.set_updated_at();

create index if not exists idx_properties_owner on public.properties(owner_id);
create index if not exists idx_properties_city_locality on public.properties(city, locality);
create index if not exists idx_properties_type_rent on public.properties(property_type, monthly_rent);
create index if not exists idx_properties_public_status on public.properties(is_published, moderation_status);

-- 5. Property images table
create table if not exists public.property_images (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  image_url text not null,
  storage_path text,
  is_cover boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists idx_property_images_property on public.property_images(property_id);

-- 6. Amenities lookup table
create table if not exists public.amenities (
  id serial primary key,
  slug text not null unique,
  name text not null unique,
  icon_name text not null
);

-- 7. Property <-> Amenities join table
create table if not exists public.property_amenities (
  property_id uuid not null references public.properties(id) on delete cascade,
  amenity_id integer not null references public.amenities(id) on delete cascade,
  primary key (property_id, amenity_id)
);

-- 8. Enquiries table
create table if not exists public.enquiries (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  owner_id uuid references public.profiles(id) on delete cascade,
  student_name text not null,
  student_phone text not null,
  message text not null check (char_length(trim(message)) >= 10),
  preferred_move_in date,
  status text not null default 'pending' check (status in ('pending', 'contacted', 'resolved', 'archived')),
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create trigger trg_enquiries_updated_at
before update on public.enquiries
for each row execute function public.set_updated_at();

create index if not exists idx_enquiries_student on public.enquiries(student_id);
create index if not exists idx_enquiries_owner on public.enquiries(owner_id);
create index if not exists idx_enquiries_property on public.enquiries(property_id);

-- Prevent accidental duplicate active enquiries from same student to same property
create unique index if not exists idx_enquiries_unique_active
on public.enquiries(property_id, student_id)
where status in ('pending', 'contacted');

-- 9. Saved properties table
create table if not exists public.saved_properties (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  created_at timestamptz not null default timezone('utc'::text, now()),
  unique (student_id, property_id)
);

create index if not exists idx_saved_properties_student on public.saved_properties(student_id);

-- 10. Property reports table
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  reporter_id uuid references public.profiles(id) on delete set null,
  reason text not null,
  details text,
  status text not null default 'open' check (status in ('open', 'reviewed', 'resolved', 'dismissed')),
  admin_notes text,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create trigger trg_reports_updated_at
before update on public.reports
for each row execute function public.set_updated_at();

create index if not exists idx_reports_status on public.reports(status);

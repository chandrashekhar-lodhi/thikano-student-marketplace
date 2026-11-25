-- THIKANO Row Level Security (RLS) Policies
-- Run this second in Supabase SQL Editor

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.properties enable row level security;
alter table public.property_images enable row level security;
alter table public.amenities enable row level security;
alter table public.property_amenities enable row level security;
alter table public.enquiries enable row level security;
alter table public.saved_properties enable row level security;
alter table public.reports enable row level security;

-- Secure server-side admin check function
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

-- PROFILES POLICIES
create policy "Users can view their own profile"
on public.profiles for select
using (auth.uid() = id or public.is_admin());

create policy "Users can insert their own non-admin profile"
on public.profiles for insert
with check (
  auth.uid() = id
  and role in ('student', 'owner')
);

create policy "Users can update own profile without escalating to admin"
on public.profiles for update
using (auth.uid() = id or public.is_admin())
with check (
  public.is_admin()
  or (
    auth.uid() = id
    and role = (select role from public.profiles where id = auth.uid())
  )
);

-- CATEGORIES & AMENITIES POLICIES
create policy "Anyone can read categories"
on public.categories for select
using (true);

create policy "Only admins can manage categories"
on public.categories for all
using (public.is_admin())
with check (public.is_admin());

create policy "Anyone can read amenities"
on public.amenities for select
using (true);

create policy "Only admins can manage amenities"
on public.amenities for all
using (public.is_admin())
with check (public.is_admin());

-- PROPERTIES POLICIES
create policy "Public can view published and approved properties"
on public.properties for select
using (
  (is_published = true and moderation_status = 'approved')
  or owner_id = auth.uid()
  or public.is_admin()
);

create policy "Owners can create their own non-demo properties"
on public.properties for insert
with check (
  auth.uid() = owner_id
  and is_demo = false
  and exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('owner', 'admin')
  )
);

create policy "Owners can update own properties; admins can moderate all"
on public.properties for update
using (owner_id = auth.uid() or public.is_admin())
with check (
  public.is_admin()
  or (
    owner_id = auth.uid()
    and is_demo = false
    and moderation_status in ('pending', 'approved', 'rejected')
  )
);

create policy "Owners can delete own properties; admins can delete any"
on public.properties for delete
using (owner_id = auth.uid() or public.is_admin());

-- PROPERTY IMAGES POLICIES
create policy "Public can view images of visible properties"
on public.property_images for select
using (
  exists (
    select 1 from public.properties p
    where p.id = property_id
      and ((p.is_published = true and p.moderation_status = 'approved') or p.owner_id = auth.uid() or public.is_admin())
  )
);

create policy "Owners can manage images of their own properties"
on public.property_images for all
using (
  exists (
    select 1 from public.properties p
    where p.id = property_id and (p.owner_id = auth.uid() or public.is_admin())
  )
)
with check (
  exists (
    select 1 from public.properties p
    where p.id = property_id and (p.owner_id = auth.uid() or public.is_admin())
  )
);

-- PROPERTY AMENITIES POLICIES
create policy "Public can view amenities of visible properties"
on public.property_amenities for select
using (
  exists (
    select 1 from public.properties p
    where p.id = property_id
      and ((p.is_published = true and p.moderation_status = 'approved') or p.owner_id = auth.uid() or public.is_admin())
  )
);

create policy "Owners can manage amenities of their own properties"
on public.property_amenities for all
using (
  exists (
    select 1 from public.properties p
    where p.id = property_id and (p.owner_id = auth.uid() or public.is_admin())
  )
)
with check (
  exists (
    select 1 from public.properties p
    where p.id = property_id and (p.owner_id = auth.uid() or public.is_admin())
  )
);

-- ENQUIRIES POLICIES
create policy "Students can create enquiries for approved published properties"
on public.enquiries for insert
with check (
  auth.uid() = student_id
  and exists (
    select 1 from public.properties p
    where p.id = property_id
      and p.is_published = true
      and p.moderation_status = 'approved'
  )
);

create policy "Authorized users can view their enquiries"
on public.enquiries for select
using (
  student_id = auth.uid()
  or owner_id = auth.uid()
  or public.is_admin()
);

create policy "Owners can update status on enquiries for their properties"
on public.enquiries for update
using (owner_id = auth.uid() or public.is_admin())
with check (owner_id = auth.uid() or public.is_admin());

-- SAVED PROPERTIES POLICIES
create policy "Students can manage their own saved properties"
on public.saved_properties for all
using (student_id = auth.uid())
with check (student_id = auth.uid());

-- REPORTS POLICIES
create policy "Authenticated users can file reports"
on public.reports for insert
with check (auth.uid() = reporter_id);

create policy "Only admins can view and update reports"
on public.reports for select
using (public.is_admin() or reporter_id = auth.uid());

create policy "Only admins can update report status"
on public.reports for update
using (public.is_admin())
with check (public.is_admin());

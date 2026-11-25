-- THIKANO Reference Data & Optional DEMO Seed Data
-- Run this fourth in Supabase SQL Editor
-- To remove all DEMO properties before public launch, run:
--   DELETE FROM public.properties WHERE is_demo = true;

-- 1. Core Categories (Keep in production)
insert into public.categories (slug, name, description, is_active, sort_order) values
  ('rooms', 'Rooms', 'Private single or shared rooms near colleges and coaching hubs', true, 1),
  ('pg', 'PG', 'Paying Guest stays with home-style meals and utilities included', true, 2),
  ('hostels', 'Hostels', 'Structured student hostels with study lounges and security', true, 3),
  ('flats', 'Flats', 'Independent 1BHK and 2BHK student flats for small groups', true, 4),
  ('shared', 'Shared Accommodation', 'Budget-friendly shared beds and flatmate options', true, 5)
on conflict (slug) do nothing;

-- 2. Core Amenities (Keep in production)
insert into public.amenities (slug, name, icon_name) values
  ('wifi', 'Wi-Fi', 'Wifi'),
  ('electricity', 'Electricity', 'Zap'),
  ('water', 'Water', 'Droplets'),
  ('food', 'Food', 'Utensils'),
  ('ac', 'AC', 'Wind'),
  ('washing-machine', 'Washing machine', 'WashingMachine'),
  ('parking', 'Parking', 'Bike'),
  ('attached-bathroom', 'Attached bathroom', 'Bath'),
  ('study-table', 'Study table', 'BookOpen'),
  ('cctv', 'CCTV', 'Cctv'),
  ('security', 'Security', 'ShieldCheck')
on conflict (slug) do nothing;

-- 3. Optional DEMO Jabalpur Listings (Marked is_demo = true, no fabricated phone numbers)
-- Note: Replace or delete these once real property owners start publishing listings.
insert into public.properties (
  id, owner_id, title, property_type, description, monthly_rent, security_deposit,
  available_rooms, room_occupancy, gender_preference, furnishing_status, available_from,
  rules_restrictions, nearby_landmark, city, locality, full_address,
  latitude, longitude, has_verified_coordinates,
  share_phone, share_whatsapp, is_published, moderation_status, is_demo
) values
(
  '11111111-1111-4111-8111-111111111101',
  null,
  'DEMO: Sunlit Single Study Room — Vijay Nagar',
  'Room',
  'Sample demonstration listing showing how a furnished single student room appears on THIKANO. Includes dedicated study desk, natural ventilation, and transparent utility terms. No real owner phone is attached to this demo listing.',
  5500, 5500, 2, 'Single', 'Boys', 'Furnished', current_date,
  'Demo rules placeholder: Quiet study hours after 10:30 PM. Visitors allowed in common lobby.',
  'Near MR-4 Road, Vijay Nagar',
  'Jabalpur', 'Vijay Nagar', 'Sample Block A, Vijay Nagar, Jabalpur, MP (DEMO)',
  null, null, false,
  false, false, true, 'approved', true
),
(
  '11111111-1111-4111-8111-111111111102',
  null,
  'DEMO: Girls Twin-Sharing PG — Wright Town',
  'PG',
  'Sample demonstration PG listing illustrating meal-included student stays in Wright Town. Designed for students attending nearby coaching centres and colleges. Clearly marked as demo test data.',
  6800, 5000, 4, 'Double Sharing', 'Girls', 'Furnished', current_date,
  'Demo rules placeholder: Entry timing 9:30 PM; home-cooked tiffin included twice daily.',
  'Near Stadium Road, Wright Town',
  'Jabalpur', 'Wright Town', 'Sample Lane 3, Wright Town, Jabalpur, MP (DEMO)',
  null, null, false,
  false, false, true, 'approved', true
),
(
  '11111111-1111-4111-8111-111111111103',
  null,
  'DEMO: Scholar Hostel & Reading Lounge — Civil Lines',
  'Hostel',
  'Sample demonstration hostel listing featuring a dedicated study room, shared dining hall, and 24/7 security layout for college students in Jabalpur.',
  6200, 6000, 6, 'Double Sharing', 'Co-ed', 'Semi-Furnished', current_date,
  'Demo rules placeholder: Student ID required during onboarding.',
  'Near Pachpedi / Civil Lines',
  'Jabalpur', 'Civil Lines', 'Sample Campus Road, Civil Lines, Jabalpur, MP (DEMO)',
  null, null, false,
  false, false, true, 'approved', true
),
(
  '11111111-1111-4111-8111-111111111104',
  null,
  'DEMO: Independent 1BHK Student Flat — Napier Town',
  'Flat',
  'Sample demonstration 1BHK flat for two senior students seeking quiet independent living with kitchenette and balcony access.',
  9500, 10000, 1, 'Full Flat', 'Any', 'Furnished', current_date,
  'Demo rules placeholder: 11-month student lease agreement.',
  'Near Russell Chowk, Napier Town',
  'Jabalpur', 'Napier Town', 'Sample Residency, Napier Town, Jabalpur, MP (DEMO)',
  null, null, false,
  false, false, true, 'approved', true
),
(
  '11111111-1111-4111-8111-111111111105',
  null,
  'DEMO: Budget Shared Student Bed — Ranjhi (Near JEC)',
  'Shared',
  'Sample demonstration budget accommodation near JEC Jabalpur showing how ₹2,000/month shared stays are listed clearly on THIKANO.',
  2000, 2000, 4, 'Dormitory', 'Boys', 'Semi-Furnished', current_date,
  'Demo rules placeholder: Shared cupboard and drinking water included.',
  'Near JEC Campus, Ranjhi',
  'Jabalpur', 'Ranjhi', 'Sample Lane, Gokulpur, Ranjhi, Jabalpur, MP (DEMO)',
  null, null, false,
  false, false, true, 'approved', true
),
(
  '11111111-1111-4111-8111-111111111106',
  null,
  'DEMO: Affordable Student Room — Adhartal (Near JNKVV)',
  'Room',
  'Sample demonstration student room in Adhartal near JNKVV campus for budget-conscious students.',
  3200, 3000, 2, 'Double Sharing', 'Any', 'Unfurnished', current_date,
  'Demo rules placeholder: Water included; electricity on sub-meter.',
  'Near JNKVV Square, Adhartal',
  'Jabalpur', 'Adhartal', 'Sample Block, Adhartal, Jabalpur, MP (DEMO)',
  null, null, false,
  false, false, true, 'approved', true
)
on conflict (id) do nothing;

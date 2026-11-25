import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, MotionConfig, motion } from 'motion/react';
import {
  Search,
  MapPin,
  BedDouble,
  Building2,
  Users,
  Home as HomeIcon,
  Layers,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  GraduationCap,
} from 'lucide-react';
import { propertyService, categoryService } from '../services/api';
import type { Category, Property } from '../types';
import {
  BUDGET_OPTIONS,
  DEFAULT_CATEGORIES,
  JABALPUR_COLLEGES_LIST,
  JABALPUR_LOCALITIES,
  PROPERTY_TYPES,
} from '../utils/constants';
import { DEMO_TESTIMONIALS } from '../data/demoData';
import { PropertyCard } from '../components/PropertyCard';
import { ImageWithFallback } from '../components/ImageWithFallback';

const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  rooms: BedDouble,
  pg: HomeIcon,
  hostels: Building2,
  flats: Layers,
  shared: Users,
};

const HERO_SHOWCASE_SLIDES = [
  {
    id: 'rooms',
    tabLabel: 'Single Rooms',
    title: 'Sunlit Single Study Rooms',
    subtitle: 'Vijay Nagar, Civil Lines & Gokalpur · Starting ₹2,000/mo',
    image: '/src/assets/images/hero_jabalpur_student_room_1795064714452.jpg',
    alt: 'Sunlit student study room with wooden desk in Jabalpur',
    href: '/explore?type=Room',
  },
  {
    id: 'pg',
    tabLabel: 'PG Stays',
    title: 'Homely Boys & Girls PGs',
    subtitle: 'Wright Town, Garha & Napier Town · Meals & Wi-Fi options',
    image: '/src/assets/images/property_pg_shared_1795064714142.jpg',
    alt: 'Clean twin-sharing student PG room with study desks',
    href: '/explore?type=PG',
  },
  {
    id: 'hostels',
    tabLabel: 'Hostels',
    title: 'Student Hostels Near Campuses',
    subtitle: 'Reading lounges & security near RDVV, JEC & Medical College',
    image: '/src/assets/images/property_hostel_common_1795064714178.jpg',
    alt: 'Modern student hostel common study and dining lounge',
    href: '/explore?type=Hostel',
  },
  {
    id: 'flats',
    tabLabel: 'Student Flats',
    title: 'Independent 1BHK & Shared Flats',
    subtitle: 'Dumna Road, Bilhari & Karmeta · Flexible group living',
    image: '/src/assets/images/property_student_flat_1795064714302.jpg',
    alt: 'Furnished student apartment with living and study space',
    href: '/explore?type=Flat',
  },
];

const EASE_OUT_EXPO: [number, number, number, number] = [0.16, 1, 0.3, 1];

export function HomePage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [locality, setLocality] = useState('All');
  const [propertyType, setPropertyType] = useState('All');
  const [maxRent, setMaxRent] = useState('');
  const [availableOnly, setAvailableOnly] = useState(false);

  const [featured, setFeatured] = useState<Property[]>([]);
  const [featuredFilter, setFeaturedFilter] = useState<'all' | 'available'>('all');
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [loading, setLoading] = useState(true);

  const [activeSlideIdx, setActiveSlideIdx] = useState(0);
  const [showAllLocalities, setShowAllLocalities] = useState(false);
  const [highlightedCollege, setHighlightedCollege] = useState<string>('');

  useEffect(() => {
    let active = true;
    Promise.all([propertyService.search({ sortBy: 'newest' }), categoryService.listActive()])
      .then(([props, cats]) => {
        if (!active) return;
        setFeatured(props);
        if (cats.length > 0) setCategories(cats);
      })
      .catch(() => {
        // Keep clean empty state if backend temporarily unreachable
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  // Gentle hero gallery showcase rotation
  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveSlideIdx((prev) => (prev + 1) % HERO_SHOWCASE_SLIDES.length);
    }, 5500);
    return () => window.clearInterval(interval);
  }, []);

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set('q', searchQuery.trim());
    if (locality !== 'All') params.set('locality', locality);
    if (propertyType !== 'All') params.set('type', propertyType);
    if (maxRent) params.set('maxRent', maxRent);
    if (availableOnly) params.set('available', 'true');
    navigate(`/explore?${params.toString()}`);
  };

  const displayedFeatured = useMemo(() => {
    const base =
      featuredFilter === 'available'
        ? featured.filter((p) => p.available_rooms > 0)
        : featured;
    return base.slice(0, 6);
  }, [featured, featuredFilter]);

  const availableListingsCount = useMemo(
    () => featured.filter((p) => p.available_rooms > 0).length,
    [featured]
  );

  const selectedCollegeObj = useMemo(
    () => JABALPUR_COLLEGES_LIST.find((c) => c.name === highlightedCollege) || null,
    [highlightedCollege]
  );

  const displayedLocalities = useMemo(() => {
    if (selectedCollegeObj) {
      return JABALPUR_LOCALITIES.filter((loc) =>
        selectedCollegeObj.nearbyLocalities.includes(loc.name)
      );
    }
    return showAllLocalities ? JABALPUR_LOCALITIES : JABALPUR_LOCALITIES.slice(0, 10);
  }, [selectedCollegeObj, showAllLocalities]);

  const activeSlide = HERO_SHOWCASE_SLIDES[activeSlideIdx];

  return (
    <MotionConfig reducedMotion="user">
      <div>
        {/* 1. HERO SECTION */}
        <section className="bg-white border-b border-[#202820]/10 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, ease: EASE_OUT_EXPO }}
                className="lg:col-span-6 flex flex-col justify-center space-y-5"
              >
                <p className="text-sm font-semibold text-[#174C3A]">
                  Apni jagah, aasani se · Jabalpur, Madhya Pradesh
                </p>

                <h1 className="font-heading text-4xl sm:text-5xl font-bold text-[#202820] tracking-tight leading-[1.1] text-balance">
                  Naye shehar mein, apni jagah dhoondo.
                </h1>

                <p className="text-base sm:text-lg text-[#202820]/75 leading-relaxed max-w-xl">
                  Discover rooms, PGs and hostels across {JABALPUR_LOCALITIES.length} Jabalpur
                  localities near {JABALPUR_COLLEGES_LIST.length} colleges. Check live room
                  availability and connect directly with owners.
                </p>

                <div className="flex flex-wrap items-center gap-3.5 pt-1">
                  <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
                    <Link
                      to="/explore"
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#174C3A] text-white text-sm font-semibold hover:bg-[#11392B] transition-colors whitespace-nowrap"
                    >
                      Explore Properties
                      <ArrowRight className="w-4 h-4" aria-hidden="true" />
                    </Link>
                  </motion.div>

                  <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
                    <Link
                      to="/map"
                      className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-[#202820]/15 bg-[#F3F5EF] text-[#202820] text-sm font-semibold hover:border-[#174C3A] transition-colors whitespace-nowrap"
                    >
                      <MapPin className="w-4 h-4 text-[#174C3A]" aria-hidden="true" />
                      Open Google Map View
                    </Link>
                  </motion.div>
                </div>

                {/* Real, unboxed quick marketplace facts */}
                <div className="pt-3 border-t border-[#202820]/10 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs font-medium text-[#202820]/70 tabular-nums">
                  <span>{JABALPUR_COLLEGES_LIST.length} Jabalpur Campuses Mapped</span>
                  <span aria-hidden="true">·</span>
                  <span>{JABALPUR_LOCALITIES.length} College Localities</span>
                  <span aria-hidden="true">·</span>
                  <span>
                    {loading
                      ? 'Checking room availability…'
                      : `${availableListingsCount} Listings Open Now`}
                  </span>
                </div>
              </motion.div>

              {/* Right: Animated Stay Showcase */}
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.08, ease: EASE_OUT_EXPO }}
                className="lg:col-span-6 flex flex-col gap-3"
              >
                <div className="relative flex-1 min-h-[290px] sm:min-h-[370px] rounded-2xl overflow-hidden border border-[#202820]/10 bg-[#F3F5EF]">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeSlide.id}
                      initial={{ opacity: 0, scale: 1.03 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.45, ease: EASE_OUT_EXPO }}
                      className="absolute inset-0"
                    >
                      <ImageWithFallback
                        src={activeSlide.image}
                        alt={activeSlide.alt}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#202820]/85 via-[#202820]/25 to-transparent" />
                      <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-4 text-white">
                        <div>
                          <p className="font-heading text-lg sm:text-xl font-bold leading-snug">
                            {activeSlide.title}
                          </p>
                          <p className="text-xs sm:text-sm text-white/85 mt-0.5">
                            {activeSlide.subtitle}
                          </p>
                        </div>
                        <Link
                          to={activeSlide.href}
                          className="px-3.5 py-2 rounded-xl bg-[#E9A45B] text-[#202820] text-xs font-semibold hover:bg-[#df9749] transition-colors whitespace-nowrap shrink-0"
                        >
                          Browse
                        </Link>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Interactive Showcase Switcher */}
                <div className="grid grid-cols-4 gap-2">
                  {HERO_SHOWCASE_SLIDES.map((slide, idx) => {
                    const isActive = idx === activeSlideIdx;
                    return (
                      <button
                        key={slide.id}
                        type="button"
                        onClick={() => setActiveSlideIdx(idx)}
                        className={`px-2.5 py-2 rounded-xl text-xs font-semibold border transition-colors cursor-pointer truncate ${
                          isActive
                            ? 'bg-[#174C3A] text-white border-[#174C3A]'
                            : 'bg-[#F3F5EF] text-[#202820]/80 border-[#202820]/10 hover:border-[#174C3A]'
                        }`}
                      >
                        {slide.tabLabel}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            </div>

            {/* Search Strip below Hero Split (Zero-latency DOM availability) */}
            <motion.form
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.14, ease: EASE_OUT_EXPO }}
              onSubmit={handleHeroSearch}
              className="mt-9 p-4 sm:p-5 rounded-2xl bg-[#F3F5EF] border border-[#202820]/10 space-y-3"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-end">
                <div className="lg:col-span-4">
                  <label
                    htmlFor="hero-search-q"
                    className="block text-xs font-semibold text-[#202820]/75 mb-1.5"
                  >
                    Search area, college, or property
                  </label>
                  <div className="relative">
                    <Search
                      className="w-4 h-4 text-[#202820]/45 absolute left-3.5 top-1/2 -translate-y-1/2"
                      aria-hidden="true"
                    />
                    <input
                      id="hero-search-q"
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="e.g. Gokalpur, JEC, single room..."
                      className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-white border border-[#202820]/15 text-sm text-[#202820] placeholder:text-[#202820]/45"
                    />
                  </div>
                </div>

                <div className="lg:col-span-3">
                  <label
                    htmlFor="hero-locality"
                    className="block text-xs font-semibold text-[#202820]/75 mb-1.5"
                  >
                    Location ({JABALPUR_LOCALITIES.length} Jabalpur Areas)
                  </label>
                  <select
                    id="hero-locality"
                    value={locality}
                    onChange={(e) => setLocality(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-white border border-[#202820]/15 text-sm text-[#202820]"
                  >
                    <option value="All">All Jabalpur Areas</option>
                    {JABALPUR_LOCALITIES.map((loc) => (
                      <option key={loc.name} value={loc.name}>
                        {loc.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="lg:col-span-2">
                  <label
                    htmlFor="hero-type"
                    className="block text-xs font-semibold text-[#202820]/75 mb-1.5"
                  >
                    Property type
                  </label>
                  <select
                    id="hero-type"
                    value={propertyType}
                    onChange={(e) => setPropertyType(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-white border border-[#202820]/15 text-sm text-[#202820]"
                  >
                    <option value="All">All Types</option>
                    {PROPERTY_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="lg:col-span-2">
                  <label
                    htmlFor="hero-budget"
                    className="block text-xs font-semibold text-[#202820]/75 mb-1.5"
                  >
                    Max monthly rent
                  </label>
                  <select
                    id="hero-budget"
                    value={maxRent}
                    onChange={(e) => setMaxRent(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-white border border-[#202820]/15 text-sm text-[#202820]"
                  >
                    <option value="">Any Budget</option>
                    {BUDGET_OPTIONS.map((b) => (
                      <option key={b.value} value={b.value}>
                        {b.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="lg:col-span-1">
                  <button
                    type="submit"
                    className="w-full py-2.5 px-4 rounded-xl bg-[#174C3A] text-white text-sm font-semibold hover:bg-[#11392B] transition-colors cursor-pointer whitespace-nowrap"
                  >
                    Search
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <label className="inline-flex items-center gap-2 text-xs font-medium text-[#202820]/85 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={availableOnly}
                    onChange={(e) => setAvailableOnly(e.target.checked)}
                    className="w-4 h-4 rounded accent-[#174C3A]"
                  />
                  <span>Show only stays with rooms currently available</span>
                </label>
                <span className="text-xs text-[#202820]/60">
                  Budget options start from ₹2,000/month
                </span>
              </div>
            </motion.form>
          </div>
        </section>

        {/* 2. POPULAR CATEGORIES */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <h2 className="font-heading text-2xl sm:text-3xl font-bold text-[#202820]">
                Browse by Stay Category
              </h2>
              <p className="text-sm text-[#202820]/70 mt-1">
                Find the accommodation format that fits your study routine and monthly budget.
              </p>
            </div>
            <Link
              to="/explore"
              className="text-sm font-semibold text-[#174C3A] hover:underline whitespace-nowrap"
            >
              View all stays
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {categories.map((cat, idx) => {
              const Icon = CATEGORY_ICONS[cat.slug] || HomeIcon;
              const filterType =
                cat.slug === 'rooms'
                  ? 'Room'
                  : cat.slug === 'pg'
                  ? 'PG'
                  : cat.slug === 'hostels'
                  ? 'Hostel'
                  : cat.slug === 'flats'
                  ? 'Flat'
                  : 'Shared';
              return (
                <motion.div
                  key={cat.id}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.15 }}
                  transition={{ duration: 0.35, delay: idx * 0.05, ease: EASE_OUT_EXPO }}
                  whileHover={{ y: -4 }}
                >
                  <Link
                    to={`/explore?type=${encodeURIComponent(filterType)}`}
                    className="h-full bg-white p-5 rounded-2xl border border-[#202820]/10 hover:border-[#174C3A] transition-colors flex flex-col gap-3"
                  >
                    <div className="w-10 h-10 rounded-xl bg-[#F3F5EF] text-[#174C3A] flex items-center justify-center">
                      <Icon className="w-5 h-5" aria-hidden="true" />
                    </div>
                    <div>
                      <h3 className="font-heading text-base font-semibold text-[#202820]">
                        {cat.name}
                      </h3>
                      <p className="text-xs text-[#202820]/65 mt-1 leading-relaxed">
                        {cat.description}
                      </p>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* 3. FEATURED PROPERTIES WITH LIVE AVAILABILITY SWITCH */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
              <h2 className="font-heading text-2xl sm:text-3xl font-bold text-[#202820]">
                Featured Stays in Jabalpur
              </h2>
              <p className="text-sm text-[#202820]/70 mt-1">
                Every card displays live room availability alongside DEMO and verified owner listings.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Interactive availability filter tabs */}
              <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-white border border-[#202820]/10">
                <button
                  type="button"
                  onClick={() => setFeaturedFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                    featuredFilter === 'all'
                      ? 'bg-[#174C3A] text-white'
                      : 'text-[#202820]/75 hover:text-[#202820]'
                  }`}
                >
                  All Stays
                </button>
                <button
                  type="button"
                  onClick={() => setFeaturedFilter('available')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                    featuredFilter === 'available'
                      ? 'bg-[#174C3A] text-white'
                      : 'text-[#202820]/75 hover:text-[#202820]'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                  Rooms Available Now
                </button>
              </div>

              <Link
                to="/explore"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#174C3A] hover:underline whitespace-nowrap"
              >
                Explore all listings
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-[390px] rounded-2xl bg-white border border-[#202820]/10 animate-pulse"
                />
              ))}
            </div>
          ) : displayedFeatured.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#202820]/10 p-10 text-center">
              <p className="font-heading text-lg font-semibold text-[#202820]">
                {featuredFilter === 'available'
                  ? 'No rooms currently marked available in featured stays'
                  : 'No published listings yet'}
              </p>
              <p className="text-sm text-[#202820]/70 mt-1">
                {featuredFilter === 'available'
                  ? 'Switch to All Stays or browse all Jabalpur localities in Explore.'
                  : 'Property owners can list vacant rooms in minutes from the Owner Dashboard.'}
              </p>
              <Link
                to={featuredFilter === 'available' ? '/explore' : '/owner/dashboard'}
                className="inline-block mt-4 px-5 py-2.5 rounded-xl bg-[#174C3A] text-white text-sm font-semibold"
              >
                {featuredFilter === 'available' ? 'Explore All Listings' : 'List Your Property'}
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayedFeatured.map((prop, idx) => (
                <motion.div
                  key={prop.id}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.1 }}
                  transition={{ duration: 0.35, delay: (idx % 3) * 0.06, ease: EASE_OUT_EXPO }}
                >
                  <PropertyCard property={prop} />
                </motion.div>
              ))}
            </div>
          )}
        </section>

        {/* 4. ALL COLLEGE LOCALITIES & 26 JABALPUR CAMPUSES */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
              <h2 className="font-heading text-2xl sm:text-3xl font-bold text-[#202820]">
                Browse Localities Near Every Jabalpur College
              </h2>
              <p className="text-sm text-[#202820]/70 mt-1">
                Explore all {JABALPUR_LOCALITIES.length} student neighbourhoods covering every
                college, university, and coaching hub.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <select
                aria-label="Filter localities by college"
                value={highlightedCollege}
                onChange={(e) => setHighlightedCollege(e.target.value)}
                className="px-3.5 py-2 rounded-xl bg-white border border-[#202820]/15 text-xs sm:text-sm font-medium text-[#202820] max-w-xs"
              >
                <option value="">All Localities ({JABALPUR_LOCALITIES.length})</option>
                {JABALPUR_COLLEGES_LIST.map((col) => (
                  <option key={col.name} value={col.name}>
                    Near {col.shortName}
                  </option>
                ))}
              </select>

              {!selectedCollegeObj && (
                <button
                  type="button"
                  onClick={() => setShowAllLocalities((s) => !s)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-[#202820]/15 text-xs sm:text-sm font-semibold text-[#174C3A] hover:border-[#174C3A] transition-colors cursor-pointer whitespace-nowrap"
                >
                  {showAllLocalities ? (
                    <>
                      Show Top 10 Areas
                      <ChevronUp className="w-4 h-4" aria-hidden="true" />
                    </>
                  ) : (
                    <>
                      Show All {JABALPUR_LOCALITIES.length} Localities
                      <ChevronDown className="w-4 h-4" aria-hidden="true" />
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {displayedLocalities.map((area, idx) => (
              <motion.div
                key={area.name}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.1 }}
                transition={{ duration: 0.3, delay: (idx % 5) * 0.04, ease: EASE_OUT_EXPO }}
                whileHover={{ y: -3 }}
              >
                <Link
                  to={`/explore?locality=${encodeURIComponent(area.name)}`}
                  className="h-full bg-white p-5 rounded-2xl border border-[#202820]/10 hover:border-[#174C3A] transition-colors flex flex-col justify-between gap-3"
                >
                  <div>
                    <h3 className="font-heading text-base font-semibold text-[#202820]">
                      {area.name}
                    </h3>
                    <p className="text-xs text-[#174C3A] font-medium mt-0.5">{area.nearbyHubs}</p>
                    <p className="text-xs text-[#202820]/65 mt-2 leading-relaxed">{area.summary}</p>
                  </div>
                  <span className="text-xs font-semibold text-[#174C3A] inline-flex items-center gap-1">
                    Explore area <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                  </span>
                </Link>
              </motion.div>
            ))}
          </div>

          {/* All Jabalpur Colleges Quick Selector */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.4, ease: EASE_OUT_EXPO }}
            className="mt-8 bg-white rounded-2xl border border-[#202820]/10 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#F3F5EF] text-[#174C3A] flex items-center justify-center shrink-0">
                <GraduationCap className="w-5 h-5" aria-hidden="true" />
              </div>
              <div>
                <h3 className="font-heading text-lg font-semibold text-[#202820]">
                  Find Stays Near Any Jabalpur College ({JABALPUR_COLLEGES_LIST.length} Campuses)
                </h3>
                <p className="text-xs text-[#202820]/70 mt-1">
                  Select your university or college to jump straight to its exact Google Maps campus
                  location and surrounding student localities.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <select
                aria-label="Choose a Jabalpur college"
                defaultValue=""
                onChange={(e) => {
                  const chosen = JABALPUR_COLLEGES_LIST.find((c) => c.name === e.target.value);
                  if (chosen) {
                    navigate(
                      `/map?college=${encodeURIComponent(chosen.name)}&locality=${encodeURIComponent(
                        chosen.locality
                      )}`
                    );
                  }
                }}
                className="px-3.5 py-2.5 rounded-xl bg-[#F3F5EF] border border-[#202820]/15 text-sm font-medium text-[#202820] max-w-xs"
              >
                <option value="" disabled>
                  Choose your Jabalpur college…
                </option>
                {JABALPUR_COLLEGES_LIST.map((col) => (
                  <option key={col.name} value={col.name}>
                    {col.shortName} — {col.locality}
                  </option>
                ))}
              </select>
              <Link
                to="/map"
                className="px-4 py-2.5 rounded-xl bg-[#174C3A] text-white text-sm font-semibold hover:bg-[#11392B] transition-colors whitespace-nowrap"
              >
                View All on Map
              </Link>
            </div>
          </motion.div>
        </section>

        {/* 5. HOW THIKANO WORKS + BENEFITS */}
        <section className="bg-white border-y border-[#202820]/10 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
            <div>
              <h2 className="font-heading text-2xl sm:text-3xl font-bold text-[#202820] mb-8">
                How THIKANO Works
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                  {
                    step: '01. Search your preferred location',
                    title: 'Filter by college locality, budget, and availability',
                    copy: 'Narrow down Gokalpur, Vijay Nagar, Wright Town, Pachpedi, or Medical College Road by monthly rent starting ₹2,000 and live room availability.',
                  },
                  {
                    step: '02. Compare available properties',
                    title: 'Review rent, deposit, rules, and map pins',
                    copy: 'Check exact security deposit, room occupancy, house rules, photos, and Google Maps pins plus nearby mandirs, medical stores, and shops.',
                  },
                  {
                    step: '03. Contact property owners',
                    title: 'Send an enquiry or message directly',
                    copy: 'Send a structured move-in enquiry right from the listing page, or call/WhatsApp when the owner has opted to share their contact number.',
                  },
                ].map((item, idx) => (
                  <motion.div
                    key={item.step}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.2 }}
                    transition={{ duration: 0.35, delay: idx * 0.08, ease: EASE_OUT_EXPO }}
                    className="space-y-2 pt-4 border-t border-[#202820]/15"
                  >
                    <p className="font-heading text-sm font-semibold text-[#174C3A]">{item.step}</p>
                    <h3 className="font-heading text-lg font-semibold text-[#202820]">
                      {item.title}
                    </h3>
                    <p className="text-sm text-[#202820]/70 leading-relaxed">{item.copy}</p>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Benefits Split */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 pt-8 border-t border-[#202820]/10">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.4, ease: EASE_OUT_EXPO }}
                className="bg-[#F3F5EF] p-8 rounded-2xl border border-[#202820]/10 space-y-5"
              >
                <h3 className="font-heading text-xl font-bold text-[#202820]">
                  Built for Students Moving to Jabalpur
                </h3>
                <ul className="space-y-3 text-sm text-[#202820]/80">
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-[#174C3A] shrink-0 mt-0.5" aria-hidden="true" />
                    <span>
                      See immediately whether rooms are currently available or full before visiting.
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-[#174C3A] shrink-0 mt-0.5" aria-hidden="true" />
                    <span>Filter specifically for Boys, Girls, Co-ed, or Any accommodation.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-[#174C3A] shrink-0 mt-0.5" aria-hidden="true" />
                    <span>Shortlist rooms in your student dashboard and track enquiry replies.</span>
                  </li>
                </ul>
                <Link
                  to="/auth?mode=signup&role=student"
                  className="inline-block px-5 py-2.5 rounded-xl bg-[#174C3A] text-white text-sm font-semibold hover:bg-[#11392B] transition-colors"
                >
                  Create Student Account
                </Link>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.4, delay: 0.08, ease: EASE_OUT_EXPO }}
                className="bg-[#174C3A] text-white p-8 rounded-2xl space-y-5"
              >
                <h3 className="font-heading text-xl font-bold text-white">
                  Built for Property Owners & Hostel Managers
                </h3>
                <ul className="space-y-3 text-sm text-white/85">
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-[#E9A45B] shrink-0 mt-0.5" aria-hidden="true" />
                    <span>
                      Update room availability (Available / Full) in one click as rooms fill up.
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-[#E9A45B] shrink-0 mt-0.5" aria-hidden="true" />
                    <span>Drop an exact map pin using Google Maps so students find you easily.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-[#E9A45B] shrink-0 mt-0.5" aria-hidden="true" />
                    <span>
                      Control whether your phone or WhatsApp is displayed publicly or kept private via
                      enquiries.
                    </span>
                  </li>
                </ul>
                <Link
                  to="/auth?mode=signup&role=owner"
                  className="inline-block px-5 py-2.5 rounded-xl bg-[#E9A45B] text-[#202820] text-sm font-semibold hover:bg-[#df9749] transition-colors"
                >
                  Register as Property Owner
                </Link>
              </motion.div>
            </div>
          </div>
        </section>

        {/* 6. SAMPLE / DEMO TESTIMONIALS */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="mb-8">
            <p className="text-xs font-semibold text-[#174C3A]">
              Sample / Demo Feedback (Placeholder until live student & owner reviews arrive)
            </p>
            <h2 className="font-heading text-2xl sm:text-3xl font-bold text-[#202820] mt-1">
              Designed Around Real Student & Owner Needs
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {DEMO_TESTIMONIALS.map((t, idx) => (
              <motion.blockquote
                key={t.id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{ duration: 0.35, delay: idx * 0.06, ease: EASE_OUT_EXPO }}
                whileHover={{ y: -3 }}
                className="bg-white p-6 rounded-2xl border border-[#202820]/10 flex flex-col justify-between gap-4"
              >
                <p className="text-sm text-[#202820]/80 leading-relaxed">“{t.quote}”</p>
                <footer className="pt-4 border-t border-[#202820]/10">
                  <p className="font-heading text-sm font-semibold text-[#202820]">{t.name}</p>
                  <p className="text-xs text-[#202820]/60">
                    {t.role} · {t.college}
                  </p>
                </footer>
              </motion.blockquote>
            ))}
          </div>
        </section>
      </div>
    </MotionConfig>
  );
}

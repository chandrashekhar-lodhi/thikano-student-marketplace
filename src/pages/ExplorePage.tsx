import React, { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, Map as MapIcon, RotateCcw, CheckCircle2 } from 'lucide-react';
import { propertyService, DEFAULT_AMENITIES } from '../services/api';
import type { Property, PropertySearchFilters } from '../types';
import {
  BUDGET_OPTIONS,
  FURNISHING_STATUSES,
  GENDER_PREFERENCES,
  JABALPUR_COLLEGES_LIST,
  JABALPUR_LOCALITIES,
  PROPERTY_TYPES,
} from '../utils/constants';
import { PropertyCard } from '../components/PropertyCard';

const PAGE_SIZE = 9;

export function ExplorePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [showFiltersMobile, setShowFiltersMobile] = useState(false);
  const [selectedCollege, setSelectedCollege] = useState('All');

  const [filters, setFilters] = useState<PropertySearchFilters>({
    query: searchParams.get('q') || '',
    city: 'Jabalpur',
    locality: searchParams.get('locality') || 'All',
    propertyType: searchParams.get('type') || 'All',
    minRent: searchParams.get('minRent') ? Number(searchParams.get('minRent')) : null,
    maxRent: searchParams.get('maxRent') ? Number(searchParams.get('maxRent')) : null,
    genderPreference: searchParams.get('gender') || 'All',
    furnishingStatus: searchParams.get('furnishing') || 'All',
    amenities: searchParams.get('amenities') ? searchParams.get('amenities')!.split(',') : [],
    availableOnly: searchParams.get('available') === 'true',
    sortBy: (searchParams.get('sort') as PropertySearchFilters['sortBy']) || 'newest',
  });

  const fetchProperties = useCallback(async (activeFilters: PropertySearchFilters) => {
    setLoading(true);
    setError(null);
    try {
      const results = await propertyService.search(activeFilters);
      setProperties(results);
      setVisibleCount(PAGE_SIZE);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load properties.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProperties(filters);
  }, [filters, fetchProperties]);

  const updateFilter = <K extends keyof PropertySearchFilters>(
    key: K,
    value: PropertySearchFilters[K]
  ) => {
    setFilters((prev) => {
      const next = { ...prev, [key]: value };
      const params = new URLSearchParams();
      if (next.query) params.set('q', next.query);
      if (next.locality !== 'All') params.set('locality', next.locality);
      if (next.propertyType !== 'All') params.set('type', next.propertyType);
      if (next.minRent) params.set('minRent', String(next.minRent));
      if (next.maxRent) params.set('maxRent', String(next.maxRent));
      if (next.genderPreference !== 'All') params.set('gender', next.genderPreference);
      if (next.furnishingStatus !== 'All') params.set('furnishing', next.furnishingStatus);
      if (next.amenities.length > 0) params.set('amenities', next.amenities.join(','));
      if (next.availableOnly) params.set('available', 'true');
      if (next.sortBy !== 'newest') params.set('sort', next.sortBy);
      setSearchParams(params, { replace: true });
      return next;
    });
  };

  const handleCollegeSelect = (collegeName: string) => {
    setSelectedCollege(collegeName);
    if (collegeName === 'All') {
      updateFilter('locality', 'All');
      return;
    }
    const found = JABALPUR_COLLEGES_LIST.find((c) => c.name === collegeName);
    if (found) {
      updateFilter('locality', found.locality);
    }
  };

  const toggleAmenity = (slug: string) => {
    const exists = filters.amenities.includes(slug);
    const updated = exists
      ? filters.amenities.filter((s) => s !== slug)
      : [...filters.amenities, slug];
    updateFilter('amenities', updated);
  };

  const clearAllFilters = () => {
    const reset: PropertySearchFilters = {
      query: '',
      city: 'Jabalpur',
      locality: 'All',
      propertyType: 'All',
      minRent: null,
      maxRent: null,
      genderPreference: 'All',
      furnishingStatus: 'All',
      amenities: [],
      availableOnly: false,
      sortBy: 'newest',
    };
    setSelectedCollege('All');
    setFilters(reset);
    setSearchParams({}, { replace: true });
  };

  const visibleProperties = properties.slice(0, visibleCount);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header & Top Controls */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-[#202820]/10">
        <div>
          <h1 className="font-heading text-3xl font-bold text-[#202820]">
            Explore Student Accommodations in Jabalpur
          </h1>
          <p className="text-sm text-[#202820]/70 mt-1 tabular-nums">
            {loading
              ? 'Searching listings…'
              : `Showing ${visibleProperties.length} of ${properties.length} matching properties`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setShowFiltersMobile((s) => !s)}
            className="lg:hidden inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-[#202820]/15 text-sm font-medium cursor-pointer"
          >
            <SlidersHorizontal className="w-4 h-4 text-[#174C3A]" aria-hidden="true" />
            {showFiltersMobile ? 'Hide Filters' : 'Show Filters'}
          </button>

          <button
            type="button"
            onClick={() => updateFilter('availableOnly', !filters.availableOnly)}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap ${
              filters.availableOnly
                ? 'bg-[#174C3A] text-white border-[#174C3A]'
                : 'bg-white text-[#202820] border-[#202820]/15 hover:border-[#174C3A]'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
            Available Only
          </button>

          <select
            aria-label="Sort properties"
            value={filters.sortBy}
            onChange={(e) => updateFilter('sortBy', e.target.value as PropertySearchFilters['sortBy'])}
            className="px-3.5 py-2 rounded-xl bg-white border border-[#202820]/15 text-sm font-medium text-[#202820]"
          >
            <option value="newest">Sort: Newest Listings</option>
            <option value="rent_asc">Sort: Lowest Rent First</option>
            <option value="rent_desc">Sort: Highest Rent First</option>
          </select>

          <Link
            to="/map"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#174C3A] text-white text-sm font-semibold hover:bg-[#11392B] transition-colors whitespace-nowrap"
          >
            <MapIcon className="w-4 h-4" aria-hidden="true" />
            Map View
          </Link>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Sidebar Filter Panel */}
        <aside
          className={`lg:col-span-3 bg-white rounded-2xl border border-[#202820]/10 p-5 space-y-5 ${
            showFiltersMobile ? 'block' : 'hidden lg:block'
          }`}
        >
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-base font-semibold text-[#202820]">Filters</h2>
            <button
              type="button"
              onClick={clearAllFilters}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#174C3A] hover:underline cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
              Clear all
            </button>
          </div>

          <div>
            <label htmlFor="filter-q" className="block text-xs font-semibold text-[#202820]/75 mb-1.5">
              Keyword or property name
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-[#202820]/45 absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
              <input
                id="filter-q"
                type="text"
                value={filters.query}
                onChange={(e) => updateFilter('query', e.target.value)}
                placeholder="Search locality, landmark…"
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#F3F5EF] border border-[#202820]/10 text-sm"
              />
            </div>
          </div>

          <div>
            <label htmlFor="filter-college" className="block text-xs font-semibold text-[#202820]/75 mb-1.5">
              Near Jabalpur College
            </label>
            <select
              id="filter-college"
              value={selectedCollege}
              onChange={(e) => handleCollegeSelect(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#F3F5EF] border border-[#202820]/10 text-sm"
            >
              <option value="All">All Colleges ({JABALPUR_COLLEGES_LIST.length})</option>
              {JABALPUR_COLLEGES_LIST.map((col) => (
                <option key={col.name} value={col.name}>
                  {col.shortName} ({col.locality})
                </option>
              ))}
            </select>
            {selectedCollege !== 'All' && (() => {
              const colObj = JABALPUR_COLLEGES_LIST.find((c) => c.name === selectedCollege);
              if (!colObj) return null;
              return (
                <div className="mt-2 space-y-1.5">
                  <p className="text-[11px] font-medium text-[#202820]/65">
                    Nearby localities around {colObj.shortName}:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {colObj.nearbyLocalities.map((locName) => (
                      <button
                        key={locName}
                        type="button"
                        onClick={() => updateFilter('locality', locName)}
                        className={`px-2 py-1 rounded-lg text-[11px] font-semibold border transition-colors cursor-pointer ${
                          filters.locality === locName
                            ? 'bg-[#174C3A] text-white border-[#174C3A]'
                            : 'bg-[#F3F5EF] text-[#202820] border-[#202820]/10 hover:border-[#174C3A]'
                        }`}
                      >
                        {locName}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>

          <div>
            <label htmlFor="filter-locality" className="block text-xs font-semibold text-[#202820]/75 mb-1.5">
              Jabalpur Locality
            </label>
            <select
              id="filter-locality"
              value={filters.locality}
              onChange={(e) => {
                setSelectedCollege('All');
                updateFilter('locality', e.target.value);
              }}
              className="w-full px-3 py-2 rounded-xl bg-[#F3F5EF] border border-[#202820]/10 text-sm"
            >
              <option value="All">All Localities</option>
              {JABALPUR_LOCALITIES.map((loc) => (
                <option key={loc.name} value={loc.name}>
                  {loc.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="filter-type" className="block text-xs font-semibold text-[#202820]/75 mb-1.5">
              Property Type
            </label>
            <select
              id="filter-type"
              value={filters.propertyType}
              onChange={(e) => updateFilter('propertyType', e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#F3F5EF] border border-[#202820]/10 text-sm"
            >
              <option value="All">All Types</option>
              {PROPERTY_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="filter-budget-preset" className="block text-xs font-semibold text-[#202820]/75 mb-1.5">
              Budget (Starts from ₹2,000)
            </label>
            <select
              id="filter-budget-preset"
              value={filters.maxRent ?? ''}
              onChange={(e) =>
                updateFilter('maxRent', e.target.value ? Number(e.target.value) : null)
              }
              className="w-full px-3 py-2 rounded-xl bg-[#F3F5EF] border border-[#202820]/10 text-sm mb-2.5"
            >
              <option value="">Any Budget</option>
              {BUDGET_OPTIONS.map((b) => (
                <option key={b.value} value={b.value}>
                  {b.label}
                </option>
              ))}
            </select>
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label htmlFor="filter-min-rent" className="block text-[11px] font-medium text-[#202820]/65 mb-1">
                  Min (₹)
                </label>
                <input
                  id="filter-min-rent"
                  type="number"
                  min={0}
                  step={500}
                  value={filters.minRent ?? ''}
                  onChange={(e) =>
                    updateFilter('minRent', e.target.value ? Number(e.target.value) : null)
                  }
                  placeholder="2000"
                  className="w-full px-3 py-2 rounded-xl bg-[#F3F5EF] border border-[#202820]/10 text-sm tabular-nums"
                />
              </div>
              <div>
                <label htmlFor="filter-max-rent" className="block text-[11px] font-medium text-[#202820]/65 mb-1">
                  Max (₹)
                </label>
                <input
                  id="filter-max-rent"
                  type="number"
                  min={0}
                  step={500}
                  value={filters.maxRent ?? ''}
                  onChange={(e) =>
                    updateFilter('maxRent', e.target.value ? Number(e.target.value) : null)
                  }
                  placeholder="10000"
                  className="w-full px-3 py-2 rounded-xl bg-[#F3F5EF] border border-[#202820]/10 text-sm tabular-nums"
                />
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="filter-gender" className="block text-xs font-semibold text-[#202820]/75 mb-1.5">
              Gender Preference
            </label>
            <select
              id="filter-gender"
              value={filters.genderPreference}
              onChange={(e) => updateFilter('genderPreference', e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#F3F5EF] border border-[#202820]/10 text-sm"
            >
              <option value="All">Any Preference</option>
              {GENDER_PREFERENCES.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="filter-furnishing" className="block text-xs font-semibold text-[#202820]/75 mb-1.5">
              Furnishing
            </label>
            <select
              id="filter-furnishing"
              value={filters.furnishingStatus}
              onChange={(e) => updateFilter('furnishingStatus', e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#F3F5EF] border border-[#202820]/10 text-sm"
            >
              <option value="All">Any Furnishing</option>
              {FURNISHING_STATUSES.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>

          <label className="flex items-center gap-2.5 text-sm text-[#202820] cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={filters.availableOnly}
              onChange={(e) => updateFilter('availableOnly', e.target.checked)}
              className="w-4 h-4 rounded accent-[#174C3A]"
            />
            <span>Available rooms only</span>
          </label>

          <div className="pt-2 border-t border-[#202820]/10">
            <p className="text-xs font-semibold text-[#202820]/75 mb-2.5">Amenities</p>
            <div className="space-y-2">
              {DEFAULT_AMENITIES.map((amenity) => (
                <label
                  key={amenity.slug}
                  className="flex items-center gap-2.5 text-sm text-[#202820]/85 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={filters.amenities.includes(amenity.slug)}
                    onChange={() => toggleAmenity(amenity.slug)}
                    className="w-4 h-4 rounded accent-[#174C3A]"
                  />
                  <span>{amenity.name}</span>
                </label>
              ))}
            </div>
          </div>
        </aside>

        {/* Results Grid */}
        <div className="lg:col-span-9">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-sm text-[#991B1B]">
              {error}
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div
                  key={n}
                  className="h-[380px] rounded-2xl bg-white border border-[#202820]/10 animate-pulse"
                />
              ))}
            </div>
          ) : properties.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#202820]/10 p-12 text-center space-y-3">
              <h2 className="font-heading text-xl font-semibold text-[#202820]">
                No properties match your selected filters
              </h2>
              <p className="text-sm text-[#202820]/70 max-w-md mx-auto">
                Try increasing your rent budget, removing one or more amenities, or exploring nearby
                Jabalpur localities.
              </p>
              <button
                type="button"
                onClick={clearAllFilters}
                className="mt-2 px-5 py-2.5 rounded-xl bg-[#174C3A] text-white text-sm font-semibold hover:bg-[#11392B] cursor-pointer"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {visibleProperties.map((prop) => (
                  <PropertyCard key={prop.id} property={prop} />
                ))}
              </div>

              {visibleCount < properties.length && (
                <div className="mt-10 text-center">
                  <button
                    type="button"
                    onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
                    className="px-6 py-3 rounded-xl bg-white border border-[#202820]/15 text-sm font-semibold text-[#174C3A] hover:border-[#174C3A] transition-colors cursor-pointer"
                  >
                    Load More Properties ({properties.length - visibleCount} remaining)
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

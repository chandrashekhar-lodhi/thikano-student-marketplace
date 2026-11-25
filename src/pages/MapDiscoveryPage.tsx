import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useMapsLibrary } from '@vis.gl/react-google-maps';
import {
  Building2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Cross,
  ExternalLink,
  GraduationCap,
  Landmark,
  Loader2,
  MapPin,
  MapPinOff,
  Navigation,
  RefreshCw,
  Search,
  ShoppingBag,
  SlidersHorizontal,
  Star,
  Utensils,
  X,
  XCircle,
} from 'lucide-react';
import { propertyService } from '../services/api';
import type { Property } from '../types';
import {
  BUDGET_OPTIONS,
  JABALPUR_CENTER,
  JABALPUR_COLLEGES_LIST,
  JABALPUR_LOCALITIES,
  PROPERTY_TYPES,
  buildGoogleDirectionsUrl,
  formatINR,
  getRoomAvailabilityInfo,
} from '../utils/constants';
import {
  GoogleMapView,
  type GooglePlacePin,
  type PlaceCategoryKey,
} from '../components/GoogleMapView';
import { reportQuotaExceededIfApplicable, useMapsConfig } from '../components/MapsProvider';
import { ImageWithFallback } from '../components/ImageWithFallback';

interface CategoryChipConfig {
  key: PlaceCategoryKey;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  nearbyTypes?: string[];
  textQuery: string;
}

const PLACE_CATEGORY_CHIPS: CategoryChipConfig[] = [
  {
    key: 'hostels',
    label: 'Hostels & PGs',
    icon: Building2,
    textQuery: 'hostel PG student accommodation in Jabalpur',
  },
  {
    key: 'colleges',
    label: 'Colleges',
    icon: GraduationCap,
    textQuery: 'college university institute in Jabalpur',
  },
  {
    key: 'mandir',
    label: 'Mandir / Temples',
    icon: Landmark,
    nearbyTypes: ['hindu_temple', 'place_of_worship'],
    textQuery: 'mandir temple',
  },
  {
    key: 'medical',
    label: 'Medical Stores',
    icon: Cross,
    nearbyTypes: ['pharmacy', 'drugstore', 'hospital'],
    textQuery: 'medical store pharmacy',
  },
  {
    key: 'shops',
    label: 'Shops & Markets',
    icon: ShoppingBag,
    nearbyTypes: ['supermarket', 'grocery_store', 'convenience_store', 'shopping_mall'],
    textQuery: 'grocery shop market',
  },
  {
    key: 'food',
    label: 'Food & Tiffin',
    icon: Utensils,
    nearbyTypes: ['restaurant', 'cafe'],
    textQuery: 'restaurant tiffin mess',
  },
];

function mapSdkPlaceToPin(
  place: google.maps.places.Place,
  categoryKey: PlaceCategoryKey,
  fallbackLabel?: string
): GooglePlacePin | null {
  if (!place.location) return null;
  return {
    id: place.id,
    name: place.displayName || 'Unnamed Place',
    address: place.formattedAddress || 'Jabalpur, Madhya Pradesh',
    lat: place.location.lat(),
    lng: place.location.lng(),
    categoryKey,
    categoryLabel: place.primaryTypeDisplayName || fallbackLabel,
    rating: place.rating ?? null,
    userRatingCount: place.userRatingCount ?? null,
    googleMapsURI: place.googleMapsURI ?? null,
  };
}

/**
 * Mounted ONLY when Google Maps APIProvider is active (configured === true).
 */
function PlacesSearchBridge({
  onPlacesLibReady,
}: {
  onPlacesLibReady: (lib: google.maps.PlacesLibrary) => void;
}) {
  const placesLib = useMapsLibrary('places');

  useEffect(() => {
    if (placesLib) {
      onPlacesLibReady(placesLib);
    }
  }, [placesLib, onPlacesLibReady]);

  return null;
}

export function MapDiscoveryPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { configured } = useMapsConfig();

  const [placesLib, setPlacesLib] = useState<google.maps.PlacesLibrary | null>(null);

  // THIKANO listings state
  const [properties, setProperties] = useState<Property[]>([]);
  const [searchText, setSearchText] = useState(searchParams.get('q') || '');
  const [selectedCollege, setSelectedCollege] = useState(searchParams.get('college') || 'All');
  const [locality, setLocality] = useState(searchParams.get('locality') || 'All');
  const [propertyType, setPropertyType] = useState(searchParams.get('type') || 'All');
  const [maxRent, setMaxRent] = useState(searchParams.get('maxRent') || '');
  const [availableOnly, setAvailableOnly] = useState(searchParams.get('available') === 'true');
  const [loading, setLoading] = useState(true);

  // Google Places live state
  const [activeCategory, setActiveCategory] = useState<PlaceCategoryKey | null>(null);
  const [googlePlaces, setGooglePlaces] = useState<GooglePlacePin[]>([]);
  const [placesLoading, setPlacesLoading] = useState(false);
  const [placesNotice, setPlacesNotice] = useState<string | null>(null);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);

  // Autocomplete state
  const [suggestions, setSuggestions] = useState<google.maps.places.AutocompleteSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const sessionTokenRef = useRef<google.maps.places.AutocompleteSessionToken | null>(null);

  // UI & Camera state
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [drawerTab, setDrawerTab] = useState<'stays' | 'places'>('stays');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [focusPosition, setFocusPosition] = useState<{
    lat: number;
    lng: number;
    zoom?: number;
  } | null>(null);
  const [currentMapCenter, setCurrentMapCenter] = useState<{ lat: number; lng: number }>(
    JABALPUR_CENTER
  );
  const [mapMovedSinceSearch, setMapMovedSinceSearch] = useState(false);

  // Cache resolved Google Places lookups (colleges & localities) by key
  const placeCacheRef = useRef<Record<string, GooglePlacePin>>({});
  const initialCollegeHandledRef = useRef(false);

  // Fetch THIKANO properties
  useEffect(() => {
    setLoading(true);
    propertyService
      .search({
        query: searchText,
        locality,
        propertyType,
        maxRent: maxRent ? Number(maxRent) : null,
        availableOnly,
      })
      .then((list) => setProperties(Array.isArray(list) ? list : []))
      .catch(() => setProperties([]))
      .finally(() => setLoading(false));
  }, [searchText, locality, propertyType, maxRent, availableOnly]);

  // Google Places Autocomplete for top search bar
  useEffect(() => {
    if (!placesLib || !searchText.trim() || !showSuggestions) {
      setSuggestions([]);
      return;
    }

    const timer = window.setTimeout(async () => {
      try {
        if (!sessionTokenRef.current) {
          sessionTokenRef.current = new placesLib.AutocompleteSessionToken();
        }
        const res = await placesLib.AutocompleteSuggestion.fetchAutocompleteSuggestions({
          input: searchText,
          sessionToken: sessionTokenRef.current,
          region: 'IN',
          language: 'en',
          locationBias: { center: JABALPUR_CENTER, radius: 35000 },
        });
        setSuggestions(res.suggestions || []);
      } catch (err) {
        reportQuotaExceededIfApplicable(err);
        setSuggestions([]);
      }
    }, 320);

    return () => window.clearTimeout(timer);
  }, [placesLib, searchText, showSuggestions]);

  // Run Places API (New) category search around a center point
  const runCategorySearch = useCallback(
    async (categoryKey: PlaceCategoryKey, center: { lat: number; lng: number }) => {
      if (!placesLib) return;
      const chip = PLACE_CATEGORY_CHIPS.find((c) => c.key === categoryKey);
      if (!chip) return;

      setActiveCategory(categoryKey);
      setPlacesLoading(true);
      setPlacesNotice(null);
      setDrawerOpen(true);
      setDrawerTab('places');
      setMapMovedSinceSearch(false);

      const fields = [
        'id',
        'displayName',
        'formattedAddress',
        'location',
        'googleMapsURI',
        'rating',
        'userRatingCount',
        'primaryTypeDisplayName',
      ];

      try {
        let fetchedPlaces: google.maps.places.Place[] = [];

        if (chip.nearbyTypes && chip.nearbyTypes.length > 0) {
          const nearbyRes = await placesLib.Place.searchNearby({
            locationRestriction: { center, radius: 3500 },
            includedPrimaryTypes: chip.nearbyTypes,
            maxResultCount: 20,
            rankPreference: 'DISTANCE' as google.maps.places.SearchNearbyRankPreferenceString,
            language: 'en',
            region: 'IN',
            fields,
          });
          fetchedPlaces = nearbyRes.places || [];
        }

        // For Hostels/Colleges or sparse nearby pockets, use Text Search biased to center
        if (fetchedPlaces.length === 0) {
          const textRes = await placesLib.Place.searchByText({
            textQuery: chip.textQuery,
            locationBias: { center, radius: 5000 },
            maxResultCount: 20,
            language: 'en',
            region: 'IN',
            fields,
          });
          fetchedPlaces = textRes.places || [];
        }

        const pins = fetchedPlaces
          .map((pl) => mapSdkPlaceToPin(pl, categoryKey, chip.label))
          .filter((p): p is GooglePlacePin => p !== null);

        setGooglePlaces(pins);
        if (pins.length === 0) {
          setPlacesNotice(`No ${chip.label.toLowerCase()} returned in this radius. Try zooming out or panning.`);
        }
      } catch (err) {
        reportQuotaExceededIfApplicable(err);
        setPlacesNotice('Could not load Google Maps places right now.');
      } finally {
        setPlacesLoading(false);
      }
    },
    [placesLib]
  );

  // Resolve a single exact college campus location via Places API (New)
  const locateCollegeViaPlaces = useCallback(
    async (collegeName: string) => {
      if (!placesLib || collegeName === 'All') return;
      const col = JABALPUR_COLLEGES_LIST.find((c) => c.name === collegeName);
      if (!col) return;

      setLocality(col.locality);
      const cacheKey = `college:${col.name}`;
      const cached = placeCacheRef.current[cacheKey];

      if (cached) {
        setFocusPosition({ lat: cached.lat, lng: cached.lng, zoom: 15 });
        setSelectedPlaceId(cached.id);
        setGooglePlaces((prev) =>
          prev.some((p) => p.id === cached.id) ? prev : [cached, ...prev]
        );
        return;
      }

      setPlacesLoading(true);
      setPlacesNotice(null);
      try {
        const res = await placesLib.Place.searchByText({
          textQuery: col.searchQuery,
          locationBias: { center: JABALPUR_CENTER, radius: 40000 },
          maxResultCount: 1,
          language: 'en',
          region: 'IN',
          fields: [
            'id',
            'displayName',
            'formattedAddress',
            'location',
            'viewport',
            'googleMapsURI',
            'rating',
            'userRatingCount',
            'primaryTypeDisplayName',
          ],
        });

        const foundPlace = res.places?.[0];
        if (foundPlace) {
          const pin = mapSdkPlaceToPin(foundPlace, 'colleges', `${col.category} · ${col.locality}`);
          if (pin) {
            pin.name = col.shortName;
            placeCacheRef.current[cacheKey] = pin;
            setFocusPosition({ lat: pin.lat, lng: pin.lng, zoom: 15 });
            setCurrentMapCenter({ lat: pin.lat, lng: pin.lng });
            setSelectedPlaceId(pin.id);
            setGooglePlaces((prev) => [pin, ...prev.filter((p) => p.id !== pin.id)]);
            setDrawerOpen(true);
          }
        }
      } catch (err) {
        reportQuotaExceededIfApplicable(err);
      } finally {
        setPlacesLoading(false);
      }
    },
    [placesLib]
  );

  // Resolve locality center dynamically via Places API (New)
  const locateLocalityViaPlaces = useCallback(
    async (locName: string) => {
      if (!placesLib || locName === 'All') {
        setFocusPosition({ ...JABALPUR_CENTER, zoom: 13 });
        return;
      }
      const locObj = JABALPUR_LOCALITIES.find(
        (l) => l.name.toLowerCase() === locName.toLowerCase()
      );
      const query = locObj?.searchQuery || `${locName}, Jabalpur, Madhya Pradesh, India`;
      const cacheKey = `locality:${locName.toLowerCase()}`;
      const cached = placeCacheRef.current[cacheKey];

      if (cached) {
        setFocusPosition({ lat: cached.lat, lng: cached.lng, zoom: 15 });
        return;
      }

      try {
        const res = await placesLib.Place.searchByText({
          textQuery: query,
          locationBias: { center: JABALPUR_CENTER, radius: 35000 },
          maxResultCount: 1,
          language: 'en',
          region: 'IN',
          fields: ['id', 'displayName', 'formattedAddress', 'location'],
        });
        const first = res.places?.[0];
        if (first?.location) {
          const pin: GooglePlacePin = {
            id: first.id,
            name: locName,
            address: first.formattedAddress || query,
            lat: first.location.lat(),
            lng: first.location.lng(),
            categoryKey: 'search',
          };
          placeCacheRef.current[cacheKey] = pin;
          setFocusPosition({ lat: pin.lat, lng: pin.lng, zoom: 15 });
          setCurrentMapCenter({ lat: pin.lat, lng: pin.lng });
        }
      } catch (err) {
        reportQuotaExceededIfApplicable(err);
      }
    },
    [placesLib]
  );

  // Handle initial ?college= query param once placesLib is ready
  useEffect(() => {
    if (!placesLib || initialCollegeHandledRef.current) return;
    initialCollegeHandledRef.current = true;
    const paramCollege = searchParams.get('college');
    if (paramCollege && paramCollege !== 'All') {
      void locateCollegeViaPlaces(paramCollege);
    } else if (locality !== 'All') {
      void locateLocalityViaPlaces(locality);
    }
  }, [placesLib, searchParams, locality, locateCollegeViaPlaces, locateLocalityViaPlaces]);

  const handleSelectAutocomplete = async (
    suggestion: google.maps.places.AutocompleteSuggestion
  ) => {
    if (!suggestion.placePrediction) return;
    setShowSuggestions(false);
    try {
      const place = suggestion.placePrediction.toPlace();
      await place.fetchFields({
        fields: [
          'id',
          'displayName',
          'formattedAddress',
          'location',
          'googleMapsURI',
          'rating',
          'userRatingCount',
          'primaryTypeDisplayName',
        ],
      });
      const pin = mapSdkPlaceToPin(place, 'search', 'Searched Place');
      if (pin) {
        setSearchText(pin.name);
        setFocusPosition({ lat: pin.lat, lng: pin.lng, zoom: 16 });
        setCurrentMapCenter({ lat: pin.lat, lng: pin.lng });
        setSelectedPlaceId(pin.id);
        setGooglePlaces((prev) => [pin, ...prev.filter((p) => p.id !== pin.id)]);
        setDrawerOpen(true);
        setDrawerTab('places');
      }
      sessionTokenRef.current = null;
    } catch (err) {
      reportQuotaExceededIfApplicable(err);
    }
  };

  const handleManualTextSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setShowSuggestions(false);
    if (!placesLib || !searchText.trim()) return;

    setPlacesLoading(true);
    setPlacesNotice(null);
    try {
      const res = await placesLib.Place.searchByText({
        textQuery: `${searchText.trim()} in Jabalpur`,
        locationBias: { center: currentMapCenter, radius: 15000 },
        maxResultCount: 15,
        language: 'en',
        region: 'IN',
        fields: [
          'id',
          'displayName',
          'formattedAddress',
          'location',
          'googleMapsURI',
          'rating',
          'userRatingCount',
          'primaryTypeDisplayName',
        ],
      });
      const pins = (res.places || [])
        .map((pl) => mapSdkPlaceToPin(pl, 'search', 'Google Maps Result'))
        .filter((p): p is GooglePlacePin => p !== null);

      setGooglePlaces(pins);
      setActiveCategory(null);
      if (pins.length > 0) {
        setFocusPosition({ lat: pins[0].lat, lng: pins[0].lng, zoom: 15 });
        setSelectedPlaceId(pins[0].id);
        setDrawerOpen(true);
        setDrawerTab('places');
      } else {
        setPlacesNotice('No matching places found on Google Maps for that query.');
      }
    } catch (err) {
      reportQuotaExceededIfApplicable(err);
    } finally {
      setPlacesLoading(false);
    }
  };

  const handleCollegeChange = (collegeName: string) => {
    setSelectedCollege(collegeName);
    if (collegeName === 'All') {
      setFocusPosition({ ...JABALPUR_CENTER, zoom: 13 });
      return;
    }
    void locateCollegeViaPlaces(collegeName);
  };

  const handleLocalityChange = (locName: string) => {
    setLocality(locName);
    setSelectedCollege('All');
    void locateLocalityViaPlaces(locName);
  };

  const focusPropertyArea = (prop: Property) => {
    setSelectedPropertyId(prop.id);
    if (prop.has_verified_coordinates && prop.latitude !== null && prop.longitude !== null) {
      setFocusPosition({ lat: prop.latitude, lng: prop.longitude, zoom: 16 });
      setCurrentMapCenter({ lat: prop.latitude, lng: prop.longitude });
      return;
    }
    void locateLocalityViaPlaces(prop.locality);
  };

  const safeProperties = useMemo(
    () => (Array.isArray(properties) ? properties : []),
    [properties]
  );

  const pinnedProperties = useMemo(
    () =>
      safeProperties.filter(
        (p) => p.has_verified_coordinates && p.latitude !== null && p.longitude !== null
      ),
    [safeProperties]
  );

  return (
    <div className="relative w-full h-[calc(100vh-64px)] overflow-hidden bg-[#E8EDE2]">
      {configured && <PlacesSearchBridge onPlacesLibReady={setPlacesLib} />}

      {/* FULL-SCREEN INTERACTIVE GOOGLE MAP */}
      <GoogleMapView
        mode="discover"
        properties={pinnedProperties}
        googlePlaces={googlePlaces}
        selectedPlaceId={selectedPlaceId}
        selectedPropertyId={selectedPropertyId}
        focusPosition={focusPosition}
        onPropertySelect={(id) => navigate(`/property/${id}`)}
        onGooglePlaceSelect={(pl) => {
          setSelectedPlaceId(pl.id);
        }}
        onSearchNearbyFromPlace={(pl) => {
          setFocusPosition({ lat: pl.lat, lng: pl.lng, zoom: 15 });
          setCurrentMapCenter({ lat: pl.lat, lng: pl.lng });
          void runCategorySearch(activeCategory || 'hostels', { lat: pl.lat, lng: pl.lng });
        }}
        onCameraIdle={(center) => {
          setCurrentMapCenter(center);
          if (activeCategory) {
            setMapMovedSinceSearch(true);
          }
        }}
        heightClass="h-full"
        rounded={false}
      />

      {/* TOP FLOATING GOOGLE-MAPS-STYLE SEARCH, FILTERS & CATEGORY CHIPS */}
      <div className="absolute top-3 left-3 right-3 z-20 pointer-events-none flex flex-col gap-2">
        <form
          onSubmit={(e) => void handleManualTextSearch(e)}
          className="pointer-events-auto flex flex-wrap items-center gap-2 bg-white/95 backdrop-blur-md p-2 rounded-2xl border border-[#202820]/15 shadow-lg max-w-6xl"
        >
          {/* Google Maps Place Autocomplete Input */}
          <div className="relative flex-1 min-w-[200px]">
            <Search
              className="w-4 h-4 text-[#202820]/50 absolute left-3 top-1/2 -translate-y-1/2"
              aria-hidden="true"
            />
            <input
              type="text"
              aria-label="Search Google Maps places, mandirs, shops, medical stores, or stays"
              value={searchText}
              onFocus={() => setShowSuggestions(true)}
              onChange={(e) => {
                setSearchText(e.target.value);
                setShowSuggestions(true);
              }}
              placeholder="Search Google Maps: hostel, mandir, medical, shop, college…"
              className="w-full pl-9 pr-8 py-2 rounded-xl bg-[#F3F5EF] text-sm text-[#202820] placeholder:text-[#202820]/50"
            />
            {searchText && (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => {
                  setSearchText('');
                  setSuggestions([]);
                  setShowSuggestions(false);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#202820]/50 hover:text-[#202820] cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Autocomplete Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <ul className="absolute left-0 right-0 top-full mt-1.5 z-40 bg-white rounded-xl border border-[#202820]/15 shadow-xl max-h-64 overflow-y-auto divide-y divide-[#202820]/10">
                {suggestions.map((s, idx) => (
                  <li key={s.placePrediction?.placeId || idx}>
                    <button
                      type="button"
                      onClick={() => void handleSelectAutocomplete(s)}
                      className="w-full text-left px-3.5 py-2.5 text-xs text-[#202820] hover:bg-[#F3F5EF] flex items-center gap-2 cursor-pointer"
                    >
                      <MapPin className="w-3.5 h-3.5 text-[#174C3A] shrink-0" />
                      <span className="truncate">{s.placePrediction?.text.text}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <select
            aria-label="Jump to exact Jabalpur college location"
            value={selectedCollege}
            onChange={(e) => handleCollegeChange(e.target.value)}
            className="hidden sm:block px-3 py-2 rounded-xl bg-[#F3F5EF] text-sm font-medium text-[#202820] max-w-[230px] truncate"
          >
            <option value="All">All Jabalpur Colleges ({JABALPUR_COLLEGES_LIST.length})</option>
            {JABALPUR_COLLEGES_LIST.map((col) => (
              <option key={col.name} value={col.name}>
                {col.shortName} ({col.locality})
              </option>
            ))}
          </select>

          <select
            aria-label="Filter by Jabalpur locality"
            value={locality}
            onChange={(e) => handleLocalityChange(e.target.value)}
            className="hidden md:block px-3 py-2 rounded-xl bg-[#F3F5EF] text-sm font-medium text-[#202820]"
          >
            <option value="All">All Localities</option>
            {JABALPUR_LOCALITIES.map((loc) => (
              <option key={loc.name} value={loc.name}>
                {loc.name}
              </option>
            ))}
          </select>

          <select
            aria-label="Filter by budget"
            value={maxRent}
            onChange={(e) => setMaxRent(e.target.value)}
            className="hidden md:block px-3 py-2 rounded-xl bg-[#F3F5EF] text-sm font-medium text-[#202820]"
          >
            <option value="">Any Budget</option>
            {BUDGET_OPTIONS.map((b) => (
              <option key={b.value} value={b.value}>
                {b.label}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => setAvailableOnly((v) => !v)}
            className={`hidden md:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border cursor-pointer whitespace-nowrap transition-colors ${
              availableOnly
                ? 'bg-[#174C3A] text-white border-[#174C3A]'
                : 'bg-[#F3F5EF] text-[#202820] border-[#202820]/10 hover:border-[#174C3A]'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
            Available Only
          </button>

          <button
            type="button"
            onClick={() => setFiltersOpen((f) => !f)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#F3F5EF] text-xs font-semibold text-[#174C3A] border border-[#202820]/10 cursor-pointer whitespace-nowrap"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" aria-hidden="true" />
            Filters
          </button>
        </form>

        {/* Google-Maps-Style Category Chips (Hostels, Colleges, Mandir, Medical, Shops, Food) */}
        <div className="pointer-events-auto flex items-center gap-1.5 overflow-x-auto pb-1 max-w-6xl">
          {PLACE_CATEGORY_CHIPS.map((chip) => {
            const Icon = chip.icon;
            const active = activeCategory === chip.key;
            return (
              <button
                key={chip.key}
                type="button"
                disabled={!placesLib || placesLoading}
                onClick={() => void runCategorySearch(chip.key, currentMapCenter)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border shadow-sm transition-colors cursor-pointer whitespace-nowrap disabled:opacity-60 ${
                  active
                    ? 'bg-[#174C3A] text-white border-[#174C3A]'
                    : 'bg-white/95 text-[#202820] border-[#202820]/15 hover:bg-[#F3F5EF]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" aria-hidden="true" />
                {chip.label}
              </button>
            );
          })}

          {googlePlaces.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setGooglePlaces([]);
                setActiveCategory(null);
                setSelectedPlaceId(null);
                setPlacesNotice(null);
                setMapMovedSinceSearch(false);
                setDrawerTab('stays');
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white/95 text-[#B91C1C] border border-[#202820]/15 shadow-sm text-xs font-semibold hover:bg-[#FEF2F2] cursor-pointer whitespace-nowrap"
            >
              <X className="w-3.5 h-3.5" />
              Clear Places
            </button>
          )}

          {mapMovedSinceSearch && activeCategory && (
            <button
              type="button"
              onClick={() => void runCategorySearch(activeCategory, currentMapCenter)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#E9A45B] text-[#202820] border border-[#202820]/15 shadow-md text-xs font-bold cursor-pointer whitespace-nowrap"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Search This Area
            </button>
          )}
        </div>

        {/* Expandable Extra Filters */}
        {filtersOpen && (
          <div className="pointer-events-auto bg-white/95 backdrop-blur-md p-3.5 rounded-2xl border border-[#202820]/15 shadow-lg max-w-3xl grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <select
              aria-label="Mobile college filter"
              value={selectedCollege}
              onChange={(e) => handleCollegeChange(e.target.value)}
              className="sm:hidden px-3 py-2 rounded-xl bg-[#F3F5EF] text-sm"
            >
              <option value="All">All Colleges ({JABALPUR_COLLEGES_LIST.length})</option>
              {JABALPUR_COLLEGES_LIST.map((col) => (
                <option key={col.name} value={col.name}>
                  {col.shortName}
                </option>
              ))}
            </select>

            <select
              aria-label="Locality filter"
              value={locality}
              onChange={(e) => handleLocalityChange(e.target.value)}
              className="md:hidden px-3 py-2 rounded-xl bg-[#F3F5EF] text-sm"
            >
              <option value="All">All Localities</option>
              {JABALPUR_LOCALITIES.map((loc) => (
                <option key={loc.name} value={loc.name}>
                  {loc.name}
                </option>
              ))}
            </select>

            <select
              aria-label="Budget filter"
              value={maxRent}
              onChange={(e) => setMaxRent(e.target.value)}
              className="md:hidden px-3 py-2 rounded-xl bg-[#F3F5EF] text-sm"
            >
              <option value="">Any Budget</option>
              {BUDGET_OPTIONS.map((b) => (
                <option key={b.value} value={b.value}>
                  {b.label}
                </option>
              ))}
            </select>

            <select
              aria-label="Filter by stay type"
              value={propertyType}
              onChange={(e) => setPropertyType(e.target.value)}
              className="px-3 py-2 rounded-xl bg-[#F3F5EF] text-sm"
            >
              <option value="All">All Stay Types</option>
              {PROPERTY_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => setAvailableOnly((v) => !v)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold border cursor-pointer ${
                availableOnly
                  ? 'bg-[#174C3A] text-white border-[#174C3A]'
                  : 'bg-[#F3F5EF] text-[#202820] border-[#202820]/10'
              }`}
            >
              {availableOnly ? 'Showing Available Rooms Only' : 'Filter: Available Rooms Only'}
            </button>

            <button
              type="button"
              onClick={() => {
                setSearchText('');
                setSelectedCollege('All');
                setLocality('All');
                setPropertyType('All');
                setMaxRent('');
                setAvailableOnly(false);
                setGooglePlaces([]);
                setActiveCategory(null);
                setFocusPosition({ ...JABALPUR_CENTER, zoom: 13 });
              }}
              className="px-3 py-2 rounded-xl border border-[#202820]/15 text-xs font-semibold text-[#174C3A] hover:bg-[#F3F5EF] cursor-pointer"
            >
              Reset All Map Filters
            </button>
          </div>
        )}
      </div>

      {/* LEFT COLLAPSIBLE GOOGLE-MAPS-STYLE LISTINGS & PLACES DRAWER */}
      <aside
        className={`absolute top-[116px] bottom-4 left-3 z-10 flex items-start transition-transform duration-200 ${
          drawerOpen ? 'translate-x-0' : '-translate-x-[calc(100%-36px)]'
        }`}
      >
        <div className="w-[340px] sm:w-[385px] max-w-[calc(100vw-56px)] h-full bg-white/95 backdrop-blur-md rounded-2xl border border-[#202820]/15 shadow-xl flex flex-col overflow-hidden">
          {/* Drawer Tabs */}
          <div className="px-3 pt-3 pb-2 border-b border-[#202820]/10 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <h1 className="font-heading text-sm font-bold text-[#202820]">
                Jabalpur Map Explorer
              </h1>
              <Link
                to="/explore"
                className="text-xs font-semibold text-[#174C3A] hover:underline whitespace-nowrap"
              >
                Grid View
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-1.5 bg-[#F3F5EF] p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setDrawerTab('stays')}
                className={`py-1.5 px-2 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                  drawerTab === 'stays'
                    ? 'bg-white text-[#174C3A] shadow-sm'
                    : 'text-[#202820]/70 hover:text-[#202820]'
                }`}
              >
                THIKANO Stays ({safeProperties.length})
              </button>
              <button
                type="button"
                onClick={() => setDrawerTab('places')}
                className={`py-1.5 px-2 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                  drawerTab === 'places'
                    ? 'bg-white text-[#174C3A] shadow-sm'
                    : 'text-[#202820]/70 hover:text-[#202820]'
                }`}
              >
                Google Places ({googlePlaces.length})
              </button>
            </div>
          </div>

          {/* Drawer Content */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
            {drawerTab === 'stays' && selectedCollege !== 'All' && (() => {
              const colObj = JABALPUR_COLLEGES_LIST.find((c) => c.name === selectedCollege);
              if (!colObj) return null;
              return (
                <div className="p-2.5 rounded-xl bg-[#F3F5EF] border border-[#202820]/10 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[11px] font-semibold text-[#174C3A]">
                      Localities near {colObj.shortName}
                    </p>
                    {locality !== 'All' && (
                      <button
                        type="button"
                        onClick={() => setLocality('All')}
                        className="text-[11px] font-semibold text-[#202820]/70 hover:text-[#174C3A] cursor-pointer"
                      >
                        All areas
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {colObj.nearbyLocalities.map((locName) => (
                      <button
                        key={locName}
                        type="button"
                        onClick={() => void handleLocalityChange(locName)}
                        className={`px-2 py-1 rounded-lg text-[11px] font-semibold border transition-colors cursor-pointer ${
                          locality === locName
                            ? 'bg-[#174C3A] text-white border-[#174C3A]'
                            : 'bg-white text-[#202820] border-[#202820]/10 hover:border-[#174C3A]'
                        }`}
                      >
                        {locName}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })()}

            {drawerTab === 'stays' ? (
              loading ? (
                <div className="space-y-2.5">
                  {[1, 2, 3].map((n) => (
                    <div key={n} className="h-24 rounded-xl bg-[#F3F5EF] animate-pulse" />
                  ))}
                </div>
              ) : safeProperties.length === 0 ? (
                <div className="p-6 text-center text-sm text-[#202820]/70 space-y-2">
                  <p className="font-semibold text-[#202820]">No THIKANO stays match these filters.</p>
                  <p className="text-xs">
                    Try increasing budget (starts at ₹2,000) or selecting All Localities.
                  </p>
                </div>
              ) : (
                safeProperties.map((prop) => {
                  const thumb =
                    prop.images.find((i) => i.is_cover)?.image_url || prop.images[0]?.image_url;
                  const isPinned =
                    prop.has_verified_coordinates &&
                    prop.latitude !== null &&
                    prop.longitude !== null;
                  const availability = getRoomAvailabilityInfo(
                    prop.available_rooms,
                    prop.available_from
                  );

                  return (
                    <div
                      key={prop.id}
                      className={`p-3 rounded-xl bg-white border transition-colors flex gap-3 ${
                        selectedPropertyId === prop.id
                          ? 'border-[#174C3A] ring-1 ring-[#174C3A]'
                          : 'border-[#202820]/10 hover:border-[#174C3A]'
                      }`}
                    >
                      <Link
                        to={`/property/${prop.id}`}
                        className="w-20 h-20 rounded-lg overflow-hidden shrink-0 bg-[#F3F5EF]"
                      >
                        <ImageWithFallback
                          src={thumb}
                          alt={prop.title}
                          className="w-full h-full object-cover"
                        />
                      </Link>

                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div>
                          <p className="text-[11px] font-medium text-[#174C3A] flex items-center gap-1 truncate">
                            {isPinned ? (
                              <MapPin className="w-3 h-3 shrink-0" aria-hidden="true" />
                            ) : (
                              <MapPinOff
                                className="w-3 h-3 shrink-0 text-[#202820]/50"
                                aria-hidden="true"
                              />
                            )}
                            <span>
                              {prop.locality} · {isPinned ? 'Pinned' : 'Locality only'}
                              {prop.is_demo ? ' · DEMO' : ''}
                            </span>
                          </p>
                          <Link
                            to={`/property/${prop.id}`}
                            className="font-heading text-xs font-semibold text-[#202820] hover:text-[#174C3A] line-clamp-1 mt-0.5"
                          >
                            {prop.title}
                          </Link>
                          <p
                            className={`inline-flex items-center gap-1 text-[11px] font-semibold mt-0.5 ${
                              availability.isAvailable ? 'text-[#065F46]' : 'text-[#B91C1C]'
                            }`}
                          >
                            {availability.isAvailable ? (
                              <CheckCircle2 className="w-3 h-3 shrink-0" aria-hidden="true" />
                            ) : (
                              <XCircle className="w-3 h-3 shrink-0" aria-hidden="true" />
                            )}
                            {availability.badgeText}
                          </p>
                        </div>

                        <div className="flex items-center justify-between gap-2 mt-2">
                          <span className="font-heading text-xs font-bold text-[#174C3A] tabular-nums">
                            {formatINR(prop.monthly_rent)}/mo
                          </span>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => focusPropertyArea(prop)}
                              className="px-2 py-1 rounded-md bg-[#F3F5EF] text-[11px] font-semibold text-[#202820] hover:bg-[#E4EAE0] cursor-pointer"
                            >
                              Locate
                            </button>
                            <Link
                              to={`/property/${prop.id}`}
                              className="px-2 py-1 rounded-md bg-[#174C3A] text-[11px] font-semibold text-white hover:bg-[#11392B]"
                            >
                              Details
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )
            ) : placesLoading ? (
              <div className="p-8 text-center space-y-2 text-xs text-[#202820]/70">
                <Loader2 className="w-5 h-5 animate-spin text-[#174C3A] mx-auto" />
                <p>Fetching live places from Google Maps…</p>
              </div>
            ) : googlePlaces.length === 0 ? (
              <div className="p-5 text-center space-y-3 text-xs text-[#202820]/75">
                <p className="font-semibold text-[#202820]">
                  {placesNotice || 'Tap any category chip above to list real Google Maps places'}
                </p>
                <p className="leading-relaxed">
                  Explore Hostels & PGs, Jabalpur Colleges, Mandirs, Medical Stores, Shops, or Food
                  places directly on Google Maps—or tap any icon on the map itself.
                </p>
                <div className="flex flex-wrap justify-center gap-1.5 pt-1">
                  {PLACE_CATEGORY_CHIPS.slice(0, 4).map((c) => (
                    <button
                      key={c.key}
                      type="button"
                      disabled={!placesLib}
                      onClick={() => void runCategorySearch(c.key, currentMapCenter)}
                      className="px-2.5 py-1.5 rounded-lg bg-[#F3F5EF] text-[#174C3A] font-semibold hover:bg-[#E5ECE2] cursor-pointer"
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              googlePlaces.map((pl) => (
                <div
                  key={`${pl.categoryKey}-${pl.id}`}
                  className={`p-3 rounded-xl bg-white border transition-colors space-y-1.5 ${
                    selectedPlaceId === pl.id
                      ? 'border-[#174C3A] ring-1 ring-[#174C3A]'
                      : 'border-[#202820]/10 hover:border-[#174C3A]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold text-[#174C3A] truncate">
                        {pl.categoryLabel || 'Google Maps Place'}
                      </p>
                      <h2 className="font-heading text-xs font-bold text-[#202820] leading-snug">
                        {pl.name}
                      </h2>
                    </div>
                    {pl.rating && (
                      <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-[#202820] bg-[#F3F5EF] px-1.5 py-0.5 rounded shrink-0">
                        <Star className="w-3 h-3 text-[#E9A45B] fill-current" />
                        {pl.rating.toFixed(1)}
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-[#202820]/70 leading-snug line-clamp-2">
                    {pl.address}
                  </p>

                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPlaceId(pl.id);
                        setFocusPosition({ lat: pl.lat, lng: pl.lng, zoom: 16 });
                        setCurrentMapCenter({ lat: pl.lat, lng: pl.lng });
                      }}
                      className="px-2.5 py-1 rounded-md bg-[#F3F5EF] text-[11px] font-semibold text-[#202820] hover:bg-[#E4EAE0] cursor-pointer"
                    >
                      Focus Map
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFocusPosition({ lat: pl.lat, lng: pl.lng, zoom: 15 });
                        void runCategorySearch('hostels', { lat: pl.lat, lng: pl.lng });
                      }}
                      className="px-2.5 py-1 rounded-md bg-[#174C3A] text-[11px] font-semibold text-white hover:bg-[#11392B] cursor-pointer"
                    >
                      Nearby Hostels
                    </button>
                    <a
                      href={pl.googleMapsURI || buildGoogleDirectionsUrl(pl.lat, pl.lng)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-[#202820]/15 text-[11px] font-semibold text-[#174C3A] hover:bg-[#F3F5EF]"
                    >
                      <Navigation className="w-3 h-3" />
                      Maps
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Drawer Collapse Handle */}
        <button
          type="button"
          onClick={() => setDrawerOpen((o) => !o)}
          aria-label={drawerOpen ? 'Collapse listings drawer' : 'Open listings drawer'}
          className="ml-1.5 mt-4 p-2 rounded-xl bg-white border border-[#202820]/15 shadow-md text-[#202820] hover:bg-[#F3F5EF] cursor-pointer"
        >
          {drawerOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
      </aside>
    </div>
  );
}

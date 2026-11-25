import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Map as GoogleMap,
  AdvancedMarker,
  InfoWindow,
  Pin,
  useMap,
  useMapsLibrary,
  useAdvancedMarkerRef,
  type MapCameraChangedEvent,
  type MapMouseEvent,
} from '@vis.gl/react-google-maps';
import {
  ExternalLink,
  LocateFixed,
  MapPinOff,
  Navigation,
  RotateCcw,
  Search,
  Star,
} from 'lucide-react';
import type { Property } from '../types';
import {
  JABALPUR_CENTER,
  buildGoogleDirectionsUrl,
  formatINR,
  getRoomAvailabilityInfo,
} from '../utils/constants';
import { reportQuotaExceededIfApplicable, useMapsConfig } from './MapsProvider';

export type PlaceCategoryKey =
  | 'hostels'
  | 'colleges'
  | 'mandir'
  | 'medical'
  | 'shops'
  | 'food'
  | 'search';

export interface GooglePlacePin {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  categoryKey: PlaceCategoryKey;
  categoryLabel?: string;
  rating?: number | null;
  userRatingCount?: number | null;
  googleMapsURI?: string | null;
  isOpenNow?: boolean | null;
}

interface GoogleMapViewProps {
  mode: 'discover' | 'single' | 'picker';
  properties?: Property[];
  googlePlaces?: GooglePlacePin[];
  selectedPlaceId?: string | null;
  selectedPropertyId?: string | null;
  selectedPosition?: { lat: number; lng: number } | null;
  focusPosition?: { lat: number; lng: number; zoom?: number } | null;
  onSelectPosition?: (lat: number, lng: number) => void;
  onPropertySelect?: (propertyId: string) => void;
  onGooglePlaceSelect?: (place: GooglePlacePin) => void;
  onSearchNearbyFromPlace?: (place: GooglePlacePin) => void;
  onCameraIdle?: (center: { lat: number; lng: number }, zoom: number) => void;
  heightClass?: string;
  showLocateButton?: boolean;
  rounded?: boolean;
}

const CATEGORY_COLORS: Record<
  PlaceCategoryKey,
  { background: string; borderColor: string; glyphColor: string; label: string }
> = {
  hostels: {
    background: '#174C3A',
    borderColor: '#FFFFFF',
    glyphColor: '#E9A45B',
    label: 'Hostel / PG',
  },
  colleges: {
    background: '#202820',
    borderColor: '#E9A45B',
    glyphColor: '#E9A45B',
    label: 'College Campus',
  },
  mandir: {
    background: '#D97706',
    borderColor: '#FFFFFF',
    glyphColor: '#FFFFFF',
    label: 'Mandir / Temple',
  },
  medical: {
    background: '#DC2626',
    borderColor: '#FFFFFF',
    glyphColor: '#FFFFFF',
    label: 'Medical / Pharmacy',
  },
  shops: {
    background: '#2563EB',
    borderColor: '#FFFFFF',
    glyphColor: '#FFFFFF',
    label: 'Shop / Market',
  },
  food: {
    background: '#EA580C',
    borderColor: '#FFFFFF',
    glyphColor: '#FFFFFF',
    label: 'Food / Tiffin',
  },
  search: {
    background: '#7C3AED',
    borderColor: '#FFFFFF',
    glyphColor: '#FFFFFF',
    label: 'Google Maps Place',
  },
};

function PropertyMarkerItem({
  property,
  isSelected,
  onSelect,
}: {
  property: Property;
  isSelected: boolean;
  onSelect: (prop: Property, marker: google.maps.marker.AdvancedMarkerElement) => void;
}) {
  const [markerRef, marker] = useAdvancedMarkerRef();
  if (property.latitude === null || property.longitude === null) return null;
  const availability = getRoomAvailabilityInfo(property.available_rooms, property.available_from);

  return (
    <AdvancedMarker
      ref={markerRef}
      position={{ lat: property.latitude, lng: property.longitude }}
      zIndex={isSelected ? 1000 : availability.isAvailable ? 500 : 350}
      title={`${property.title} — ${availability.badgeText}`}
      onClick={() => {
        if (marker) onSelect(property, marker);
      }}
    >
      <div
        className={`px-2.5 py-1 rounded-full font-heading text-xs font-bold shadow-md border-2 transition-transform cursor-pointer whitespace-nowrap ${
          isSelected
            ? 'bg-[#E9A45B] text-[#202820] border-[#202820] scale-110'
            : availability.isAvailable
            ? 'bg-[#174C3A] text-white border-white hover:scale-105'
            : 'bg-[#4B5563] text-white border-white/90 hover:scale-105'
        }`}
      >
        {formatINR(property.monthly_rent)}
        {!availability.isAvailable ? ' · Full' : ''}
      </div>
    </AdvancedMarker>
  );
}

function GooglePlaceMarkerItem({
  place,
  isSelected,
  onSelect,
}: {
  place: GooglePlacePin;
  isSelected: boolean;
  onSelect: (place: GooglePlacePin, marker: google.maps.marker.AdvancedMarkerElement) => void;
}) {
  const [markerRef, marker] = useAdvancedMarkerRef();
  const palette = CATEGORY_COLORS[place.categoryKey] || CATEGORY_COLORS.search;

  return (
    <AdvancedMarker
      ref={markerRef}
      position={{ lat: place.lat, lng: place.lng }}
      zIndex={isSelected ? 950 : 300}
      title={place.name}
      onClick={() => {
        if (marker) onSelect(place, marker);
      }}
    >
      {place.categoryKey === 'colleges' ? (
        <div
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold shadow-md border cursor-pointer whitespace-nowrap ${
            isSelected
              ? 'bg-[#E9A45B] text-[#202820] border-[#202820]'
              : 'bg-[#202820] text-[#F3F5EF] border-[#E9A45B]'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-[#E9A45B] shrink-0" />
          <span className="max-w-[140px] truncate">{place.name}</span>
        </div>
      ) : (
        <Pin
          background={isSelected ? '#E9A45B' : palette.background}
          borderColor={isSelected ? '#202820' : palette.borderColor}
          glyphColor={isSelected ? '#202820' : palette.glyphColor}
          scale={isSelected ? 1.15 : 0.92}
        />
      )}
    </AdvancedMarker>
  );
}

function CameraController({
  focusPosition,
}: {
  focusPosition: { lat: number; lng: number; zoom?: number } | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (!map || !focusPosition) return;
    map.panTo({ lat: focusPosition.lat, lng: focusPosition.lng });
    if (focusPosition.zoom !== undefined) {
      map.setZoom(focusPosition.zoom);
    }
  }, [map, focusPosition]);

  return null;
}

function PickerAutocompleteBar({
  onSelectPosition,
}: {
  onSelectPosition: (lat: number, lng: number) => void;
}) {
  const map = useMap();
  const placesLib = useMapsLibrary('places');
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<google.maps.places.AutocompleteSuggestion[]>([]);
  const sessionTokenRef = useRef<google.maps.places.AutocompleteSessionToken | null>(null);

  useEffect(() => {
    if (!placesLib || !query.trim()) {
      setSuggestions([]);
      return;
    }

    const timer = window.setTimeout(async () => {
      try {
        if (!sessionTokenRef.current) {
          sessionTokenRef.current = new placesLib.AutocompleteSessionToken();
        }
        const res = await placesLib.AutocompleteSuggestion.fetchAutocompleteSuggestions({
          input: query,
          sessionToken: sessionTokenRef.current,
          region: 'IN',
          language: 'en',
          locationBias: { center: JABALPUR_CENTER, radius: 30000 },
        });
        setSuggestions(res.suggestions || []);
      } catch (err) {
        reportQuotaExceededIfApplicable(err);
        setSuggestions([]);
      }
    }, 300);

    return () => window.clearTimeout(timer);
  }, [placesLib, query]);

  const handleChooseSuggestion = async (suggestion: google.maps.places.AutocompleteSuggestion) => {
    if (!suggestion.placePrediction) return;
    try {
      const place = suggestion.placePrediction.toPlace();
      await place.fetchFields({ fields: ['location', 'viewport', 'formattedAddress'] });
      if (place.location) {
        const lat = Number(place.location.lat().toFixed(6));
        const lng = Number(place.location.lng().toFixed(6));
        onSelectPosition(lat, lng);
        if (map) {
          if (place.viewport) {
            map.fitBounds(place.viewport);
          } else {
            map.panTo({ lat, lng });
            map.setZoom(16);
          }
        }
      }
      setQuery(suggestion.placePrediction.text.text);
      setSuggestions([]);
      sessionTokenRef.current = null;
    } catch (err) {
      reportQuotaExceededIfApplicable(err);
    }
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search className="w-4 h-4 text-[#202820]/45 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search street, chowk, or landmark on Google Maps to jump & pin…"
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#F3F5EF] border border-[#202820]/15 text-sm text-[#202820]"
        />
      </div>
      {suggestions.length > 0 && (
        <ul className="absolute left-0 right-0 top-full mt-1 z-30 bg-white rounded-xl border border-[#202820]/15 shadow-lg max-h-56 overflow-y-auto divide-y divide-[#202820]/10">
          {suggestions.map((s, idx) => (
            <li key={s.placePrediction?.placeId || idx}>
              <button
                type="button"
                onClick={() => void handleChooseSuggestion(s)}
                className="w-full text-left px-3.5 py-2.5 text-xs text-[#202820] hover:bg-[#F3F5EF] cursor-pointer"
              >
                {s.placePrediction?.text.text}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function InteractiveGoogleMapInner({
  mode,
  properties = [],
  googlePlaces = [],
  selectedPlaceId = null,
  selectedPropertyId = null,
  selectedPosition = null,
  focusPosition = null,
  onSelectPosition,
  onPropertySelect,
  onGooglePlaceSelect,
  onSearchNearbyFromPlace,
  onCameraIdle,
  heightClass = 'h-[440px]',
  showLocateButton = true,
  rounded = true,
}: GoogleMapViewProps) {
  const map = useMap();
  const placesLib = useMapsLibrary('places');

  const [activeProperty, setActiveProperty] = useState<{
    property: Property;
    marker: google.maps.marker.AdvancedMarkerElement;
  } | null>(null);

  const [activeGooglePlace, setActiveGooglePlace] = useState<{
    place: GooglePlacePin;
    marker?: google.maps.marker.AdvancedMarkerElement | null;
  } | null>(null);

  const [userPosition, setUserPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [geoNotice, setGeoNotice] = useState<string | null>(null);

  const initialCenter = selectedPosition || JABALPUR_CENTER;
  const initialZoom = mode === 'single' && selectedPosition ? 15 : 13;

  const handleMapClick = useCallback(
    async (ev: MapMouseEvent) => {
      if (mode === 'picker' && onSelectPosition && ev.detail.latLng) {
        const lat = Number(ev.detail.latLng.lat.toFixed(6));
        const lng = Number(ev.detail.latLng.lng.toFixed(6));
        onSelectPosition(lat, lng);
        return;
      }

      // When user clicks any native Google Maps icon (mandir, medical store, shop, hostel, etc.)
      if (mode === 'discover' && ev.detail.placeId && placesLib) {
        ev.stop();
        try {
          const nativePlace = new placesLib.Place({ id: ev.detail.placeId });
          await nativePlace.fetchFields({
            fields: [
              'id',
              'displayName',
              'formattedAddress',
              'location',
              'rating',
              'userRatingCount',
              'googleMapsURI',
              'primaryTypeDisplayName',
            ],
          });
          if (nativePlace.location) {
            const pin: GooglePlacePin = {
              id: nativePlace.id || ev.detail.placeId,
              name: nativePlace.displayName || 'Google Maps Place',
              address: nativePlace.formattedAddress || 'Jabalpur, Madhya Pradesh',
              lat: nativePlace.location.lat(),
              lng: nativePlace.location.lng(),
              categoryKey: 'search',
              categoryLabel: nativePlace.primaryTypeDisplayName || 'Google Maps Place',
              rating: nativePlace.rating ?? null,
              userRatingCount: nativePlace.userRatingCount ?? null,
              googleMapsURI: nativePlace.googleMapsURI ?? null,
            };
            setActiveProperty(null);
            setActiveGooglePlace({ place: pin, marker: null });
          }
        } catch (err) {
          reportQuotaExceededIfApplicable(err);
        }
        return;
      }

      setActiveProperty(null);
      setActiveGooglePlace(null);
    },
    [mode, onSelectPosition, placesLib]
  );

  const handleCameraChanged = useCallback(
    (ev: MapCameraChangedEvent) => {
      if (onCameraIdle) {
        onCameraIdle(ev.detail.center, ev.detail.zoom);
      }
    },
    [onCameraIdle]
  );

  const handleLocateMe = () => {
    setGeoNotice(null);
    if (!navigator.geolocation) {
      setGeoNotice('Geolocation is not supported by your browser.');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        const coords = {
          lat: Number(pos.coords.latitude.toFixed(6)),
          lng: Number(pos.coords.longitude.toFixed(6)),
        };
        setUserPosition(coords);
        if (map) {
          map.panTo(coords);
          map.setZoom(15);
        }
        if (mode === 'picker' && onSelectPosition) {
          onSelectPosition(coords.lat, coords.lng);
        }
      },
      (err) => {
        setLocating(false);
        setGeoNotice(
          err.code === err.PERMISSION_DENIED
            ? 'Location permission was declined. You can still browse Jabalpur directly on the map.'
            : 'Unable to fetch current location right now.'
        );
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const resetToJabalpur = () => {
    if (!map) return;
    map.panTo(JABALPUR_CENTER);
    map.setZoom(13);
  };

  return (
    <div className="space-y-3 h-full flex flex-col">
      {mode === 'picker' && onSelectPosition && (
        <PickerAutocompleteBar onSelectPosition={onSelectPosition} />
      )}

      <div
        className={`relative ${heightClass} w-full ${
          rounded ? 'rounded-2xl border border-[#202820]/15' : ''
        } overflow-hidden bg-[#E8EDE2]`}
      >
        <GoogleMap
          mapId="DEMO_MAP_ID"
          internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
          defaultCenter={initialCenter}
          defaultZoom={initialZoom}
          gestureHandling="greedy"
          clickableIcons={true}
          mapTypeControl={true}
          streetViewControl={mode !== 'picker'}
          fullscreenControl={false}
          onClick={(ev) => void handleMapClick(ev)}
          onCameraChanged={handleCameraChanged}
          style={{ width: '100%', height: '100%' }}
        >
          <CameraController focusPosition={focusPosition} />

          {/* Single / Picker Pin */}
          {(mode === 'picker' || mode === 'single') && selectedPosition && (
            <AdvancedMarker position={selectedPosition} title="Property Location">
              <Pin
                background="#174C3A"
                borderColor="#FFFFFF"
                glyphColor="#E9A45B"
                scale={1.15}
              />
            </AdvancedMarker>
          )}

          {/* Discover: THIKANO Property Pins */}
          {mode === 'discover' &&
            properties.map((prop) => (
              <PropertyMarkerItem
                key={prop.id}
                property={prop}
                isSelected={
                  selectedPropertyId === prop.id || activeProperty?.property.id === prop.id
                }
                onSelect={(p, marker) => {
                  setActiveGooglePlace(null);
                  setActiveProperty({ property: p, marker });
                }}
              />
            ))}

          {/* Discover: Live Google Places Pins (Colleges, Hostels, Mandirs, Medical, Shops) */}
          {mode === 'discover' &&
            googlePlaces.map((place) => (
              <GooglePlaceMarkerItem
                key={`${place.categoryKey}-${place.id}`}
                place={place}
                isSelected={
                  selectedPlaceId === place.id || activeGooglePlace?.place.id === place.id
                }
                onSelect={(pl, marker) => {
                  setActiveProperty(null);
                  setActiveGooglePlace({ place: pl, marker });
                  onGooglePlaceSelect?.(pl);
                }}
              />
            ))}

          {/* User's Current Browser Location Dot */}
          {userPosition && (
            <AdvancedMarker position={userPosition} title="Your current location" zIndex={999}>
              <div className="w-4 h-4 rounded-full bg-[#2563EB] border-2 border-white shadow-md ring-4 ring-[#2563EB]/25" />
            </AdvancedMarker>
          )}

          {/* InfoWindow for THIKANO Property */}
          {activeProperty && (
            <InfoWindow
              anchor={activeProperty.marker}
              onCloseClick={() => setActiveProperty(null)}
            >
              <div className="min-w-[220px] max-w-[260px] p-1 space-y-1.5 font-sans">
                <p className="text-[11px] font-semibold text-[#174C3A]">
                  {activeProperty.property.property_type} · {activeProperty.property.locality}
                  {activeProperty.property.is_demo ? ' · DEMO' : ''}
                </p>
                <p className="font-heading text-xs font-bold text-[#202820] leading-snug">
                  {activeProperty.property.title}
                </p>
                <p className="text-xs font-bold text-[#174C3A]">
                  {formatINR(activeProperty.property.monthly_rent)} / month
                </p>
                {(() => {
                  const avail = getRoomAvailabilityInfo(
                    activeProperty.property.available_rooms,
                    activeProperty.property.available_from
                  );
                  return (
                    <p
                      className={`text-[11px] font-semibold ${
                        avail.isAvailable ? 'text-[#065F46]' : 'text-[#B91C1C]'
                      }`}
                    >
                      {avail.badgeText} · {avail.moveInNote}
                    </p>
                  );
                })()}
                <div className="flex items-center gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => onPropertySelect?.(activeProperty.property.id)}
                    className="flex-1 px-2.5 py-1.5 rounded-lg bg-[#174C3A] text-white text-xs font-semibold cursor-pointer"
                  >
                    View Details
                  </button>
                  {activeProperty.property.latitude !== null &&
                    activeProperty.property.longitude !== null && (
                      <a
                        href={buildGoogleDirectionsUrl(
                          activeProperty.property.latitude,
                          activeProperty.property.longitude
                        )}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1.5 rounded-lg bg-[#F3F5EF] text-[#202820] text-xs font-semibold"
                      >
                        Directions
                      </a>
                    )}
                </div>
              </div>
            </InfoWindow>
          )}

          {/* InfoWindow for Google Place (Campus, Hostel, Mandir, Medical, Shop, or Native Map POI) */}
          {activeGooglePlace && (
            <InfoWindow
              anchor={activeGooglePlace.marker || undefined}
              position={
                activeGooglePlace.marker
                  ? undefined
                  : { lat: activeGooglePlace.place.lat, lng: activeGooglePlace.place.lng }
              }
              onCloseClick={() => setActiveGooglePlace(null)}
            >
              <div className="min-w-[220px] max-w-[270px] p-1 space-y-1.5 font-sans">
                <p className="text-[11px] font-semibold text-[#174C3A]">
                  {activeGooglePlace.place.categoryLabel ||
                    CATEGORY_COLORS[activeGooglePlace.place.categoryKey]?.label}
                </p>
                <p className="font-heading text-xs font-bold text-[#202820] leading-snug">
                  {activeGooglePlace.place.name}
                </p>
                {activeGooglePlace.place.rating && (
                  <p className="inline-flex items-center gap-1 text-[11px] font-medium text-[#202820]/80">
                    <Star className="w-3 h-3 text-[#E9A45B] fill-current" />
                    <span>{activeGooglePlace.place.rating.toFixed(1)}</span>
                    {activeGooglePlace.place.userRatingCount ? (
                      <span className="text-[#202820]/55">
                        ({activeGooglePlace.place.userRatingCount})
                      </span>
                    ) : null}
                  </p>
                )}
                <p className="text-[11px] text-[#202820]/70 leading-snug">
                  {activeGooglePlace.place.address}
                </p>

                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  {onSearchNearbyFromPlace && (
                    <button
                      type="button"
                      onClick={() => onSearchNearbyFromPlace(activeGooglePlace.place)}
                      className="px-2.5 py-1.5 rounded-lg bg-[#174C3A] text-white text-[11px] font-semibold cursor-pointer"
                    >
                      Nearby Places
                    </button>
                  )}
                  <a
                    href={
                      activeGooglePlace.place.googleMapsURI ||
                      buildGoogleDirectionsUrl(
                        activeGooglePlace.place.lat,
                        activeGooglePlace.place.lng
                      )
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#F3F5EF] text-[#174C3A] text-[11px] font-semibold"
                  >
                    <Navigation className="w-3 h-3" />
                    Directions
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
              </div>
            </InfoWindow>
          )}
        </GoogleMap>

        {/* Bottom-left / Bottom-right Quick Controls */}
        <div className="absolute bottom-24 right-2.5 z-10 flex flex-col items-end gap-2">
          {showLocateButton && (
            <button
              type="button"
              onClick={handleLocateMe}
              disabled={locating}
              title="Use My Current Location"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white text-[#202820] border border-[#202820]/15 shadow-md text-xs font-semibold hover:bg-[#F3F5EF] transition-colors cursor-pointer disabled:opacity-60"
            >
              <LocateFixed className="w-3.5 h-3.5 text-[#174C3A]" aria-hidden="true" />
              {locating ? 'Locating…' : 'My Location'}
            </button>
          )}

          {mode === 'discover' && (
            <button
              type="button"
              onClick={resetToJabalpur}
              title="Reset to Jabalpur City View"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white text-[#174C3A] border border-[#202820]/15 shadow-md text-xs font-semibold hover:bg-[#F3F5EF] transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
              Jabalpur View
            </button>
          )}
        </div>

        {geoNotice && (
          <p className="absolute top-3 left-1/2 -translate-x-1/2 z-10 text-xs text-[#B45309] bg-[#FEF3C7] border border-[#F59E0B]/40 px-3 py-2 rounded-lg shadow-sm">
            {geoNotice}
          </p>
        )}
      </div>
    </div>
  );
}

export function GoogleMapView(props: GoogleMapViewProps) {
  const { configured, loading } = useMapsConfig();

  if (props.mode === 'single' && !props.selectedPosition) {
    return (
      <div
        className={`${props.heightClass || 'h-[320px]'} w-full rounded-2xl border border-[#202820]/10 bg-[#F3F5EF] flex flex-col items-center justify-center p-6 text-center`}
      >
        <MapPinOff className="w-8 h-8 text-[#174C3A]/70 mb-2" aria-hidden="true" />
        <p className="font-heading text-sm font-semibold text-[#202820]">
          Exact Map Coordinates Not Verified Yet
        </p>
        <p className="text-xs text-[#202820]/70 max-w-md mt-1 leading-relaxed">
          THIKANO never invents fake map pins. This listing displays its verified locality only until
          the property owner pins its exact entrance on Google Maps.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div
        className={`${props.heightClass || 'h-[440px]'} w-full ${
          props.rounded !== false ? 'rounded-2xl border border-[#202820]/15' : ''
        } bg-[#E8EDE2] animate-pulse flex items-center justify-center text-sm font-medium text-[#202820]/65`}
      >
        Loading Google Maps…
      </div>
    );
  }

  if (!configured) {
    return (
      <div
        className={`${props.heightClass || 'h-[440px]'} w-full ${
          props.rounded !== false ? 'rounded-2xl border border-[#202820]/15' : ''
        } bg-[#F3F5EF] flex flex-col items-center justify-center p-6 text-center space-y-2`}
      >
        <p className="font-heading text-base font-semibold text-[#202820]">
          Google Maps API Key Required
        </p>
        <p className="text-xs text-[#202820]/70 max-w-md leading-relaxed">
          Add <code className="font-mono bg-white px-1.5 py-0.5 rounded">VITE_GOOGLE_MAPS_API_KEY</code>{' '}
          to your <code className="font-mono bg-white px-1.5 py-0.5 rounded">.env</code> file (or
          enable Google Maps in AI Studio settings) to load interactive Google Maps & nearby places.
        </p>
      </div>
    );
  }

  return <InteractiveGoogleMapInner {...props} />;
}

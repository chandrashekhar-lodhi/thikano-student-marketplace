import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, MapPin, ArrowUpRight, CheckCircle2, XCircle } from 'lucide-react';
import type { Property } from '../types';
import { formatINR, getRoomAvailabilityInfo } from '../utils/constants';
import { ImageWithFallback } from './ImageWithFallback';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

interface PropertyCardProps {
  property: Property;
}

export function PropertyCard({ property }: PropertyCardProps) {
  const { user, savedIds, toggleSaved } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const coverImage =
    property.images?.find((img) => img.is_cover)?.image_url ||
    property.images?.[0]?.image_url ||
    null;

  const isSaved = savedIds.has(property.id);
  const availability = getRoomAvailabilityInfo(
    property.available_rooms,
    property.available_from,
    property.updated_at
  );

  const handleToggleSave = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      showToast('Please log in as a student to save properties.', 'info');
      navigate('/auth?mode=login');
      return;
    }
    try {
      const nowSaved = await toggleSaved(property.id);
      showToast(nowSaved ? 'Saved to your shortlist.' : 'Removed from saved list.', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not update saved state.', 'error');
    }
  };

  const facilitySummary = property.amenities
    .slice(0, 3)
    .map((a) => a.name)
    .join(' · ');

  return (
    <article className="group bg-white rounded-2xl border border-[#202820]/10 overflow-hidden flex flex-col transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div className="relative aspect-[4/3] bg-[#F3F5EF] overflow-hidden">
        <Link to={`/property/${property.id}`} className="block w-full h-full">
          <ImageWithFallback
            src={coverImage}
            alt={property.title}
            fallbackLabel={`${property.property_type} in ${property.locality}`}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        </Link>

        {/* Current Room Availability Status */}
        <span
          className={`absolute top-3 left-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold shadow-sm ${
            availability.isAvailable
              ? 'bg-[#174C3A]/95 text-white'
              : 'bg-[#B91C1C]/95 text-white'
          }`}
        >
          {availability.isAvailable ? (
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          ) : (
            <XCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          )}
          {availability.badgeText}
        </span>

        <button
          type="button"
          onClick={handleToggleSave}
          aria-label={isSaved ? 'Remove from saved properties' : 'Save property'}
          className={`absolute top-3 right-3 w-10 h-10 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
            isSaved
              ? 'bg-[#174C3A] text-white'
              : 'bg-white/95 text-[#202820] hover:bg-white'
          } shadow-sm`}
        >
          <Heart className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
        </button>

        {property.is_demo && (
          <span className="absolute bottom-3 left-3 px-2.5 py-1 rounded-md bg-[#202820]/85 text-[#E9A45B] text-[11px] font-semibold tracking-wide">
            DEMO LISTING
          </span>
        )}
      </div>

      <div className="p-5 flex-1 flex flex-col">
        {/* Clean unboxed metadata row */}
        <div className="flex items-center gap-1.5 text-xs font-medium text-[#202820]/65 mb-1.5">
          <span>{property.property_type}</span>
          <span aria-hidden="true">·</span>
          <span>{property.room_occupancy}</span>
          <span aria-hidden="true">·</span>
          <span>{property.gender_preference}</span>
        </div>

        <Link
          to={`/property/${property.id}`}
          className="font-heading text-base font-semibold text-[#202820] group-hover:text-[#174C3A] transition-colors line-clamp-2 mb-1.5"
        >
          {property.title}
        </Link>

        <p className="flex items-start gap-1.5 text-sm text-[#202820]/70 mb-3">
          <MapPin className="w-4 h-4 text-[#174C3A] shrink-0 mt-0.5" aria-hidden="true" />
          <span className="line-clamp-1">
            {property.locality}, {property.city}
            {property.nearby_landmark ? ` — ${property.nearby_landmark}` : ''}
          </span>
        </p>

        {facilitySummary && (
          <p className="text-xs text-[#202820]/60 mb-4 line-clamp-1">{facilitySummary}</p>
        )}

        <div className="mt-auto pt-4 border-t border-[#202820]/10 flex items-end justify-between gap-3">
          <div>
            <div className="flex items-baseline gap-1">
              <span className="font-heading text-lg font-bold text-[#174C3A] tabular-nums">
                {formatINR(property.monthly_rent)}
              </span>
              <span className="text-xs text-[#202820]/65">/ month</span>
            </div>
            <p className="text-xs text-[#202820]/65 tabular-nums mt-0.5">
              Deposit {formatINR(property.security_deposit)} ·{' '}
              <span
                className={
                  availability.isAvailable ? 'text-[#174C3A] font-medium' : 'text-[#B91C1C] font-medium'
                }
              >
                {availability.moveInNote}
              </span>
            </p>
          </div>

          <Link
            to={`/property/${property.id}`}
            className="inline-flex items-center gap-1 px-3.5 py-2 rounded-lg text-xs font-semibold bg-[#F3F5EF] text-[#174C3A] hover:bg-[#174C3A] hover:text-white transition-colors whitespace-nowrap shrink-0"
          >
            View Details
            <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </article>
  );
}

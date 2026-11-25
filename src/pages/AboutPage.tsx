import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, ShieldCheck, Users } from 'lucide-react';
import { JABALPUR_COLLEGES, JABALPUR_LOCALITIES } from '../utils/constants';

export function AboutPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      <div className="space-y-4">
        <p className="text-xs font-semibold text-[#174C3A]">About THIKANO</p>
        <h1 className="font-heading text-3xl sm:text-4xl font-bold text-[#202820]">
          Apni jagah, aasani se. Find Your Place. Feel at Home.
        </h1>
        <p className="text-base text-[#202820]/80 leading-relaxed max-w-3xl">
          THIKANO is a student accommodation marketplace launching in Jabalpur, Madhya Pradesh. Every
          academic season, thousands of students move to Jabalpur for engineering, medical, law,
          university, and competitive exam preparation—and spend days walking unfamiliar streets just
          to compare room rents and basic facilities.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-[#202820]/10 space-y-2">
          <MapPin className="w-6 h-6 text-[#174C3A]" aria-hidden="true" />
          <h2 className="font-heading text-lg font-semibold text-[#202820]">
            Real Locality & Map Clarity
          </h2>
          <p className="text-sm text-[#202820]/75 leading-relaxed">
            Built with Google Maps Platform so owners can pin exact entrances and students can
            discover nearby colleges, mandirs, medical stores, and shops without fake map markers.
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-[#202820]/10 space-y-2">
          <ShieldCheck className="w-6 h-6 text-[#174C3A]" aria-hidden="true" />
          <h2 className="font-heading text-lg font-semibold text-[#202820]">
            Transparent Terms & Privacy
          </h2>
          <p className="text-sm text-[#202820]/75 leading-relaxed">
            Rent, deposit, gender preference, rules, and amenities are shown clearly upfront. Contact
            numbers are shared only when owners explicitly opt in.
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-[#202820]/10 space-y-2">
          <Users className="w-6 h-6 text-[#174C3A]" aria-hidden="true" />
          <h2 className="font-heading text-lg font-semibold text-[#202820]">
            Scalable Across India
          </h2>
          <p className="text-sm text-[#202820]/75 leading-relaxed">
            Starting with complete coverage across Jabalpur’s student belts, our database schema and
            city filters are structured to expand smoothly to Indore, Bhopal, Pune, and beyond.
          </p>
        </div>
      </div>

      <div className="bg-white p-8 rounded-2xl border border-[#202820]/10 grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h2 className="font-heading text-lg font-semibold text-[#202820] mb-3">
            Jabalpur Localities We Cover
          </h2>
          <ul className="grid grid-cols-2 gap-2 text-sm text-[#202820]/80">
            {JABALPUR_LOCALITIES.map((loc) => (
              <li key={loc.name}>
                <Link
                  to={`/explore?locality=${encodeURIComponent(loc.name)}`}
                  className="hover:text-[#174C3A] hover:underline"
                >
                  {loc.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="font-heading text-lg font-semibold text-[#202820] mb-3">
            Major Jabalpur Campuses Nearby
          </h2>
          <ul className="space-y-1.5 text-sm text-[#202820]/80">
            {JABALPUR_COLLEGES.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

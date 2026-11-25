import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Flag,
  Heart,
  MapPin,
  MessageCircle,
  Navigation,
  Phone,
  Send,
  ShieldAlert,
  Users,
  XCircle,
} from 'lucide-react';
import { enquiryService, propertyService, reportService } from '../services/api';
import type { Property } from '../types';
import {
  buildGoogleDirectionsUrl,
  buildWhatsAppUrl,
  formatINR,
  getRoomAvailabilityInfo,
} from '../utils/constants';
import { ImageWithFallback } from '../components/ImageWithFallback';
import { GoogleMapView } from '../components/GoogleMapView';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export function PropertyDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, savedIds, toggleSaved } = useAuth();
  const { showToast } = useToast();

  const [property, setProperty] = useState<Property | null>(null);
  const [activeImage, setActiveImage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Enquiry form state
  const [studentName, setStudentName] = useState('');
  const [studentPhone, setStudentPhone] = useState('');
  const [moveInDate, setMoveInDate] = useState('');
  const [message, setMessage] = useState('');
  const [submittingEnquiry, setSubmittingEnquiry] = useState(false);
  const [enquirySent, setEnquirySent] = useState(false);

  // Report modal state
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState('Incorrect Rent or Details');
  const [reportDetails, setReportDetails] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    propertyService
      .getById(id)
      .then((prop) => {
        setProperty(prop);
        setActiveImage(0);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Unable to load listing.'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (user) {
      setStudentName(user.full_name || '');
      setStudentPhone(user.phone || '');
    }
  }, [user]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12 space-y-6">
        <div className="h-80 rounded-2xl bg-white border border-[#202820]/10 animate-pulse" />
        <div className="h-48 rounded-2xl bg-white border border-[#202820]/10 animate-pulse" />
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-4">
        <h1 className="font-heading text-2xl font-bold text-[#202820]">
          {error || 'Property not found'}
        </h1>
        <Link
          to="/explore"
          className="inline-block px-5 py-2.5 rounded-xl bg-[#174C3A] text-white text-sm font-semibold"
        >
          Back to Explore Rooms
        </Link>
      </div>
    );
  }

  const images =
    property.images.length > 0
      ? property.images
      : [{ id: 'fallback', property_id: property.id, image_url: '', is_cover: true, sort_order: 0 }];

  const isSaved = savedIds.has(property.id);
  const hasVerifiedMapPin =
    property.has_verified_coordinates && property.latitude !== null && property.longitude !== null;
  const availability = getRoomAvailabilityInfo(
    property.available_rooms,
    property.available_from,
    property.updated_at
  );

  const handleToggleSave = async () => {
    if (!user) {
      showToast('Please log in to save properties.', 'info');
      navigate(`/auth?mode=login&next=${encodeURIComponent(`/property/${property.id}`)}`);
      return;
    }
    try {
      const saved = await toggleSaved(property.id);
      showToast(saved ? 'Property saved to your dashboard.' : 'Removed from saved list.', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to save property.', 'error');
    }
  };

  const handleEnquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      showToast('Please log in first to send an enquiry.', 'info');
      navigate(`/auth?mode=login&next=${encodeURIComponent(`/property/${property.id}`)}`);
      return;
    }
    if (message.trim().length < 10) {
      showToast('Please write at least 10 characters in your enquiry message.', 'error');
      return;
    }
    if (studentPhone.trim().length < 8) {
      showToast('Please enter a valid contact phone number.', 'error');
      return;
    }

    setSubmittingEnquiry(true);
    try {
      await enquiryService.create({
        property_id: property.id,
        owner_id: property.owner_id,
        student_name: studentName.trim() || user.full_name,
        student_phone: studentPhone.trim(),
        message: message.trim(),
        preferred_move_in: moveInDate || null,
      });
      setEnquirySent(true);
      setMessage('');
      showToast('Your enquiry has been sent to the property owner.', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not submit enquiry.', 'error');
    } finally {
      setSubmittingEnquiry(false);
    }
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      showToast('Please log in to report a listing.', 'info');
      return;
    }
    setSubmittingReport(true);
    try {
      await reportService.create({
        property_id: property.id,
        reason: reportReason,
        details: reportDetails,
      });
      setReportOpen(false);
      setReportDetails('');
      showToast('Report submitted for admin review. Thank you.', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to submit report.', 'error');
    } finally {
      setSubmittingReport(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top breadcrumb + actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link
          to="/explore"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-[#202820]/75 hover:text-[#174C3A]"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          Back to Explore Rooms
        </Link>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleToggleSave}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold cursor-pointer transition-colors ${
              isSaved
                ? 'bg-[#174C3A] text-white border-[#174C3A]'
                : 'bg-white text-[#202820] border-[#202820]/15 hover:border-[#174C3A]'
            }`}
          >
            <Heart className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} aria-hidden="true" />
            {isSaved ? 'Saved' : 'Save Property'}
          </button>

          <button
            type="button"
            onClick={() => {
              if (!user) {
                showToast('Please log in to report a listing.', 'info');
                navigate('/auth?mode=login');
                return;
              }
              setReportOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-[#202820]/15 text-sm font-medium text-[#202820]/80 hover:text-[#B91C1C] cursor-pointer"
          >
            <Flag className="w-4 h-4" aria-hidden="true" />
            Report Listing
          </button>
        </div>
      </div>

      {property.is_demo && (
        <div className="p-4 rounded-xl bg-[#FEF3C7] border border-[#F59E0B]/40 text-sm text-[#92400E] flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <p className="font-semibold">DEMO Listing for Testing Only</p>
            <p className="text-xs mt-0.5">
              This is a sample Jabalpur listing to showcase THIKANO’s layout. Real owner phone numbers
              and exact building coordinates are intentionally omitted.
            </p>
          </div>
        </div>
      )}

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left 8 Columns: Gallery + Details + Map */}
        <div className="lg:col-span-8 space-y-8">
          {/* Gallery */}
          <div className="space-y-3">
            <div className="aspect-[16/10] rounded-2xl overflow-hidden bg-white border border-[#202820]/10">
              <ImageWithFallback
                src={images[activeImage]?.image_url}
                alt={`${property.title} — Photo ${activeImage + 1}`}
                className="w-full h-full object-cover"
              />
            </div>

            {images.length > 1 && (
              <div className="flex items-center gap-3 overflow-x-auto pb-1">
                {images.map((img, idx) => (
                  <button
                    key={img.id}
                    type="button"
                    onClick={() => setActiveImage(idx)}
                    className={`w-24 h-16 rounded-xl overflow-hidden border-2 shrink-0 cursor-pointer ${
                      idx === activeImage ? 'border-[#174C3A]' : 'border-transparent opacity-75 hover:opacity-100'
                    }`}
                  >
                    <ImageWithFallback
                      src={img.image_url}
                      alt={`Thumbnail ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Core Info */}
          <div className="bg-white rounded-2xl border border-[#202820]/10 p-6 sm:p-8 space-y-6">
            <div>
              <p className="text-xs font-semibold text-[#174C3A] mb-1.5">
                {property.property_type} · {property.room_occupancy} · {property.gender_preference} ·{' '}
                {property.furnishing_status}
              </p>
              <h1 className="font-heading text-2xl sm:text-3xl font-bold text-[#202820]">
                {property.title}
              </h1>
              <p className="flex items-start gap-2 text-sm text-[#202820]/75 mt-2">
                <MapPin className="w-4 h-4 text-[#174C3A] shrink-0 mt-0.5" aria-hidden="true" />
                <span>
                  {property.full_address}
                  {property.nearby_landmark ? ` (${property.nearby_landmark})` : ''}
                </span>
              </p>
            </div>

            {/* Current Room Availability Banner */}
            <div
              className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                availability.isAvailable
                  ? 'bg-[#ECFDF5] border-[#10B981]/35 text-[#065F46]'
                  : 'bg-[#FEF2F2] border-[#FECACA] text-[#991B1B]'
              }`}
            >
              <div className="flex items-start gap-2.5">
                {availability.isAvailable ? (
                  <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" />
                ) : (
                  <XCircle className="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" />
                )}
                <div>
                  <p className="font-heading text-sm font-bold">
                    {availability.isAvailable
                      ? `Room Available — ${availability.badgeText}`
                      : 'Room Not Available (Currently Full)'}
                  </p>
                  <p className="text-xs opacity-90 mt-0.5">
                    {availability.isAvailable
                      ? `${availability.moveInNote}. Send an enquiry or contact the owner to visit.`
                      : 'All rooms or beds are currently occupied. You can still message the owner about upcoming vacancies.'}
                  </p>
                </div>
              </div>
              {availability.updatedLabel && (
                <span className="text-[11px] font-medium opacity-80 whitespace-nowrap shrink-0">
                  Updated {availability.updatedLabel}
                </span>
              )}
            </div>

            {/* Key Stats Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-5 border-t border-[#202820]/10">
              <div>
                <p className="text-xs text-[#202820]/60">Monthly Rent</p>
                <p className="font-heading text-lg font-bold text-[#174C3A] tabular-nums mt-0.5">
                  {formatINR(property.monthly_rent)}
                </p>
              </div>
              <div>
                <p className="text-xs text-[#202820]/60">Security Deposit</p>
                <p className="font-heading text-lg font-bold text-[#202820] tabular-nums mt-0.5">
                  {formatINR(property.security_deposit)}
                </p>
              </div>
              <div>
                <p className="text-xs text-[#202820]/60">Room Availability</p>
                <p
                  className={`font-heading text-base font-semibold tabular-nums mt-0.5 flex items-center gap-1.5 ${
                    availability.isAvailable ? 'text-[#174C3A]' : 'text-[#B91C1C]'
                  }`}
                >
                  <Users className="w-4 h-4 shrink-0" aria-hidden="true" />
                  {availability.isAvailable ? `${availability.availableRooms} open` : 'Not Available'}
                </p>
              </div>
              <div>
                <p className="text-xs text-[#202820]/60">Available From</p>
                <p className="font-heading text-base font-semibold text-[#202820] tabular-nums mt-0.5 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-[#174C3A]" aria-hidden="true" />
                  {property.available_from}
                </p>
              </div>
            </div>

            {/* Description */}
            <div className="pt-5 border-t border-[#202820]/10 space-y-2">
              <h2 className="font-heading text-lg font-semibold text-[#202820]">About this stay</h2>
              <p className="text-sm text-[#202820]/80 leading-relaxed whitespace-pre-line">
                {property.description}
              </p>
            </div>

            {/* Amenities */}
            <div className="pt-5 border-t border-[#202820]/10 space-y-3">
              <h2 className="font-heading text-lg font-semibold text-[#202820]">
                Facilities & Amenities
              </h2>
              {property.amenities.length === 0 ? (
                <p className="text-sm text-[#202820]/60">No specific amenities listed by the owner.</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {property.amenities.map((amenity) => (
                    <div
                      key={amenity.slug}
                      className="px-3.5 py-2.5 rounded-xl bg-[#F3F5EF] text-sm font-medium text-[#202820]"
                    >
                      {amenity.name}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Rules */}
            {property.rules_restrictions && (
              <div className="pt-5 border-t border-[#202820]/10 space-y-2">
                <h2 className="font-heading text-lg font-semibold text-[#202820]">
                  House Rules & Restrictions
                </h2>
                <p className="text-sm text-[#202820]/80 leading-relaxed">
                  {property.rules_restrictions}
                </p>
              </div>
            )}
          </div>

          {/* Interactive Map Section */}
          <div className="bg-white rounded-2xl border border-[#202820]/10 p-6 sm:p-8 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-heading text-lg font-semibold text-[#202820]">
                  Location & Directions
                </h2>
                <p className="text-xs text-[#202820]/65 mt-0.5">
                  {property.locality}, {property.city}
                  {property.nearby_landmark ? ` · ${property.nearby_landmark}` : ''}
                </p>
              </div>

              {hasVerifiedMapPin && (
                <a
                  href={buildGoogleDirectionsUrl(property.latitude!, property.longitude!)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#F3F5EF] text-[#174C3A] text-xs font-semibold hover:bg-[#174C3A] hover:text-white transition-colors"
                >
                  <Navigation className="w-3.5 h-3.5" aria-hidden="true" />
                  Get Directions
                </a>
              )}
            </div>

            <GoogleMapView
              mode="single"
              selectedPosition={
                hasVerifiedMapPin
                  ? { lat: property.latitude!, lng: property.longitude! }
                  : null
              }
              heightClass="h-[320px]"
              showLocateButton={hasVerifiedMapPin}
            />
          </div>
        </div>

        {/* Right 4 Columns: Owner Contact & Enquiry Card */}
        <aside className="lg:col-span-4 space-y-5 lg:sticky lg:top-24">
          <div className="bg-white rounded-2xl border border-[#202820]/10 p-6 space-y-5">
            <div>
              <p className="text-xs text-[#202820]/60">Direct Owner Connect</p>
              <p className="font-heading text-2xl font-bold text-[#174C3A] tabular-nums mt-0.5">
                {formatINR(property.monthly_rent)}
                <span className="text-sm font-normal text-[#202820]/65"> / month</span>
              </p>
              {property.owner_name && (
                <p className="text-xs text-[#202820]/70 mt-1">Listed by {property.owner_name}</p>
              )}
              <div
                className={`mt-3 px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                  availability.isAvailable
                    ? 'bg-[#ECFDF5] text-[#065F46] border border-[#10B981]/30'
                    : 'bg-[#FEF2F2] text-[#991B1B] border border-[#FECACA]'
                }`}
              >
                {availability.isAvailable ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                ) : (
                  <XCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
                )}
                <span>
                  {availability.badgeText} · {availability.moveInNote}
                </span>
              </div>
            </div>

            {/* Direct Call / WhatsApp ONLY when owner provided and consented */}
            {(property.share_phone && property.contact_phone) ||
            (property.share_whatsapp && property.whatsapp_number) ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {property.share_phone && property.contact_phone && (
                  <a
                    href={`tel:${property.contact_phone}`}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-[#174C3A] text-[#174C3A] text-sm font-semibold hover:bg-[#F3F5EF] transition-colors"
                  >
                    <Phone className="w-4 h-4" aria-hidden="true" />
                    Call Owner
                  </a>
                )}
                {property.share_whatsapp && property.whatsapp_number && (
                  <a
                    href={buildWhatsAppUrl(property.whatsapp_number, property.title)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#174C3A] text-white text-sm font-semibold hover:bg-[#11392B] transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" aria-hidden="true" />
                    WhatsApp
                  </a>
                )}
              </div>
            ) : (
              <p className="text-xs text-[#202820]/70 bg-[#F3F5EF] p-3 rounded-xl leading-relaxed">
                {property.is_demo
                  ? 'Phone and WhatsApp links are disabled on DEMO listings. Real owners control whether to share phone/WhatsApp directly.'
                  : 'This owner prefers receiving enquiries through THIKANO before sharing phone details.'}
              </p>
            )}

            {/* Enquiry Form */}
            <form onSubmit={handleEnquirySubmit} className="space-y-3.5 pt-4 border-t border-[#202820]/10">
              <h2 className="font-heading text-base font-semibold text-[#202820]">
                Send Enquiry to Owner
              </h2>

              {enquirySent && (
                <div className="p-3 rounded-xl bg-[#ECFDF5] border border-[#10B981]/30 text-xs text-[#065F46]">
                  Enquiry submitted! Track owner responses inside your Student Dashboard.
                </div>
              )}

              <div>
                <label htmlFor="enq-name" className="block text-xs font-semibold text-[#202820]/75 mb-1">
                  Your Name
                </label>
                <input
                  id="enq-name"
                  type="text"
                  required
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full px-3 py-2 rounded-xl bg-[#F3F5EF] border border-[#202820]/10 text-sm"
                />
              </div>

              <div>
                <label htmlFor="enq-phone" className="block text-xs font-semibold text-[#202820]/75 mb-1">
                  Your Phone Number
                </label>
                <input
                  id="enq-phone"
                  type="tel"
                  required
                  value={studentPhone}
                  onChange={(e) => setStudentPhone(e.target.value)}
                  placeholder="10-digit mobile number"
                  className="w-full px-3 py-2 rounded-xl bg-[#F3F5EF] border border-[#202820]/10 text-sm tabular-nums"
                />
              </div>

              <div>
                <label htmlFor="enq-date" className="block text-xs font-semibold text-[#202820]/75 mb-1">
                  Preferred Move-In Date (Optional)
                </label>
                <input
                  id="enq-date"
                  type="date"
                  value={moveInDate}
                  onChange={(e) => setMoveInDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#F3F5EF] border border-[#202820]/10 text-sm"
                />
              </div>

              <div>
                <label htmlFor="enq-msg" className="block text-xs font-semibold text-[#202820]/75 mb-1">
                  Message
                </label>
                <textarea
                  id="enq-msg"
                  rows={3}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Hi, I am a student looking to move in soon. Is a room currently available for visit?"
                  className="w-full px-3 py-2 rounded-xl bg-[#F3F5EF] border border-[#202820]/10 text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={submittingEnquiry}
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#174C3A] text-white text-sm font-semibold hover:bg-[#11392B] transition-colors cursor-pointer disabled:opacity-60"
              >
                <Send className="w-4 h-4" aria-hidden="true" />
                {submittingEnquiry
                  ? 'Sending Enquiry…'
                  : availability.isAvailable
                  ? 'Send Enquiry'
                  : 'Ask About Next Vacancy'}
              </button>
            </form>
          </div>
        </aside>
      </div>

      {/* Report Listing Modal */}
      {reportOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="report-modal-title"
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-2xl border border-[#202820]/10 max-w-md w-full p-6 space-y-4">
            <h2 id="report-modal-title" className="font-heading text-lg font-bold text-[#202820]">
              Report This Listing
            </h2>
            <form onSubmit={handleReportSubmit} className="space-y-4">
              <div>
                <label htmlFor="report-reason" className="block text-xs font-semibold text-[#202820]/75 mb-1.5">
                  Reason
                </label>
                <select
                  id="report-reason"
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#F3F5EF] border border-[#202820]/10 text-sm"
                >
                  <option>Incorrect Rent or Details</option>
                  <option>Property Already Full / Unavailable</option>
                  <option>Misleading Photos or Location</option>
                  <option>Suspicious or Broker Spam</option>
                </select>
              </div>
              <div>
                <label htmlFor="report-details" className="block text-xs font-semibold text-[#202820]/75 mb-1.5">
                  Additional details (optional)
                </label>
                <textarea
                  id="report-details"
                  rows={3}
                  value={reportDetails}
                  onChange={(e) => setReportDetails(e.target.value)}
                  placeholder="Tell our moderators what looks inaccurate…"
                  className="w-full px-3 py-2 rounded-xl bg-[#F3F5EF] border border-[#202820]/10 text-sm"
                />
              </div>
              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setReportOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#202820]/15 text-sm font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReport}
                  className="px-4 py-2 rounded-xl bg-[#B91C1C] text-white text-sm font-semibold cursor-pointer disabled:opacity-60"
                >
                  {submittingReport ? 'Submitting…' : 'Submit Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

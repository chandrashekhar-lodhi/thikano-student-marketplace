import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  Minus,
  Edit3,
  Trash2,
  Eye,
  EyeOff,
  Upload,
  Star,
  X,
  MessageSquare,
  Building2,
  MapPin,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  DEFAULT_AMENITIES,
  enquiryService,
  propertyService,
  storageService,
  type PropertyInput,
} from '../services/api';
import type { Enquiry, EnquiryStatus, Property } from '../types';
import {
  FURNISHING_STATUSES,
  GENDER_PREFERENCES,
  JABALPUR_LOCALITIES,
  PROPERTY_TYPES,
  ROOM_OCCUPANCIES,
  SUPPORTED_CITIES,
  formatINR,
  getRoomAvailabilityInfo,
} from '../utils/constants';
import { GoogleMapView } from '../components/GoogleMapView';
import { ImageWithFallback } from '../components/ImageWithFallback';

const EMPTY_FORM: PropertyInput = {
  title: '',
  property_type: 'Room',
  description: '',
  monthly_rent: 5000,
  security_deposit: 5000,
  available_rooms: 1,
  room_occupancy: 'Single',
  gender_preference: 'Any',
  furnishing_status: 'Semi-Furnished',
  available_from: new Date().toISOString().slice(0, 10),
  rules_restrictions: '',
  nearby_landmark: '',
  city: 'Jabalpur',
  locality: 'Vijay Nagar',
  full_address: '',
  latitude: null,
  longitude: null,
  contact_phone: '',
  whatsapp_number: '',
  share_phone: false,
  share_whatsapp: false,
  is_published: true,
  amenity_slugs: ['wifi', 'electricity', 'water'],
  images: [],
};

export function OwnerDashboardPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [tab, setTab] = useState<'listings' | 'form' | 'enquiries'>('listings');
  const [properties, setProperties] = useState<Property[]>([]);
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<PropertyInput>(EMPTY_FORM);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [savingForm, setSavingForm] = useState(false);
  const [updatingAvailabilityId, setUpdatingAvailabilityId] = useState<string | null>(null);

  const loadOwnerData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [props, enqs] = await Promise.all([
        propertyService.listMine(),
        enquiryService.listForCurrentUser(user.role),
      ]);
      setProperties(props);
      setEnquiries(enqs);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to load owner data.', 'error');
    } finally {
      setLoading(false);
    }
  }, [user, showToast]);

  useEffect(() => {
    loadOwnerData();
  }, [loadOwnerData]);

  const startNewListing = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setTab('form');
  };

  const startEditListing = (prop: Property) => {
    setEditingId(prop.id);
    setForm({
      title: prop.title,
      property_type: prop.property_type,
      description: prop.description,
      monthly_rent: prop.monthly_rent,
      security_deposit: prop.security_deposit,
      available_rooms: prop.available_rooms,
      room_occupancy: prop.room_occupancy,
      gender_preference: prop.gender_preference,
      furnishing_status: prop.furnishing_status,
      available_from: prop.available_from,
      rules_restrictions: prop.rules_restrictions || '',
      nearby_landmark: prop.nearby_landmark || '',
      city: prop.city,
      locality: prop.locality,
      full_address: prop.full_address,
      latitude: prop.latitude,
      longitude: prop.longitude,
      contact_phone: prop.contact_phone || '',
      whatsapp_number: prop.whatsapp_number || '',
      share_phone: prop.share_phone,
      share_whatsapp: prop.share_whatsapp,
      is_published: prop.is_published,
      amenity_slugs: prop.amenities.map((a) => a.slug),
      images: prop.images.map((img) => ({
        id: img.id,
        image_url: img.image_url,
        storage_path: img.storage_path,
        is_cover: img.is_cover,
      })),
    });
    setTab('form');
  };

  const handleToggleAmenity = (slug: string) => {
    setForm((prev) => ({
      ...prev,
      amenity_slugs: prev.amenity_slugs.includes(slug)
        ? prev.amenity_slugs.filter((s) => s !== slug)
        : [...prev.amenity_slugs, slug],
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length || !user) return;
    setUploadingImages(true);
    try {
      const uploaded = await Promise.all(
        files.map((file) => storageService.uploadPropertyImage(file, user.id))
      );
      setForm((prev) => {
        const hasCover = prev.images.some((i) => i.is_cover);
        const mapped = uploaded.map((item, idx) => ({
          image_url: item.image_url,
          storage_path: item.storage_path || null,
          is_cover: !hasCover && idx === 0,
        }));
        return { ...prev, images: [...prev.images, ...mapped] };
      });
      showToast(`${uploaded.length} photo(s) added.`, 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Image upload failed.', 'error');
    } finally {
      setUploadingImages(false);
      e.target.value = '';
    }
  };

  const handleSetCover = (idx: number) => {
    setForm((prev) => ({
      ...prev,
      images: prev.images.map((img, i) => ({ ...img, is_cover: i === idx })),
    }));
  };

  const handleRemoveImage = (idx: number) => {
    setForm((prev) => {
      const filtered = prev.images.filter((_, i) => i !== idx);
      if (filtered.length > 0 && !filtered.some((i) => i.is_cover)) {
        filtered[0].is_cover = true;
      }
      return { ...prev, images: filtered };
    });
  };

  const handleSubmitProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.title.trim().length < 5) {
      showToast('Property title must be at least 5 characters.', 'error');
      return;
    }
    if (form.description.trim().length < 20) {
      showToast('Please provide a description of at least 20 characters.', 'error');
      return;
    }
    if (!form.full_address.trim()) {
      showToast('Please enter the full address.', 'error');
      return;
    }
    if (form.share_phone && !form.contact_phone?.trim()) {
      showToast('Enter a phone number or uncheck public phone sharing.', 'error');
      return;
    }
    if (form.share_whatsapp && !form.whatsapp_number?.trim()) {
      showToast('Enter a WhatsApp number or uncheck WhatsApp sharing.', 'error');
      return;
    }

    setSavingForm(true);
    try {
      if (editingId) {
        await propertyService.update(editingId, form);
        showToast('Property listing updated successfully.', 'success');
      } else {
        await propertyService.create(form);
        showToast('Property listing created successfully.', 'success');
      }
      await loadOwnerData();
      setTab('listings');
      setEditingId(null);
      setForm(EMPTY_FORM);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not save property.', 'error');
    } finally {
      setSavingForm(false);
    }
  };

  const handleTogglePublish = async (prop: Property) => {
    try {
      await propertyService.update(prop.id, { is_published: !prop.is_published });
      showToast(prop.is_published ? 'Listing unpublished.' : 'Listing published.', 'success');
      loadOwnerData();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to update status.', 'error');
    }
  };

  const handleDeleteProperty = async (prop: Property) => {
    try {
      await propertyService.remove(prop.id);
      showToast('Property listing deleted.', 'success');
      loadOwnerData();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to delete property.', 'error');
    }
  };

  const handleQuickAvailabilityChange = async (prop: Property, nextRooms: number) => {
    const safeRooms = Math.max(0, Math.floor(nextRooms));
    if (safeRooms === prop.available_rooms) return;
    setUpdatingAvailabilityId(prop.id);
    try {
      const updated = await propertyService.updateAvailability(prop.id, safeRooms);
      setProperties((prev) => prev.map((item) => (item.id === prop.id ? updated : item)));
      showToast(
        safeRooms > 0
          ? `Updated: ${safeRooms} ${safeRooms === 1 ? 'room' : 'rooms'} currently available.`
          : 'Marked as Not Available (Currently Full).',
        'success'
      );
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to update room availability.', 'error');
    } finally {
      setUpdatingAvailabilityId(null);
    }
  };

  const handleEnquiryStatus = async (enquiryId: string, status: EnquiryStatus) => {
    try {
      await enquiryService.updateStatus(enquiryId, status);
      setEnquiries((prev) => prev.map((e) => (e.id === enquiryId ? { ...e, status } : e)));
      showToast(`Enquiry marked as ${status}.`, 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to update enquiry.', 'error');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-[#202820]/10">
        <div>
          <p className="text-xs font-semibold text-[#174C3A]">Property Owner Dashboard</p>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-[#202820] mt-1">
            Manage Your Properties & Enquiries
          </h1>
          <p className="text-sm text-[#202820]/70 mt-1">
            Add rooms, PGs, or hostels, pin exact map locations, and respond directly to students.
          </p>
        </div>

        <button
          type="button"
          onClick={startNewListing}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#174C3A] text-white text-sm font-semibold hover:bg-[#11392B] cursor-pointer self-start"
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          Add New Property
        </button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-[#202820]/10 pb-3">
        <button
          type="button"
          onClick={() => setTab('listings')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer ${
            tab === 'listings'
              ? 'bg-[#174C3A] text-white'
              : 'bg-white text-[#202820] border border-[#202820]/10'
          }`}
        >
          <Building2 className="w-4 h-4" aria-hidden="true" />
          My Listings ({properties.length})
        </button>
        <button
          type="button"
          onClick={() => setTab('enquiries')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer ${
            tab === 'enquiries'
              ? 'bg-[#174C3A] text-white'
              : 'bg-white text-[#202820] border border-[#202820]/10'
          }`}
        >
          <MessageSquare className="w-4 h-4" aria-hidden="true" />
          Student Enquiries ({enquiries.length})
        </button>
        {tab === 'form' && (
          <span className="inline-flex items-center px-4 py-2 rounded-xl text-sm font-semibold bg-[#E9A45B] text-[#202820]">
            {editingId ? 'Editing Listing' : 'Creating New Listing'}
          </span>
        )}
      </div>

      {/* TAB 1: MY LISTINGS */}
      {tab === 'listings' && (
        <div>
          {loading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-24 rounded-2xl bg-white border border-[#202820]/10 animate-pulse" />
              ))}
            </div>
          ) : properties.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#202820]/10 p-12 text-center space-y-3">
              <h2 className="font-heading text-xl font-semibold text-[#202820]">
                You haven’t listed any properties yet
              </h2>
              <p className="text-sm text-[#202820]/70 max-w-md mx-auto">
                Add your first room, PG, or hostel with photos, rent, and Google Maps location pin.
              </p>
              <button
                type="button"
                onClick={startNewListing}
                className="px-5 py-2.5 rounded-xl bg-[#174C3A] text-white text-sm font-semibold cursor-pointer"
              >
                Create First Listing
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-[#202820]/10 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[#F3F5EF] border-b border-[#202820]/10 text-xs font-semibold text-[#202820]/75">
                    <tr>
                      <th className="px-5 py-3.5">Listing</th>
                      <th className="px-5 py-3.5">Rent</th>
                      <th className="px-5 py-3.5">Room Availability</th>
                      <th className="px-5 py-3.5">Visibility</th>
                      <th className="px-5 py-3.5">Moderation</th>
                      <th className="px-5 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#202820]/10">
                    {properties.map((prop) => {
                      const avail = getRoomAvailabilityInfo(prop.available_rooms, prop.available_from);
                      const isUpdatingAvail = updatingAvailabilityId === prop.id;
                      return (
                      <tr key={prop.id} className="hover:bg-[#F3F5EF]/50">
                        <td className="px-5 py-4">
                          <Link
                            to={`/property/${prop.id}`}
                            className="font-semibold text-[#202820] hover:text-[#174C3A]"
                          >
                            {prop.title}
                          </Link>
                          <p className="text-xs text-[#202820]/60">
                            {prop.property_type} · {prop.locality}, {prop.city}
                            {prop.is_demo ? ' · DEMO' : ''}
                          </p>
                        </td>
                        <td className="px-5 py-4 font-semibold text-[#174C3A] tabular-nums">
                          {formatINR(prop.monthly_rent)}/mo
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex flex-col gap-1.5">
                            <span
                              className={`inline-flex items-center gap-1 text-xs font-semibold ${
                                avail.isAvailable ? 'text-[#065F46]' : 'text-[#B91C1C]'
                              }`}
                            >
                              {avail.isAvailable ? (
                                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                              ) : (
                                <XCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                              )}
                              {avail.badgeText}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                disabled={isUpdatingAvail || prop.available_rooms <= 0}
                                onClick={() =>
                                  void handleQuickAvailabilityChange(prop, prop.available_rooms - 1)
                                }
                                aria-label="Decrease available rooms"
                                className="w-6 h-6 rounded-md border border-[#202820]/15 bg-[#F3F5EF] flex items-center justify-center hover:bg-[#E4EAE0] disabled:opacity-40 cursor-pointer"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="text-xs font-semibold tabular-nums min-w-[1.5rem] text-center">
                                {prop.available_rooms}
                              </span>
                              <button
                                type="button"
                                disabled={isUpdatingAvail}
                                onClick={() =>
                                  void handleQuickAvailabilityChange(prop, prop.available_rooms + 1)
                                }
                                aria-label="Increase available rooms"
                                className="w-6 h-6 rounded-md border border-[#202820]/15 bg-[#F3F5EF] flex items-center justify-center hover:bg-[#E4EAE0] disabled:opacity-40 cursor-pointer"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                disabled={isUpdatingAvail}
                                onClick={() =>
                                  void handleQuickAvailabilityChange(
                                    prop,
                                    prop.available_rooms > 0 ? 0 : 1
                                  )
                                }
                                className={`ml-1 px-2 py-0.5 rounded-md text-[11px] font-semibold border transition-colors cursor-pointer disabled:opacity-50 ${
                                  prop.available_rooms > 0
                                    ? 'border-[#FECACA] text-[#B91C1C] hover:bg-[#FEF2F2]'
                                    : 'border-[#10B981]/40 text-[#065F46] hover:bg-[#ECFDF5]'
                                }`}
                              >
                                {prop.available_rooms > 0 ? 'Mark Full' : 'Mark Available'}
                              </button>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`text-xs font-semibold ${
                              prop.is_published ? 'text-[#174C3A]' : 'text-[#202820]/55'
                            }`}
                          >
                            {prop.is_published ? 'Published' : 'Unpublished'}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`text-xs font-semibold capitalize ${
                              prop.moderation_status === 'approved'
                                ? 'text-[#174C3A]'
                                : prop.moderation_status === 'rejected'
                                ? 'text-[#B91C1C]'
                                : 'text-[#B45309]'
                            }`}
                          >
                            {prop.moderation_status}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleTogglePublish(prop)}
                              title={prop.is_published ? 'Unpublish' : 'Publish'}
                              className="p-2 rounded-lg border border-[#202820]/10 hover:bg-[#F3F5EF] cursor-pointer"
                            >
                              {prop.is_published ? (
                                <EyeOff className="w-4 h-4 text-[#202820]/75" />
                              ) : (
                                <Eye className="w-4 h-4 text-[#174C3A]" />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => startEditListing(prop)}
                              title="Edit property"
                              className="p-2 rounded-lg border border-[#202820]/10 hover:bg-[#F3F5EF] cursor-pointer"
                            >
                              <Edit3 className="w-4 h-4 text-[#174C3A]" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteProperty(prop)}
                              title="Delete property"
                              className="p-2 rounded-lg border border-[#202820]/10 hover:bg-[#FEF2F2] cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4 text-[#B91C1C]" />
                            </button>
                          </div>
                        </td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: CREATE / EDIT FORM */}
      {tab === 'form' && (
        <form onSubmit={handleSubmitProperty} className="space-y-8">
          {/* Basic Details */}
          <div className="bg-white rounded-2xl border border-[#202820]/10 p-6 sm:p-8 space-y-5">
            <h2 className="font-heading text-lg font-semibold text-[#202820]">
              1. Basic Property Details
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label htmlFor="prop-title" className="block text-xs font-semibold text-[#202820]/75 mb-1">
                  Property Title *
                </label>
                <input
                  id="prop-title"
                  type="text"
                  required
                  minLength={5}
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Spacious Single Room Near MR-4 Road, Vijay Nagar"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F3F5EF] border border-[#202820]/10 text-sm"
                />
              </div>

              <div>
                <label htmlFor="prop-type" className="block text-xs font-semibold text-[#202820]/75 mb-1">
                  Property Type *
                </label>
                <select
                  id="prop-type"
                  value={form.property_type}
                  onChange={(e) =>
                    setForm({ ...form, property_type: e.target.value as Property['property_type'] })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F3F5EF] border border-[#202820]/10 text-sm"
                >
                  {PROPERTY_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="prop-occ" className="block text-xs font-semibold text-[#202820]/75 mb-1">
                  Room Occupancy *
                </label>
                <select
                  id="prop-occ"
                  value={form.room_occupancy}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      room_occupancy: e.target.value as Property['room_occupancy'],
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F3F5EF] border border-[#202820]/10 text-sm"
                >
                  {ROOM_OCCUPANCIES.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="prop-rent" className="block text-xs font-semibold text-[#202820]/75 mb-1">
                  Monthly Rent (₹) *
                </label>
                <input
                  id="prop-rent"
                  type="number"
                  required
                  min={500}
                  value={form.monthly_rent}
                  onChange={(e) => setForm({ ...form, monthly_rent: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F3F5EF] border border-[#202820]/10 text-sm tabular-nums"
                />
              </div>

              <div>
                <label htmlFor="prop-dep" className="block text-xs font-semibold text-[#202820]/75 mb-1">
                  Security Deposit (₹)
                </label>
                <input
                  id="prop-dep"
                  type="number"
                  min={0}
                  value={form.security_deposit}
                  onChange={(e) => setForm({ ...form, security_deposit: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F3F5EF] border border-[#202820]/10 text-sm tabular-nums"
                />
              </div>

              <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-[#F3F5EF] border border-[#202820]/10">
                <div>
                  <span className="block text-xs font-semibold text-[#202820]/75 mb-1.5">
                    Current Room Availability *
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setForm((prev) => ({
                          ...prev,
                          available_rooms: prev.available_rooms > 0 ? prev.available_rooms : 1,
                        }))
                      }
                      className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                        form.available_rooms > 0
                          ? 'bg-[#174C3A] text-white border-[#174C3A]'
                          : 'bg-white text-[#202820] border-[#202820]/15'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                      Room Available
                    </button>
                    <button
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, available_rooms: 0 }))}
                      className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                        form.available_rooms === 0
                          ? 'bg-[#B91C1C] text-white border-[#B91C1C]'
                          : 'bg-white text-[#202820] border-[#202820]/15'
                      }`}
                    >
                      <XCircle className="w-3.5 h-3.5" aria-hidden="true" />
                      Not Available (Full)
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="prop-rooms" className="block text-xs font-semibold text-[#202820]/75 mb-1.5">
                    Number of Open Rooms / Beds *
                  </label>
                  <input
                    id="prop-rooms"
                    type="number"
                    min={0}
                    required
                    value={form.available_rooms}
                    onChange={(e) =>
                      setForm({ ...form, available_rooms: Math.max(0, Number(e.target.value)) })
                    }
                    className="w-full px-3.5 py-2 rounded-lg bg-white border border-[#202820]/15 text-sm tabular-nums"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="prop-gender" className="block text-xs font-semibold text-[#202820]/75 mb-1">
                  Gender Preference *
                </label>
                <select
                  id="prop-gender"
                  value={form.gender_preference}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      gender_preference: e.target.value as Property['gender_preference'],
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F3F5EF] border border-[#202820]/10 text-sm"
                >
                  {GENDER_PREFERENCES.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="prop-furnish" className="block text-xs font-semibold text-[#202820]/75 mb-1">
                  Furnishing Status *
                </label>
                <select
                  id="prop-furnish"
                  value={form.furnishing_status}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      furnishing_status: e.target.value as Property['furnishing_status'],
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F3F5EF] border border-[#202820]/10 text-sm"
                >
                  {FURNISHING_STATUSES.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="prop-date" className="block text-xs font-semibold text-[#202820]/75 mb-1">
                  Available From *
                </label>
                <input
                  id="prop-date"
                  type="date"
                  required
                  value={form.available_from}
                  onChange={(e) => setForm({ ...form, available_from: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F3F5EF] border border-[#202820]/10 text-sm"
                />
              </div>

              <div className="md:col-span-2">
                <label htmlFor="prop-desc" className="block text-xs font-semibold text-[#202820]/75 mb-1">
                  Description * (min 20 characters)
                </label>
                <textarea
                  id="prop-desc"
                  rows={4}
                  required
                  minLength={20}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Describe room size, ventilation, electricity charges, nearby colleges, and transport access…"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F3F5EF] border border-[#202820]/10 text-sm"
                />
              </div>

              <div className="md:col-span-2">
                <label htmlFor="prop-rules" className="block text-xs font-semibold text-[#202820]/75 mb-1">
                  Rules & Restrictions (Optional)
                </label>
                <textarea
                  id="prop-rules"
                  rows={2}
                  value={form.rules_restrictions || ''}
                  onChange={(e) => setForm({ ...form, rules_restrictions: e.target.value })}
                  placeholder="e.g. Gate closing time, visitor policy, notice period…"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F3F5EF] border border-[#202820]/10 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Facilities */}
          <div className="bg-white rounded-2xl border border-[#202820]/10 p-6 sm:p-8 space-y-4">
            <h2 className="font-heading text-lg font-semibold text-[#202820]">
              2. Facilities & Amenities
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {DEFAULT_AMENITIES.map((amenity) => (
                <label
                  key={amenity.slug}
                  className={`flex items-center gap-2.5 p-3 rounded-xl border text-sm cursor-pointer transition-colors ${
                    form.amenity_slugs.includes(amenity.slug)
                      ? 'border-[#174C3A] bg-[#F3F5EF] font-medium text-[#174C3A]'
                      : 'border-[#202820]/10 bg-white text-[#202820]'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={form.amenity_slugs.includes(amenity.slug)}
                    onChange={() => handleToggleAmenity(amenity.slug)}
                    className="w-4 h-4 rounded accent-[#174C3A]"
                  />
                  <span>{amenity.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Location & Map Picker */}
          <div className="bg-white rounded-2xl border border-[#202820]/10 p-6 sm:p-8 space-y-5">
            <div>
              <h2 className="font-heading text-lg font-semibold text-[#202820]">
                3. Location & Interactive Map Picker
              </h2>
              <p className="text-xs text-[#202820]/70 mt-1">
                Search an address or click directly on Google Maps below to pin your property’s real entrance.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="prop-city" className="block text-xs font-semibold text-[#202820]/75 mb-1">
                  City *
                </label>
                <select
                  id="prop-city"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F3F5EF] border border-[#202820]/10 text-sm"
                >
                  {SUPPORTED_CITIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="prop-locality" className="block text-xs font-semibold text-[#202820]/75 mb-1">
                  Locality *
                </label>
                <select
                  id="prop-locality"
                  value={form.locality}
                  onChange={(e) => setForm({ ...form, locality: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F3F5EF] border border-[#202820]/10 text-sm"
                >
                  {JABALPUR_LOCALITIES.map((loc) => (
                    <option key={loc.name} value={loc.name}>
                      {loc.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="prop-landmark" className="block text-xs font-semibold text-[#202820]/75 mb-1">
                  Nearby Landmark / College
                </label>
                <input
                  id="prop-landmark"
                  type="text"
                  value={form.nearby_landmark || ''}
                  onChange={(e) => setForm({ ...form, nearby_landmark: e.target.value })}
                  placeholder="e.g. 500m from MR-4 Chowk"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F3F5EF] border border-[#202820]/10 text-sm"
                />
              </div>

              <div className="md:col-span-3">
                <label htmlFor="prop-address" className="block text-xs font-semibold text-[#202820]/75 mb-1">
                  Full Street Address *
                </label>
                <input
                  id="prop-address"
                  type="text"
                  required
                  value={form.full_address}
                  onChange={(e) => setForm({ ...form, full_address: e.target.value })}
                  placeholder="House/Plot No., Street, Locality, Jabalpur"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F3F5EF] border border-[#202820]/10 text-sm"
                />
              </div>
            </div>

            <GoogleMapView
              mode="picker"
              selectedPosition={
                form.latitude !== null && form.longitude !== null
                  ? { lat: form.latitude, lng: form.longitude }
                  : null
              }
              onSelectPosition={(lat, lng) => setForm((prev) => ({ ...prev, latitude: lat, longitude: lng }))}
              heightClass="h-[340px]"
            />

            <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-[#202820]/80 font-mono tabular-nums">
                <MapPin className="w-4 h-4 text-[#174C3A]" aria-hidden="true" />
                {form.latitude !== null && form.longitude !== null
                  ? `Selected Coordinates: ${form.latitude}, ${form.longitude}`
                  : 'No exact pin selected yet — click the map above to drop a pin.'}
              </div>
              {form.latitude !== null && (
                <button
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, latitude: null, longitude: null }))}
                  className="text-[#B91C1C] font-semibold hover:underline cursor-pointer"
                >
                  Clear Pin
                </button>
              )}
            </div>
          </div>

          {/* Photos */}
          <div className="bg-white rounded-2xl border border-[#202820]/10 p-6 sm:p-8 space-y-5">
            <div>
              <h2 className="font-heading text-lg font-semibold text-[#202820]">
                4. Property Photos
              </h2>
              <p className="text-xs text-[#202820]/70 mt-1">
                Upload JPG, PNG, or WEBP photos (up to 5 MB each). Choose one photo as the cover image.
              </p>
            </div>

            <label className="flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-dashed border-[#174C3A]/30 bg-[#F3F5EF] hover:border-[#174C3A] transition-colors cursor-pointer">
              <Upload className="w-6 h-6 text-[#174C3A] mb-2" aria-hidden="true" />
              <span className="text-sm font-semibold text-[#174C3A]">
                {uploadingImages ? 'Uploading photos…' : 'Click to upload property photos'}
              </span>
              <span className="text-xs text-[#202820]/60 mt-1">JPG, PNG, or WEBP (max 5 MB)</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                disabled={uploadingImages}
                onChange={handleImageUpload}
                className="sr-only"
              />
            </label>

            {form.images.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {form.images.map((img, idx) => (
                  <div
                    key={`${img.image_url.slice(0, 24)}-${idx}`}
                    className={`rounded-xl overflow-hidden border-2 bg-[#F3F5EF] ${
                      img.is_cover ? 'border-[#174C3A]' : 'border-[#202820]/10'
                    }`}
                  >
                    <div className="aspect-[4/3]">
                      <ImageWithFallback
                        src={img.image_url}
                        alt={`Upload preview ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-2 flex items-center justify-between gap-2 bg-white text-xs">
                      <button
                        type="button"
                        onClick={() => handleSetCover(idx)}
                        className={`inline-flex items-center gap-1 font-semibold cursor-pointer ${
                          img.is_cover ? 'text-[#174C3A]' : 'text-[#202820]/65 hover:text-[#174C3A]'
                        }`}
                      >
                        <Star className={`w-3.5 h-3.5 ${img.is_cover ? 'fill-current' : ''}`} />
                        {img.is_cover ? 'Cover' : 'Set Cover'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        aria-label="Remove photo"
                        className="p-1 text-[#B91C1C] hover:bg-[#FEF2F2] rounded cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Contact Consent & Publish */}
          <div className="bg-white rounded-2xl border border-[#202820]/10 p-6 sm:p-8 space-y-5">
            <h2 className="font-heading text-lg font-semibold text-[#202820]">
              5. Contact Preferences & Publishing
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="prop-phone" className="block text-xs font-semibold text-[#202820]/75 mb-1">
                  Contact Phone Number (Optional)
                </label>
                <input
                  id="prop-phone"
                  type="tel"
                  value={form.contact_phone || ''}
                  onChange={(e) => setForm({ ...form, contact_phone: e.target.value })}
                  placeholder="10-digit phone"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F3F5EF] border border-[#202820]/10 text-sm tabular-nums"
                />
                <label className="mt-2 flex items-center gap-2 text-xs text-[#202820]/80 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.share_phone}
                    onChange={(e) => setForm({ ...form, share_phone: e.target.checked })}
                    className="w-4 h-4 rounded accent-[#174C3A]"
                  />
                  <span>I consent to show a Call Owner button on this listing</span>
                </label>
              </div>

              <div>
                <label htmlFor="prop-wa" className="block text-xs font-semibold text-[#202820]/75 mb-1">
                  WhatsApp Number (Optional)
                </label>
                <input
                  id="prop-wa"
                  type="tel"
                  value={form.whatsapp_number || ''}
                  onChange={(e) => setForm({ ...form, whatsapp_number: e.target.value })}
                  placeholder="10-digit WhatsApp number"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F3F5EF] border border-[#202820]/10 text-sm tabular-nums"
                />
                <label className="mt-2 flex items-center gap-2 text-xs text-[#202820]/80 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.share_whatsapp}
                    onChange={(e) => setForm({ ...form, share_whatsapp: e.target.checked })}
                    className="w-4 h-4 rounded accent-[#174C3A]"
                  />
                  <span>I consent to show a WhatsApp enquiry button on this listing</span>
                </label>
              </div>
            </div>

            <label className="flex items-center gap-2.5 text-sm font-medium text-[#202820] pt-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_published}
                onChange={(e) => setForm({ ...form, is_published: e.target.checked })}
                className="w-4 h-4 rounded accent-[#174C3A]"
              />
              <span>Publish listing immediately (visible once approved by moderation)</span>
            </label>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={savingForm}
                className="px-6 py-3 rounded-xl bg-[#174C3A] text-white text-sm font-semibold hover:bg-[#11392B] cursor-pointer disabled:opacity-60"
              >
                {savingForm
                  ? 'Saving Listing…'
                  : editingId
                  ? 'Save Changes'
                  : 'Publish Property Listing'}
              </button>
              <button
                type="button"
                onClick={() => setTab('listings')}
                className="px-5 py-3 rounded-xl border border-[#202820]/15 text-sm font-medium cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      )}

      {/* TAB 3: ENQUIRIES INBOX */}
      {tab === 'enquiries' && (
        <div>
          {enquiries.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#202820]/10 p-10 text-center space-y-2">
              <h2 className="font-heading text-lg font-semibold text-[#202820]">
                No student enquiries yet
              </h2>
              <p className="text-sm text-[#202820]/70">
                When students enquire about your properties, their contact details and messages appear here.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-[#202820]/10 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[#F3F5EF] border-b border-[#202820]/10 text-xs font-semibold text-[#202820]/75">
                    <tr>
                      <th className="px-5 py-3.5">Student</th>
                      <th className="px-5 py-3.5">Property</th>
                      <th className="px-5 py-3.5">Message</th>
                      <th className="px-5 py-3.5">Move-In</th>
                      <th className="px-5 py-3.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#202820]/10">
                    {enquiries.map((enq) => (
                      <tr key={enq.id}>
                        <td className="px-5 py-4">
                          <p className="font-semibold text-[#202820]">{enq.student_name}</p>
                          <p className="text-xs text-[#174C3A] tabular-nums">{enq.student_phone}</p>
                        </td>
                        <td className="px-5 py-4 font-medium">{enq.property_title}</td>
                        <td className="px-5 py-4 max-w-xs text-[#202820]/80">{enq.message}</td>
                        <td className="px-5 py-4 tabular-nums">{enq.preferred_move_in || 'Flexible'}</td>
                        <td className="px-5 py-4">
                          <select
                            aria-label={`Update status for ${enq.student_name}`}
                            value={enq.status}
                            onChange={(e) =>
                              handleEnquiryStatus(enq.id, e.target.value as EnquiryStatus)
                            }
                            className="px-2.5 py-1.5 rounded-lg bg-[#F3F5EF] border border-[#202820]/15 text-xs font-semibold capitalize"
                          >
                            <option value="pending">Pending</option>
                            <option value="contacted">Contacted</option>
                            <option value="resolved">Resolved</option>
                            <option value="archived">Archived</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

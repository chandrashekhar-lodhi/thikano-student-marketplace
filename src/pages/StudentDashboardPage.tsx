import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, MessageSquare, User, Save } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { enquiryService, savedService } from '../services/api';
import type { Enquiry, SavedProperty } from '../types';
import { JABALPUR_COLLEGES, JABALPUR_LOCALITIES } from '../utils/constants';
import { PropertyCard } from '../components/PropertyCard';

export function StudentDashboardPage() {
  const { user, updateProfile, refreshSaved } = useAuth();
  const { showToast } = useToast();

  const [tab, setTab] = useState<'saved' | 'enquiries' | 'profile'>('saved');
  const [savedItems, setSavedItems] = useState<SavedProperty[]>([]);
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Profile form state
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [college, setCollege] = useState(user?.college || '');
  const [preferredLocation, setPreferredLocation] = useState(user?.preferred_location || '');
  const [budgetPreference, setBudgetPreference] = useState(
    user?.budget_preference ? String(user.budget_preference) : ''
  );
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    if (!user) return;
    setFullName(user.full_name || '');
    setPhone(user.phone || '');
    setCollege(user.college || '');
    setPreferredLocation(user.preferred_location || '');
    setBudgetPreference(user.budget_preference ? String(user.budget_preference) : '');

    setLoadingData(true);
    Promise.all([savedService.list(), enquiryService.listForCurrentUser(user.role)])
      .then(([saved, enqs]) => {
        setSavedItems(saved);
        setEnquiries(enqs);
      })
      .catch(() => {
        // Keep clean empty states
      })
      .finally(() => setLoadingData(false));
  }, [user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await updateProfile({
        full_name: fullName.trim(),
        phone: phone.trim() || null,
        college: college.trim() || null,
        preferred_location: preferredLocation || null,
        budget_preference: budgetPreference ? Number(budgetPreference) : null,
      });
      showToast('Profile preferences saved.', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to save profile.', 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  // Refresh saved cards if user clicks heart icon inside saved tab
  const handleRefreshSaved = async () => {
    await refreshSaved();
    const list = await savedService.list();
    setSavedItems(list);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-[#202820]/10">
        <div>
          <p className="text-xs font-semibold text-[#174C3A]">Student Dashboard</p>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-[#202820] mt-1">
            Welcome, {user?.full_name}
          </h1>
          <p className="text-sm text-[#202820]/70 mt-1">
            Manage your shortlisted stays, track enquiry updates, and set your Jabalpur room preferences.
          </p>
        </div>
        <Link
          to="/explore"
          className="px-4 py-2.5 rounded-xl bg-[#174C3A] text-white text-sm font-semibold hover:bg-[#11392B] self-start"
        >
          Browse Rooms
        </Link>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-[#202820]/10 pb-3">
        <button
          type="button"
          onClick={() => {
            setTab('saved');
            handleRefreshSaved();
          }}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer ${
            tab === 'saved' ? 'bg-[#174C3A] text-white' : 'bg-white text-[#202820] border border-[#202820]/10'
          }`}
        >
          <Heart className="w-4 h-4" aria-hidden="true" />
          Saved Properties ({savedItems.length})
        </button>
        <button
          type="button"
          onClick={() => setTab('enquiries')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer ${
            tab === 'enquiries' ? 'bg-[#174C3A] text-white' : 'bg-white text-[#202820] border border-[#202820]/10'
          }`}
        >
          <MessageSquare className="w-4 h-4" aria-hidden="true" />
          Enquiry History ({enquiries.length})
        </button>
        <button
          type="button"
          onClick={() => setTab('profile')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer ${
            tab === 'profile' ? 'bg-[#174C3A] text-white' : 'bg-white text-[#202820] border border-[#202820]/10'
          }`}
        >
          <User className="w-4 h-4" aria-hidden="true" />
          My Profile
        </button>
      </div>

      {tab === 'saved' && (
        <div>
          {loadingData ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-80 rounded-2xl bg-white border border-[#202820]/10 animate-pulse" />
              ))}
            </div>
          ) : savedItems.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#202820]/10 p-10 text-center space-y-3">
              <h2 className="font-heading text-lg font-semibold text-[#202820]">
                No saved properties yet
              </h2>
              <p className="text-sm text-[#202820]/70">
                Tap the heart icon on any room, PG, or hostel to compare your favourites here.
              </p>
              <Link
                to="/explore"
                className="inline-block px-5 py-2.5 rounded-xl bg-[#174C3A] text-white text-sm font-semibold"
              >
                Explore Jabalpur Stays
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {savedItems.map(
                (item) => item.property && <PropertyCard key={item.id} property={item.property} />
              )}
            </div>
          )}
        </div>
      )}

      {tab === 'enquiries' && (
        <div className="space-y-4">
          {enquiries.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#202820]/10 p-10 text-center space-y-3">
              <h2 className="font-heading text-lg font-semibold text-[#202820]">
                You haven’t sent any enquiries yet
              </h2>
              <p className="text-sm text-[#202820]/70">
                Open any listing and send an enquiry to connect with the property owner.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-[#202820]/10 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[#F3F5EF] border-b border-[#202820]/10 text-xs font-semibold text-[#202820]/75">
                    <tr>
                      <th className="px-5 py-3.5">Property</th>
                      <th className="px-5 py-3.5">Message</th>
                      <th className="px-5 py-3.5">Move-in</th>
                      <th className="px-5 py-3.5">Status</th>
                      <th className="px-5 py-3.5">Sent On</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#202820]/10">
                    {enquiries.map((enq) => (
                      <tr key={enq.id} className="hover:bg-[#F3F5EF]/50">
                        <td className="px-5 py-4 font-medium">
                          <Link
                            to={`/property/${enq.property_id}`}
                            className="text-[#174C3A] hover:underline font-semibold"
                          >
                            {enq.property_title}
                          </Link>
                          <p className="text-xs text-[#202820]/60">{enq.property_locality}</p>
                        </td>
                        <td className="px-5 py-4 text-[#202820]/80 max-w-xs">
                          <p className="line-clamp-2">{enq.message}</p>
                        </td>
                        <td className="px-5 py-4 text-[#202820]/75 tabular-nums">
                          {enq.preferred_move_in || 'Flexible'}
                        </td>
                        <td className="px-5 py-4">
                          <span className="text-xs font-semibold capitalize text-[#174C3A]">
                            {enq.status}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-xs text-[#202820]/65 tabular-nums">
                          {new Date(enq.created_at).toLocaleDateString('en-IN')}
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

      {tab === 'profile' && (
        <form
          onSubmit={handleSaveProfile}
          className="bg-white rounded-2xl border border-[#202820]/10 p-6 sm:p-8 max-w-2xl space-y-5"
        >
          <h2 className="font-heading text-xl font-semibold text-[#202820]">
            Student Profile & Preferences
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="prof-name" className="block text-xs font-semibold text-[#202820]/75 mb-1">
                Full Name
              </label>
              <input
                id="prof-name"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#F3F5EF] border border-[#202820]/10 text-sm"
              />
            </div>

            <div>
              <label htmlFor="prof-email" className="block text-xs font-semibold text-[#202820]/75 mb-1">
                Email Address
              </label>
              <input
                id="prof-email"
                type="email"
                disabled
                value={user?.email || ''}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#F3F5EF]/60 border border-[#202820]/10 text-sm text-[#202820]/60"
              />
            </div>

            <div>
              <label htmlFor="prof-phone" className="block text-xs font-semibold text-[#202820]/75 mb-1">
                Phone Number (Optional)
              </label>
              <input
                id="prof-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="10-digit mobile"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#F3F5EF] border border-[#202820]/10 text-sm tabular-nums"
              />
            </div>

            <div>
              <label htmlFor="prof-college" className="block text-xs font-semibold text-[#202820]/75 mb-1">
                College / Coaching (Optional)
              </label>
              <input
                id="prof-college"
                list="jabalpur-colleges"
                value={college}
                onChange={(e) => setCollege(e.target.value)}
                placeholder="e.g. JEC Jabalpur"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#F3F5EF] border border-[#202820]/10 text-sm"
              />
              <datalist id="jabalpur-colleges">
                {JABALPUR_COLLEGES.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>

            <div>
              <label htmlFor="prof-loc" className="block text-xs font-semibold text-[#202820]/75 mb-1">
                Preferred Jabalpur Location
              </label>
              <select
                id="prof-loc"
                value={preferredLocation}
                onChange={(e) => setPreferredLocation(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#F3F5EF] border border-[#202820]/10 text-sm"
              >
                <option value="">No preference yet</option>
                {JABALPUR_LOCALITIES.map((loc) => (
                  <option key={loc.name} value={loc.name}>
                    {loc.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="prof-budget" className="block text-xs font-semibold text-[#202820]/75 mb-1">
                Monthly Budget Preference (₹)
              </label>
              <input
                id="prof-budget"
                type="number"
                min={0}
                step={500}
                value={budgetPreference}
                onChange={(e) => setBudgetPreference(e.target.value)}
                placeholder="e.g. 6000"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#F3F5EF] border border-[#202820]/10 text-sm tabular-nums"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={savingProfile}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#174C3A] text-white text-sm font-semibold hover:bg-[#11392B] cursor-pointer disabled:opacity-60"
          >
            <Save className="w-4 h-4" aria-hidden="true" />
            {savingProfile ? 'Saving…' : 'Save Profile'}
          </button>
        </form>
      )}
    </div>
  );
}

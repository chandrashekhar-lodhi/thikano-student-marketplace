import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, XCircle, Trash2, Plus } from 'lucide-react';
import { adminService, propertyService } from '../services/api';
import { useToast } from '../context/ToastContext';
import type {
  AdminStats,
  Category,
  Enquiry,
  Profile,
  Property,
  PropertyReport,
  ReportStatus,
} from '../types';
import { formatINR } from '../utils/constants';

export function AdminDashboardPage() {
  const { showToast } = useToast();
  const [tab, setTab] = useState<'properties' | 'reports' | 'users' | 'enquiries' | 'categories'>(
    'properties'
  );
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<Profile[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [reports, setReports] = useState<PropertyReport[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');

  const loadAdminOverview = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminService.getOverview();
      setStats(data.stats);
      setUsers(data.users);
      setProperties(data.properties);
      setEnquiries(data.enquiries);
      setReports(data.reports);
      setCategories(data.categories);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Admin access verification failed.', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadAdminOverview();
  }, [loadAdminOverview]);

  const handleModerate = async (id: string, status: 'approved' | 'rejected') => {
    try {
      await adminService.moderateProperty(
        id,
        status,
        status === 'rejected' ? 'Rejected by moderator during listing review.' : undefined
      );
      showToast(`Property ${status}.`, 'success');
      loadAdminOverview();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Moderation failed.', 'error');
    }
  };

  const handleDeleteProperty = async (id: string) => {
    try {
      await propertyService.remove(id);
      showToast('Listing removed.', 'success');
      loadAdminOverview();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Delete failed.', 'error');
    }
  };

  const handleReportUpdate = async (id: string, status: ReportStatus) => {
    try {
      await adminService.updateReport(id, status);
      showToast(`Report marked ${status}.`, 'success');
      loadAdminOverview();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Update failed.', 'error');
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    try {
      await adminService.createCategory(newCatName, newCatDesc);
      setNewCatName('');
      setNewCatDesc('');
      showToast('Category added.', 'success');
      loadAdminOverview();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not add category.', 'error');
    }
  };

  const handleToggleCategory = async (cat: Category) => {
    try {
      await adminService.toggleCategory(cat.id, !cat.is_active);
      showToast(`${cat.name} ${cat.is_active ? 'disabled' : 'enabled'}.`, 'success');
      loadAdminOverview();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Update failed.', 'error');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="pb-6 border-b border-[#202820]/10">
        <p className="text-xs font-semibold text-[#174C3A]">Admin Moderation Console</p>
        <h1 className="font-heading text-2xl sm:text-3xl font-bold text-[#202820] mt-1">
          Platform Operations & Safety
        </h1>
        <p className="text-sm text-[#202820]/70 mt-1">
          Server-verified admin workspace for moderating properties, reviewing reports, and managing categories.
        </p>
      </div>

      {/* Platform Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-[#202820]/10">
            <p className="text-xs text-[#202820]/60">Total Users</p>
            <p className="font-heading text-2xl font-bold text-[#202820] tabular-nums mt-1">
              {stats.totalUsers}
            </p>
            <p className="text-xs text-[#202820]/60 mt-1 tabular-nums">
              {stats.totalStudents} students · {stats.totalOwners} owners
            </p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-[#202820]/10">
            <p className="text-xs text-[#202820]/60">Properties</p>
            <p className="font-heading text-2xl font-bold text-[#174C3A] tabular-nums mt-1">
              {stats.totalProperties}
            </p>
            <p className="text-xs text-[#202820]/60 mt-1 tabular-nums">
              {stats.pendingModeration} pending review
            </p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-[#202820]/10">
            <p className="text-xs text-[#202820]/60">Enquiries</p>
            <p className="font-heading text-2xl font-bold text-[#202820] tabular-nums mt-1">
              {stats.totalEnquiries}
            </p>
            <p className="text-xs text-[#202820]/60 mt-1">Student-owner threads</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-[#202820]/10">
            <p className="text-xs text-[#202820]/60">Open Reports</p>
            <p className="font-heading text-2xl font-bold text-[#B91C1C] tabular-nums mt-1">
              {stats.openReports}
            </p>
            <p className="text-xs text-[#202820]/60 mt-1">Flagged by users</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-[#202820]/10 pb-3">
        {(
          [
            ['properties', `Properties (${properties.length})`],
            ['reports', `Reports (${reports.length})`],
            ['users', `Users & Owners (${users.length})`],
            ['enquiries', `Enquiries (${enquiries.length})`],
            ['categories', `Categories (${categories.length})`],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer ${
              tab === key
                ? 'bg-[#174C3A] text-white'
                : 'bg-white text-[#202820] border border-[#202820]/10'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="h-48 rounded-2xl bg-white border border-[#202820]/10 animate-pulse" />
      ) : tab === 'properties' ? (
        <div className="bg-white rounded-2xl border border-[#202820]/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#F3F5EF] border-b border-[#202820]/10 text-xs font-semibold text-[#202820]/75">
                <tr>
                  <th className="px-5 py-3.5">Title & Locality</th>
                  <th className="px-5 py-3.5">Rent</th>
                  <th className="px-5 py-3.5">Source</th>
                  <th className="px-5 py-3.5">Moderation</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#202820]/10">
                {properties.map((p) => (
                  <tr key={p.id}>
                    <td className="px-5 py-4">
                      <Link
                        to={`/property/${p.id}`}
                        className="font-semibold text-[#202820] hover:text-[#174C3A]"
                      >
                        {p.title}
                      </Link>
                      <p className="text-xs text-[#202820]/60">
                        {p.property_type} · {p.locality}
                      </p>
                    </td>
                    <td className="px-5 py-4 tabular-nums font-medium">
                      {formatINR(p.monthly_rent)}/mo
                    </td>
                    <td className="px-5 py-4 text-xs">
                      {p.is_demo ? 'DEMO' : p.owner_name || 'Owner'}
                    </td>
                    <td className="px-5 py-4 text-xs font-semibold capitalize">
                      {p.moderation_status}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleModerate(p.id, 'approved')}
                          title="Approve listing"
                          className="p-2 rounded-lg border border-[#202820]/10 text-[#174C3A] hover:bg-[#ECFDF5] cursor-pointer"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleModerate(p.id, 'rejected')}
                          title="Reject listing"
                          className="p-2 rounded-lg border border-[#202820]/10 text-[#B45309] hover:bg-[#FEF3C7] cursor-pointer"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteProperty(p.id)}
                          title="Delete listing"
                          className="p-2 rounded-lg border border-[#202820]/10 text-[#B91C1C] hover:bg-[#FEF2F2] cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : tab === 'reports' ? (
        <div className="bg-white rounded-2xl border border-[#202820]/10 overflow-hidden">
          {reports.length === 0 ? (
            <p className="p-8 text-sm text-[#202820]/70">No reported listings yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#F3F5EF] border-b border-[#202820]/10 text-xs font-semibold text-[#202820]/75">
                  <tr>
                    <th className="px-5 py-3.5">Property</th>
                    <th className="px-5 py-3.5">Reason & Notes</th>
                    <th className="px-5 py-3.5">Reporter</th>
                    <th className="px-5 py-3.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#202820]/10">
                  {reports.map((r) => (
                    <tr key={r.id}>
                      <td className="px-5 py-4 font-semibold">{r.property_title}</td>
                      <td className="px-5 py-4">
                        <p className="font-medium">{r.reason}</p>
                        {r.details && <p className="text-xs text-[#202820]/65">{r.details}</p>}
                      </td>
                      <td className="px-5 py-4 text-xs">{r.reporter_name}</td>
                      <td className="px-5 py-4">
                        <select
                          aria-label="Report status"
                          value={r.status}
                          onChange={(e) => handleReportUpdate(r.id, e.target.value as ReportStatus)}
                          className="px-2.5 py-1.5 rounded-lg bg-[#F3F5EF] border border-[#202820]/15 text-xs font-semibold capitalize"
                        >
                          <option value="open">Open</option>
                          <option value="reviewed">Reviewed</option>
                          <option value="resolved">Resolved</option>
                          <option value="dismissed">Dismissed</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : tab === 'users' ? (
        <div className="bg-white rounded-2xl border border-[#202820]/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#F3F5EF] border-b border-[#202820]/10 text-xs font-semibold text-[#202820]/75">
                <tr>
                  <th className="px-5 py-3.5">Name</th>
                  <th className="px-5 py-3.5">Email</th>
                  <th className="px-5 py-3.5">Role</th>
                  <th className="px-5 py-3.5">College / Location</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#202820]/10">
                {users.map((u) => (
                  <tr key={u.id}>
                    <td className="px-5 py-4 font-semibold">{u.full_name}</td>
                    <td className="px-5 py-4 text-xs">{u.email}</td>
                    <td className="px-5 py-4 text-xs font-semibold capitalize text-[#174C3A]">
                      {u.role}
                    </td>
                    <td className="px-5 py-4 text-xs text-[#202820]/70">
                      {u.college || u.preferred_location || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : tab === 'enquiries' ? (
        <div className="bg-white rounded-2xl border border-[#202820]/10 overflow-hidden">
          {enquiries.length === 0 ? (
            <p className="p-8 text-sm text-[#202820]/70">No enquiries recorded yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#F3F5EF] border-b border-[#202820]/10 text-xs font-semibold text-[#202820]/75">
                  <tr>
                    <th className="px-5 py-3.5">Student</th>
                    <th className="px-5 py-3.5">Property</th>
                    <th className="px-5 py-3.5">Message</th>
                    <th className="px-5 py-3.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#202820]/10">
                  {enquiries.map((e) => (
                    <tr key={e.id}>
                      <td className="px-5 py-4 font-medium">{e.student_name}</td>
                      <td className="px-5 py-4">{e.property_title}</td>
                      <td className="px-5 py-4 max-w-sm truncate">{e.message}</td>
                      <td className="px-5 py-4 text-xs font-semibold capitalize">{e.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-white rounded-2xl border border-[#202820]/10 overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#F3F5EF] border-b border-[#202820]/10 text-xs font-semibold text-[#202820]/75">
                <tr>
                  <th className="px-5 py-3.5">Category</th>
                  <th className="px-5 py-3.5">Description</th>
                  <th className="px-5 py-3.5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#202820]/10">
                {categories.map((cat) => (
                  <tr key={cat.id}>
                    <td className="px-5 py-4 font-semibold">{cat.name}</td>
                    <td className="px-5 py-4 text-xs text-[#202820]/70">{cat.description || '—'}</td>
                    <td className="px-5 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleToggleCategory(cat)}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                          cat.is_active
                            ? 'bg-[#ECFDF5] text-[#174C3A]'
                            : 'bg-[#F3F5EF] text-[#202820]/60'
                        }`}
                      >
                        {cat.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <form
            onSubmit={handleCreateCategory}
            className="lg:col-span-5 bg-white rounded-2xl border border-[#202820]/10 p-6 space-y-4 self-start"
          >
            <h2 className="font-heading text-base font-semibold text-[#202820]">
              Add Accommodation Category
            </h2>
            <div>
              <label htmlFor="cat-name" className="block text-xs font-semibold text-[#202820]/75 mb-1">
                Category Name
              </label>
              <input
                id="cat-name"
                type="text"
                required
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="e.g. Co-Living"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#F3F5EF] border border-[#202820]/10 text-sm"
              />
            </div>
            <div>
              <label htmlFor="cat-desc" className="block text-xs font-semibold text-[#202820]/75 mb-1">
                Short Description
              </label>
              <textarea
                id="cat-desc"
                rows={2}
                value={newCatDesc}
                onChange={(e) => setNewCatDesc(e.target.value)}
                placeholder="Describe this stay category…"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#F3F5EF] border border-[#202820]/10 text-sm"
              />
            </div>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#174C3A] text-white text-sm font-semibold cursor-pointer"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
              Add Category
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

'use client';

import React, { useState, useMemo } from 'react';
import {
  Truck,
  Bike,
  Plus,
  Search,
  Phone,
  CheckCircle2,
  Clock,
  IndianRupee,
  MapPin,
  AlertCircle,
  MoreVertical,
  Shield,
  Trash2,
  Edit2,
  Navigation,
} from 'lucide-react';
import { PageHeader } from './PageHeader';
import { StatCard } from '../ui/StatCard';
import { SearchInput, Input, Select, Toggle } from '../ui/FormControls';
import { StatusBadge } from '../ui/StatusBadge';
import { Button } from '../ui/Button';
import { Modal, ConfirmationDialog } from '../ui/Overlays';
import { Avatar, EmptyState } from '../ui/Miscellaneous';

export interface RiderProfile {
  id: string;
  name: string;
  phone: string;
  vehicle: string;
  vehiclePlate: string;
  status: 'available' | 'delivering' | 'offline';
  activeOrdersCount: number;
  completedToday: number;
  codCollected: number;
  joinedDate: string;
}

export interface AdminRidersViewProps {
  orders: any[];
  onAssignOrderToRider?: (orderId: string, rider: RiderProfile) => void;
  onNavigateToOrders?: () => void;
}

// Initial demo fleet (retaining realistic Madurai delivery roster)
const INITIAL_RIDERS: RiderProfile[] = [
  {
    id: 'rider-01',
    name: 'Muthu Kumar',
    phone: '9842198421',
    vehicle: 'Hero Splendor',
    vehiclePlate: 'TN-59-AB-1234',
    status: 'delivering',
    activeOrdersCount: 2,
    completedToday: 14,
    codCollected: 3820,
    joinedDate: '2024-02-15',
  },
  {
    id: 'rider-02',
    name: 'Karthik Raja',
    phone: '9789097890',
    vehicle: 'TVS Jupiter',
    vehiclePlate: 'TN-58-XY-9876',
    status: 'available',
    activeOrdersCount: 0,
    completedToday: 11,
    codCollected: 2450,
    joinedDate: '2024-04-01',
  },
  {
    id: 'rider-03',
    name: 'Senthil Nathan',
    phone: '9944099440',
    vehicle: 'Honda Activa',
    vehiclePlate: 'TN-59-CZ-4321',
    status: 'available',
    activeOrdersCount: 0,
    completedToday: 9,
    codCollected: 1980,
    joinedDate: '2024-05-10',
  },
  {
    id: 'rider-04',
    name: 'Vigneshwaran P.',
    phone: '9843398433',
    vehicle: 'Bajaj Pulsar',
    vehiclePlate: 'TN-59-DE-5566',
    status: 'offline',
    activeOrdersCount: 0,
    completedToday: 6,
    codCollected: 1200,
    joinedDate: '2024-06-20',
  },
];

export const AdminRidersView: React.FC<AdminRidersViewProps> = ({
  orders = [],
  onAssignOrderToRider,
  onNavigateToOrders,
}) => {
  const [riders, setRiders] = useState<RiderProfile[]>(INITIAL_RIDERS);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'available' | 'delivering' | 'offline'>('all');

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingRider, setEditingRider] = useState<RiderProfile | null>(null);
  const [deleteRiderId, setDeleteRiderId] = useState<string | null>(null);

  // Form state for add/edit
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    vehicle: 'Hero Splendor',
    vehiclePlate: '',
    status: 'available' as 'available' | 'delivering' | 'offline',
  });
  const [formError, setFormError] = useState('');

  // Fleet Overview Metrics
  const metrics = useMemo(() => {
    const totalRiders = riders.length;
    const activeOnDuty = riders.filter((r) => r.status !== 'offline').length;
    const currentlyDelivering = riders.filter((r) => r.status === 'delivering').length;
    const totalCompleted = riders.reduce((acc, r) => acc + r.completedToday, 0);
    const totalCod = riders.reduce((acc, r) => acc + r.codCollected, 0);

    return { totalRiders, activeOnDuty, currentlyDelivering, totalCompleted, totalCod };
  }, [riders]);

  // Filtered Riders
  const filteredRiders = useMemo(() => {
    return riders.filter((r) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        r.name.toLowerCase().includes(q) ||
        r.phone.includes(q) ||
        r.vehiclePlate.toLowerCase().includes(q);

      if (!matchesSearch) return false;
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      return true;
    });
  }, [riders, searchQuery, statusFilter]);

  const handleOpenAdd = () => {
    setEditingRider(null);
    setFormData({
      name: '',
      phone: '',
      vehicle: 'Hero Splendor',
      vehiclePlate: 'TN-59-',
      status: 'available',
    });
    setFormError('');
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (rider: RiderProfile) => {
    setEditingRider(rider);
    setFormData({
      name: rider.name,
      phone: rider.phone,
      vehicle: rider.vehicle,
      vehiclePlate: rider.vehiclePlate,
      status: rider.status,
    });
    setFormError('');
    setIsAddModalOpen(true);
  };

  const handleSaveRider = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setFormError('Please enter rider full name.');
      return;
    }
    const cleanPhone = formData.phone.replace(/[^0-9]/g, '');
    if (cleanPhone.length < 10) {
      setFormError('Please enter a valid 10-digit mobile number.');
      return;
    }

    if (editingRider) {
      setRiders((prev) =>
        prev.map((r) =>
          r.id === editingRider.id
            ? {
                ...r,
                name: formData.name.trim(),
                phone: cleanPhone,
                vehicle: formData.vehicle,
                vehiclePlate: formData.vehiclePlate.trim().toUpperCase(),
                status: formData.status,
              }
            : r
        )
      );
    } else {
      const newRider: RiderProfile = {
        id: `rider-${Date.now()}`,
        name: formData.name.trim(),
        phone: cleanPhone,
        vehicle: formData.vehicle,
        vehiclePlate: formData.vehiclePlate.trim().toUpperCase() || 'TN-59-APPLIED',
        status: formData.status,
        activeOrdersCount: 0,
        completedToday: 0,
        codCollected: 0,
        joinedDate: new Date().toISOString().split('T')[0],
      };
      setRiders((prev) => [newRider, ...prev]);
    }

    setIsAddModalOpen(false);
  };

  const handleToggleStatus = (id: string) => {
    setRiders((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const nextStatus = r.status === 'offline' ? 'available' : 'offline';
        return { ...r, status: nextStatus };
      })
    );
  };

  const handleDeleteRider = () => {
    if (!deleteRiderId) return;
    setRiders((prev) => prev.filter((r) => r.id !== deleteRiderId));
    setDeleteRiderId(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Rider Fleet & Logistics"
        subtitle="Manage store delivery riders, monitor real-time availability, and reconcile daily cash on delivery."
        actions={
          <Button variant="primary" size="md" onClick={handleOpenAdd} className="gap-2">
            <Plus className="w-4 h-4" /> Add Delivery Rider
          </Button>
        }
      />

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="On-Duty Fleet"
          value={`${metrics.activeOnDuty} / ${metrics.totalRiders}`}
          icon={<Bike className="w-5 h-5 text-[#143B0D]" />}
          description="Available or delivering"
        />
        <StatCard
          label="Orders In Transit"
          value={metrics.currentlyDelivering}
          icon={<Navigation className="w-5 h-5 text-[#0047BF]" />}
          description="Active deliveries on road"
        />
        <StatCard
          label="Deliveries Completed"
          value={metrics.totalCompleted}
          icon={<CheckCircle2 className="w-5 h-5 text-[#047857]" />}
          description="Total settled runs today"
        />
        <StatCard
          label="COD Cash In Fleet"
          value={`₹${metrics.totalCod.toLocaleString('en-IN')}`}
          icon={<IndianRupee className="w-5 h-5 text-[#D97706]" />}
          description="Pending dock reconciliation"
        />
      </div>

      {/* Controls Bar: Search & Status Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="flex-1 max-w-md">
          <SearchInput
            placeholder="Search by rider name, phone, or license plate..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onClear={() => setSearchQuery('')}
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
              statusFilter === 'all'
                ? 'bg-[#143B0D] text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Fleet ({riders.length})
          </button>
          <button
            onClick={() => setStatusFilter('available')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
              statusFilter === 'available'
                ? 'bg-[#047857] text-white shadow-xs'
                : 'bg-emerald-50 text-[#047857] hover:bg-emerald-100 border border-emerald-200/50'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-[#047857]" /> Available at Dock
          </button>
          <button
            onClick={() => setStatusFilter('delivering')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
              statusFilter === 'delivering'
                ? 'bg-[#0047BF] text-white shadow-xs'
                : 'bg-blue-50 text-[#0047BF] hover:bg-blue-100 border border-blue-200/50'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-[#0047BF]" /> On Delivery
          </button>
          <button
            onClick={() => setStatusFilter('offline')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
              statusFilter === 'offline'
                ? 'bg-slate-700 text-white shadow-xs'
                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
            }`}
          >
            Offline
          </button>
        </div>
      </div>

      {/* Roster Table / Card List */}
      {filteredRiders.length === 0 ? (
        <EmptyState
          title="No delivery riders found"
          description="Try broadening your search term or add a new rider to the fleet roster."
          action={
            <Button variant="outline" size="sm" onClick={() => setSearchQuery('')}>
              Clear Search Filter
            </Button>
          }
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#F8FAF7] border-b border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-wider font-mono">
                <tr>
                  <th className="py-3.5 px-4">Rider Details</th>
                  <th className="py-3.5 px-4">Phone Contact</th>
                  <th className="py-3.5 px-4">Assigned Vehicle</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-center">Active Orders</th>
                  <th className="py-3.5 px-4 text-center">Runs Done</th>
                  <th className="py-3.5 px-4 text-right">Cash in Hand</th>
                  <th className="py-3.5 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredRiders.map((r) => {
                  return (
                    <tr key={r.id} className="hover:bg-[#F8FAF7]/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <Avatar name={r.name} size="md" />
                          <div className="min-w-0">
                            <span className="font-bold text-[#0F172A] block truncate">{r.name}</span>
                            <span className="text-xs text-slate-400 font-mono block">ID: {r.id}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-semibold text-slate-700">{r.phone}</span>
                          <a
                            href={`tel:${r.phone}`}
                            title="Call Rider"
                            className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-[#F1F9EC] hover:text-[#143B0D] flex items-center justify-center text-slate-600 transition-colors"
                          >
                            <Phone className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="text-xs text-slate-800 font-semibold block">{r.vehicle}</span>
                        <span className="text-[11px] text-slate-400 font-mono block uppercase">
                          {r.vehiclePlate}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                            r.status === 'available'
                              ? 'bg-emerald-50 text-[#047857] border border-emerald-200/60'
                              : r.status === 'delivering'
                              ? 'bg-blue-50 text-[#0047BF] border border-blue-200/60'
                              : 'bg-slate-100 text-slate-500 border border-slate-200'
                          }`}
                        >
                          <span
                            className={`w-2 h-2 rounded-full ${
                              r.status === 'available'
                                ? 'bg-[#047857]'
                                : r.status === 'delivering'
                                ? 'bg-[#0047BF]'
                                : 'bg-slate-400'
                            }`}
                          />
                          {r.status === 'available'
                            ? 'Available at Dock'
                            : r.status === 'delivering'
                            ? 'On Delivery'
                            : 'Offline'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center justify-center px-2 py-0.5 rounded-lg text-xs font-bold font-mono ${
                            r.activeOrdersCount > 0
                              ? 'bg-[#DBE1FF] text-[#0047BF]'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {r.activeOrdersCount}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className="font-mono font-bold text-xs text-slate-700">
                          {r.completedToday}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <span className="font-mono font-bold text-sm text-[#0F172A] tabular-nums">
                          ₹{r.codCollected.toLocaleString('en-IN')}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleToggleStatus(r.id)}
                            title={r.status === 'offline' ? 'Set Online' : 'Set Offline'}
                            className={`px-2 py-1 rounded-lg text-xs font-bold border transition-colors ${
                              r.status === 'offline'
                                ? 'bg-emerald-50 text-[#047857] border-emerald-200 hover:bg-emerald-100'
                                : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                            }`}
                          >
                            {r.status === 'offline' ? 'Go Online' : 'Set Off'}
                          </button>
                          <button
                            onClick={() => handleOpenEdit(r)}
                            title="Edit rider details"
                            className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteRiderId(r.id)}
                            title="Remove rider"
                            className="w-7 h-7 rounded-lg hover:bg-rose-50 flex items-center justify-center text-slate-400 hover:text-[#BA1A1A] transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List View */}
          <div className="md:hidden divide-y divide-slate-100">
            {filteredRiders.map((r) => {
              return (
                <div key={r.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={r.name} size="md" />
                      <div>
                        <h4 className="text-sm font-bold text-[#0F172A]">{r.name}</h4>
                        <p className="text-xs text-slate-500 font-mono flex items-center gap-1.5 mt-0.5">
                          <span>{r.vehicle}</span> • <span>{r.vehiclePlate}</span>
                        </p>
                      </div>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                        r.status === 'available'
                          ? 'bg-emerald-50 text-[#047857]'
                          : r.status === 'delivering'
                          ? 'bg-blue-50 text-[#0047BF]'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          r.status === 'available'
                            ? 'bg-[#047857]'
                            : r.status === 'delivering'
                            ? 'bg-[#0047BF]'
                            : 'bg-slate-400'
                        }`}
                      />
                      {r.status === 'available' ? 'Dock Ready' : r.status === 'delivering' ? 'En Route' : 'Offline'}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 bg-[#F8FAF7] p-2.5 rounded-xl border border-slate-100 text-center">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-mono">In Transit</span>
                      <span className="text-xs font-bold text-slate-800 font-mono">
                        {r.activeOrdersCount}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-mono">Runs Done</span>
                      <span className="text-xs font-bold text-slate-800 font-mono">
                        {r.completedToday}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-mono">Cash Held</span>
                      <span className="text-xs font-bold text-[#143B0D] font-mono">
                        ₹{r.codCollected}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <a
                      href={`tel:${r.phone}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold hover:bg-[#F1F9EC]"
                    >
                      <Phone className="w-3.5 h-3.5 text-[#143B0D]" /> Call {r.phone}
                    </a>

                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(r)}>
                        Edit
                      </Button>
                      <button
                        onClick={() => handleToggleStatus(r.id)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors ${
                          r.status === 'offline'
                            ? 'bg-emerald-50 text-[#047857] border-emerald-200'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                      >
                        {r.status === 'offline' ? 'Set Online' : 'Set Off'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add / Edit Rider Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={editingRider ? 'Edit Rider Information' : 'Register New Store Rider'}
        size="md"
      >
        <form onSubmit={handleSaveRider} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-xl bg-[#FFDAD6] text-[#BA1A1A] text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Full Name (ஆள் பெயர்) *
            </label>
            <Input
              placeholder="e.g. Manikandan S."
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Mobile Contact Number *
            </label>
            <Input
              type="tel"
              placeholder="10-digit phone (e.g. 9842100000)"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Vehicle Model</label>
              <Input
                placeholder="e.g. TVS Jupiter"
                value={formData.vehicle}
                onChange={(e) => setFormData({ ...formData, vehicle: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                License Plate (TN)
              </label>
              <Input
                placeholder="e.g. TN-59-AB-1234"
                value={formData.vehiclePlate}
                onChange={(e) => setFormData({ ...formData, vehiclePlate: e.target.value.toUpperCase() })}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Shift Availability</label>
            <select
              value={formData.status}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  status: e.target.value as 'available' | 'delivering' | 'offline',
                })
              }
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#76CA3E]"
            >
              <option value="available">Available at Dock (Ready for pickup)</option>
              <option value="delivering">On Delivery Route</option>
              <option value="offline">Offline / Off-Duty</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <Button variant="ghost" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              {editingRider ? 'Save Changes' : 'Register Rider'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Rider Confirmation */}
      <ConfirmationDialog
        isOpen={Boolean(deleteRiderId)}
        onClose={() => setDeleteRiderId(null)}
        onConfirm={handleDeleteRider}
        title="Remove Rider from Fleet?"
        description="Are you sure you want to remove this rider from the active dispatch system? Past completed delivery logs will remain preserved in historical orders."
        confirmLabel="Remove Rider"
        cancelLabel="Keep Rider"
        variant="danger"
      />
    </div>
  );
};

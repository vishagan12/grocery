'use client';

import React, { useState } from 'react';
import {
  MapPin,
  Clock,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Truck,
  IndianRupee,
  Layers,
  Sparkles,
  ShieldCheck,
  Compass,
} from 'lucide-react';
import { PageHeader } from './PageHeader';
import { StatCard } from '../ui/StatCard';
import { Input, Toggle } from '../ui/FormControls';
import { Button } from '../ui/Button';
import { Modal, ConfirmationDialog } from '../ui/Overlays';
import { EmptyState } from '../ui/Miscellaneous';

export interface DeliveryZone {
  id: string;
  nameEn: string;
  nameTa: string;
  distanceKm: number;
  deliveryFee: number;
  minOrder: number;
  freeDeliveryThreshold: number;
  estimatedMins: string;
  active: boolean;
}

export interface DeliverySlot {
  id: string;
  label: string;
  timeWindow: string;
  maxCapacity: number;
  currentBookings: number;
  cutoffMins: number;
  active: boolean;
}

const INITIAL_ZONES: DeliveryZone[] = [
  {
    id: 'zone-pudur',
    nameEn: 'K.Pudur & Alagar Kovil Rd (Store Base)',
    nameTa: 'கே.புதூர் • அழகர் கோவில் சாலை',
    distanceKm: 2.0,
    deliveryFee: 15,
    minOrder: 150,
    freeDeliveryThreshold: 499,
    estimatedMins: '15 - 25 mins',
    active: true,
  },
  {
    id: 'zone-tallakulam',
    nameEn: 'Tallakulam & Outpost',
    nameTa: 'தல்லாகுளம் • அவுட்போஸ்ட்',
    distanceKm: 3.5,
    deliveryFee: 25,
    minOrder: 200,
    freeDeliveryThreshold: 599,
    estimatedMins: '25 - 35 mins',
    active: true,
  },
  {
    id: 'zone-annanagar',
    nameEn: 'Anna Nagar & KK Nagar',
    nameTa: 'அண்ணா நகர் • கே.கே.நகர்',
    distanceKm: 4.8,
    deliveryFee: 30,
    minOrder: 250,
    freeDeliveryThreshold: 699,
    estimatedMins: '30 - 45 mins',
    active: true,
  },
  {
    id: 'zone-goripalayam',
    nameEn: 'Goripalayam & Simmakkal',
    nameTa: 'கோரிப்பாளையம் • சிம்மக்கல்',
    distanceKm: 5.5,
    deliveryFee: 35,
    minOrder: 300,
    freeDeliveryThreshold: 799,
    estimatedMins: '35 - 50 mins',
    active: true,
  },
  {
    id: 'zone-mattuthavani',
    nameEn: 'Mattuthavani & Flower Market',
    nameTa: 'மாட்டுத்தாவணி • மலர் சந்தை',
    distanceKm: 3.0,
    deliveryFee: 20,
    minOrder: 200,
    freeDeliveryThreshold: 499,
    estimatedMins: '20 - 30 mins',
    active: true,
  },
  {
    id: 'zone-iyerbungalow',
    nameEn: 'Iyer Bungalow & Surveyor Colony',
    nameTa: 'ஐயர் பங்களா • சர்வேயர் காலனி',
    distanceKm: 4.2,
    deliveryFee: 30,
    minOrder: 250,
    freeDeliveryThreshold: 699,
    estimatedMins: '30 - 40 mins',
    active: true,
  },
];

const INITIAL_SLOTS: DeliverySlot[] = [
  {
    id: 'slot-express',
    label: '⚡ Express Priority Dispatch',
    timeWindow: '15 - 30 Minutes',
    maxCapacity: 40,
    currentBookings: 18,
    cutoffMins: 0,
    active: true,
  },
  {
    id: 'slot-morning',
    label: 'Morning Slot (காலை)',
    timeWindow: '07:00 AM - 10:00 AM',
    maxCapacity: 30,
    currentBookings: 24,
    cutoffMins: 60,
    active: true,
  },
  {
    id: 'slot-afternoon',
    label: 'Afternoon Slot (மதியம்)',
    timeWindow: '01:00 PM - 04:00 PM',
    maxCapacity: 25,
    currentBookings: 12,
    cutoffMins: 60,
    active: true,
  },
  {
    id: 'slot-evening',
    label: 'Evening Rush (மாலை)',
    timeWindow: '05:00 PM - 09:00 PM',
    maxCapacity: 50,
    currentBookings: 39,
    cutoffMins: 45,
    active: true,
  },
];

export const AdminZonesSlotsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'zones' | 'slots'>('zones');
  const [zones, setZones] = useState<DeliveryZone[]>(INITIAL_ZONES);
  const [slots, setSlots] = useState<DeliverySlot[]>(INITIAL_SLOTS);

  // Zone Modal State
  const [isZoneModalOpen, setIsZoneModalOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<DeliveryZone | null>(null);
  const [zoneFormData, setZoneFormData] = useState({
    nameEn: '',
    nameTa: '',
    distanceKm: 3.0,
    deliveryFee: 20,
    minOrder: 200,
    freeDeliveryThreshold: 499,
    estimatedMins: '20 - 30 mins',
    active: true,
  });

  // Slot Modal State
  const [isSlotModalOpen, setIsSlotModalOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<DeliverySlot | null>(null);
  const [slotFormData, setSlotFormData] = useState({
    label: '',
    timeWindow: '',
    maxCapacity: 30,
    cutoffMins: 45,
    active: true,
  });

  // Confirmation Delete
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'zone' | 'slot'; id: string } | null>(null);

  // Toggle zone active
  const handleToggleZone = (id: string) => {
    setZones((prev) =>
      prev.map((z) => (z.id === id ? { ...z, active: !z.active } : z))
    );
  };

  // Toggle slot active
  const handleToggleSlot = (id: string) => {
    setSlots((prev) =>
      prev.map((s) => (s.id === id ? { ...s, active: !s.active } : s))
    );
  };

  // Open Add Zone
  const handleOpenAddZone = () => {
    setEditingZone(null);
    setZoneFormData({
      nameEn: '',
      nameTa: '',
      distanceKm: 3.0,
      deliveryFee: 20,
      minOrder: 200,
      freeDeliveryThreshold: 499,
      estimatedMins: '20 - 30 mins',
      active: true,
    });
    setIsZoneModalOpen(true);
  };

  // Open Edit Zone
  const handleOpenEditZone = (zone: DeliveryZone) => {
    setEditingZone(zone);
    setZoneFormData({
      nameEn: zone.nameEn,
      nameTa: zone.nameTa,
      distanceKm: zone.distanceKm,
      deliveryFee: zone.deliveryFee,
      minOrder: zone.minOrder,
      freeDeliveryThreshold: zone.freeDeliveryThreshold,
      estimatedMins: zone.estimatedMins,
      active: zone.active,
    });
    setIsZoneModalOpen(true);
  };

  // Save Zone
  const handleSaveZone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!zoneFormData.nameEn.trim()) return;

    if (editingZone) {
      setZones((prev) =>
        prev.map((z) =>
          z.id === editingZone.id
            ? {
                ...z,
                ...zoneFormData,
                nameEn: zoneFormData.nameEn.trim(),
                nameTa: zoneFormData.nameTa.trim(),
              }
            : z
        )
      );
    } else {
      const newZone: DeliveryZone = {
        id: `zone-${Date.now()}`,
        ...zoneFormData,
        nameEn: zoneFormData.nameEn.trim(),
        nameTa: zoneFormData.nameTa.trim(),
      };
      setZones((prev) => [...prev, newZone]);
    }
    setIsZoneModalOpen(false);
  };

  // Open Add Slot
  const handleOpenAddSlot = () => {
    setEditingSlot(null);
    setSlotFormData({
      label: '',
      timeWindow: '',
      maxCapacity: 30,
      cutoffMins: 45,
      active: true,
    });
    setIsSlotModalOpen(true);
  };

  // Open Edit Slot
  const handleOpenEditSlot = (slot: DeliverySlot) => {
    setEditingSlot(slot);
    setSlotFormData({
      label: slot.label,
      timeWindow: slot.timeWindow,
      maxCapacity: slot.maxCapacity,
      cutoffMins: slot.cutoffMins,
      active: slot.active,
    });
    setIsSlotModalOpen(true);
  };

  // Save Slot
  const handleSaveSlot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!slotFormData.label.trim()) return;

    if (editingSlot) {
      setSlots((prev) =>
        prev.map((s) =>
          s.id === editingSlot.id
            ? {
                ...s,
                ...slotFormData,
                label: slotFormData.label.trim(),
                timeWindow: slotFormData.timeWindow.trim(),
              }
            : s
        )
      );
    } else {
      const newSlot: DeliverySlot = {
        id: `slot-${Date.now()}`,
        ...slotFormData,
        label: slotFormData.label.trim(),
        timeWindow: slotFormData.timeWindow.trim(),
        currentBookings: 0,
      };
      setSlots((prev) => [...prev, newSlot]);
    }
    setIsSlotModalOpen(false);
  };

  const handleDelete = () => {
    if (!deleteConfirm) return;
    if (deleteConfirm.type === 'zone') {
      setZones((prev) => prev.filter((z) => z.id !== deleteConfirm.id));
    } else {
      setSlots((prev) => prev.filter((s) => s.id !== deleteConfirm.id));
    }
    setDeleteConfirm(null);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Delivery Zones & Time Slots"
        subtitle="Configure hyper-local Madurai geofence zones, delivery fee tiers, and capacity-limited dispatch time slots."
        actions={
          <div className="flex items-center gap-2">
            {activeTab === 'zones' ? (
              <Button variant="primary" size="md" onClick={handleOpenAddZone} className="gap-2">
                <Plus className="w-4 h-4" /> Add Geofenced Zone
              </Button>
            ) : (
              <Button variant="primary" size="md" onClick={handleOpenAddSlot} className="gap-2">
                <Plus className="w-4 h-4" /> Add Delivery Time Slot
              </Button>
            )}
          </div>
        }
      />

      {/* KPI Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Active Delivery Zones"
          value={`${zones.filter((z) => z.active).length} / ${zones.length}`}
          icon={<MapPin className="w-5 h-5 text-[#143B0D]" />}
          description="Serviceable Madurai radius"
        />
        <StatCard
          label="Base Delivery Fee"
          value="₹15"
          icon={<IndianRupee className="w-5 h-5 text-[#047857]" />}
          description="K.Pudur & 2km radius"
        />
        <StatCard
          label="Active Time Slots"
          value={`${slots.filter((s) => s.active).length} / ${slots.length}`}
          icon={<Clock className="w-5 h-5 text-[#0047BF]" />}
          description="Express & scheduled windows"
        />
        <StatCard
          label="Slot Utilization Today"
          value={`${Math.round(
            (slots.reduce((a, s) => a + s.currentBookings, 0) /
              Math.max(1, slots.reduce((a, s) => a + s.maxCapacity, 0))) *
              100
          )}%`}
          icon={<Layers className="w-5 h-5 text-[#D97706]" />}
          description="Bookings vs total daily cap"
        />
      </div>

      {/* Tab Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('zones')}
          className={`pb-3 px-4 font-bold text-sm transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'zones'
              ? 'border-[#76CA3E] text-[#143B0D]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Compass className="w-4 h-4" />
          <span>Geofenced Zones ({zones.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('slots')}
          className={`pb-3 px-4 font-bold text-sm transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'slots'
              ? 'border-[#76CA3E] text-[#143B0D]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Dispatch Time Windows ({slots.length})</span>
        </button>
      </div>

      {/* Tab Content: Zones */}
      {activeTab === 'zones' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#F8FAF7] border-b border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-wider font-mono">
                <tr>
                  <th className="py-3.5 px-4">Zone & Locality</th>
                  <th className="py-3.5 px-4 text-center">Radius</th>
                  <th className="py-3.5 px-4 text-right">Delivery Fee</th>
                  <th className="py-3.5 px-4 text-right">Min Order</th>
                  <th className="py-3.5 px-4 text-right">Free Delivery Over</th>
                  <th className="py-3.5 px-4 text-center">Typical ETA</th>
                  <th className="py-3.5 px-4 text-center">Active Status</th>
                  <th className="py-3.5 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {zones.map((zone) => (
                  <tr key={zone.id} className="hover:bg-[#F8FAF7]/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div>
                        <span className="font-bold text-[#0F172A] block">{zone.nameEn}</span>
                        {zone.nameTa && (
                          <span className="text-xs text-slate-500 font-medium block">
                            {zone.nameTa}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-slate-100 text-xs font-bold font-mono text-slate-700">
                        {zone.distanceKm} km
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                      ₹{zone.deliveryFee}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono text-slate-700">
                      ₹{zone.minOrder}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono font-semibold text-[#047857]">
                      ₹{zone.freeDeliveryThreshold}
                    </td>

                    <td className="py-3.5 px-4 text-center text-xs font-mono text-slate-600">
                      {zone.estimatedMins}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => handleToggleZone(zone.id)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition-all ${
                          zone.active
                            ? 'bg-emerald-50 text-[#047857] border border-emerald-200/60'
                            : 'bg-slate-100 text-slate-400 border border-slate-200'
                        }`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${
                            zone.active ? 'bg-[#047857]' : 'bg-slate-400'
                          }`}
                        />
                        {zone.active ? 'Active' : 'Paused'}
                      </button>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleOpenEditZone(zone)}
                          className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm({ type: 'zone', id: zone.id })}
                          className="w-7 h-7 rounded-lg hover:bg-rose-50 flex items-center justify-center text-slate-400 hover:text-[#BA1A1A] transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab Content: Slots */}
      {activeTab === 'slots' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {slots.map((slot) => {
            const isFull = slot.currentBookings >= slot.maxCapacity;
            return (
              <div
                key={slot.id}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4 hover:border-[#76CA3E]/50 transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-extrabold text-[#0F172A] text-base">{slot.label}</h3>
                    <p className="text-xs text-slate-500 font-mono mt-0.5 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {slot.timeWindow}
                    </p>
                  </div>

                  <button
                    onClick={() => handleToggleSlot(slot.id)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition-all ${
                      slot.active
                        ? 'bg-emerald-50 text-[#047857] border border-emerald-200/60'
                        : 'bg-slate-100 text-slate-400 border border-slate-200'
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        slot.active ? 'bg-[#047857]' : 'bg-slate-400'
                      }`}
                    />
                    {slot.active ? 'Accepting' : 'Closed'}
                  </button>
                </div>

                {/* Capacity Progress Bar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-500">Orders Dispatched / Booked</span>
                    <span
                      className={`font-bold ${
                        isFull ? 'text-[#BA1A1A]' : 'text-slate-800'
                      }`}
                    >
                      {slot.currentBookings} / {slot.maxCapacity} Orders
                    </span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        isFull
                          ? 'bg-[#BA1A1A]'
                          : slot.currentBookings / slot.maxCapacity > 0.75
                          ? 'bg-[#FE932C]'
                          : 'bg-[#76CA3E]'
                      }`}
                      style={{
                        width: `${Math.min(
                          100,
                          (slot.currentBookings / slot.maxCapacity) * 100
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs text-slate-500">
                  <span>
                    Cutoff:{' '}
                    <strong className="text-slate-700 font-mono">
                      {slot.cutoffMins === 0 ? 'Instant' : `${slot.cutoffMins} mins prior`}
                    </strong>
                  </span>

                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => handleOpenEditSlot(slot)}>
                      Edit Slot
                    </Button>
                    <button
                      onClick={() => setDeleteConfirm({ type: 'slot', id: slot.id })}
                      className="text-slate-400 hover:text-[#BA1A1A] p-1 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Zone Modal */}
      <Modal
        isOpen={isZoneModalOpen}
        onClose={() => setIsZoneModalOpen(false)}
        title={editingZone ? 'Edit Delivery Zone' : 'Create Geofenced Zone'}
        size="md"
      >
        <form onSubmit={handleSaveZone} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Zone Name (English) *
            </label>
            <Input
              placeholder="e.g. Othakadai & Agricultural College"
              value={zoneFormData.nameEn}
              onChange={(e) => setZoneFormData({ ...zoneFormData, nameEn: e.target.value })}
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Zone Name (Tamil / தமிழ்)
            </label>
            <Input
              placeholder="e.g. ஒத்தக்கடை • வேளாண்மை கல்லூரி"
              value={zoneFormData.nameTa}
              onChange={(e) => setZoneFormData({ ...zoneFormData, nameTa: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Max Distance (km)
              </label>
              <Input
                type="number"
                step="0.1"
                value={zoneFormData.distanceKm}
                onChange={(e) =>
                  setZoneFormData({ ...zoneFormData, distanceKm: Number(e.target.value) })
                }
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Delivery Fee (₹)
              </label>
              <Input
                type="number"
                value={zoneFormData.deliveryFee}
                onChange={(e) =>
                  setZoneFormData({ ...zoneFormData, deliveryFee: Number(e.target.value) })
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Min Order Value (₹)
              </label>
              <Input
                type="number"
                value={zoneFormData.minOrder}
                onChange={(e) =>
                  setZoneFormData({ ...zoneFormData, minOrder: Number(e.target.value) })
                }
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Free Delivery Above (₹)
              </label>
              <Input
                type="number"
                value={zoneFormData.freeDeliveryThreshold}
                onChange={(e) =>
                  setZoneFormData({
                    ...zoneFormData,
                    freeDeliveryThreshold: Number(e.target.value),
                  })
                }
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Typical ETA Label</label>
            <Input
              placeholder="e.g. 25 - 40 mins"
              value={zoneFormData.estimatedMins}
              onChange={(e) => setZoneFormData({ ...zoneFormData, estimatedMins: e.target.value })}
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <Button variant="ghost" onClick={() => setIsZoneModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              {editingZone ? 'Save Changes' : 'Create Zone'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add / Edit Slot Modal */}
      <Modal
        isOpen={isSlotModalOpen}
        onClose={() => setIsSlotModalOpen(false)}
        title={editingSlot ? 'Edit Time Slot' : 'Create Delivery Slot'}
        size="md"
      >
        <form onSubmit={handleSaveSlot} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Slot Name *</label>
            <Input
              placeholder="e.g. Evening Dinner Slot (இரவு)"
              value={slotFormData.label}
              onChange={(e) => setSlotFormData({ ...slotFormData, label: e.target.value })}
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Time Window Window *
            </label>
            <Input
              placeholder="e.g. 08:00 PM - 10:30 PM"
              value={slotFormData.timeWindow}
              onChange={(e) => setSlotFormData({ ...slotFormData, timeWindow: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Max Orders Capacity
              </label>
              <Input
                type="number"
                value={slotFormData.maxCapacity}
                onChange={(e) =>
                  setSlotFormData({ ...slotFormData, maxCapacity: Number(e.target.value) })
                }
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Order Cutoff Lead (Mins)
              </label>
              <Input
                type="number"
                value={slotFormData.cutoffMins}
                onChange={(e) =>
                  setSlotFormData({ ...slotFormData, cutoffMins: Number(e.target.value) })
                }
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <Button variant="ghost" onClick={() => setIsSlotModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              {editingSlot ? 'Save Slot' : 'Create Slot'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmationDialog
        isOpen={Boolean(deleteConfirm)}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDelete}
        title={`Delete Delivery ${deleteConfirm?.type === 'zone' ? 'Zone' : 'Slot'}?`}
        description="Are you sure you want to delete this configuration? Store checkout will no longer present this option to customers."
        confirmLabel="Confirm Delete"
        variant="danger"
      />
    </div>
  );
};

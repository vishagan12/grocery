'use client';

import React, { useState } from 'react';
import {
  Shield,
  ShieldCheck,
  Users,
  Plus,
  KeyRound,
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Edit2,
  Trash2,
  ChevronRight,
  UserCheck,
  Check,
  X,
} from 'lucide-react';
import { PageHeader } from './PageHeader';
import { StatCard } from '../ui/StatCard';
import { Input, Select } from '../ui/FormControls';
import { Button } from '../ui/Button';
import { Modal, ConfirmationDialog } from '../ui/Overlays';
import { Avatar, EmptyState } from '../ui/Miscellaneous';

export interface StaffMember {
  id: string;
  name: string;
  role: 'owner' | 'cashier' | 'packer' | 'dispatcher';
  phone: string;
  status: 'active' | 'leave';
  lastActive: string;
}

export interface AuditLogItem {
  id: string;
  action: string;
  actor: string;
  details: string;
  timestamp: string;
  level: 'info' | 'warning' | 'security';
}

const INITIAL_STAFF: StaffMember[] = [
  {
    id: 'staff-01',
    name: 'S. Ramasamy (Owner)',
    role: 'owner',
    phone: '9842198421',
    status: 'active',
    lastActive: 'Just now',
  },
  {
    id: 'staff-02',
    name: 'M. Anand (Cashier Lead)',
    role: 'cashier',
    phone: '9789012345',
    status: 'active',
    lastActive: '12 mins ago',
  },
  {
    id: 'staff-03',
    name: 'G. Selvam (Packing Team)',
    role: 'packer',
    phone: '9844056789',
    status: 'active',
    lastActive: '25 mins ago',
  },
  {
    id: 'staff-04',
    name: 'P. Murugan (Dispatch Coordinator)',
    role: 'dispatcher',
    phone: '9944112233',
    status: 'active',
    lastActive: '1 hour ago',
  },
];

const INITIAL_LOGS: AuditLogItem[] = [
  {
    id: 'log-01',
    action: 'TOGGLE_STORE_STATUS',
    actor: 'S. Ramasamy (Owner)',
    details: 'Store set to Accepting Orders (Open)',
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    level: 'info',
  },
  {
    id: 'log-02',
    action: 'GAYOO_CSV_SYNC',
    actor: 'M. Anand (Cashier Lead)',
    details: 'Gayoo POS CSV synced: 28 variants updated, 2 items auto-disabled (<5 stock buffer)',
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    level: 'info',
  },
  {
    id: 'log-03',
    action: 'UPDATE_ORDER_STATUS',
    actor: 'G. Selvam (Packing Team)',
    details: 'Order #ORD-849201 moved from NEW to PACKED (Ready at Dock)',
    timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    level: 'info',
  },
  {
    id: 'log-04',
    action: 'ASSIGN_RIDER',
    actor: 'P. Murugan (Dispatch Coordinator)',
    details: 'Assigned rider Muthu Kumar to Order #ORD-849190',
    timestamp: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    level: 'info',
  },
  {
    id: 'log-05',
    action: 'AUTH_FAILED_PIN_ATTEMPT',
    actor: 'Unknown Device (Store Counter)',
    details: 'Incorrect PIN entered on counter lock (Attempt 1 of 5)',
    timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    level: 'warning',
  },
];

export const AdminRolesView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'staff' | 'audit'>('staff');
  const [staff, setStaff] = useState<StaffMember[]>(INITIAL_STAFF);
  const [logs, setLogs] = useState<AuditLogItem[]>(INITIAL_LOGS);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    role: 'packer' as 'owner' | 'cashier' | 'packer' | 'dispatcher',
    phone: '',
    status: 'active' as 'active' | 'leave',
  });
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleOpenAdd = () => {
    setEditingStaff(null);
    setFormData({
      name: '',
      role: 'packer',
      phone: '',
      status: 'active',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (member: StaffMember) => {
    setEditingStaff(member);
    setFormData({
      name: member.name,
      role: member.role,
      phone: member.phone,
      status: member.status,
    });
    setIsModalOpen(true);
  };

  const handleSaveStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    if (editingStaff) {
      setStaff((prev) =>
        prev.map((s) =>
          s.id === editingStaff.id
            ? {
                ...s,
                name: formData.name.trim(),
                role: formData.role,
                phone: formData.phone.trim(),
                status: formData.status,
              }
            : s
        )
      );
    } else {
      const newStaff: StaffMember = {
        id: `staff-${Date.now()}`,
        name: formData.name.trim(),
        role: formData.role,
        phone: formData.phone.trim(),
        status: formData.status,
        lastActive: 'Just registered',
      };
      setStaff((prev) => [...prev, newStaff]);
    }

    setIsModalOpen(false);
  };

  const handleDeleteStaff = () => {
    if (!deleteConfirmId) return;
    setStaff((prev) => prev.filter((s) => s.id !== deleteConfirmId));
    setDeleteConfirmId(null);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Staff Roles, Permissions & Audit Trail"
        subtitle="Manage store floor staff roles, role-based access permissions, and inspect real-time security audit logs."
        actions={
          <Button variant="primary" size="md" onClick={handleOpenAdd} className="gap-2">
            <Plus className="w-4 h-4" /> Add Staff Member
          </Button>
        }
      />

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Registered Staff"
          value={staff.length}
          icon={<Users className="w-5 h-5 text-[#143B0D]" />}
          description="Active store floor members"
        />
        <StatCard
          label="Access Roles"
          value="4 Levels"
          icon={<ShieldCheck className="w-5 h-5 text-[#0047BF]" />}
          description="Owner, Cashier, Packer, Dispatch"
        />
        <StatCard
          label="Counter PIN Gate"
          value="Enforced"
          icon={<Lock className="w-5 h-5 text-[#047857]" />}
          description="5-attempt rate limited"
        />
        <StatCard
          label="Audit Log Entries"
          value={logs.length}
          icon={<Clock className="w-5 h-5 text-[#D97706]" />}
          description="Immutable operational trail"
        />
      </div>

      {/* Tab Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('staff')}
          className={`pb-3 px-4 font-bold text-sm transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'staff'
              ? 'border-[#76CA3E] text-[#143B0D]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Staff Members ({staff.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`pb-3 px-4 font-bold text-sm transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'audit'
              ? 'border-[#76CA3E] text-[#143B0D]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Security Audit Trail ({logs.length})</span>
        </button>
      </div>

      {/* Staff Tab */}
      {activeTab === 'staff' && (
        <div className="space-y-6">
          {/* Roles Matrix Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-xs px-2 py-0.5 rounded-full bg-[#F1F9EC] text-[#143B0D] border border-[#76CA3E]/30 uppercase">
                  Owner
                </span>
                <ShieldCheck className="w-4 h-4 text-[#143B0D]" />
              </div>
              <h4 className="font-bold text-sm text-[#0F172A]">Store Superadmin</h4>
              <p className="text-xs text-slate-500">
                Full authority: Revenue reports, staff management, store status, POS CSV sync.
              </p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-xs px-2 py-0.5 rounded-full bg-blue-50 text-[#0047BF] border border-blue-200/40 uppercase">
                  Cashier
                </span>
                <Shield className="w-4 h-4 text-[#0047BF]" />
              </div>
              <h4 className="font-bold text-sm text-[#0F172A]">Counter Lead</h4>
              <p className="text-xs text-slate-500">
                Live orders dispatch, thermal slip printing, stock toggles, customer support.
              </p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-xs px-2 py-0.5 rounded-full bg-amber-50 text-[#78350F] border border-amber-200/40 uppercase">
                  Packer
                </span>
                <Shield className="w-4 h-4 text-[#D97706]" />
              </div>
              <h4 className="font-bold text-sm text-[#0F172A]">Aisle &amp; Packing Helper</h4>
              <p className="text-xs text-slate-500">
                Order item checklist view, mark orders ready at dock. Financial data hidden.
              </p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-[#047857] border border-emerald-200/40 uppercase">
                  Dispatcher
                </span>
                <Shield className="w-4 h-4 text-[#047857]" />
              </div>
              <h4 className="font-bold text-sm text-[#0F172A]">Logistics Lead</h4>
              <p className="text-xs text-slate-500">
                Assign orders to riders, monitor transit times, reconcile COD cash.
              </p>
            </div>
          </div>

          {/* Staff Roster Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#F8FAF7] border-b border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-wider font-mono">
                  <tr>
                    <th className="py-3.5 px-4">Staff Member</th>
                    <th className="py-3.5 px-4">Role Permission</th>
                    <th className="py-3.5 px-4">Mobile Number</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-4 text-right">Last Active</th>
                    <th className="py-3.5 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {staff.map((member) => (
                    <tr key={member.id} className="hover:bg-[#F8FAF7]/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <Avatar name={member.name} size="md" />
                          <div className="min-w-0">
                            <span className="font-bold text-[#0F172A] block">{member.name}</span>
                            <span className="text-xs text-slate-400 font-mono block">
                              ID: {member.id}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-extrabold uppercase font-mono ${
                            member.role === 'owner'
                              ? 'bg-[#F1F9EC] text-[#143B0D] border border-[#76CA3E]/40'
                              : member.role === 'cashier'
                              ? 'bg-blue-50 text-[#0047BF] border border-blue-200/50'
                              : member.role === 'packer'
                              ? 'bg-amber-50 text-[#78350F] border border-amber-200/50'
                              : 'bg-emerald-50 text-[#047857] border border-emerald-200/50'
                          }`}
                        >
                          {member.role}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-xs text-slate-700 font-semibold">
                        {member.phone || '—'}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                            member.status === 'active'
                              ? 'bg-emerald-50 text-[#047857]'
                              : 'bg-slate-100 text-slate-400'
                          }`}
                        >
                          <span
                            className={`w-2 h-2 rounded-full ${
                              member.status === 'active' ? 'bg-[#047857]' : 'bg-slate-400'
                            }`}
                          />
                          {member.status === 'active' ? 'Active On-Duty' : 'On Leave'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono text-xs text-slate-500">
                        {member.lastActive}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleOpenEdit(member)}
                            className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          {member.role !== 'owner' && (
                            <button
                              onClick={() => setDeleteConfirmId(member.id)}
                              className="w-7 h-7 rounded-lg hover:bg-rose-50 flex items-center justify-center text-slate-400 hover:text-[#BA1A1A] transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Audit Log Tab */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-[#0F172A] text-sm">
                System Security &amp; Activity Log
              </h3>
              <p className="text-xs text-slate-500">
                Tamper-resistant operational records stored in Supabase audit_logs table
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-[#143B0D] px-2.5 py-1 rounded-lg bg-[#F1F9EC] border border-[#76CA3E]/30">
              Live Monitoring
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {logs.map((log) => (
              <div key={log.id} className="p-4 hover:bg-[#F8FAF7]/80 transition-colors space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-mono font-extrabold text-[11px] px-2 py-0.5 rounded uppercase ${
                        log.level === 'warning'
                          ? 'bg-[#FFDAD6] text-[#BA1A1A]'
                          : 'bg-[#F1F9EC] text-[#143B0D]'
                      }`}
                    >
                      {log.action}
                    </span>
                    <span className="text-xs font-bold text-slate-800">{log.actor}</span>
                  </div>

                  <span className="text-xs font-mono text-slate-400">
                    {new Date(log.timestamp).toLocaleTimeString('en-IN', {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </span>
                </div>

                <p className="text-xs text-slate-600 font-mono pl-1">{log.details}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add / Edit Staff Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingStaff ? 'Edit Staff Member' : 'Register New Floor Staff'}
        size="md"
      >
        <form onSubmit={handleSaveStaff} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
            <Input
              placeholder="e.g. R. Venkatesh"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Mobile Phone Number
            </label>
            <Input
              type="tel"
              placeholder="10-digit mobile number"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Permission Role</label>
            <select
              value={formData.role}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  role: e.target.value as 'owner' | 'cashier' | 'packer' | 'dispatcher',
                })
              }
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#76CA3E]"
            >
              <option value="owner">Store Superadmin / Owner (Full Access)</option>
              <option value="cashier">Counter Cashier (Dispatch &amp; Stock)</option>
              <option value="packer">Packing Helper (Items &amp; Ready dock only)</option>
              <option value="dispatcher">Logistics Dispatcher (Riders &amp; COD)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Shift Status</label>
            <select
              value={formData.status}
              onChange={(e) =>
                setFormData({ ...formData, status: e.target.value as 'active' | 'leave' })
              }
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#76CA3E]"
            >
              <option value="active">Active On-Duty</option>
              <option value="leave">On Leave / Off-Duty</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              {editingStaff ? 'Save Changes' : 'Register Staff'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Staff Confirmation */}
      <ConfirmationDialog
        isOpen={Boolean(deleteConfirmId)}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={handleDeleteStaff}
        title="Remove Staff Member?"
        description="Are you sure you want to remove this staff member from the store system? Their access credentials will be revoked immediately."
        confirmLabel="Remove Staff"
        variant="danger"
      />
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';
import { Plus, Edit2, Trash2, Search, SlidersHorizontal, MapPin, Phone, Mail, Users, CheckCircle, AlertTriangle } from 'lucide-react';

export const Branches: React.FC = () => {
  const { user } = useAuthStore();
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<any>(null);
  
  // Form fields
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [capacity, setCapacity] = useState(100);
  const [status, setStatus] = useState('ACTIVE');
  const [managerId, setManagerId] = useState('');
  const [managers, setManagers] = useState<any[]>([]);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchBranches = async () => {
    try {
      setLoading(true);
      const res = await api.get('/branches', { params: { search, status: statusFilter } });
      setBranches(res.data.data);
    } catch {} finally {
      setLoading(false);
    }
  };

  const fetchManagers = async () => {
    try {
      // Find staff users with manager role to assign
      const res = await api.get('/staff');
      // Filter roles locally or just list all potential staff
      setManagers(res.data.data);
    } catch {}
  };

  useEffect(() => {
    if (user?.role === 'SUPER_ADMIN') {
      fetchBranches();
      fetchManagers();
    }
  }, [search, statusFilter]);

  const openCreateForm = () => {
    setEditingBranch(null);
    setName('');
    setCode('');
    setAddress('');
    setPhone('');
    setEmail('');
    setCapacity(100);
    setStatus('ACTIVE');
    setManagerId('');
    setFormError(null);
    setIsFormOpen(true);
  };

  const openEditForm = (b: any) => {
    setEditingBranch(b);
    setName(b.name);
    setCode(b.code);
    setAddress(b.address);
    setPhone(b.phone);
    setEmail(b.email);
    setCapacity(b.capacity);
    setStatus(b.status);
    setManagerId(b.managerId || '');
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !code || !address || !phone || !email) {
      setFormError('Please fill out all required fields');
      return;
    }
    setFormError(null);

    const payload = {
      name,
      code,
      address,
      phone,
      email,
      capacity: Number(capacity),
      status,
      managerId: managerId || null
    };

    try {
      if (editingBranch) {
        await api.put(`/branches/${editingBranch.id}`, payload);
      } else {
        await api.post('/branches', payload);
      }
      setIsFormOpen(false);
      fetchBranches();
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Action failed');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to deactivate/delete this branch? All data remains archived.')) {
      try {
        await api.delete(`/branches/${id}`);
        fetchBranches();
      } catch {}
    }
  };

  if (user?.role !== 'SUPER_ADMIN') {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
        <AlertTriangle className="h-12 w-12 text-yellow-500" />
        <h3 className="text-xl font-bold">Access Denied</h3>
        <p className="text-muted-foreground max-w-sm">Only organization owners and super administrators can manage branches.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight">Branch Management</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Configure multiple locations, capacities, and managers.</p>
        </div>
        <button
          onClick={openCreateForm}
          className="flex items-center gap-2 bg-primary hover:bg-primary/95 text-primary-foreground font-bold px-4 py-2 rounded-xl shadow-lg shadow-primary/20 transition-all cursor-pointer text-sm"
        >
          <Plus className="h-4 w-4" />
          <span>Add New Branch</span>
        </button>
      </div>

      {/* Filter Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-card border border-border p-4 rounded-2xl shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search branches..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-secondary border border-border rounded-xl pl-10 pr-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>
        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-secondary border border-border px-3 py-2 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground justify-end pr-2">
          <SlidersHorizontal className="h-4 w-4" />
          <span>Filters applied</span>
        </div>
      </div>

      {/* Grid List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-64 bg-card border border-border rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : branches.length === 0 ? (
        <div className="bg-card border border-border p-12 rounded-2xl text-center text-muted-foreground">
          No branches found matching filters.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {branches.map((b) => (
            <div key={b.id} className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col justify-between hover:border-primary/40 transition-all">
              <div className="space-y-4">
                
                {/* Header */}
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-lg leading-tight">{b.name}</h3>
                    <span className="text-[10px] bg-secondary text-primary font-bold px-2 py-0.5 rounded uppercase mt-1 inline-block">{b.code}</span>
                  </div>
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                    b.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'
                  }`}>
                    {b.status}
                  </span>
                </div>

                {/* Details */}
                <div className="space-y-2 text-xs text-muted-foreground">
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 shrink-0 text-primary" />
                    <span className="leading-tight">{b.address}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 shrink-0 text-primary" />
                    <span>{b.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 shrink-0 text-primary" />
                    <span className="truncate">{b.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 shrink-0 text-primary" />
                    <span>Max Capacity: {b.capacity} Pupils</span>
                  </div>
                </div>

                {/* Manager */}
                <div className="pt-3 border-t border-border flex items-center gap-2 text-xs">
                  <span className="font-semibold text-foreground">Branch Manager:</span>
                  <span className="text-muted-foreground">{b.manager?.name || 'Unassigned'}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 mt-6 pt-4 border-t border-border">
                <button
                  onClick={() => openEditForm(b)}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-secondary hover:bg-primary/10 hover:text-primary rounded-lg transition-all"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => handleDelete(b.id)}
                  className="px-3 py-1.5 text-xs font-semibold text-rose-500 bg-rose-500/5 hover:bg-rose-500/10 rounded-lg transition-all"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* CRUD Sheet Overlay Drawer */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-card border-l border-border h-full p-6 overflow-y-auto flex flex-col justify-between shadow-2xl animate-slide-in">
            <div className="space-y-6">
              
              {/* Drawer Header */}
              <div className="flex justify-between items-center pb-4 border-b border-border">
                <h3 className="text-lg font-bold">{editingBranch ? 'Edit Branch' : 'Add New Branch'}</h3>
                <button
                  onClick={() => setIsFormOpen(false)}
                  className="p-1 hover:bg-secondary rounded-lg"
                >
                  <Plus className="h-5 w-5 rotate-45" />
                </button>
              </div>

              {formError && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-300 p-3 rounded-lg text-xs">
                  {formError}
                </div>
              )}

              {/* Form Body */}
              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                
                <div className="space-y-1">
                  <label className="font-bold text-muted-foreground uppercase">Branch Name *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Dance School Kochi"
                    className="w-full bg-secondary border border-border px-3 py-2 rounded-lg outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-muted-foreground uppercase">Branch Code *</label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="e.g. DSKCH"
                    className="w-full bg-secondary border border-border px-3 py-2 rounded-lg outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-muted-foreground uppercase">Address *</label>
                  <textarea
                    rows={3}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Full postal address"
                    className="w-full bg-secondary border border-border px-3 py-2 rounded-lg outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-muted-foreground uppercase">Phone Number *</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. +91 98765 43210"
                    className="w-full bg-secondary border border-border px-3 py-2 rounded-lg outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-muted-foreground uppercase">Email Address *</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. kochi@rda.com"
                    className="w-full bg-secondary border border-border px-3 py-2 rounded-lg outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-bold text-muted-foreground uppercase">Max Capacity</label>
                    <input
                      type="number"
                      value={capacity}
                      onChange={(e) => setCapacity(Number(e.target.value))}
                      className="w-full bg-secondary border border-border px-3 py-2 rounded-lg outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-muted-foreground uppercase">Status</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="w-full bg-secondary border border-border px-3 py-2 rounded-lg outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="INACTIVE">INACTIVE</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-muted-foreground uppercase">Assign Manager</label>
                  <select
                    value={managerId}
                    onChange={(e) => setManagerId(e.target.value)}
                    className="w-full bg-secondary border border-border px-3 py-2 rounded-lg outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="">Unassigned</option>
                    {managers.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.role?.name})
                      </option>
                    ))}
                  </select>
                </div>

              </form>
            </div>

            <div className="pt-6 border-t border-border flex gap-3 mt-8">
              <button
                onClick={() => setIsFormOpen(false)}
                className="flex-1 bg-secondary hover:bg-secondary/80 font-bold py-2 px-4 rounded-xl border border-border"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="flex-1 bg-primary hover:bg-primary/95 text-primary-foreground font-bold py-2 px-4 rounded-xl shadow-lg"
              >
                Save
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';
import { Plus, Edit2, Trash2, Search, SlidersHorizontal, UserPlus, Shield, Landmark, Calendar, Phone, Mail, Award, CheckCircle } from 'lucide-react';

export const Staff: React.FC = () => {
  const { user } = useAuthStore();
  const [staffList, setStaffList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleIdFilter, setRoleIdFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Form states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<any>(null);
  const [employeeId, setEmployeeId] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [roleId, setRoleId] = useState('');
  const [branchId, setBranchId] = useState('');
  const [salary, setSalary] = useState('');
  const [joiningDate, setJoiningDate] = useState('');
  const [status, setStatus] = useState('ACTIVE');
  const [password, setPassword] = useState('');

  // Metadata loaders
  const [roles, setRoles] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const res = await api.get('/staff', {
        params: { search, roleId: roleIdFilter, status: statusFilter }
      });
      setStaffList(res.data.data);
    } catch {} finally {
      setLoading(false);
    }
  };

  const fetchMetadata = async () => {
    try {
      const [rolesRes, branchesRes] = await Promise.all([
        api.get('/staff/roles'),
        api.get('/branches')
      ]);
      setRoles(rolesRes.data.data);
      setBranches(branchesRes.data.data);
    } catch {}
  };

  useEffect(() => {
    fetchStaff();
  }, [search, roleIdFilter, statusFilter]);

  useEffect(() => {
    fetchMetadata();
  }, []);

  const openCreateForm = () => {
    setEditingStaff(null);
    setEmployeeId(`EMP-${Math.floor(1000 + Math.random() * 9000)}`);
    setName('');
    setEmail('');
    setPhone('');
    setAddress('');
    setRoleId(roles[0]?.id || '');
    setBranchId(user?.branchId || ''); // locked manager's branch
    setSalary('');
    setJoiningDate(new Date().toISOString().split('T')[0]);
    setStatus('ACTIVE');
    setPassword('');
    setFormError(null);
    setIsFormOpen(true);
  };

  const openEditForm = (s: any) => {
    setEditingStaff(s);
    setEmployeeId(s.employeeId || '');
    setName(s.name);
    setEmail(s.email);
    setPhone(s.phone || '');
    setAddress(s.address || '');
    setRoleId(s.roleId);
    setBranchId(s.branchId || '');
    setSalary(s.salary ? Number(s.salary).toString() : '');
    setJoiningDate(s.joiningDate ? new Date(s.joiningDate).toISOString().split('T')[0] : '');
    setStatus(s.status);
    setPassword(s.password || '');
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !roleId || !employeeId) {
      setFormError('Please fill out all required fields');
      return;
    }
    if (!editingStaff && !password) {
      setFormError('Password is required for onboarding new staff');
      return;
    }
    if (password && password.length < 6) {
      setFormError('Password must be at least 6 characters');
      return;
    }
    setFormError(null);

    const payload = {
      employeeId,
      name,
      email,
      password: password || undefined,
      phone: phone || null,
      address: address || null,
      roleId,
      branchId: branchId || null,
      salary: salary ? Number(salary) : null,
      joiningDate: joiningDate ? new Date(joiningDate).toISOString() : null,
      status
    };

    try {
      if (editingStaff) {
        await api.put(`/staff/${editingStaff.id}`, payload);
      } else {
        await api.post('/staff', payload);
      }
      setIsFormOpen(false);
      fetchStaff();
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Action failed');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to deactivate this staff account?')) {
      try {
        await api.delete(`/staff/${id}`);
        fetchStaff();
      } catch {}
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight">Staff & Instructors</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Onboard, assign roles, define salaries, and align branches.</p>
        </div>
        <button
          onClick={openCreateForm}
          className="flex items-center gap-2 bg-primary hover:bg-primary/95 text-primary-foreground font-bold px-4 py-2 rounded-xl shadow-lg shadow-primary/20 transition-all cursor-pointer text-sm"
        >
          <UserPlus className="h-4 w-4" />
          <span>Onboard Employee</span>
        </button>
      </div>

      {/* Filter panel */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 bg-card border border-border p-4 rounded-2xl shadow-sm">
        <div className="relative col-span-1 sm:col-span-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name, email, employee ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-secondary border border-border rounded-xl pl-10 pr-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>
        <div>
          <select
            value={roleIdFilter}
            onChange={(e) => setRoleIdFilter(e.target.value)}
            className="w-full bg-secondary border border-border px-3 py-2 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          >
            <option value="">All Roles</option>
            {roles.map(r => (
              <option key={r.id} value={r.id}>{r.name.replace('_', ' ')}</option>
            ))}
          </select>
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
      </div>

      {/* Staff Grid/Table */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-56 bg-card border border-border rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : staffList.length === 0 ? (
        <div className="bg-card border border-border p-12 rounded-2xl text-center text-muted-foreground">
          No employee records found.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {staffList.map((s) => (
            <div key={s.id} className="bg-card border border-border rounded-2xl p-5 shadow-sm hover:border-primary/30 transition-all flex flex-col justify-between">
              <div className="space-y-4">
                
                {/* Header */}
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-primary/10 flex items-center justify-center text-primary font-black rounded-xl">
                      {s.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm leading-tight text-foreground">{s.name}</h4>
                      <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider">{s.employeeId}</span>
                    </div>
                  </div>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                    s.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'
                  }`}>
                    {s.status}
                  </span>
                </div>

                {/* Details list */}
                <div className="space-y-1.5 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Award className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span className="font-semibold text-foreground uppercase tracking-wide text-[10px]">{s.role?.name.replace('_', ' ')}</span>
                  </div>
                  {s.branch?.name && (
                    <div className="flex items-center gap-2">
                      <SlidersHorizontal className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span>{s.branch.name}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span className="truncate">{s.email}</span>
                  </div>
                  {s.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span>{s.phone}</span>
                    </div>
                  )}
                  {s.salary && (
                    <div className="flex items-center gap-2">
                      <Landmark className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span>Base Salary: ₹{Number(s.salary).toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  {s.joiningDate && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span>Admitted: {new Date(s.joiningDate).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>

              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 mt-6 pt-4 border-t border-border">
                <button
                  onClick={() => openEditForm(s)}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-secondary hover:bg-primary/10 hover:text-primary rounded-lg transition-all"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                  <span>Update</span>
                </button>
                <button
                  onClick={() => handleDelete(s.id)}
                  className="px-3 py-1.5 text-xs font-semibold text-rose-500 bg-rose-500/5 hover:bg-rose-500/10 rounded-lg transition-all"
                  title="Deactivate staff user"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* CRUD Sheet Drawer */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-card border-l border-border h-full p-6 overflow-y-auto flex flex-col justify-between shadow-2xl animate-slide-in">
            <div className="space-y-6">
              
              {/* Header */}
              <div className="flex justify-between items-center pb-4 border-b border-border">
                <h3 className="text-lg font-bold">{editingStaff ? 'Edit Staff Profile' : 'Onboard Staff Member'}</h3>
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

              {/* Form fields */}
              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-bold text-muted-foreground uppercase">Employee ID *</label>
                    <input
                      type="text"
                      value={employeeId}
                      onChange={(e) => setEmployeeId(e.target.value)}
                      placeholder="e.g. EMP001"
                      className="w-full bg-secondary border border-border px-3 py-2 rounded-lg outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-muted-foreground uppercase">Role Name *</label>
                    <select
                      value={roleId}
                      onChange={(e) => setRoleId(e.target.value)}
                      className="w-full bg-secondary border border-border px-3 py-2 rounded-lg outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      {roles.map(r => (
                        <option key={r.id} value={r.id}>{r.name.replace('_', ' ')}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-muted-foreground uppercase">Full Name *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter full name"
                    className="w-full bg-secondary border border-border px-3 py-2 rounded-lg outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-muted-foreground uppercase">Email Address *</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. staff@rda.com"
                    className="w-full bg-secondary border border-border px-3 py-2 rounded-lg outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-muted-foreground uppercase">Password {editingStaff ? '(Leave blank to keep unchanged)' : '*'}</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={editingStaff ? "••••••" : "Enter password (min 6 characters)"}
                    className="w-full bg-secondary border border-border px-3 py-2 rounded-lg outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-muted-foreground uppercase">Contact Number</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Mobile number"
                    className="w-full bg-secondary border border-border px-3 py-2 rounded-lg outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-muted-foreground uppercase">Home Address</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Resident address"
                    className="w-full bg-secondary border border-border px-3 py-2 rounded-lg outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-muted-foreground uppercase">Assign Branch Location</label>
                  <select
                    value={branchId}
                    onChange={(e) => setBranchId(e.target.value)}
                    disabled={user?.role !== 'SUPER_ADMIN'}
                    className="w-full bg-secondary border border-border px-3 py-2 rounded-lg outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-75"
                  >
                    <option value="">No branch (Org Level)</option>
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-bold text-muted-foreground uppercase">Salary (Base * Monthly)</label>
                    <input
                      type="number"
                      value={salary}
                      onChange={(e) => setSalary(e.target.value)}
                      placeholder="INR Amount"
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
                  <label className="font-bold text-muted-foreground uppercase">Date of Joining</label>
                  <input
                    type="date"
                    value={joiningDate}
                    onChange={(e) => setJoiningDate(e.target.value)}
                    className="w-full bg-secondary border border-border px-3 py-2 rounded-lg outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

              </form>
            </div>

            {/* Actions */}
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
                Save Profile
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

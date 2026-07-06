import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Plus, Trash2, Search, Building, User, Mail, ShieldAlert, Key, Globe, CheckCircle } from 'lucide-react';

export const Clients: React.FC = () => {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Form states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [orgName, setOrgName] = useState('');
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [confirmModal, setConfirmModal] = useState<{ id: string; name: string; type: 'deactivate' | 'enable' } | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const res = await api.get('/clients');
      setClients(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch client organizations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const openCreateForm = () => {
    setOrgName('');
    setAdminName('');
    setAdminEmail('');
    setAdminPassword('');
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgName || !adminName || !adminEmail) {
      setFormError('Please fill out all required fields');
      return;
    }
    setFormError(null);
    setIsSubmitting(true);

    try {
      await api.post('/clients', {
        orgName,
        adminName,
        adminEmail,
        adminPassword: adminPassword || undefined
      });
      setIsFormOpen(false);
      fetchClients();
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to onboard client organization');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (id: string, name: string) => {
    setConfirmModal({ id, name, type: 'deactivate' });
  };

  const handleEnable = (id: string, name: string) => {
    setConfirmModal({ id, name, type: 'enable' });
  };

  const executeConfirmAction = async () => {
    if (!confirmModal) return;
    try {
      if (confirmModal.type === 'deactivate') {
        await api.delete(`/clients/${confirmModal.id}`);
      } else {
        await api.post(`/clients/${confirmModal.id}/enable`);
      }
      setConfirmModal(null);
      fetchClients();
    } catch (err: any) {
      alert(err.response?.data?.message || `Failed to ${confirmModal.type} client organization`);
    }
  };

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.users.some((u: any) => u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight">Clients & Organizations</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Manage school accounts, onboard platform clients, and provision system Super Admins.</p>
        </div>
        <button
          onClick={openCreateForm}
          className="flex items-center gap-2 bg-primary hover:bg-primary/95 text-primary-foreground font-bold px-4 py-2 rounded-xl shadow-lg shadow-primary/20 transition-all cursor-pointer text-sm"
        >
          <Plus className="h-4 w-4" />
          <span>New Client Organization</span>
        </button>
      </div>

      {/* Filter panel */}
      <div className="bg-card border border-border p-4 rounded-2xl shadow-sm">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by organization name, admin name, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-secondary border border-border rounded-xl pl-10 pr-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>
      </div>

      {/* Client List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-56 bg-card border border-border rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filteredClients.length === 0 ? (
        <div className="bg-card border border-border p-12 rounded-2xl text-center text-muted-foreground">
          No client organizations found.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClients.map((client) => {
            const superAdmin = client.users?.[0]; // fetch super admin user
            return (
              <div key={client.id} className="bg-card border border-border rounded-2xl p-5 shadow-sm hover:border-primary/30 transition-all flex flex-col justify-between">
                <div className="space-y-4">
                  {/* Org title */}
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-primary/10 flex items-center justify-center text-primary font-black rounded-xl">
                        <Building className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm leading-tight text-foreground">{client.name}</h4>
                        <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider">Client Org</span>
                      </div>
                    </div>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${client.isActive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                      {client.isActive ? 'ACTIVE' : 'DEACTIVATED'}
                    </span>
                  </div>

                  {/* Super admin details */}
                  <div className="bg-secondary/40 rounded-xl p-3.5 space-y-2.5 text-xs text-muted-foreground">
                    <span className="font-bold text-[9px] text-primary uppercase block tracking-wider">Super Administrator</span>
                    {superAdmin ? (
                      <>
                        <div className="flex items-center gap-2">
                          <User className="h-3.5 w-3.5 text-primary shrink-0" />
                          <span className="font-semibold text-foreground">{superAdmin.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail className="h-3.5 w-3.5 text-primary shrink-0" />
                          <span className="truncate">{superAdmin.email}</span>
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center gap-1.5 text-rose-400">
                        <ShieldAlert className="h-3.5 w-3.5" />
                        <span>No Super Admin configured!</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 mt-6 pt-4 border-t border-border">
                  {client.isActive ? (
                    <button
                      onClick={() => handleDelete(client.id, client.name)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-rose-500 bg-rose-500/5 hover:bg-rose-500/10 rounded-xl transition-all cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>Deactivate Account</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleEnable(client.id, client.name)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-emerald-500 bg-emerald-500/5 hover:bg-emerald-500/10 rounded-xl transition-all cursor-pointer"
                    >
                      <CheckCircle className="h-4 w-4" />
                      <span>Enable Account</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Onboarding Drawer */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-card border-l border-border h-full p-6 overflow-y-auto flex flex-col justify-between shadow-2xl animate-slide-in">
            <div className="space-y-6">
              
              <div className="flex justify-between items-center pb-4 border-b border-border">
                <h3 className="text-lg font-bold">Onboard Client Organization</h3>
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

              <form onSubmit={handleSubmit} className="space-y-5 text-xs">
                
                {/* Organization Details */}
                <div className="space-y-3">
                  <span className="font-extrabold text-[10px] text-primary uppercase tracking-wider block">Organization Info</span>
                  <div className="space-y-1">
                    <label className="font-bold text-muted-foreground uppercase">Organization Name *</label>
                    <div className="relative">
                      <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <input
                        type="text"
                        value={orgName}
                        onChange={(e) => setOrgName(e.target.value)}
                        placeholder="e.g. Rudreshwar Dance Academy"
                        className="w-full bg-secondary border border-border pl-10 pr-4 py-2.5 rounded-lg outline-none focus:ring-2 focus:ring-primary/20"
                        required
                      />
                    </div>
                  </div>
                </div>

                <hr className="border-border" />

                {/* Super Admin Details */}
                <div className="space-y-3">
                  <span className="font-extrabold text-[10px] text-primary uppercase tracking-wider block">Super Admin Credentials</span>
                  
                  <div className="space-y-1">
                    <label className="font-bold text-muted-foreground uppercase">Super Admin Full Name *</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <input
                        type="text"
                        value={adminName}
                        onChange={(e) => setAdminName(e.target.value)}
                        placeholder="Enter full name"
                        className="w-full bg-secondary border border-border pl-10 pr-4 py-2.5 rounded-lg outline-none focus:ring-2 focus:ring-primary/20"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-muted-foreground uppercase">Email Address *</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <input
                        type="email"
                        value={adminEmail}
                        onChange={(e) => setAdminEmail(e.target.value)}
                        placeholder="e.g. admin@rda.com"
                        className="w-full bg-secondary border border-border pl-10 pr-4 py-2.5 rounded-lg outline-none focus:ring-2 focus:ring-primary/20"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-muted-foreground uppercase">Password (defaults to 'password123')</label>
                    <div className="relative">
                      <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <input
                        type="password"
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        placeholder="••••••"
                        className="w-full bg-secondary border border-border pl-10 pr-4 py-2.5 rounded-lg outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                  </div>
                </div>

              </form>
            </div>

            {/* Actions */}
            <div className="pt-6 border-t border-border flex gap-3 mt-8">
              <button
                onClick={() => setIsFormOpen(false)}
                disabled={isSubmitting}
                className="flex-1 bg-secondary hover:bg-secondary/80 font-bold py-2.5 px-4 rounded-xl border border-border"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1 bg-primary hover:bg-primary/95 text-primary-foreground font-bold py-2.5 px-4 rounded-xl shadow-lg flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <div className="h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span>Create Client</span>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Action Confirmation Modal */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-md bg-card border border-border rounded-2xl p-6 shadow-2xl space-y-6 animate-scale-in">
            
            {confirmModal.type === 'deactivate' ? (
              <>
                <div className="flex items-center gap-3 text-rose-500">
                  <div className="p-3 bg-rose-500/10 rounded-2xl">
                    <ShieldAlert className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground">Confirm Deactivation</h3>
                    <p className="text-xs text-muted-foreground">Dangerous Operation</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-sm text-foreground">
                    Are you sure you want to deactivate <span className="font-bold text-rose-500">{confirmModal.name}</span>?
                  </p>
                  <div className="bg-rose-500/5 border border-rose-500/10 rounded-xl p-4 space-y-2.5 text-xs text-rose-400 text-left">
                    <p className="font-bold uppercase tracking-wider text-[10px]">Warning Consequences:</p>
                    <ul className="list-disc pl-4 space-y-1.5 leading-relaxed">
                      <li>Immediately blocks all users under this organization from logging in.</li>
                      <li>Terminates all active sessions on their next action/API request.</li>
                      <li>Suspends all branches, classes, payroll, and billing systems.</li>
                    </ul>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setConfirmModal(null)}
                    className="flex-1 px-4 py-2.5 text-xs font-semibold border border-border bg-secondary hover:bg-secondary/80 rounded-xl transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={executeConfirmAction}
                    className="flex-1 px-4 py-2.5 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-lg shadow-rose-600/20 transition-all cursor-pointer"
                  >
                    Deactivate Organization
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-3 text-emerald-500">
                  <div className="p-3 bg-emerald-500/10 rounded-2xl">
                    <CheckCircle className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground">Confirm Reactivation</h3>
                    <p className="text-xs text-muted-foreground">Restore Client Access</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-sm text-foreground">
                    Are you sure you want to re-enable <span className="font-bold text-emerald-500">{confirmModal.name}</span>?
                  </p>
                  <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-4 space-y-2.5 text-xs text-emerald-400 text-left">
                    <p className="font-bold uppercase tracking-wider text-[10px]">Reactivation Outcomes:</p>
                    <ul className="list-disc pl-4 space-y-1.5 leading-relaxed">
                      <li>Restores login capability for the organization's Super Admin.</li>
                      <li>Re-activates all associated branches, staff members, and students.</li>
                      <li>Unlocks payroll ledger accesses and financial reports.</li>
                    </ul>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setConfirmModal(null)}
                    className="flex-1 px-4 py-2.5 text-xs font-semibold border border-border bg-secondary hover:bg-secondary/80 rounded-xl transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={executeConfirmAction}
                    className="flex-1 px-4 py-2.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
                  >
                    Enable Organization
                  </button>
                </div>
              </>
            )}

          </div>
        </div>
      )}

    </div>
  );
};

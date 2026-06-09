import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';
import { Plus, Trash2, Calendar, MapPin, DollarSign, Users, Award, Search, PlusCircle, AlertCircle, ArrowLeft } from 'lucide-react';

export const Events: React.FC = () => {
  const { user } = useAuthStore();
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [venue, setVenue] = useState('');
  const [budget, setBudget] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('UPCOMING');
  const [branchId, setBranchId] = useState('');

  // Participant assignment
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [unregisteredStudents, setUnregisteredStudents] = useState<any[]>([]);
  const [regSearch, setRegSearch] = useState('');

  // Metadata
  const [branches, setBranches] = useState<any[]>([]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await api.get('/events');
      setEvents(res.data.data);
    } catch {} finally {
      setLoading(false);
    }
  };

  const fetchMetadata = async () => {
    try {
      const res = await api.get('/branches');
      setBranches(res.data.data);
    } catch {}
  };

  useEffect(() => {
    fetchEvents();
    fetchMetadata();
  }, []);

  const selectEvent = async (id: string) => {
    try {
      const res = await api.get(`/events/${id}`);
      setSelectedEvent(res.data.data);
    } catch {}
  };

  const handleOpenForm = () => {
    setName('');
    setDate(new Date().toISOString().split('T')[0]);
    setVenue('');
    setBudget('');
    setDescription('');
    setStatus('UPCOMING');
    setBranchId(user?.branchId || '');
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !date || !venue || !budget || !branchId) {
      setFormError('Please fill out all required fields');
      return;
    }
    setFormError(null);

    const payload = {
      name,
      date: new Date(date).toISOString(),
      venue,
      budget: Number(budget),
      description,
      status,
      branchId
    };

    try {
      await api.post('/events', payload);
      setIsFormOpen(false);
      fetchEvents();
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Action failed');
    }
  };

  const openRegisterDrawer = async () => {
    if (!selectedEvent) return;
    try {
      const res = await api.get('/students');
      const allStudents = res.data.data;
      const registeredIds = selectedEvent.participants.map((p: any) => p.student.id);

      const unregistered = allStudents.filter(
        (s: any) => s.branchId === selectedEvent.branchId && s.status === 'ACTIVE' && !registeredIds.includes(s.id)
      );

      setUnregisteredStudents(unregistered);
      setIsRegisterOpen(true);
    } catch {}
  };

  const handleRegisterStudent = async (studentId: string) => {
    if (!selectedEvent) return;
    try {
      await api.post(`/events/${selectedEvent.id}/register`, { studentId });
      setIsRegisterOpen(false);
      selectEvent(selectedEvent.id);
    } catch {}
  };

  const handleParticipantAttendance = async (studentId: string, attStatus: string) => {
    if (!selectedEvent) return;
    try {
      await api.post(`/events/${selectedEvent.id}/attendance`, { studentId, status: attStatus });
      selectEvent(selectedEvent.id);
    } catch {}
  };

  const handleDeleteEvent = async (id: string) => {
    if (window.confirm('Delete this event?')) {
      try {
        await api.delete(`/events/${id}`);
        setSelectedEvent(null);
        fetchEvents();
      } catch {}
    }
  };

  return (
    <div className="space-y-6">
      
      {selectedEvent ? (
        
        /* ========================================================= */
        /* EVENT DETAIL AND PARTICIPANT MANAGEMENT WORKSPACE         */
        /* ========================================================= */
        <div className="space-y-6">
          <button
            onClick={() => { setSelectedEvent(null); fetchEvents(); }}
            className="flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground bg-secondary border border-border px-3 py-1.5 rounded-xl transition-all"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Events Grid</span>
          </button>

          {/* Event Summary */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col md:flex-row justify-between gap-6">
            <div className="flex flex-col md:flex-row items-center gap-5">
              <div className="h-16 w-16 bg-primary text-primary-foreground font-black text-2xl flex items-center justify-center rounded-2xl shadow-lg">
                E
              </div>
              <div className="text-center md:text-left space-y-1">
                <h2 className="text-xl font-extrabold">{selectedEvent.name}</h2>
                <div className="flex flex-wrap justify-center md:justify-start items-center gap-2">
                  <span className="text-[10px] bg-secondary text-primary font-bold px-2 py-0.5 rounded tracking-wide">{selectedEvent.status}</span>
                  <span className="text-[10px] text-muted-foreground">• Date: {new Date(selectedEvent.date).toLocaleDateString()}</span>
                  <span className="text-[10px] text-muted-foreground">• Venue: {selectedEvent.venue}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 text-xs">
              <button
                onClick={openRegisterDrawer}
                className="flex items-center gap-1.5 bg-primary text-primary-foreground font-bold px-4 py-2 rounded-xl"
              >
                <PlusCircle className="h-4 w-4" />
                <span>Register Performer</span>
              </button>
              <button
                onClick={() => handleDeleteEvent(selectedEvent.id)}
                className="px-3 py-2 text-rose-500 bg-rose-500/5 hover:bg-rose-500/10 rounded-xl"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Budget tracker */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs font-semibold">
            <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-1">
              <span className="text-muted-foreground uppercase tracking-wide text-[9px] font-bold block">Assigned Budget</span>
              <p className="text-xl font-black text-foreground">₹{Number(selectedEvent.budget).toLocaleString()}</p>
            </div>
            <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-1">
              <span className="text-muted-foreground uppercase tracking-wide text-[9px] font-bold block">Total Expenses Incurred</span>
              <p className="text-xl font-black text-rose-500">
                ₹{selectedEvent.expenses.reduce((sum: number, e: any) => sum + Number(e.amount), 0).toLocaleString()}
              </p>
            </div>
            <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-1">
              <span className="text-muted-foreground uppercase tracking-wide text-[9px] font-bold block">Concert Registration Revenue</span>
              <p className="text-xl font-black text-emerald-500">
                ₹{selectedEvent.incomes.reduce((sum: number, i: any) => sum + Number(i.amount), 0).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Performers Register List */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="font-extrabold text-sm text-primary uppercase">Participants Registry ({selectedEvent.participants?.length})</h3>
            <div className="border border-border rounded-xl overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-secondary/50 border-b border-border font-bold">
                  <tr>
                    <th className="p-3">Student Performer</th>
                    <th className="p-3">Admission #</th>
                    <th className="p-3">Registered Date</th>
                    <th className="p-3">Attendance Check</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {selectedEvent.participants?.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-6 text-center text-muted-foreground">No students registered to perform.</td>
                    </tr>
                  ) : (
                    selectedEvent.participants.map((p: any) => (
                      <tr key={p.student.id} className="hover:bg-secondary/10">
                        <td className="p-3 font-semibold text-foreground">{p.student.name}</td>
                        <td className="p-3 font-mono font-semibold">{p.student.admissionNumber}</td>
                        <td className="p-3 text-muted-foreground">{new Date(p.registeredAt).toLocaleDateString()}</td>
                        <td className="p-3">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleParticipantAttendance(p.student.id, 'PRESENT')}
                              className={`px-2 py-0.5 rounded font-bold text-[9px] ${
                                p.attendanceStatus === 'PRESENT' ? 'bg-emerald-500 text-white' : 'bg-secondary'
                              }`}
                            >
                              Present
                            </button>
                            <button
                              onClick={() => handleParticipantAttendance(p.student.id, 'ABSENT')}
                              className={`px-2 py-0.5 rounded font-bold text-[9px] ${
                                p.attendanceStatus === 'ABSENT' ? 'bg-rose-500 text-white' : 'bg-secondary'
                              }`}
                            >
                              Absent
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      ) : (

        /* ========================================================= */
        /* MASTER EVENTS GRID VIEW                                   */
        /* ========================================================= */
        <div className="space-y-6">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight">Recitals & Events</h2>
              <p className="text-sm text-muted-foreground mt-0.5">Schedule upcoming concerts, assign locations, track participants, and review budgets.</p>
            </div>
            <button
              onClick={handleOpenForm}
              className="flex items-center gap-2 bg-primary hover:bg-primary/95 text-primary-foreground font-bold px-4 py-2 rounded-xl shadow-lg cursor-pointer text-sm"
            >
              <Plus className="h-4 w-4" />
              <span>Schedule Event</span>
            </button>
          </div>

          {/* Grid display */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2].map(i => (
                <div key={i} className="h-48 bg-card border border-border rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : events.length === 0 ? (
            <div className="bg-card border border-border p-12 rounded-2xl text-center text-muted-foreground">
              No scheduled events found.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-xs">
              {events.map(e => (
                <div key={e.id} className="bg-card border border-border rounded-2xl p-5 shadow-sm flex flex-col justify-between hover:border-primary/40 transition-all">
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-base leading-tight">{e.name}</h4>
                        <span className="text-[10px] text-primary font-bold bg-secondary px-2 py-0.5 rounded uppercase mt-1 inline-block">{e.status}</span>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span>Date: {new Date(e.date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span className="truncate">{e.venue}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span>Budget allocation: ₹{Number(e.budget).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-border mt-5">
                    <button
                      onClick={() => selectEvent(e.id)}
                      className="w-full flex items-center justify-center gap-1 bg-secondary hover:bg-primary/15 hover:text-primary py-2 px-3 rounded-lg font-bold transition-all"
                    >
                      <span>Manage Event Performers</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL DIALOGS                                             */}
      {/* ========================================================= */}

      {/* 1. SCHEDULE EVENT MODAL */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-card border-l border-border h-full p-6 overflow-y-auto flex flex-col justify-between shadow-2xl animate-slide-in">
            <div className="space-y-6 text-xs">
              <div className="flex justify-between items-center pb-4 border-b border-border">
                <h3 className="text-lg font-bold">Schedule Dance Event</h3>
                <button onClick={() => setIsFormOpen(false)} className="p-1 hover:bg-secondary rounded-lg">
                  <Plus className="h-5 w-5 rotate-45" />
                </button>
              </div>

              {formError && <div className="bg-red-500/10 border border-red-500/20 text-red-300 p-3 rounded-lg">{formError}</div>}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="font-bold text-muted-foreground uppercase">Event Name *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Summer Showcase 2026"
                    className="w-full bg-secondary border border-border px-3 py-2 rounded-lg outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-bold text-muted-foreground uppercase">Concert Date *</label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full bg-secondary border border-border px-3 py-2 rounded-lg outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-muted-foreground uppercase">Organizing Branch *</label>
                    <select
                      value={branchId}
                      onChange={(e) => setBranchId(e.target.value)}
                      className="w-full bg-secondary border border-border px-3 py-2 rounded-lg outline-none"
                    >
                      <option value="">Select branch</option>
                      {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-bold text-muted-foreground uppercase">Assigned Budget (INR) *</label>
                    <input
                      type="number"
                      value={budget}
                      onChange={(e) => setBudget(e.target.value)}
                      placeholder="e.g. 50000"
                      className="w-full bg-secondary border border-border px-3 py-2 rounded-lg outline-none font-bold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-muted-foreground uppercase">Status</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="w-full bg-secondary border border-border px-3 py-2 rounded-lg outline-none font-bold text-foreground"
                    >
                      <option value="UPCOMING">UPCOMING</option>
                      <option value="COMPLETED">COMPLETED</option>
                      <option value="CANCELLED">CANCELLED</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-muted-foreground uppercase">Venue *</label>
                  <input
                    type="text"
                    value={venue}
                    onChange={(e) => setVenue(e.target.value)}
                    placeholder="Concert venue address"
                    className="w-full bg-secondary border border-border px-3 py-2 rounded-lg outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-muted-foreground uppercase">Description</label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Event program outlines"
                    className="w-full bg-secondary border border-border px-3 py-2 rounded-lg outline-none"
                  />
                </div>
              </form>
            </div>

            <div className="pt-6 border-t border-border flex gap-3 mt-8">
              <button onClick={() => setIsFormOpen(false)} className="flex-1 bg-secondary border border-border py-2 px-4 rounded-xl font-bold">Cancel</button>
              <button onClick={handleSubmit} className="flex-1 bg-primary text-primary-foreground py-2 px-4 rounded-xl font-bold shadow-lg">Save Event</button>
            </div>
          </div>
        </div>
      )}

      {/* 2. REGISTER PARTICIPANT DRAWER */}
      {isRegisterOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-card border-l border-border h-full p-6 overflow-y-auto flex flex-col justify-between shadow-2xl animate-slide-in">
            <div className="space-y-6 text-xs">
              <div className="flex justify-between items-center pb-4 border-b border-border">
                <h3 className="text-lg font-bold">Register Student Performer</h3>
                <button onClick={() => setIsRegisterOpen(false)} className="p-1 hover:bg-secondary rounded-lg">
                  <Plus className="h-5 w-5 rotate-45" />
                </button>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search branch pupils..."
                  value={regSearch}
                  onChange={(e) => setRegSearch(e.target.value)}
                  className="w-full bg-secondary border border-border rounded-xl pl-10 pr-4 py-2 outline-none"
                />
              </div>

              <div className="divide-y divide-border max-h-[60vh] overflow-y-auto pr-1">
                {unregisteredStudents
                  .filter(s => s.name.toLowerCase().includes(regSearch.toLowerCase()) || s.admissionNumber.includes(regSearch))
                  .map(s => (
                    <div key={s.id} className="py-3.5 flex justify-between items-center gap-4">
                      <div>
                        <span className="font-bold text-foreground block">{s.name}</span>
                        <span className="text-[10px] text-muted-foreground">{s.admissionNumber}</span>
                      </div>
                      <button
                        onClick={() => handleRegisterStudent(s.id)}
                        className="bg-primary/10 hover:bg-primary/20 text-primary font-bold px-3 py-1 rounded-xl"
                      >
                        Register
                      </button>
                    </div>
                  ))}
                {unregisteredStudents.length === 0 && (
                  <div className="text-center text-muted-foreground py-8">All active branch pupils already registered.</div>
                )}
              </div>
            </div>

            <div className="pt-6 border-t border-border mt-8">
              <button onClick={() => setIsRegisterOpen(false)} className="w-full bg-secondary border border-border py-2 px-4 rounded-xl font-bold">Close Drawer</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

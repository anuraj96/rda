import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';
// @ts-ignore
import html2pdf from 'html2pdf.js';
import {
  Plus, Edit2, Trash2, Search, SlidersHorizontal, MapPin, Phone, Mail, Users, FileText, Upload, Calendar,
  ArrowLeft, CreditCard, Clock, Sparkles, BookOpen, AlertCircle
} from 'lucide-react';

const generateTuitionReceiptHtml = (payment: any, fee: any) => {
  const receiptNumber = payment?.receiptNumber || 'N/A';
  const paymentDate = payment?.paymentDate ? new Date(payment.paymentDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A';
  const studentName = fee?.student?.name || 'N/A';
  const admissionNumber = fee?.student?.admissionNumber || 'N/A';
  const billingCategory = fee?.type || 'N/A';
  const feePeriod = fee?.type === 'MONTHLY' && fee?.dueDate ? new Date(fee.dueDate).toLocaleDateString('default', { month: 'long', year: 'numeric' }) : '';
  const paymentMode = payment?.paymentMode || 'N/A';
  const transactionId = payment?.transactionId || '';
  const amountPaid = Number(payment?.amountPaid || 0).toLocaleString('en-IN');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Receipt_${receiptNumber}</title>
  <style>
    body { font-family: 'Inter', system-ui, sans-serif; color: #1f2937; padding: 40px; margin: 0; background: #ffffff; }
    .container { max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 16px; padding: 32px; }
    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #3b82f6; padding-bottom: 20px; margin-bottom: 24px; }
    .logo-container { display: flex; align-items: center; gap: 12px; }
    .logo { height: 48px; border-radius: 8px; }
    .title { font-size: 18px; font-weight: 800; color: #1e3a8a; margin: 0; letter-spacing: 0.5px; line-height: 1.2; }
    .subtitle { font-size: 10px; color: #3b82f6; font-weight: 800; text-transform: uppercase; margin-top: 4px; letter-spacing: 1px; }
    .meta-grid { display: grid; grid-template-cols: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
    .meta-item { background: #f9fafb; border: 1px solid #f3f4f6; padding: 12px; border-radius: 8px; }
    .meta-label { font-size: 9px; font-weight: 700; color: #9ca3af; text-transform: uppercase; margin-bottom: 4px; }
    .meta-val { font-size: 13px; font-weight: 700; color: #111827; }
    .section-title { font-size: 10px; font-weight: 800; color: #4b5563; text-transform: uppercase; margin-bottom: 8px; letter-spacing: 0.5px; }
    .details-box { background: #f3f4f6; border-radius: 12px; padding: 16px; margin-bottom: 24px; }
    .details-row { display: flex; justify-content: space-between; padding: 10px 0; font-size: 12px; }
    .details-row:not(:last-child) { border-bottom: 1px dashed #e5e7eb; }
    .total-row { display: flex; justify-content: space-between; padding-top: 16px; border-top: 2px solid #e5e7eb; margin-top: 16px; font-weight: 900; font-size: 15px; }
    .total-amount { color: #10b981; }
    .footer { text-align: center; margin-top: 32px; font-size: 10px; color: #9ca3af; line-height: 1.6; font-style: italic; }
    @media print {
      body { padding: 20px; }
      .container { border: none; padding: 0; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo-container">
        <img class="logo" src="${window.location.origin}/dlogo.png" alt="RDA Logo" onerror="this.style.display='none'" />
        <div>
          <div class="title">RUDRESHWAR DANCE ACADEMY</div>
          <div class="subtitle">Official Payment Receipt</div>
        </div>
      </div>
    </div>
    
    <div class="meta-grid">
      <div class="meta-item">
        <div class="meta-label">Receipt Number</div>
        <div class="meta-val">${receiptNumber}</div>
      </div>
      <div class="meta-item" style="text-align: right;">
        <div class="meta-label">Payment Date</div>
        <div class="meta-val">${paymentDate}</div>
      </div>
    </div>

    <div class="details-box">
      <div class="section-title">Received From</div>
      <div style="font-size: 14px; font-weight: 800; color: #111827;">${studentName}</div>
      <div style="font-size: 11px; color: #4b5563; margin-top: 4px;">Admission No: ${admissionNumber}</div>
    </div>

    <div class="section-title">Payment Particulars</div>
    <div style="border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; background: #ffffff;">
      <div class="details-row">
        <span>Invoiced Category</span>
        <span style="font-weight: 700; text-transform: uppercase; color: #3b82f6;">${billingCategory}${feePeriod ? ` (${feePeriod})` : ''}</span>
      </div>
      <div class="details-row">
        <span>Payment Method</span>
        <span style="font-weight: 700;">${paymentMode}</span>
      </div>
      ${transactionId ? `
      <div class="details-row">
        <span>Transaction ID</span>
        <span style="font-family: monospace; font-weight: 600;">${transactionId}</span>
      </div>
      ` : ''}
      <div class="total-row">
        <span>TOTAL AMOUNT PAID</span>
        <span class="total-amount">₹${amountPaid}</span>
      </div>
    </div>

    <div class="footer">
      This is an electronically generated receipt and does not require a physical signature.
    </div>
  </div>
</body>
</html>
  `;
};

export const Students: React.FC = () => {
  const { user } = useAuthStore();
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [batchFilter, setBatchFilter] = useState('');
  const [ledgerYearFilter, setLedgerYearFilter] = useState<string>('all');
  const [ledgerTypeFilter, setLedgerTypeFilter] = useState<string>('all');

  // Form toggles
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'attendance' | 'fees' | 'docs' | 'notes'>('profile');

  // New Student States
  const [admissionNumber, setAdmissionNumber] = useState('');
  const [name, setName] = useState('');
  const [gender, setGender] = useState('Female');
  const [dob, setDob] = useState('');
  const [parentName, setParentName] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [joiningDate, setJoiningDate] = useState('');
  const [branchId, setBranchId] = useState('');
  const [courseId, setCourseId] = useState('');
  const [batchId, setBatchId] = useState('');
  const [status, setStatus] = useState('ACTIVE');
  const [isEditMode, setIsEditMode] = useState(false);

  // Metadata Lists
  const [branches, setBranches] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [formError, setFormError] = useState<string | null>(null);

  // Upload States
  const [docName, setDocName] = useState('');
  const [docUrl, setDocUrl] = useState('');

  // Fee collection state (inside student profile)
  const [isCollectOpen, setIsCollectOpen] = useState(false);
  const [collectFeeRecord, setCollectFeeRecord] = useState<any>(null);
  const [amountPaid, setAmountPaid] = useState('');
  const [paymentMode, setPaymentMode] = useState<'CASH' | 'UPI' | 'CARD' | 'BANK_TRANSFER'>('UPI');
  const [transactionId, setTransactionId] = useState('');

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const res = await api.get('/students', {
        params: { search, status: statusFilter, batchId: batchFilter }
      });
      setStudents(res.data.data);
    } catch { } finally {
      setLoading(false);
    }
  };

  const fetchMetadata = async () => {
    try {
      const [branchesRes, coursesRes, batchesRes] = await Promise.all([
        api.get('/branches'),
        api.get('/courses'),
        api.get('/batches')
      ]);
      setBranches(branchesRes.data.data);
      setCourses(coursesRes.data.data);
      setBatches(batchesRes.data.data);
    } catch { }
  };

  useEffect(() => {
    fetchStudents();
  }, [search, statusFilter, batchFilter]);

  useEffect(() => {
    fetchMetadata();
  }, []);

  const selectStudentProfile = async (id: string) => {
    try {
      const res = await api.get(`/students/${id}`);
      setSelectedStudent(res.data.data);
      setActiveTab('profile');
      setLedgerYearFilter('all');
      setLedgerTypeFilter('all');
    } catch { }
  };

  const handleOpenCreateForm = () => {
    setIsEditMode(false);
    setAdmissionNumber(`ADM-${Math.floor(10000 + Math.random() * 90000)}`);
    setName('');
    setGender('Female');
    setDob('2015-01-01');
    setParentName('');
    setParentPhone('');
    setEmail('');
    setAddress('');
    setEmergencyContact('');
    setJoiningDate(new Date().toISOString().split('T')[0]);
    setBranchId(user?.branchId || '');
    setCourseId('');
    setBatchId('');
    setStatus('ACTIVE');
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleOpenEditForm = () => {
    if (!selectedStudent) return;
    setIsEditMode(true);
    setAdmissionNumber(selectedStudent.admissionNumber);
    setName(selectedStudent.name);
    setGender(selectedStudent.gender);
    setDob(selectedStudent.dob ? selectedStudent.dob.split('T')[0] : '');
    setParentName(selectedStudent.parentName);
    setParentPhone(selectedStudent.parentPhone);
    setEmail(selectedStudent.email || '');
    setAddress(selectedStudent.address);
    setEmergencyContact(selectedStudent.emergencyContact);
    setJoiningDate(selectedStudent.joiningDate ? selectedStudent.joiningDate.split('T')[0] : '');
    setBranchId(selectedStudent.branchId || '');

    const activeBatch = selectedStudent.batches?.find((b: any) => b.status === 'ACTIVE');
    setCourseId(activeBatch?.batch?.courseId || '');
    setBatchId(activeBatch?.batchId || '');
    setStatus(selectedStudent.status || 'ACTIVE');
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleSubmitAdmission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !parentName || !parentPhone || !address || !branchId || !admissionNumber) {
      setFormError('Please fill out all required fields');
      return;
    }
    setFormError(null);

    const payload = {
      admissionNumber,
      name,
      gender,
      dob: new Date(dob).toISOString(),
      parentName,
      parentPhone,
      email: email || null,
      address,
      emergencyContact,
      joiningDate: new Date(joiningDate).toISOString(),
      branchId,
      courseId: courseId || undefined,
      batchId: batchId || undefined,
      status: isEditMode ? status : 'ACTIVE'
    };

    try {
      if (isEditMode) {
        await api.put(`/students/${selectedStudent.id}`, payload);
        setIsFormOpen(false);
        selectStudentProfile(selectedStudent.id);
      } else {
        await api.post('/students', payload);
        setIsFormOpen(false);
        fetchStudents();
      }
    } catch (err: any) {
      setFormError(err.response?.data?.message || (isEditMode ? 'Update failed' : 'Admission failed'));
    }
  };

  const handleDocumentUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docName || !docUrl) return;

    try {
      await api.post(`/students/${selectedStudent.id}/documents`, {
        name: docName,
        fileUrl: docUrl
      });
      setDocName('');
      setDocUrl('');
      // Reload profile
      selectStudentProfile(selectedStudent.id);
    } catch { }
  };

  const handleDeleteDocument = async (docId: string) => {
    if (window.confirm('Delete this document?')) {
      try {
        await api.delete(`/students/documents/${docId}`);
        selectStudentProfile(selectedStudent.id);
      } catch { }
    }
  };

  const showReceipt = (payment: any, fee: any) => {
    setSelectedReceipt({ payment, fee: { ...fee, student: selectedStudent } });
  };

  const downloadReceiptPDF = (htmlContent: string, fileName: string) => {
    const element = document.createElement('div');
    element.innerHTML = htmlContent;
    const opt = {
      margin: 10,
      filename: fileName,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    // @ts-ignore
    html2pdf().set(opt).from(element).save();
  };

  const openCollectFeeModal = (fee: any) => {
    setCollectFeeRecord(fee);
    const remaining = Number(fee.amount) - fee.payments.reduce((sum: number, p: any) => sum + Number(p.amountPaid), 0);
    setAmountPaid(remaining.toString());
    setPaymentMode('UPI');
    setTransactionId('');
    setIsCollectOpen(true);
  };

  const handleCollectFee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amountPaid || !collectFeeRecord) return;

    try {
      await api.post('/fees/collect', {
        feeId: collectFeeRecord.id,
        amountPaid: Number(amountPaid),
        paymentMode,
        transactionId: transactionId || null,
        remarks: 'Collected from student details page'
      });
      setIsCollectOpen(false);
      selectStudentProfile(selectedStudent.id);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Payment collection failed');
    }
  };

  const handleDeleteStudent = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this student record?')) {
      try {
        await api.delete(`/students/${id}`);
        setSelectedStudent(null);
        fetchStudents();
      } catch { }
    }
  };

  return (
    <div className="space-y-6">

      {selectedStudent ? (

        /* ========================================================= */
        /* STUDENT PROFILE DETAILED VIEW                            */
        /* ========================================================= */
        <div className="space-y-6">
          <button
            onClick={() => { setSelectedStudent(null); fetchStudents(); }}
            className="flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground bg-secondary border border-border px-3 py-1.5 rounded-xl transition-all"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Student Directory</span>
          </button>

          {/* Student Header Summary */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col md:flex-row justify-between gap-6">
            <div className="flex flex-col md:flex-row items-center gap-5">
              <div className="h-16 w-16 bg-primary text-primary-foreground font-black text-2xl flex items-center justify-center rounded-2xl shadow-lg">
                {selectedStudent.name.charAt(0)}
              </div>
              <div className="text-center md:text-left space-y-1">
                <h2 className="text-xl font-extrabold">{selectedStudent.name}</h2>
                <div className="flex flex-wrap justify-center md:justify-start items-center gap-2">
                  <span className="text-[10px] bg-secondary text-primary font-bold px-2 py-0.5 rounded tracking-wide">{selectedStudent.admissionNumber}</span>
                  <span className="text-[10px] text-muted-foreground">• Joined: {new Date(selectedStudent.joiningDate).toLocaleDateString()}</span>
                  <span className="text-[10px] text-muted-foreground">• Branch: {selectedStudent.branch?.name}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2">
              <span className={`text-xs font-bold px-3 py-1 rounded-full ${selectedStudent.status === 'ACTIVE'
                ? 'bg-emerald-500/10 text-emerald-500'
                : selectedStudent.status === 'INACTIVE'
                  ? 'bg-amber-500/10 text-amber-500'
                  : 'bg-rose-500/10 text-rose-500'
                }`}>
                {selectedStudent.status}
              </span>
              <button
                onClick={handleOpenEditForm}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-primary bg-primary/5 hover:bg-primary/10 rounded-xl cursor-pointer"
              >
                <Edit2 className="h-4 w-4" />
                <span>Edit Profile</span>
              </button>
              <button
                onClick={() => handleDeleteStudent(selectedStudent.id)}
                className="px-3 py-1.5 text-xs font-semibold text-rose-500 bg-rose-500/5 hover:bg-rose-500/10 rounded-xl"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Profile Tabs Navigation */}
          <div className="flex border-b border-border text-sm font-semibold gap-4 overflow-x-auto">
            {(['profile', 'attendance', 'fees', 'docs', 'notes'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-2.5 px-1 capitalize transition-all border-b-2 ${activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
              >
                {tab === 'docs' ? 'Documents' : tab === 'fees' ? 'Fee Ledger' : tab}
              </button>
            ))}
          </div>

          {/* Tabs Display Container */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm min-h-64">

            {/* TAB 1: PROFILE */}
            {activeTab === 'profile' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-xs">
                <div className="space-y-4">
                  <h4 className="font-extrabold text-sm border-b border-border pb-1 text-primary">Personal Details</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-muted-foreground font-bold uppercase block">Gender</span>
                      <span className="text-foreground text-sm font-semibold">{selectedStudent.gender}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground font-bold uppercase block">Date of Birth</span>
                      <span className="text-foreground text-sm font-semibold">{new Date(selectedStudent.dob).toLocaleDateString()}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground font-bold uppercase block">Email Address</span>
                      <span className="text-foreground text-sm font-semibold">{selectedStudent.email || 'Unprovided'}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground font-bold uppercase block">Emergency Phone</span>
                      <span className="text-foreground text-sm font-semibold">{selectedStudent.emergencyContact}</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground font-bold uppercase block">Address</span>
                    <span className="text-foreground text-sm font-semibold leading-relaxed">{selectedStudent.address}</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-extrabold text-sm border-b border-border pb-1 text-primary">Parent / Guardian Details</h4>
                  <div className="space-y-3">
                    <div>
                      <span className="text-muted-foreground font-bold uppercase block">Guardian Name</span>
                      <span className="text-foreground text-sm font-semibold">{selectedStudent.parentName}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground font-bold uppercase block">Contact Mobile</span>
                      <span className="text-foreground text-sm font-semibold">{selectedStudent.parentPhone}</span>
                    </div>
                  </div>

                  <h4 className="font-extrabold text-sm border-b border-border pb-1 text-primary pt-2">Current Classes & Batches</h4>
                  {selectedStudent.batches.length === 0 ? (
                    <span className="text-muted-foreground">Unassigned to any schedule.</span>
                  ) : (
                    selectedStudent.batches.map((b: any) => (
                      <div key={b.batchId} className="bg-secondary/40 border border-border p-3 rounded-xl space-y-1">
                        <span className="font-bold text-foreground text-sm block">{b.batch.name}</span>
                        <div className="text-[10px] text-muted-foreground leading-tight space-y-0.5">
                          <div>Course: {b.batch.course.name}</div>
                          <div>Timings: {b.batch.schedule}</div>
                          <div>Instructor: {b.batch.instructor.name}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: ATTENDANCE */}
            {activeTab === 'attendance' && (
              <div className="space-y-6 text-xs">
                <div className="flex items-center gap-4 p-4 bg-secondary/30 border border-border rounded-xl">
                  <div>
                    <span className="text-muted-foreground font-bold uppercase">Total Checked</span>
                    <p className="text-xl font-bold">{selectedStudent.attendances?.length || 0} classes</p>
                  </div>
                  <div className="border-l border-border pl-4">
                    <span className="text-muted-foreground font-bold uppercase">Rate</span>
                    <p className="text-xl font-bold text-emerald-500">
                      {selectedStudent.attendances?.length > 0
                        ? `${Math.round((selectedStudent.attendances.filter((a: any) => a.status === 'PRESENT' || a.status === 'LATE').length / selectedStudent.attendances.length) * 100)}%`
                        : '100%'}
                    </p>
                  </div>
                </div>

                <div className="border border-border rounded-xl overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-secondary/50 border-b border-border font-bold">
                      <tr>
                        <th className="p-3">Date</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Remarks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {selectedStudent.attendances?.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="p-6 text-center text-muted-foreground">No attendance records.</td>
                        </tr>
                      ) : (
                        selectedStudent.attendances.map((a: any) => (
                          <tr key={a.id} className="hover:bg-secondary/10">
                            <td className="p-3 font-semibold">{new Date(a.date).toLocaleDateString()}</td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded font-bold text-[9px] ${a.status === 'PRESENT' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'
                                }`}>
                                {a.status}
                              </span>
                            </td>
                            <td className="p-3 text-muted-foreground">{a.remarks || '-'}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 3: FEES LEDGER */}
            {activeTab === 'fees' && (() => {
              // Group fees by year for analytics
              const yearAnalytics = (selectedStudent.fees || []).reduce((acc: Record<number, { total: number; paid: number; pending: number }>, f: any) => {
                const year = new Date(f.dueDate).getFullYear();
                if (!acc[year]) {
                  acc[year] = { total: 0, paid: 0, pending: 0 };
                }
                const total = Number(f.amount);
                const paid = f.payments ? f.payments.reduce((sum: number, p: any) => sum + Number(p.amountPaid), 0) : 0;
                const pending = f.status === 'PAID' ? 0 : Math.max(0, total - paid);

                acc[year].total += total;
                acc[year].paid += paid;
                acc[year].pending += pending;
                return acc;
              }, {});

              // Get unique years in descending order for the filter dropdown
              const ledgerYears = Array.from(new Set((selectedStudent.fees || []).map((f: any) => new Date(f.dueDate).getFullYear().toString()))).sort().reverse();

              // Filter fees list by selected year & billing type
              const filteredFees = (selectedStudent.fees || []).filter((f: any) => {
                const matchYear = ledgerYearFilter === 'all' || new Date(f.dueDate).getFullYear().toString() === ledgerYearFilter;
                const matchType = ledgerTypeFilter === 'all' || f.type === ledgerTypeFilter;
                return matchYear && matchType;
              });

              return (
                <div className="space-y-6 text-xs animate-fade-in">

                  {/* Analytics Section */}
                  <div>
                    <h5 className="font-extrabold text-[10px] uppercase tracking-wider text-muted-foreground mb-3">Year-wise Fee Analytics</h5>
                    {Object.keys(yearAnalytics).length === 0 ? (
                      <div className="bg-secondary/20 border border-border p-4 rounded-xl text-center text-muted-foreground">
                        No financial statistics available.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {Object.entries(yearAnalytics).map(([year, stats]: any) => (
                          <div key={year} className="bg-secondary/40 border border-border/80 p-4 rounded-2xl shadow-sm relative overflow-hidden group hover:border-primary/30 transition-all duration-300">
                            {/* Decorative background circle */}
                            <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-primary/5 group-hover:scale-125 transition-transform duration-500" />

                            <div className="flex justify-between items-center border-b border-border/60 pb-2 mb-3">
                              <span className="font-black text-sm text-foreground tracking-tight">Year {year}</span>
                              <span className="text-[9px] font-extrabold tracking-wider text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full uppercase">Summary</span>
                            </div>
                            <div className="space-y-1.5">
                              <div className="flex justify-between items-center text-xs">
                                <span className="text-muted-foreground font-medium">Total Invoiced</span>
                                <span className="font-extrabold text-foreground">₹{stats.total.toLocaleString('en-IN')}</span>
                              </div>
                              <div className="flex justify-between items-center text-xs">
                                <span className="text-muted-foreground font-medium">Total Paid</span>
                                <span className="font-black text-emerald-500">₹{stats.paid.toLocaleString('en-IN')}</span>
                              </div>
                              <div className="flex justify-between items-center text-xs">
                                <span className="text-muted-foreground font-medium">Total Pending</span>
                                <span className={`font-black ${stats.pending > 0 ? 'text-rose-500' : 'text-muted-foreground'}`}>
                                  ₹{stats.pending.toLocaleString('en-IN')}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <hr className="border-border/60 my-6" />

                  {/* Header & Year/Type Filters */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <h4 className="font-extrabold text-sm text-primary">Invoices & Bills Ledger</h4>
                    <div className="flex flex-wrap items-center gap-4">
                      {/* Year Filter */}
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground font-bold uppercase tracking-wider text-[9px]">Year:</span>
                        <select
                          value={ledgerYearFilter}
                          onChange={(e) => setLedgerYearFilter(e.target.value)}
                          className="bg-card border border-border text-foreground py-1.5 px-3 rounded-xl font-semibold shadow-sm focus:outline-none focus:ring-1 focus:ring-primary/50 text-[11px]"
                        >
                          <option value="all">All Years</option>
                          {ledgerYears.map((yr: string) => (
                            <option key={yr} value={yr}>{yr}</option>
                          ))}
                        </select>
                      </div>

                      {/* Billing Type Filter */}
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground font-bold uppercase tracking-wider text-[9px]">Billing Type:</span>
                        <select
                          value={ledgerTypeFilter}
                          onChange={(e) => setLedgerTypeFilter(e.target.value)}
                          className="bg-card border border-border text-foreground py-1.5 px-3 rounded-xl font-semibold shadow-sm focus:outline-none focus:ring-1 focus:ring-primary/50 text-[11px]"
                        >
                          <option value="all">All Types</option>
                          <option value="MONTHLY">Monthly</option>
                          <option value="REGISTRATION">Registration</option>
                          <option value="EVENT">Event</option>
                          <option value="OTHER">Other</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Ledger Table */}
                  <div className="border border-border rounded-xl overflow-hidden">
                    <table className="w-full text-left">
                      <thead className="bg-secondary/50 border-b border-border font-bold">
                        <tr>
                          <th className="p-3">Billing Type</th>
                          <th className="p-3">Amount</th>
                          <th className="p-3">Due Date</th>
                          <th className="p-3">Status</th>
                          <th className="p-3">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {filteredFees.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="p-6 text-center text-muted-foreground">No matching fee invoices recorded for the selected filters.</td>
                          </tr>
                        ) : (
                          filteredFees.map((f: any) => (
                            <tr key={f.id} className="hover:bg-secondary/10">
                              <td className="p-3 font-semibold text-foreground uppercase tracking-wide text-[10px]">{f.type}</td>
                              <td className="p-3 font-bold">₹{Number(f.amount).toLocaleString()}</td>
                              <td className="p-3 text-muted-foreground">{new Date(f.dueDate).toLocaleDateString()}</td>
                              <td className="p-3">
                                <span className={`px-2 py-0.5 rounded font-bold text-[9px] ${f.status === 'PAID'
                                  ? 'bg-emerald-500/10 text-emerald-500'
                                  : f.status === 'PARTIALLY_PAID'
                                    ? 'bg-blue-500/10 text-blue-500'
                                    : 'bg-rose-500/10 text-rose-500'
                                  }`}>
                                  {f.status}
                                </span>
                              </td>
                              <td className="p-3">
                                {f.status !== 'PAID' ? (
                                  <button
                                    onClick={() => openCollectFeeModal(f)}
                                    className="flex items-center gap-1 text-[10px] font-bold text-primary hover:underline cursor-pointer"
                                  >
                                    <CreditCard className="h-3 w-3" />
                                    <span>Collect</span>
                                  </button>
                                ) : (
                                  f.payments && f.payments.length > 0 && (
                                    <button
                                      onClick={() => showReceipt(f.payments[0], f)}
                                      className="text-[10px] text-primary font-bold hover:underline cursor-pointer"
                                    >
                                      View Receipt
                                    </button>
                                  )
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })()}

            {/* TAB 4: DOCUMENTS */}
            {activeTab === 'docs' && (
              <div className="space-y-6 text-xs">

                {/* Upload Form */}
                <form onSubmit={handleDocumentUpload} className="bg-secondary/35 border border-border p-4 rounded-xl flex flex-col sm:flex-row gap-3">
                  <div className="flex-1 space-y-1">
                    <label className="font-bold text-muted-foreground uppercase">Document Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Aadhar Card, Birth Cert"
                      value={docName}
                      onChange={(e) => setDocName(e.target.value)}
                      className="w-full bg-card border border-border px-3 py-1.5 rounded-lg outline-none"
                    />
                  </div>
                  <div className="flex-1 space-y-1">
                    <label className="font-bold text-muted-foreground uppercase">Mock Storage File URL</label>
                    <input
                      type="text"
                      placeholder="https://supabase-storage-mock.com/files/1.pdf"
                      value={docUrl}
                      onChange={(e) => setDocUrl(e.target.value)}
                      className="w-full bg-card border border-border px-3 py-1.5 rounded-lg outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    className="self-end flex items-center justify-center gap-1 bg-primary text-primary-foreground font-bold px-4 py-2 rounded-lg"
                  >
                    <Upload className="h-4.5 w-4.5" />
                    <span>Upload</span>
                  </button>
                </form>

                {/* Documents List */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {selectedStudent.documents.length === 0 ? (
                    <div className="col-span-2 text-center text-muted-foreground py-8">No uploaded files.</div>
                  ) : (
                    selectedStudent.documents.map((d: any) => (
                      <div key={d.id} className="border border-border p-3.5 rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <FileText className="h-5 w-5 text-primary shrink-0" />
                          <div className="min-w-0">
                            <a href={d.fileUrl} target="_blank" rel="noreferrer" className="font-semibold text-foreground hover:underline truncate block">{d.name}</a>
                            <span className="text-[9px] text-muted-foreground">{new Date(d.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteDocument(d.id)}
                          className="text-rose-500 hover:bg-rose-500/10 p-1 rounded-lg"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>

              </div>
            )}

            {/* TAB 5: NOTES */}
            {activeTab === 'notes' && (
              <div className="space-y-4 text-xs text-muted-foreground">
                <p>System remarks & audit updates associated with student profile admissions.</p>
                <div className="space-y-3">
                  <div className="border border-border p-4 rounded-xl bg-secondary/25">
                    <span className="font-bold text-foreground block mb-1">Admitted to Branch</span>
                    <span className="block">Successfully onboarding completed by registrars. Initial registration invoice generated automatically.</span>
                    <span className="text-[10px] block mt-2 font-semibold">{new Date(selectedStudent.joiningDate).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>

      ) : (

        /* ========================================================= */
        /* MASTER STUDENT LIST GRID VIEW                             */
        /* ========================================================= */
        <div className="space-y-6">

          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight">Student Directory</h2>
              <p className="text-sm text-muted-foreground mt-0.5">Manage admissions, view class mappings, and billing history.</p>
            </div>
            <button
              onClick={handleOpenCreateForm}
              className="flex items-center gap-2 bg-primary hover:bg-primary/95 text-primary-foreground font-bold px-4 py-2 rounded-xl shadow-lg shadow-primary/20 transition-all cursor-pointer text-sm"
            >
              <Plus className="h-4 w-4" />
              <span>Admit Student</span>
            </button>
          </div>

          {/* Filtering panel */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 bg-card border border-border p-4 rounded-2xl shadow-sm">
            <div className="relative col-span-1 sm:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by name, admission ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-secondary border border-border rounded-xl pl-10 pr-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <div>
              <select
                value={batchFilter}
                onChange={(e) => setBatchFilter(e.target.value)}
                className="w-full bg-secondary border border-border px-3 py-2 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                <option value="">All Batches</option>
                {batches.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
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
                <option value="DROPOUT">Dropout</option>
              </select>
            </div>
          </div>

          {/* Table Directory */}
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-16 bg-card border border-border rounded-xl animate-pulse" />
              ))}
            </div>
          ) : students.length === 0 ? (
            <div className="bg-card border border-border p-12 rounded-2xl text-center text-muted-foreground">
              No registered students found.
            </div>
          ) : (
            <div className="border border-border rounded-2xl bg-card shadow-sm overflow-hidden text-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-secondary/50 border-b border-border font-bold">
                    <tr>
                      <th className="p-4">Student Name</th>
                      <th className="p-4">Admission #</th>
                      <th className="p-4">Parent / Phone</th>
                      <th className="p-4">Branch</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {students.map((s) => (
                      <tr key={s.id} className="hover:bg-secondary/15">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 bg-primary/10 text-primary font-bold flex items-center justify-center rounded-lg">
                              {s.name.charAt(0)}
                            </div>
                            <span className="font-semibold text-foreground">{s.name}</span>
                          </div>
                        </td>
                        <td className="p-4 font-mono font-semibold">{s.admissionNumber}</td>
                        <td className="p-4">
                          <div className="space-y-0.5">
                            <div>{s.parentName}</div>
                            <div className="text-muted-foreground">{s.parentPhone}</div>
                          </div>
                        </td>
                        <td className="p-4 font-medium">{s.branch?.name.replace('Dance School ', '')}</td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded font-bold text-[9px] ${s.status === 'ACTIVE'
                            ? 'bg-emerald-500/10 text-emerald-500'
                            : s.status === 'INACTIVE'
                              ? 'bg-amber-500/10 text-amber-500'
                              : 'bg-rose-500/10 text-rose-500'
                            }`}>
                            {s.status}
                          </span>
                        </td>
                        <td className="p-4">
                          <button
                            onClick={() => selectStudentProfile(s.id)}
                            className="text-xs text-primary font-bold hover:underline"
                          >
                            View Profile
                          </button>
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

      {/* 1. ADMISSION DRAWER OVERLAY */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-card border-l border-border h-full p-6 overflow-y-auto flex flex-col justify-between shadow-2xl animate-slide-in">
            <div className="space-y-6">

              {/* Header */}
              <div className="flex justify-between items-center pb-4 border-b border-border">
                <h3 className="text-lg font-bold">{isEditMode ? 'Edit Student Profile' : 'New Student Admission Form'}</h3>
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

              {/* Form Input fields */}
              <form onSubmit={handleSubmitAdmission} className="space-y-4 text-xs">

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-bold text-muted-foreground uppercase">Admission Number *</label>
                    <input
                      type="text"
                      value={admissionNumber}
                      onChange={(e) => setAdmissionNumber(e.target.value)}
                      className="w-full bg-secondary border border-border px-3 py-2 rounded-lg outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-muted-foreground uppercase">Gender *</label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="w-full bg-secondary border border-border px-3 py-2 rounded-lg outline-none"
                    >
                      <option value="Female">Female</option>
                      <option value="Male">Male</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-muted-foreground uppercase">Student Full Name *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter student name"
                    className="w-full bg-secondary border border-border px-3 py-2 rounded-lg outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-bold text-muted-foreground uppercase">Date of Birth *</label>
                    <input
                      type="date"
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      className="w-full bg-secondary border border-border px-3 py-2 rounded-lg outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-muted-foreground uppercase">Date of Joining *</label>
                    <input
                      type="date"
                      value={joiningDate}
                      onChange={(e) => setJoiningDate(e.target.value)}
                      className="w-full bg-secondary border border-border px-3 py-2 rounded-lg outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-bold text-muted-foreground uppercase">Parent / Guardian Name *</label>
                    <input
                      type="text"
                      value={parentName}
                      onChange={(e) => setParentName(e.target.value)}
                      placeholder="Guardian name"
                      className="w-full bg-secondary border border-border px-3 py-2 rounded-lg outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-muted-foreground uppercase">Parent Phone *</label>
                    <input
                      type="text"
                      value={parentPhone}
                      onChange={(e) => setParentPhone(e.target.value)}
                      placeholder="Mobile contact"
                      className="w-full bg-secondary border border-border px-3 py-2 rounded-lg outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-bold text-muted-foreground uppercase">Email ID</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="student@gmail.com"
                      className="w-full bg-secondary border border-border px-3 py-2 rounded-lg outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-muted-foreground uppercase">Emergency Contact *</label>
                    <input
                      type="text"
                      value={emergencyContact}
                      onChange={(e) => setEmergencyContact(e.target.value)}
                      placeholder="Second mobile number"
                      className="w-full bg-secondary border border-border px-3 py-2 rounded-lg outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-muted-foreground uppercase">Home Address *</label>
                  <textarea
                    rows={2}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Residential Address"
                    className="w-full bg-secondary border border-border px-3 py-2 rounded-lg outline-none"
                  />
                </div>

                {isEditMode && (
                  <div className="space-y-1">
                    <label className="font-bold text-muted-foreground uppercase">Student Status *</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="w-full bg-secondary border border-border px-3 py-2 rounded-lg outline-none"
                    >
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="INACTIVE">INACTIVE</option>
                      <option value="DROPOUT">DROPOUT</option>
                    </select>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="font-bold text-muted-foreground uppercase">Branch Location *</label>
                  <select
                    value={branchId}
                    onChange={(e) => setBranchId(e.target.value)}
                    disabled={user?.role !== 'SUPER_ADMIN'}
                    className="w-full bg-secondary border border-border px-3 py-2 rounded-lg outline-none disabled:opacity-75"
                  >
                    <option value="">Select Location</option>
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>

                <div className="bg-secondary/40 border border-border p-3.5 rounded-xl space-y-3">
                  <span className="font-bold text-primary block">Initial Course & Class Allocation (Optional)</span>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="font-bold text-muted-foreground uppercase text-[9px]">Course Type</label>
                      <select
                        value={courseId}
                        onChange={(e) => setCourseId(e.target.value)}
                        className="w-full bg-card border border-border px-3 py-1.5 rounded-lg outline-none"
                      >
                        <option value="">Unallocated</option>
                        {courses.filter(c => c.status === 'ACTIVE').map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-muted-foreground uppercase text-[9px]">Class Batch</label>
                      <select
                        value={batchId}
                        onChange={(e) => setBatchId(e.target.value)}
                        className="w-full bg-card border border-border px-3 py-1.5 rounded-lg outline-none"
                      >
                        <option value="">Unallocated</option>
                        {batches.filter(b => b.status === 'ACTIVE' && (!courseId || b.courseId === courseId) && (!branchId || b.branchId === branchId)).map(b => (
                          <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <p className="text-[9px] text-muted-foreground block">Note: Assigning a Course will automatically generate Registration & Monthly Fee invoices.</p>
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
                onClick={handleSubmitAdmission}
                className="flex-1 bg-primary hover:bg-primary/95 text-primary-foreground font-bold py-2 px-4 rounded-xl shadow-lg"
              >
                {isEditMode ? 'Save Changes' : 'Complete Admission'}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 2. COLLECT FEE INLINE MODAL OVERLAY */}
      {isCollectOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-card border border-border rounded-2xl p-6 shadow-2xl space-y-4 animate-scale-in text-xs">
            <div className="flex justify-between items-center pb-2 border-b border-border">
              <h3 className="text-sm font-bold">Log Student Payment</h3>
              <button
                onClick={() => setIsCollectOpen(false)}
                className="p-1 hover:bg-secondary rounded-lg"
              >
                <Plus className="h-5 w-5 rotate-45" />
              </button>
            </div>

            <form onSubmit={handleCollectFee} className="space-y-4">
              <div>
                <span className="text-muted-foreground font-bold block">Fee Invoice Amount</span>
                <p className="text-base font-bold text-foreground uppercase tracking-wide">
                  {collectFeeRecord?.type} - ₹{Number(collectFeeRecord?.amount).toLocaleString()}
                </p>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-muted-foreground uppercase">Amount Paid (INR) *</label>
                <input
                  type="number"
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value)}
                  className="w-full bg-secondary border border-border px-3 py-2 rounded-lg outline-none text-sm font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-muted-foreground uppercase">Mode *</label>
                  <select
                    value={paymentMode}
                    onChange={(e: any) => setPaymentMode(e.target.value)}
                    className="w-full bg-secondary border border-border px-3 py-2 rounded-lg outline-none"
                  >
                    <option value="UPI">UPI</option>
                    <option value="CASH">CASH</option>
                    <option value="CARD">CARD</option>
                    <option value="BANK_TRANSFER">BANK TRANSFER</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-muted-foreground uppercase">Txn ID / Ref</label>
                  <input
                    type="text"
                    placeholder="e.g. UPI Ref, Bank ID"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    className="w-full bg-secondary border border-border px-3 py-2 rounded-lg outline-none"
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsCollectOpen(false)}
                  className="flex-1 bg-secondary border border-border py-2 px-3 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-primary text-primary-foreground py-2 px-3 rounded-xl font-bold shadow-lg"
                >
                  Log Transaction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. RECEIPT VIEWER POPUP OVERLAY */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-card border border-border rounded-2xl p-6 shadow-2xl space-y-6 animate-scale-in text-xs text-foreground">
            <div className="flex justify-between items-center pb-2 border-b border-border">
              <h3 className="font-extrabold text-sm text-primary uppercase">RUDRESHWAR DANCE ACADEMY RECEIPT</h3>
              <button onClick={() => setSelectedReceipt(null)} className="p-1 hover:bg-secondary rounded-lg justify-center flex items-center">
                <Plus className="h-5 w-5 rotate-45" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between">
                <div>
                  <span className="text-muted-foreground block font-bold text-[9px] uppercase">Receipt Number</span>
                  <span className="font-bold text-sm text-foreground">{selectedReceipt.payment.receiptNumber}</span>
                </div>
                <div className="text-right">
                  <span className="text-muted-foreground block font-bold text-[9px] uppercase">Payment Date</span>
                  <span className="font-bold text-foreground">{new Date(selectedReceipt.payment.paymentDate).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="p-3 bg-secondary/50 border border-border rounded-xl space-y-1">
                <span className="text-muted-foreground font-bold block text-[9px] uppercase">Received From</span>
                <p className="font-extrabold text-foreground">{selectedReceipt.fee?.student?.name}</p>
                <p className="text-[10px] text-muted-foreground">Admission: {selectedReceipt.fee?.student?.admissionNumber}</p>
              </div>

              <div className="divide-y divide-border">
                <div className="py-2.5 flex justify-between font-bold">
                  <span>Invoiced Item</span>
                  <span className="uppercase text-[9px] tracking-wider text-primary">
                    {selectedReceipt.fee?.type}
                    {selectedReceipt.fee?.type === 'MONTHLY' && selectedReceipt.fee?.dueDate && ` (${new Date(selectedReceipt.fee.dueDate).toLocaleDateString('default', { month: 'long', year: 'numeric' })})`}
                  </span>
                </div>
                <div className="py-2.5 flex justify-between font-medium text-muted-foreground">
                  <span>Payment Channel</span>
                  <span className="font-bold text-foreground">{selectedReceipt.payment.paymentMode}</span>
                </div>
                {selectedReceipt.payment.transactionId && (
                  <div className="py-2.5 flex justify-between font-medium text-muted-foreground">
                    <span>Transaction Reference</span>
                    <span className="font-mono text-foreground">{selectedReceipt.payment.transactionId}</span>
                  </div>
                )}
                <div className="py-3 flex justify-between font-black text-sm border-t border-border pt-3">
                  <span>TOTAL AMOUNT PAID</span>
                  <span className="text-emerald-500">₹{Number(selectedReceipt.payment.amountPaid).toLocaleString()}</span>
                </div>
              </div>

              <p className="text-[9px] text-center text-muted-foreground italic pt-2">This is an electronically generated receipt reference.</p>
            </div>

            <div className="pt-2 flex gap-3">
              <button
                onClick={() => setSelectedReceipt(null)}
                className="flex-1 bg-secondary border border-border py-2 px-3 rounded-xl font-bold cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => {
                  const html = generateTuitionReceiptHtml(selectedReceipt.payment, selectedReceipt.fee);
                  const studentName = selectedReceipt.fee?.student?.name || 'Student';
                  const feePeriod = selectedReceipt.fee?.type === 'MONTHLY' && selectedReceipt.fee?.dueDate
                    ? new Date(selectedReceipt.fee.dueDate).toLocaleDateString('default', { month: 'long', year: 'numeric' })
                    : selectedReceipt.fee?.type || 'Payment';
                  const fileName = `${studentName.replace(/\s+/g, '_')}-${feePeriod.replace(/\s+/g, '_')}-Payment.pdf`;
                  downloadReceiptPDF(html, fileName);
                }}
                className="flex-1 bg-primary text-primary-foreground py-2 px-3 rounded-xl font-bold shadow-md cursor-pointer hover:bg-primary/95 transition-colors"
              >
                Download PDF
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

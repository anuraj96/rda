import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';
import {
  TrendingUp, TrendingDown, DollarSign, Plus, Eye, CheckCircle, CreditCard, Search,
  Calendar, Award, AlertTriangle, Upload, Landmark, Trash2, Users, Banknote, Clock,
  ChevronRight, X
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

import { useLocation } from 'react-router-dom';

// ─── Helpers ────────────────────────────────────────────────────────────────

const fmt = (n: number) => `₹${Number(n).toLocaleString('en-IN')}`;

function parseSalaryDescription(desc: string) {
  // format: "[staffId:UUID] Salary Payout - Name (EmpId) [ROLE] | Period"
  const staffIdMatch = desc.match(/\[staffId:([^\]]+)\]/);
  const nameMatch = desc.match(/Salary Payout - (.+?) \(/);
  const empIdMatch = desc.match(/\(([^)]+)\)/);
  const roleMatch = desc.match(/\[([A-Z_]+)\]/g);
  const periodMatch = desc.match(/\| (.+)$/);
  return {
    staffId: staffIdMatch?.[1] || null,
    name: nameMatch?.[1] || null,
    empId: empIdMatch?.[1] || null,
    role: roleMatch?.[roleMatch.length - 1]?.replace(/\[|\]/g, '') || null,
    period: periodMatch?.[1] || null,
  };
}

// ─── Component ───────────────────────────────────────────────────────────────

export const Finances: React.FC = () => {
  const { user } = useAuthStore();
  const location = useLocation();

  const isSuperAdminOrAccountant =
    user?.role === 'SUPER_ADMIN' || user?.role === 'ACCOUNTANT';

  const [activeTab, setActiveTab] = useState<'fees' | 'defaulters' | 'income' | 'expenses' | 'pl' | 'salary'>(() => {
    return window.location.pathname === '/expenses' ? 'income' : 'fees';
  });
  const [loading, setLoading] = useState(true);

  // Lead States
  const [fees, setFees] = useState<any[]>([]);
  const [defaulters, setDefaulters] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [profitLoss, setProfitLoss] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);

  // Staff + Salary states
  const [staffList, setStaffList] = useState<any[]>([]);
  const [salaryPayouts, setSalaryPayouts] = useState<any[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<any | null>(null);
  const [staffPayoutHistory, setStaffPayoutHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [isSalaryPayoutOpen, setIsSalaryPayoutOpen] = useState(false);

  // Salary payout form state
  const [salaryStaffId, setSalaryStaffId] = useState('');
  const [salaryAmount, setSalaryAmount] = useState('');
  const [salaryDate, setSalaryDate] = useState(new Date().toISOString().split('T')[0]);
  const [salaryPeriod, setSalaryPeriod] = useState('');
  const [salaryBranchId, setSalaryBranchId] = useState('');
  const [salaryPaymentMode, setSalaryPaymentMode] = useState<'CASH' | 'UPI' | 'BANK_TRANSFER'>('BANK_TRANSFER');
  const [salaryNotes, setSalaryNotes] = useState('');
  const [salaryFormError, setSalaryFormError] = useState<string | null>(null);
  const [salarySubmitting, setSalarySubmitting] = useState(false);

  // Search & Filters
  const [search, setSearch] = useState('');
  const [feeStatus, setFeeStatus] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [staffSearch, setStaffSearch] = useState('');

  // Pagination States
  const [feesPage, setFeesPage] = useState(1);
  const [feesTotal, setFeesTotal] = useState(0);
  const [feesTotalPages, setFeesTotalPages] = useState(1);

  const [defPage, setDefPage] = useState(1);
  const [defTotal, setDefTotal] = useState(0);
  const [defTotalPages, setDefTotalPages] = useState(1);

  const [incomePage, setIncomePage] = useState(1);
  const [incomeTotal, setIncomeTotal] = useState(0);
  const [incomeTotalPages, setIncomeTotalPages] = useState(1);

  const [expPage, setExpPage] = useState(1);
  const [expTotal, setExpTotal] = useState(0);
  const [expTotalPages, setExpTotalPages] = useState(1);

  // Collect Fee Modal States
  const [isCollectOpen, setIsCollectOpen] = useState(false);
  const [collectFeeRecord, setCollectFeeRecord] = useState<any>(null);
  const [amountPaid, setAmountPaid] = useState('');
  const [paymentMode, setPaymentMode] = useState<'CASH' | 'UPI' | 'CARD' | 'BANK_TRANSFER'>('UPI');
  const [transactionId, setTransactionId] = useState('');

  // Log Expense Modal States
  const [isExpenseOpen, setIsExpenseOpen] = useState(false);
  const [expCategory, setExpCategory] = useState<'RENT' | 'ELECTRICITY' | 'SALARY' | 'MARKETING' | 'COSTUME' | 'EQUIPMENT' | 'EVENT_EXPENSE' | 'MISCELLANEOUS'>('RENT');
  const [expAmount, setExpAmount] = useState('');
  const [expDate, setExpDate] = useState(new Date().toISOString().split('T')[0]);
  const [expDescription, setExpDescription] = useState('');
  const [expBillUrl, setExpBillUrl] = useState('');
  const [expBranchId, setExpBranchId] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Receipt modal state
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null);

  // Generate list of due months statically (e.g., last 12 months and next 6 months)
  const uniqueMonths = (() => {
    const list = [];
    const now = new Date();
    for (let i = -6; i <= 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      list.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    }
    return list;
  })();

  const formatMonthYear = (monthStr: string) => {
    if (!monthStr) return '';
    const [year, month] = monthStr.split('-');
    const date = new Date(Number(year), Number(month) - 1, 1);
    return date.toLocaleDateString('default', { month: 'long', year: 'numeric' });
  };

  const filteredFees = fees;

  const isExpensesRoute = location.pathname === '/expenses';
  const baseTabs = isExpensesRoute
    ? (['income', 'expenses', 'pl'] as const)
    : (['fees', 'defaulters'] as const);
  const availableTabs = isSuperAdminOrAccountant && isExpensesRoute
    ? ([...baseTabs, 'salary'] as const)
    : baseTabs;

  const fetchFinancials = async () => {
    try {
      setLoading(true);
      if (activeTab === 'fees') {
        const res = await api.get('/fees', { params: { search, status: feeStatus, month: selectedMonth, page: feesPage, limit: 10 } });
        setFees(res.data.data);
        setFeesTotal(res.data.meta?.total || 0);
        setFeesTotalPages(res.data.meta?.totalPages || 1);
      } else if (activeTab === 'defaulters') {
        const res = await api.get('/fees/defaulters', { params: { page: defPage, limit: 10 } });
        setDefaulters(res.data.data);
        setDefTotal(res.data.meta?.total || 0);
        setDefTotalPages(res.data.meta?.totalPages || 1);
      } else if (activeTab === 'income') {
        const res = await api.get('/fees', { params: { status: 'PAID', page: incomePage, limit: 10 } });
        setFees(res.data.data);
        setIncomeTotal(res.data.meta?.total || 0);
        setIncomeTotalPages(res.data.meta?.totalPages || 1);
      } else if (activeTab === 'expenses') {
        const res = await api.get('/expenses', { params: { page: expPage, limit: 10 } });
        setExpenses(res.data.data);
        setExpTotal(res.data.meta?.total || 0);
        setExpTotalPages(res.data.meta?.totalPages || 1);
      } else if (activeTab === 'pl') {
        const res = await api.get('/finances/pl');
        setProfitLoss(res.data.data);
      } else if (activeTab === 'salary') {
        await fetchStaffAndPayouts();
      }
    } catch { } finally {
      setLoading(false);
    }
  };

  const fetchStaffAndPayouts = async () => {
    try {
      const [staffRes, payoutsRes] = await Promise.all([
        api.get('/staff', { params: { limit: 100 } }),
        api.get('/finances/salary-payouts', { params: { limit: 100 } }),
      ]);
      // Exclude SUPER_ADMIN from salary management
      const allStaff = (staffRes.data.data || []).filter(
        (s: any) => s.role?.name !== 'SUPER_ADMIN'
      );
      setStaffList(allStaff);
      setSalaryPayouts(payoutsRes.data.data || []);
    } catch { }
  };

  const fetchBranches = async () => {
    try {
      const res = await api.get('/branches');
      setBranches(res.data.data);
    } catch { }
  };

  const fetchStaffHistory = async (staffId: string) => {
    setHistoryLoading(true);
    try {
      const res = await api.get('/finances/salary-payouts', { params: { staffId, limit: 50 } });
      setStaffPayoutHistory(res.data.data || []);
    } catch { } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (location.pathname === '/expenses') {
      setActiveTab('income');
    } else if (location.pathname === '/fees') {
      setActiveTab('fees');
    }
  }, [location.pathname]);

  useEffect(() => {
    fetchFinancials();
  }, [activeTab, search, feeStatus, selectedMonth, feesPage, defPage, incomePage, expPage]);

  useEffect(() => {
    fetchBranches();
  }, []);

  // Auto-fill branch when staff is selected for salary payout
  useEffect(() => {
    if (salaryStaffId) {
      const found = staffList.find(s => s.id === salaryStaffId);
      if (found) {
        setSalaryAmount(found.salary ? String(Number(found.salary)) : '');
        setSalaryBranchId(found.branchId || '');
      }
    }
  }, [salaryStaffId, staffList]);

  const openCollectFeeModal = (fee: any) => {
    setCollectFeeRecord(fee);
    const totalPayments = fee.payments?.reduce((sum: number, p: any) => sum + Number(p.amountPaid), 0) || 0;
    const remaining = Number(fee.amount) - totalPayments;
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
        remarks: 'Collected from financial workspace'
      });
      setIsCollectOpen(false);
      fetchFinancials();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Payment collection failed');
    }
  };

  const openExpenseModal = () => {
    setExpCategory('RENT');
    setExpAmount('');
    setExpDate(new Date().toISOString().split('T')[0]);
    setExpDescription('');
    setExpBillUrl('');
    setExpBranchId(user?.branchId || '');
    setFormError(null);
    setIsExpenseOpen(true);
  };

  const handleLogExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expAmount || !expDescription || !expBranchId) {
      setFormError('Please fill out all required fields');
      return;
    }
    setFormError(null);

    const payload = {
      category: expCategory,
      amount: Number(expAmount),
      date: new Date(expDate).toISOString(),
      description: expDescription,
      billUrl: expBillUrl || null,
      branchId: expBranchId,
      status: 'PAID'
    };

    try {
      await api.post('/expenses', payload);
      setIsExpenseOpen(false);
      fetchFinancials();
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Expense logging failed');
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (window.confirm('Delete this expense entry?')) {
      try {
        await api.delete(`/expenses/${id}`);
        fetchFinancials();
      } catch { }
    }
  };

  const openSalaryPayoutModal = () => {
    const now = new Date();
    const currentPeriod = now.toLocaleDateString('default', { month: 'long', year: 'numeric' });
    setSalaryStaffId('');
    setSalaryAmount('');
    setSalaryDate(now.toISOString().split('T')[0]);
    setSalaryPeriod(currentPeriod);
    setSalaryBranchId('');
    setSalaryPaymentMode('BANK_TRANSFER');
    setSalaryNotes('');
    setSalaryFormError(null);
    setIsSalaryPayoutOpen(true);
  };

  const handleRecordSalaryPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!salaryStaffId || !salaryAmount || !salaryBranchId || !salaryPeriod) {
      setSalaryFormError('Please fill all required fields including period.');
      return;
    }
    setSalaryFormError(null);
    setSalarySubmitting(true);
    try {
      await api.post('/expenses', {
        category: 'SALARY',
        staffId: salaryStaffId,
        amount: Number(salaryAmount),
        date: new Date(salaryDate).toISOString(),
        description: `${salaryPeriod}${salaryNotes ? ' - ' + salaryNotes : ''}`,
        branchId: salaryBranchId,
        status: 'PAID',
      });
      setIsSalaryPayoutOpen(false);
      fetchFinancials();
    } catch (err: any) {
      setSalaryFormError(err.response?.data?.message || 'Failed to record salary payout');
    } finally {
      setSalarySubmitting(false);
    }
  };

  const openStaffHistory = (staff: any) => {
    setSelectedStaff(staff);
    fetchStaffHistory(staff.id);
  };

  const showReceipt = (payment: any, fee: any) => {
    setSelectedReceipt({ payment, fee });
  };

  // Filtered staff for salary tab
  const filteredStaff = staffList.filter(s =>
    !staffSearch ||
    s.name?.toLowerCase().includes(staffSearch.toLowerCase()) ||
    s.employeeId?.toLowerCase().includes(staffSearch.toLowerCase()) ||
    s.role?.name?.toLowerCase().includes(staffSearch.toLowerCase())
  );

  // Compute last paid date for each staff from salary payouts
  const lastPaidMap: Record<string, { date: string; amount: number }> = {};
  salaryPayouts.forEach(p => {
    const parsed = parseSalaryDescription(p.description || '');
    if (parsed.staffId && (!lastPaidMap[parsed.staffId] || new Date(p.date) > new Date(lastPaidMap[parsed.staffId].date))) {
      lastPaidMap[parsed.staffId] = { date: p.date, amount: Number(p.amount) };
    }
  });

  // Role badge color
  const roleBadge = (role: string) => {
    const map: Record<string, string> = {
      BRANCH_MANAGER: 'bg-purple-500/15 text-purple-400',
      INSTRUCTOR: 'bg-blue-500/15 text-blue-400',
      STAFF: 'bg-teal-500/15 text-teal-400',
      ACCOUNTANT: 'bg-amber-500/15 text-amber-400',
    };
    return map[role] || 'bg-secondary text-muted-foreground';
  };

  return (
    <div className="space-y-6">

      {/* Title Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight">Financial Hub</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Collect student registration and tuition fees, track bills, log expenses, and check P&L metrics.</p>
        </div>

        {activeTab === 'expenses' && (
          <button
            onClick={openExpenseModal}
            className="flex items-center gap-2 bg-primary hover:bg-primary/95 text-primary-foreground font-bold px-4 py-2 rounded-xl shadow-lg cursor-pointer text-sm"
          >
            <Plus className="h-4 w-4" />
            <span>Log Expense Receipt</span>
          </button>
        )}

        {activeTab === 'salary' && isSuperAdminOrAccountant && (
          <button
            onClick={openSalaryPayoutModal}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-xl shadow-lg cursor-pointer text-sm"
          >
            <Banknote className="h-4 w-4" />
            <span>Record Salary Payout</span>
          </button>
        )}
      </div>

      {/* Tabs list */}
      <div className="flex border-b border-border text-sm font-semibold gap-4 overflow-x-auto">
        {availableTabs.map(tab => (
          <button
            key={tab}
            onClick={() => { setActiveTab(tab as any); setSearch(''); setFeeStatus(''); setSelectedMonth(''); }}
            className={`pb-2.5 px-1 capitalize transition-all border-b-2 whitespace-nowrap ${activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
          >
            {tab === 'fees'
              ? 'Tuition Bills'
              : tab === 'defaulters'
                ? 'Defaulters Ledger'
                : tab === 'pl'
                  ? 'Profit & Loss Chart'
                  : tab === 'salary'
                    ? 'Staff Salary'
                    : tab}
          </button>
        ))}
      </div>

      {/* Workspace Display */}
      <div className="space-y-6">

        {/* TAB 1: TUITION FEES */}
        {activeTab === 'fees' && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 bg-card border border-border p-4 rounded-2xl">
              <div className="relative col-span-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search by student name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-secondary border border-border rounded-xl pl-10 pr-4 py-2 outline-none"
                />
              </div>
              <div>
                <select
                  value={feeStatus}
                  onChange={(e) => setFeeStatus(e.target.value)}
                  className="w-full bg-secondary border border-border px-3 py-2 rounded-xl outline-none"
                >
                  <option value="">All Payments Statuses</option>
                  <option value="PENDING">Pending</option>
                  <option value="PARTIALLY_PAID">Partially Paid</option>
                  <option value="PAID">Paid</option>
                  <option value="OVERDUE">Overdue</option>
                </select>
              </div>
              <div>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-full bg-secondary border border-border px-3 py-2 rounded-xl outline-none"
                >
                  <option value="">All Due Months</option>
                  {uniqueMonths.map(m => (
                    <option key={m} value={m}>{formatMonthYear(m)}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="border border-border rounded-2xl bg-card shadow-sm overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-secondary/50 border-b border-border font-bold">
                  <tr>
                    <th className="p-3">Student Name</th>
                    <th className="p-3">Billing Category</th>
                    <th className="p-3">Invoice Amount</th>
                    <th className="p-3">Due Date</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {loading ? (
                    <tr><td colSpan={6} className="p-6 text-center animate-pulse text-muted-foreground">Loading fee ledger...</td></tr>
                  ) : filteredFees.length === 0 ? (
                    <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">No invoices registered.</td></tr>
                  ) : (
                    filteredFees.map(f => (
                      <tr key={f.id} className="hover:bg-secondary/10">
                        <td className="p-3">
                          <div className="font-semibold text-foreground">{f.student?.name}</div>
                          <div className="text-[10px] text-muted-foreground">{f.student?.admissionNumber}</div>
                        </td>
                        <td className="p-3 uppercase font-bold text-[9px] text-primary tracking-wide">{f.type}</td>
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
                              className="flex items-center gap-1 bg-primary text-primary-foreground font-bold px-3 py-1 rounded-lg"
                            >
                              <CreditCard className="h-3 w-3" />
                              <span>Collect Payment</span>
                            </button>
                          ) : (
                            <span className="text-muted-foreground flex items-center gap-1 font-semibold">
                              <CheckCircle className="h-4.5 w-4.5 text-emerald-500" />
                              <span>Collected</span>
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {!loading && filteredFees.length > 0 && (
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-2 text-xs font-semibold">
                <span className="text-muted-foreground">
                  Showing invoices {((feesPage - 1) * 10) + 1} - {Math.min(feesPage * 10, feesTotal)} of {feesTotal} total
                </span>
                <div className="flex gap-2">
                  <button onClick={() => setFeesPage(p => Math.max(1, p - 1))} disabled={feesPage === 1} className="bg-card hover:bg-secondary/40 border border-border px-3 py-1.5 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors">Previous</button>
                  <span className="flex items-center px-2 text-foreground">Page {feesPage} of {feesTotalPages}</span>
                  <button onClick={() => setFeesPage(p => Math.min(feesTotalPages, p + 1))} disabled={feesPage >= feesTotalPages} className="bg-card hover:bg-secondary/40 border border-border px-3 py-1.5 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors">Next</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: OVERDUE DEFAULTERS */}
        {activeTab === 'defaulters' && (
          <div className="space-y-4 text-xs">
            <div className="bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-300 p-4 rounded-2xl flex gap-3 items-start">
              <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-sm">Outstanding Overdue Notices</h4>
                <p className="mt-0.5">Below is the ledger of all students who have missed their tuition or registration fee due dates.</p>
              </div>
            </div>

            <div className="border border-border rounded-2xl bg-card shadow-sm overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-secondary/50 border-b border-border font-bold">
                  <tr>
                    <th className="p-3">Student Name</th>
                    <th className="p-3">Admission #</th>
                    <th className="p-3">Billing Type</th>
                    <th className="p-3">Unpaid Balance</th>
                    <th className="p-3">Passed Due Date</th>
                    <th className="p-3">Parent Mobile</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {loading ? (
                    <tr><td colSpan={6} className="p-6 text-center animate-pulse">Loading defaulters...</td></tr>
                  ) : defaulters.length === 0 ? (
                    <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">Excellent! Zero outstanding overdue payments.</td></tr>
                  ) : (
                    defaulters.map(d => (
                      <tr key={d.id} className="hover:bg-secondary/10">
                        <td className="p-3 font-semibold text-foreground">{d.student?.name}</td>
                        <td className="p-3 font-mono font-semibold">{d.student?.admissionNumber}</td>
                        <td className="p-3 uppercase font-bold text-[9px] text-primary">{d.type}</td>
                        <td className="p-3 font-bold text-rose-500">₹{Number(d.amount).toLocaleString()}</td>
                        <td className="p-3 text-muted-foreground font-semibold">{new Date(d.dueDate).toLocaleDateString()}</td>
                        <td className="p-3 text-foreground font-semibold">{d.student?.parentPhone}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {!loading && defaulters.length > 0 && (
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-2 text-xs font-semibold">
                <span className="text-muted-foreground">Showing defaulters {((defPage - 1) * 10) + 1} - {Math.min(defPage * 10, defTotal)} of {defTotal} total</span>
                <div className="flex gap-2">
                  <button onClick={() => setDefPage(p => Math.max(1, p - 1))} disabled={defPage === 1} className="bg-card hover:bg-secondary/40 border border-border px-3 py-1.5 rounded-lg disabled:opacity-50 cursor-pointer transition-colors">Previous</button>
                  <span className="flex items-center px-2">Page {defPage} of {defTotalPages}</span>
                  <button onClick={() => setDefPage(p => Math.min(defTotalPages, p + 1))} disabled={defPage >= defTotalPages} className="bg-card hover:bg-secondary/40 border border-border px-3 py-1.5 rounded-lg disabled:opacity-50 cursor-pointer transition-colors">Next</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: INCOME STATEMENT */}
        {activeTab === 'income' && (
          <div className="space-y-4 text-xs">
            <div className="border border-border rounded-2xl bg-card shadow-sm overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-secondary/50 border-b border-border font-bold">
                  <tr>
                    <th className="p-3">Receipt Ref</th>
                    <th className="p-3">Student</th>
                    <th className="p-3">Payment Mode</th>
                    <th className="p-3">Txn Date</th>
                    <th className="p-3 font-right text-right">Amount Deposited</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {loading ? (
                    <tr><td colSpan={5} className="p-6 text-center animate-pulse">Loading cash streams...</td></tr>
                  ) : fees.length === 0 ? (
                    <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">No income transactions yet.</td></tr>
                  ) : (
                    fees.flatMap(f => f.payments || []).map((p: any) => {
                      const associatedFee = fees.find(fe => fe.id === p.feeId);
                      return (
                        <tr key={p.id} className="hover:bg-secondary/10">
                          <td className="p-3">
                            <button onClick={() => showReceipt(p, associatedFee)} className="font-bold text-primary hover:underline">
                              {p.receiptNumber}
                            </button>
                          </td>
                          <td className="p-3">
                            <div className="font-semibold text-foreground">{associatedFee?.student?.name}</div>
                            <div className="text-[10px] text-muted-foreground">{associatedFee?.student?.admissionNumber}</div>
                          </td>
                          <td className="p-3 font-bold uppercase text-[10px]">{p.paymentMode}</td>
                          <td className="p-3 text-muted-foreground">{new Date(p.paymentDate).toLocaleDateString()}</td>
                          <td className="p-3 text-right font-black text-emerald-500">₹{Number(p.amountPaid).toLocaleString()}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {!loading && fees.length > 0 && (
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-2 text-xs font-semibold">
                <span className="text-muted-foreground">Showing transactions {((incomePage - 1) * 10) + 1} - {Math.min(incomePage * 10, incomeTotal)} of {incomeTotal} total</span>
                <div className="flex gap-2">
                  <button onClick={() => setIncomePage(p => Math.max(1, p - 1))} disabled={incomePage === 1} className="bg-card hover:bg-secondary/40 border border-border px-3 py-1.5 rounded-lg disabled:opacity-50 cursor-pointer transition-colors">Previous</button>
                  <span className="flex items-center px-2">Page {incomePage} of {incomeTotalPages}</span>
                  <button onClick={() => setIncomePage(p => Math.min(incomeTotalPages, p + 1))} disabled={incomePage >= incomeTotalPages} className="bg-card hover:bg-secondary/40 border border-border px-3 py-1.5 rounded-lg disabled:opacity-50 cursor-pointer transition-colors">Next</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: EXPENSES LEDGER */}
        {activeTab === 'expenses' && (
          <div className="space-y-4 text-xs">
            <div className="border border-border rounded-2xl bg-card shadow-sm overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-secondary/50 border-b border-border font-bold">
                  <tr>
                    <th className="p-3">Expense Category</th>
                    <th className="p-3">Description</th>
                    <th className="p-3">Invoice Date</th>
                    <th className="p-3">Bill Receipt</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Amount Paid</th>
                    <th className="p-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {loading ? (
                    <tr><td colSpan={7} className="p-6 text-center animate-pulse">Loading expenses...</td></tr>
                  ) : expenses.length === 0 ? (
                    <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">No expenses logged.</td></tr>
                  ) : (
                    expenses.map(e => (
                      <tr key={e.id} className="hover:bg-secondary/10">
                        <td className="p-3 uppercase font-bold text-primary text-[10px] tracking-wide">{e.category}</td>
                        <td className="p-3 text-foreground font-semibold max-w-[200px]">
                          {e.category === 'SALARY' ? (() => {
                            const p = parseSalaryDescription(e.description || '');
                            return p.name ? (
                              <div>
                                <div className="font-bold">{p.name}</div>
                                <div className="text-[10px] text-muted-foreground">{p.period}</div>
                              </div>
                            ) : e.description;
                          })() : e.description}
                        </td>
                        <td className="p-3 text-muted-foreground">{new Date(e.date).toLocaleDateString()}</td>
                        <td className="p-3">
                          {e.billUrl ? (
                            <a href={e.billUrl} target="_blank" rel="noreferrer" className="text-primary font-bold hover:underline">View File</a>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded font-bold text-[9px] bg-emerald-500/10 text-emerald-500">{e.status}</span>
                        </td>
                        <td className="p-3 text-right font-bold text-rose-500">₹{Number(e.amount).toLocaleString()}</td>
                        <td className="p-3">
                          <button onClick={() => handleDeleteExpense(e.id)} className="text-rose-500 hover:bg-rose-500/10 p-1.5 rounded-lg">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {!loading && expenses.length > 0 && (
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-2 text-xs font-semibold">
                <span className="text-muted-foreground">Showing expenses {((expPage - 1) * 10) + 1} - {Math.min(expPage * 10, expTotal)} of {expTotal} total</span>
                <div className="flex gap-2">
                  <button onClick={() => setExpPage(p => Math.max(1, p - 1))} disabled={expPage === 1} className="bg-card hover:bg-secondary/40 border border-border px-3 py-1.5 rounded-lg disabled:opacity-50 cursor-pointer transition-colors">Previous</button>
                  <span className="flex items-center px-2">Page {expPage} of {expTotalPages}</span>
                  <button onClick={() => setExpPage(p => Math.min(expTotalPages, p + 1))} disabled={expPage >= expTotalPages} className="bg-card hover:bg-secondary/40 border border-border px-3 py-1.5 rounded-lg disabled:opacity-50 cursor-pointer transition-colors">Next</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 5: PROFIT AND LOSS STATEMENTS */}
        {activeTab === 'pl' && (
          <div className="space-y-6">
            <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
              <h4 className="font-extrabold text-sm mb-4">Monthly Profit & Loss Breakdown (Recharts)</h4>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={profitLoss}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                    <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={11} />
                    <YAxis tickLine={false} axisLine={false} fontSize={11} />
                    <Tooltip formatter={(v) => `₹${Number(v).toLocaleString()}`} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="revenue" fill="#10b981" name="Income (Revenue)" radius={[3, 3, 0, 0]} barSize={15} />
                    <Bar dataKey="expenses" fill="#ef4444" name="Expenses (incl. Salary)" radius={[3, 3, 0, 0]} barSize={15} />
                    <Bar dataKey="pending" fill="#f59e0b" name="Pending Fees" radius={[3, 3, 0, 0]} barSize={15} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs font-semibold">
              {profitLoss.map(m => (
                <div key={m.month} className="bg-card border border-border rounded-2xl p-4 flex justify-between items-center shadow-sm">
                  <div>
                    <h5 className="font-bold text-sm text-foreground">{m.month} Financials</h5>
                    <div className="space-y-0.5 text-muted-foreground mt-1 text-[10px]">
                      <div className="text-emerald-500">Incomes (Collected): ₹{m.revenue.toLocaleString()}</div>
                      <div className="text-rose-500">Expenses: ₹{m.expenses.toLocaleString()}</div>
                      <div className="text-amber-500 font-bold">Pending Invoices: ₹{(m.pending || 0).toLocaleString()}</div>
                    </div>
                  </div>
                  <div className={`text-right font-black text-sm ${m.profit >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {m.profit >= 0 ? '+' : ''}₹{m.profit.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 6: STAFF SALARY MANAGEMENT */}
        {activeTab === 'salary' && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

              {/* Card 1: Total Staff */}
              <div className="bg-card border border-border rounded-2xl p-5 flex gap-4 items-start">
                <div className="p-3 bg-indigo-500/10 rounded-xl shrink-0">
                  <Users className="h-6 w-6 text-indigo-400" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs text-muted-foreground font-bold uppercase tracking-wide">Total Staff</p>
                  <p className="text-2xl font-black text-foreground">{staffList.length}</p>
                  <p className="text-[10px] text-muted-foreground leading-relaxed">
                    Active employees on payroll — instructors, staff & managers.<br />
                    <span className="text-indigo-400 font-semibold">Super Admin excluded.</span>
                  </p>
                </div>
              </div>

              {/* Card 2: Monthly Payroll (Base) */}
              <div className="bg-card border border-border rounded-2xl p-5 flex gap-4 items-start">
                <div className="p-3 bg-rose-500/10 rounded-xl shrink-0">
                  <Banknote className="h-6 w-6 text-rose-400" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs text-muted-foreground font-bold uppercase tracking-wide">Monthly Payroll (Base)</p>
                  <p className="text-2xl font-black text-foreground">
                    {fmt(staffList.reduce((s, st) => s + (Number(st.salary) || 0), 0))}
                  </p>
                  <p className="text-[10px] text-muted-foreground leading-relaxed">
                    Sum of every staff member's <span className="font-semibold text-foreground">configured base salary</span> from their profile.<br />
                    <span className="text-amber-400 font-semibold">This is the expected outflow — not what's been paid.</span>
                  </p>
                </div>
              </div>

              {/* Card 3: Total Paid Out */}
              <div className="bg-card border border-border rounded-2xl p-5 flex gap-4 items-start">
                <div className="p-3 bg-emerald-500/10 rounded-xl shrink-0">
                  <TrendingDown className="h-6 w-6 text-emerald-400" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs text-muted-foreground font-bold uppercase tracking-wide">Total Paid Out (All Time)</p>
                  <p className="text-2xl font-black text-foreground">
                    {fmt(salaryPayouts.reduce((s, p) => s + Number(p.amount), 0))}
                  </p>
                  <p className="text-[10px] text-muted-foreground leading-relaxed">
                    Sum of all <span className="font-semibold text-foreground">recorded salary payouts</span> via "Record Salary Payout".<br />
                    <span className="text-emerald-400 font-semibold">These are real disbursements logged as SALARY expenses.</span>
                  </p>
                </div>
              </div>

            </div>

            {/* Staff Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search staff by name, employee ID or role..."
                value={staffSearch}
                onChange={e => setStaffSearch(e.target.value)}
                className="w-full bg-card border border-border rounded-xl pl-10 pr-4 py-2 outline-none text-sm"
              />
            </div>

            {/* Staff Directory Table */}
            <div className="border border-border rounded-2xl bg-card shadow-sm overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-secondary/50 border-b border-border font-bold">
                  <tr>
                    <th className="p-3">Staff Member</th>
                    <th className="p-3">Role</th>
                    <th className="p-3">Branch</th>
                    <th className="p-3">Base Salary / Month</th>
                    <th className="p-3">Last Payout</th>
                    <th className="p-3">Last Amount</th>
                    <th className="p-3">History</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {loading ? (
                    <tr><td colSpan={7} className="p-6 text-center animate-pulse text-muted-foreground">Loading staff directory...</td></tr>
                  ) : filteredStaff.length === 0 ? (
                    <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">No staff members found.</td></tr>
                  ) : (
                    filteredStaff.map(s => {
                      const lp = lastPaidMap[s.id];
                      return (
                        <tr key={s.id} className="hover:bg-secondary/10">
                          <td className="p-3">
                            <div className="font-bold text-foreground">{s.name}</div>
                            <div className="text-[10px] text-muted-foreground font-mono">{s.employeeId || 'N/A'}</div>
                          </td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${roleBadge(s.role?.name)}`}>
                              {s.role?.name?.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="p-3 text-muted-foreground font-semibold">{s.branch?.name || <span className="italic">No Branch</span>}</td>
                          <td className="p-3 font-black text-indigo-400">
                            {s.salary ? fmt(Number(s.salary)) : <span className="text-muted-foreground italic">Not Set</span>}
                          </td>
                          <td className="p-3 text-muted-foreground">
                            {lp ? new Date(lp.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : <span className="italic text-[10px]">Never paid</span>}
                          </td>
                          <td className="p-3 font-bold text-rose-400">
                            {lp ? fmt(lp.amount) : '—'}
                          </td>
                          <td className="p-3">
                            <button
                              onClick={() => openStaffHistory(s)}
                              className="flex items-center gap-1 text-primary hover:bg-primary/10 px-2 py-1 rounded-lg font-semibold transition-colors"
                            >
                              <Clock className="h-3.5 w-3.5" />
                              <span>History</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {/* ========================================================= */}
      {/* MODAL DRAWER OVERLAYS                                     */}
      {/* ========================================================= */}

      {/* 1. COLLECT FEE MODAL */}
      {isCollectOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-card border border-border rounded-2xl p-6 shadow-2xl space-y-4 animate-scale-in text-xs">
            <div className="flex justify-between items-center pb-2 border-b border-border">
              <h3 className="text-sm font-bold">Record Tuition Payment</h3>
              <button onClick={() => setIsCollectOpen(false)} className="p-1 hover:bg-secondary rounded-lg">
                <Plus className="h-5 w-5 rotate-45" />
              </button>
            </div>

            <form onSubmit={handleCollectFee} className="space-y-4">
              <div>
                <span className="text-muted-foreground font-bold block">Invoiced Due</span>
                <p className="text-base font-bold text-foreground uppercase tracking-wide">
                  {collectFeeRecord?.type} - ₹{Number(collectFeeRecord?.amount).toLocaleString()}
                </p>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-muted-foreground uppercase">Amount Received (INR) *</label>
                <input type="number" value={amountPaid} onChange={(e) => setAmountPaid(e.target.value)} className="w-full bg-secondary border border-border px-3 py-2 rounded-lg outline-none font-bold text-sm" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-muted-foreground uppercase">Mode *</label>
                  <select value={paymentMode} onChange={(e: any) => setPaymentMode(e.target.value)} className="w-full bg-secondary border border-border px-3 py-2 rounded-lg outline-none">
                    <option value="UPI">UPI</option>
                    <option value="CASH">CASH</option>
                    <option value="CARD">CARD</option>
                    <option value="BANK_TRANSFER">BANK TRANSFER</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-muted-foreground uppercase">Transaction ID</label>
                  <input type="text" placeholder="e.g. Reference number" value={transactionId} onChange={(e) => setTransactionId(e.target.value)} className="w-full bg-secondary border border-border px-3 py-2 rounded-lg outline-none" />
                </div>
              </div>

              <div className="pt-4 flex gap-2">
                <button type="button" onClick={() => setIsCollectOpen(false)} className="flex-1 bg-secondary border border-border py-2 px-3 rounded-xl font-bold">Cancel</button>
                <button type="submit" className="flex-1 bg-primary text-primary-foreground py-2 px-3 rounded-xl font-bold shadow-lg">Complete</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. LOG EXPENSE MODAL */}
      {isExpenseOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-card border-l border-border h-full p-6 overflow-y-auto flex flex-col justify-between shadow-2xl animate-slide-in">
            <div className="space-y-6 text-xs">
              <div className="flex justify-between items-center pb-4 border-b border-border">
                <h3 className="text-lg font-bold">Log Branch Expense Receipt</h3>
                <button onClick={() => setIsExpenseOpen(false)} className="p-1 hover:bg-secondary rounded-lg animate-rotate-in">
                  <Plus className="h-5 w-5 rotate-45" />
                </button>
              </div>

              {formError && <div className="bg-red-500/10 border border-red-500/20 text-red-300 p-3 rounded-lg">{formError}</div>}

              <form onSubmit={handleLogExpense} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-bold text-muted-foreground uppercase">Expense Type *</label>
                    <select value={expCategory} onChange={(e: any) => setExpCategory(e.target.value)} className="w-full bg-secondary border border-border px-3 py-2 rounded-lg outline-none">
                      <option value="RENT">RENT</option>
                      <option value="ELECTRICITY">ELECTRICITY</option>
                      <option value="SALARY">SALARY</option>
                      <option value="MARKETING">MARKETING</option>
                      <option value="COSTUME">COSTUME</option>
                      <option value="EQUIPMENT">EQUIPMENT</option>
                      <option value="EVENT_EXPENSE">EVENT EXPENSE</option>
                      <option value="MISCELLANEOUS">MISCELLANEOUS</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-muted-foreground uppercase">Log Date *</label>
                    <input type="date" value={expDate} onChange={(e) => setExpDate(e.target.value)} className="w-full bg-secondary border border-border px-3 py-2 rounded-lg outline-none" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-bold text-muted-foreground uppercase">Expense Amount (INR) *</label>
                    <input type="number" placeholder="Amount INR" value={expAmount} onChange={(e) => setExpAmount(e.target.value)} className="w-full bg-secondary border border-border px-3 py-2 rounded-lg outline-none font-bold" />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-muted-foreground uppercase">Branch Location *</label>
                    <select value={expBranchId} onChange={(e) => setExpBranchId(e.target.value)} className="w-full bg-secondary border border-border px-3 py-2 rounded-lg outline-none">
                      <option value="">Select branch</option>
                      {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-muted-foreground uppercase">Description / Vendor Name *</label>
                  <input type="text" placeholder="e.g. Kochi hub space rent July" value={expDescription} onChange={(e) => setExpDescription(e.target.value)} className="w-full bg-secondary border border-border px-3 py-2 rounded-lg outline-none" />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-muted-foreground uppercase">Upload Bill URL</label>
                  <input type="text" placeholder="https://supabase-storage-mock.com/bills/rent.pdf" value={expBillUrl} onChange={(e) => setExpBillUrl(e.target.value)} className="w-full bg-secondary border border-border px-3 py-2 rounded-lg outline-none" />
                </div>
              </form>
            </div>

            <div className="pt-6 border-t border-border flex gap-3 mt-8">
              <button onClick={() => setIsExpenseOpen(false)} className="flex-1 bg-secondary border border-border py-2 px-4 rounded-xl font-bold">Cancel</button>
              <button onClick={handleLogExpense} className="flex-1 bg-primary text-primary-foreground py-2 px-4 rounded-xl font-bold shadow-lg">Submit Expense</button>
            </div>
          </div>
        </div>
      )}

      {/* 3. RECEIPT VIEWER POPUP OVERLAY */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-card border border-border rounded-2xl p-6 shadow-2xl space-y-6 animate-scale-in text-xs text-foreground">
            <div className="flex justify-between items-center pb-2 border-b border-border">
              <h3 className="font-extrabold text-sm text-primary uppercase">RUDRESHWAR DANCE ACADEMY RECEIPT</h3>
              <button onClick={() => setSelectedReceipt(null)} className="p-1 hover:bg-secondary rounded-lg">
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
                <p className="text-[10px] text-muted-foreground">Guardian Address: {selectedReceipt.fee?.student?.address}</p>
              </div>

              <div className="divide-y divide-border">
                <div className="py-2.5 flex justify-between font-bold">
                  <span>Invoiced Item</span>
                  <span className="uppercase text-[9px] tracking-wider text-primary">{selectedReceipt.fee?.type}</span>
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

              <p className="text-[9px] text-center text-muted-foreground italic pt-2">Thank you for dancing with Rudreshwar Dance Academy! This is an electronically generated receipt reference.</p>
            </div>

            <div className="pt-2">
              <button onClick={() => setSelectedReceipt(null)} className="w-full bg-secondary border border-border py-2 px-3 rounded-xl font-bold">Close Receipt</button>
            </div>
          </div>
        </div>
      )}

      {/* 4. RECORD SALARY PAYOUT MODAL */}
      {isSalaryPayoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-card border-l border-border h-full p-6 overflow-y-auto flex flex-col gap-6 shadow-2xl animate-slide-in text-xs">
            <div className="flex justify-between items-center pb-4 border-b border-border">
              <div>
                <h3 className="text-lg font-bold">Record Salary Payout</h3>
                <p className="text-muted-foreground text-[11px] mt-0.5">This will create a SALARY expense entry linked to the selected staff member.</p>
              </div>
              <button onClick={() => setIsSalaryPayoutOpen(false)} className="p-1 hover:bg-secondary rounded-lg">
                <X className="h-5 w-5" />
              </button>
            </div>

            {salaryFormError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-300 p-3 rounded-lg">{salaryFormError}</div>
            )}

            <form onSubmit={handleRecordSalaryPayout} className="space-y-5 flex-1">
              {/* Staff Selector */}
              <div className="space-y-1">
                <label className="font-bold text-muted-foreground uppercase">Staff Member *</label>
                <select
                  value={salaryStaffId}
                  onChange={e => setSalaryStaffId(e.target.value)}
                  className="w-full bg-secondary border border-border px-3 py-2.5 rounded-lg outline-none"
                >
                  <option value="">Select staff member...</option>
                  {staffList.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} — {s.role?.name?.replace('_', ' ')} {s.employeeId ? `(${s.employeeId})` : ''}
                    </option>
                  ))}
                </select>
                {salaryStaffId && (() => {
                  const found = staffList.find(s => s.id === salaryStaffId);
                  return found ? (
                    <div className="flex items-center gap-2 mt-2 p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-lg">
                      <div className="h-8 w-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-black text-sm">{found.name[0]}</div>
                      <div>
                        <p className="font-bold text-foreground">{found.name}</p>
                        <p className="text-[10px] text-muted-foreground">{found.branch?.name || 'No branch'} · Base: {found.salary ? fmt(Number(found.salary)) : 'Not set'}</p>
                      </div>
                    </div>
                  ) : null;
                })()}
              </div>

              {/* Payout Period */}
              <div className="space-y-1">
                <label className="font-bold text-muted-foreground uppercase">Payout Period *</label>
                <select
                  value={salaryPeriod}
                  onChange={e => setSalaryPeriod(e.target.value)}
                  className="w-full bg-secondary border border-border px-3 py-2.5 rounded-lg outline-none"
                >
                  <option value="">Select month...</option>
                  {Array.from({ length: 12 }, (_, i) => {
                    const d = new Date(new Date().getFullYear(), i, 1);
                    const label = d.toLocaleDateString('default', { month: 'long', year: 'numeric' });
                    return (
                      <option key={i} value={label}>{label}</option>
                    );
                  })}
                </select>
              </div>

              {/* Amount + Date */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-muted-foreground uppercase">Amount (INR) *</label>
                  <input
                    type="number"
                    placeholder="₹0"
                    value={salaryAmount}
                    onChange={e => setSalaryAmount(e.target.value)}
                    className="w-full bg-secondary border border-border px-3 py-2 rounded-lg outline-none font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-muted-foreground uppercase">Payment Date *</label>
                  <input
                    type="date"
                    value={salaryDate}
                    onChange={e => setSalaryDate(e.target.value)}
                    className="w-full bg-secondary border border-border px-3 py-2 rounded-lg outline-none"
                  />
                </div>
              </div>

              {/* Branch */}
              <div className="space-y-1">
                <label className="font-bold text-muted-foreground uppercase">Branch *</label>
                <select
                  value={salaryBranchId}
                  onChange={e => setSalaryBranchId(e.target.value)}
                  className="w-full bg-secondary border border-border px-3 py-2 rounded-lg outline-none"
                >
                  <option value="">Select branch</option>
                  {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>

              {/* Payment Mode */}
              <div className="space-y-1">
                <label className="font-bold text-muted-foreground uppercase">Payment Mode *</label>
                <select
                  value={salaryPaymentMode}
                  onChange={(e: any) => setSalaryPaymentMode(e.target.value)}
                  className="w-full bg-secondary border border-border px-3 py-2 rounded-lg outline-none"
                >
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="CASH">Cash</option>
                  <option value="UPI">UPI</option>
                </select>
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <label className="font-bold text-muted-foreground uppercase">Remarks / Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Includes performance bonus"
                  value={salaryNotes}
                  onChange={e => setSalaryNotes(e.target.value)}
                  className="w-full bg-secondary border border-border px-3 py-2 rounded-lg outline-none"
                />
              </div>

              {/* Info card */}
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 text-[11px] text-blue-300 leading-relaxed">
                💡 This payout will be logged as a <strong>SALARY</strong> expense in the branch ledger and will be reflected in the <strong>P&L chart</strong> and <strong>Expenses</strong> tab.
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsSalaryPayoutOpen(false)}
                  className="flex-1 bg-secondary border border-border py-2.5 px-4 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={salarySubmitting}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 px-4 rounded-xl font-bold shadow-lg disabled:opacity-50 transition-colors"
                >
                  {salarySubmitting ? 'Recording...' : 'Record Payout'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. STAFF SALARY HISTORY DRAWER */}
      {selectedStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-card border-l border-border h-full p-6 overflow-y-auto flex flex-col gap-5 shadow-2xl animate-slide-in text-xs">
            <div className="flex justify-between items-start pb-4 border-b border-border">
              <div>
                <h3 className="text-base font-bold text-foreground">{selectedStaff.name}</h3>
                <p className="text-muted-foreground text-[11px]">
                  {selectedStaff.role?.name?.replace('_', ' ')} · {selectedStaff.branch?.name || 'No branch'}
                </p>
                <p className="text-indigo-400 font-bold mt-1">
                  Base Salary: {selectedStaff.salary ? fmt(Number(selectedStaff.salary)) : 'Not configured'} / month
                </p>
              </div>
              <button onClick={() => setSelectedStaff(null)} className="p-1 hover:bg-secondary rounded-lg">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div>
              <h4 className="font-bold text-sm mb-3">Payout History</h4>
              {historyLoading ? (
                <div className="text-center py-8 text-muted-foreground animate-pulse">Loading history...</div>
              ) : staffPayoutHistory.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Banknote className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p>No salary payouts recorded yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {staffPayoutHistory.map(p => {
                    const parsed = parseSalaryDescription(p.description || '');
                    return (
                      <div key={p.id} className="bg-secondary/40 border border-border rounded-xl p-3 flex justify-between items-center">
                        <div>
                          <p className="font-bold text-foreground">{parsed.period || p.description}</p>
                          <p className="text-muted-foreground text-[10px] mt-0.5">
                            {new Date(p.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-black text-rose-400">{fmt(Number(p.amount))}</p>
                          <p className="text-[9px] text-emerald-400 font-bold mt-0.5">{p.status}</p>
                        </div>
                      </div>
                    );
                  })}

                  <div className="pt-3 border-t border-border flex justify-between font-black text-sm">
                    <span>Total Paid Out</span>
                    <span className="text-rose-400">{fmt(staffPayoutHistory.reduce((s, p) => s + Number(p.amount), 0))}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';
import {
  TrendingUp, TrendingDown, DollarSign, Plus, Eye, CheckCircle, CreditCard, Search,
  Calendar, Award, AlertTriangle, Upload, Landmark, Trash2
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

export const Finances: React.FC = () => {
  const { user } = useAuthStore();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<'fees' | 'defaulters' | 'income' | 'expenses' | 'pl'>(() => {
    return window.location.pathname === '/expenses' ? 'income' : 'fees';
  });
  const [loading, setLoading] = useState(true);

  // Lead States
  const [fees, setFees] = useState<any[]>([]);
  const [defaulters, setDefaulters] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [profitLoss, setProfitLoss] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);

  // Search & Filters
  const [search, setSearch] = useState('');
  const [feeStatus, setFeeStatus] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');

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
    // Go from 6 months in the future to 12 months in the past
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
  const availableTabs = isExpensesRoute
    ? (['income', 'expenses', 'pl'] as const)
    : (['fees', 'defaulters'] as const);

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
        // Collect incomes from fees
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
      }
    } catch { } finally {
      setLoading(false);
    }
  };

  const fetchBranches = async () => {
    try {
      const res = await api.get('/branches');
      setBranches(res.data.data);
    } catch { }
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

  const showReceipt = (payment: any, fee: any) => {
    setSelectedReceipt({ payment, fee });
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
      </div>

      {/* Tabs list */}
      <div className="flex border-b border-border text-sm font-semibold gap-4 overflow-x-auto">
        {availableTabs.map(tab => (
          <button
            key={tab}
            onClick={() => { setActiveTab(tab); setSearch(''); setFeeStatus(''); setSelectedMonth(''); }}
            className={`pb-2.5 px-1 capitalize transition-all border-b-2 ${activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
          >
            {tab === 'fees'
              ? 'Tuition Bills'
              : tab === 'defaulters'
                ? 'Defaulters Ledger'
                : tab === 'pl'
                  ? 'Profit & Loss Chart'
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

            {/* Pagination Controls */}
            {!loading && filteredFees.length > 0 && (
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-2 text-xs font-semibold">
                <span className="text-muted-foreground">
                  Showing invoices {((feesPage - 1) * 10) + 1} - {Math.min(feesPage * 10, feesTotal)} of {feesTotal} total
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setFeesPage(p => Math.max(1, p - 1))}
                    disabled={feesPage === 1}
                    className="bg-card hover:bg-secondary/40 border border-border px-3 py-1.5 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
                  >
                    Previous
                  </button>
                  <span className="flex items-center px-2 text-foreground">
                    Page {feesPage} of {feesTotalPages}
                  </span>
                  <button
                    onClick={() => setFeesPage(p => Math.min(feesTotalPages, p + 1))}
                    disabled={feesPage >= feesTotalPages}
                    className="bg-card hover:bg-secondary/40 border border-border px-3 py-1.5 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
                  >
                    Next
                  </button>
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

            {/* Pagination Controls */}
            {!loading && defaulters.length > 0 && (
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-2 text-xs font-semibold">
                <span className="text-muted-foreground">
                  Showing defaulters {((defPage - 1) * 10) + 1} - {Math.min(defPage * 10, defTotal)} of {defTotal} total
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setDefPage(p => Math.max(1, p - 1))}
                    disabled={defPage === 1}
                    className="bg-card hover:bg-secondary/40 border border-border px-3 py-1.5 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
                  >
                    Previous
                  </button>
                  <span className="flex items-center px-2 text-foreground">
                    Page {defPage} of {defTotalPages}
                  </span>
                  <button
                    onClick={() => setDefPage(p => Math.min(defTotalPages, p + 1))}
                    disabled={defPage >= defTotalPages}
                    className="bg-card hover:bg-secondary/40 border border-border px-3 py-1.5 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
                  >
                    Next
                  </button>
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
                            <button
                              onClick={() => showReceipt(p, associatedFee)}
                              className="font-bold text-primary hover:underline"
                            >
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

            {/* Pagination Controls */}
            {!loading && fees.length > 0 && (
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-2 text-xs font-semibold">
                <span className="text-muted-foreground">
                  Showing transactions {((incomePage - 1) * 10) + 1} - {Math.min(incomePage * 10, incomeTotal)} of {incomeTotal} total
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setIncomePage(p => Math.max(1, p - 1))}
                    disabled={incomePage === 1}
                    className="bg-card hover:bg-secondary/40 border border-border px-3 py-1.5 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
                  >
                    Previous
                  </button>
                  <span className="flex items-center px-2 text-foreground">
                    Page {incomePage} of {incomeTotalPages}
                  </span>
                  <button
                    onClick={() => setIncomePage(p => Math.min(incomeTotalPages, p + 1))}
                    disabled={incomePage >= incomeTotalPages}
                    className="bg-card hover:bg-secondary/40 border border-border px-3 py-1.5 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
                  >
                    Next
                  </button>
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
                        <td className="p-3 text-foreground font-semibold">{e.description}</td>
                        <td className="p-3 text-muted-foreground">{new Date(e.date).toLocaleDateString()}</td>
                        <td className="p-3">
                          {e.billUrl ? (
                            <a href={e.billUrl} target="_blank" rel="noreferrer" className="text-primary font-bold hover:underline">View File</a>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded font-bold text-[9px] bg-emerald-500/10 text-emerald-500">
                            {e.status}
                          </span>
                        </td>
                        <td className="p-3 text-right font-bold text-rose-500">₹{Number(e.amount).toLocaleString()}</td>
                        <td className="p-3">
                          <button
                            onClick={() => handleDeleteExpense(e.id)}
                            className="text-rose-500 hover:bg-rose-500/10 p-1.5 rounded-lg"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {!loading && expenses.length > 0 && (
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-2 text-xs font-semibold">
                <span className="text-muted-foreground">
                  Showing expenses {((expPage - 1) * 10) + 1} - {Math.min(expPage * 10, expTotal)} of {expTotal} total
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setExpPage(p => Math.max(1, p - 1))}
                    disabled={expPage === 1}
                    className="bg-card hover:bg-secondary/40 border border-border px-3 py-1.5 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
                  >
                    Previous
                  </button>
                  <span className="flex items-center px-2 text-foreground">
                    Page {expPage} of {expTotalPages}
                  </span>
                  <button
                    onClick={() => setExpPage(p => Math.min(expTotalPages, p + 1))}
                    disabled={expPage >= expTotalPages}
                    className="bg-card hover:bg-secondary/40 border border-border px-3 py-1.5 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
                  >
                    Next
                  </button>
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
                    <Bar dataKey="expenses" fill="#ef4444" name="Expenses" radius={[3, 3, 0, 0]} barSize={15} />
                    <Bar dataKey="pending" fill="#f59e0b" name="Pending Fees" radius={[3, 3, 0, 0]} barSize={15} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Matrix summary */}
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
                <input
                  type="number"
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value)}
                  className="w-full bg-secondary border border-border px-3 py-2 rounded-lg outline-none font-bold text-sm"
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
                  <label className="font-bold text-muted-foreground uppercase">Transaction ID</label>
                  <input
                    type="text"
                    placeholder="e.g. Reference number"
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
                  Complete
                </button>
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
                    <select
                      value={expCategory}
                      onChange={(e: any) => setExpCategory(e.target.value)}
                      className="w-full bg-secondary border border-border px-3 py-2 rounded-lg outline-none"
                    >
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
                    <input
                      type="date"
                      value={expDate}
                      onChange={(e) => setExpDate(e.target.value)}
                      className="w-full bg-secondary border border-border px-3 py-2 rounded-lg outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-bold text-muted-foreground uppercase">Expense Amount (INR) *</label>
                    <input
                      type="number"
                      placeholder="Amount INR"
                      value={expAmount}
                      onChange={(e) => setExpAmount(e.target.value)}
                      className="w-full bg-secondary border border-border px-3 py-2 rounded-lg outline-none font-bold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-muted-foreground uppercase">Branch Location *</label>
                    <select
                      value={expBranchId}
                      onChange={(e) => setExpBranchId(e.target.value)}
                      className="w-full bg-secondary border border-border px-3 py-2 rounded-lg outline-none"
                    >
                      <option value="">Select branch</option>
                      {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-muted-foreground uppercase">Description / Vendor Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Kochi hub space rent July"
                    value={expDescription}
                    onChange={(e) => setExpDescription(e.target.value)}
                    className="w-full bg-secondary border border-border px-3 py-2 rounded-lg outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-muted-foreground uppercase">Upload Bill URL</label>
                  <input
                    type="text"
                    placeholder="https://supabase-storage-mock.com/bills/rent.pdf"
                    value={expBillUrl}
                    onChange={(e) => setExpBillUrl(e.target.value)}
                    className="w-full bg-secondary border border-border px-3 py-2 rounded-lg outline-none"
                  />
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

            {/* Header */}
            <div className="flex justify-between items-center pb-2 border-b border-border">
              <h3 className="font-extrabold text-sm text-primary uppercase">RUDRESHWAR DANCE ACADEMY RECEIPT</h3>
              <button onClick={() => setSelectedReceipt(null)} className="p-1 hover:bg-secondary rounded-lg">
                <Plus className="h-5 w-5 rotate-45" />
              </button>
            </div>

            {/* Content layout */}
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
              <button
                onClick={() => setSelectedReceipt(null)}
                className="w-full bg-secondary border border-border py-2 px-3 rounded-xl font-bold"
              >
                Close Receipt
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

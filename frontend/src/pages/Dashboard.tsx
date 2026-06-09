import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';
import {
  TrendingUp,
  Users,
  GitBranch,
  DollarSign,
  CalendarDays,
  Percent,
  Clock,
  ArrowUpRight,
  TrendingDown
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
  PieChart,
  Pie,
  Cell,
  ComposedChart,
  Line
} from 'recharts';

export const Dashboard: React.FC = () => {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<any>(null);
  const [charts, setCharts] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [statsRes, chartsRes] = await Promise.all([
          api.get('/dashboard/stats'),
          api.get('/dashboard/charts')
        ]);
        setStats(statsRes.data.data);
        setCharts(chartsRes.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-muted animate-pulse rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-28 bg-card border border-border rounded-2xl p-6 space-y-3">
              <div className="h-4 w-24 bg-muted animate-pulse rounded" />
              <div className="h-8 w-16 bg-muted animate-pulse rounded" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-80 bg-card border border-border rounded-2xl animate-pulse" />
          <div className="h-80 bg-card border border-border rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  // Curated color themes for Pie
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899'];

  return (
    <div className="space-y-6">
      
      {/* Welcome Message */}
      <div>
        <h2 className="text-2xl font-extrabold tracking-tight">Dashboard Overview</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Welcome back, <span className="font-semibold text-foreground">{user?.name}</span>! Here is a summary of Rudreshwar Dance Academy performance.
        </p>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Total Branches */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Branches</span>
              <h3 className="text-2xl font-black">{stats?.totalBranches}</h3>
            </div>
            <div className="p-2.5 bg-primary/10 rounded-xl text-primary">
              <GitBranch className="h-5 w-5" />
            </div>
          </div>
          <div className="text-[10px] text-muted-foreground mt-3 uppercase font-semibold">Active Dance Hubs</div>
        </div>

        {/* Total Students */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Students</span>
              <h3 className="text-2xl font-black">{stats?.totalStudents}</h3>
            </div>
            <div className="p-2.5 bg-emerald-500/10 rounded-xl text-emerald-500">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="text-[10px] text-emerald-500 mt-3 font-semibold flex items-center gap-1">
            <TrendingUp className="h-3.5 w-3.5" />
            <span>{stats?.activeStudents} Currently Active ({Math.round(stats?.activeStudents / (stats?.totalStudents || 1) * 100)}%)</span>
          </div>
        </div>

        {/* Revenue / Net Profit */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Net Profit (Monthly)</span>
              <h3 className="text-2xl font-black">₹{stats?.netProfit.toLocaleString('en-IN')}</h3>
            </div>
            <div className="p-2.5 bg-yellow-500/10 rounded-xl text-yellow-500">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
          <div className="text-[10px] text-muted-foreground mt-3 font-semibold flex items-center justify-between">
            <span className="text-emerald-500">Rev: ₹{stats?.monthlyRevenue.toLocaleString('en-IN')}</span>
            <span className="text-rose-500">Exp: ₹{stats?.monthlyExpenses.toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* Attendance Rate */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Attendance Rate</span>
              <h3 className="text-2xl font-black">{stats?.attendanceRate}%</h3>
            </div>
            <div className="p-2.5 bg-pink-500/10 rounded-xl text-pink-500">
              <Percent className="h-5 w-5" />
            </div>
          </div>
          <div className="text-[10px] text-muted-foreground mt-3 font-semibold flex items-center gap-1">
            <Clock className="h-3.5 w-3.5 text-primary" />
            <span>Monthly Average Attendance</span>
          </div>
        </div>

      </div>

      {/* Secondary Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-card border border-border p-4 rounded-2xl shadow-sm text-center">
        <div>
          <span className="text-[10px] text-muted-foreground font-bold uppercase">Staff Strength</span>
          <p className="text-lg font-bold text-foreground mt-0.5">{stats?.totalStaff} Employed</p>
        </div>
        <div className="border-l border-border">
          <span className="text-[10px] text-muted-foreground font-bold uppercase">Pending Fees Dues</span>
          <p className="text-lg font-bold text-rose-500 mt-0.5">₹{stats?.pendingFees.toLocaleString('en-IN')}</p>
        </div>
        <div className="border-l border-border">
          <span className="text-[10px] text-muted-foreground font-bold uppercase">New Admissions</span>
          <p className="text-lg font-bold text-emerald-500 mt-0.5">+{stats?.newAdmissions} Admitted</p>
        </div>
        <div className="border-l border-border">
          <span className="text-[10px] text-muted-foreground font-bold uppercase">Branch isolation</span>
          <p className="text-sm font-bold text-foreground mt-1 truncate max-w-full">
            {user?.role === 'SUPER_ADMIN' ? 'All (Super View)' : user?.branchName}
          </p>
        </div>
      </div>

      {/* Recharts Plots Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* 1. Composed P&L Trend (last 6 months) */}
        <div className="lg:col-span-8 bg-card border border-border rounded-2xl p-5 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h4 className="font-bold text-sm">Revenue vs Expenses Trend</h4>
              <span className="text-[11px] text-muted-foreground">Historical profit and expenditures monthly summary</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 bg-secondary rounded-lg text-xs font-semibold text-muted-foreground">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
              <span>Profit margins</span>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={charts?.revenueTrend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={11} />
                <YAxis tickLine={false} axisLine={false} fontSize={11} />
                <Tooltip />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="revenue" fill="#3b82f6" name="Total Revenue" radius={[4, 4, 0, 0]} barSize={25} />
                <Line type="monotone" dataKey="expense" stroke="#ef4444" name="Expenses" strokeWidth={2} dot={{ r: 3 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2. Fee Collection Breakdown (Pie) */}
        <div className="lg:col-span-4 bg-card border border-border rounded-2xl p-5 shadow-sm flex flex-col">
          <h4 className="font-bold text-sm mb-1">Fee Collections</h4>
          <span className="text-[11px] text-muted-foreground mb-6">Collections split by payment modes</span>
          <div className="h-52 flex-1 relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts?.feeCollectionAnalytics.filter((f: any) => f.value > 0)}
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {charts?.feeCollectionAnalytics.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `₹${Number(value).toLocaleString()}`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-4 text-[10px]">
            {charts?.feeCollectionAnalytics.map((c: any, i: number) => (
              <div key={c.name} className="flex items-center gap-1.5 font-medium">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                <span className="text-muted-foreground truncate">{c.name} (₹{c.value.toLocaleString()})</span>
              </div>
            ))}
          </div>
        </div>

        {/* 3. Student Admissions Growth (Area) */}
        <div className="lg:col-span-6 bg-card border border-border rounded-2xl p-5 shadow-sm">
          <h4 className="font-bold text-sm mb-1">Student Admissions Growth</h4>
          <span className="text-[11px] text-muted-foreground mb-6 block">Cummulative active student registration velocity</span>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts?.studentGrowth}>
                <defs>
                  <linearGradient id="colorStudents" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={11} />
                <YAxis tickLine={false} axisLine={false} fontSize={11} />
                <Tooltip />
                <Area type="monotone" dataKey="students" stroke="#10b981" fillOpacity={1} fill="url(#colorStudents)" strokeWidth={2} name="Total Enrolled" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 4. Branch Comparison (Bar) */}
        {user?.role === 'SUPER_ADMIN' && (
          <div className="lg:col-span-6 bg-card border border-border rounded-2xl p-5 shadow-sm">
            <h4 className="font-bold text-sm mb-1">Branch-wise Performance Comparison</h4>
            <span className="text-[11px] text-muted-foreground mb-6 block">Total revenue vs student counts at each location</span>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts?.branchComparison}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                  <XAxis dataKey="branchName" tickLine={false} axisLine={false} fontSize={11} />
                  <YAxis yAxisId="left" orientation="left" stroke="#3b82f6" tickLine={false} axisLine={false} fontSize={11} />
                  <YAxis yAxisId="right" orientation="right" stroke="#10b981" tickLine={false} axisLine={false} fontSize={11} />
                  <Tooltip />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                  <Bar yAxisId="left" dataKey="revenue" fill="#3b82f6" name="Revenue (₹)" radius={[3, 3, 0, 0]} barSize={20} />
                  <Bar yAxisId="right" dataKey="students" fill="#10b981" name="Student Count" radius={[3, 3, 0, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

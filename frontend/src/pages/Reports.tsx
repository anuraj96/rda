import React, { useState } from 'react';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';
import { FileDown, FileText, CheckSquare, Users, CreditCard, ShieldCheck } from 'lucide-react';

export const Reports: React.FC = () => {
  const { user } = useAuthStore();
  const [downloading, setDownloading] = useState<string | null>(null);

  // Client-side CSV generator helper
  const downloadCSV = (filename: string, headers: string[], rows: any[][]) => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadReport = async (reportType: string) => {
    setDownloading(reportType);
    try {
      if (reportType === 'students') {
        const res = await api.get('/students');
        const students = res.data.data;
        const headers = ['Admission Number', 'Student Name', 'Gender', 'DOB', 'Parent Name', 'Parent Phone', 'Email', 'Joining Date', 'Status'];
        const rows = students.map((s: any) => [
          s.admissionNumber,
          s.name,
          s.gender,
          new Date(s.dob).toLocaleDateString(),
          s.parentName,
          s.parentPhone,
          s.email || '-',
          new Date(s.joiningDate).toLocaleDateString(),
          s.status
        ]);
        downloadCSV('student_directory_report', headers, rows);
      } else if (reportType === 'finances') {
        const res = await api.get('/finances/pl');
        const pl = res.data.data;
        const headers = ['Month', 'Incomes (Revenue)', 'Expenses', 'Net Margin Profit'];
        const rows = pl.map((m: any) => [
          m.month,
          m.revenue,
          m.expenses,
          m.profit
        ]);
        downloadCSV('profit_loss_financial_report', headers, rows);
      } else if (reportType === 'defaulters') {
        const res = await api.get('/fees/defaulters');
        const defaulters = res.data.data;
        const headers = ['Student Name', 'Admission #', 'Invoice Type', 'Overdue Dues', 'Passed Due Date', 'Parent Phone'];
        const rows = defaulters.map((d: any) => [
          d.student?.name,
          d.student?.admissionNumber,
          d.type,
          d.amount,
          new Date(d.dueDate).toLocaleDateString(),
          d.student?.parentPhone
        ]);
        downloadCSV('fee_defaulters_ledger', headers, rows);
      } else if (reportType === 'staff_attendance') {
        const res = await api.get('/attendance/staff/report');
        const report = res.data.data;
        const headers = ['Date', 'Employee ID', 'Employee Name', 'Role', 'Status', 'Check-In', 'Check-Out'];
        const rows = report.map((a: any) => [
          new Date(a.date).toLocaleDateString(),
          a.user?.employeeId,
          a.user?.name,
          a.user?.role?.name,
          a.status,
          a.checkInTime ? new Date(a.checkInTime).toLocaleTimeString() : '-',
          a.checkOutTime ? new Date(a.checkOutTime).toLocaleTimeString() : '-'
        ]);
        downloadCSV('staff_attendance_logs', headers, rows);
      }
    } catch (err) {
      alert('Failed to generate report data.');
    } finally {
      setDownloading(null);
    }
  };

  const reportsList = [
    {
      id: 'students',
      title: 'Student Directory & Admissions',
      description: 'Master sheet of all pupil records, admission profiles, locations, and join dates.',
      icon: Users,
      color: 'text-primary bg-primary/10'
    },
    {
      id: 'finances',
      title: 'Monthly P&L Balance Sheet',
      description: 'Summarized P&L matrix displaying monthly revenues generated vs branch business expenses.',
      icon: CreditCard,
      color: 'text-emerald-500 bg-emerald-500/10'
    },
    {
      id: 'defaulters',
      title: 'Overdue Fees Dues Ledger',
      description: 'Ledger tracking student payment balances, passed due dates, and parent contacts.',
      icon: FileText,
      color: 'text-rose-500 bg-rose-500/10'
    },
    {
      id: 'staff_attendance',
      title: 'Staff Check-In/Out Report',
      description: 'Logs daily present statuses, clock-in timings, and checkout timestamps for payroll checks.',
      icon: CheckSquare,
      color: 'text-yellow-500 bg-yellow-500/10'
    }
  ];

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div>
        <h2 className="text-2xl font-extrabold tracking-tight">Reports Workspace</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Generate and export audits, pupil registers, and cash ledgers in CSV spreadsheets.</p>
      </div>

      {/* Reports Card grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
        {reportsList.map(r => {
          const Icon = r.icon;
          return (
            <div key={r.id} className="bg-card border border-border rounded-2xl p-5 shadow-sm flex flex-col justify-between hover:border-primary/30 transition-all">
              <div className="flex gap-4">
                <div className={`p-3 rounded-xl ${r.color} shrink-0`}>
                  <Icon className="h-5.5 w-5.5" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-extrabold text-sm text-foreground">{r.title}</h4>
                  <p className="text-muted-foreground leading-relaxed">{r.description}</p>
                </div>
              </div>

              <div className="pt-4 border-t border-border mt-5 flex justify-end">
                <button
                  onClick={() => handleDownloadReport(r.id)}
                  disabled={downloading !== null}
                  className="flex items-center gap-1.5 bg-secondary hover:bg-primary/15 hover:text-primary font-bold px-4 py-2 rounded-xl border border-border"
                >
                  <FileDown className="h-4 w-4" />
                  <span>{downloading === r.id ? 'Compiling CSV...' : 'Export Spreadsheet'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};

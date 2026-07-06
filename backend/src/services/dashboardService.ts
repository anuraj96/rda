import prisma from '../prisma/client';

export class DashboardService {
  static async getStats(orgId: string, branchId?: string, userRole?: string) {
    if (userRole === 'PRODUCT_OWNER') {
      const totalOrganizations = await prisma.organization.count({ where: { isActive: true } });
      const totalBranches = await prisma.branch.count({ where: { isActive: true } });
      const totalStudents = await prisma.student.count({ where: { isActive: true } });
      const totalStaff = await prisma.user.count({ where: { isActive: true } });
      // Monthly Finance Calculations (current month)
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      // Monthly Revenue (sum of income globally)
      const monthlyRevenueRaw = await prisma.income.aggregate({
        where: { isActive: true, date: { gte: startOfMonth, lte: endOfMonth } },
        _sum: { amount: true },
      });
      const monthlyRevenue = Number(monthlyRevenueRaw._sum.amount || 0);

      // Monthly Expenses (sum of expenses globally)
      const monthlyExpensesRaw = await prisma.expense.aggregate({
        where: { isActive: true, date: { gte: startOfMonth, lte: endOfMonth } },
        _sum: { amount: true },
      });
      const monthlyExpenses = Number(monthlyExpensesRaw._sum.amount || 0);
      const netProfit = monthlyRevenue - monthlyExpenses;

      return {
        isProductOwner: true,
        totalOrganizations,
        totalBranches,
        totalStudents,
        totalStaff,
        monthlyRevenue,
        monthlyExpenses,
        netProfit,
        pendingFees: 0,
        attendanceRate: 100,
        newAdmissions: 0,
      };
    }

    const filter: any = { organizationId: orgId, isActive: true };
    if (branchId) {
      filter.branchId = branchId;
    }

    // 1. Total Branches (only applicable to Org level, or 1 if filtered by branch)
    const totalBranches = await prisma.branch.count({
      where: { organizationId: orgId, isActive: true },
    });

    // 2. Student Counts
    const totalStudents = await prisma.student.count({ where: filter });
    const activeStudents = await prisma.student.count({
      where: { ...filter, status: 'ACTIVE' },
    });

    // 3. Staff Count
    const staffFilter: any = { organizationId: orgId, isActive: true };
    if (branchId) {
      staffFilter.branchId = branchId;
    } else {
      // Super admin sees all staff, but some might be org-level
    }
    const totalStaff = await prisma.user.count({ where: staffFilter });

    // 4. Monthly Finance Calculations (current month)
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const financeFilter: any = {
      organizationId: orgId,
      isActive: true,
      date: { gte: startOfMonth, lte: endOfMonth },
    };
    if (branchId) {
      financeFilter.branchId = branchId;
    }

    // Monthly Revenue (sum of income)
    const monthlyRevenueRaw = await prisma.income.aggregate({
      where: financeFilter,
      _sum: { amount: true },
    });
    const monthlyRevenue = Number(monthlyRevenueRaw._sum.amount || 0);

    // Monthly Expenses (sum of expenses)
    const monthlyExpensesRaw = await prisma.expense.aggregate({
      where: financeFilter,
      _sum: { amount: true },
    });
    const monthlyExpenses = Number(monthlyExpensesRaw._sum.amount || 0);

    const netProfit = monthlyRevenue - monthlyExpenses;

    // 5. Pending Fees
    const feeFilter: any = {
      organizationId: orgId,
      isActive: true,
      status: { in: ['PENDING', 'PARTIALLY_PAID', 'OVERDUE'] },
    };
    if (branchId) {
      feeFilter.branchId = branchId;
    }
    const pendingFeesRaw = await prisma.fee.aggregate({
      where: feeFilter,
      _sum: { amount: true, discount: true },
    });
    // Pending = (amount - discount) - (already paid)
    // For simplicity, let's estimate outstanding fees
    const outstandingFees = Number(pendingFeesRaw._sum.amount || 0) - Number(pendingFeesRaw._sum.discount || 0);

    // 6. Attendance Rate
    // Average student attendance rate in current month
    const attendanceFilter: any = {
      organizationId: orgId,
      isActive: true,
      type: 'STUDENT',
      date: { gte: startOfMonth, lte: endOfMonth },
    };
    if (branchId) {
      attendanceFilter.branchId = branchId;
    }

    const totalAttendanceRecords = await prisma.attendance.count({ where: attendanceFilter });
    const presentAttendanceRecords = await prisma.attendance.count({
      where: { ...attendanceFilter, status: { in: ['PRESENT', 'LATE'] } },
    });

    const attendanceRate = totalAttendanceRecords > 0
      ? Math.round((presentAttendanceRecords / totalAttendanceRecords) * 100)
      : 100;

    // 7. New Admissions (in current month)
    const newAdmissions = await prisma.student.count({
      where: {
        ...filter,
        joiningDate: { gte: startOfMonth, lte: endOfMonth },
      },
    });

    return {
      totalBranches: branchId ? 1 : totalBranches,
      totalStudents,
      activeStudents,
      totalStaff,
      monthlyRevenue,
      monthlyExpenses,
      netProfit,
      pendingFees: outstandingFees,
      attendanceRate,
      newAdmissions,
    };
  }

  static async getCharts(orgId: string, branchId?: string, userRole?: string) {
    if (userRole === 'PRODUCT_OWNER') {
      // 1. Monthly Revenue vs Expense Trend (last 6 months globally)
      const revenueTrend = [];
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const now = new Date();

      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const start = new Date(d.getFullYear(), d.getMonth(), 1);
        const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
        const label = `${months[d.getMonth()]} ${d.getFullYear().toString().slice(-2)}`;

        const rev = await prisma.income.aggregate({
          where: { isActive: true, date: { gte: start, lte: end } },
          _sum: { amount: true },
        });

        const exp = await prisma.expense.aggregate({
          where: { isActive: true, date: { gte: start, lte: end } },
          _sum: { amount: true },
        });

        revenueTrend.push({
          month: label,
          revenue: Number(rev._sum.amount || 0),
          expense: Number(exp._sum.amount || 0),
        });
      }

      // 2. Organization Comparison (Revenue, Students)
      const organizations = await prisma.organization.findMany({
        where: { isActive: true },
        select: { id: true, name: true },
      });

      const branchComparison = []; // Map to branchComparison so frontend reuse works
      for (const org of organizations) {
        const studentCount = await prisma.student.count({
          where: { organizationId: org.id, isActive: true },
        });

        const rev = await prisma.income.aggregate({
          where: { organizationId: org.id, isActive: true },
          _sum: { amount: true },
        });

        branchComparison.push({
          branchName: org.name,
          students: studentCount,
          revenue: Number(rev._sum.amount || 0),
        });
      }

      return {
        isProductOwner: true,
        revenueTrend,
        branchComparison,
        studentGrowth: [],
        feeCollectionAnalytics: [],
      };
    }

    const filter: any = { organizationId: orgId, isActive: true };
    if (branchId) {
      filter.branchId = branchId;
    }

    // 1. Monthly Revenue vs Expense Trend (last 6 months)
    const revenueTrend = [];
    const expenseTrend = [];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const start = new Date(d.getFullYear(), d.getMonth(), 1);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
      const label = `${months[d.getMonth()]} ${d.getFullYear().toString().slice(-2)}`;

      const revFilter = { ...filter, date: { gte: start, lte: end } };
      const expFilter = { ...filter, date: { gte: start, lte: end } };

      const rev = await prisma.income.aggregate({
        where: revFilter,
        _sum: { amount: true },
      });

      const exp = await prisma.expense.aggregate({
        where: expFilter,
        _sum: { amount: true },
      });

      revenueTrend.push({
        month: label,
        revenue: Number(rev._sum.amount || 0),
        expense: Number(exp._sum.amount || 0),
      });
    }

    // 2. Branch Comparison (Revenue, Students)
    const branches = await prisma.branch.findMany({
      where: { organizationId: orgId, isActive: true },
      select: { id: true, name: true },
    });

    const branchComparison = [];
    for (const b of branches) {
      const studentCount = await prisma.student.count({
        where: { organizationId: orgId, branchId: b.id, isActive: true },
      });

      const rev = await prisma.income.aggregate({
        where: { organizationId: orgId, branchId: b.id, isActive: true },
        _sum: { amount: true },
      });

      branchComparison.push({
        branchName: b.name.replace('Dance School ', ''),
        students: studentCount,
        revenue: Number(rev._sum.amount || 0),
      });
    }

    // 3. Student Growth Trend (last 6 months)
    const studentGrowth = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
      const label = months[d.getMonth()];

      const count = await prisma.student.count({
        where: {
          ...filter,
          joiningDate: { lte: end },
        },
      });

      studentGrowth.push({
        month: label,
        students: count,
      });
    }

    // 4. Fee Collection Analytics (by category/payment mode)
    const paymentModes = ['CASH', 'UPI', 'CARD', 'BANK_TRANSFER'];
    const feeCollectionAnalytics = [];

    for (const mode of paymentModes) {
      const modeFilter: any = {
        organizationId: orgId,
        isActive: true,
        paymentMode: mode,
      };
      if (branchId) {
        modeFilter.branchId = branchId;
      }

      const sumRaw = await prisma.feePayment.aggregate({
        where: modeFilter,
        _sum: { amountPaid: true },
      });

      feeCollectionAnalytics.push({
        name: mode,
        value: Number(sumRaw._sum.amountPaid || 0),
      });
    }

    return {
      revenueTrend,
      branchComparison,
      studentGrowth,
      feeCollectionAnalytics,
    };
  }
}

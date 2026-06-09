import prisma from '../prisma/client';
import { NotFoundError, BadRequestError } from '../utils/errors';

export class FinanceService {
  // Fees
  static async listFees(orgId: string, branchId?: string, query?: { status?: string; studentId?: string; search?: string; month?: string; page?: number; limit?: number }) {
    const where: any = { organizationId: orgId, isActive: true };
    if (branchId) where.branchId = branchId;
    if (query?.status) where.status = query.status;
    if (query?.studentId) where.studentId = query.studentId;

    if (query?.search) {
      where.student = {
        name: { contains: query.search, mode: 'insensitive' },
      };
    }

    if (query?.month) {
      const [year, month] = query.month.split('-');
      const start = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
      const end = new Date(parseInt(year, 10), parseInt(month, 10), 0, 23, 59, 59, 999);
      where.dueDate = { gte: start, lte: end };
    }

    const page = query?.page || 1;
    const limit = query?.limit || 10;
    const skip = (page - 1) * limit;

    const total = await prisma.fee.count({ where });
    const data = await prisma.fee.findMany({
      where,
      include: {
        student: {
          select: { id: true, name: true, admissionNumber: true, parentPhone: true },
        },
        payments: {
          where: { isActive: true },
        },
      },
      orderBy: { dueDate: 'desc' },
      skip,
      take: limit,
    });

    return { data, total };
  }

  static async getFeeById(orgId: string, id: string) {
    const fee = await prisma.fee.findFirst({
      where: { id, organizationId: orgId, isActive: true },
      include: {
        student: {
          select: { id: true, name: true, admissionNumber: true, parentName: true, parentPhone: true, address: true },
        },
        payments: {
          where: { isActive: true },
        },
      },
    });

    if (!fee) throw new NotFoundError('Fee record not found');
    return fee;
  }

  static async createFee(orgId: string, data: any, userId: string) {
    const student = await prisma.student.findFirst({
      where: { id: data.studentId, organizationId: orgId, isActive: true },
    });
    if (!student) throw new NotFoundError('Student not found');

    return prisma.fee.create({
      data: {
        organizationId: orgId,
        branchId: student.branchId,
        studentId: data.studentId,
        type: data.type,
        amount: data.amount,
        dueDate: data.dueDate,
        remarks: data.remarks || null,
        createdBy: userId,
        updatedBy: userId,
      },
    });
  }

  static async collectFee(orgId: string, data: any, userId: string) {
    const { feeId, amountPaid, paymentMode, transactionId, remarks, paymentDate } = data;

    const fee = await prisma.fee.findFirst({
      where: { id: feeId, organizationId: orgId, isActive: true },
      include: { payments: { where: { isActive: true } } },
    });

    if (!fee) throw new NotFoundError('Fee record not found');
    if (fee.status === 'PAID') throw new BadRequestError('Fee has already been fully paid');

    // Calculate remaining
    const totalPayments = fee.payments.reduce((sum, p) => sum + Number(p.amountPaid), 0);
    const outstanding = Number(fee.amount) - totalPayments;

    if (amountPaid > outstanding) {
      throw new BadRequestError(`Payment amount ${amountPaid} exceeds outstanding balance of ${outstanding}`);
    }

    return prisma.$transaction(async (tx) => {
      // 1. Generate unique receipt number
      const count = await tx.feePayment.count({ where: { organizationId: orgId } });
      const receiptNumber = `REC-${10000 + count + 1}`;

      // 2. Create payment record
      const payment = await tx.feePayment.create({
        data: {
          organizationId: orgId,
          branchId: fee.branchId,
          feeId,
          amountPaid,
          paymentDate: paymentDate || new Date(),
          paymentMode,
          transactionId: transactionId || null,
          receiptNumber,
          remarks: remarks || null,
          createdBy: userId,
          updatedBy: userId,
        },
      });

      // 3. Update Fee status
      const newTotalPaid = totalPayments + amountPaid;
      const feeStatus = newTotalPaid >= Number(fee.amount) ? 'PAID' : 'PARTIALLY_PAID';

      await tx.fee.update({
        where: { id: feeId },
        data: {
          status: feeStatus,
          updatedBy: userId,
        },
      });

      // 4. Create Income transaction automatically
      let incomeSource = 'STUDENT_FEES';
      if (fee.type === 'REGISTRATION') {
        incomeSource = 'REGISTRATION_FEES';
      } else if (fee.type === 'EVENT') {
        incomeSource = 'EVENT_REVENUE';
      }

      const studentName = await tx.student.findUnique({
        where: { id: fee.studentId },
        select: { name: true, admissionNumber: true },
      });

      await tx.income.create({
        data: {
          organizationId: orgId,
          branchId: fee.branchId,
          source: incomeSource,
          amount: amountPaid,
          date: paymentDate || new Date(),
          description: `Fee Payment [Receipt: ${receiptNumber}] for Student: ${studentName?.name} (${studentName?.admissionNumber})`,
          referenceId: payment.id,
          createdBy: userId,
          updatedBy: userId,
        },
      });

      // 5. Audit Log
      await tx.auditLog.create({
        data: {
          organizationId: orgId,
          branchId: fee.branchId,
          userId,
          action: 'COLLECT_FEE',
          entityName: 'Fee',
          entityId: feeId,
          details: JSON.stringify({ receiptNumber, amountPaid, status: feeStatus }),
        },
      });

      return { payment, status: feeStatus };
    });
  }

  static async getDefaulters(orgId: string, branchId?: string, query?: { page?: number; limit?: number }) {
    const today = new Date();

    const where: any = {
      organizationId: orgId,
      isActive: true,
      status: { in: ['PENDING', 'PARTIALLY_PAID', 'OVERDUE'] },
      dueDate: { lt: today }, // overdue
    };

    if (branchId) {
      where.branchId = branchId;
    }

    const page = query?.page || 1;
    const limit = query?.limit || 10;
    const skip = (page - 1) * limit;

    const total = await prisma.fee.count({ where });
    const data = await prisma.fee.findMany({
      where,
      include: {
        student: {
          select: { id: true, name: true, admissionNumber: true, parentPhone: true, email: true },
        },
      },
      orderBy: { dueDate: 'asc' },
      skip,
      take: limit,
    });

    return { data, total };
  }

  // Expenses CRUD
  static async listExpenses(orgId: string, branchId?: string, query?: { category?: string; staffId?: string; start?: Date; end?: Date; page?: number; limit?: number }) {
    const where: any = { organizationId: orgId, isActive: true };
    if (branchId) where.branchId = branchId;
    if (query?.category) where.category = query.category;

    if (query?.start || query?.end) {
      where.date = {};
      if (query.start) where.date.gte = query.start;
      if (query.end) where.date.lte = query.end;
    }

    // Filter by staffId if provided — salary records embed staffId in description prefix
    if (query?.staffId) {
      where.description = { contains: `[staffId:${query.staffId}]`, mode: 'insensitive' };
    }

    const page = query?.page || 1;
    const limit = query?.limit || 10;
    const skip = (page - 1) * limit;

    const total = await prisma.expense.count({ where });
    const data = await prisma.expense.findMany({
      where,
      orderBy: { date: 'desc' },
      skip,
      take: limit,
    });

    return { data, total };
  }

  // Salary history — returns all SALARY expenses, optionally for a specific staff member
  static async listSalaryPayouts(orgId: string, branchId?: string, query?: { staffId?: string; page?: number; limit?: number }) {
    const where: any = { organizationId: orgId, isActive: true, category: 'SALARY' };
    if (branchId) where.branchId = branchId;
    if (query?.staffId) {
      where.description = { contains: `[staffId:${query.staffId}]`, mode: 'insensitive' };
    }

    const page = query?.page || 1;
    const limit = query?.limit || 50;
    const skip = (page - 1) * limit;

    const total = await prisma.expense.count({ where });
    const data = await prisma.expense.findMany({
      where,
      orderBy: { date: 'desc' },
      skip,
      take: limit,
    });

    return { data, total };
  }

  static async createExpense(orgId: string, data: any, userId: string) {
    let description = data.description;

    // If SALARY payout with staffId, auto-enrich the description with staff info
    if (data.category === 'SALARY' && data.staffId) {
      const staffMember = await prisma.user.findFirst({
        where: { id: data.staffId, organizationId: orgId, isActive: true },
        include: { role: true },
      });
      if (staffMember) {
        description = `[staffId:${data.staffId}] Salary Payout - ${staffMember.name} (${staffMember.employeeId || data.staffId.slice(0, 8)}) [${staffMember.role.name}] | ${data.description}`;
      }
    }

    return prisma.expense.create({
      data: {
        organizationId: orgId,
        branchId: data.branchId,
        category: data.category,
        amount: data.amount,
        date: data.date,
        description,
        billUrl: data.billUrl || null,
        status: data.status || 'PAID',
        eventId: data.eventId || null,
        createdBy: userId,
        updatedBy: userId,
      },
    });
  }

  static async updateExpense(orgId: string, id: string, data: any, userId: string) {
    const exp = await prisma.expense.findFirst({
      where: { id, organizationId: orgId, isActive: true },
    });
    if (!exp) throw new NotFoundError('Expense record not found');

    return prisma.expense.update({
      where: { id },
      data: {
        branchId: data.branchId,
        category: data.category,
        amount: data.amount,
        date: data.date,
        description: data.description,
        billUrl: data.billUrl,
        status: data.status,
        eventId: data.eventId,
        updatedBy: userId,
      },
    });
  }

  static async deleteExpense(orgId: string, id: string, userId: string) {
    const exp = await prisma.expense.findFirst({
      where: { id, organizationId: orgId, isActive: true },
    });
    if (!exp) throw new NotFoundError('Expense record not found');

    return prisma.expense.update({
      where: { id },
      data: {
        isActive: false,
        updatedBy: userId,
      },
    });
  }

  // P&L and financial reports helper
  static async getProfitLossReport(orgId: string, branchId?: string, year?: number) {
    const targetYear = year || new Date().getFullYear();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const report = [];

    for (let m = 0; m < 12; m++) {
      const start = new Date(targetYear, m, 1);
      const end = new Date(targetYear, m + 1, 0);

      const incomeFilter: any = { organizationId: orgId, date: { gte: start, lte: end }, isActive: true };
      const expenseFilter: any = { organizationId: orgId, date: { gte: start, lte: end }, isActive: true };

      if (branchId) {
        incomeFilter.branchId = branchId;
        expenseFilter.branchId = branchId;
      }

      const rev = await prisma.income.aggregate({
        where: incomeFilter,
        _sum: { amount: true },
      });

      const exp = await prisma.expense.aggregate({
        where: expenseFilter,
        _sum: { amount: true },
      });

      const feeFilter: any = {
        organizationId: orgId,
        isActive: true,
        dueDate: { gte: start, lte: end },
        status: { in: ['PENDING', 'PARTIALLY_PAID', 'OVERDUE'] },
      };
      if (branchId) {
        feeFilter.branchId = branchId;
      }

      const pendingFees = await prisma.fee.findMany({
        where: feeFilter,
        include: {
          payments: {
            where: { isActive: true },
          },
        },
      });

      const pendingAmount = pendingFees.reduce((sum, fee) => {
        const totalPaid = fee.payments.reduce((pSum, p) => pSum + Number(p.amountPaid), 0);
        return sum + Math.max(0, Number(fee.amount) - totalPaid);
      }, 0);

      report.push({
        month: months[m],
        revenue: Number(rev._sum.amount || 0),
        expenses: Number(exp._sum.amount || 0),
        profit: Number(rev._sum.amount || 0) - Number(exp._sum.amount || 0),
        pending: pendingAmount,
      });
    }

    return report;
  }
}

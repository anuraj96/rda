import { Router } from 'express';

// Middlewares
import { authMiddleware } from '../middlewares/authMiddleware';
import { tenantMiddleware } from '../middlewares/tenantMiddleware';
import { checkPermission } from '../middlewares/rbacMiddleware';
import { validateRequest } from '../middlewares/validate';

// Validators
import {
  loginSchema,
  branchSchema,
  staffSchema,
  studentSchema,
  courseSchema,
  batchSchema,
  studentAttendanceListSchema,
  feePaymentSchema,
  feeCreateSchema,
  expenseSchema,
  eventSchema,
} from '../validators/schemas';

// Controllers
import { AuthController } from '../controllers/authController';
import { BranchController } from '../controllers/branchController';
import { StaffController } from '../controllers/staffController';
import { StudentController } from '../controllers/studentController';
import { CourseController } from '../controllers/courseController';
import { BatchController } from '../controllers/batchController';
import { AttendanceController } from '../controllers/attendanceController';
import { FeeController } from '../controllers/feeController';
import { ExpenseController } from '../controllers/expenseController';
import { EventController } from '../controllers/eventController';
import { DashboardController } from '../controllers/dashboardController';
import { NotificationController } from '../controllers/notificationController';
import { AuditController } from '../controllers/auditController';

const router = Router();

// ==========================================
// 1. AUTHENTICATION MODULE
// ==========================================
router.post('/auth/login', validateRequest(loginSchema), AuthController.login);
router.get('/auth/me', authMiddleware, AuthController.me);
router.post('/auth/logout', authMiddleware, AuthController.logout);

// ==========================================
// 2. DASHBOARD MODULE
// ==========================================
router.get('/dashboard/stats', authMiddleware, tenantMiddleware, DashboardController.getStats);
router.get('/dashboard/charts', authMiddleware, tenantMiddleware, DashboardController.getCharts);

// ==========================================
// 3. BRANCH MANAGEMENT (Super Admin only)
// ==========================================
router.get('/branches', authMiddleware, tenantMiddleware, BranchController.list);
router.get('/branches/:id', authMiddleware, tenantMiddleware, BranchController.getById);
router.post('/branches', authMiddleware, checkPermission('write:branch'), validateRequest(branchSchema), BranchController.create);
router.put('/branches/:id', authMiddleware, checkPermission('write:branch'), validateRequest(branchSchema), BranchController.update);
router.delete('/branches/:id', authMiddleware, checkPermission('write:branch'), BranchController.delete);

// ==========================================
// 4. STAFF MANAGEMENT
// ==========================================
router.get('/staff', authMiddleware, tenantMiddleware, checkPermission('manage:staff'), StaffController.list);
router.get('/staff/roles', authMiddleware, StaffController.listRoles);
router.get('/staff/:id', authMiddleware, tenantMiddleware, checkPermission('manage:staff'), StaffController.getById);
router.post('/staff', authMiddleware, tenantMiddleware, checkPermission('manage:staff'), validateRequest(staffSchema), StaffController.create);
router.put('/staff/:id', authMiddleware, tenantMiddleware, checkPermission('manage:staff'), validateRequest(staffSchema), StaffController.update);
router.delete('/staff/:id', authMiddleware, tenantMiddleware, checkPermission('manage:staff'), StaffController.delete);

// ==========================================
// 5. STUDENT MANAGEMENT
// ==========================================
router.get('/students', authMiddleware, tenantMiddleware, checkPermission('manage:students'), StudentController.list);
router.get('/students/:id', authMiddleware, tenantMiddleware, checkPermission('manage:students'), StudentController.getById);
router.post('/students', authMiddleware, tenantMiddleware, checkPermission('manage:students'), validateRequest(studentSchema), StudentController.create);
router.put('/students/:id', authMiddleware, tenantMiddleware, checkPermission('manage:students'), validateRequest(studentSchema), StudentController.update);
router.delete('/students/:id', authMiddleware, tenantMiddleware, checkPermission('manage:students'), StudentController.delete);

// Student Documents
router.post('/students/:id/documents', authMiddleware, tenantMiddleware, checkPermission('manage:students'), StudentController.addDocument);
router.delete('/students/documents/:docId', authMiddleware, tenantMiddleware, checkPermission('manage:students'), StudentController.deleteDocument);

// ==========================================
// 6. COURSE MANAGEMENT
// ==========================================
router.get('/courses', authMiddleware, CourseController.list);
router.get('/courses/:id', authMiddleware, CourseController.getById);
router.post('/courses', authMiddleware, checkPermission('manage:courses'), validateRequest(courseSchema), CourseController.create);
router.put('/courses/:id', authMiddleware, checkPermission('manage:courses'), validateRequest(courseSchema), CourseController.update);
router.delete('/courses/:id', authMiddleware, checkPermission('manage:courses'), CourseController.delete);

// ==========================================
// 7. BATCH MANAGEMENT
// ==========================================
router.get('/batches', authMiddleware, tenantMiddleware, BatchController.list);
router.get('/batches/:id', authMiddleware, tenantMiddleware, BatchController.getById);
router.post('/batches', authMiddleware, tenantMiddleware, checkPermission('manage:batches'), validateRequest(batchSchema), BatchController.create);
router.put('/batches/:id', authMiddleware, tenantMiddleware, checkPermission('manage:batches'), validateRequest(batchSchema), BatchController.update);
router.delete('/batches/:id', authMiddleware, tenantMiddleware, checkPermission('manage:batches'), BatchController.delete);

// Enroll / Unenroll students
router.post('/batches/:id/enroll', authMiddleware, tenantMiddleware, checkPermission('manage:batches'), BatchController.enrollStudents);
router.post('/batches/:id/unenroll', authMiddleware, tenantMiddleware, checkPermission('manage:batches'), BatchController.unenrollStudents);

// ==========================================
// 8. ATTENDANCE MANAGEMENT
// ==========================================
// Students
router.get('/attendance/student/batch/:batchId', authMiddleware, tenantMiddleware, AttendanceController.getBatchAttendance);
router.post('/attendance/student', authMiddleware, tenantMiddleware, checkPermission('manage:attendance'), validateRequest(studentAttendanceListSchema), AttendanceController.markStudent);
router.get('/attendance/student/:studentId/summary', authMiddleware, tenantMiddleware, AttendanceController.getStudentSummary);

// Staff check-in/out
router.post('/attendance/staff/check-in', authMiddleware, AttendanceController.checkIn);
router.post('/attendance/staff/check-out', authMiddleware, AttendanceController.checkOut);
router.get('/attendance/staff/report', authMiddleware, tenantMiddleware, checkPermission('manage:attendance'), AttendanceController.getStaffReport);

// ==========================================
// 9. FINANCE MANAGEMENT
// ==========================================
// Student Fees Invoices and Billing Ledger
router.get('/fees', authMiddleware, tenantMiddleware, checkPermission('manage:fees'), FeeController.list);
router.get('/fees/defaulters', authMiddleware, tenantMiddleware, checkPermission('manage:fees'), FeeController.getDefaulters);
router.post('/fees/create', authMiddleware, tenantMiddleware, checkPermission('manage:fees'), validateRequest(feeCreateSchema), FeeController.create);
router.post('/fees/collect', authMiddleware, tenantMiddleware, checkPermission('manage:fees'), validateRequest(feePaymentSchema), FeeController.collect);
router.get('/fees/:id', authMiddleware, tenantMiddleware, checkPermission('manage:fees'), FeeController.getById);

// Expenses Track
router.get('/expenses', authMiddleware, tenantMiddleware, checkPermission('manage:expenses'), ExpenseController.list);
router.post('/expenses', authMiddleware, tenantMiddleware, checkPermission('manage:expenses'), validateRequest(expenseSchema), ExpenseController.create);
router.put('/expenses/:id', authMiddleware, tenantMiddleware, checkPermission('manage:expenses'), validateRequest(expenseSchema), ExpenseController.update);
router.delete('/expenses/:id', authMiddleware, tenantMiddleware, checkPermission('manage:expenses'), ExpenseController.delete);

// Profit & Loss Report
router.get('/finances/pl', authMiddleware, tenantMiddleware, checkPermission('read:reports'), ExpenseController.getProfitLoss);

// ==========================================
// 10. EVENTS MANAGEMENT
// ==========================================
router.get('/events', authMiddleware, tenantMiddleware, EventController.list);
router.get('/events/:id', authMiddleware, tenantMiddleware, EventController.getById);
router.post('/events', authMiddleware, tenantMiddleware, checkPermission('manage:events'), validateRequest(eventSchema), EventController.create);
router.put('/events/:id', authMiddleware, tenantMiddleware, checkPermission('manage:events'), validateRequest(eventSchema), EventController.update);
router.delete('/events/:id', authMiddleware, tenantMiddleware, checkPermission('manage:events'), EventController.delete);

router.post('/events/:id/register', authMiddleware, tenantMiddleware, checkPermission('manage:events'), EventController.registerParticipant);
router.post('/events/:id/attendance', authMiddleware, tenantMiddleware, checkPermission('manage:events'), EventController.updateAttendance);

// ==========================================
// 11. NOTIFICATIONS MODULE
// ==========================================
router.get('/notifications', authMiddleware, NotificationController.list);
router.put('/notifications/:id/read', authMiddleware, NotificationController.markAsRead);
router.put('/notifications/read-all', authMiddleware, NotificationController.markAllAsRead);

// ==========================================
// 12. AUDIT LOGS MODULE
// ==========================================
router.get('/audit', authMiddleware, tenantMiddleware, checkPermission('read:dashboard'), AuditController.list);

export default router;

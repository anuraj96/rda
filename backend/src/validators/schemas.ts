import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const changePasswordSchema = z.object({
  oldPassword: z.string().min(6),
  newPassword: z.string().min(6),
});

export const branchSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  code: z.string().min(2, 'Code must be at least 2 characters'),
  address: z.string().min(5, 'Address must be at least 5 characters'),
  phone: z.string().min(10, 'Phone number must be at least 10 characters'),
  email: z.string().email('Invalid email address'),
  managerId: z.string().uuid().optional().nullable(),
  capacity: z.number().int().positive('Capacity must be a positive integer'),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
});

export const staffSchema = z.object({
  employeeId: z.string().min(2, 'Employee ID must be at least 2 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters').optional().nullable(),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  roleId: z.string().uuid('Invalid Role ID'),
  branchId: z.string().uuid('Invalid Branch ID').optional().nullable(),
  salary: z.number().positive('Salary must be positive').optional().nullable(),
  joiningDate: z.string().transform((val) => new Date(val)).optional().nullable(),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
});

export const studentSchema = z.object({
  admissionNumber: z.string().min(2, 'Admission number is required'),
  name: z.string().min(2, 'Student name must be at least 2 characters'),
  photo: z.string().url('Photo must be a valid URL').optional().nullable(),
  gender: z.string().min(1, 'Gender is required'),
  dob: z.string().transform((val) => new Date(val)),
  parentName: z.string().min(2, 'Parent name is required'),
  parentPhone: z.string().min(10, 'Parent phone is required'),
  email: z.string().email('Invalid email address').optional().nullable(),
  address: z.string().min(5, 'Address is required'),
  emergencyContact: z.string().min(10, 'Emergency contact is required'),
  joiningDate: z.string().transform((val) => new Date(val)),
  branchId: z.string().uuid('Invalid Branch ID'),
  courseId: z.string().uuid('Invalid Course ID').optional(),
  batchId: z.string().uuid('Invalid Batch ID').optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'DROPOUT']).default('ACTIVE'),
});

export const courseSchema = z.object({
  name: z.string().min(2, 'Course name must be at least 2 characters'),
  description: z.string().optional().nullable(),
  duration: z.number().int().positive('Duration in weeks must be positive'),
  monthlyFee: z.number().nonnegative('Monthly fee cannot be negative'),
  registrationFee: z.number().nonnegative('Registration fee cannot be negative'),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
});

export const batchSchema = z.object({
  name: z.string().min(2, 'Batch name must be at least 2 characters'),
  courseId: z.string().uuid('Invalid Course ID'),
  instructorId: z.string().uuid('Invalid Instructor ID'),
  schedule: z.string().min(2, 'Schedule description is required'),
  capacity: z.number().int().positive('Capacity must be a positive integer'),
  startDate: z.string().transform((val) => new Date(val)),
  endDate: z.string().transform((val) => new Date(val)),
  branchId: z.string().uuid('Invalid Branch ID'),
  status: z.enum(['ACTIVE', 'INACTIVE', 'COMPLETED']).default('ACTIVE'),
});

export const attendanceRecordSchema = z.object({
  studentId: z.string().uuid('Invalid Student ID').optional().nullable(),
  userId: z.string().uuid('Invalid User ID').optional().nullable(),
  status: z.enum(['PRESENT', 'ABSENT', 'LATE', 'LEAVE']),
  remarks: z.string().optional().nullable(),
});

export const studentAttendanceListSchema = z.object({
  batchId: z.string().uuid('Invalid Batch ID'),
  date: z.string().transform((val) => new Date(val)),
  records: z.array(
    z.object({
      studentId: z.string().uuid(),
      status: z.enum(['PRESENT', 'ABSENT', 'LATE', 'LEAVE']),
      remarks: z.string().optional().nullable(),
    })
  ),
});

export const feePaymentSchema = z.object({
  feeId: z.string().uuid('Invalid Fee ID'),
  amountPaid: z.number().positive('Amount paid must be positive'),
  paymentDate: z.string().transform((val) => new Date(val)).optional(),
  paymentMode: z.enum(['CASH', 'UPI', 'CARD', 'BANK_TRANSFER']),
  transactionId: z.string().optional().nullable(),
  remarks: z.string().optional().nullable(),
});

export const feeCreateSchema = z.object({
  studentId: z.string().uuid('Invalid Student ID'),
  type: z.enum(['MONTHLY', 'REGISTRATION', 'EVENT', 'OTHER']),
  amount: z.number().positive('Amount must be positive'),
  dueDate: z.string().transform((val) => new Date(val)),
  remarks: z.string().optional().nullable(),
});

export const expenseSchema = z.object({
  category: z.enum(['RENT', 'ELECTRICITY', 'SALARY', 'MARKETING', 'COSTUME', 'EQUIPMENT', 'EVENT_EXPENSE', 'MISCELLANEOUS']),
  amount: z.number().positive('Amount must be positive'),
  date: z.string().transform((val) => new Date(val)),
  description: z.string().min(3, 'Description must be at least 3 characters'),
  billUrl: z.string().url('Bill URL must be valid').optional().nullable(),
  status: z.enum(['PAID', 'PENDING']).default('PAID'),
  eventId: z.string().uuid().optional().nullable(),
});

export const eventSchema = z.object({
  name: z.string().min(2, 'Event name must be at least 2 characters'),
  date: z.string().transform((val) => new Date(val)),
  venue: z.string().min(2, 'Venue is required'),
  budget: z.number().nonnegative('Budget cannot be negative'),
  description: z.string().optional().nullable(),
  status: z.enum(['UPCOMING', 'COMPLETED', 'CANCELLED']).default('UPCOMING'),
});

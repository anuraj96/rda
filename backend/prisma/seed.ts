/// <reference types="node" />
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database started...');

  // 1. Create Organization
  const org = await prisma.organization.create({
    data: {
      name: 'Rudreshwar Dance Academy',
    },
  });
  console.log(`Created Organization: ${org.name} (${org.id})`);

  // 2. Create Permissions
  const permissionsData = [
    { name: 'read:dashboard', description: 'View dashboard analytics' },
    { name: 'write:branch', description: 'Create and update branches' },
    { name: 'read:branch', description: 'View branch details' },
    { name: 'manage:staff', description: 'Onboard and manage staff' },
    { name: 'manage:students', description: 'Manage student admissions and profiles' },
    { name: 'manage:courses', description: 'Manage dance courses catalog' },
    { name: 'manage:batches', description: 'Manage class batches and timetables' },
    { name: 'manage:attendance', description: 'Record student/staff attendance' },
    { name: 'manage:fees', description: 'Log student fee payments and invoices' },
    { name: 'manage:expenses', description: 'Record branch business expenses' },
    { name: 'manage:events', description: 'Manage dance concerts and events' },
    { name: 'read:reports', description: 'Generate financial and attendance reports' },
  ];

  const permissions: Record<string, any> = {};
  for (const perm of permissionsData) {
    permissions[perm.name] = await prisma.permission.upsert({
      where: { name: perm.name },
      update: {},
      create: perm,
    });
  }
  console.log('Upserted Permissions');

  // 3. Create Roles
  const roles = {
    SUPER_ADMIN: await prisma.role.upsert({
      where: { name: 'SUPER_ADMIN' },
      update: {},
      create: { name: 'SUPER_ADMIN', description: 'Main Owner / Super Administrator' },
    }),
    BRANCH_MANAGER: await prisma.role.upsert({
      where: { name: 'BRANCH_MANAGER' },
      update: {},
      create: { name: 'BRANCH_MANAGER', description: 'Branch Operations Manager' },
    }),
    STAFF: await prisma.role.upsert({
      where: { name: 'STAFF' },
      update: {},
      create: { name: 'STAFF', description: 'Front Desk / Admission Staff' },
    }),
    INSTRUCTOR: await prisma.role.upsert({
      where: { name: 'INSTRUCTOR' },
      update: {},
      create: { name: 'INSTRUCTOR', description: 'Dance Choreographer / Teacher' },
    }),
    ACCOUNTANT: await prisma.role.upsert({
      where: { name: 'ACCOUNTANT' },
      update: {},
      create: { name: 'ACCOUNTANT', description: 'Finance / Accounts Manager' },
    }),
  };
  console.log('Upserted Roles');

  // 4. Assign Permissions to Roles (RolePermission)
  // Clean first
  await prisma.rolePermission.deleteMany({});

  // Super Admin: gets all
  for (const permName of Object.keys(permissions)) {
    await prisma.rolePermission.create({
      data: {
        roleId: roles.SUPER_ADMIN.id,
        permissionId: permissions[permName].id,
      },
    });
  }

  // Branch Manager: gets almost all
  const managerPerms = [
    'read:dashboard', 'read:branch', 'manage:staff', 'manage:students',
    'manage:courses', 'manage:batches', 'manage:attendance', 'manage:fees',
    'manage:expenses', 'manage:events', 'read:reports'
  ];
  for (const permName of managerPerms) {
    await prisma.rolePermission.create({
      data: {
        roleId: roles.BRANCH_MANAGER.id,
        permissionId: permissions[permName].id,
      },
    });
  }

  // Staff: frontend operations
  const staffPerms = [
    'read:dashboard', 'read:branch', 'manage:students', 'manage:batches',
    'manage:attendance', 'read:reports'
  ];
  for (const permName of staffPerms) {
    await prisma.rolePermission.create({
      data: {
        roleId: roles.STAFF.id,
        permissionId: permissions[permName].id,
      },
    });
  }

  // Instructor: classes and attendance
  const instructorPerms = [
    'read:dashboard', 'read:branch', 'manage:batches', 'manage:attendance'
  ];
  for (const permName of instructorPerms) {
    await prisma.rolePermission.create({
      data: {
        roleId: roles.INSTRUCTOR.id,
        permissionId: permissions[permName].id,
      },
    });
  }

  // Accountant: billing and ledger
  const accountantPerms = [
    'read:dashboard', 'read:branch', 'manage:fees', 'manage:expenses', 'read:reports'
  ];
  for (const permName of accountantPerms) {
    await prisma.rolePermission.create({
      data: {
        roleId: roles.ACCOUNTANT.id,
        permissionId: permissions[permName].id,
      },
    });
  }
  console.log('Configured RolePermissions');

  // 5. Create Branches
  const branchKochi = await prisma.branch.create({
    data: {
      organizationId: org.id,
      name: 'Dance School Kochi',
      code: 'DSKCH',
      address: 'Vyttila, Kochi, Kerala - 682019',
      phone: '+91 98765 43210',
      email: 'kochi@rda.com',
      capacity: 120,
    },
  });

  const branchKollam = await prisma.branch.create({
    data: {
      organizationId: org.id,
      name: 'Dance School Kollam',
      code: 'DSKLM',
      address: 'Beach Road, Kollam, Kerala - 691001',
      phone: '+91 98765 43211',
      email: 'kollam@rda.com',
      capacity: 80,
    },
  });

  const branchTrivandrum = await prisma.branch.create({
    data: {
      organizationId: org.id,
      name: 'Dance School Trivandrum',
      code: 'DSTVM',
      address: 'Kowdiar, Trivandrum, Kerala - 695003',
      phone: '+91 98765 43212',
      email: 'trivandrum@rda.com',
      capacity: 150,
    },
  });
  console.log('Created Branches');

  // 6. Create Users
  // Super Admin
  const superAdmin = await prisma.user.create({
    data: {
      organizationId: org.id,
      employeeId: 'EMP001',
      name: 'Antony Raj',
      email: 'admin@rda.com',
      phone: '+91 99999 88888',
      address: 'Main Office, Trivandrum',
      roleId: roles.SUPER_ADMIN.id,
      salary: 100000.00,
      joiningDate: new Date('2024-01-01'),
    },
  });

  // Branch Managers
  const managerKochi = await prisma.user.create({
    data: {
      organizationId: org.id,
      branchId: branchKochi.id,
      employeeId: 'EMP002',
      name: 'Suresh Kumar',
      email: 'manager.kochi@rda.com',
      phone: '+91 98765 00001',
      address: 'Kochi Town',
      roleId: roles.BRANCH_MANAGER.id,
      salary: 60000.00,
      joiningDate: new Date('2024-02-15'),
    },
  });

  const managerKollam = await prisma.user.create({
    data: {
      organizationId: org.id,
      branchId: branchKollam.id,
      employeeId: 'EMP003',
      name: 'Ramesh Nair',
      email: 'manager.kollam@rda.com',
      phone: '+91 98765 00002',
      address: 'Kollam City',
      roleId: roles.BRANCH_MANAGER.id,
      salary: 55000.00,
      joiningDate: new Date('2024-03-01'),
    },
  });

  // Link Managers back to Branches
  await prisma.branch.update({
    where: { id: branchKochi.id },
    data: { managerId: managerKochi.id },
  });
  await prisma.branch.update({
    where: { id: branchKollam.id },
    data: { managerId: managerKollam.id },
  });

  // Staff
  const staffKochi = await prisma.user.create({
    data: {
      organizationId: org.id,
      branchId: branchKochi.id,
      employeeId: 'EMP004',
      name: 'Priya Sen',
      email: 'staff.kochi@rda.com',
      phone: '+91 98765 00003',
      address: 'Vyttila, Kochi',
      roleId: roles.STAFF.id,
      salary: 30000.00,
      joiningDate: new Date('2024-04-01'),
    },
  });

  // Accountant
  const accountantKochi = await prisma.user.create({
    data: {
      organizationId: org.id,
      branchId: branchKochi.id,
      employeeId: 'EMP005',
      name: 'Anjali Varma',
      email: 'accountant.kochi@rda.com',
      phone: '+91 98765 00004',
      address: 'Kochi Bypass',
      roleId: roles.ACCOUNTANT.id,
      salary: 40000.00,
      joiningDate: new Date('2024-03-15'),
    },
  });

  // Instructors
  const instructorJohn = await prisma.user.create({
    data: {
      organizationId: org.id,
      branchId: branchKochi.id,
      employeeId: 'EMP006',
      name: 'John Doe',
      email: 'instructor.john@rda.com',
      phone: '+91 98765 00005',
      roleId: roles.INSTRUCTOR.id,
      salary: 45000.00,
      joiningDate: new Date('2024-02-01'),
    },
  });

  const instructorJane = await prisma.user.create({
    data: {
      organizationId: org.id,
      branchId: branchKochi.id,
      employeeId: 'EMP007',
      name: 'Jane Smith',
      email: 'instructor.jane@rda.com',
      phone: '+91 98765 00006',
      roleId: roles.INSTRUCTOR.id,
      salary: 45000.00,
      joiningDate: new Date('2024-02-10'),
    },
  });

  const instructorAnny = await prisma.user.create({
    data: {
      organizationId: org.id,
      branchId: branchKollam.id,
      employeeId: 'EMP008',
      name: 'Anny Lee',
      email: 'instructor.anny@rda.com',
      phone: '+91 98765 00007',
      roleId: roles.INSTRUCTOR.id,
      salary: 40000.00,
      joiningDate: new Date('2024-05-01'),
    },
  });
  console.log('Created Users & Instructors');

  // 7. Create Courses
  const courseBara = await prisma.course.create({
    data: {
      organizationId: org.id,
      name: 'Bharatanatyam',
      description: 'Classical Indian dance form originating in Tamil Nadu.',
      duration: 48, // weeks (1 year)
      monthlyFee: 1500.00,
      registrationFee: 1000.00,
    },
  });

  const courseHipHop = await prisma.course.create({
    data: {
      organizationId: org.id,
      name: 'Hip Hop',
      description: 'Street dance styles primarily performed to hip-hop music.',
      duration: 24, // 6 months
      monthlyFee: 1200.00,
      registrationFee: 800.00,
    },
  });

  const courseSalsa = await prisma.course.create({
    data: {
      organizationId: org.id,
      name: 'Salsa',
      description: 'Social dance form originating from the Caribbean.',
      duration: 12, // 3 months
      monthlyFee: 1800.00,
      registrationFee: 1200.00,
    },
  });

  const courseContemp = await prisma.course.create({
    data: {
      organizationId: org.id,
      name: 'Contemporary',
      description: 'Style of expressive dance that combines elements of modern, jazz, lyrical and classical ballet.',
      duration: 24,
      monthlyFee: 1600.00,
      registrationFee: 1000.00,
    },
  });
  console.log('Created Courses');

  // 8. Create Batches
  const batchHipHopKochi = await prisma.batch.create({
    data: {
      organizationId: org.id,
      branchId: branchKochi.id,
      courseId: courseHipHop.id,
      instructorId: instructorJohn.id,
      name: 'Hip Hop Beginners - Kochi',
      schedule: 'Mon, Wed, Fri 5:00 PM - 6:30 PM',
      capacity: 25,
      startDate: new Date('2026-06-01'),
      endDate: new Date('2026-12-01'),
    },
  });

  const batchSalsaKochi = await prisma.batch.create({
    data: {
      organizationId: org.id,
      branchId: branchKochi.id,
      courseId: courseSalsa.id,
      instructorId: instructorJane.id,
      name: 'Salsa Intermediate - Kochi',
      schedule: 'Tue, Thu 7:00 PM - 8:30 PM',
      capacity: 20,
      startDate: new Date('2026-06-15'),
      endDate: new Date('2026-09-15'),
    },
  });

  const batchBaraKollam = await prisma.batch.create({
    data: {
      organizationId: org.id,
      branchId: branchKollam.id,
      courseId: courseBara.id,
      instructorId: instructorAnny.id,
      name: 'Bharatanatyam Juniors - Kollam',
      schedule: 'Sat, Sun 9:00 AM - 11:00 AM',
      capacity: 30,
      startDate: new Date('2026-05-01'),
      endDate: new Date('2027-05-01'),
    },
  });
  console.log('Created Batches');

  // 9. Create Students
  const studentsData = [
    { name: 'Adarsh Nair', email: 'adarsh@gmail.com', phone: '+91 99990 00001', branchId: branchKochi.id, batchId: batchHipHopKochi.id, courseId: courseHipHop.id },
    { name: 'Meera Pillai', email: 'meera@gmail.com', phone: '+91 99990 00002', branchId: branchKochi.id, batchId: batchHipHopKochi.id, courseId: courseHipHop.id },
    { name: 'Rohan Joshi', email: 'rohan@gmail.com', phone: '+91 99990 00003', branchId: branchKochi.id, batchId: batchSalsaKochi.id, courseId: courseSalsa.id },
    { name: 'Kavya Madhavan', email: 'kavya@gmail.com', phone: '+91 99990 00004', branchId: branchKochi.id, batchId: batchSalsaKochi.id, courseId: courseSalsa.id },
    { name: 'Arjun Das', email: 'arjun@gmail.com', phone: '+91 99990 00005', branchId: branchKollam.id, batchId: batchBaraKollam.id, courseId: courseBara.id },
    { name: 'Sneha Joseph', email: 'sneha@gmail.com', phone: '+91 99990 00006', branchId: branchKollam.id, batchId: batchBaraKollam.id, courseId: courseBara.id },
    { name: 'Fahad Faasil', email: 'fahad@gmail.com', phone: '+91 99990 00007', branchId: branchKochi.id, batchId: batchHipHopKochi.id, courseId: courseHipHop.id },
    { name: 'Gopika Menon', email: 'gopika@gmail.com', phone: '+91 99990 00008', branchId: branchKochi.id, batchId: batchSalsaKochi.id, courseId: courseSalsa.id },
  ];

  let admNo = 1001;
  const students = [];
  for (const s of studentsData) {
    const student = await prisma.student.create({
      data: {
        organizationId: org.id,
        branchId: s.branchId,
        admissionNumber: `ADM-${admNo++}`,
        name: s.name,
        gender: admNo % 2 === 0 ? 'Female' : 'Male',
        dob: new Date('2010-05-15'),
        parentName: `Parent of ${s.name}`,
        parentPhone: s.phone,
        email: s.email,
        address: '123, Maple Street, City, Kerala',
        emergencyContact: '+91 98765 99999',
        joiningDate: new Date('2026-05-01'),
      },
    });

    // Assign to batch
    await prisma.batchStudent.create({
      data: {
        batchId: s.batchId,
        studentId: student.id,
        joinedAt: new Date(),
        status: 'ACTIVE',
      },
    });

    // Seed student document
    await prisma.studentDocument.create({
      data: {
        studentId: student.id,
        name: 'AadharCard.pdf',
        fileUrl: 'https://supabase-storage-mock.com/adhar.pdf',
      },
    });

    students.push(student);
  }
  console.log('Created Students & Document Relations');

  // 10. Seed Attendance Logs
  const dates = [
    new Date('2026-06-01'),
    new Date('2026-06-02'),
    new Date('2026-06-03'),
    new Date('2026-06-04'),
    new Date('2026-06-05'),
  ];

  // Batch students list for batchHipHopKochi
  const hipHopStudents = students.filter(s => s.branchId === branchKochi.id && s.admissionNumber.match(/ADM-(1001|1002|1007)/));
  for (const date of dates) {
    for (const s of hipHopStudents) {
      await prisma.attendance.create({
        data: {
          organizationId: org.id,
          branchId: branchKochi.id,
          type: 'STUDENT',
          studentId: s.id,
          batchId: batchHipHopKochi.id,
          date,
          status: Math.random() > 0.15 ? 'PRESENT' : 'ABSENT',
          remarks: 'Daily Batch Attendance',
        },
      });
    }

    // Staff Attendance
    await prisma.attendance.create({
      data: {
        organizationId: org.id,
        branchId: branchKochi.id,
        type: 'STAFF',
        userId: instructorJohn.id,
        date,
        status: 'PRESENT',
        checkInTime: new Date(date.setHours(9, 0, 0, 0)),
        checkOutTime: new Date(date.setHours(17, 30, 0, 0)),
      },
    });
  }
  console.log('Created Attendance Records');

  // 11. Seed Fees, Payments & Incomes
  let receiptIndex = 5001;
  for (const s of students) {
    // Determine Course fee
    let courseFee = 1500.00;
    if (s.branchId === branchKollam.id) {
      courseFee = 1500.00; // Bharatanatyam
    } else {
      courseFee = s.admissionNumber.match(/1003|1004|1008/) ? 1800.00 : 1200.00; // Salsa or Hip Hop
    }

    // Create Due Registration Fee
    const regFee = await prisma.fee.create({
      data: {
        organizationId: org.id,
        branchId: s.branchId,
        studentId: s.id,
        type: 'REGISTRATION',
        amount: 1000.00,
        dueDate: new Date('2026-05-05'),
        status: 'PAID',
      },
    });

    // Create registration payment
    const regPayment = await prisma.feePayment.create({
      data: {
        organizationId: org.id,
        branchId: s.branchId,
        feeId: regFee.id,
        amountPaid: 1000.00,
        paymentDate: new Date('2026-05-02'),
        paymentMode: 'UPI',
        transactionId: `TXN${Math.floor(Math.random() * 900000 + 100000)}`,
        receiptNumber: `REC-${receiptIndex++}`,
      },
    });

    // Record registration income
    await prisma.income.create({
      data: {
        organizationId: org.id,
        branchId: s.branchId,
        source: 'REGISTRATION_FEES',
        amount: 1000.00,
        date: new Date('2026-05-02'),
        description: `Registration Fee for ${s.name}`,
        referenceId: regPayment.id,
      },
    });

    // Create Monthly Fee (Pending/Paid)
    const paidMonthly = Math.random() > 0.3;
    const monthlyFee = await prisma.fee.create({
      data: {
        organizationId: org.id,
        branchId: s.branchId,
        studentId: s.id,
        type: 'MONTHLY',
        amount: courseFee,
        dueDate: new Date('2026-06-10'),
        status: paidMonthly ? 'PAID' : 'PENDING',
      },
    });

    if (paidMonthly) {
      const monPayment = await prisma.feePayment.create({
        data: {
          organizationId: org.id,
          branchId: s.branchId,
          feeId: monthlyFee.id,
          amountPaid: courseFee,
          paymentDate: new Date('2026-06-03'),
          paymentMode: 'CASH',
          receiptNumber: `REC-${receiptIndex++}`,
        },
      });

      // Record monthly fee income
      await prisma.income.create({
        data: {
          organizationId: org.id,
          branchId: s.branchId,
          source: 'STUDENT_FEES',
          amount: courseFee,
          date: new Date('2026-06-03'),
          description: `June Tuition Fee for ${s.name}`,
          referenceId: monPayment.id,
        },
      });
    }
  }
  console.log('Seeded Student Fees, Payments & Auto Income logs');

  // 12. Seed Expenses
  const expensesData = [
    { category: 'RENT', amount: 25000.00, description: 'Monthly space rent Kochi', branchId: branchKochi.id },
    { category: 'RENT', amount: 15000.00, description: 'Monthly space rent Kollam', branchId: branchKollam.id },
    { category: 'ELECTRICITY', amount: 4800.00, description: 'Electricity Bill Kochi May', branchId: branchKochi.id },
    { category: 'MARKETING', amount: 5000.00, description: 'Facebook Ads campaign', branchId: branchKochi.id },
    { category: 'EQUIPMENT', amount: 12000.00, description: 'Sound System Speakers', branchId: branchKochi.id },
  ];

  for (const e of expensesData) {
    await prisma.expense.create({
      data: {
        organizationId: org.id,
        branchId: e.branchId,
        category: e.category,
        amount: e.amount,
        date: new Date('2026-05-25'),
        description: e.description,
        status: 'PAID',
      },
    });
  }
  console.log('Created Expenses');

  // 13. Create Events
  const danceConcert = await prisma.event.create({
    data: {
      organizationId: org.id,
      branchId: branchKochi.id,
      name: 'Summer Dance Fest 2026',
      date: new Date('2026-07-20'),
      venue: 'Town Hall Kochi',
      budget: 50000.00,
      description: 'Annual summer choreography showcase.',
      status: 'UPCOMING',
    },
  });

  // Assign Event participants
  for (let i = 0; i < 4; i++) {
    await prisma.eventParticipant.create({
      data: {
        eventId: danceConcert.id,
        studentId: students[i].id,
      },
    });
  }
  console.log('Created Events and Participant relations');

  // 14. Create Notifications & Audit Logs
  await prisma.notification.create({
    data: {
      organizationId: org.id,
      branchId: branchKochi.id,
      userId: managerKochi.id,
      title: 'New Admission Registered',
      message: 'Student Arjun Das has been registered to the branch.',
      type: 'NEW_ADMISSION',
    },
  });

  await prisma.auditLog.create({
    data: {
      organizationId: org.id,
      branchId: branchKochi.id,
      userId: superAdmin.id,
      action: 'SEED_SYSTEM',
      entityName: 'SYSTEM',
      details: JSON.stringify({ message: 'System initial seed run completed successfully.' }),
    },
  });
  console.log('Created Notifications & Audit logs');

  console.log('Database Seeding successfully completed!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

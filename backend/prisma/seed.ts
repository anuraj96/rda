/// <reference types="node" />
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Clearing existing database tables...');
  await prisma.auditLog.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.eventParticipant.deleteMany({});
  await prisma.event.deleteMany({});
  await prisma.income.deleteMany({});
  await prisma.expense.deleteMany({});
  await prisma.feePayment.deleteMany({});
  await prisma.fee.deleteMany({});
  await prisma.attendance.deleteMany({});
  await prisma.batchStudent.deleteMany({});
  await prisma.batch.deleteMany({});
  await prisma.course.deleteMany({});
  await prisma.studentDocument.deleteMany({});
  await prisma.student.deleteMany({});

  // Link back reference cleanup
  await prisma.branch.updateMany({
    data: { managerId: null }
  });
  await prisma.user.deleteMany({});
  await prisma.branch.deleteMany({});
  await prisma.rolePermission.deleteMany({});
  await prisma.role.deleteMany({});
  await prisma.permission.deleteMany({});
  await prisma.organization.deleteMany({});
  console.log('Database tables cleared successfully.');

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

  // 5. Create Super Admin User only
  await prisma.user.create({
    data: {
      organizationId: org.id,
      employeeId: 'EMP001',
      name: 'Sujith S Kurup',
      email: 'admin@rda.com',
      phone: '+91 99999 88888',
      address: 'Main Office, Trivandrum',
      roleId: roles.SUPER_ADMIN.id,
      salary: 100000.00,
      joiningDate: new Date('2024-01-01'),
    },
  });
  console.log('Created Super Admin user');

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

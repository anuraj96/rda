import prisma from '../prisma/client';

async function main() {
  console.log('Locating PRODUCT_OWNER role...');
  const role = await prisma.role.findUnique({
    where: { name: 'PRODUCT_OWNER' }
  });

  if (!role) {
    throw new Error('Role PRODUCT_OWNER does not exist. Please run add-product-owner-role script first.');
  }

  console.log('Locating primary organization...');
  const primaryOrg = await prisma.organization.findFirst({
    orderBy: { createdAt: 'asc' }
  });

  if (!primaryOrg) {
    throw new Error('No organization exists in the database. Please seed the database first.');
  }

  console.log(`Using organization: ${primaryOrg.name} (${primaryOrg.id})`);
  if (!primaryOrg.isActive) {
    console.log('Re-activating primary organization...');
    await prisma.organization.update({
      where: { id: primaryOrg.id },
      data: { isActive: true }
    });
  }

  const newEmail = 'ar@arsuite.com';
  const newPassword = 'arSuite#SecuRe2026!'; // Strong password

  // Find if owner@rda.com exists
  const oldUser = await prisma.user.findUnique({
    where: { email: 'owner@rda.com' }
  });

  if (oldUser) {
    console.log('Found old owner@rda.com account. Renaming email and updating password...');
    const updatedUser = await prisma.user.update({
      where: { id: oldUser.id },
      data: {
        email: newEmail,
        password: newPassword,
        name: 'ARSuite Product Owner',
        roleId: role.id,
        organizationId: primaryOrg.id,
      }
    });
    console.log('Successfully updated Product Owner user:', {
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name
    });
  } else {
    console.log(`Provisioning new Product Owner account for ${newEmail}...`);
    const user = await prisma.user.upsert({
      where: { email: newEmail },
      update: {
        password: newPassword,
        roleId: role.id,
        organizationId: primaryOrg.id,
        name: 'ARSuite Product Owner',
        isActive: true,
      },
      create: {
        email: newEmail,
        password: newPassword,
        roleId: role.id,
        organizationId: primaryOrg.id,
        name: 'ARSuite Product Owner',
        isActive: true,
      }
    });
    console.log('Successfully setup new Product Owner account:', {
      id: user.id,
      email: user.email,
      name: user.name
    });
  }
}

main()
  .catch(err => {
    console.error('Error running setup script:', err);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });

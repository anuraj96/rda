import prisma from '../prisma/client';

async function main() {
  console.log('Checking for PRODUCT_OWNER role...');
  const roleName = 'PRODUCT_OWNER';
  
  const existingRole = await prisma.role.findUnique({
    where: { name: roleName }
  });

  if (existingRole) {
    console.log('Role PRODUCT_OWNER already exists in database.');
  } else {
    console.log('Role PRODUCT_OWNER does not exist. Creating it...');
    const newRole = await prisma.role.create({
      data: {
        name: roleName,
        description: 'Product Owner / Platform Admin with permission to create Super Admins'
      }
    });
    console.log('Successfully created role:', newRole);
  }
}

main()
  .catch(err => {
    console.error('Error running script:', err);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });

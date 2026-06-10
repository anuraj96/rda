console.error("==========================================================");
console.error("CRITICAL SAFETY BLOCK: SEEDING IS DISABLED ON THIS DATABASE");
console.error("This project is connected to a live production/shared database.");
console.error("Running seed.ts will wipe production/shared records (students, fees, etc.).");
console.error("==========================================================");
process.exit(1);

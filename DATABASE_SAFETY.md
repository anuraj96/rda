# Database Safety Instructions

> [!WARNING]
> **CRITICAL WARNING:** This workspace is configured to connect to a **live database (Supabase)**.

## Strict Rules

1. **DO NOT** run database-clearing commands like `npx prisma db seed`, `prisma migrate reset`, or any other commands that wipe/delete database tables.
2. The seed script has been disabled and `package.json` configurations have been removed. Do not restore them.
3. Treat all migrations and schemas with caution. Only run constructive operations.

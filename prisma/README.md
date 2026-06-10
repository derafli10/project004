# Prisma Database Setup

This directory contains the Prisma schema, migrations, and seed scripts for the Grade Optimizer & KPI Dashboard.

## Prerequisites

1. PostgreSQL 16+ installed and running on Neon
2. Node.js 18+ installed
3. Environment variables configured in `.env`

## Running Migrations

To create the database tables and apply the schema:

```bash
# Run all pending migrations
npx prisma migrate dev

# Or specify a name for new migration
npx prisma migrate dev --name init
```

This will:
- Create the PostgreSQL tables based on `schema.prisma`
- Generate the Prisma Client TypeScript types
- Apply all migrations in the `prisma/migrations` folder

## Generating Prisma Client

The Prisma Client is automatically generated when running migrations. To regenerate manually:

```bash
npx prisma generate
```

This creates TypeScript types in `node_modules/@prisma/client` based on your schema.

## Seeding the Database

The seed script (`seed.ts`) populates the database with sample data demonstrating:
- **Integer-based precision mathematics** (Guardrail 1: all weights/scores stored as integers 0-10000)
- **Multi-tenant data isolation** (Guardrail 2: separate tenantId for each user)
- **Realistic academic scenarios** (courses with various completion states)

### Run the Seed Script:

```bash
# Seed the database
npx prisma db seed
```

### Sample Data Created:

**Users:**
- Rafliza Ardiansa (tenant-001) with 3 courses
- Ardiansa (tenant-002) with 1 course

**Courses with Components:**
1. **Algoritma dan Struktur Data** (4 SKS, Grade A target)
   - 5 components, all completed
   - Status: NORMAL (achieving target grade)

2. **Basis Data** (3 SKS, Grade A target)
   - 5 components, 4 completed
   - Status: WARNING (needs 92% on remaining)

3. **Pemrograman Web** (3 SKS, Grade A target)
   - 5 components, 2 completed
   - Status: DANGER (needs 95%+ on remaining - HIGH RISK)

4. **Kalkulus II** (4 SKS, Grade AB target)
   - 5 components, 4 completed
   - Status: WARNING (needs 88% on UAS)

**Notifications:**
- 3 alert notifications (WARNING and DANGER levels)

### Integer Storage Verification

The seed script demonstrates the integer storage format:

| Display Value | Database Storage | Conversion |
|--------------|------------------|------------|
| 100.00% | 10000 | `100.00 * 100` |
| 85.50% | 8550 | `85.50 * 100` |
| 20.00% | 2000 | `20.00 * 100` |
| 0.01% | 1 | `0.01 * 100` |

**Example Component:**
- Weight (DB): `1000` → Displays as `10.00%`
- Achieved Score (DB): `9200` → Displays as `92.00%`

## Database Management Commands

```bash
# Open Prisma Studio (GUI for database inspection)
npx prisma studio

# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Deploy migrations to production
npx prisma migrate deploy

# Create migration without applying
npx prisma migrate dev --create-only

# Check migration status
npx prisma migrate status
```

## Schema Validation

To validate the Prisma schema without database access:

```bash
npx prisma validate
```

## Troubleshooting

### Connection Issues

**Error: P1001 - Can't reach database server**
- Ensure PostgreSQL is running: `pg_isready`
- Verify DATABASE_URL in `.env` file
- Check PostgreSQL is listening on the correct port (default: 5432)

**Error: P1003 - Database does not exist**
- Create the database: `createdb grade_optimizer`
- Or use psql: `CREATE DATABASE grade_optimizer;`

### Migration Issues

**Error: P3005 - Database is not empty**
- Run `npx prisma migrate reset` to clear and reapply migrations
- Or manually drop tables and re-run migrations

**Error: P1012 - Environment variable not found**
- Ensure `.env` file exists in project root
- Verify `DATABASE_URL` is defined

## Production Deployment

For production environments:

1. **Never use `migrate dev` in production**
2. **Use `migrate deploy` instead:**
   ```bash
   npx prisma migrate deploy
   ```

3. **Do not seed production databases with test data**

4. **Use environment-specific `.env` files:**
   - Development: `.env.development`
   - Production: `.env.production`

## Integer Precision Architecture

All decimal values (weights, scores, thresholds) are stored as integers to eliminate floating-point precision errors:

**Storage Rules:**
- Database: `Int` type (0-10000 range)
- Application logic: Integer arithmetic
- UI display: Divide by 100 and format to 2 decimal places
- User input: Multiply by 100 before storage

**Benefits:**
- No floating-point errors (0.1 + 0.2 = 0.3 ✓)
- Precise calculations for grade requirements
- Consistent rounding behavior
- Database index optimization

## Multi-Tenant Isolation

Every table (except User) includes `tenantId` for data isolation:

**Rules:**
- All queries MUST filter by `tenantId`
- Cascade deletes preserve referential integrity
- Indexes include `tenantId` for performance
- Session-based tenant extraction (never trust client input)

## Support

For issues or questions:
1. Check Prisma documentation: https://www.prisma.io/docs
2. Validate schema: `npx prisma validate`
3. Review migration history: `npx prisma migrate status`
4. Inspect database: `npx prisma studio`

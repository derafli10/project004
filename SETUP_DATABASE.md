# Database Setup Guide

## Quick Start

Follow these steps to set up the PostgreSQL database for the Grade Optimizer & KPI Dashboard.

### Step 1: Install PostgreSQL

If you don't have PostgreSQL installed:

**Windows:**
```bash
# Download and install from https://www.postgresql.org/download/windows/
# Or use Chocolatey:
choco install postgresql
```

**macOS:**
```bash
brew install postgresql@16
brew services start postgresql@16
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

### Step 2: Create Database

```bash
# Connect to PostgreSQL as superuser
psql -U postgres

# Create the database
CREATE DATABASE grade_optimizer;

# Exit psql
\q
```

### Step 3: Configure Environment

1. Copy the environment template:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and update the `DATABASE_URL` with your credentials:
   ```env
   DATABASE_URL="postgresql://postgres:your_password@localhost:5432/grade_optimizer?schema=public"
   ```

### Step 4: Run Migrations

Apply the database schema:

```bash
# Run migrations to create tables
npx prisma migrate dev

# Or if database is already created, deploy migrations
npx prisma migrate deploy
```

This creates all tables with the correct structure:
- **users** table with unique tenantId
- **courses** table with integer-based weights and thresholds
- **components** table with integer-based weights and scores
- **notifications** table with alert levels

### Step 5: Generate Prisma Client

The Prisma Client provides TypeScript types for database operations:

```bash
npx prisma generate
```

### Step 6: Seed Database (Optional)

Populate the database with sample data for development:

```bash
npx prisma db seed
```

This creates:
- 2 sample users (Ahmad Rizki, Siti Nurhaliza)
- 4 courses with various completion states
- 20 grading components
- 3 sample notifications

## Verification

### Verify Database Connection

```bash
# Open Prisma Studio to inspect data
npx prisma studio
```

This opens a web interface at http://localhost:5555 where you can browse tables and data.

### Verify Integer Storage Format

After seeding, check that values are stored as integers:

```sql
-- Connect to database
psql -U postgres -d grade_optimizer

-- Check component storage
SELECT 
    name,
    weight as weight_db,
    weight::float / 100 as weight_percent,
    "achievedScore" as score_db,
    "achievedScore"::float / 100 as score_percent
FROM components
LIMIT 5;
```

**Expected Output:**
```
        name        | weight_db | weight_percent | score_db | score_percent
--------------------+-----------+----------------+----------+---------------
 Quiz 1             |      1000 |          10.00 |     9200 |         92.00
 Quiz 2             |      1000 |          10.00 |     8800 |         88.00
 Tugas Praktikum    |      2000 |          20.00 |     9500 |         95.00
 UTS                |      3000 |          30.00 |     8500 |         85.00
 UAS                |      3000 |          30.00 |     8700 |         87.00
```

### Verify Multi-Tenant Isolation

Check that data is properly isolated by tenantId:

```sql
-- Count courses per tenant
SELECT 
    "tenantId",
    COUNT(*) as course_count
FROM courses
GROUP BY "tenantId";
```

**Expected Output:**
```
  tenantId   | course_count
-------------+--------------
 tenant-001  |            3
 tenant-002  |            1
```

### Verify Referential Integrity

Check that foreign key constraints are working:

```sql
-- Verify cascade relationships
SELECT 
    c.name as course_name,
    COUNT(comp.id) as component_count
FROM courses c
LEFT JOIN components comp ON comp."courseId" = c.id
GROUP BY c.id, c.name
ORDER BY c.name;
```

**Expected Output:**
```
      course_name           | component_count
----------------------------+-----------------
 Algoritma dan Struktur Data|               5
 Basis Data                 |               5
 Kalkulus II                |               5
 Pemrograman Web            |               5
```

## Requirements Validation

This setup satisfies the following requirements from the spec:

### Requirement 14.2: Integer-Based Precision Storage
✅ **Verified**: All weights and scores stored as integers (0-10000 range)
- Database columns use `INTEGER` type (not `FLOAT` or `DECIMAL`)
- Sample data demonstrates correct storage format
- Conversion happens only at presentation layer

### Guardrail 1.1: Integer Storage for Weights
✅ **Verified**: Component weights stored as integers
- Example: 10.00% stored as `1000`
- Example: 30.00% stored as `3000`

### Guardrail 1.2: Integer Storage for Scores
✅ **Verified**: Achievement scores stored as integers
- Example: 92.00% stored as `9200`
- Example: 85.50% stored as `8550`

### Guardrail 1.3: Integer Storage for Thresholds
✅ **Verified**: Target thresholds stored as integers
- Example: Grade A threshold (80.00%) stored as `8000`
- Example: Grade AB threshold (75.00%) stored as `7500`

## Troubleshooting

### Issue: "Can't reach database server"

**Solution:**
1. Verify PostgreSQL is running:
   ```bash
   # Windows
   Get-Service -Name postgresql*
   
   # macOS/Linux
   pg_isready
   ```

2. Start PostgreSQL if not running:
   ```bash
   # Windows
   net start postgresql
   
   # macOS
   brew services start postgresql@16
   
   # Linux
   sudo systemctl start postgresql
   ```

### Issue: "Database does not exist"

**Solution:**
```bash
# Create the database
createdb grade_optimizer

# Or using psql
psql -U postgres -c "CREATE DATABASE grade_optimizer;"
```

### Issue: "Authentication failed"

**Solution:**
1. Check your PostgreSQL password
2. Update `DATABASE_URL` in `.env` with correct credentials
3. Test connection:
   ```bash
   psql -U postgres -d grade_optimizer
   ```

### Issue: "Migration already applied"

**Solution:**
```bash
# Check migration status
npx prisma migrate status

# If migrations are out of sync, reset (WARNING: deletes all data)
npx prisma migrate reset
```

### Issue: "Seed script fails"

**Solution:**
1. Ensure migrations have been applied:
   ```bash
   npx prisma migrate deploy
   ```

2. Clear existing data before re-seeding:
   ```bash
   npx prisma migrate reset --skip-seed
   npx prisma db seed
   ```

## Next Steps

After setting up the database:

1. **Start Development Server:**
   ```bash
   npm run dev
   ```

2. **Run Tests:**
   ```bash
   npm test
   ```

3. **Inspect Database:**
   ```bash
   npx prisma studio
   ```

4. **Review Sample Data:**
   - Open Prisma Studio
   - Browse the `courses` and `components` tables
   - Verify integer storage format
   - Check multi-tenant isolation

## Production Deployment

For production environments:

1. **Use managed PostgreSQL** (AWS RDS, Google Cloud SQL, or Azure Database for PostgreSQL)

2. **Update DATABASE_URL** with production credentials

3. **Deploy migrations** (never use `migrate dev` in production):
   ```bash
   npx prisma migrate deploy
   ```

4. **Do not seed production** with test data

5. **Enable connection pooling** for high-traffic scenarios:
   ```env
   DATABASE_URL="postgresql://user:pass@host:5432/db?schema=public&connection_limit=10&pool_timeout=20"
   ```

## Support

- Prisma Documentation: https://www.prisma.io/docs
- PostgreSQL Documentation: https://www.postgresql.org/docs/
- Project Requirements: `.kiro/specs/project004-grade-optimizer/requirements.md`
- Technical Design: `.kiro/specs/project004-grade-optimizer/design.md`

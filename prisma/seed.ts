/**
 * Prisma Database Seed Script
 * Project004 - Grade Optimizer & KPI Dashboard
 * 
 * This script populates the database with sample data demonstrating:
 * - Integer-based precision mathematics (Guardrail 1)
 * - Multi-tenant data isolation (Guardrail 2)
 * - Realistic academic scenarios with various grading configurations
 * 
 * All weights and scores use integer storage (0-10000 range):
 * - 100.00% = 10000
 * - 85.50% = 8550
 * - 20.00% = 2000
 * - 0.01% = 1
 */

import { PrismaClient, TargetGrade, AlertLevel } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...\n');

  // Clean existing data (development only)
  console.log('🧹 Cleaning existing data...');
  await prisma.notification.deleteMany();
  await prisma.component.deleteMany();
  await prisma.course.deleteMany();
  await prisma.user.deleteMany();
  console.log('✓ Existing data cleared\n');

  // Create sample users/tenants
  console.log('👤 Creating sample users...');
  
  const user1 = await prisma.user.create({
    data: {
      id: 'user-001',
      email: 'raflizaardiansa@apps.ipb.ac.id',
      name: 'Rafliza Ardiansa',
      tenantId: 'tenant-001',
    },
  });
  console.log(`✓ Created user: ${user1.name} (${user1.email})`);

  const user2 = await prisma.user.create({
    data: {
      id: 'user-002',
      email: 'rafliazrdiansa@gmail.com',
      name: 'Ardiansa',
      tenantId: 'tenant-002',
    },
  });
  console.log(`✓ Created user: ${user2.name} (${user2.email})\n`);

  // Create courses for user 1
  console.log('📚 Creating courses for Rafliza Ardiansa...');
  
  // Course 1: Algoritma dan Struktur Data (with all components completed - NORMAL status)
  const course1 = await prisma.course.create({
    data: {
      id: 'course-001',
      name: 'Algoritma dan Struktur Data',
      sks: 4,
      targetGrade: TargetGrade.A,
      targetThreshold: 8000, // 80.00%
      tenantId: user1.tenantId,
      components: {
        create: [
          {
            id: 'comp-001',
            name: 'Quiz 1',
            weight: 1000, // 10.00%
            achievedScore: 9200, // 92.00%
          },
          {
            id: 'comp-002',
            name: 'Quiz 2',
            weight: 1000, // 10.00%
            achievedScore: 8800, // 88.00%
          },
          {
            id: 'comp-003',
            name: 'Tugas Praktikum',
            weight: 2000, // 20.00%
            achievedScore: 9500, // 95.00%
          },
          {
            id: 'comp-004',
            name: 'UTS',
            weight: 3000, // 30.00%
            achievedScore: 8500, // 85.00%
          },
          {
            id: 'comp-005',
            name: 'UAS',
            weight: 3000, // 30.00%
            achievedScore: 8700, // 87.00%
          },
        ],
      },
    },
  });
  console.log(`✓ Created course: ${course1.name} (${course1.sks} SKS) - Grade Target: ${course1.targetGrade}`);

  // Course 2: Basis Data (partial completion - WARNING status)
  const course2 = await prisma.course.create({
    data: {
      id: 'course-002',
      name: 'Basis Data',
      sks: 3,
      targetGrade: TargetGrade.A,
      targetThreshold: 8000, // 80.00%
      tenantId: user1.tenantId,
      components: {
        create: [
          {
            id: 'comp-006',
            name: 'Quiz 1',
            weight: 1500, // 15.00%
            achievedScore: 7500, // 75.00%
          },
          {
            id: 'comp-007',
            name: 'Quiz 2',
            weight: 1500, // 15.00%
            achievedScore: 7800, // 78.00%
          },
          {
            id: 'comp-008',
            name: 'Tugas Project',
            weight: 2000, // 20.00%
            achievedScore: 8200, // 82.00%
          },
          {
            id: 'comp-009',
            name: 'UTS',
            weight: 2500, // 25.00%
            achievedScore: 7200, // 72.00%
          },
          {
            id: 'comp-010',
            name: 'UAS',
            weight: 2500, // 25.00%
            achievedScore: null, // Not yet taken
          },
        ],
      },
    },
  });
  console.log(`✓ Created course: ${course2.name} (${course2.sks} SKS) - Grade Target: ${course2.targetGrade}`);

  // Course 3: Pemrograman Web (minimal completion - DANGER status)
  const course3 = await prisma.course.create({
    data: {
      id: 'course-003',
      name: 'Pemrograman Web',
      sks: 3,
      targetGrade: TargetGrade.A,
      targetThreshold: 8000, // 80.00%
      tenantId: user1.tenantId,
      components: {
        create: [
          {
            id: 'comp-011',
            name: 'Quiz 1',
            weight: 1000, // 10.00%
            achievedScore: 6500, // 65.00%
          },
          {
            id: 'comp-012',
            name: 'Quiz 2',
            weight: 1000, // 10.00%
            achievedScore: 7000, // 70.00%
          },
          {
            id: 'comp-013',
            name: 'Tugas Mingguan',
            weight: 2000, // 20.00%
            achievedScore: null, // Not yet submitted
          },
          {
            id: 'comp-014',
            name: 'UTS',
            weight: 3000, // 30.00%
            achievedScore: null, // Not yet taken
          },
          {
            id: 'comp-015',
            name: 'UAS',
            weight: 3000, // 30.00%
            achievedScore: null, // Not yet taken
          },
        ],
      },
    },
  });
  console.log(`✓ Created course: ${course3.name} (${course3.sks} SKS) - Grade Target: ${course3.targetGrade}`);

  // Create courses for user 2
  console.log('\n📚 Creating courses for Siti Nurhaliza...');
  
  const course4 = await prisma.course.create({
    data: {
      id: 'course-004',
      name: 'Kalkulus II',
      sks: 4,
      targetGrade: TargetGrade.AB,
      targetThreshold: 7500, // 75.00%
      tenantId: user2.tenantId,
      components: {
        create: [
          {
            id: 'comp-016',
            name: 'Quiz 1',
            weight: 1500, // 15.00%
            achievedScore: 8000, // 80.00%
          },
          {
            id: 'comp-017',
            name: 'Quiz 2',
            weight: 1500, // 15.00%
            achievedScore: 7800, // 78.00%
          },
          {
            id: 'comp-018',
            name: 'Tugas',
            weight: 2000, // 20.00%
            achievedScore: 8500, // 85.00%
          },
          {
            id: 'comp-019',
            name: 'UTS',
            weight: 2500, // 25.00%
            achievedScore: 7200, // 72.00%
          },
          {
            id: 'comp-020',
            name: 'UAS',
            weight: 2500, // 25.00%
            achievedScore: null, // Not yet taken
          },
        ],
      },
    },
  });
  console.log(`✓ Created course: ${course4.name} (${course4.sks} SKS) - Grade Target: ${course4.targetGrade}`);

  // Create sample notifications
  console.log('\n🔔 Creating sample notifications...');
  
  await prisma.notification.create({
    data: {
      courseId: course2.id,
      tenantId: user1.tenantId,
      alertLevel: AlertLevel.WARNING,
      message: 'Basis Data requires 92.00% on remaining components to achieve grade A',
      isRead: false,
    },
  });
  console.log('✓ Created WARNING notification for Basis Data');

  await prisma.notification.create({
    data: {
      courseId: course3.id,
      tenantId: user1.tenantId,
      alertLevel: AlertLevel.DANGER,
      message: 'Pemrograman Web requires 95.00% on remaining components - HIGH RISK',
      isRead: false,
    },
  });
  console.log('✓ Created DANGER notification for Pemrograman Web');

  await prisma.notification.create({
    data: {
      courseId: course4.id,
      tenantId: user2.tenantId,
      alertLevel: AlertLevel.WARNING,
      message: 'Kalkulus II requires 88.00% on UAS to achieve grade AB',
      isRead: true,
    },
  });
  console.log('✓ Created WARNING notification for Kalkulus II');

  // Display seed summary
  console.log('\n📊 Seed Summary:');
  console.log('═══════════════════════════════════════════════════════════');
  
  const userCount = await prisma.user.count();
  const courseCount = await prisma.course.count();
  const componentCount = await prisma.component.count();
  const notificationCount = await prisma.notification.count();
  
  console.log(`Users created:         ${userCount}`);
  console.log(`Courses created:       ${courseCount}`);
  console.log(`Components created:    ${componentCount}`);
  console.log(`Notifications created: ${notificationCount}`);
  console.log('═══════════════════════════════════════════════════════════');
  
  // Verify integer storage format
  console.log('\n✓ Integer Storage Verification:');
  const sampleComponent = await prisma.component.findFirst({
    where: { id: 'comp-001' },
  });
  console.log(`  Component: ${sampleComponent?.name}`);
  console.log(`  Weight (DB):         ${sampleComponent?.weight} (represents ${(sampleComponent?.weight ?? 0) / 100}%)`);
  console.log(`  Achieved Score (DB): ${sampleComponent?.achievedScore} (represents ${(sampleComponent?.achievedScore ?? 0) / 100}%)`);
  
  console.log('\n🎉 Database seed completed successfully!\n');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:');
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

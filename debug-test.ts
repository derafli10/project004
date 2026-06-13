import { PrismaClient } from "@prisma/client";
import { updateComponentScore } from "./lib/actions/component";
import * as serverContext from "./lib/server-context";

// Mock the getTenantIdFromRequest
// @ts-ignore
serverContext.getTenantIdFromRequest = async () => "test-tenant-id";

async function main() {
  const prisma = new PrismaClient();
  
  await prisma.user.upsert({
    where: { tenantId: "test-tenant-id" },
    update: {},
    create: {
      email: "course-detail-test@example.com",
      name: "Test User",
      tenantId: "test-tenant-id",
    }
  });

  await prisma.component.deleteMany({
    where: { course: { tenantId: "test-tenant-id" } }
  });
  await prisma.course.deleteMany({
    where: { tenantId: "test-tenant-id" }
  });

  const course = await prisma.course.create({
    data: {
      name: "Real-time Test Course",
      sks: 3,
      targetGrade: "A",
      targetThreshold: 8000,
      tenantId: "test-tenant-id",
      components: {
        create: [
          { name: "Quiz", weight: 3000, achievedScore: null },
          { name: "Midterm", weight: 3000, achievedScore: null },
          { name: "Final Exam", weight: 4000, achievedScore: null },
        ]
      }
    },
    include: { components: true }
  });

  const components = course.components;
  const quizId = components.find(c => c.name === "Quiz")!.id;
  const midtermId = components.find(c => c.name === "Midterm")!.id;

  const result1 = await updateComponentScore({ componentId: quizId, achievedScore: 9000 });
  console.log("Result 1:", result1);

  const result2 = await updateComponentScore({ componentId: midtermId, achievedScore: 4000 });
  console.log("Result 2:", result2);
}

main().catch(console.error);

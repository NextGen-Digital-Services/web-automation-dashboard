import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export async function updateUserAnalytics(userId: string) {
  try {
    const totalUrls = await prisma.uRLSubmission.count({ where: { userId } });
    const successfulUrls = await prisma.uRLSubmission.count({ where: { userId, status: "success" } });
    const failedUrls = await prisma.uRLSubmission.count({ where: { userId, status: "failed" } });
    const successRate = totalUrls > 0 
      ? Math.min(100, Math.round((successfulUrls / (successfulUrls + failedUrls || 1)) * 100))
      : 0;

    await prisma.analytics.upsert({
      where: { userId },
      update: {
        totalUrls,
        successfulUrls,
        failedUrls,
        successRate,
        lastUpdated: new Date(),
      },
      create: {
        userId,
        totalUrls,
        successfulUrls,
        failedUrls,
        successRate,
      },
    });
  } catch (error) {
    console.error("Failed to update user analytics:", error);
  }
}

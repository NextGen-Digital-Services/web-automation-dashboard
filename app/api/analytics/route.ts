import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as { id: string }).id;

    // Retrieve or dynamically calculate/cache the user's Analytics row in PostgreSQL
    let analytics = await prisma.analytics.findUnique({
      where: { userId },
    });

    if (!analytics) {
      const totalUrls = await prisma.uRLSubmission.count({ where: { userId } });
      const successfulUrls = await prisma.uRLSubmission.count({ where: { userId, status: "success" } });
      const failedUrls = await prisma.uRLSubmission.count({ where: { userId, status: "failed" } });
      const successRate = totalUrls > 0 
        ? Math.round((successfulUrls / (successfulUrls + failedUrls || 1)) * 100) 
        : 0;

      analytics = await prisma.analytics.create({
        data: {
          userId,
          totalUrls,
          successfulUrls,
          failedUrls,
          successRate,
        },
      });
    }

    return NextResponse.json(analytics);
  } catch (error) {
    console.error("Get analytics error:", error);
    return NextResponse.json(
      { message: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

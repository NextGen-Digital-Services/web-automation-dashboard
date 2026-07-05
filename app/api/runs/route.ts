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

    // Retrieve all runs for URL submissions owned by the authenticated user to ensure complete data isolation
    const runs = await prisma.automationRun.findMany({
      where: {
        userId,
      },
      include: {
        submission: true,
      },
      orderBy: {
        startedAt: "desc",
      },
    });

    return NextResponse.json(runs);
  } catch (error) {
    console.error("Get automation runs error:", error);
    return NextResponse.json(
      { message: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

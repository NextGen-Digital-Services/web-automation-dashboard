import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return new Response("Unauthorized", { status: 401 });
    }

    const { id } = await params;
    const userId = (session.user as { id: string }).id;

    // Retrieve the submission result and include submission to verify user identity
    const result = await prisma.submissionResult.findFirst({
      where: {
        submissionId: id,
      },
      include: {
        submission: true,
      },
    });

    if (!result) {
      return new Response("Screenshot not found", { status: 404 });
    }

    // Verify ownership
    if (result.submission.userId !== userId) {
      return new Response("Unauthorized", { status: 401 });
    }

    if (!result.screenshotPath) {
      return new Response("No screenshot available for this submission", {
        status: 404,
      });
    }

    const buffer = Buffer.from(result.screenshotPath, "base64");

    return new Response(buffer, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=86400", // Cache for 1 day
      },
    });
  } catch (error) {
    console.error("Get screenshot error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}

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
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type"); // "before" | "after"

    if (type === "before" || type === "after") {
      // Find the automation run
      const run = await prisma.automationRun.findFirst({
        where: {
          OR: [
            { id },
            { submissionId: id }
          ]
        },
      });

      if (!run) {
        return new Response("Automation run not found", { status: 404 });
      }

      // Verify ownership
      if (run.userId !== userId) {
        return new Response("Unauthorized", { status: 401 });
      }

      const screenshot = type === "before" ? run.screenshotBefore : run.screenshotAfter;
      if (!screenshot) {
        return new Response(`No ${type} screenshot available`, { status: 404 });
      }

      const buffer = Buffer.from(screenshot, "base64");
      return new Response(buffer, {
        headers: {
          "Content-Type": "image/png",
          "Cache-Control": "public, max-age=86400",
        },
      });
    }

    // Legacy fallback to submission result
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
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (error) {
    console.error("Get screenshot error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}


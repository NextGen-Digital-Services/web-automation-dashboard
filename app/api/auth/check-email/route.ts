import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

const emailCheckSchema = z.object({
  email: z.string().email(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validation = emailCheckSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ exists: false, message: "Invalid email" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: validation.data.email },
    });

    return NextResponse.json({ exists: !!user });
  } catch (error) {
    console.error("Email check error:", error);
    return NextResponse.json({ exists: false }, { status: 500 });
  }
}

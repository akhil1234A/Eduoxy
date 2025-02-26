import { clerkClient } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { userId, role } = await req.json();

    if (!userId || !role) {
      return NextResponse.json({ error: "Missing userId or role" }, { status: 400 });
    }

    const client = await clerkClient()

    // Update user's publicMetadata
    await client.users.updateUserMetadata(userId, {
      publicMetadata: { userType: role },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error updating role:", err);
    return NextResponse.json({ error: "Failed to update role" }, { status: 500 });
  }
}
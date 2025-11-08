import { NextRequest, NextResponse } from "next/server";
import { isUsernameAvailable, validateUsername } from "@/lib/username";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const username = searchParams.get("username");

  if (!username) {
    return NextResponse.json(
      { error: "Username parameter is required" },
      { status: 400 }
    );
  }

  // Validate username format
  const validation = validateUsername(username);
  if (!validation.valid) {
    return NextResponse.json(
      { available: false, error: validation.error },
      { status: 200 }
    );
  }

  // Check availability
  const available = await isUsernameAvailable(username);

  return NextResponse.json({ available });
}

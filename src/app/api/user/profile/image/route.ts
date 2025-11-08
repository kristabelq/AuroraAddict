import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import sharp from "sharp";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const imageFile = formData.get("image") as File | null;

    if (!imageFile) {
      return NextResponse.json(
        { error: "Image file is required" },
        { status: 400 }
      );
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), "public", "uploads", "profiles");
    try {
      await mkdir(uploadsDir, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }

    // Process image
    const bytes = await imageFile.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate unique filename
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(7);
    const filename = `${session.user.id}-${timestamp}-${randomStr}.jpg`;
    const filepath = join(uploadsDir, filename);

    // Process and save profile image (400x400 square crop)
    await sharp(buffer)
      .resize(400, 400, {
        fit: "cover",
        position: "center",
      })
      .jpeg({
        quality: 85,
        progressive: true,
      })
      .toFile(filepath);

    const imageUrl = `/uploads/profiles/${filename}`;

    // Update user's profile image in database
    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: { image: imageUrl },
    });

    return NextResponse.json({
      success: true,
      imageUrl,
      message: "Profile image updated successfully",
    });
  } catch (error) {
    console.error("Error uploading profile image:", error);
    return NextResponse.json(
      { error: "Failed to upload profile image" },
      { status: 500 }
    );
  }
}

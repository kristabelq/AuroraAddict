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
    // Verify user is a business with accommodation service
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        userType: true,
        businessServices: true,
        verificationStatus: true,
      },
    });

    if (user?.userType !== "business") {
      return NextResponse.json(
        { error: "Only businesses can upload room images" },
        { status: 403 }
      );
    }

    if (!user?.businessServices?.includes("accommodation")) {
      return NextResponse.json(
        { error: "Only accommodation businesses can upload room images" },
        { status: 403 }
      );
    }

    if (user?.verificationStatus !== "verified") {
      return NextResponse.json(
        { error: "Your business must be verified to upload room images" },
        { status: 403 }
      );
    }

    const formData = await req.formData();
    const imageFiles = formData.getAll("images") as File[];

    if (!imageFiles || imageFiles.length === 0) {
      return NextResponse.json(
        { error: "At least one image file is required" },
        { status: 400 }
      );
    }

    // Limit to 10 images per upload
    if (imageFiles.length > 10) {
      return NextResponse.json(
        { error: "Maximum 10 images per upload" },
        { status: 400 }
      );
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), "public", "uploads", "room-types");
    try {
      await mkdir(uploadsDir, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }

    const imageUrls: string[] = [];

    // Process each image
    for (const imageFile of imageFiles) {
      if (!imageFile.type.startsWith("image/")) {
        continue; // Skip non-image files
      }

      // Check file size (max 10MB)
      if (imageFile.size > 10 * 1024 * 1024) {
        return NextResponse.json(
          { error: "Image file size must be less than 10MB" },
          { status: 400 }
        );
      }

      const bytes = await imageFile.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Generate unique filename
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(7);
      const filename = `${session.user.id}-${timestamp}-${randomStr}.jpg`;
      const filepath = join(uploadsDir, filename);

      // Process and save room image (1200x800 landscape)
      await sharp(buffer)
        .resize(1200, 800, {
          fit: "cover",
          position: "center",
        })
        .jpeg({
          quality: 90,
          progressive: true,
        })
        .toFile(filepath);

      const imageUrl = `/uploads/room-types/${filename}`;
      imageUrls.push(imageUrl);
    }

    return NextResponse.json({
      success: true,
      imageUrls,
      message: `${imageUrls.length} image(s) uploaded successfully`,
    });
  } catch (error) {
    console.error("Error uploading room images:", error);
    return NextResponse.json(
      { error: "Failed to upload room images" },
      { status: 500 }
    );
  }
}

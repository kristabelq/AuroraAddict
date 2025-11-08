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
    // Verify user is a business
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        userType: true,
        verificationStatus: true,
      },
    });

    if (user?.userType !== "business") {
      return NextResponse.json(
        { error: "Only businesses can upload verification documents" },
        { status: 403 }
      );
    }

    // Don't allow re-upload if already verified
    if (user?.verificationStatus === "verified") {
      return NextResponse.json(
        { error: "Your business is already verified" },
        { status: 403 }
      );
    }

    const formData = await req.formData();
    const documentFile = formData.get("document") as File;
    const documentType = formData.get("type") as string; // "license" or "id"

    if (!documentFile) {
      return NextResponse.json(
        { error: "Document file is required" },
        { status: 400 }
      );
    }

    if (!["license", "id"].includes(documentType)) {
      return NextResponse.json(
        { error: "Invalid document type. Must be 'license' or 'id'" },
        { status: 400 }
      );
    }

    // Check file size (max 10MB)
    if (documentFile.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Document file size must be less than 10MB" },
        { status: 400 }
      );
    }

    // Validate file type (PDF or image)
    const validTypes = [
      "application/pdf",
      "image/jpeg",
      "image/jpg",
      "image/png",
    ];
    if (!validTypes.includes(documentFile.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only PDF, JPEG, and PNG are allowed" },
        { status: 400 }
      );
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), "public", "uploads", "verification");
    try {
      await mkdir(uploadsDir, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }

    const bytes = await documentFile.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate unique filename
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(7);
    const ext = documentFile.type === "application/pdf" ? "pdf" : "jpg";
    const filename = `${session.user.id}-${documentType}-${timestamp}-${randomStr}.${ext}`;
    const filepath = join(uploadsDir, filename);

    // If it's an image, optimize it; if PDF, save directly
    if (documentFile.type.startsWith("image/")) {
      await sharp(buffer)
        .resize(1600, 1600, {
          fit: "inside",
          withoutEnlargement: true,
        })
        .jpeg({
          quality: 85,
          progressive: true,
        })
        .toFile(filepath);
    } else {
      // Save PDF directly
      await writeFile(filepath, buffer);
    }

    const documentUrl = `/uploads/verification/${filename}`;

    return NextResponse.json({
      success: true,
      documentUrl,
      documentType,
      message: "Document uploaded successfully",
    });
  } catch (error) {
    console.error("Error uploading verification document:", error);
    return NextResponse.json(
      { error: "Failed to upload document" },
      { status: 500 }
    );
  }
}

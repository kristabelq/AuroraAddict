import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

/**
 * POST /api/user/business-verification/upload
 *
 * Upload business verification documents
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const businessLicense = formData.get('businessLicense') as File | null;
    const idDocument = formData.get('idDocument') as File | null;

    if (!businessLicense || !idDocument) {
      return NextResponse.json(
        { error: 'Both business license and ID document are required' },
        { status: 400 }
      );
    }

    // Validate file types
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];

    if (!allowedTypes.includes(businessLicense.type)) {
      return NextResponse.json(
        { error: 'Business license must be a JPG, PNG, or PDF file' },
        { status: 400 }
      );
    }

    if (!allowedTypes.includes(idDocument.type)) {
      return NextResponse.json(
        { error: 'ID document must be a JPG, PNG, or PDF file' },
        { status: 400 }
      );
    }

    // Validate file sizes (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (businessLicense.size > maxSize) {
      return NextResponse.json(
        { error: 'Business license file size must be less than 10MB' },
        { status: 400 }
      );
    }

    if (idDocument.size > maxSize) {
      return NextResponse.json(
        { error: 'ID document file size must be less than 10MB' },
        { status: 400 }
      );
    }

    // Create upload directory
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'business-verifications', session.user.id);
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Generate unique filenames
    const timestamp = Date.now();
    const businessLicenseExt = businessLicense.name.split('.').pop();
    const idDocumentExt = idDocument.name.split('.').pop();

    const businessLicenseFilename = `business-license-${timestamp}.${businessLicenseExt}`;
    const idDocumentFilename = `id-document-${timestamp}.${idDocumentExt}`;

    // Save business license
    const businessLicenseBuffer = Buffer.from(await businessLicense.arrayBuffer());
    const businessLicensePath = join(uploadDir, businessLicenseFilename);
    await writeFile(businessLicensePath, businessLicenseBuffer);

    // Save ID document
    const idDocumentBuffer = Buffer.from(await idDocument.arrayBuffer());
    const idDocumentPath = join(uploadDir, idDocumentFilename);
    await writeFile(idDocumentPath, idDocumentBuffer);

    // Return URLs
    const businessLicenseUrl = `/uploads/business-verifications/${session.user.id}/${businessLicenseFilename}`;
    const idDocumentUrl = `/uploads/business-verifications/${session.user.id}/${idDocumentFilename}`;

    return NextResponse.json({
      businessLicenseUrl,
      idDocumentUrl,
    });
  } catch (error) {
    console.error('Error uploading verification documents:', error);
    return NextResponse.json(
      { error: 'Failed to upload documents' },
      { status: 500 }
    );
  }
}

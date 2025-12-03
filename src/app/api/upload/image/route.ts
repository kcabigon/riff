import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

// POST /api/upload/image - Upload image file
export async function POST(req: Request) {
  try {
    // TODO: Re-enable auth in production
    // await requireAuth();

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed" },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File size too large. Maximum size is 5MB" },
        { status: 400 }
      );
    }

    // Generate unique filename
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const fileExtension = file.name.split(".").pop();
    const filename = `${randomUUID()}.${fileExtension}`;
    const filepath = path.join(process.cwd(), "public/uploads/images", filename);

    // Write file to disk
    await writeFile(filepath, buffer);

    // Return public URL
    const url = `/uploads/images/${filename}`;

    return NextResponse.json({
      success: true,
      url,
    });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.error("Error uploading image:", error);
    return NextResponse.json(
      { error: "An error occurred while uploading the image" },
      { status: 500 }
    );
  }
}

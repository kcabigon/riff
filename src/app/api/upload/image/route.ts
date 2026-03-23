import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import convert from "heic-convert";

// POST /api/upload/image - Upload image file
export async function POST(req: Request) {
  try {
    await requireAuth();

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
      "image/heic",
      "image/heif",
    ];
    const ext = (file.name.split(".").pop() || "").toLowerCase();
    const isHeic =
      file.type === "image/heic" ||
      file.type === "image/heif" ||
      ext === "heic" ||
      ext === "heif";

    if (!allowedTypes.includes(file.type) && !isHeic) {
      return NextResponse.json(
        {
          error:
            "Invalid file type. Only JPEG, PNG, GIF, WebP, and HEIC are allowed",
        },
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
    let buffer = Buffer.from(bytes);

    // Convert HEIC/HEIF to JPEG since browsers can't display them
    let fileExtension = ext;
    if (isHeic) {
      const converted = await convert({
        buffer: buffer.buffer as ArrayBuffer,
        format: "JPEG",
        quality: 0.92,
      });
      buffer = Buffer.from(converted);
      fileExtension = "jpg";
    }

    const filename = `${randomUUID()}.${fileExtension}`;
    const filepath = path.join(
      process.cwd(),
      "public/uploads/images",
      filename
    );

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

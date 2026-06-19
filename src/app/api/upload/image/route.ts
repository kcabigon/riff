import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { getSupabaseAdmin } from "@/lib/supabase";
import { randomUUID } from "crypto";

const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
};

const MAX_SIZE = 10 * 1024 * 1024; // 10MB

// POST /api/upload/image
// Body: { contentType: string, size: number }
// Returns: { signedUrl: string, publicUrl: string }
// The client uploads the file directly to Supabase using the signed URL.
export async function POST(req: Request) {
  try {
    await requireAuth();

    const body = await req.json();
    const { contentType, size } = body as {
      contentType?: string;
      size?: number;
    };

    if (!contentType || size === undefined) {
      return NextResponse.json(
        { error: "contentType and size are required" },
        { status: 400 }
      );
    }

    const ext = ALLOWED_TYPES[contentType];
    if (!ext) {
      return NextResponse.json(
        {
          error: "Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed",
        },
        { status: 400 }
      );
    }

    if (size > MAX_SIZE) {
      return NextResponse.json(
        { error: "File size too large. Maximum size is 10MB" },
        { status: 400 }
      );
    }

    const filename = `${randomUUID()}.${ext}`;
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase.storage
      .from("images")
      .createSignedUploadUrl(filename);

    if (error || !data) {
      console.error("Supabase signed URL error:", error);
      return NextResponse.json(
        { error: "Failed to create upload URL" },
        { status: 500 }
      );
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("images").getPublicUrl(filename);

    return NextResponse.json({ signedUrl: data.signedUrl, publicUrl });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error creating upload URL:", error);
    return NextResponse.json({ error: "An error occurred" }, { status: 500 });
  }
}

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
]);

const MAX_SIZE = 10 * 1024 * 1024; // 10MB

// Uploads a file or blob directly to Supabase Storage via a server-issued
// signed URL, bypassing Vercel's 4.5MB serverless body limit.
export async function uploadImage(
  file: File | Blob,
  contentType?: string
): Promise<string> {
  const type = contentType ?? file.type;
  const size = file.size;

  if (!ALLOWED_TYPES.has(type)) {
    throw new Error(
      "Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed"
    );
  }

  if (size > MAX_SIZE) {
    throw new Error("File too large — max 10MB");
  }

  // Step 1: get a signed upload URL from the server (no file bytes sent)
  const res = await fetch("/api/upload/image", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contentType: type, size }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(
      (data as { error?: string }).error ?? "Failed to get upload URL"
    );
  }

  const { signedUrl, publicUrl } = (await res.json()) as {
    signedUrl: string;
    publicUrl: string;
  };

  // Step 2: upload the file directly to Supabase — never touches Vercel
  const uploadRes = await fetch(signedUrl, {
    method: "PUT",
    headers: { "Content-Type": type },
    body: file,
  });

  if (!uploadRes.ok) {
    throw new Error("Failed to upload image");
  }

  return publicUrl;
}

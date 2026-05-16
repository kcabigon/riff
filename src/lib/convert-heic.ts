// Dynamically import heic2any to avoid "window is not defined" during SSR
const getHeic2any = () => import("heic2any").then((m) => m.default);

/**
 * Checks if a File is HEIC/HEIF based on extension or MIME type.
 */
export function isHeicFile(file: File): boolean {
  const ext = file.name.split(".").pop()?.toLowerCase();
  return (
    file.type === "image/heic" ||
    file.type === "image/heif" ||
    ext === "heic" ||
    ext === "heif"
  );
}

/**
 * Converts a HEIC/HEIF File to a JPEG File in the browser.
 * Returns the original file unchanged if it's not HEIC.
 */
export async function convertHeicToJpeg(file: File): Promise<File> {
  if (!isHeicFile(file)) return file;

  const heic2any = await getHeic2any();
  const blob = await heic2any({
    blob: file,
    toType: "image/jpeg",
    quality: 0.92,
  });

  const jpegBlob = Array.isArray(blob) ? blob[0] : blob;
  const newName = file.name
    .replace(/\.heic$/i, ".jpg")
    .replace(/\.heif$/i, ".jpg");
  return new File([jpegBlob], newName, { type: "image/jpeg" });
}

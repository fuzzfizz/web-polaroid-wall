import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

const MIME_TYPES = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
  svg: "image/svg+xml",
  ico: "image/x-icon",
};

export async function GET(request, { params }) {
  try {
    const { filename } = await params;

    // Sanitize filename to prevent directory traversal
    const safeFilename = path.basename(filename);
    const filepath = path.join(process.cwd(), "public", "uploads", safeFilename);

    if (!existsSync(filepath)) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const fileBuffer = await readFile(filepath);
    const ext = safeFilename.split(".").pop()?.toLowerCase() || "";
    const contentType = MIME_TYPES[ext] || "application/octet-stream";

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("GET /uploads/[filename] error:", error);
    return NextResponse.json({ error: "Failed to read file" }, { status: 500 });
  }
}

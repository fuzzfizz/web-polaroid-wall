import { cookies } from "next/headers";
import crypto from "crypto";

export async function getOrCreateVisitorId() {
  const cookieStore = await cookies();
  let visitorId = cookieStore.get("polaroid_visitor_id")?.value;

  if (!visitorId) {
    visitorId = crypto.randomUUID();
    try {
      cookieStore.set("polaroid_visitor_id", visitorId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 365, // 1 year
        path: "/",
      });
    } catch (err) {
      // In some read-only contexts, cookieStore.set may throw; catch gracefully
      console.warn("Could not set visitor cookie:", err);
    }
  }

  return visitorId;
}

import { query } from "@/lib/db";
import { getOrCreateVisitorId } from "@/lib/visitor";
import { NextResponse } from "next/server";

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const action = body.action || "toggle"; // "like" | "unlike" | "toggle"
    const visitorId = await getOrCreateVisitorId();

    // Check if user has already liked this card
    const existing = await query(
      "SELECT id FROM card_likes WHERE card_id = $1 AND visitor_id = $2",
      [id, visitorId]
    );
    const hasLiked = existing.rows.length > 0;

    let willBeLiked = hasLiked;

    if (action === "unlike" || (action === "toggle" && hasLiked)) {
      // Remove like from database
      await query(
        "DELETE FROM card_likes WHERE card_id = $1 AND visitor_id = $2",
        [id, visitorId]
      );
      willBeLiked = false;
    } else {
      // Insert like (ON CONFLICT prevents duplicate likes from the same visitor)
      await query(
        "INSERT INTO card_likes (card_id, visitor_id) VALUES ($1, $2) ON CONFLICT (card_id, visitor_id) DO NOTHING",
        [id, visitorId]
      );
      willBeLiked = true;
    }

    // Recalculate true likes count from card_likes table
    const updateResult = await query(
      `UPDATE cards 
       SET likes = (SELECT COUNT(*) FROM card_likes WHERE card_id = $1)
       WHERE id = $1 
       RETURNING *`,
      [id]
    );

    if (updateResult.rows.length === 0) {
      return NextResponse.json({ error: "Card not found" }, { status: 404 });
    }

    const updatedCard = {
      ...updateResult.rows[0],
      is_liked_by_me: willBeLiked,
    };

    return NextResponse.json(updatedCard);
  } catch (error) {
    console.error("POST /api/wall/[id]/like error:", error);
    return NextResponse.json({ error: "Failed to update like status" }, { status: 500 });
  }
}

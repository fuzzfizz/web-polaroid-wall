import { query } from "@/lib/db";
import { getOrCreateVisitorId } from "@/lib/visitor";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const visitorId = await getOrCreateVisitorId();
    const result = await query(
      `SELECT 
         c.*,
         EXISTS(
           SELECT 1 FROM card_likes cl 
           WHERE cl.card_id = c.id AND cl.visitor_id = $1
         ) AS is_liked_by_me
       FROM cards c
       ORDER BY c.created_at DESC`,
      [visitorId]
    );
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("GET /api/wall error:", error);
    return NextResponse.json({ error: "Failed to fetch cards" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { team_name, member1_name, member1_student_id, member2_name, member2_student_id, message, photo_url } = body;

    if (!team_name?.trim() || !member1_name?.trim() || !member1_student_id?.trim()) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const m2Name = member2_name?.trim() || "";
    const m2StudentId = member2_student_id?.trim() || "";

    const result = await query(
      `INSERT INTO cards (team_name, member1_name, member1_student_id, member2_name, member2_student_id, message, photo_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *, false AS is_liked_by_me`,
      [team_name.trim(), member1_name.trim(), member1_student_id.trim(), m2Name, m2StudentId, message?.trim() || "", photo_url || ""]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error("POST /api/wall error:", error);
    return NextResponse.json({ error: "Failed to create card" }, { status: 500 });
  }
}

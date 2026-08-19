import { query } from "@/lib/db";
import { NextResponse } from "next/server";

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { team_name, member1_name, member1_student_id, member2_name, member2_student_id, message, photo_url } = body;

    const result = await query(
      `UPDATE cards
       SET team_name = $1, member1_name = $2, member1_student_id = $3,
           member2_name = $4, member2_student_id = $5, message = $6,
           photo_url = COALESCE($7, photo_url), updated_at = CURRENT_TIMESTAMP
       WHERE id = $8
       RETURNING *`,
      [team_name, member1_name, member1_student_id, member2_name, member2_student_id, message, photo_url, id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Card not found" }, { status: 404 });
    }
    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error("PUT /api/wall/[id] error:", error);
    return NextResponse.json({ error: "Failed to update card" }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const result = await query("DELETE FROM cards WHERE id = $1 RETURNING *", [id]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Card not found" }, { status: 404 });
    }
    return NextResponse.json({ message: "Card deleted" });
  } catch (error) {
    console.error("DELETE /api/wall/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete card" }, { status: 500 });
  }
}

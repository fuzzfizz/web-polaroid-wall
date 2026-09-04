import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

function validateCardPayload(body) {
  const { team_name, member1_name, member1_student_id } = body;
  if (!team_name?.trim() || !member1_name?.trim() || !member1_student_id?.trim()) {
    return { valid: false, error: "Missing required fields" };
  }
  return {
    valid: true,
    data: {
      team_name: team_name.trim(),
      member1_name: member1_name.trim(),
      member1_student_id: member1_student_id.trim(),
      member2_name: body.member2_name?.trim() || "",
      member2_student_id: body.member2_student_id?.trim() || "",
      message: body.message?.trim() || "",
      photo_url: body.photo_url || ""
    }
  };
}

test("validateCardPayload accepts 1 person card without member 2", () => {
  const result = validateCardPayload({
    team_name: "Team Solo",
    member1_name: "Alice",
    member1_student_id: "64010001",
  });
  assert.equal(result.valid, true);
  assert.equal(result.data.member2_name, "");
  assert.equal(result.data.member2_student_id, "");
});

test("validateCardPayload accepts 2 person card with member 2", () => {
  const result = validateCardPayload({
    team_name: "Team Duo",
    member1_name: "Alice",
    member1_student_id: "64010001",
    member2_name: "Bob",
    member2_student_id: "64010002",
  });
  assert.equal(result.valid, true);
  assert.equal(result.data.member2_name, "Bob");
  assert.equal(result.data.member2_student_id, "64010002");
});

test("validateCardPayload rejects when member 1 or team name is missing", () => {
  assert.equal(validateCardPayload({ team_name: "", member1_name: "A", member1_student_id: "1" }).valid, false);
  assert.equal(validateCardPayload({ team_name: "   ", member1_name: "A", member1_student_id: "1" }).valid, false);
  assert.equal(validateCardPayload({ team_name: "T", member1_name: "", member1_student_id: "1" }).valid, false);
  assert.equal(validateCardPayload({ team_name: "T", member1_name: "   ", member1_student_id: "1" }).valid, false);
  assert.equal(validateCardPayload({ team_name: "T", member1_name: "A", member1_student_id: "" }).valid, false);
  assert.equal(validateCardPayload({ team_name: "T", member1_name: "A", member1_student_id: "   " }).valid, false);
});

test("POST /api/wall route source validates only team_name, member1_name, member1_student_id and defaults member2", () => {
  const routeContent = fs.readFileSync("src/app/api/wall/route.js", "utf-8");
  // Ensure member2 is not in the required fields check
  assert.doesNotMatch(routeContent, /!member2_name/);
  assert.doesNotMatch(routeContent, /!member2_student_id/);
  // Ensure required check trims team_name, member1_name, member1_student_id
  assert.match(routeContent, /!team_name\?\.trim\(\)\s*\|\|\s*!member1_name\?\.trim\(\)\s*\|\|\s*!member1_student_id\?\.trim\(\)/);
  // Ensure member2 defaults to empty string
  assert.match(routeContent, /m2Name\s*=\s*member2_name\?\.trim\(\)\s*\|\|\s*""/);
  assert.match(routeContent, /m2StudentId\s*=\s*member2_student_id\?\.trim\(\)\s*\|\|\s*""/);
});

test("PUT /api/wall/[id] route source validates required fields and defaults member2", () => {
  const routeContent = fs.readFileSync("src/app/api/wall/[id]/route.js", "utf-8");
  // Ensure required check trims team_name, member1_name, member1_student_id
  assert.match(routeContent, /!team_name\?\.trim\(\)\s*\|\|\s*!member1_name\?\.trim\(\)\s*\|\|\s*!member1_student_id\?\.trim\(\)/);
  // Ensure member2 defaults to empty string
  assert.match(routeContent, /m2Name\s*=\s*member2_name\?\.trim\(\)\s*\|\|\s*""/);
  assert.match(routeContent, /m2StudentId\s*=\s*member2_student_id\?\.trim\(\)\s*\|\|\s*""/);
});

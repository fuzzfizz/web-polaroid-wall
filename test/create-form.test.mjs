import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

// Helper simulating CreateForm payload sanitization logic
function sanitizeFormPayload(formData, memberCount, finalPhotoUrl = "") {
  return {
    ...formData,
    member2_name: memberCount === 2 ? formData.member2_name : "",
    member2_student_id: memberCount === 2 ? formData.member2_student_id : "",
    photo_url: finalPhotoUrl || "",
  };
}

// Helper simulating CreateForm editing detection logic
function detectMemberCount(editingCard) {
  if (!editingCard) return 2;
  const hasMember2 = Boolean(editingCard.member2_name && editingCard.member2_name.trim());
  return hasMember2 ? 2 : 1;
}

test("detectMemberCount correctly detects 1 or 2 members from editingCard", () => {
  assert.equal(detectMemberCount(null), 2);
  assert.equal(detectMemberCount({ member2_name: "" }), 1);
  assert.equal(detectMemberCount({ member2_name: "   " }), 1);
  assert.equal(detectMemberCount({ member2_name: null }), 1);
  assert.equal(detectMemberCount({ member2_name: undefined }), 1);
  assert.equal(detectMemberCount({ member2_name: "Bob" }), 2);
  assert.equal(detectMemberCount({ member2_name: "  Charlie  " }), 2);
});

test("sanitizeFormPayload blanks member 2 when memberCount is 1", () => {
  const formData = {
    team_name: "Solo Team",
    member1_name: "Alice",
    member1_student_id: "64010001",
    member2_name: "Leftover Bob",
    member2_student_id: "64010002",
    message: "Hello world",
  };
  const payload = sanitizeFormPayload(formData, 1, "https://example.com/img.jpg");
  assert.equal(payload.member2_name, "");
  assert.equal(payload.member2_student_id, "");
  assert.equal(payload.member1_name, "Alice");
  assert.equal(payload.photo_url, "https://example.com/img.jpg");
});

test("sanitizeFormPayload preserves member 2 when memberCount is 2", () => {
  const formData = {
    team_name: "Duo Team",
    member1_name: "Alice",
    member1_student_id: "64010001",
    member2_name: "Bob",
    member2_student_id: "64010002",
    message: "Duo rocks",
  };
  const payload = sanitizeFormPayload(formData, 2);
  assert.equal(payload.member2_name, "Bob");
  assert.equal(payload.member2_student_id, "64010002");
});

test("src/components/CreateForm.js implements 1 or 2 member toggle and conditional rendering", () => {
  const source = fs.readFileSync("src/components/CreateForm.js", "utf-8");

  // Imports User and Users icons
  assert.match(source, /User,\s*Users|Users,\s*User/);

  // Defines memberCount state defaulting to 2
  assert.match(source, /const\s*\[memberCount,\s*setMemberCount\]\s*=\s*useState\(2\)/);

  // Detects memberCount from editingCard
  assert.match(source, /hasMember2\s*=\s*Boolean\(editingCard\.member2_name\s*&&\s*editingCard\.member2_name\.trim\(\)\)/);
  assert.match(source, /setMemberCount\(hasMember2\s*\?\s*2\s*:\s*1\)/);

  // Renders Member Type toggle UI
  assert.match(source, /Member Type \/ จำนวนสมาชิก/);
  assert.match(source, /1 Person \(เดี่ยว\)/);
  assert.match(source, /2 People \(คู่\)/);

  // Dynamic Member 1 label
  assert.match(source, /memberCount\s*===\s*1\s*\?\s*["']Member Name \*["']\s*:\s*["']Member 1 Name \*["']/);

  // Conditionally renders Member 2 inputs only when memberCount === 2
  assert.match(source, /\{memberCount\s*===\s*2\s*&&\s*\(/);
  assert.match(source, /animate-fadeIn/);

  // Sanitizes payload in handleSubmit
  assert.match(source, /member2_name:\s*memberCount\s*===\s*2\s*\?\s*formData\.member2_name\s*:\s*["']/);
  assert.match(source, /member2_student_id:\s*memberCount\s*===\s*2\s*\?\s*formData\.member2_student_id\s*:\s*["']/);

  // Resets memberCount in resetForm
  assert.match(source, /setMemberCount\(2\)/);
});

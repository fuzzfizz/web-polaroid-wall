import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

// Helper testing hasMember2 detection logic
function checkHasMember2(card) {
  return Boolean(card.member2_name && card.member2_name.trim());
}

test("checkHasMember2 returns false for empty, whitespace, or missing member2_name", () => {
  assert.equal(checkHasMember2({ member2_name: "" }), false);
  assert.equal(checkHasMember2({ member2_name: "   " }), false);
  assert.equal(checkHasMember2({ member2_name: null }), false);
  assert.equal(checkHasMember2({ member2_name: undefined }), false);
  assert.equal(checkHasMember2({}), false);
});

test("checkHasMember2 returns true for valid member2_name", () => {
  assert.equal(checkHasMember2({ member2_name: "Bob" }), true);
  assert.equal(checkHasMember2({ member2_name: "  Somchai  " }), true);
});

test("src/components/PolaroidCard.js adapts layout for single or dual members", () => {
  const source = fs.readFileSync("src/components/PolaroidCard.js", "utf-8");

  // Imports User and Users from lucide-react
  assert.match(source, /import\s*\{[^}]*\bUser\b[^}]*\}\s*from\s*["']lucide-react["']/);
  assert.match(source, /import\s*\{[^}]*\bUsers\b[^}]*\}\s*from\s*["']lucide-react["']/);

  // Computes hasMember2
  assert.match(source, /const\s+hasMember2\s*=\s*Boolean\(card\.member2_name\s*&&\s*card\.member2_name\.trim\(\)\);/);

  // Header adapts based on hasMember2
  assert.match(source, /hasMember2\s*\?\s*<Users[^>]*\/>\s*:\s*<User[^>]*\/>/);
  assert.match(source, /hasMember2\s*\?\s*["']Team Members["']\s*:\s*["']Member["']/);

  // Conditional rendering of Member 2
  assert.match(source, /\{hasMember2\s*&&\s*\(/);
  assert.match(source, /card\.member2_name/);
  assert.match(source, /card\.member2_student_id/);
});

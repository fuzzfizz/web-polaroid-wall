# Single or Dual Member Card (1 หรือ 2 คน) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow users to choose between creating/editing a polaroid card with 1 person or 2 people, adjusting the form inputs, API validations, database constraints, and card display accordingly.

**Architecture:** Update PostgreSQL schema to make Member 2 columns optional with empty string defaults; update API route handlers to validate only Team Name and Member 1 as mandatory; add a toggle switch in `CreateForm` to hide/show Member 2 fields and normalize payload; update `PolaroidCard` flip view to cleanly display single or dual members.

**Tech Stack:** Next.js 16 (App Router), React 19, Tailwind CSS v4, Lucide React, PostgreSQL (`pg`), Node.js test runner (`node:test`).

## Global Constraints

- Preserve existing database cards and backward compatibility.
- Form must allow switching between 1 and 2 members.
- Member 1 Name, Member 1 Student ID, and Team Name are always required.
- Member 2 Name and Student ID are only required when in 2-person mode.
- Next.js must build cleanly (`npm run build`).

---

### Task 1: Database Schema & Migration

**Files:**
- Modify: `init.sql:1-13`
- Modify: `src/lib/db.js:13-46`
- Test: `test/db-migration.test.mjs`

**Interfaces:**
- Consumes: PostgreSQL connection pool from `src/lib/db.js`
- Produces: `cards` table schema where `member2_name` and `member2_student_id` are nullable with `DEFAULT ''`

- [ ] **Step 1: Write the test for schema migration SQL**

Create `test/db-migration.test.mjs`:
```javascript
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("init.sql should have default '' and not strictly NOT NULL for member2", () => {
  const initSql = fs.readFileSync("init.sql", "utf-8");
  assert.match(initSql, /member2_name VARCHAR\(100\) DEFAULT ''/);
  assert.match(initSql, /member2_student_id VARCHAR\(20\) DEFAULT ''/);
});

test("src/lib/db.js should contain migration to drop NOT NULL from member2 columns", () => {
  const dbJs = fs.readFileSync("src/lib/db.js", "utf-8");
  assert.match(dbJs, /ALTER COLUMN member2_name DROP NOT NULL/);
  assert.match(dbJs, /ALTER COLUMN member2_student_id DROP NOT NULL/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test test/db-migration.test.mjs`
Expected: FAIL (assertion errors on missing regex matches)

- [ ] **Step 3: Update `init.sql` and `src/lib/db.js`**

Update `init.sql`:
```sql
CREATE TABLE IF NOT EXISTS cards (
  id SERIAL PRIMARY KEY,
  team_name VARCHAR(100) NOT NULL,
  member1_name VARCHAR(100) NOT NULL,
  member1_student_id VARCHAR(20) NOT NULL,
  member2_name VARCHAR(100) DEFAULT '',
  member2_student_id VARCHAR(20) DEFAULT '',
  message TEXT DEFAULT '',
  photo_url VARCHAR(500) DEFAULT '',
  likes INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS card_likes (
  id SERIAL PRIMARY KEY,
  card_id INTEGER NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  visitor_id VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(card_id, visitor_id)
);

CREATE INDEX IF NOT EXISTS idx_card_likes_card_id ON card_likes(card_id);
CREATE INDEX IF NOT EXISTS idx_card_likes_visitor ON card_likes(visitor_id);
```

Update `src/lib/db.js` `ensureTables()`:
```javascript
async function ensureTables() {
  if (isInitialized) return;
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS cards (
        id SERIAL PRIMARY KEY,
        team_name VARCHAR(100) NOT NULL,
        member1_name VARCHAR(100) NOT NULL,
        member1_student_id VARCHAR(20) NOT NULL,
        member2_name VARCHAR(100) DEFAULT '',
        member2_student_id VARCHAR(20) DEFAULT '',
        message TEXT DEFAULT '',
        photo_url VARCHAR(500) DEFAULT '',
        likes INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS card_likes (
        id SERIAL PRIMARY KEY,
        card_id INTEGER NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
        visitor_id VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(card_id, visitor_id)
      );

      CREATE INDEX IF NOT EXISTS idx_card_likes_card_id ON card_likes(card_id);
      CREATE INDEX IF NOT EXISTS idx_card_likes_visitor ON card_likes(visitor_id);

      DO $$
      BEGIN
        ALTER TABLE cards ALTER COLUMN member2_name DROP NOT NULL;
        ALTER TABLE cards ALTER COLUMN member2_student_id DROP NOT NULL;
        ALTER TABLE cards ALTER COLUMN member2_name SET DEFAULT '';
        ALTER TABLE cards ALTER COLUMN member2_student_id SET DEFAULT '';
      EXCEPTION
        WHEN undefined_column THEN NULL;
        WHEN others THEN NULL;
      END $$;
    `);
    isInitialized = true;
  } catch (err) {
    console.error("Database table initialization error:", err);
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test test/db-migration.test.mjs`
Expected: PASS

- [ ] **Step 5: Commit**

Run:
```bash
git add init.sql src/lib/db.js test/db-migration.test.mjs
git commit -m "feat(db): make member 2 columns optional with auto-migration"
```

---

### Task 2: API Route Validation & Normalization

**Files:**
- Modify: `src/app/api/wall/route.js:26-47`
- Modify: `src/app/api/wall/[id]/route.js:4-28`
- Test: `test/api-wall-validation.test.mjs`

**Interfaces:**
- Consumes: JSON body with `{ team_name, member1_name, member1_student_id, member2_name?, member2_student_id?, message?, photo_url? }`
- Produces: 201 JSON response on POST or 200 on PUT, 400 on missing required fields (only team_name, member1_name, member1_student_id)

- [ ] **Step 1: Write test for API payload validation rules**

Create `test/api-wall-validation.test.mjs`:
```javascript
import { test } from "node:test";
import assert from "node:assert/strict";

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
  assert.equal(validateCardPayload({ team_name: "T", member1_name: "", member1_student_id: "1" }).valid, false);
  assert.equal(validateCardPayload({ team_name: "T", member1_name: "A", member1_student_id: "" }).valid, false);
});
```

- [ ] **Step 2: Run test to verify it passes**

Run: `node --test test/api-wall-validation.test.mjs`
Expected: PASS

- [ ] **Step 3: Update `src/app/api/wall/route.js` and `src/app/api/wall/[id]/route.js`**

Update `POST` in `src/app/api/wall/route.js`:
```javascript
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
```

Update `PUT` in `src/app/api/wall/[id]/route.js`:
```javascript
export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { team_name, member1_name, member1_student_id, member2_name, member2_student_id, message, photo_url } = body;

    if (!team_name?.trim() || !member1_name?.trim() || !member1_student_id?.trim()) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const m2Name = member2_name?.trim() || "";
    const m2StudentId = member2_student_id?.trim() || "";

    const result = await query(
      `UPDATE cards
       SET team_name = $1, member1_name = $2, member1_student_id = $3,
           member2_name = $4, member2_student_id = $5, message = $6,
           photo_url = COALESCE($7, photo_url), updated_at = CURRENT_TIMESTAMP
       WHERE id = $8
       RETURNING *`,
      [team_name.trim(), member1_name.trim(), member1_student_id.trim(), m2Name, m2StudentId, message?.trim() || "", photo_url, id]
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
```

- [ ] **Step 4: Verify test suite runs**

Run: `node --test test/api-wall-validation.test.mjs test/db-migration.test.mjs`
Expected: PASS

- [ ] **Step 5: Commit**

Run:
```bash
git add src/app/api/wall/route.js src/app/api/wall/[id]/route.js test/api-wall-validation.test.mjs
git commit -m "feat(api): support single or dual member cards in wall routes"
```

---

### Task 3: Form Member Toggle UI (`CreateForm.js`)

**Files:**
- Modify: `src/components/CreateForm.js`

**Interfaces:**
- Consumes: `editingCard` prop
- Produces: Form with `memberCount` toggle (`1` or `2`), dynamic Member 2 fields, payload sanitized according to mode

- [ ] **Step 1: Add memberCount state and detection to `src/components/CreateForm.js`**

Add `memberCount` state (default `2`).
In `useEffect(() => { ... }, [editingCard])`:
```javascript
const hasMember2 = Boolean(editingCard.member2_name && editingCard.member2_name.trim());
setMemberCount(hasMember2 ? 2 : 1);
```

- [ ] **Step 2: Add Member Count Toggle button in UI**

Add toggle above Member 1 inputs:
```jsx
<div>
  <label className="block text-xs sm:text-sm font-semibold text-brown-text mb-1.5">
    Member Type / จำนวนสมาชิก
  </label>
  <div className="grid grid-cols-2 gap-2 p-1 bg-cork/15 rounded-lg border border-cork/20">
    <button
      type="button"
      onClick={() => setMemberCount(1)}
      className={`flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-all ${
        memberCount === 1
          ? "bg-warm-brown text-cream shadow-sm"
          : "text-brown-text/70 hover:text-brown-text"
      }`}
    >
      <User className="w-4 h-4" />
      1 Person (เดี่ยว)
    </button>
    <button
      type="button"
      onClick={() => setMemberCount(2)}
      className={`flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-all ${
        memberCount === 2
          ? "bg-warm-brown text-cream shadow-sm"
          : "text-brown-text/70 hover:text-brown-text"
      }`}
    >
      <Users className="w-4 h-4" />
      2 People (คู่)
    </button>
  </div>
</div>
```

- [ ] **Step 3: Conditionally render Member 2 and sanitize payload in `handleSubmit`**

In `handleSubmit`:
```javascript
const payload = {
  ...formData,
  member2_name: memberCount === 2 ? formData.member2_name : "",
  member2_student_id: memberCount === 2 ? formData.member2_student_id : "",
  photo_url: finalPhotoUrl || "",
};
```
In JSX:
Only render Member 2 input grid if `memberCount === 2`:
```jsx
{memberCount === 2 && (
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 animate-fadeIn">
    {/* Member 2 Inputs */}
  </div>
)}
```
Also update Member 1 label to "Member Name *" when 1 person, or "Member 1 Name *" when 2 people.

- [ ] **Step 4: Update `resetForm`**

```javascript
const resetForm = () => {
  setFormData({
    team_name: "",
    member1_name: "",
    member1_student_id: "",
    member2_name: "",
    member2_student_id: "",
    message: "",
  });
  setMemberCount(2);
  setPhotoPreview(null);
  setPhotoUrl("");
  setError("");
  if (fileInputRef.current) fileInputRef.current.value = "";
};
```

- [ ] **Step 5: Commit**

Run:
```bash
git add src/components/CreateForm.js
git commit -m "feat(ui): add 1 or 2 member toggle to CreateForm"
```

---

### Task 4: Polaroid Card Back UI (`PolaroidCard.js`)

**Files:**
- Modify: `src/components/PolaroidCard.js:108-133`

**Interfaces:**
- Consumes: `card` object (`member1_name`, `member1_student_id`, `member2_name`, `member2_student_id`)
- Produces: Rendered polaroid card back showing single member cleanly without empty spaces or divider if Member 2 is absent

- [ ] **Step 1: Check `hasMember2` in `PolaroidCard.js`**

```javascript
const hasMember2 = Boolean(card.member2_name && card.member2_name.trim());
```

- [ ] **Step 2: Update Card Back Header and Member List**

In the card back header:
```jsx
<div className="flex items-center gap-1.5 text-brown-text">
  {hasMember2 ? <Users className="w-4 h-4 text-warm-brown" /> : <User className="w-4 h-4 text-warm-brown" />}
  <span className="text-xs font-bold uppercase tracking-wider">
    {hasMember2 ? "Team Members" : "Member"}
  </span>
</div>
```

In the member info box:
```jsx
<div className="space-y-2 text-xs text-brown-text bg-white/60 p-2.5 rounded border border-cork/20">
  <div className="flex flex-col">
    <span className="font-semibold text-brown-text flex items-center gap-1">
      👤 {card.member1_name}
    </span>
    <span className="text-[11px] text-brown-text/60 font-mono pl-4">
      ID: {card.member1_student_id}
    </span>
  </div>
  {hasMember2 && (
    <div className="border-t border-cork/10 pt-1 flex flex-col">
      <span className="font-semibold text-brown-text flex items-center gap-1">
        👤 {card.member2_name}
      </span>
      <span className="text-[11px] text-brown-text/60 font-mono pl-4">
        ID: {card.member2_student_id}
      </span>
    </div>
  )}
</div>
```

- [ ] **Step 3: Import `User` icon from `lucide-react`**

Update `lucide-react` imports to include `User`:
```javascript
import { Heart, Pencil, Trash2, Clock, Users, User, Camera, ImageOff } from "lucide-react";
```

- [ ] **Step 4: Commit**

Run:
```bash
git add src/components/PolaroidCard.js
git commit -m "feat(ui): update PolaroidCard to adapt layout for single member"
```

---

### Task 5: End-to-End Build and Verification

**Files:**
- None (verification task)

- [ ] **Step 1: Run all unit tests**

Run: `node --test test/*.test.mjs`
Expected: All tests PASS

- [ ] **Step 2: Run Next.js build**

Run: `npm run build`
Expected: Successful build with exit code 0

- [ ] **Step 3: Commit any lingering files or documentation updates**

Run:
```bash
git status
```
Expected: Clean working tree

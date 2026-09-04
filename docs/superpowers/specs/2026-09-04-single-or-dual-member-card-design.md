# Design Spec: Support Single or Dual Member Cards (1 หรือ 2 คน)

**Date:** 2026-09-04  
**Status:** Approved  

## 1. Overview
Currently, PolaroidWall strictly requires 2 members for every polaroid card (`member1_name`, `member1_student_id`, `member2_name`, `member2_student_id`). This spec defines the changes needed to allow users to select between creating a card for a single individual (1 person) or a pair (2 people).

## 2. Requirements & User Experience

### 2.1 Form (`CreateForm.js`)
- **Toggle Control:** Add a segment toggle with 2 options:
  - `1 คน (เดี่ยว)`
  - `2 คน (คู่)`
- **Dynamic Fields:**
  - When `1 คน` is selected:
    - Only display Member 1 inputs (Name and Student ID). Both are required.
    - Member 2 inputs are hidden.
    - When submitting, `member2_name` and `member2_student_id` are explicitly set to `""`.
  - When `2 คน` is selected:
    - Display Member 1 and Member 2 inputs. Both pairs of inputs are required.
- **Edit Card Handling:**
  - When editing a card:
    - If `card.member2_name` is non-empty and contains characters other than whitespace, initialize mode to `2 คน`.
    - Otherwise, initialize mode to `1 คน`.
- **Form Reset:**
  - Resetting the form preserves the default mode or resets to `2 คน` (or `1 คน`).

### 2.2 Card Display (`PolaroidCard.js`)
- **Back of Card:**
  - Check whether `card.member2_name` exists and is non-empty (`card.member2_name?.trim()`).
  - If `member2_name` exists:
    - Header shows "Team Members" and lists both Member 1 and Member 2 with the subtle separator line.
  - If `member2_name` does not exist or is empty:
    - Header shows "Member" (or "Team Member").
    - Lists only Member 1. No separator line or empty Member 2 block is shown.

## 3. Database Schema & Migration

### 3.1 Migration in `lib/db.js`
- Ensure that existing PostgreSQL tables alter columns to be nullable:
  ```sql
  ALTER TABLE cards ALTER COLUMN member2_name DROP NOT NULL;
  ALTER TABLE cards ALTER COLUMN member2_student_id DROP NOT NULL;
  ALTER TABLE cards ALTER COLUMN member2_name SET DEFAULT '';
  ALTER TABLE cards ALTER COLUMN member2_student_id SET DEFAULT '';
  ```
- Run safely in `ensureTables()` with `try/catch` or conditional logic so it doesn't fail if already migrated.

### 3.2 `init.sql`
- Update table definition so new setups allow empty or nullable `member2_name` and `member2_student_id`:
  ```sql
  member2_name VARCHAR(100) DEFAULT '',
  member2_student_id VARCHAR(20) DEFAULT '',
  ```

## 4. API Endpoints

### 4.1 `POST /api/wall`
- Validate only:
  ```javascript
  if (!team_name || !member1_name || !member1_student_id) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }
  ```
- Defaults for `member2_name` and `member2_student_id`:
  ```javascript
  const m2Name = member2_name?.trim() || "";
  const m2StudentId = member2_student_id?.trim() || "";
  ```

### 4.2 `PUT /api/wall/[id]`
- Similar validation: require `team_name`, `member1_name`, `member1_student_id`.
- Update `member2_name` and `member2_student_id` with trimmed value or empty string.

## 5. Testing & Verification
- Verify creating a 1-person card: form validates, submits successfully, back of card shows 1 member without errors.
- Verify creating a 2-person card: form requires member 2, submits successfully, back of card shows both members.
- Verify editing both 1-person and 2-person cards: loads into the correct mode, allows modifying or switching modes.
- Verify existing cards are unaffected.

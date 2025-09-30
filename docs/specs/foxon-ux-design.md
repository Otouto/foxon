# Foxon — User Interface Design Document (PWA)

> **Platform**: Single **Progressive Web App** optimized for **mobile** (portrait). Add-to-Home-Screen, offline-first logging, and seamless sync when online.

---

## Layout Structure
- **Dashboard (Home)**
  - **Fox Character** avatar (consistency progression). Tap → “Consistency” sheet (streak, goal status, next milestone).
  - **Weekly Cue** beneath avatar (e.g., “1 more workout to level up” / “Do 1 today to maintain”).
  - **Reflection Snippets** (1–2 line quotes from recent Session Seals).
  - **Primary CTA**: **Start workout**.
  - **Bottom Nav (3 tabs)**: **Workout · Review · Profile**.

- **Workout**
  - **Composer (Create Routine)**: empty state with **+ Add exercise**.
  - **Add Exercise Sheet**: search; filter chips **Muscles** / **Equipment**; sections: *Recent* and *All exercises*; “Create new exercise”.
  - **Routine Builder**: exercise cards with set table and **+ Add set**; per-exercise notes; **Move** sheet for ordering (↑/↓).
  - **Active Session (Log)**: same card layout; inline previous-session stats; ✓ check-off per set.

- **Finish Flow**
  1. **Review Summary** (total sets & volume, PR flags).  
  2. **Session Seal**:
     - **Effort** slider (Easy · Steady · Hard · All-In).
     - **One-line vibe** *(required)* — either a short reflection or an alternative session name.
     - **Optional longer note**.
  3. **Save** → return to Dashboard; Fox state updates.

- **Review**
  - **Two sub-tabs**:
    - **Sessions**: calendar + session list; detail shows sets/volume + Session Seal (effort, reflections).
    - **Exercises**: pick exercise → trends (volume, top set load, total sets) + history table.

- **Profile**
  - Avatar, display name, OAuth, privacy & basic preferences.

---

## Core Components
- **Fox Character Progression**
  - 4 states: *Slim → Fit → Strong (bison hints) → Fiery*.
  - Weekly rule vs. goal (e.g., 2×/week): meet/exceed → **advance**; meet half → **hold**; miss → **regress**.
  - Persistent **action cue** under avatar (“what to do next”).

- **Workout Composer (mobile-first)**
  - Filter + **tap-to-add** model (no drag-and-drop).
  - **Move** sheet for ordering items; quick **Duplicate / Remove**.
  - Set table columns: **Type** (W/Normal), **Load (kg)**, **Reps**; “Apply to all sets”.

- **Workout Logging**
  - Collapsible exercise cards; numeric keypad by default.
  - Inline previous session values (“Prev: 100 × 12”).
  - ✓ completion per set; quick add/duplicate/remove set.

- **Session Seal**
  - Effort + required one-line vibe; optional note.
  - Surfaces in Review and as Dashboard snippets.

---

## Interaction patterns
- **Tap-to-add** exercises; confirmation snackbar (“Add 1 exercise”).
- **Filter chips** for fast narrowing; search with recent history.
- **Move sheet** (↑/↓) replaces drag on mobile.
- **Inline edit** for sets; **Apply-to-all** action.
- **Check-off** advances focus to next set; light haptics.
- **Finish → Review → Session Seal** as a single stack (back navigable).
- Error nudge if Effort or one-line vibe missing.

---

## Visual Design Elements & Color Scheme
- **Style**: Whering-inspired — clean whites/soft neutrals, generous spacing, playful but restrained accents.
- **Accents**: neon **lime**, soft **purple**, bright **blue**, warm **orange** (used for CTAs/highlights).
- **State colors**: **Lime** = success/upgrade; **Amber** = at risk; **Red** = regress/remove.
- **Cards**: rounded corners, subtle shadow; large floating **+** where relevant.
- **Fox**: warm palette, subtle weekly upgrade/regression animations.

---

## Mobile, Web App, Desktop considerations
- **Now (MVP)**: Single **PWA**, **mobile-first** only (portrait). Offline cache for workouts/exercises; background sync when online.
- **Web (later)**: Same PWA scales to larger viewports for deeper stats/programming; no desktop-specific features required for MVP.
- **Desktop (future)**: Optional analytics dashboards.

---

## Typography
- **Primary**: Inter / SF Pro (rounded feel).
- **Hierarchy**: H1 24–28 (titles); H2 18–20 (sections); Body 15–17; Tabular numerals for weights/reps.
- Reflections in italic body; CTA buttons bold.

---

## Accessibility
- Text contrast ≥ 4.5:1 (3:1 for large text/icons).
- Effort slider uses **labels + color** (never color-only).
- Large touch targets (≥44×44pt); visible focus states.
- Respects **Reduce Motion** (minimize avatar animations).
- Voice dictation for reflections and exercise search.
- Supports Dynamic Type/text scaling; numeric keypad for number fields.

---

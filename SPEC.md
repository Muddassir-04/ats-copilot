# ATS Resume & Application Copilot — MVP Build Spec

**For:** Cursor / Lovable / Bolt (paste this whole file as the project brief)
**Product:** Paste a job description → get an ATS-optimized, Gulf-formatted CV + cover letter + match score + application tracker.
**Beachhead customer:** Indian data/BI/SAP/analytics professionals (2–8 yrs) job-hunting, with Indians targeting Gulf (UAE/KSA) roles as the sharp sub-segment.

---

## 0. Scope guardrails (read first — this protects against bloat)

**IN (the entire MVP):**
- Master profile entered once (with "paste your resume → AI fills it" to cut friction).
- JD paste → ATS-optimized, tailored CV (the spine).
- ATS match score + matched/missing keywords + fix suggestions + honest match estimate.
- Gulf-convention toggle (personal-details block, photo handling, 2-page allowance).
- Cover letter generation.
- Application tracker (status pipeline + follow-up reminders).
- Free public ATS-scorer on the landing page (lead magnet, no signup).
- Razorpay paywall with free-tier metering.

**EXPLICITLY OUT of v1 (do not build, even if tempted):**
- Interview-prep AI, salary intelligence, LinkedIn auto-posting, networking CRM.
- **Autonomous / headless bot-apply** — programmatically submitting to Naukri/LinkedIn/Bayt/Indeed. This breaks their ToS, shatters constantly on logins/CAPTCHAs/per-portal form quirks, and can get user accounts flagged. Never build this. Apply stays **assisted** (see Phase 5).
- Team/multi-user, admin dashboards, mobile app.

**PLANNED — Phase 5 (post-launch, after the v1 spine + paywall are live and working):** a job-search & match layer. "Search jobs" → pull a job feed → score each posting against the master CV → list the top ~10 with match % → per-job **Tailor** button + a **Tailor all** bulk action → per-job **Apply** that opens the live posting with the tailored .docx ready and auto-creates the tracker row (user does the final submit click — **assisted, not autonomous**). Reuses Prompt A (scoring) and Prompt B (tailoring) unchanged. This supersedes the old "curated job feed" deferral. Do not start it until v1 is done — it is a later phase precisely so it can't derail the spine.

**The product's honest promise** (use this everywhere — it's the trust differentiator): *We guarantee your formatting never costs you a rejection. We don't promise you'll get hired — fit and seniority still decide that.* Never overclaim "ATS-proof" or "guaranteed interviews."

---

## 1. Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js (App Router) + React + TypeScript |
| Styling | Tailwind CSS |
| DB / Auth / Storage | Supabase (Postgres, Auth, Storage for photos) |
| LLM | Anthropic Claude API (`claude-sonnet` for tailoring/scoring; structured JSON output) |
| Document export | **`docx` (docx.js)** for the primary CV — single-column, ATS-safe .docx. `@react-pdf/renderer` only for the optional on-request PDF (real text layer). Do **not** run LibreOffice/`soffice` in a Vercel function — it won't run serverless; use a container/worker or CloudConvert if you ever need docx→pdf fidelity. |
| Resume/JD parsing | LLM-based (Prompt D below) + plain-text extraction for uploads |
| Payments | Razorpay (UPI + cards; subscriptions) |
| Automation | n8n or Make (onboarding emails, churn winback, follow-up nudges) |
| Analytics | PostHog |
| Email | Resend or Brevo |
| Hosting | Vercel |
| (Deferred) Job feed | Apify |

---

## 2. Data model (Supabase / Postgres)

Enable Row Level Security on **every** table. Policy on all: `auth.uid() = user_id` for select/insert/update/delete. `profiles` keyed on `id = auth.uid()`.

### `profiles` (1:1 with `auth.users`)
| Column | Type | Notes |
|---|---|---|
| id | uuid (PK, FK → auth.users) | |
| email | text | |
| full_name | text | |
| plan | text | `'free'` \| `'pro'`, default `'free'` |
| free_tailors_used | int | default 0 |
| razorpay_customer_id | text | nullable |
| razorpay_subscription_id | text | nullable |
| subscription_status | text | nullable (`active`, `cancelled`, etc.) |
| created_at / updated_at | timestamptz | default now() |

### `master_profiles` (1:1 with user — the "enter once" source of truth)
| Column | Type | Notes |
|---|---|---|
| id | uuid (PK) | |
| user_id | uuid (FK → profiles, **unique**) | |
| full_name, email, phone, location | text | contact line |
| linkedin_url | text | nullable |
| headline | text | e.g. "Senior Data Analyst \| SAP BW/4HANA" |
| summary | text | base professional summary |
| nationality | text | nullable — Gulf field |
| visa_status | text | nullable — Gulf field |
| availability | text | nullable — Gulf field (notice period) |
| photo_url | text | nullable — Supabase Storage; human-facing version only |
| experiences | jsonb | `[{company, title, location, start, end, bullets[]}]` |
| education | jsonb | `[{institution, degree, field, year}]` |
| skills | jsonb | `[{category, items[]}]` or `string[]` |
| certifications | jsonb | `[{name, issuer, year}]` — completed only |
| languages | jsonb | nullable |
| created_at / updated_at | timestamptz | |

### `tailored_documents` (each JD → CV output)
| Column | Type | Notes |
|---|---|---|
| id | uuid (PK) | |
| user_id | uuid (FK) | |
| jd_text | text | pasted JD |
| target_role | text | |
| target_company | text | nullable |
| gulf_format | boolean | default false |
| ats_score | int | 0–100 |
| ats_analysis | jsonb | `{matched_keywords[], missing_keywords[], must_haves[], suggestions[], match_estimate}` |
| tailored_cv | jsonb | structured CV ready to render (see Prompt B schema) |
| cv_schema_version | int | default 1 — bump whenever Prompt B's output keys change; lets you find/regenerate stale docs in one query |
| cover_letter | text | nullable (generated on demand) |
| created_at / updated_at | timestamptz | |

### `applications` (the tracker)
| Column | Type | Notes |
|---|---|---|
| id | uuid (PK) | |
| user_id | uuid (FK) | |
| document_id | uuid (FK → tailored_documents) | nullable |
| company, role | text | |
| status | text | `'saved'` \| `'applied'` \| `'interviewing'` \| `'offer'` \| `'rejected'`, default `'saved'` |
| applied_at | date | nullable |
| follow_up_at | date | nullable (drives reminder nudges) |
| source | text | nullable |
| notes | text | nullable |
| created_at / updated_at | timestamptz | |

### `job_matches` (Phase 5 only — additive, do not build in v1)
Same RLS as every other table (`auth.uid() = user_id`). Nothing above depends on this; it's a clean add-on.
| Column | Type | Notes |
|---|---|---|
| id | uuid (PK) | |
| user_id | uuid (FK) | |
| source | text | which feed the job came from |
| job_url | text | live posting URL (opened on assisted apply) |
| company, role | text | |
| jd_text | text | pulled JD, fed to Prompt A |
| match_score | int | 0–100 (Prompt A) |
| analysis | jsonb | Prompt A output (matched/missing/suggestions) |
| document_id | uuid (FK → tailored_documents) | nullable — set once the user tailors for this job |
| status | text | `'matched'` \| `'tailored'` \| `'applied'` \| `'dismissed'`, default `'matched'` |
| created_at / updated_at | timestamptz | |

---

## 3. The core flow (JD → tailored CV)

1. User has a `master_profile` (built at onboarding; can be auto-filled via Prompt D from a pasted resume).
2. On `/new`: user pastes the JD, optionally enters target role/company, toggles **Gulf format**.
3. Server checks quota (free users: `free_tailors_used < 3`; else paywall).
4. **LLM call 1 — JD analysis + ATS scoring** (Prompt A): JD + master profile → score, matched/missing keywords, suggestions, honest match estimate.
5. **LLM call 2 — CV tailoring** (Prompt B): JD + analysis + master profile + gulf flag → structured tailored CV that mirrors the JD's exact terminology *only where the master profile genuinely supports it*.
6. Run the **ATS gate** (Section 6) on the output before saving.
7. Save to `tailored_documents`; increment `free_tailors_used` if free.
8. On `/document/[id]`: show score + analysis + CV preview → **Export .docx** (PDF only if the user asks) + **Generate cover letter** (Prompt C, on demand) + **Add to tracker**.

**Hard rule across the whole flow:** never invent experience, titles, dates, metrics, certifications, or skills beyond the master profile. A JD requirement the profile doesn't support is a *gap to flag*, never a fact to fabricate.

---

## 4. Screens & routes

| Route | Auth | Purpose |
|---|---|---|
| `/` | public | Landing + **free ATS scorer** (paste JD + paste/upload CV → score + top 3 gaps). CTA → signup for full tailoring. |
| `/signup`, `/login` | public | Supabase Auth (magic link or email+password). |
| `/onboarding` | auth | Build master profile. Offer "paste existing resume → AI fills the fields" (Prompt D), then user edits/confirms. |
| `/dashboard` | auth | List of tailored documents + tracker summary + "New tailored CV" button. |
| `/new` | auth | The core flow: paste JD, options, generate. Shows live progress. |
| `/document/[id]` | auth | ATS score + analysis + CV preview + export .docx (PDF on request) + cover letter + add to tracker. |
| `/tracker` | auth | Applications table/kanban by status; follow-up reminders. |
| `/settings` | auth | Edit master profile; plan/billing. |
| `/pricing` | public | Free vs Pro; Razorpay checkout. |
| `/jobs` | auth | **Phase 5 only.** "Search jobs" button → ranked top ~10 matches with match %; per-job Tailor + Apply; "Tailor all" bulk action. |

---

## 5. API routes (Next.js, server-side)

| Route | Method | Purpose |
|---|---|---|
| `/api/score` | POST | Free tool: `{jd_text, raw_cv_text}` → `{ats_score, top_gaps[]}`. No auth, IP rate-limited. Returns score + 3 gaps only (full tailoring is gated). |
| `/api/parse-resume` | POST | Auth: `{raw_resume_text}` → structured master-profile JSON (Prompt D). |
| `/api/tailor` | POST | Auth: `{jd_text, target_role, target_company, gulf_format}` → runs Prompt A + B, runs ATS gate, saves `tailored_documents`. Enforces quota. |
| `/api/cover-letter` | POST | Auth: `{document_id}` → Prompt C → updates row. |
| `/api/razorpay/create-subscription` | POST | Auth: create Razorpay subscription, return checkout params. |
| `/api/razorpay/webhook` | POST | Verify signature → update `profiles.plan` / `subscription_status`. |
| `/api/search-jobs` | POST | **Phase 5.** Auth: pull job feed (one source to start) → run Prompt A to score each posting against the master profile → upsert `job_matches` → return ranked top ~10. |
| `/api/tailor-bulk` | POST | **Phase 5.** Auth: `{job_match_ids[]}` → loops the existing `/api/tailor` logic (Prompt B) over selected jobs, links each result back to its `job_matches` row. Respects the same quota/paywall. |

All LLM calls: server-side only (never expose `ANTHROPIC_API_KEY` to client).

**Forcing valid JSON (do both):**
1. **Prefill the assistant turn with `{`** — add `{ role: 'assistant', content: '{' }` as the final message. The model cannot emit a code fence or preamble before content you've already started, so it returns clean JSON. The API returns only the continuation, so parse `JSON.parse('{' + responseText)`. This is the primary defence.
2. **Defensive parse as a fallback** for any call you don't prefill. Note: trim *before* stripping fences — JS `$` (no `m` flag) won't match a closing fence followed by a trailing newline.

```typescript
function parseLLMJson<T>(raw: string): T {
  let s = raw.trim();                       // trim FIRST
  s = s.replace(/^```(?:json)?\s*/i, '');   // opening fence, language tag optional
  s = s.replace(/\s*```$/i, '').trim();     // closing fence
  try {
    return JSON.parse(s) as T;
  } catch {
    const m = s.match(/[{[][\s\S]*[}\]]/);  // last resort: first bracket → last bracket
    if (!m) throw new Error('No JSON found in LLM output');
    return JSON.parse(m[0]) as T;
  }
}
```

---

## 6. The ATS gate (the differentiator — port this from the proven ruleset)

Run after tailoring, before saving/exporting. Two layers:

**Layer 1 — guaranteed by the .docx builder (Section 7), so it can't regress:**
- Single column. No tables, text boxes, columns, sidebars, icons, graphics, or symbol bullets. Bullets via docx.js `LevelFormat.BULLET` ("•"), never typed glyphs or images.
- Standard section headers only, in this order: **Professional Summary, Key Skills, Work Experience, Education, Certifications, Personal Details**.
- No content in true header/footer regions (many parsers skip those) — name/contact/dates live in the body.
- Standard font (Calibri or Arial). Photo-free .docx always.
- Right tab-stop for date alignment (`TabStopType.RIGHT` at `TabStopPosition.MAX`), never manual spaces.

**Layer 2 — checked programmatically per document:**
1. Every JD must-have that the master profile genuinely supports appears in the CV in the JD's **own wording** at least once (cross-check `ats_analysis.matched_keywords` against `tailored_cv` text).
2. No skill/tool in `tailored_cv` that isn't traceable to `master_profile` (fabrication check — diff skills/tools against the master profile; flag anything new).
3. Acronyms spelled out on first use (e.g. "Business Requirements Document (BRD)").
4. Consistent date format throughout; reverse-chronological.
5. Certifications listed as completed only — reject "pursuing"/"in progress".
6. British English, formal tone.
7. Page-fit (v1 = no rendering): the length cap lives in Prompt B (max bullets by experience, one line each — see Section 8). The only check here is a free O(n) estimate on the `tailored_cv` JSON — count bullets and sum character lengths into estimated lines, compare against your template's one-page budget. Over budget → re-prompt with a tighter cap, or accept page 2 (2 pages is allowed). Do **not** run a render-measure-reflow loop in the serverless function for v1.

If a check fails, re-prompt the tailoring call with the specific failure noted, or surface it to the user. **Honest match estimate** (`strong` / `moderate` / `stretch`) always shows — never inflate it.

---

## 7. Document export rules

**Primary output: .docx via docx.js.** Build a strict single-column template that enforces the Layer-1 rules above — this is the default download and the format most ATS portals parse most reliably. Photo-free always. Validate the generated .docx is structurally well-formed before serving it (a malformed file can fail to upload/parse on some portals even if it looks fine). File naming: `{FullName}_{Role}_{Company}_CV.docx`.

**Optional PDF (only when the user requests it):** render the *same* `tailored_cv` JSON to a matching single-column `@react-pdf/renderer` template with a real selectable text layer (never image/print-to-PDF). Build this only when a user actually needs it — it's not part of the v1 spine. If you later want pixel-identical docx→pdf, use a container/worker running LibreOffice or a service like CloudConvert; do not attempt `soffice` inside a Vercel serverless function.

**Photo handling:** the ATS .docx is photo-free, always. A photo (from `photo_url`) may appear only on a separately-labeled "human-facing / direct-outreach" version (the optional PDF) when Gulf format is on and the user opts in — never on the ATS document.

---

## 8. LLM prompts (paste into the Claude API calls)

> Model: `claude-sonnet`. Temperature ~0.3 for analysis/parse, ~0.5 for tailoring/cover letter. Always: *"Respond with valid JSON only. No prose, no markdown code fences."*

### Prompt A — JD Analysis + ATS Scoring
```
You are an ATS and recruiter-intelligence engine for the India and Gulf (UAE/KSA) job markets.
Given a JOB DESCRIPTION and a candidate MASTER PROFILE (JSON), analyse fit literally — most ATS
matching is literal string/synonym matching against the JD, not semantic understanding.

Rules:
- Extract the employer's EXACT terminology and acronyms (e.g. "S/4HANA", "stakeholder management").
- Separate must-haves from nice-to-haves.
- A keyword is "matched" only if the master profile genuinely supports it. Never assume skills not present.
- ats_score = how well the CURRENT profile would match this JD's literal requirements (0-100).
- match_estimate: "strong" | "moderate" | "stretch" — be honest, never inflate.
- suggestions: concrete, profile-grounded fixes (reword X to mirror the JD, surface Y bullet higher).
  Never suggest adding a skill the candidate doesn't have.

Return JSON:
{
  "must_haves": [string],
  "nice_to_haves": [string],
  "exact_terms": [string],          // employer phrasing to mirror verbatim
  "matched_keywords": [string],
  "missing_keywords": [string],     // genuine gaps to flag, not to fabricate
  "ats_score": number,              // 0-100
  "match_estimate": "strong" | "moderate" | "stretch",
  "suggestions": [string]
}

JOB DESCRIPTION:
{{jd_text}}

MASTER PROFILE:
{{master_profile_json}}
```

### Prompt B — CV Tailoring
```
You are a Gulf/India ATS-resume tailoring engine. Produce a tailored, ATS-safe CV from the
candidate's MASTER PROFILE, optimised for this JOB DESCRIPTION and its analysis.

NON-NEGOTIABLE RULES:
- NEVER invent experience, titles, dates, metrics, certifications, or skills beyond the master profile.
  A JD requirement not supported by the profile is omitted, not fabricated.
- Mirror the employer's exact_terms VERBATIM wherever the profile genuinely supports them — this is the
  literal ATS keyword-matching mechanism, not paraphrasing. Weave them into context, never keyword-stuff.
- Spell out acronyms on first use: "Business Process Model and Notation (BPMN)".
- Reverse-chronological. One consistent date format ("Jan 2024 – Present").
- Quantify impact only with numbers already in the master profile.
- British English, formal tone. Strong action verbs, no clichés.
- Certifications: completed credentials only. No "pursuing"/"in progress".
- If gulf_format is true, include a Personal Details section (Nationality, Visa/Residency status,
  Availability, Languages, willingness to relocate) using only fields present in the profile;
  if a field is missing, omit it silently. No photo in this structured output.
- If gulf_format is false, omit Personal Details.
- LENGTH: produce a CV that fits {{max_pages}} page(s). Total work_experience bullets across ALL roles
  must not exceed {{max_bullets}} (by years of experience: <3 yrs → 5, 3–6 yrs → 8, >6 yrs → 12).
  Keep each bullet to a single line. When you must cut to fit, drop the WEAKEST JD-match bullet first —
  NEVER remove a bullet that contains a JD must-have keyword.

Return JSON (sections render in this fixed order):
{
  "contact": {"full_name","headline","phone","email","linkedin_url","location"},
  "professional_summary": string,            // 2-4 lines, JD-aligned, truthful
  "key_skills": [string],                    // JD-mirrored where supported
  "work_experience": [
    {"company","title","location","dates","bullets":[string]}
  ],
  "education": [{"institution","degree","field","year"}],
  "certifications": [{"name","issuer","year"}],
  "personal_details": {"nationality","visa_status","availability","languages","relocation"} | null
}

JOB DESCRIPTION:
{{jd_text}}

JD ANALYSIS:
{{jd_analysis_json}}

MASTER PROFILE:
{{master_profile_json}}

GULF_FORMAT: {{gulf_format_bool}}
MAX_PAGES: {{max_pages}}        // 1 if <3 yrs experience, else 2
MAX_BULLETS: {{max_bullets}}    // computed from years of experience (see LENGTH rule)
```

### Prompt C — Cover Letter
```
Write a one-page cover letter (3-4 short paragraphs) for this role, sourced strictly from the
master profile. Formal Gulf business tone, British English.
Structure: (1) strong opening tied to the specific role + company; (2) body mapping the candidate's
genuine fit to the JD's top requirements (use the employer's terms); (3) confident close stating
availability and a call to action. Contact block at the top.
Never claim experience or skills not in the master profile.

Return JSON: {"cover_letter": string}

JOB DESCRIPTION: {{jd_text}}
JD ANALYSIS: {{jd_analysis_json}}
COMPANY: {{company}}   ROLE: {{role}}
MASTER PROFILE: {{master_profile_json}}
```

### Prompt D — Resume Parse (onboarding helper)
```
Extract a structured career profile from this raw resume text. Extract ONLY what is present —
never infer, embellish, or invent. Leave fields empty/null if not stated.

Return JSON matching the master_profiles schema:
{
  "full_name","email","phone","location","linkedin_url","headline","summary",
  "nationality","visa_status","availability",
  "experiences":[{"company","title","location","start","end","bullets":[string]}],
  "education":[{"institution","degree","field","year"}],
  "skills":[{"category","items":[string]}],
  "certifications":[{"name","issuer","year"}],
  "languages":[string]
}

RAW RESUME:
{{raw_resume_text}}
```

---

## 9. Paywall & metering

- **Free:** 3 lifetime tailored CVs (`free_tailors_used`), unlimited use of the public `/api/score` scorer (rate-limited, score + 3 gaps only — not the full tailored CV).
- **Pro (₹999–1,499/mo via Razorpay):** unlimited tailors + cover letters + tracker + (later) job feed.
- **One-time upsell:** ₹2,999 "land-the-job" pack (captures value upfront — important because job-seekers churn on hire).
- Gate enforcement is server-side in `/api/tailor`; the Razorpay webhook flips `profiles.plan`.

---

## 10. Build order (phased — build top to bottom, ship Phase 1 before touching Phase 2)

**Phase 1 — the spine (≈ week 1). Goal: the core thing works end-to-end.**
Supabase setup + RLS → Auth → `/onboarding` (with Prompt D auto-fill) → `/new` JD→CV using **Prompt B only** (skip scoring for now) → `tailored_documents` → **docx.js single-column .docx export**. Stop here until this is solid. (PDF export is optional and comes later, only if users ask.)

**Phase 2 — intelligence + lead magnet (≈ week 2).**
Add Prompt A (score + gaps + match estimate) to `/document/[id]`. Add the Gulf toggle. Build the public `/` landing scorer (`/api/score`). Wire the ATS gate (Section 6).

**Phase 3 — completeness (≈ week 3).**
Cover letter (Prompt C). Application tracker (`/tracker`) + follow-up reminders via n8n.

**Phase 4 — money (≈ week 4).**
Razorpay subscription + webhook + paywall metering + `/pricing`.

**Phase 5 — job search & match (post-launch, only after Phases 1–4 are live and working).**
Add the `job_matches` table. Wire one job-feed source (official/affiliate API preferred; Apify actor as fallback — grey-zone but low-stakes since apply is assisted). Build `/api/search-jobs` (feed → Prompt A scoring → ranked top ~10), `/api/tailor-bulk` (Prompt B over selected jobs), and the `/jobs` page with per-job Tailor + Apply and a "Tailor all" action. **Apply is assisted** — open the live posting with the tailored .docx ready and auto-create the tracker row; the user makes the final submit click. Never headless auto-submit.

**Deferred beyond Phase 5:** referral mechanic; additional job-feed sources.

---

## 11. Environment variables

```
ANTHROPIC_API_KEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=        # server-only
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=              # server-only
RAZORPAY_WEBHOOK_SECRET=          # server-only
RESEND_API_KEY=                   # or BREVO_API_KEY
POSTHOG_KEY=
```

---

## 12. First action in Cursor today

Build **only Phase 1, Step 1**: spin up the Supabase project, create the four tables above with RLS, and stand up Supabase Auth + a protected `/dashboard`. Don't write a single LLM call until auth + the data model are live. Then build the `/new` → Prompt B → **.docx** spine. Everything else waits.

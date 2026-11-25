# Popcorn Math Rebuild Technical Specification

**Version:** 2.0 (Full Rebuild from Scratch)  
**Date:** November 9, 2026  
**Document Purpose:** Architectural and functional blueprint for the rebuild of the Popcorn Math programme section on Tutor Time.

---

## 1. Page Inventory & Routing Matrix

All canonical routes use the singular brand "Popcorn Math" (no "s"). Legacy URLs issue permanent HTTP 301 redirects to their canonical equivalents.

| Page Name | Canonical URL | Legacy URL (301 Redirect) | Purpose & Key Audiences |
|---|---|---|---|
| **Popcorn Math Hub** | `/services/popcorn-math` | `/services/popcorn-maths` | Programme landing page with hero, promise, 4 steps, craft placeholders, 3 audience paths, pilot status, trust, FAQ, WhatsApp CTA, and mini-game teaser. |
| **Parents Guide** | `/popcorn-math/parents` | *(New)* | Programme explained for parents, term length (8–10 weeks), mixed grades 1–5, take-home crafts, and "Register Interest" form (strictly no child name collected). |
| **School Partnerships** | `/popcorn-math/schools` | `/popcorn-maths/school-partnership` | Institutional guide for principals and teachers: what the school provides vs what Popcorn Math provides, and partnership enquiry form. |
| **Presenter Recruitment** | `/popcorn-math/presenters` (alias `/join`) | `/popcorn-maths/presenter` | QR landing page written for quick reading on mobile phones. Role, 18+ requirement, expectations, pay structure in words, policies, contact, and application form with PDF CV upload. Print stylesheet. |
| **School Directory** | `/popcorn-math/locations` | *(New)* | School directory displaying planned-pilot status only in a structured data registry without invented school names. |
| **Interactive Play Teaser** | `/popcorn-math/play` | `/popcorn-maths/game` | Short, fun browser mini-game teaser updated with the new bucket mascot and celebration screen. |
| **Popcorn Math FAQ** | `/popcorn-math/faq` | *(New)* | Consolidated FAQ addressing common questions from Parents, Schools, and Presenters. |

---

## 2. Content Outlines by Page

### 1. `/services/popcorn-math` (The Landing Page)
- **Hero**: Original Popcorn Math bucket mascot placeholder (`renderBucketMascot({ expression: 'happy' })`), headline *"Where Math Skills POP Through Hands-On Making"*, one clear promise: *Every child takes home a tangible mathematical creation each week*.
- **"How It Works" in 4 Simple Steps**:
  1. *Weekly 1-Hour Session*: Children from mixed primary grades (grades 1 to 5) gather after school.
  2. *Hands-On Materials Packet*: Every child receives their own tactile packet with all materials needed.
  3. *Guided Making*: An energetic independent presenter demonstrates how to craft 3D geometric shapes and models.
  4. *Take It Home*: Every child proudly takes home what they built to share with family.
- **"What Children Make"**: Illustrated placeholder cards (3D Geometric Tetrahedron, Cube Construction, Popcorn Manipulative Graphs) — zero invented real photos.
- **Three Clear Pathways**:
  - *For Parents*: Understand the series, see dates, register interest.
  - *For Schools*: Partner with us to bring Popcorn Math to your classrooms.
  - *For Presenters*: Become a paid session presenter (18+).
- **Where & When**: Clear note that the pilot is planned for January at the founder's school, with planned expansion to all 6 primary schools in Anguilla.
- **Trust Section**: Presenter background checks, teacher supervision, structured safety protocols.
- **FAQ Preview & WhatsApp CTA**.
- **Mini-Game Teaser**: Quick link to `/popcorn-math/play`.

### 2. `/popcorn-math/parents` (Parent Registration)
- **Programme Structure**: 8 to 10 week series aligned with the school term, 1 hour per week.
- **Ages & Grades**: Mixed primary grades 1 through 5 in one collaborative, fun environment.
- **Take-Home Guarantee**: Details on the tactile geometric crafts and tactile manipulatives.
- **No Published Price**: Explains that fees are paid per series and will be confirmed upon registration.
- **Form Fields**:
  - `parentName` (Parent / Guardian Full Name)
  - `contactMethod` (Email or WhatsApp phone number)
  - `childGrade` (Child's Grade: Grade 1, 2, 3, 4, or 5 — multi-select allowed)
  - `preferredSchool` (Preferred Primary School in Anguilla / "Pilot School")
  - `consent` (Privacy Policy consent checkbox)
  - `_gotcha` (Honeypot protection)
  - **STRICT PRIVACY RULE**: Never ask for the child's name.

### 3. `/popcorn-math/schools` (School Partnerships)
- **Collaboration Model**:
  - *What the school provides*: A secure classroom space for 1 hour weekly, school teacher-presenter nomination if available, attendance confirmation.
  - *What Popcorn Math provides*: Full materials packets, founder-crafted demo model, trained independent presenter, curriculum activities, safeguarding oversight.
- **Form Fields**:
  - `schoolName` (Name of School / Institution)
  - `contactPerson` (Principal or Coordinator Name)
  - `contactEmail` & `contactPhone`
  - `estimatedStudents`
  - `message`
  - `consent` & honeypot

### 4. `/popcorn-math/presenters` (QR Landing Page & Alias `/join`)
- **Mobile-First Layout**: Optimized for fast scanning on smartphones via printed flyer QR code.
- **Role Summary**: Independent session presenter leading hands-on builds as Teacher Cassie's "mini-me".
- **Eligibility**: Strictly adults aged 18 or over. Teachers at participating schools and energetic 18–19 school leavers are welcomed.
- **Pay Model in Words Only**: Paid a set fee per completed session, plus an attendance bonus for completing every session in a series. No dollar amounts published publicly.
- **4 Simple Steps**: (1) Apply online -> (2) Background check & orientation -> (3) Receive session kit & finished model -> (4) Present at assigned school.
- **Policies Summary**: Presenters are vetted, background checks are mandatory, and a strict Code of Conduct applies.
- **Form Fields (Reusing existing presenter application pipeline)**:
  - `fullName`, `email`, `phone`
  - `ageConfirmed` (18+ verification checkbox)
  - `educationLevel` / background
  - `cvFile` (Presigned S3 PDF upload endpoint)
  - `consent` & honeypot
- **Print Stylesheet**: Clean, distraction-free print view for offline flyer reference.

### 5. `/popcorn-math/locations` (School Directory)
- **Island Context**: 6 primary schools on Anguilla.
- **Data File (`src/shared/content/popcornSchools.js`)**: Structured registry of cohorts.
- **Planned Status Only**: Shows the January pilot status at the founder's school and "Planned expansion" for other cohorts without inventing unverified school names.

### 6. `/popcorn-math/play` (Mini-Game Teaser)
- Short interactive teaser game where learners answer fun math questions to pop corn into the bucket.
- Updated with the new inline SVG Popcorn Bucket mascot placeholder (`renderBucketMascot`).
- Dynamic expressions: thinking when evaluating, celebrating on correct pops, and celebration screen upon round completion.

### 7. `/popcorn-math/faq`
- Clean accordion FAQ grouped into:
  - *Parents FAQ* (Cost, schedule, grades, take-home crafts, supervision).
  - *Schools FAQ* (Space requirements, scheduling, materials supply).
  - *Presenters FAQ* (Age 18+ requirement, pay structure, background checks, training).

---

## 3. Assumptions (Decided per Brief Guidelines)

1. **Form Pipelines**: We reuse the existing robust `/api/forms/presenter-application` pipeline for presenters (preserving the 18+ gate and presigned S3 PDF CV upload), and map parent and school enquiries through the modular `/api/forms/*` pipeline into local JSON storage (`./data/tutortime-submissions.json`) with zero AWS requirements locally.
2. **School Names**: Because Kashamar's official primary school contact directory is still pending in ClickUp task `123u8tyqamh`, we do not invent school names. We represent the pilot cohort as "Anguilla Primary Pilot Cohort (Founder's School — Launching January)" and designate remaining island primary school cohorts as "Anguilla Community Primary Cohort — Planned Series", with an easy-to-update registry file in `src/shared/content/popcornSchools.js`.
3. **QR Alias `/join`**: We configure a permanent 301 / direct route for `/join` that renders or redirects to `/popcorn-math/presenters`, ensuring printed flyers can use a short, memorable, scan-friendly URL.
4. **Child Privacy**: In full alignment with COPPA and global child privacy standards, the parent registration form collects parent contact information, preferred grade level, and school choice, but does **not** solicit or store the child's name, birthdate, or sensitive demographic data.
5. **Fee Disclosure**: In accordance with the owner's decision, zero currency symbols or dollar amounts are published anywhere on public pages; all copy instructs parents to register interest and presenters to review session terms during orientation.

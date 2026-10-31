# Production Launch Blockers & Action Checklist

> **DOCUMENT PURPOSE:** Definitive pre-launch operational checklist identifying the 14 required business, legal, design, and technical decisions required from the business owner / Cassie before full public launch.

---

## 1. Privacy Notice & Policy (`TODO(legal)`)
- **Blocker:** All forms currently contain consent checkboxes referencing a Privacy Policy that links to a stub.
- **Required Action:** Author and publish an official Privacy Policy detailing data controller identity, lawful basis for processing, data sharing limits, and parent data rights under applicable data protection regulations.

## 2. S3 CV Document Retention Period (`TODO(legal)`)
- **Blocker:** CloudFormation template `infra/tutortime-stack.yaml` parameterizes `CVRetentionDays` with a default of 90 days.
- **Required Action:** Owner must confirm the legal retention period for job applicant CVs in Anguilla/Caribbean jurisdiction before setting the production lifecycle expiration rule.

## 3. Presenter Vetting & Child Safeguarding
- **Blocker:** Popcorn Math involves adult presenters interacting with children aged 8 to 13.
- **Required Action:** Establish and document standardized background vetting protocols (police background checks, reference verifications, and safeguarding code of conduct) before any applicant works with children. Vetting requirements depend on local legal requirements to be confirmed by the owner.

## 4. Under-18 Tutor Policy Alignment
- **Blocker:** The original brief mentioned under-18 tutors; their role is not defined.
- **Required Action:** Owner to decide how under-18 participants (if any) are involved and safeguarded. Not designed yet.

## 5. `/subscribers` Endpoint Security & Future Disposition
- **Blocker:** The `/subscribers` endpoint returns the list of email subscribers without authentication.
- **Required Action:** Decide whether to deprecate `/subscribers` in favor of an authenticated admin dashboard, restrict it behind `X-Admin-Key` authentication (matching `/api/metrics`), or migrate subscribers into an external email newsletter provider (e.g. Mailchimp, ConvertKit).

## 6. Amazon SES Domain Verification & Production Access
- **Blocker:** Amazon SES defaults to Sandbox mode, restricting email dispatch to pre-verified email addresses only.
- **Required Action:** 
  1. Complete DNS verification for popcornmaths.com (assumed; owner to confirm) in AWS SES us-east-2.
  2. Request SES Production Access from AWS Support to allow sending notification emails without sandbox recipient limits.

## 7. Custom Domain & DNS Configuration
- **Blocker:** popcornmaths.com is the one domain in the AWS account, registered in Route 53 with auto-renew, certificate issued in us-east-2; the owner has not confirmed which domain hosts the main site.
- **Required Action:** Owner to confirm the domain, then point DNS and certificates at the production host.

## 8. Application Load Balancer (ALB) Retirement
- **Blocker:** Existing AWS infrastructure incurs unnecessary idle hourly charges for an unused or legacy ALB.
- **Required Action:** Execute the cost-reduction plan to retire the ALB, transitioning traffic directly through CloudFront / S3 / EC2 to maintain near-zero idle infrastructure cost.

## 9. Real Content Replacement for "Details coming soon."
- **Blocker:** Several pages currently render "Details coming soon." stubs (see `docs/PLACEHOLDERS.md` for the full list of placeholders).
- **Required Action:** Provide official finalized text for each of the stubs listed in `docs/PLACEHOLDERS.md`.

## 10. Official Popcorn Math Mascot Artwork
- **Blocker:** Mini-game (`/popcorn-maths/game`) displays a marked placeholder (`data-todo="mascot"`).
- **Required Action:** Deliver high-resolution SVG or PNG artwork for the official Popcorn Math mascot character and confirm its official character name.

## 11. WhatsApp Business Contact Number
- **Blocker:** The floating chat button and contact links use `WHATSAPP_PHONE_NUMBER` from environment configuration.
- **Required Action:** Provide the official dedicated WhatsApp Business phone number for Teacher Cassie.

## 12. Self-Hosted Font Hosting & Web Performance
- **Blocker:** External Google Fonts links were removed to guarantee zero CDN requests; styling currently falls back to system rounded fonts and cursive chains.
- **Required Action:** License or download local WOFF2 files for "Quicksand", "Fredoka", and "Reenie Beanie", place them in `MyWebApp/src/main/webapp/assets/fonts/`, and define `@font-face` rules in `tokens.css`.

## 13. Owner Approval of Proposed Copy & Service Colors
- **Blocker:** 104 copy items are marked `PROPOSED-COPY`.
- **Required Action:** Complete review of `docs/COPY_REVIEW.md`, approve or adjust the priority headlines and service descriptions, and confirm brand accent colors.

## 14. `/subscribe` Local Storage vs. DynamoDB Integration
- **Blocker:** `/subscribe` stores email signups in a local JSON file, not in DynamoDB. The existing DynamoDB table `popcorn-maths-subscribers` is not used by this repo's code.
- **Required Action:** Owner to decide whether `/subscribe` should move to the storage layer (this requires changing `/subscribe`, which is currently frozen), and what to do with the 10 existing items.


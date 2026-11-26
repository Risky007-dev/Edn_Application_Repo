/**
 * Page View Renderers
 * Generates semantic, accessible, mobile-first HTML for all Phase 1 pages.
 * Text is dynamically retrieved from src/shared/content, output-escaped,
 * and structured with ARIA attributes and visible labels.
 */

const content = require('../content');
const config = require('../config');
const { escapeHtml, renderLayout } = require('./layout');
const { renderGuideMascot, renderSpeechBubble } = require('../components/mascotGuide');
const { renderBucketMascot } = require('../components/mascotBucket');
const { getActiveQuestions } = require('../content/readiness-questions');
const { getClientRuleConfig } = require('../readiness/recommendationRules');

// Helper for consent checkbox
function renderConsentCheckbox() {
  return `
    <div class="form-group form-checkbox-group">
      <input type="checkbox" id="consent" name="consent" required class="form-checkbox">
      <label for="consent" class="checkbox-label" data-todo="legal">
        I agree to the processing of my details in accordance with the <a href="/privacy" target="_blank" rel="noopener">Privacy Policy</a>.
      </label>
    </div>
  `;
}

// Helper for honeypot
function renderHoneypot() {
  return `
    <div class="form-honeypot" style="display:none;" aria-hidden="true">
      <label for="_gotcha">Leave this field blank</label>
      <input type="text" id="_gotcha" name="_gotcha" tabindex="-1" autocomplete="off">
    </div>
  `;
}

// Helper for form feedback message area
function renderFormStatus(formId) {
  return `<div id="${formId}-status" class="form-status" aria-live="polite" role="status"></div>`;
}

// 1. Home Page (/)
function renderHomePage() {
  const hp = content.homepage.hero;
  const bodyHtml = `
    <!-- Screen 1: Split Editorial Hero (Flat Ivory Ground) -->
    <section class="hero-section hero-split-section">
      <div class="container hero-split-grid">
        <div class="hero-split-copy">
          <h1 class="hero-headline">${escapeHtml(hp.headline.text)}</h1>
          <p class="hero-tagline">${escapeHtml(hp.tagline.text)}</p>
          <p class="hero-subhead">${escapeHtml(hp.subhead.text)}</p>

          <div class="hero-ctas">
            <a href="/book" class="btn btn-primary btn-large">${escapeHtml(hp.ctaBook.text)}</a>
            <a href="#programmes" class="btn btn-secondary btn-large">${escapeHtml(hp.ctaExplore.text)}</a>
          </div>

          <div class="hero-mascot-wrapper hero-mascot-compact">
            <!-- TODO(mascot): Final cartoon of Kashamar will be swapped in here -->
            ${renderGuideMascot({ expression: 'happy', size: 84, className: 'animated' })}
            ${renderSpeechBubble({ text: escapeHtml(hp.mascotGreeting ? hp.mascotGreeting.text : "Hi! I'm your Tutor Time guide. Ready to explore learning that pops?") })}
          </div>
        </div>

        <div class="hero-split-media">
          <picture data-phone-fill>
            <source media="(max-width: 639px)" srcset="/assets/photos/photo-f175117225-780x975.webp 780w" sizes="100vw">
            <img src="/assets/photos/photo-f175117225.webp"
                 srcset="/assets/photos/photo-f175117225-500.webp 500w, /assets/photos/photo-f175117225-960.webp 960w, /assets/photos/photo-f175117225-1280.webp 1280w, /assets/photos/photo-f175117225.webp 1920w"
                 sizes="(max-width: 1023px) 100vw, 50vw"
                 width="1920" height="1444"
                 alt="Quiet wooden study desk with lamp and chair in natural daylight"
                 fetchpriority="high" decoding="async"
                 data-source="stand-in" data-subject="study-desk">
          </picture>
        </div>
      </div>
    </section>

    <!-- Screen 2: Four Core Educational Pathways (Warm Cream Ground) -->
    <section id="programmes" class="programmes-section pathways-cream">
      <div class="container">
        <div class="section-header-left">
          <h2>Our Core Educational Pathways</h2>
          <p>Personalised learning experiences designed to inspire confidence and steady academic progress.</p>
        </div>

        <div class="pathways-grid">
          ${hp.options.map(opt => `
            <article class="pathway-card pathway-${escapeHtml(opt.key)}">
              <div class="pathway-top-rule" aria-hidden="true"></div>
              <h3 class="pathway-title">${escapeHtml(opt.title.text)}</h3>
              <p class="pathway-name">${escapeHtml(opt.name.text)}</p>
              <p class="pathway-desc">${escapeHtml(opt.desc.text)}</p>
              <a href="${escapeHtml(opt.href)}" class="pathway-link">${escapeHtml(opt.cta.text)}</a>
            </article>
          `).join('')}
        </div>
      </div>
    </section>

    <!-- Screen 3: Brand Band — Popcorn Math & Interactive Parent Tools -->
    <section class="brand-band-section">
      <div class="container brand-band-grid">
        <div class="brand-band-copy">
          <h2>Interactive Practice &amp; Parent Clarity Tools</h2>
          <p class="brand-band-lead">Try our kid-safe math mini-game, match your child to the right pathway, or run a quick CPEA readiness check.</p>

          <div class="brand-tool-list">
            <a href="/popcorn-math/play" class="brand-tool-row">
              <div>
                <strong>Popcorn Math Mini-Game</strong>
                <span>Three skill bands for ages 4&ndash;12, zero tracking or ads.</span>
              </div>
              <span class="brand-tool-action">Play now</span>
            </a>
            <a href="/find-your-programme" class="brand-tool-row">
              <div>
                <strong>Smart Programme Finder</strong>
                <span>Three quick questions to match your child&rsquo;s learning goals.</span>
              </div>
              <span class="brand-tool-action">Find match</span>
            </a>
            <a href="/readiness-check" class="brand-tool-row readiness-cta-section">
              <div>
                <strong>${escapeHtml(content.homepage.readinessCta.title.text)}</strong>
                <span>10-question Mathematics &amp; Language Arts sample checks with a printable parent summary.</span>
              </div>
              <span class="brand-tool-action">${escapeHtml(content.homepage.readinessCta.buttonText.text)}</span>
            </a>
          </div>
        </div>

        <div class="brand-band-media">
          <img src="/assets/photos/photo-d183.webp"
               srcset="/assets/photos/photo-d183-500.webp 500w, /assets/photos/photo-d183-960.webp 960w, /assets/photos/photo-d183.webp 1280w"
               sizes="(max-width: 1023px) 100vw, 48vw"
               width="1280" height="853"
               alt="Open blank notebook with a ribbon marker and pencil on a wooden study table"
               loading="lazy" decoding="async"
               data-source="library-057" data-subject="desk">
        </div>
      </div>
    </section>

    <!-- Screen 4: Holiday Specials (3 Seasonal Programmes) -->
    <section id="holiday-specials" class="holiday-section">
      <div class="container">
        <div class="holiday-intro-grid">
          <div class="section-header-left">
            <h2>Holiday Specials with Teacher Cassie</h2>
            <p>Short, focused holiday intensives designed to keep skills sharp and build joyful momentum before the new term begins.</p>
          </div>
          <div class="holiday-intro-media">
            <img src="/assets/photos/photo-c877.webp"
                 srcset="/assets/photos/photo-c877-500.webp 500w, /assets/photos/photo-c877-960.webp 960w, /assets/photos/photo-c877.webp 1280w"
                 sizes="(max-width: 1023px) 100vw, 40vw"
                 width="1280" height="853"
                 alt="Stacked study books prepared for holiday learning sessions"
                 loading="lazy" decoding="async"
                 data-source="library-057" data-subject="desk">
          </div>
        </div>

        <div class="holiday-grid">
          <article class="holiday-card">
            <span class="holiday-meta">Ages 7&ndash;11 &bull; 5-Day Intensive</span>
            <h3>Winter Spark Math Camp</h3>
            <p>Hands-on number fluency, Popcorn Math speed challenges, and confidence-building word problems in small, encouraging groups.</p>
            <a href="/book?interest=popcorn-math" class="btn btn-secondary">Reserve a Spot</a>
          </article>

          <article class="holiday-card holiday-card-featured">
            <span class="holiday-meta">Ages 9&ndash;12 &bull; Exam Clinic</span>
            <h3>Festive CPEA Sprint &amp; Past-Paper Studio</h3>
            <p>Focused holiday prep covering timed reasoning, step-by-step error review, and calm test-taking habits ahead of exam term.</p>
            <a href="/book?interest=traditional-tutoring" class="btn btn-primary">Book Holiday Sprint</a>
          </article>

          <article class="holiday-card">
            <span class="holiday-meta">All Primary Levels &bull; Diagnostic</span>
            <h3>New Year Reading &amp; Numeracy Jumpstart</h3>
            <p>A fresh-start academic check-in with personalised goal setting and a two-week roadmap so your child steps into January ahead.</p>
            <a href="/book?interest=concierge" class="btn btn-secondary">Claim Jumpstart</a>
          </article>
        </div>
      </div>
    </section>

    <!-- Screen 5: Parent Updates & Quiet Close -->
    <section class="interest-section">
      <div class="container interest-container">
        <div class="interest-copy">
          <h2>${escapeHtml(content.homepage.subscribeSection.title.text)}</h2>
          <p>${escapeHtml(content.homepage.subscribeSection.description.text)}</p>
        </div>

        <form id="subscribe-form" class="subscribe-form" method="POST" action="/subscribe" novalidate>
          <div class="subscribe-input-group">
            <label for="subscribe-email" class="sr-only">Email address</label>
            <input type="email" id="subscribe-email" name="email" required placeholder="Enter your email address" class="form-input">
            <button type="submit" class="btn btn-primary">${escapeHtml(content.homepage.subscribeSection.buttonText.text)}</button>
          </div>
          <div id="subscribe-status" class="form-status" aria-live="polite"></div>
        </form>
      </div>
    </section>
  `;

  return renderLayout({
    title: 'Home',
    description: hp.subhead.text,
    bodyHtml,
    currentPath: '/',
    pageType: 'service',
    siteKind: 'other',
    photoCredit: 'Photographs: Orf3us (CC BY-SA 4.0, Wikimedia Commons) & taste-skill library (stand-in frames).'
  });
}

// 2. Personalised Tutoring (/services/traditional-tutoring)
function renderTraditionalTutoringPage() {
  const tut = content.services['traditional-tutoring'];
  const bodyHtml = `
    <div class="page-header header-tutoring">
      <div class="container" data-canonical="Personalised Tutoring & Academic Support">
        <span class="page-eyebrow">Service Overview</span>
        <h1>${escapeHtml(tut.title.text)}</h1>
        <p class="lead">${escapeHtml(tut.tagline.text)}</p>
      </div>
    </div>

    <div class="container content-container">
      <section class="content-block">
        <h2>About Personalised Tutoring</h2>
        <p>${escapeHtml(tut.overview.text)}</p>

        <h3 class="mt-4">Programme Highlights</h3>
        <ul class="feature-checklist">
          ${tut.features.map(f => `<li><span class="check-icon" aria-hidden="true">✓</span> ${escapeHtml(f.text)}</li>`).join('')}
        </ul>

        <div class="cta-box mt-5">
          <h3>Ready to support your child's academic journey?</h3>
          <p>Schedule an initial consultation to discuss specific subject goals and timetable availability.</p>
          <a href="${escapeHtml(tut.cta.href)}" class="btn btn-primary">${escapeHtml(tut.cta.text)}</a>
        </div>
      </section>
    </div>
  `;

  return renderLayout({
    title: tut.title.text,
    description: tut.tagline.text,
    bodyHtml,
    currentPath: '/services/traditional-tutoring'
  });
}

// 3. Concierge Academic Coaching (/services/concierge)
function renderConciergePage() {
  const cng = content.services.concierge;
  const bodyHtml = `
    <div class="page-header header-concierge">
      <div class="container">
        <span class="page-eyebrow">Premium Academic Management</span>
        <h1>${escapeHtml(cng.title.text)}</h1>
        <p class="lead">${escapeHtml(cng.headline.text)}</p>
        <p class="sublead">${escapeHtml(cng.tagline.text)}</p>
      </div>
    </div>

    <div class="container content-container">
      <section class="content-block">
        <h2>${escapeHtml(cng.expectationsTitle.text)}</h2>
        <p>${escapeHtml(cng.overview.text)}</p>

        <ul class="feature-checklist mt-4">
          ${cng.expectations.map(e => `<li><span class="check-icon" aria-hidden="true">★</span> ${escapeHtml(e.text)}</li>`).join('')}
        </ul>

        ${config.conciergeReadinessSurvey ? `
          <div id="readiness-survey" class="mt-5">
            <h3>Is Concierge Coaching Right for Your Family?</h3>
            <p>Answer 4 quick questions to see how academic coaching can support your child&#39;s educational journey.</p>

            <div class="form-group mt-3">
              <p><strong>1. What is the primary area needing support?</strong></p>
              <label class="checkbox-label"><input type="radio" name="survey-q1" value="subject"> Subject comprehension &amp; specific math/English topics</label><br>
              <label class="checkbox-label"><input type="radio" name="survey-q1" value="executive"> Organization, study habits, deadline tracking &amp; executive functioning</label>
            </div>

            <div class="form-group mt-3">
              <p><strong>2. How much time do you spend managing your child&#39;s schoolwork conflicts?</strong></p>
              <label class="checkbox-label"><input type="radio" name="survey-q2" value="low"> Under 1 hour per week</label><br>
              <label class="checkbox-label"><input type="radio" name="survey-q2" value="high"> Multiple hours weekly, causing family stress</label>
            </div>

            <div class="form-group mt-3">
              <p><strong>3. Are major exams or transition assessments approaching?</strong></p>
              <label class="checkbox-label"><input type="radio" name="survey-q3" value="no"> No immediate high-stakes exams</label><br>
              <label class="checkbox-label"><input type="radio" name="survey-q3" value="yes"> Yes, preparing for key board or entrance exams</label>
            </div>

            <div class="form-group mt-3">
              <p><strong>4. What level of parent communication do you prefer?</strong></p>
              <label class="checkbox-label"><input type="radio" name="survey-q4" value="occasional"> Occasional updates upon request</label><br>
              <label class="checkbox-label"><input type="radio" name="survey-q4" value="weekly"> Proactive weekly oversight and structured progress reports</label>
            </div>

            <div id="survey-result" class="mt-4" aria-live="polite" role="status">
              <h4>Strong Match for Concierge Coaching</h4>
              <p>Your family would benefit significantly from structured academic oversight, deadline management, and direct educator accountability.</p>
              <a href="#apply" id="survey-apply-btn" class="btn btn-primary btn-sm mt-2">Proceed to Application Below</a>
            </div>
          </div>
        ` : ''}
      </section>

      <section class="form-section mt-5" id="apply">
        <div class="form-card">
          <h2>Apply for Concierge Coaching</h2>
          <p class="form-intro">Concierge Coaching is consultation-first. Please complete the application below to begin the assessment process.</p>

          <form id="concierge-application-form" class="app-form" data-form-type="concierge-application" novalidate>
            ${renderHoneypot()}

            <div class="form-group">
              <label for="parentName">Parent / Guardian Full Name <span class="required">*</span></label>
              <input type="text" id="parentName" name="parentName" required maxlength="100" class="form-input">
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="email">Contact Email <span class="required">*</span></label>
                <input type="email" id="email" name="email" required maxlength="150" class="form-input">
              </div>

              <div class="form-group">
                <label for="phone">Phone Number <span class="required">*</span></label>
                <input type="tel" id="phone" name="phone" required maxlength="25" placeholder="+1 (264) 555-0199" class="form-input">
              </div>
            </div>

            <div class="form-group">
              <label for="studentYearGroup">Student Year Group <span class="required">*</span></label>
              <select id="studentYearGroup" name="studentYearGroup" required class="form-select">
                <option value="">-- Please Select Year Group --</option>
                <option value="Early Primary">Early Primary</option>
                <option value="Upper Primary">Upper Primary</option>
                <option value="Secondary">Secondary</option>
              </select>
            </div>

            <div class="form-group">
              <label for="academicGoals">Academic Goals &amp; Priorities <span class="required">*</span></label>
              <textarea id="academicGoals" name="academicGoals" rows="4" required maxlength="1000" placeholder="Please describe upcoming examinations, assignment deadlines, or executive functioning goals..." class="form-textarea"></textarea>
            </div>

            <div class="form-group">
              <label for="preferredSchedule">Preferred Schedule / Timetable Availability</label>
              <input type="text" id="preferredSchedule" name="preferredSchedule" maxlength="500" placeholder="e.g. Weekday afternoons, Saturdays" class="form-input">
            </div>

            ${renderConsentCheckbox()}
            ${renderFormStatus('concierge-application-form')}

            <button type="submit" class="btn btn-primary btn-submit">Submit Concierge Application</button>
          </form>
        </div>
      </section>
    </div>
  `;

  return renderLayout({
    title: cng.title.text,
    description: cng.tagline.text,
    bodyHtml,
    currentPath: '/services/concierge'
  });
}

// 4. Individualised Learning Support (/services/specialist-support)
function renderSpecialistSupportPage() {
  const spec = content.services['specialist-support'];
  const bodyHtml = `
    <div class="page-header header-specialist">
      <div class="container">
        <span class="page-eyebrow">Differentiated Instruction</span>
        <h1>${escapeHtml(spec.title.text)}</h1>
        <p class="lead">${escapeHtml(spec.tagline.text)}</p>
      </div>
    </div>

    <div class="container content-container">
      <section class="content-block">
        <h2>About Individualised Learning Support</h2>
        <p>${escapeHtml(spec.overview.text)}</p>
      </section>

      <section class="form-section mt-5">
        <div class="form-card">
          <h2>Learning Needs Confidential Enquiry</h2>
          <div class="helper-box mb-4">
            <p><strong>Please Note:</strong> ${escapeHtml(spec.helperNotice.text)}</p>
          </div>

          <form id="learning-needs-form" class="app-form" data-form-type="learning-needs" novalidate>
            ${renderHoneypot()}

            <div class="form-group">
              <label for="parentName">Parent / Guardian Full Name <span class="required">*</span></label>
              <input type="text" id="parentName" name="parentName" required maxlength="100" class="form-input">
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="email">Contact Email <span class="required">*</span></label>
                <input type="email" id="email" name="email" required maxlength="150" class="form-input">
              </div>

              <div class="form-group">
                <label for="phone">Phone Number <span class="required">*</span></label>
                <input type="tel" id="phone" name="phone" required maxlength="25" placeholder="+1 (264) 555-0199" class="form-input">
              </div>
            </div>

            <div class="form-group">
              <label for="studentYearGroup">Student Year Group <span class="required">*</span></label>
              <select id="studentYearGroup" name="studentYearGroup" required class="form-select">
                <option value="">-- Please Select Year Group --</option>
                <option value="Early Primary">Early Primary</option>
                <option value="Upper Primary">Upper Primary</option>
                <option value="Secondary">Secondary</option>
              </select>
            </div>

            <div class="form-group">
              <label for="learningStrengths">Student Learning Strengths &amp; Interests <span class="required">*</span></label>
              <textarea id="learningStrengths" name="learningStrengths" rows="3" required maxlength="500" placeholder="e.g. Highly creative, visual learner, passionate about science..." class="form-textarea"></textarea>
            </div>

            <div class="form-group">
              <label for="areasForSupport">Areas Requiring Academic Support <span class="required">*</span></label>
              <textarea id="areasForSupport" name="areasForSupport" rows="3" required maxlength="500" placeholder="e.g. Executive functioning, homework organisation, structured reading routines..." class="form-textarea"></textarea>
            </div>

            <div class="form-group">
              <label for="preferredLearningEnvironment">Preferred Learning Environment</label>
              <input type="text" id="preferredLearningEnvironment" name="preferredLearningEnvironment" maxlength="500" placeholder="e.g. Quiet room, hands-on activities, frequent breaks" class="form-input">
            </div>

            ${renderConsentCheckbox()}
            ${renderFormStatus('learning-needs-form')}

            <button type="submit" class="btn btn-primary btn-submit">Submit Learning Support Enquiry</button>
          </form>
        </div>
      </section>
    </div>
  `;

  return renderLayout({
    title: spec.title.text,
    description: spec.tagline.text,
    bodyHtml,
    currentPath: '/services/specialist-support'
  });
}

// 5. Book Consultation (/book)
function renderBookPage() {
  const bk = content.bookPage;
  const bodyHtml = `
    <div class="page-header header-book">
      <div class="container">
        <h1>${escapeHtml(bk.title.text)}</h1>
        <p class="lead">${escapeHtml(bk.subhead.text)}</p>
      </div>
    </div>

    <div class="container content-container">
      <section class="form-section">
        <div class="form-card">
          <h2>Consultation Request Form</h2>
          <p class="form-intro">Select the service you are interested in and our team will get in touch to coordinate a suitable discussion time.</p>

          <form id="book-consultation-form" class="app-form" data-form-type="book-consultation" novalidate>
            ${renderHoneypot()}

            <div class="form-group">
              <label for="parentName">Parent / Guardian Full Name <span class="required">*</span></label>
              <input type="text" id="parentName" name="parentName" required maxlength="100" class="form-input">
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="email">Contact Email <span class="required">*</span></label>
                <input type="email" id="email" name="email" required maxlength="150" class="form-input">
              </div>

              <div class="form-group">
                <label for="phone">Phone Number <span class="required">*</span></label>
                <input type="tel" id="phone" name="phone" required maxlength="25" placeholder="+1 (264) 555-0199" class="form-input">
              </div>
            </div>

            <div class="form-group">
              <label for="serviceInterest">What are you interested in? <span class="required">*</span></label>
              <select id="serviceInterest" name="serviceInterest" required class="form-select">
                <option value="">-- Please Select Programme / Service --</option>
                ${bk.serviceOptions.map(opt => `<option value="${escapeHtml(opt)}">${escapeHtml(opt)}</option>`).join('')}
              </select>
            </div>

            <div class="form-group">
              <label for="studentYearGroup">Student Year Group <span class="required">*</span></label>
              <select id="studentYearGroup" name="studentYearGroup" required class="form-select">
                <option value="">-- Please Select Year Group --</option>
                ${bk.yearGroupOptions.map(yg => `<option value="${escapeHtml(yg)}">${escapeHtml(yg)}</option>`).join('')}
              </select>
            </div>

            <div class="form-group">
              <label for="additionalNotes">Additional Notes / Questions</label>
              <textarea id="additionalNotes" name="additionalNotes" rows="4" maxlength="1000" placeholder="Tell us about specific subjects, learning objectives, or questions..." class="form-textarea"></textarea>
            </div>

            <div id="book-readiness-attachment" class="readiness-attach-card" hidden>
              <p class="readiness-attach-heading"><strong>${escapeHtml(bk.readinessAttachHeading.text)}</strong></p>
              <p id="book-readiness-summary-preview" class="readiness-attach-preview" aria-live="polite"></p>
              <div class="form-group form-checkbox-group">
                <input type="checkbox" id="attachReadinessResult" class="form-checkbox">
                <label for="attachReadinessResult" class="checkbox-label">${escapeHtml(bk.readinessAttachCheckboxLabel.text)}</label>
              </div>
              <p class="readiness-attach-note"><small>${escapeHtml(bk.readinessAttachPrivacyNote.text)}</small></p>
            </div>

            ${renderConsentCheckbox()}
            ${renderFormStatus('book-consultation-form')}

            <button type="submit" class="btn btn-primary btn-submit">Request Consultation</button>
          </form>
        </div>
      </section>

      ${config.tutoringPrintableChecklist ? `
        <section class="content-block mt-5" id="consultation-checklist">
          <h3>Preparing for Your Initial Consultation</h3>
          <p>To help Teacher Cassie maximize your consultation discussion, consider gathering:</p>
          <ul class="feature-checklist mt-3">
            <li>Recent school reports or teacher feedback notes</li>
            <li>Sample homework or assessment papers (mathematics &amp; English)</li>
            <li>Key upcoming examination dates (e.g., CSEC, entrance exams)</li>
            <li>Summary of any classroom accommodations or learning preferences</li>
          </ul>
          <button type="button" id="btn-print-checklist" class="btn btn-secondary btn-sm mt-3">Print This Preparation Checklist</button>
        </section>
      ` : ''}
    </div>
  `;

  return renderLayout({
    title: bk.title.text,
    description: bk.subhead.text,
    bodyHtml,
    currentPath: '/book'
  });
}

// 8. Contact (/contact)
function renderContactPage() {
  const ct = content.contactPage;
  const whatsappNum = (process.env.WHATSAPP_PHONE_NUMBER || '').trim();
  const whatsappLink = whatsappNum ? `https://wa.me/${whatsappNum.replace(/[^0-9]/g, '')}` : '';

  const bodyHtml = `
    <div class="page-header header-contact">
      <div class="container">
        <h1>${escapeHtml(ct.title.text)}</h1>
        <p class="lead">${escapeHtml(ct.subhead.text)}</p>
      </div>
    </div>

    <div class="container content-container">
      <div class="contact-layout">
        <div class="contact-info-panel">
          <h2>Get in Touch</h2>
          <p>We welcome enquiries regarding tutoring schedules, concierge academic coaching, and Popcorn Math programmes.</p>

          ${whatsappLink ? `
            <div class="whatsapp-card mt-4">
              <div class="wa-icon" aria-hidden="true">💬</div>
              <h3>Chat Directly on WhatsApp</h3>
              <p>Quick questions or schedule enquiries? Message Teacher Cassie directly on WhatsApp.</p>
              <a href="${escapeHtml(whatsappLink)}" class="btn btn-whatsapp" target="_blank" rel="noopener noreferrer">${escapeHtml(ct.whatsappCta.text)}</a>
            </div>
          ` : ''}

          <div class="service-notice mt-4" data-todo="content">
            <h4>Locations &amp; Office Hours</h4>
            <p>Tutor Time and Popcorn Math operate on Anguilla. In-person Popcorn Math sessions are planned to run 1 hour weekly after school across primary school terms (8 to 10 weeks per series).</p>
            <p class="text-muted"><em>Confirmed office hours and mailing address will be published following owner confirmation.</em></p>
          </div>
        </div>

        <div class="contact-form-panel">
          <div class="form-card">
            <h2>Send a Message</h2>
            <form id="contact-form" class="app-form" data-form-type="contact" novalidate>
              ${renderHoneypot()}

              <div class="form-group">
                <label for="fullName">Full Name <span class="required">*</span></label>
                <input type="text" id="fullName" name="fullName" required maxlength="100" class="form-input">
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label for="email">Email Address <span class="required">*</span></label>
                  <input type="email" id="email" name="email" required maxlength="150" class="form-input">
                </div>

                <div class="form-group">
                  <label for="phone">Phone Number</label>
                  <input type="tel" id="phone" name="phone" maxlength="25" placeholder="+1 (264) 555-0199" class="form-input">
                </div>
              </div>

              <div class="form-group">
                <label for="subject">Subject <span class="required">*</span></label>
                <input type="text" id="subject" name="subject" required maxlength="150" placeholder="e.g. Tutoring enquiry, school workshop..." class="form-input">
              </div>

              <div class="form-group">
                <label for="message">Message <span class="required">*</span></label>
                <textarea id="message" name="message" rows="5" required maxlength="2000" placeholder="How can we assist you?" class="form-textarea"></textarea>
              </div>

              ${renderConsentCheckbox()}
              ${renderFormStatus('contact-form')}

              <button type="submit" class="btn btn-primary btn-submit">Send Message</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  `;

  return renderLayout({
    title: ct.title.text,
    description: ct.subhead.text,
    bodyHtml,
    currentPath: '/contact'
  });
}

// 9. FAQ (/faq)
function renderFaqPage() {
  const fq = content.faqPage;
  const bodyHtml = `
    <div class="page-header header-faq">
      <div class="container">
        <h1>${escapeHtml(fq.title.text)}</h1>
        <p class="lead">${escapeHtml(fq.subhead.text)}</p>
      </div>
    </div>

    <div class="container content-container">
      <section class="faq-accordion-section">
        <div class="accordion-list">
          ${fq.items.map((item, idx) => `
            <details class="accordion-item" ${idx === 0 ? 'open' : ''}>
              <summary class="accordion-header">
                <span class="faq-question">${escapeHtml(item.question.text)}</span>
                <span class="accordion-icon" aria-hidden="true">+</span>
              </summary>
              <div class="accordion-body">
                <p ${item.answer.todo ? 'data-todo="content"' : ''}>
                  ${escapeHtml(item.answer.text)}
                </p>
              </div>
            </details>
          `).join('')}
        </div>
      </section>
    </div>
  `;

  return renderLayout({
    title: fq.title.text,
    description: fq.subhead.text,
    bodyHtml,
    currentPath: '/faq'
  });
}

// 10. About (/about)
function renderAboutPage() {
  const ab = content.aboutPage;
  const bodyHtml = `
    <div class="page-header header-about">
      <div class="container">
        <h1>${escapeHtml(ab.title.text)}</h1>
        <p class="lead">${escapeHtml(ab.lead.text)}</p>
      </div>
    </div>

    <div class="container content-container">
      <section class="content-block">
        <h2>Our Mission</h2>
        <p>${escapeHtml(ab.mission.text)}</p>

        <h2 class="mt-4">Teacher Cassie &amp; Our Team</h2>
        <p>${escapeHtml(ab.biography.text)}</p>
        <p class="text-muted" data-todo="content"><em>${escapeHtml(ab.biographyPendingNote.text)}</em></p>

        <div class="cta-box mt-5">
          <h3>Learn More About Our Programmes</h3>
          <p>Explore how our tailored learning pathways inspire academic confidence and curiosity.</p>
          <a href="/services/popcorn-math" class="btn btn-primary">Discover Popcorn Math</a>
          <a href="/book" class="btn btn-secondary">Book a Consultation</a>
        </div>
      </section>
    </div>
  `;

  return renderLayout({
    title: ab.title.text,
    description: ab.lead.text,
    bodyHtml,
    currentPath: '/about'
  });
}

// 9. Smart Service Finder (/find-your-programme)
function renderServiceFinderPage(interestHint = null) {
  const fp = content.finderPage;
  const bodyHtml = `
    <div class="page-header header-finder">
      <div class="container text-center" data-canonical="Smart Service Finder">
        <span class="page-eyebrow">Interactive Guide</span>
        <h1>${escapeHtml(fp.headline.text)}</h1>
        <p class="lead">${escapeHtml(fp.subhead.text)}</p>
        <p class="finder-privacy-notice">${escapeHtml(fp.privacyNotice.text)}</p>
      </div>
    </div>

    <div class="container content-container">
      <div class="finder-card" id="finder-form-container" data-initial-hint="${escapeHtml(interestHint || '')}">
        <!-- Question 1 -->
        <fieldset class="finder-step" id="step-year-group">
          <legend class="finder-legend">1. What is your child's current year group?</legend>
          <div class="finder-options-grid">
            <label class="finder-option">
              <input type="radio" name="yearGroup" value="early-primary">
              <span class="option-label">Early Primary</span>
            </label>
            <label class="finder-option">
              <input type="radio" name="yearGroup" value="upper-primary" checked>
              <span class="option-label">Upper Primary</span>
            </label>
            <label class="finder-option">
              <input type="radio" name="yearGroup" value="secondary">
              <span class="option-label">Secondary</span>
            </label>
          </div>
        </fieldset>

        <!-- Question 2 -->
        <fieldset class="finder-step mt-4" id="step-support-wanted">
          <legend class="finder-legend">2. What support are you looking for?</legend>
          <div class="finder-options-grid">
            <label class="finder-option">
              <input type="radio" name="supportWanted" value="maths" checked>
              <span class="option-label">Improving mathematics skills</span>
            </label>
            <label class="finder-option">
              <input type="radio" name="supportWanted" value="reading-writing">
              <span class="option-label">Reading and writing support</span>
            </label>
            <label class="finder-option">
              <input type="radio" name="supportWanted" value="homework-assistance">
              <span class="option-label">Homework and assignment assistance</span>
            </label>
            <label class="finder-option">
              <input type="radio" name="supportWanted" value="exam-prep">
              <span class="option-label">Exam preparation</span>
            </label>
            <label class="finder-option">
              <input type="radio" name="supportWanted" value="organisation">
              <span class="option-label">Organisation and study skills</span>
            </label>
            <label class="finder-option">
              <input type="radio" name="supportWanted" value="learning-support">
              <span class="option-label">Learning support for ADHD or dyslexia</span>
            </label>
            <label class="finder-option">
              <input type="radio" name="supportWanted" value="enrichment">
              <span class="option-label">Enrichment and confidence building</span>
            </label>
          </div>
        </fieldset>

        <!-- Question 3 -->
        <fieldset class="finder-step mt-4" id="step-level-support">
          <legend class="finder-legend">3. What level of support do you need?</legend>
          <div class="finder-options-grid">
            <label class="finder-option">
              <input type="radio" name="levelOfSupport" value="occasional">
              <span class="option-label">Occasional academic assistance</span>
            </label>
            <label class="finder-option">
              <input type="radio" name="levelOfSupport" value="weekly" checked>
              <span class="option-label">Weekly tutoring</span>
            </label>
            <label class="finder-option">
              <input type="radio" name="levelOfSupport" value="comprehensive">
              <span class="option-label">Comprehensive academic management</span>
            </label>
            <label class="finder-option">
              <input type="radio" name="levelOfSupport" value="group">
              <span class="option-label">Group learning experiences</span>
            </label>
          </div>
        </fieldset>

        <div class="finder-actions mt-5">
          <button type="button" id="btn-find-recommendation" class="btn btn-primary btn-large">Find My Recommendation &rarr;</button>
        </div>

        <!-- Dynamic Recommendation Card (announced via aria-live) -->
        <div id="finder-recommendation" class="finder-recommendation mt-5" style="display:none;" aria-live="polite" role="region" aria-label="Recommendation result">
          <div class="recommendation-badge" id="rec-badge">Best Match</div>
          <h2 id="rec-title">We Recommend Popcorn Math!</h2>
          <p class="rec-reason" id="rec-reason"></p>
          <div class="rec-cta mt-4">
            <a id="rec-cta-link" href="/services/popcorn-math" class="btn btn-primary btn-large">Explore Recommended Service</a>
            <a href="/book" class="btn btn-secondary btn-large">Book a Consultation</a>
          </div>
        </div>
      </div>
    </div>
  `;

  return renderLayout({
    title: fp.title.text,
    description: fp.subhead.text,
    bodyHtml,
    currentPath: '/find-your-programme',
    extraScripts: ['/js/finder.js']
  });
}

// 10. Educational Resources (/resources)
function renderResourcesPage() {
  const rp = content.resourcesPage;
  const bodyHtml = `
    <div class="page-header header-resources">
      <div class="container" data-canonical="Educational Resources">
        <span class="page-eyebrow">Resources</span>
        <h1>${escapeHtml(rp.headline.text)}</h1>
        <p class="lead">${escapeHtml(rp.details.text)}</p>
      </div>
    </div>

    <div class="container content-container">
      <section class="content-block">
        <div class="service-grid">
          <div class="service-card">
            <h3>CPEA Readiness Check</h3>
            <p>Separate 10-question Mathematics and Language Arts sample practice tracks with instant feedback and printable summaries.</p>
            <a href="/readiness-check" class="btn btn-primary">Try Readiness Check</a>
          </div>
          <div class="service-card">
            <h3>Popcorn Math Play &amp; Learn</h3>
            <p>A short, kid-friendly math teaser game to warm up number skills.</p>
            <a href="/popcorn-math/play" class="btn btn-secondary">Play Mini-Game</a>
          </div>
          <div class="service-card">
            <h3>Smart Service Finder</h3>
            <p>Answer three quick questions to find the best Tutor Time or Popcorn Math pathway for your child.</p>
            <a href="/find-your-programme" class="btn btn-secondary">Find Your Programme</a>
          </div>
        </div>
        <div class="helper-box mt-4" data-todo="content">
          <p>${escapeHtml(rp.downloadablesPendingNote.text)}</p>
        </div>
        <div class="cta-box mt-4">
          <h3>Explore Our Current Programmes</h3>
          <p>Discover our core academic tutoring, concierge coaching, and interactive Popcorn Math sessions.</p>
          <a href="/services/popcorn-math" class="btn btn-primary">Popcorn Math</a>
          <a href="/book" class="btn btn-secondary">Book a Consultation</a>
        </div>
      </section>
    </div>
  `;

  return renderLayout({
    title: rp.title.text,
    description: rp.headline.text,
    bodyHtml,
    currentPath: '/resources'
  });
}

// 15. CPEA Readiness Check (/readiness-check)
function renderReadinessCheckPage() {
  const isEnabled = config.features?.readinessCheck?.enabled ?? true;
  if (!isEnabled) {
    return renderLayout({
      title: 'Readiness Check Unavailable',
      description: 'The CPEA Readiness Check is currently unavailable.',
      bodyHtml: `
        <div class="container py-12 text-center">
          <h1>Readiness Check Unavailable</h1>
          <p>This module is currently taking a break. Please check back soon or <a href="/book">book a consultation</a> with Teacher Cassie.</p>
        </div>
      `,
      currentPath: '/readiness-check'
    });
  }

  const activeQuestions = getActiveQuestions();
  const rp = content.readinessPage;

  const bodyHtml = `
    <div class="readiness-page-wrapper">
      <header class="readiness-hero-section">
        <div class="container text-center">
          <div class="readiness-official-disclaimer-pill" role="note">
            <span>⚠️ Sample questions: not an official CPEA paper.</span>
          </div>
          <h1 class="readiness-page-title">CPEA Exam Readiness Check</h1>
          <p class="readiness-page-subhead">${escapeHtml(rp.subhead.text)}</p>

          <div class="readiness-mascot-row">
            <!-- TODO(mascot): Final cartoon of Kashamar will be swapped in here -->
            ${renderGuideMascot({ expression: 'happy', size: 88, id: 'readiness-mascot' })}
            ${renderSpeechBubble({ text: "Welcome! Pick Mathematics or Language Arts to try 10 sample questions together.", id: 'readiness-speech-text' })}
          </div>

          <div class="readiness-stars-container" aria-label="Progress star trail">
            <div id="readiness-stars-trail" class="stars-trail"></div>
          </div>
        </div>
      </header>

      <div class="container readiness-main-container">
        <div id="readiness-live-announcer" class="sr-only" aria-live="polite"></div>
        <div id="readiness-card" class="readiness-card">
          <div id="readiness-subject-picker" class="readiness-picker" role="region" aria-label="Choose Readiness Check Subject">
            <h2 class="readiness-picker-title">${escapeHtml(rp.pickerHeading.text)}</h2>
            <p class="readiness-picker-subhead">${escapeHtml(rp.pickerSubhead.text)}</p>
            <div class="readiness-picker-grid">
              <button type="button" class="readiness-subject-card subject-card-math" data-start-subject="Mathematics">
                <span class="subject-card-icon" aria-hidden="true">🔢</span>
                <span class="subject-card-title">Mathematics</span>
                <span class="subject-card-meta">10 Sample Questions &bull; Instant Feedback</span>
                <span class="subject-card-desc">${escapeHtml(rp.mathCardDesc.text)}</span>
                <span class="btn btn-primary subject-card-cta">Start Mathematics Check &rarr;</span>
              </button>
              <button type="button" class="readiness-subject-card subject-card-la" data-start-subject="Language Arts">
                <span class="subject-card-icon" aria-hidden="true">📚</span>
                <span class="subject-card-title">Language Arts</span>
                <span class="subject-card-meta">10 Sample Questions &bull; Instant Feedback</span>
                <span class="subject-card-desc">${escapeHtml(rp.laCardDesc.text)}</span>
                <span class="btn btn-primary subject-card-cta">Start Language Arts Check &rarr;</span>
              </button>
            </div>
            <p class="readiness-picker-privacy"><small>Practice happens in your browser only &mdash; no scores are saved automatically.</small></p>
          </div>
          <noscript>
            <div class="service-notice">
              <p>Please enable JavaScript to enjoy the interactive CPEA Readiness Check.</p>
            </div>
          </noscript>
        </div>
      </div>

      <script type="application/json" id="readiness-questions-data">
        ${JSON.stringify(activeQuestions)}
      </script>
      <script type="application/json" id="readiness-recommendations-data">
        ${JSON.stringify(getClientRuleConfig())}
      </script>
    </div>
  `;

  return renderLayout({
    title: 'CPEA Readiness Check (Mathematics & Language Arts Samples)',
    description: 'Sample practice questions for Mathematics and Language Arts (10 questions per track) for Caribbean primary students.',
    bodyHtml,
    currentPath: '/readiness-check',
    extraScripts: ['/js/readiness.js']
  });
}

// 12. Branded 404 Not Found Page
function renderNotFoundPage(requestedPath = '') {
  const safePath = escapeHtml(requestedPath || '/');
  const bodyHtml = `
    <div class="page-header">
      <div class="container text-center">
        <span class="page-eyebrow">404 &bull; Page Not Found</span>
        <h1>We Couldn&rsquo;t Find That Page</h1>
        <p class="lead">The page <code>${safePath}</code> doesn&rsquo;t exist or may have moved.</p>
      </div>
    </div>

    <div class="container content-container text-center">
      <section class="content-block">
        <p>Here are the best places to continue exploring Tutor Time with Teacher Cassie and Popcorn Math:</p>
        <div class="hero-ctas justify-center mt-4">
          <a href="/" class="btn btn-primary">Return Home</a>
          <a href="/services/popcorn-math" class="btn btn-secondary">Explore Popcorn Math</a>
          <a href="/find-your-programme" class="btn btn-secondary">Find Your Programme</a>
          <a href="/book" class="btn btn-secondary">Book a Consultation</a>
        </div>
      </section>
    </div>
  `;

  return renderLayout({
    title: 'Page Not Found',
    description: 'The requested page could not be found on Tutor Time with Teacher Cassie.',
    bodyHtml,
    currentPath: ''
  });
}

module.exports = {
  renderHomePage,
  renderTraditionalTutoringPage,
  renderConciergePage,
  renderSpecialistSupportPage,
  renderBookPage,
  renderContactPage,
  renderFaqPage,
  renderAboutPage,
  renderServiceFinderPage,
  renderResourcesPage,
  renderReadinessCheckPage,
  renderNotFoundPage
};

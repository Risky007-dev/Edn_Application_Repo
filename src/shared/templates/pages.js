/**
 * Page View Renderers
 * Generates semantic, accessible, mobile-first HTML for all Phase 1 pages.
 * Text is dynamically retrieved from src/shared/content, output-escaped,
 * and structured with ARIA attributes and visible labels.
 */

const content = require('../content');
const config = require('../config');
const { escapeHtml, renderLayout } = require('./layout');

// Helper for consent checkbox
function renderConsentCheckbox() {
  return `
    <div class="form-group form-checkbox-group">
      <input type="checkbox" id="consent" name="consent" required class="form-checkbox">
      <label for="consent" class="checkbox-label" data-todo="legal">
        ${escapeHtml(content.global.privacyNote.text)}
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
    <section class="hero-section">
      <div class="hero-container">
        <h1 class="hero-headline">${escapeHtml(hp.headline.text)}</h1>
        <p class="hero-tagline">${escapeHtml(hp.tagline.text)}</p>
        <p class="hero-subhead">${escapeHtml(hp.subhead.text)}</p>

        <div class="hero-ctas">
          <a href="/book" class="btn btn-primary btn-large">${escapeHtml(hp.ctaBook.text)}</a>
          <a href="#programmes" class="btn btn-secondary btn-large">${escapeHtml(hp.ctaExplore.text)}</a>
        </div>
      </div>
    </section>

    <section id="programmes" class="programmes-section">
      <div class="container">
        <div class="section-header">
          <h2>Our Core Educational Pathways</h2>
          <p>Personalised learning experiences designed to inspire confidence and real results.</p>
        </div>

        <div class="programme-grid">
          ${hp.options.map(opt => `
            <article class="programme-card card-${escapeHtml(opt.key)}">
              <div class="card-icon" aria-hidden="true">${opt.icon}</div>
              <h3 class="card-title">${escapeHtml(opt.title.text)}</h3>
              <h4 class="card-subtitle">${escapeHtml(opt.name.text)}</h4>
              <p class="card-desc">${escapeHtml(opt.desc.text)}</p>
              <a href="${escapeHtml(opt.href)}" class="btn btn-card">${escapeHtml(opt.cta.text)} &rarr;</a>
            </article>
          `).join('')}
        </div>
      </div>
    </section>

    <!-- Smart Service Finder Banner Card -->
    <section class="finder-cta-section">
      <div class="container">
        <div class="finder-cta-card">
          <div class="finder-cta-content">
            <span class="badge-accent">Interactive Tool</span>
            <h2>Not Sure Which Programme Is Right for Your Child?</h2>
            <p>Answer three quick questions to discover the most relevant educational programme for your child.</p>
          </div>
          <div class="finder-cta-action">
            <a href="/find-your-programme" class="btn btn-primary btn-large">Try Programme Finder &rarr;</a>
          </div>
        </div>
      </div>
    </section>

    <section class="interest-section">
      <div class="container interest-container">
        <div class="interest-copy">
          <h3>${escapeHtml(content.homepage.subscribeSection.title.text)}</h3>
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
    currentPath: '/'
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

// 4. Popcorn Math (/services/popcorn-maths)
function renderPopcornMathsPage() {
  const pop = content.services['popcorn-maths'];
  const bodyHtml = `
    <div class="page-header header-popcorn">
      <div class="container">
        <div class="popcorn-badge" aria-hidden="true">🍿 Popcorn Math</div>
        <h1>${escapeHtml(pop.title.text)}</h1>
        <p class="lead">${escapeHtml(pop.headline.text)}</p>
        <p class="sublead">${escapeHtml(pop.tagline.text)}</p>
      </div>
    </div>

    <div class="container content-container">
      <section class="content-block text-center">
        <img src="/assets/logos/popcorn-math-logo.png" alt="Popcorn Math Logo" class="popcorn-logo-display" width="360" height="216">
        <p class="lead mt-4">${escapeHtml(pop.overview.text)}</p>
      </section>

      <section class="cta-cards-section mt-5">
        <div class="cta-cards-grid">
          <div class="cta-card">
            <div class="cta-card-icon" aria-hidden="true">🍿</div>
            <h3>Join a Session</h3>
            <p>Interactive group mathematics workshops designed to build fluency, problem solving, and confidence.</p>
            <a href="${escapeHtml(pop.ctaSession.href)}" class="btn btn-primary">${escapeHtml(pop.ctaSession.text)}</a>
          </div>

          <div class="cta-card">
            <div class="cta-card-icon" aria-hidden="true">🏫</div>
            <h3>School Partnerships</h3>
            <p>Bring our high-energy mathematics workshops, enrichment days, or after-school clubs directly to your school.</p>
            <a href="${escapeHtml(pop.ctaSchool.href)}" class="btn btn-secondary">${escapeHtml(pop.ctaSchool.text)}</a>
          </div>

          <div class="cta-card">
            <div class="cta-card-icon" aria-hidden="true">🎤</div>
            <h3>Become a Presenter</h3>
            <p>Energetic educators, university students, and facilitators wanted to help bring Popcorn Math to life!</p>
            <a href="${escapeHtml(pop.ctaPresenter.href)}" class="btn btn-accent">${escapeHtml(pop.ctaPresenter.text)}</a>
          </div>
        </div>
      </section>

      ${config.popcornLocationDirectory ? `
        <section class="content-block mt-5" id="locations">
          <h2>Find a Popcorn Math Session Near You</h2>
          <p>Choose your community or select our online cohort to see current session schedules and availability.</p>

          <div class="form-group mt-3" style="max-width: 480px; margin-left: auto; margin-right: auto;">
            <label for="popcorn-location-select">Select Location / Community:</label>
            <select id="popcorn-location-select" class="form-select" data-locations="${escapeHtml(JSON.stringify(content.popcornLocations || []))}">
              <option value="">-- Choose a Community / Cohort --</option>
              ${(content.popcornLocations || []).map(loc => `<option value="${escapeHtml(loc.id)}">${escapeHtml(loc.name)}</option>`).join('')}
            </select>

            <div id="location-details" class="mt-4" style="display:none;" aria-live="polite" role="region" aria-label="Selected location details">
              <h3 id="loc-title"></h3>
              <p><strong>Venue:</strong> <span id="loc-venue"></span></p>
              <p><strong>Schedule:</strong> <span id="loc-schedule"></span></p>
              <p><strong>Ages:</strong> <span id="loc-ages"></span></p>
              <p><strong>Status:</strong> <span id="loc-status" class="badge"></span></p>
              <a id="loc-cta" href="/book?service=popcorn-maths" class="btn btn-primary btn-sm mt-2">Enquire for This Location</a>
            </div>
          </div>
        </section>
      ` : ''}
    </div>
  `;

  return renderLayout({
    title: pop.title.text,
    description: pop.tagline.text,
    bodyHtml,
    currentPath: '/services/popcorn-maths'
  });
}

// 5. Individualised Learning Support (/services/specialist-support)
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

// 6. Popcorn Math Presenter Recruitment (/popcorn-maths/presenter)
function renderPresenterPage() {
  const prs = content.presenter;
  const bodyHtml = `
    <div class="page-header header-presenter">
      <div class="container">
        <span class="badge badge-hiring">${escapeHtml(prs.badge.text)}</span>
        <h1>${escapeHtml(prs.title.text)}</h1>
        <p class="lead">${escapeHtml(prs.tagline.text)}</p>
      </div>
    </div>

    <div class="container content-container">
      <section class="content-block">
        <p class="lead">${escapeHtml(prs.lead.text)}</p>
        <p>${escapeHtml(prs.description.text)}</p>

        <h3 class="mt-4">${escapeHtml(prs.whoWeLookForTitle.text)}</h3>
        <ul class="feature-checklist">
          ${prs.qualities.map(q => `<li><span class="check-icon" aria-hidden="true">✓</span> ${escapeHtml(q.text)}</li>`).join('')}
        </ul>

        <h3 class="mt-4">${escapeHtml(prs.whatWeOfferTitle.text)}</h3>
        <p data-todo="content">${escapeHtml(prs.whatWeOfferContent.text)}</p>
      </section>

      <section class="form-section mt-5" id="apply">
        <div class="form-card">
          <h2>Presenter Application Form</h2>
          <p class="form-intro">Apply to join our enthusiastic mathematics presentation team.</p>

          <form id="presenter-application-form" class="app-form" data-form-type="presenter-application" novalidate>
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
                <label for="phone">Phone Number <span class="required">*</span></label>
                <input type="tel" id="phone" name="phone" required maxlength="25" placeholder="+1 (264) 555-0199" class="form-input">
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="location">Location (Island / Country) <span class="required">*</span></label>
                <input type="text" id="location" name="location" required maxlength="100" placeholder="e.g. Anguilla" class="form-input">
              </div>

              <div class="form-group">
                <label for="preferredRole">Preferred Role</label>
                <select id="preferredRole" name="preferredRole" class="form-select">
                  <option value="Presenter">Presenter</option>
                  <option value="Assistant Presenter">Assistant Presenter</option>
                </select>
              </div>
            </div>

            <div class="form-group">
              <label for="educationalBackground">Educational Background <span class="required">*</span></label>
              <textarea id="educationalBackground" name="educationalBackground" rows="3" required maxlength="500" placeholder="Qualifications, relevant study, or teaching background..." class="form-textarea"></textarea>
            </div>

            <div class="form-group">
              <label for="experienceWithChildren">Experience Working With Children <span class="required">*</span></label>
              <textarea id="experienceWithChildren" name="experienceWithChildren" rows="3" required maxlength="500" placeholder="Describe previous teaching, youth work, or tutoring experience..." class="form-textarea"></textarea>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="mathConfidence">Mathematics Confidence</label>
                <select id="mathConfidence" name="mathConfidence" class="form-select">
                  <option value="High">High - Very confident across curriculum</option>
                  <option value="Moderate">Moderate - Strong primary/foundational skills</option>
                  <option value="Foundational">Foundational</option>
                </select>
              </div>

              <div class="form-group">
                <label for="availability">Availability <span class="required">*</span></label>
                <input type="text" id="availability" name="availability" required maxlength="250" placeholder="e.g. Weekday afternoons, weekends, holidays" class="form-input">
              </div>
            </div>

            <div class="form-group">
              <label for="whyPopcornMath">Why Popcorn Math? <span class="required">*</span></label>
              <textarea id="whyPopcornMath" name="whyPopcornMath" rows="4" required maxlength="1000" placeholder="Tell us why you would like to be part of our dynamic team..." class="form-textarea"></textarea>
            </div>

            <!-- CV Upload via Presigned S3 POST flow -->
            <div class="form-group cv-upload-group">
              <label for="cvFile">Upload Curriculum Vitae (PDF only, max 5 MB)</label>
              <input type="file" id="cvFile" accept=".pdf,application/pdf" class="form-file-input">
              <input type="hidden" id="cvUploadKey" name="cvUploadKey">
              <p class="file-helper-text">Select your CV in PDF format. It will be securely uploaded before submitting.</p>
              <div id="cv-upload-status" class="upload-status" aria-live="polite"></div>
            </div>

            <!-- 18+ Age Confirmation Checkbox -->
            <div class="form-group form-checkbox-group">
              <input type="checkbox" id="ageConfirmation" name="ageConfirmation" required class="form-checkbox">
              <label for="ageConfirmation" class="checkbox-label">
                <strong>I confirm that I am 18 years of age or older. <span class="required">*</span></strong>
              </label>
            </div>

            ${renderConsentCheckbox()}
            ${renderFormStatus('presenter-application-form')}

            <button type="submit" class="btn btn-primary btn-submit">Submit Application</button>
          </form>
        </div>
      </section>
    </div>
  `;

  return renderLayout({
    title: prs.title.text,
    description: prs.tagline.text,
    bodyHtml,
    currentPath: '/popcorn-maths/presenter'
  });
}

// 7. Book Consultation (/book)
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
            <h4>Office Hours &amp; Locations</h4>
            <p>${escapeHtml(content.global.detailsComingSoon.text)}</p>
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
        <p data-todo="content">${escapeHtml(ab.mission.text)}</p>

        <h2 class="mt-4">Teacher Cassie &amp; Our Team</h2>
        <p data-todo="content">${escapeHtml(ab.biography.text)}</p>

        <div class="cta-box mt-5">
          <h3>Learn More About Our Programmes</h3>
          <p>Explore how our tailored learning pathways inspire academic confidence and curiosity.</p>
          <a href="/services/popcorn-maths" class="btn btn-primary">Discover Popcorn Math</a>
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

// 11. TT-13 Popcorn Math Mini-Game (/popcorn-maths/game)
function renderPopcornGamePage() {
  const gp = content.gamePage;
  const bodyHtml = `
    <div class="page-header header-game">
      <div class="container text-center" data-canonical="Popcorn Math Mini-Game">
        <span class="page-eyebrow">Play &amp; Learn</span>
        <h1>${escapeHtml(gp.headline.text)}</h1>
        <p class="hero-tagline">${escapeHtml(gp.subhead.text)}</p>
        <p class="game-privacy-notice">${escapeHtml(gp.privacyNotice.text)}</p>
      </div>
    </div>

    <div class="container game-container">
      <!-- Mascot Placeholder (No custom mascot or logo variation created) -->
      <div class="mascot-placeholder" data-todo="mascot" aria-label="Mascot artwork placeholder">
        <div class="placeholder-box">
          <span class="placeholder-icon">🍿</span>
          <span class="placeholder-text">Mascot Placeholder</span>
        </div>
      </div>

      <!-- Popcorn Bucket Animation Track -->
      <div class="bucket-stage" aria-label="Popcorn bucket tracker">
        <div class="bucket-visual-wrapper">
          <svg class="popcorn-bucket-svg" viewBox="0 0 160 160" width="140" height="140" aria-hidden="true" role="img">
            <defs>
              <linearGradient id="gameBucketGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#E62B25" />
                <stop offset="100%" stop-color="#C51B15" />
              </linearGradient>
            </defs>
            <polygon points="35,50 125,50 110,145 50,145" fill="url(#gameBucketGrad)" stroke="#A0120D" stroke-width="3" />
            <line x1="57" y1="50" x2="65" y2="145" stroke="#FFFFFF" stroke-width="6" opacity="0.85" />
            <line x1="80" y1="50" x2="80" y2="145" stroke="#FFFFFF" stroke-width="6" opacity="0.85" />
            <line x1="103" y1="50" x2="95" y2="145" stroke="#FFFFFF" stroke-width="6" opacity="0.85" />
          </svg>
          <div class="bucket-slots" id="bucket-slots" aria-hidden="true">
            <span class="kernel-item" id="kernel-1">🍿</span>
            <span class="kernel-item" id="kernel-2">🍿</span>
            <span class="kernel-item" id="kernel-3">🍿</span>
          </div>
        </div>
      </div>

      <!-- Feedback Area (Announced via aria-live, never color alone) -->
      <div id="game-feedback" class="game-feedback" aria-live="polite" role="status"></div>

      ${config.popcornGameMultiLevel ? `
        <div class="game-level-selector text-center mb-3">
          <label for="game-level-select">Select Difficulty Level:</label>
          <select id="game-level-select" class="form-select" style="display:inline-block; width:auto; max-width:100%;">
            <option value="kernels">Little Kernels (Ages 4–6: Addition)</option>
            <option value="poppers" selected>Popping Poppers (Ages 7–9: Times Tables)</option>
            <option value="crunch">Mega Crunch (Ages 10–12: Mental Arithmetic)</option>
          </select>
        </div>
      ` : ''}

      <!-- Active Quiz Card -->
      <div id="game-arena" class="game-arena">
        <div class="game-card">
          <div class="question-tracker" id="question-tracker">Question 1 of 3</div>
          <div class="question-prompt" id="question-prompt">What is 8 &times; 7?</div>
          <div class="answers-grid" id="answers-grid" role="group" aria-label="Answer options">
            <!-- Rendered and updated dynamically by game.js in-memory -->
          </div>
        </div>
      </div>

      <!-- Popcorn Math Star Completion Screen (Shown when 3 answers correct) -->
      <div id="game-star-screen" class="game-star-screen" style="display:none;" role="region" aria-label="Game completion">
        <div class="star-badge" aria-hidden="true">🎉</div>
        <h2>${escapeHtml(gp.starTitle.text)}</h2>
        <p class="lead">${escapeHtml(gp.starLead.text)}</p>
        <div class="star-actions">
          <a href="/services/popcorn-maths" class="btn btn-primary btn-large">${escapeHtml(gp.starCta.text)}</a>
          <button type="button" id="btn-play-again" class="btn btn-secondary btn-large">Play Again</button>
        </div>
      </div>
    </div>
  `;

  return renderLayout({
    title: gp.title.text,
    description: gp.subhead.text,
    bodyHtml,
    currentPath: '/popcorn-maths/game',
    extraScripts: ['/js/game.js']
  });
}

// 12. TT-14 Smart Service Finder (/find-your-programme)
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
            <a id="rec-cta-link" href="/services/popcorn-maths" class="btn btn-primary btn-large">Explore Recommended Service</a>
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

// 13. TT-15 School Partnership Enquiry Form (/popcorn-maths/school-partnership)
function renderSchoolPartnershipPage() {
  const sp = content.schoolEnquiryPage;
  const bodyHtml = `
    <div class="page-header header-school">
      <div class="container" data-canonical="School Partnerships">
        <span class="page-eyebrow">School Partnerships</span>
        <h1>${escapeHtml(sp.headline.text)}</h1>
        <p class="hero-tagline">${escapeHtml(sp.tagline.text)}</p>
        <p class="lead">${escapeHtml(sp.overview.text)}</p>
      </div>
    </div>

    <div class="container content-container">
      <section class="offerings-section">
        <h2>School Engagement Programmes</h2>
        <div class="programme-grid mt-4">
          <div class="programme-card">
            <h3>In-School Workshops</h3>
            <p>High-energy interactive mathematics workshops delivered directly in classrooms, aligned with core curriculum themes.</p>
          </div>
          <div class="programme-card">
            <h3>After-School Clubs</h3>
            <p>Weekly mathematics clubs combining hands-on challenges and game-based learning to build confidence and fluency.</p>
          </div>
          <div class="programme-card">
            <h3>Enrichment &amp; Special Events</h3>
            <p>Custom mathematics enrichment days, festival challenges, and collaborative school-wide problem-solving events.</p>
          </div>
        </div>
      </section>

      <section class="form-section mt-5" id="enquiry-form">
        <div class="form-header">
          <h2>Request a School Programme</h2>
          <p class="service-notice"><strong>Please note:</strong> ${escapeHtml(sp.disclaimer.text)}</p>
        </div>

        <form id="school-enquiry-form" class="form-card" data-form-type="school-enquiry" method="POST" action="/api/forms/school-enquiry" novalidate>
          <div class="form-row">
            <div class="form-group">
              <label for="schoolName">School Name *</label>
              <input type="text" id="schoolName" name="schoolName" required class="form-input" placeholder="e.g. Valley Primary School">
            </div>
            <div class="form-group">
              <label for="contactPerson">Contact Person *</label>
              <input type="text" id="contactPerson" name="contactPerson" required class="form-input" placeholder="Your full name">
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="roleTitle">Role Title *</label>
              <input type="text" id="roleTitle" name="roleTitle" required class="form-input" placeholder="e.g. Principal, Head of Mathematics">
            </div>
            <div class="form-group">
              <label for="locationDistrict">Location / District *</label>
              <input type="text" id="locationDistrict" name="locationDistrict" required class="form-input" placeholder="e.g. West End, Anguilla">
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="email">Work Email *</label>
              <input type="email" id="email" name="email" required class="form-input" placeholder="contact@school.edu">
            </div>
            <div class="form-group">
              <label for="phone">Phone Number *</label>
              <input type="tel" id="phone" name="phone" required class="form-input" placeholder="+1 (264) ...">
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="studentAgeGroup">Student Age Group *</label>
              <select id="studentAgeGroup" name="studentAgeGroup" required class="form-select">
                <option value="8-10">Ages 8–10 (Lower Key Stage / Primary)</option>
                <option value="11-13">Ages 11–13 (Upper Primary / Middle)</option>
                <option value="Mixed">Mixed Age Groups</option>
              </select>
            </div>
            <div class="form-group">
              <label for="estimatedStudentCount">Estimated Student Count (10 to 500) *</label>
              <input type="number" id="estimatedStudentCount" name="estimatedStudentCount" required min="10" max="500" class="form-input" placeholder="e.g. 45">
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="programmeType">Programme Type *</label>
              <select id="programmeType" name="programmeType" required class="form-select">
                <option value="Workshop">In-School Workshop</option>
                <option value="After-school club">After-School Club</option>
                <option value="Event">Special Mathematics Event</option>
              </select>
            </div>
            <div class="form-group">
              <label for="targetDate">Target / Preferred Date (Optional)</label>
              <input type="text" id="targetDate" name="targetDate" class="form-input" placeholder="e.g. November 2026 or Term 2">
            </div>
          </div>

          <div class="form-group">
            <label for="message">Additional Requirements or Details (Optional, max 500 characters)</label>
            <textarea id="message" name="message" rows="4" maxlength="500" class="form-textarea" placeholder="Tell us about your school's goals or scheduling preferences..."></textarea>
          </div>

          ${renderConsentCheckbox()}
          ${renderHoneypot()}

          <button type="submit" class="btn btn-primary btn-submit">Submit School Enquiry</button>
          ${renderFormStatus('school-enquiry')}
        </form>
      </section>
    </div>
  `;

  return renderLayout({
    title: sp.title.text,
    description: sp.overview.text,
    bodyHtml,
    currentPath: '/popcorn-maths/school-partnership'
  });
}

// 14. TT-16 Resources Page Stub (/resources)
function renderResourcesPage() {
  const rp = content.resourcesPage;
  const bodyHtml = `
    <div class="page-header header-resources">
      <div class="container" data-canonical="Educational Resources">
        <span class="page-eyebrow">Resources</span>
        <h1>${escapeHtml(rp.headline.text)}</h1>
        <p class="lead" data-todo="content">${escapeHtml(rp.details.text)}</p>
      </div>
    </div>

    <div class="container content-container">
      <section class="content-block">
        <div class="helper-box">
          <p data-todo="content">${escapeHtml(rp.details.text)}</p>
        </div>
        <div class="cta-box mt-4">
          <h3>Explore Our Current Programmes</h3>
          <p>Discover our core academic tutoring, concierge coaching, and interactive Popcorn Math sessions.</p>
          <a href="/services/popcorn-maths" class="btn btn-primary">Popcorn Math</a>
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

module.exports = {
  renderHomePage,
  renderTraditionalTutoringPage,
  renderConciergePage,
  renderPopcornMathsPage,
  renderSpecialistSupportPage,
  renderPresenterPage,
  renderBookPage,
  renderContactPage,
  renderFaqPage,
  renderAboutPage,
  renderPopcornGamePage,
  renderServiceFinderPage,
  renderSchoolPartnershipPage,
  renderResourcesPage
};

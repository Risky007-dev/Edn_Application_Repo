/**
 * Popcorn Math Rebuild - Complete Modular View Renderers
 * Built strictly according to the Nov 8 brief and docs/POPCORN_MATH_SPEC.md.
 * Brand colors: Popcorn Yellow (#F5A623), Warm Kernel (#F8E71C), Navy (#1A365D), Plum (#3D1E6D).
 * Mascot: Popcorn bucket character with arms and legs (renderBucketMascot).
 */

const { escapeHtml, renderLayout } = require('../shared/templates/layout');
const { renderBucketMascot } = require('../shared/components/mascotBucket');
const { POPCORN_SCHOOLS } = require('../shared/content/popcornSchools');
const CONTENT = require('../shared/content');
const config = require('../shared/config');

function getWhatsAppHref() {
  const num = (process.env.WHATSAPP_PHONE_NUMBER || '+12647295791').trim();
  const digits = num.replace(/[^0-9]/g, '');
  return digits ? `https://wa.me/${digits}` : 'https://wa.me/12647295791';
}

function getContactEmail() {
  return (process.env.CONTACT_EMAIL || 'hello@popcornmaths.com').trim();
}

function renderConsentBox() {
  return `
    <div class="form-group form-checkbox-group">
      <input type="checkbox" id="consent" name="consent" required class="form-checkbox">
      <label for="consent" class="checkbox-label">
        I agree to the processing of my details in accordance with the <a href="/privacy" target="_blank" rel="noopener">Privacy Policy</a>.
      </label>
    </div>
  `;
}

function renderHoneypot() {
  return `
    <div class="form-honeypot" style="display:none;" aria-hidden="true">
      <label for="_gotcha">Leave this field blank</label>
      <input type="text" id="_gotcha" name="_gotcha" tabindex="-1" autocomplete="off">
    </div>
  `;
}

// 1. Popcorn Math Landing Hub (/services/popcorn-math)
function renderPopcornHubPage() {
  const bodyHtml = `
    <div class="popcorn-hub-wrapper">
      <!-- Hero Section -->
      <header class="popcorn-hero">
        <div class="container popcorn-hero-container">
          <div class="popcorn-hero-copy">
            <span class="badge-popcorn">In-Person After-School Math Fun</span>
            <h1 class="popcorn-title">Where Math Skills POP Through Hands-On Making!</h1>
            <p class="popcorn-promise"><strong>Our Promise:</strong> Every child takes home a tangible mathematical creation each week.</p>
            <p class="popcorn-lead">Popcorn Math is an in-person, hands-on after-school programme on Anguilla for primary students (Grades 1 to 5). Children meet weekly in a classroom to make geometric shapes and crafts with manipulatives.</p>
            
            <div class="popcorn-hero-actions">
              <a href="/popcorn-math/parents" class="btn btn-primary btn-large">For Parents &rarr;</a>
              <a href="/popcorn-math/schools" class="btn btn-secondary btn-large">For Schools &rarr;</a>
              <a href="/popcorn-math/presenters" class="btn btn-accent btn-large">Become a Presenter &rarr;</a>
            </div>
          </div>
          <div class="popcorn-hero-mascot">
            <!-- TODO(mascot): Artist final version will be swapped in here -->
            ${renderBucketMascot({ expression: 'happy', size: 160, className: 'animated' })}
          </div>
        </div>
      </header>

      <!-- 4 Simple Steps: How It Works -->
      <section class="popcorn-steps-section py-12">
        <div class="container">
          <div class="section-header text-center">
            <span class="badge-accent">How It Works</span>
            <h2>Four Simple Steps to Mathematical Joy</h2>
            <p>Every session is designed to make math approachable, tactile, and deeply satisfying.</p>
          </div>

          <div class="steps-grid mt-8">
            <div class="step-card">
              <div class="step-number">1</div>
              <h3>Weekly 1-Hour Session</h3>
              <p>Primary children from mixed grades (Grades 1 to 5) meet in one classroom for an hour of creative math exploration.</p>
            </div>
            <div class="step-card">
              <div class="step-number">2</div>
              <h3>Hands-On Materials Packet</h3>
              <p>Each child receives a personal packet with all tactile materials, manipulatives, and crafting guides.</p>
            </div>
            <div class="step-card">
              <div class="step-number">3</div>
              <h3>Guided Making &amp; Problem Solving</h3>
              <p>An enthusiastic independent presenter demonstrates techniques using a finished model crafted by founder Teacher Cassie.</p>
            </div>
            <div class="step-card">
              <div class="step-number">4</div>
              <h3>Take Home What You Made</h3>
              <p>Every child takes home their completed mathematical model to share, display, and celebrate with family.</p>
            </div>
          </div>
        </div>
      </section>

      <!-- What Children Make -->
      <section class="popcorn-crafts-section py-12">
        <div class="container">
          <div class="section-header text-center">
            <span class="badge-popcorn">Creative Math Projects</span>
            <h2>What Children Make &amp; Take Home</h2>
            <p>Real geometric builds and tactile manipulatives that bring spatial understanding to life.</p>
          </div>

          <div class="crafts-grid mt-8">
            <div class="craft-card">
              <div class="craft-icon" aria-hidden="true">📐</div>
              <h3>3D Geometric Shapes</h3>
              <p>Building sturdy tetrahedrons, cubes, and polyhedrons from tactile struts and connectors.</p>
            </div>
            <div class="craft-card">
              <div class="craft-icon" aria-hidden="true">🍿</div>
              <h3>Manipulatives &amp; Counting Models</h3>
              <p>Hands-on activities with physical counters to master patterns, symmetry, fractions, and multiplication.</p>
            </div>
            <div class="craft-card">
              <div class="craft-icon" aria-hidden="true">🏗️</div>
              <h3>Structural Engineering Challenges</h3>
              <p>Collaborative towers and bridges exploring geometry, weight balance, and spatial measurement.</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Three Clear Pathways -->
      <section class="popcorn-pathways-section py-12">
        <div class="container">
          <div class="pathways-grid">
            <div class="pathway-card card-parent">
              <span class="pathway-tag">For Parents</span>
              <h3>Bring Fun to Your Child's Math Journey</h3>
              <p>Discover session schedules, grade groupings (Grades 1–5), and register your interest for the upcoming series.</p>
              <a href="/popcorn-math/parents" class="btn btn-primary">Parents Guide &amp; Registration &rarr;</a>
            </div>

            <div class="pathway-card card-school">
              <span class="pathway-tag">For Schools</span>
              <h3>Partner with Popcorn Math</h3>
              <p>Principals and educators: host an after-school series at your school with materials and presenters provided.</p>
              <a href="/popcorn-math/schools" class="btn btn-secondary">School Partnerships &rarr;</a>
            </div>

            <div class="pathway-card card-presenter">
              <span class="pathway-tag">For Presenters (18+)</span>
              <h3>Join Our Team of Presenters</h3>
              <p>Earn session pay and an attendance bonus leading fun after-school math workshops at local primary schools.</p>
              <a href="/popcorn-math/presenters" class="btn btn-accent">Become a Presenter &rarr;</a>
            </div>
          </div>
        </div>
      </section>

      <!-- Where and When & Trust -->
      <section class="popcorn-trust-section py-12">
        <div class="container">
          <div class="trust-grid">
            <div class="trust-box">
              <h3>Where &amp; When: Planned Pilot</h3>
              <p>The inaugural Popcorn Math run is a <strong>pilot planned for January</strong> at the founder's own school, with plans to expand across Anguilla's six primary schools. A series runs 8 to 10 weeks within the school term.</p>
              <a href="/popcorn-math/locations" class="btn btn-secondary mt-3">View School Cohorts Directory &rarr;</a>
            </div>

            <div class="trust-box">
              <h3>Safety &amp; Safeguarding</h3>
              <p>Child safety and structured supervision are central to Popcorn Math. Presenters undergo background checks and adhere to a strict Code of Conduct. Sessions take place inside school classrooms with attendance tracking.</p>
              <a href="/popcorn-math/faq" class="btn btn-secondary mt-3">Read Programme FAQ &rarr;</a>
            </div>
          </div>
        </div>
      </section>

      ${config.popcornLocationDirectory ? `
      <!-- Locations & Cohort Lookup -->
      <section class="popcorn-locations-lookup py-8 text-center" id="locations">
        <div class="container">
          <h2>Find a Popcorn Math Cohort Near You</h2>
          <p>Explore scheduled school and community cohorts across Anguilla.</p>
          <div class="form-group mt-4" style="max-width: 480px; margin-left: auto; margin-right: auto;">
            <label for="popcorn-location-select" class="form-label"><strong>Select Location / Community:</strong></label>
            <select id="popcorn-location-select" class="form-select" data-locations="${escapeHtml(JSON.stringify(CONTENT.popcornLocations || []))}">
              <option value="">-- Choose a Community / Cohort --</option>
              ${(CONTENT.popcornLocations || []).map(loc => `<option value="${escapeHtml(loc.id)}">${escapeHtml(loc.name)}</option>`).join('')}
            </select>
            <div id="location-details" class="location-card mt-4 text-left" style="display:none;" aria-live="polite" role="region" aria-label="Selected location details">
              <h3 id="loc-title"></h3>
              <p><strong>Venue:</strong> <span id="loc-venue"></span></p>
              <p><strong>Schedule:</strong> <span id="loc-schedule"></span></p>
              <p><strong>Ages:</strong> <span id="loc-ages"></span></p>
              <p><strong>Status:</strong> <span id="loc-status" class="badge"></span></p>
              <a id="loc-cta" href="/book?service=Popcorn%20Math" class="btn btn-primary btn-sm mt-2">Enquire for This Location</a>
            </div>
          </div>
          <div class="mt-4">
            <a href="/popcorn-math/locations" class="btn btn-secondary btn-small">View Full School Locations Directory &rarr;</a>
          </div>
        </div>
      </section>
      ` : ''}

      <!-- Mini-Game Teaser & Contact -->
      <section class="popcorn-play-cta py-8 text-center">
        <div class="container">
          <div class="play-cta-box">
            <span class="play-icon" aria-hidden="true">🍿</span>
            <h2>Try Our Mini-Game Teaser!</h2>
            <p>Children can test their quick mental math skills with our friendly bucket mascot in this short browser game.</p>
            <a href="/popcorn-math/play" class="btn btn-primary btn-large">Play the Teaser Game &rarr;</a>
          </div>
        </div>
      </section>
    </div>
  `;

  return renderLayout({
    title: 'Popcorn Math - In-Person Hands-On Maths Fun for Children',
    description: 'Popcorn Math is an in-person, hands-on after-school maths programme for primary school children on Anguilla. Planned pilot launches January.',
    bodyHtml,
    currentPath: '/services/popcorn-math'
  });
}

// 2. Parents Guide & Registration (/popcorn-math/parents)
function renderPopcornParentsPage() {
  const bodyHtml = `
    <div class="container py-10">
      <div class="programme-page-header">
        <div class="popcorn-badge-row">
          <span class="badge-popcorn">For Parents &amp; Guardians</span>
          <span class="badge-accent">Anguilla Primary Schools</span>
        </div>
        <h1>Popcorn Math for Parents</h1>
        <p class="lead">Hands-on after-school maths fun where children build, explore, and gain confidence. Not online learning, and not exam preparation—just pure mathematical joy through making!</p>
      </div>

      <div class="programme-details-grid mt-8">
        <div class="detail-card">
          <h3>🕒 Weekly Sessions</h3>
          <p>Children meet once a week for one hour directly after school in a familiar classroom setting.</p>
        </div>
        <div class="detail-card">
          <h3>🎒 Mixed Grades 1 to 5</h3>
          <p>Primary children of different grade levels learn together in an encouraging, collaborative atmosphere.</p>
        </div>
        <div class="detail-card">
          <h3>📐 Take-Home Creations</h3>
          <p>Every single week, each child takes home an item they made (such as 3D geometric shapes or math models).</p>
        </div>
        <div class="detail-card">
          <h3>📅 Term Series</h3>
          <p>Each series runs for 8 to 10 weeks within the school term. Fees are paid per series (confirmed upon registration enquiry).</p>
        </div>
      </div>

      <!-- Registration Form -->
      <section class="form-section mt-12">
        <div class="form-container">
          <div class="form-header text-center">
            <h2>Register Your Interest</h2>
            <p>Spaces for the planned January pilot and subsequent school cohorts are limited. Submit your details to receive series information and registration updates.</p>
            <p class="privacy-note-pill">🔒 We respect child privacy: we do not collect child names on this form. We only ask for their grade level.</p>
          </div>

          <form id="popcorn-parent-form" class="app-form form-card" data-form-type="popcorn-parent-interest" method="POST" action="/api/forms/popcorn-parent-interest" novalidate>
            ${renderHoneypot()}

            <div class="form-group">
              <label for="parentName" class="form-label">Parent / Guardian Full Name <span class="required">*</span></label>
              <input type="text" id="parentName" name="parentName" required class="form-input" placeholder="e.g. Sarah Connor">
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="email" class="form-label">Email Address</label>
                <input type="email" id="email" name="email" class="form-input" placeholder="e.g. sarah@example.com">
              </div>

              <div class="form-group">
                <label for="phone" class="form-label">WhatsApp or Phone Number <span class="required">*</span></label>
                <input type="tel" id="phone" name="phone" required class="form-input" placeholder="+1 264 555 0199">
              </div>
            </div>

            <div class="form-group">
              <label for="childGrade" class="form-label">Child's Primary Grade Level <span class="required">*</span></label>
              <select id="childGrade" name="childGrade" required class="form-select">
                <option value="">-- Select Grade --</option>
                <option value="Grade 1">Grade 1</option>
                <option value="Grade 2">Grade 2</option>
                <option value="Grade 3">Grade 3</option>
                <option value="Grade 4">Grade 4</option>
                <option value="Grade 5">Grade 5</option>
                <option value="Multiple Grades (Siblings)">Multiple Children (Grades 1–5)</option>
              </select>
            </div>

            <div class="form-group">
              <label for="preferredSchool" class="form-label">Preferred Primary School in Anguilla</label>
              <select id="preferredSchool" name="preferredSchool" class="form-select">
                ${POPCORN_SCHOOLS.map(s => `<option value="${escapeHtml(s.name)}">${escapeHtml(s.name)} (${escapeHtml(s.status)})</option>`).join('\n')}
              </select>
            </div>

            <div class="form-group">
              <label for="message" class="form-label">Questions or Comments (Optional)</label>
              <textarea id="message" name="message" rows="3" class="form-textarea" placeholder="Any questions for Teacher Cassie about the programme?"></textarea>
            </div>

            ${renderConsentBox()}

            <div class="form-actions">
              <button type="submit" class="btn btn-primary btn-large">Submit Parent Registration &rarr;</button>
            </div>

            <div id="popcorn-parent-form-status" class="form-status" aria-live="polite" role="status"></div>
          </form>
        </div>
      </section>
    </div>
  `;

  return renderLayout({
    title: 'Popcorn Math for Parents - Hands-On Primary Math Programme',
    description: 'Learn how Popcorn Math makes learning fun for primary students in Anguilla. Weekly 1-hour sessions with take-home crafts. Register interest today.',
    bodyHtml,
    currentPath: '/popcorn-math/parents'
  });
}

// 3. School Partnerships (/popcorn-math/schools)
function renderPopcornSchoolsPage() {
  const bodyHtml = `
    <div class="container py-10">
      <div class="programme-page-header">
        <span class="badge-accent">School &amp; Institutional Partnerships</span>
        <h1>Bring Popcorn Math to Your School</h1>
        <p class="lead">Partner with Popcorn Math to host an energetic, tactile after-school mathematics club. We provide full packets of materials and trained presenters—your school provides the classroom space.</p>
      </div>

      <div class="partnership-comparison-grid mt-8">
        <div class="comparison-card card-provided">
          <h3>📦 What Popcorn Math Provides</h3>
          <ul class="comparison-list">
            <li><strong>Complete Materials Packets:</strong> Tactile manipulatives, geometric crafting supplies, and student sheets.</li>
            <li><strong>Finished Demonstration Models:</strong> Hand-crafted prototype models prepared by founder Teacher Cassie.</li>
            <li><strong>Trained Presenters:</strong> Independent adult presenters (18+) trained to guide children with enthusiasm.</li>
            <li><strong>Attendance Tracking:</strong> Accurate weekly attendance management and rosters.</li>
            <li><strong>Safety &amp; Vetting:</strong> Background checks and strict adherence to our Code of Conduct.</li>
          </ul>
        </div>

        <div class="comparison-card card-required">
          <h3>🏫 What the School Provides</h3>
          <ul class="comparison-list">
            <li><strong>Classroom Space:</strong> A safe, well-lit primary classroom for 1 hour once a week.</li>
            <li><strong>Teacher-Presenter Nomination:</strong> If interested, a teacher at your school can be trained as the paid session presenter!</li>
            <li><strong>Session Confirmation:</strong> Acknowledging weekly attendance and room availability.</li>
          </ul>
        </div>
      </div>

      <!-- School Enquiry Form -->
      <section class="form-section mt-12">
        <div class="form-container">
          <div class="form-header text-center">
            <h2>School Partnership Enquiry</h2>
            <p>Principals, coordinators, and teachers: request a Popcorn Math partnership for your primary school.</p>
          </div>

          <form id="school-enquiry-form" class="app-form form-card" data-form-type="school-enquiry" method="POST" action="/api/forms/school-enquiry" novalidate>
            ${renderHoneypot()}

            <div class="form-row">
              <div class="form-group">
                <label for="schoolName" class="form-label">School / Institution Name <span class="required">*</span></label>
                <input type="text" id="schoolName" name="schoolName" required maxlength="100" class="form-input" placeholder="e.g. Valley Primary School">
              </div>

              <div class="form-group">
                <label for="contactPerson" class="form-label">Contact Person <span class="required">*</span></label>
                <input type="text" id="contactPerson" name="contactPerson" required maxlength="100" class="form-input" placeholder="e.g. Jane Doe">
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="roleTitle" class="form-label">Role Title <span class="required">*</span></label>
                <input type="text" id="roleTitle" name="roleTitle" required maxlength="100" class="form-input" placeholder="e.g. Principal, Head of Mathematics">
              </div>

              <div class="form-group">
                <label for="locationDistrict" class="form-label">Location / District <span class="required">*</span></label>
                <input type="text" id="locationDistrict" name="locationDistrict" required maxlength="100" class="form-input" placeholder="e.g. The Valley, Anguilla">
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="email" class="form-label">Contact Email Address <span class="required">*</span></label>
                <input type="email" id="email" name="email" required maxlength="150" class="form-input" placeholder="e.g. office@school.ai">
              </div>

              <div class="form-group">
                <label for="phone" class="form-label">Contact Phone / WhatsApp <span class="required">*</span></label>
                <input type="tel" id="phone" name="phone" required maxlength="25" class="form-input" placeholder="+1 264 555 0123">
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="studentAgeGroup" class="form-label">Student Age Group <span class="required">*</span></label>
                <select id="studentAgeGroup" name="studentAgeGroup" required class="form-select">
                  <option value="8-10">Ages 8–10 (Lower Primary)</option>
                  <option value="11-13">Ages 11–13 (Upper Primary)</option>
                  <option value="Mixed" selected>Mixed Primary Grades (Grades 1–5)</option>
                </select>
              </div>

              <div class="form-group">
                <label for="estimatedStudentCount" class="form-label">Estimated Interested Students (10–500) <span class="required">*</span></label>
                <input type="number" id="estimatedStudentCount" name="estimatedStudentCount" min="10" max="500" value="25" required class="form-input">
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="programmeType" class="form-label">Preferred Collaboration Format <span class="required">*</span></label>
                <select id="programmeType" name="programmeType" required class="form-select">
                  <option value="After-school club">Weekly After-School Club (8–10 weeks)</option>
                  <option value="Workshop">Single Introductory Workshop</option>
                  <option value="Event">School Mathematics Day Event</option>
                </select>
              </div>

              <div class="form-group">
                <label for="targetDate" class="form-label">Target Term / Date (Optional)</label>
                <input type="text" id="targetDate" name="targetDate" maxlength="50" class="form-input" placeholder="e.g. January Pilot or Term 2">
              </div>
            </div>

            <div class="form-group">
              <label for="message" class="form-label">Additional Partnership Notes (Optional, max 500 characters)</label>
              <textarea id="message" name="message" rows="3" maxlength="500" class="form-textarea" placeholder="Tell us about your school's schedule or preferred term start..."></textarea>
            </div>

            ${renderConsentBox()}

            <div class="form-actions">
              <button type="submit" class="btn btn-primary btn-large">Submit School Enquiry &rarr;</button>
            </div>
            <p class="form-disclaimer text-center mt-3"><small>Please note: submitting this form is an initial enquiry to explore a school partnership; it is not a confirmed booking.</small></p>

            <div id="school-enquiry-form-status" class="form-status" aria-live="polite" role="status"></div>
          </form>
        </div>
      </section>
    </div>
  `;

  return renderLayout({
    title: 'Popcorn Math for Schools - Educational Partnerships',
    description: 'Bring Popcorn Math to your primary school. Full materials and trained presenters provided. Partnership details and enquiry form.',
    bodyHtml,
    currentPath: '/popcorn-math/schools'
  });
}

// 4. Presenters Recruitment QR Landing Page (/popcorn-math/presenters & /join)
function renderPopcornPresentersPage() {
  const bodyHtml = `
    <div class="container py-8 presenter-landing-wrapper">
      <div class="presenter-quick-hero text-center">
        <span class="badge-accent">Now Recruiting • Adults 18+</span>
        <h1>Become a Popcorn Math Presenter</h1>
        <p class="lead">Lead fun, in-person after-school math workshops for primary children on Anguilla. Earn session pay, an attendance bonus, and inspire young learners!</p>
      </div>

      <!-- Quick Summary Box for Phone Scanning -->
      <div class="qr-summary-box mt-6">
        <h2>At a Glance: The Presenter Role</h2>
        <ul class="qr-checklist">
          <li><strong>Who can apply:</strong> Adults aged 18 or older. School teachers and energetic 18–19 school leavers are welcome!</li>
          <li><strong>The Role:</strong> Lead a 1-hour weekly session, hand out materials packets, guide children through making 3D math crafts, and arrive with the founder's demo model.</li>
          <li><strong>How Pay Works:</strong> You are paid per completed session and earn an attendance bonus when you complete every session in a series. (Attendance records verify your payment).</li>
          <li><strong>Safety &amp; Checks:</strong> Background checks and adherence to our Code of Conduct are required.</li>
        </ul>
      </div>

      <!-- 4 Steps to Presenting -->
      <div class="steps-container mt-8">
        <h3 class="text-center">How It Works in 4 Steps</h3>
        <div class="steps-grid mt-4">
          <div class="step-card">
            <div class="step-number">1</div>
            <h4>Apply Online</h4>
            <p>Fill out the application below with your contact details and upload your PDF CV.</p>
          </div>
          <div class="step-card">
            <div class="step-number">2</div>
            <h4>Checks &amp; Orientation</h4>
            <p>Complete background vetting and review our session guidelines and child safeguarding code of conduct.</p>
          </div>
          <div class="step-card">
            <div class="step-number">3</div>
            <h4>Receive Materials</h4>
            <p>Get full materials kits and finished prototype models crafted by Teacher Cassie.</p>
          </div>
          <div class="step-card">
            <div class="step-number">4</div>
            <h4>Lead &amp; Earn</h4>
            <p>Lead weekly 1-hour sessions at an assigned primary school and receive session pay + attendance bonus.</p>
          </div>
        </div>
      </div>

      <!-- Application Form (Reuses /api/forms/presenter-application) -->
      <section class="form-section mt-10" id="apply">
        <div class="form-container">
          <div class="form-header text-center">
            <h2>Presenter Application Form</h2>
            <p>Applicants must be 18 years of age or older.</p>
          </div>

          <form id="presenter-application-form" class="app-form form-card" data-form-type="presenter-application" method="POST" action="/api/forms/presenter-application" novalidate>
            ${renderHoneypot()}

            <div class="form-group">
              <label for="fullName" class="form-label">Full Legal Name <span class="required">*</span></label>
              <input type="text" id="fullName" name="fullName" required maxlength="100" class="form-input" placeholder="e.g. Johnathan Smith">
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="email" class="form-label">Email Address <span class="required">*</span></label>
                <input type="email" id="email" name="email" required maxlength="150" class="form-input" placeholder="e.g. john@example.com">
              </div>

              <div class="form-group">
                <label for="phone" class="form-label">WhatsApp or Phone Number <span class="required">*</span></label>
                <input type="tel" id="phone" name="phone" required maxlength="25" class="form-input" placeholder="+1 264 555 0188">
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="location" class="form-label">Location (Island / District) <span class="required">*</span></label>
                <input type="text" id="location" name="location" required maxlength="100" class="form-input" placeholder="e.g. The Valley, Anguilla">
              </div>

              <div class="form-group">
                <label for="preferredRole" class="form-label">Preferred Role</label>
                <select id="preferredRole" name="preferredRole" class="form-select">
                  <option value="Presenter">Presenter</option>
                  <option value="Assistant Presenter">Assistant Presenter</option>
                </select>
              </div>
            </div>

            <div class="form-group">
              <label for="educationalBackground" class="form-label">Educational Background <span class="required">*</span></label>
              <textarea id="educationalBackground" name="educationalBackground" rows="3" required maxlength="500" class="form-textarea" placeholder="Qualifications, primary/secondary teaching role, or recent study..."></textarea>
            </div>

            <div class="form-group">
              <label for="experienceWithChildren" class="form-label">Experience Working With Children <span class="required">*</span></label>
              <textarea id="experienceWithChildren" name="experienceWithChildren" rows="3" required maxlength="500" class="form-textarea" placeholder="Describe classroom teaching, youth leadership, or tutoring experience..."></textarea>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="mathConfidence" class="form-label">Mathematics Confidence</label>
                <select id="mathConfidence" name="mathConfidence" class="form-select">
                  <option value="High">High - Very confident across curriculum</option>
                  <option value="Moderate">Moderate - Strong primary/foundational skills</option>
                  <option value="Foundational">Foundational</option>
                </select>
              </div>

              <div class="form-group">
                <label for="availability" class="form-label">Availability <span class="required">*</span></label>
                <input type="text" id="availability" name="availability" required maxlength="250" class="form-input" placeholder="e.g. Weekday afternoons after 3:00 PM">
              </div>
            </div>

            <div class="form-group">
              <label for="whyPopcornMath" class="form-label">Why would you like to lead Popcorn Math sessions? <span class="required">*</span></label>
              <textarea id="whyPopcornMath" name="whyPopcornMath" rows="3" required maxlength="1000" class="form-textarea" placeholder="Tell us about your enthusiasm for hands-on maths and working with primary learners..."></textarea>
            </div>

            <!-- PDF CV Upload with Presigned S3 -->
            <div class="form-group cv-upload-group">
              <label for="cvFile" class="form-label">Upload CV / Resume (PDF only, max 5 MB)</label>
              <input type="file" id="cvFile" accept=".pdf,application/pdf" class="form-file-input">
              <input type="hidden" id="cvUploadKey" name="cvUploadKey">
              <p class="file-helper-text">Select your CV in PDF format. It will be uploaded securely before you submit.</p>
              <div id="cv-upload-status" class="upload-status" aria-live="polite"></div>
            </div>

            <!-- 18+ Verification Gate -->
            <div class="form-group form-checkbox-group age-verification-box">
              <input type="checkbox" id="ageConfirmation" name="ageConfirmation" required class="form-checkbox">
              <label for="ageConfirmation" class="checkbox-label">
                <strong>I confirm that I am 18 years of age or older. <span class="required">*</span></strong>
              </label>
            </div>

            ${renderConsentBox()}

            <div class="form-actions">
              <button type="submit" class="btn btn-primary btn-large">Submit Presenter Application &rarr;</button>
            </div>

            <div id="presenter-application-form-status" class="form-status" aria-live="polite" role="status"></div>
          </form>
        </div>
      </section>

      <!-- Printable Presenter Handout Summary (Print-friendly) -->
      <div class="summary-print-card mt-10">
        <h3>📋 Printable Presenter Handout</h3>
        <p>Need a physical copy for yourself, a school staff room, or to share with an interested colleague?</p>
        <button type="button" class="btn btn-secondary btn-small" id="btn-print-presenter">Print Presenter Handout 🖨️</button>
      </div>

      <!-- Quick Contact Box -->
      <div class="contact-card text-center mt-8">
        <h3>Questions About Presenting?</h3>
        <p>Contact Teacher Cassie directly by email or WhatsApp:</p>
        <p>📧 <a href="mailto:${escapeHtml(getContactEmail())}">${escapeHtml(getContactEmail())}</a> &bull; 💬 <a href="${escapeHtml(getWhatsAppHref())}" target="_blank" rel="noopener noreferrer">WhatsApp Teacher Cassie</a></p>
      </div>
    </div>
  `;

  return renderLayout({
    title: 'Become a Popcorn Math Presenter - 18+ Paid Facilitators',
    description: 'We are hiring independent session presenters (18+) for Popcorn Math after-school clubs in Anguilla. Earn session pay + attendance bonuses. Apply online.',
    bodyHtml,
    currentPath: '/popcorn-math/presenters'
  });
}

// 5. School Directory (/popcorn-math/locations)
function renderPopcornLocationsPage() {
  const bodyHtml = `
    <div class="container py-10">
      <div class="programme-page-header text-center">
        <span class="badge-popcorn">Anguilla Primary School Directory</span>
        <h1>Popcorn Math Locations</h1>
        <p class="lead">Popcorn Math is designed for in-person delivery across the six primary schools of Anguilla. The inaugural pilot series is planned for January at the founder's primary school.</p>
      </div>

      <div class="locations-grid mt-8">
        ${POPCORN_SCHOOLS.map(school => `
          <div class="location-card ${school.isPilot ? 'card-pilot' : ''}">
            <div class="location-card-header">
              <h3>${escapeHtml(school.name)}</h3>
              <span class="location-status-badge ${school.isPilot ? 'badge-pilot' : 'badge-planned'}">${escapeHtml(school.status)}</span>
            </div>
            <p class="location-notes">${escapeHtml(school.notes)}</p>
            <div class="location-card-footer">
              <a href="/popcorn-math/parents?school=${encodeURIComponent(school.name)}" class="btn btn-primary btn-small">Register for this Cohort &rarr;</a>
            </div>
          </div>
        `).join('\n')}
      </div>

      <div class="service-notice mt-8 text-center">
        <p><strong>Note for School Administrators:</strong> Don't see your school listed with active dates? <a href="/popcorn-math/schools">Enquire about a partnership</a> to bring Popcorn Math to your students!</p>
      </div>
    </div>
  `;

  return renderLayout({
    title: 'Popcorn Math Locations - Anguilla Primary Schools Directory',
    description: 'View upcoming Popcorn Math pilot and planned school cohorts across Anguilla. Planned January pilot launching soon.',
    bodyHtml,
    currentPath: '/popcorn-math/locations'
  });
}

// 6. Mini-Game Teaser (/popcorn-math/play)
function renderPopcornPlayPage() {
  const bucketSvg = renderBucketMascot({ expression: 'happy', size: 130, id: 'game-bucket-mascot' });

  const bodyHtml = `
    <div class="container py-8 game-wrapper">
      <div class="game-header text-center">
        <span class="badge-popcorn">Browser Teaser</span>
        <h1>Can You Make the Popcorn Pop?</h1>
        <p class="lead">A fun, interactive teaser game where quick mental math pops kernels into the bucket!</p>
      </div>

      <div class="game-container mt-6">
        <div class="bucket-stage text-center" aria-label="Popcorn bucket tracker">
          <!-- TODO(mascot): Artist final version will be swapped in here -->
          ${bucketSvg}
          <div class="bucket-slots" id="bucket-slots" aria-hidden="true">
            <span class="kernel-item" id="kernel-1">🍿</span>
            <span class="kernel-item" id="kernel-2">🍿</span>
            <span class="kernel-item" id="kernel-3">🍿</span>
          </div>
          <div class="game-bucket-counter" id="game-score-counter">Kernels Popped: <strong>0</strong> / 3</div>
        </div>

        ${config.popcornGameMultiLevel ? `
        <div class="game-level-selector text-center mt-4 mb-3">
          <label for="game-level-select" class="form-label"><strong>Difficulty Level:</strong></label>
          <select id="game-level-select" class="form-select" style="display:inline-block; width:auto; max-width:100%;">
            <option value="kernels">Little Kernels (Ages 4–6: Addition)</option>
            <option value="poppers" selected>Popping Poppers (Ages 7–9: Times Tables)</option>
            <option value="crunch">Mega Crunch (Ages 10–12: Mental Arithmetic)</option>
          </select>
        </div>
        ` : ''}

        <div id="game-feedback" class="game-feedback mt-4 text-center" aria-live="polite" role="status"></div>

        <div id="game-arena" class="game-arena mt-4">
          <div class="game-card">
            <div class="question-tracker" id="question-tracker">Question 1 of 3</div>
            <h2 class="question-prompt" id="question-prompt">What is 8 &times; 7?</h2>
            <div class="answers-grid mt-4" id="answers-grid" role="group" aria-label="Answer options">
              <!-- Buttons injected by /js/game.js -->
            </div>
          </div>
        </div>

        <div id="game-star-screen" class="game-star-screen mt-4" style="display:none;" role="region" aria-label="Game completion">
          <div class="star-badge" aria-hidden="true">🎉</div>
          <h2>YOU&apos;RE A POPCORN MATH STAR!</h2>
          <p class="lead">All 3 kernels popped! Want more hands-on mathematics fun in person?</p>
          <div class="star-actions">
            <a href="/popcorn-math/parents" class="btn btn-primary btn-large">Join an In-Person Series &rarr;</a>
            <button type="button" id="btn-play-again" class="btn btn-secondary btn-large">Play Again</button>
          </div>
        </div>
      </div>

      <div class="game-footer-cta text-center mt-8">
        <h3>Enjoying the Math Fun?</h3>
        <p>Popcorn Math in-person workshops bring tactile 3D builds and manipulatives to primary students in Anguilla.</p>
        <div class="hero-ctas justify-center">
          <a href="/popcorn-math/parents" class="btn btn-primary">Join an In-Person Series &rarr;</a>
          <a href="/services/popcorn-math" class="btn btn-secondary">&larr; Back to Popcorn Math Hub</a>
        </div>
        <p class="text-muted text-center mt-4"><small>This game does not collect or store any personal data or responses.</small></p>
      </div>
    </div>
  `;

  return renderLayout({
    title: 'Play Popcorn Math - Interactive Browser Teaser',
    description: 'Try the fun Popcorn Math teaser mini-game in your browser. Solve math puzzles to pop kernels into the bucket.',
    bodyHtml,
    currentPath: '/popcorn-math/play',
    extraScripts: ['/js/game.js']
  });
}

// 7. FAQ Page (/popcorn-math/faq)
function renderPopcornFaqPage() {
  const bodyHtml = `
    <div class="container py-10 faq-wrapper">
      <div class="programme-page-header text-center">
        <span class="badge-popcorn">Questions &amp; Answers</span>
        <h1>Popcorn Math FAQ</h1>
        <p class="lead">Everything parents, schools, and presenter candidates need to know about our hands-on maths fun programme.</p>
      </div>

      <!-- FAQ Tabs / Sections -->
      <div class="faq-sections-container mt-8">
        <!-- Section 1: Parents FAQ -->
        <section class="faq-category">
          <h2 class="faq-category-title">👨‍👩‍👧 For Parents &amp; Guardians</h2>
          
          <details class="faq-item" open>
            <summary class="faq-question">What exactly is Popcorn Math?</summary>
            <div class="faq-answer">
              <p>Popcorn Math is an in-person, hands-on after-school maths programme on Anguilla for primary school children (Grades 1 to 5). It is NOT an online course and NOT exam prep. Children meet in a classroom to build tactile projects like 3D shapes and solve math puzzles with manipulatives.</p>
            </div>
          </details>

          <details class="faq-item">
            <summary class="faq-question">What do children take home?</summary>
            <div class="faq-answer">
              <p>Every single week, each child takes home an item they personally built during the session (such as a 3D geometric tetrahedron, a cube, or a mathematical craft) to share proudly with family.</p>
            </div>
          </details>

          <details class="faq-item">
            <summary class="faq-question">How long is a series, and what are the fees?</summary>
            <div class="faq-answer">
              <p>A Popcorn Math series runs 8 to 10 weeks within the primary school term, meeting for 1 hour weekly. Fees are paid per series and will be confirmed with parents upon registration enquiry.</p>
            </div>
          </details>

          <details class="faq-item">
            <summary class="faq-question">When and where will sessions begin?</summary>
            <div class="faq-answer">
              <p>The first run is an inaugural pilot planned for January at the founder's primary school, with future rollout planned across all six primary schools on Anguilla.</p>
            </div>
          </details>
        </section>

        <!-- Section 2: Schools FAQ -->
        <section class="faq-category mt-8">
          <h2 class="faq-category-title">🏫 For Schools &amp; Principals</h2>

          <details class="faq-item">
            <summary class="faq-question">What does our school need to provide?</summary>
            <div class="faq-answer">
              <p>Participating schools provide a classroom space for 1 hour each week and session confirmation. Popcorn Math supplies all student materials packets, finished demo models, and trained independent presenters.</p>
            </div>
          </details>

          <details class="faq-item">
            <summary class="faq-question">Can our school's teachers serve as presenters?</summary>
            <div class="faq-answer">
              <p>Yes! The ideal presenter is a teacher at that school, as the classroom and familiarity with the children are already in place. Teachers receive session pay and an attendance bonus.</p>
            </div>
          </details>
        </section>

        <!-- Section 3: Presenters FAQ -->
        <section class="faq-category mt-8">
          <h2 class="faq-category-title">👩‍🏫 For Presenters (18+)</h2>

          <details class="faq-item">
            <summary class="faq-question">What are the requirements to become a presenter?</summary>
            <div class="faq-answer">
              <p>Presenters must be adults aged 18 or older. School teachers, educators, and enthusiastic 18–19 school leavers are welcomed. Background checks are required, and all presenters adhere to our strict Code of Conduct.</p>
            </div>
          </details>

          <details class="faq-item">
            <summary class="faq-question">How does presenter payment work?</summary>
            <div class="faq-answer">
              <p>Independent presenters are paid per completed session and earn an attendance bonus if they lead every session in a series. Payments are verified against accurate session attendance records.</p>
            </div>
          </details>

          <details class="faq-item">
            <summary class="faq-question">Do I need to design the lesson activities?</summary>
            <div class="faq-answer">
              <p>No! Popcorn Math supplies complete materials packets and arrives with a finished demonstration model crafted by founder Teacher Cassie. The presenter guides the children through assembling their own models.</p>
            </div>
          </details>
        </section>
      </div>

      <div class="contact-card text-center mt-12">
        <h3>Still Have Questions?</h3>
        <p>Our team is always happy to help parents, schools, and candidates.</p>
        <p>💬 <a href="${escapeHtml(getWhatsAppHref())}" class="btn btn-primary btn-large" target="_blank" rel="noopener noreferrer">Chat with Teacher Cassie on WhatsApp</a></p>
      </div>
    </div>
  `;

  return renderLayout({
    title: 'Popcorn Math FAQ - Answers for Parents, Schools & Presenters',
    description: 'Frequently asked questions about Popcorn Math: session times, what children make, school partnerships, and 18+ presenter roles.',
    bodyHtml,
    currentPath: '/popcorn-math/faq'
  });
}

module.exports = {
  renderPopcornHubPage,
  renderPopcornParentsPage,
  renderPopcornSchoolsPage,
  renderPopcornPresentersPage,
  renderPopcornLocationsPage,
  renderPopcornPlayPage,
  renderPopcornFaqPage
};

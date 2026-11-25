/**
 * Client Form Submission & File Upload Handler
 * Handles validation, presigned S3/local CV uploads, honeypot mitigation,
 * and ARIA status feedback. Zero inline handlers; strict CSP compliant.
 */

document.addEventListener('DOMContentLoaded', () => {
  // 0. Query-Parameter Form Pre-Fill (/book, /contact, /popcorn-math/parents)
  try {
    const params = new URLSearchParams(window.location.search);

    const serviceSelect = document.getElementById('serviceInterest');
    const rawService = (params.get('service') || params.get('interest') || '').trim();
    if (serviceSelect && rawService) {
      const slugMap = {
        'traditional-tutoring': 'One-on-One Tutoring',
        'one-on-one-tutoring': 'One-on-One Tutoring',
        'group-tutoring': 'Small Group Tutoring',
        'concierge': 'Concierge Academic Coaching',
        'popcorn-math': 'Popcorn Math',
        'popcorn-maths': 'Popcorn Math',
        'specialist-support': 'Specialist Learning Support',
        'school-partnership': 'School Partnership'
      };
      const targetVal = slugMap[rawService.toLowerCase()] || rawService;
      for (const opt of serviceSelect.options) {
        if (opt.value.toLowerCase() === targetVal.toLowerCase()) {
          serviceSelect.value = opt.value;
          break;
        }
      }
    }

    const rawLocation = (params.get('location') || '').trim();
    const notesEl = document.getElementById('additionalNotes');
    if (notesEl && rawLocation && !notesEl.value) {
      notesEl.value = `Preferred location / cohort: ${rawLocation}`;
    }

    const subjectInput = document.getElementById('subject');
    const rawSubject = (params.get('subject') || '').trim();
    if (subjectInput && rawSubject && !subjectInput.value) {
      const subjectMap = {
        'tutor-application': 'Become a Tutor Application',
        'tutor-enquiry': 'Become a Tutor Application',
        'popcorn-session': 'Popcorn Math Session Enquiry',
        'school-partnership': 'School Partnership Enquiry'
      };
      subjectInput.value = subjectMap[rawSubject.toLowerCase()] || rawSubject;
    }

    const schoolSelect = document.getElementById('preferredSchool');
    const rawSchool = (params.get('school') || '').trim();
    if (schoolSelect && rawSchool) {
      for (const opt of schoolSelect.options) {
        if (opt.value.toLowerCase() === rawSchool.toLowerCase()) {
          schoolSelect.value = opt.value;
          break;
        }
      }
    }
  } catch (_) {}

  // 1. Presenter CV File Upload Pre-flight
  const cvFileInput = document.getElementById('cvFile');
  const cvUploadStatus = document.getElementById('cv-upload-status');
  const cvKeyInput = document.getElementById('cvUploadKey');

  if (cvFileInput && cvUploadStatus && cvKeyInput) {
    cvFileInput.addEventListener('change', async () => {
      const file = cvFileInput.files[0];
      if (!file) return;

      // Validate PDF
      if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
        cvUploadStatus.className = 'upload-status error';
        cvUploadStatus.textContent = 'Invalid file type. Only PDF documents (.pdf) are permitted.';
        cvFileInput.value = '';
        cvKeyInput.value = '';
        return;
      }

      // Validate 5 MB limit (5 * 1024 * 1024 = 5,242,880 bytes)
      const MAX_BYTES = 5242880;
      if (file.size > MAX_BYTES) {
        cvUploadStatus.className = 'upload-status error';
        cvUploadStatus.textContent = `File exceeds maximum size of 5 MB (${(file.size / (1024 * 1024)).toFixed(2)} MB).`;
        cvFileInput.value = '';
        cvKeyInput.value = '';
        return;
      }

      cvUploadStatus.className = 'upload-status loading';
      cvUploadStatus.textContent = 'Requesting secure upload credentials...';

      try {
        // Step A: Request Presigned URL
        const presignRes = await fetch('/api/uploads/presign', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filename: file.name })
        });
        const presignData = await presignRes.json();

        if (!presignRes.ok || !presignData.success) {
          throw new Error(presignData.message || 'Failed to prepare upload');
        }

        cvUploadStatus.textContent = 'Uploading CV document...';

        // Step B: Post file to returned URL (S3 or local mock)
        const uploadFormData = new FormData();
        if (presignData.fields) {
          for (const [key, val] of Object.entries(presignData.fields)) {
            uploadFormData.append(key, val);
          }
        }
        uploadFormData.append('file', file);

        const uploadRes = await fetch(presignData.url, {
          method: 'POST',
          body: uploadFormData
        });

        if (!uploadRes.ok && uploadRes.status !== 204) {
          throw new Error(`Upload server responded with status ${uploadRes.status}`);
        }

        // Save key for form submission
        cvKeyInput.value = presignData.key;
        cvUploadStatus.className = 'upload-status success';
        cvUploadStatus.textContent = `✓ CV uploaded successfully (${file.name})`;
      } catch (err) {
        cvUploadStatus.className = 'upload-status error';
        cvUploadStatus.textContent = `Upload failed: ${err.message}. Please try again.`;
        cvFileInput.value = '';
        cvKeyInput.value = '';
      }
    });
  }

  // 2. Generic Pipeline Form Submission
  const forms = document.querySelectorAll('form[data-form-type]');

  forms.forEach((form) => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const formType = form.getAttribute('data-form-type');
      const formId = form.id;
      const statusEl = document.getElementById(`${formId}-status`);
      const submitBtn = form.querySelector('button[type="submit"]');

      if (!statusEl) return;

      // Extract form fields into object
      const formData = new FormData(form);
      const payload = {};

      formData.forEach((value, key) => {
        // Boolean conversion for checkboxes
        if (key === 'consent' || key === 'ageConfirmation') {
          payload[key] = true;
        } else if (key === 'estimatedStudentCount') {
          payload[key] = value !== '' && !isNaN(Number(value)) ? parseInt(value, 10) : value;
        } else {
          payload[key] = typeof value === 'string' ? value.trim() : value;
        }
      });

      // Handle unchecked consent
      if (!payload.consent) {
        statusEl.className = 'form-status error';
        statusEl.textContent = 'You must agree to the privacy policy to proceed.';
        return;
      }

      // Handle unchecked 18+ confirmation for presenter
      if (formType === 'presenter-application' && !payload.ageConfirmation) {
        statusEl.className = 'form-status error';
        statusEl.textContent = 'You must confirm that you are 18 years of age or older.';
        return;
      }

      // UI Loading state
      if (submitBtn) submitBtn.disabled = true;
      statusEl.className = 'form-status loading';
      statusEl.textContent = 'Submitting form...';

      try {
        const res = await fetch(`/api/forms/${encodeURIComponent(formType)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const data = await res.json();

        if (res.ok) {
          statusEl.className = 'form-status success';
          statusEl.textContent = data.message || 'Submission successful! Thank you.';
          form.reset();
          if (cvUploadStatus) {
            cvUploadStatus.textContent = '';
            cvUploadStatus.className = 'upload-status';
          }
        } else {
          statusEl.className = 'form-status error';
          if (data.errors && Array.isArray(data.errors)) {
            statusEl.innerHTML = `<strong>Please correct the following errors:</strong><ul>${data.errors.map(err => `<li>${err}</li>`).join('')}</ul>`;
          } else {
            statusEl.textContent = data.message || 'Submission failed. Please check your entries.';
          }
        }
      } catch (err) {
        statusEl.className = 'form-status error';
        statusEl.textContent = 'Network or server error. Please try again later.';
      } finally {
        if (submitBtn) submitBtn.disabled = false;
      }
    });
  });
});

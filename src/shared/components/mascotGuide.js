/**
 * Reusable Tutor Time Guide Mascot Component (Placeholder)
 * Original inline SVG representation of a friendly female educator avatar.
 * Strictly non-infringing, using brand color palette (#2E75B6, #1A365D, #F5A623).
 *
 * TODO(mascot): Final cartoon illustration of Kashamar will be swapped in here.
 */

const config = require('../config');

function renderGuideMascot({ expression = 'neutral', size = 96, className = '', id = '', assetConfig = config.mascots?.guide } = {}) {
  const safeId = id ? ` id="${id}"` : '';
  const safeClass = ['mascot-guide', className].filter(Boolean).join(' ');
  const altBase = (assetConfig && assetConfig.alt) || 'Tutor Time Guide avatar';

  // Swappable static image mode: driven by config.mascots.guide
  const exprMap = assetConfig && assetConfig.expressions && typeof assetConfig.expressions === 'object'
    ? assetConfig.expressions
    : null;
  const imgSrc = (exprMap && exprMap[expression]) || (assetConfig && assetConfig.imagePath) || null;

  if (imgSrc) {
    const exprAttr = exprMap ? ` data-expressions='${JSON.stringify(exprMap)}'` : '';
    return `<img${safeId} src="${imgSrc}" alt="${altBase} (${expression})" class="${safeClass} mascot-guide-img" width="${size}" height="${size}" data-expression="${expression}"${exprAttr}>`;
  }

  // Expression-specific facial SVG elements
  let mouthPath;
  let eyeDecorations = '';
  let expressionBadge = '';

  switch (expression) {
    case 'happy':
      mouthPath = '<path d="M40 68 Q50 82 60 68" stroke="#1A365D" stroke-width="3" stroke-linecap="round" fill="#F5A623"/>';
      eyeDecorations = '<path d="M36 50 Q40 45 44 50" stroke="#1A365D" stroke-width="2.5" fill="none" stroke-linecap="round"/>' +
                       '<path d="M56 50 Q60 45 64 50" stroke="#1A365D" stroke-width="2.5" fill="none" stroke-linecap="round"/>';
      break;

    case 'thinking':
      mouthPath = '<path d="M43 72 Q50 68 57 72" stroke="#1A365D" stroke-width="3" stroke-linecap="round" fill="none"/>';
      eyeDecorations = '<circle cx="40" cy="51" r="3.5" fill="#1A365D"/>' +
                       '<circle cx="60" cy="49" r="3.5" fill="#1A365D"/>' +
                       '<path d="M55 43 Q60 41 65 44" stroke="#1A365D" stroke-width="2" fill="none"/>';
      expressionBadge = '<circle cx="78" cy="28" r="4" fill="#F5A623" opacity="0.8"/>' +
                        '<circle cx="85" cy="18" r="7" fill="#F8E71C" opacity="0.9"/>' +
                        '<text x="85" y="22" font-size="9" text-anchor="middle" fill="#1A365D" font-weight="bold">?</text>';
      break;

    case 'celebrating':
      mouthPath = '<path d="M38 66 Q50 84 62 66 Z" fill="#E65100" stroke="#1A365D" stroke-width="2.5"/>';
      eyeDecorations = '<path d="M35 50 L40 46 L45 50" stroke="#1A365D" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>' +
                       '<path d="M55 50 L60 46 L65 50" stroke="#1A365D" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>';
      expressionBadge = '<polygon points="82,22 85,28 92,28 86,32 89,38 82,34 76,38 78,32 73,28 80,28" fill="#F5A623"/>' +
                        '<polygon points="20,24 22,29 27,29 23,32 25,37 20,33 15,37 17,32 13,29 18,29" fill="#F8E71C"/>' +
                        '<circle cx="86" cy="44" r="2.5" fill="#2E75B6"/>' +
                        '<circle cx="16" cy="46" r="2.5" fill="#F5A623"/>';
      break;

    case 'neutral':
    default:
      mouthPath = '<path d="M42 69 Q50 76 58 69" stroke="#1A365D" stroke-width="3" stroke-linecap="round" fill="none"/>';
      eyeDecorations = '<circle cx="40" cy="51" r="3.5" fill="#1A365D"/>' +
                       '<circle cx="60" cy="51" r="3.5" fill="#1A365D"/>' +
                       '<circle cx="41" cy="50" r="1.2" fill="#FFFFFF"/>' +
                       '<circle cx="61" cy="50" r="1.2" fill="#FFFFFF"/>';
      break;
  }

  return `<!-- TODO(mascot): Final cartoon of Kashamar will be swapped in here -->
<svg${safeId} class="${safeClass}" width="${size}" height="${size}" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Tutor Time Guide avatar (${expression})" data-expression="${expression}">
  <defs>
    <linearGradient id="guideGlow" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#2E75B6" stop-opacity="0.2"/>
      <stop offset="100%" stop-color="#F5A623" stop-opacity="0.1"/>
    </linearGradient>
    <linearGradient id="guideHair" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#2C1810"/>
      <stop offset="100%" stop-color="#1A0D08"/>
    </linearGradient>
    <linearGradient id="guideShirt" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#2E75B6"/>
      <stop offset="100%" stop-color="#1A365D"/>
    </linearGradient>
  </defs>

  <!-- Aura / Soft backdrop circle -->
  <circle cx="50" cy="50" r="46" fill="url(#guideGlow)"/>

  <!-- Back Hair Volume -->
  <circle cx="50" cy="45" r="30" fill="url(#guideHair)"/>
  <ellipse cx="28" cy="55" rx="8" ry="14" fill="url(#guideHair)"/>
  <ellipse cx="72" cy="55" rx="8" ry="14" fill="url(#guideHair)"/>

  <!-- Neck -->
  <rect x="44" y="68" width="12" height="14" rx="3" fill="#E8B88B"/>

  <!-- Shoulders / Educator Blazer -->
  <path d="M22 94 Q50 78 78 94 L82 100 L18 100 Z" fill="url(#guideShirt)"/>
  <!-- Collar Accent -->
  <path d="M44 80 L50 88 L40 98" stroke="#F5A623" stroke-width="2" fill="none"/>
  <path d="M56 80 L50 88 L60 98" stroke="#F5A623" stroke-width="2" fill="none"/>

  <!-- Head Base -->
  <ellipse cx="50" cy="53" rx="22" ry="24" fill="#F5CBA7"/>

  <!-- Front Hair Style -->
  <path d="M28 44 Q50 24 72 44 Q60 32 50 34 Q38 32 28 44 Z" fill="url(#guideHair)"/>
  <!-- Headband with Brand Gold -->
  <path d="M30 40 Q50 28 70 40" stroke="#F5A623" stroke-width="3.5" fill="none" stroke-linecap="round"/>

  <!-- Cheeks -->
  <circle cx="34" cy="62" r="3.5" fill="#FF8A80" opacity="0.45"/>
  <circle cx="66" cy="62" r="3.5" fill="#FF8A80" opacity="0.45"/>

  <!-- Eyes / Eyebrows / Expressions -->
  ${eyeDecorations}

  <!-- Gentle Nose -->
  <path d="M49 57 Q51 60 52 59" stroke="#D4A373" stroke-width="2" stroke-linecap="round" fill="none"/>

  <!-- Mouth -->
  ${mouthPath}

  <!-- Gold Star Pin on Blazer -->
  <polygon points="30,88 32,92 36,92 33,95 34,99 30,97 26,99 27,95 24,92 28,92" fill="#F8E71C"/>

  <!-- Contextual expression badges (thought bubble or celebration confetti) -->
  ${expressionBadge}
</svg>`;
}

function renderSpeechBubble({ text, className = '', id = '' } = {}) {
  const safeId = id ? ` id="${id}"` : '';
  const safeClass = ['mascot-speech-bubble', className].filter(Boolean).join(' ');

  return `
    <div${safeId} class="${safeClass}" role="region" aria-label="Guide Message">
      <div class="speech-bubble-tail" aria-hidden="true"></div>
      <p class="speech-bubble-text">${text}</p>
    </div>
  `;
}

module.exports = {
  renderGuideMascot,
  renderSpeechBubble
};

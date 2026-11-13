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
      mouthPath = '<path d="M41 66 Q50 76 59 66 Z" fill="#D94848" stroke="#1A365D" stroke-width="2" stroke-linejoin="round"/><path d="M44 71 Q50 75 56 71" fill="#FF8A80"/>';
      eyeDecorations = '<path d="M35 50 Q40 45 45 50" stroke="#1A365D" stroke-width="2.6" fill="none" stroke-linecap="round"/>' +
                       '<path d="M55 50 Q60 45 65 50" stroke="#1A365D" stroke-width="2.6" fill="none" stroke-linecap="round"/>';
      break;

    case 'thinking':
      mouthPath = '<path d="M44 68 Q50 66 56 69" stroke="#1A365D" stroke-width="2.4" stroke-linecap="round" fill="none"/>';
      eyeDecorations = '<circle cx="40" cy="49" r="3.4" fill="#1A365D"/>' +
                       '<circle cx="60" cy="48" r="3.4" fill="#1A365D"/>' +
                       '<circle cx="41.2" cy="47.8" r="1.1" fill="#FFFFFF"/>' +
                       '<circle cx="61.2" cy="46.8" r="1.1" fill="#FFFFFF"/>' +
                       '<path d="M35 43 Q40 41 44 43" stroke="#1A365D" stroke-width="1.8" stroke-linecap="round" fill="none"/>' +
                       '<path d="M55 41 Q60 38 65 41" stroke="#1A365D" stroke-width="1.8" stroke-linecap="round" fill="none"/>';
      expressionBadge = '<circle cx="78" cy="28" r="3.2" fill="#F5A623" opacity="0.9"/>' +
                        '<circle cx="85" cy="18" r="7.5" fill="#FFF3CD" stroke="#F5A623" stroke-width="1.8"/>' +
                        '<text x="85" y="22" font-size="10" text-anchor="middle" fill="#1A365D" font-weight="bold">?</text>';
      break;

    case 'celebrating':
      mouthPath = '<path d="M39 65 Q50 79 61 65 Z" fill="#D94848" stroke="#1A365D" stroke-width="2" stroke-linejoin="round"/><path d="M43 72 Q50 77 57 72" fill="#FF8A80"/>';
      eyeDecorations = '<path d="M35 50 Q40 44 45 50" stroke="#1A365D" stroke-width="2.6" stroke-linecap="round" fill="none"/>' +
                       '<path d="M55 50 Q60 44 65 50" stroke="#1A365D" stroke-width="2.6" stroke-linecap="round" fill="none"/>';
      expressionBadge = '<polygon points="83,16 85.5,21.5 91.5,22 87,26 88.5,32 83,28.8 77.5,32 79,26 74.5,22 80.5,21.5" fill="#F5A623"/>' +
                        '<polygon points="17,18 19,22.5 24,23 20.3,26.2 21.5,31 17,28.3 12.5,31 13.7,26.2 10,23 15,22.5" fill="#F8E71C"/>' +
                        '<circle cx="86" cy="40" r="2.2" fill="#2E75B6"/>' +
                        '<circle cx="14" cy="42" r="2.2" fill="#F5A623"/>';
      break;

    case 'neutral':
    default:
      mouthPath = '<path d="M42 66 Q50 73 58 66" stroke="#1A365D" stroke-width="2.4" stroke-linecap="round" fill="none"/>';
      eyeDecorations = '<circle cx="40" cy="50" r="3.4" fill="#1A365D"/>' +
                       '<circle cx="60" cy="50" r="3.4" fill="#1A365D"/>' +
                       '<circle cx="41.2" cy="48.8" r="1.2" fill="#FFFFFF"/>' +
                       '<circle cx="61.2" cy="48.8" r="1.2" fill="#FFFFFF"/>' +
                       '<path d="M35 44 Q40 41.5 45 44" stroke="#1A365D" stroke-width="1.8" stroke-linecap="round" fill="none"/>' +
                       '<path d="M55 44 Q60 41.5 65 44" stroke="#1A365D" stroke-width="1.8" stroke-linecap="round" fill="none"/>';
      break;
  }

  return `<!-- TODO(mascot): Final cartoon of Kashamar will be swapped in here -->
<svg${safeId} class="${safeClass}" width="${size}" height="${size}" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Tutor Time Guide avatar (${expression})" data-expression="${expression}">
  <defs>
    <clipPath id="guideAvatarClip">
      <circle cx="50" cy="50" r="45"/>
    </clipPath>
    <linearGradient id="guideBg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#E8F4FD"/>
      <stop offset="100%" stop-color="#FFF7E2"/>
    </linearGradient>
    <linearGradient id="guideHair" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#3B2314"/>
      <stop offset="100%" stop-color="#1E1008"/>
    </linearGradient>
    <linearGradient id="guideBlazer" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#2E75B6"/>
      <stop offset="100%" stop-color="#1A365D"/>
    </linearGradient>
  </defs>

  <!-- Crisp Circular Badge Background -->
  <circle cx="50" cy="50" r="45" fill="url(#guideBg)"/>

  <g clip-path="url(#guideAvatarClip)">
    <!-- High Hair Puff & Back Hair -->
    <circle cx="50" cy="20" r="14" fill="url(#guideHair)"/>
    <path d="M24 54 C24 30 35 20 50 20 C65 20 76 30 76 54 L76 74 C76 78 70 80 66 78 L34 78 C30 80 24 78 24 74 Z" fill="url(#guideHair)"/>

    <!-- Shoulders & White Shirt -->
    <path d="M18 100 C20 82 33 76 50 76 C67 76 80 82 82 100 Z" fill="url(#guideBlazer)"/>
    <path d="M40 76 L50 92 L60 76 Z" fill="#FFFFFF"/>
    <path d="M38 77 L47 91 L41 93 Z" fill="#F5A623" opacity="0.9"/>
    <path d="M62 77 L53 91 L59 93 Z" fill="#F5A623" opacity="0.9"/>

    <!-- Neck -->
    <rect x="44" y="66" width="12" height="14" rx="5" fill="#C6865C"/>
    <path d="M44 70 Q50 74 56 70 L56 67 L44 67 Z" fill="#A96B43" opacity="0.45"/>

    <!-- Ears -->
    <circle cx="29" cy="53" r="4.2" fill="#D4956A"/>
    <circle cx="71" cy="53" r="4.2" fill="#D4956A"/>
    <circle cx="29" cy="56.5" r="1.5" fill="#F5A623"/>
    <circle cx="71" cy="56.5" r="1.5" fill="#F5A623"/>

    <!-- Face -->
    <rect x="30" y="29" width="40" height="44" rx="20" fill="#DEA378"/>

    <!-- Soft Parted Bangs & Gold Headband -->
    <path d="M29 44 C30 31 39 25 50 25 C61 25 70 31 71 44 C64 36 56 34 50 37 C44 34 36 36 29 44 Z" fill="url(#guideHair)"/>
    <path d="M31 35 Q50 25 69 35" stroke="#F5A623" stroke-width="3.2" stroke-linecap="round" fill="none"/>

    <!-- Rosy Cheeks -->
    <ellipse cx="36" cy="58" rx="4" ry="2.4" fill="#F28B82" opacity="0.45"/>
    <ellipse cx="64" cy="58" rx="4" ry="2.4" fill="#F28B82" opacity="0.45"/>

    <!-- Eyes / Eyebrows -->
    ${eyeDecorations}

    <!-- Subtle Nose -->
    <path d="M49 55 Q50 58 52 57.5" stroke="#B0724A" stroke-width="1.8" stroke-linecap="round" fill="none"/>

    <!-- Mouth -->
    ${mouthPath}

    <!-- Gold Star Pin -->
    <polygon points="31,85 32.5,88.2 36,88.6 33.4,91 34.1,94.5 31,92.8 27.9,94.5 28.6,91 26,88.6 29.5,88.2" fill="#F8E71C"/>
  </g>

  <!-- Outer Ring -->
  <circle cx="50" cy="50" r="45" stroke="#2E75B6" stroke-width="2.5" fill="none"/>

  <!-- Expression Badge -->
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

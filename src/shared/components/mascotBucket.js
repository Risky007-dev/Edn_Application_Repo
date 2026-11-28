/**
 * Reusable Popcorn Math Mascot Component (Placeholder)
 * Original inline SVG representation of an animated popcorn bucket with arms and legs.
 * Uses official brand colors: Popcorn Yellow (#F5A623), Warm Kernel (#F8E71C), Navy (#1A365D), Plum (#3D1E6D).
 *
 * TODO(mascot): Artist final version will be swapped in here.
 */

const config = require('../config');

function renderBucketMascot({ expression = 'neutral', size = 96, className = '', id = '', assetConfig = config.mascots?.bucket } = {}) {
  const safeId = id ? ` id="${id}"` : '';
  const safeClass = ['mascot-bucket', className].filter(Boolean).join(' ');
  const altBase = (assetConfig && assetConfig.alt) || 'Popcorn Math bucket character mascot';

  // Swappable static image mode: driven by config.mascots.bucket (SVG remains default fallback)
  const exprMap = assetConfig && assetConfig.expressions && typeof assetConfig.expressions === 'object'
    ? assetConfig.expressions
    : null;
  const imgSrc = (exprMap && exprMap[expression]) || (assetConfig && assetConfig.imagePath) || null;

  if (imgSrc) {
    const exprAttr = exprMap ? ` data-expressions='${JSON.stringify(exprMap)}'` : '';
    return `<img${safeId} src="${imgSrc}" alt="${altBase} (${expression})" class="${safeClass} mascot-bucket-img" width="${size}" height="${size}" data-expression="${expression}"${exprAttr}>`;
  }

  // Dynamic expressions & arm gestures
  let mouthPath;
  let eyeElements;
  let armsSvg;
  let floatingKernels = '';

  switch (expression) {
    case 'happy':
      mouthPath = '<path d="M40 56 Q50 68 60 56 Z" fill="#E65100" stroke="#1A365D" stroke-width="2"/>';
      eyeElements = '<path d="M38 46 Q42 41 46 46" stroke="#1A365D" stroke-width="2.5" fill="none" stroke-linecap="round"/>' +
                    '<path d="M54 46 Q58 41 62 46" stroke="#1A365D" stroke-width="2.5" fill="none" stroke-linecap="round"/>';
      armsSvg = '<!-- Left arm relaxed, right arm waving up -->' +
                '<path d="M26 50 Q16 54 18 64" stroke="#1A365D" stroke-width="4" stroke-linecap="round" fill="none"/>' +
                '<circle cx="18" cy="65" r="4" fill="#F8E71C"/>' +
                '<path d="M74 50 Q86 42 88 32" stroke="#1A365D" stroke-width="4" stroke-linecap="round" fill="none"/>' +
                '<circle cx="89" cy="30" r="4.5" fill="#F8E71C"/>';
      break;

    case 'thinking':
      mouthPath = '<path d="M43 58 Q50 55 57 58" stroke="#1A365D" stroke-width="2.5" stroke-linecap="round" fill="none"/>';
      eyeElements = '<circle cx="42" cy="46" r="3.5" fill="#1A365D"/>' +
                    '<circle cx="58" cy="44" r="3.5" fill="#1A365D"/>' +
                    '<path d="M54 39 Q58 37 62 40" stroke="#1A365D" stroke-width="2" fill="none"/>';
      armsSvg = '<!-- Hand on chin -->' +
                '<path d="M26 52 Q18 60 22 68" stroke="#1A365D" stroke-width="4" stroke-linecap="round" fill="none"/>' +
                '<circle cx="22" cy="69" r="4" fill="#F8E71C"/>' +
                '<path d="M74 52 Q78 64 62 60" stroke="#1A365D" stroke-width="4" stroke-linecap="round" fill="none"/>' +
                '<circle cx="61" cy="59" r="4.5" fill="#F8E71C"/>';
      floatingKernels = '<circle cx="78" cy="18" r="5" fill="#F8E71C" stroke="#F5A623" stroke-width="1.5"/>' +
                        '<text x="78" y="21" font-size="7" font-weight="bold" text-anchor="middle" fill="#1A365D">?</text>';
      break;

    case 'celebrating':
      mouthPath = '<path d="M38 54 Q50 72 62 54 Z" fill="#E65100" stroke="#1A365D" stroke-width="2"/>';
      eyeElements = '<path d="M37 46 L42 42 L47 46" stroke="#1A365D" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>' +
                    '<path d="M53 46 L58 42 L63 46" stroke="#1A365D" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>';
      armsSvg = '<!-- Both arms raised celebrating -->' +
                '<path d="M26 50 Q14 40 16 28" stroke="#1A365D" stroke-width="4" stroke-linecap="round" fill="none"/>' +
                '<circle cx="16" cy="26" r="4.5" fill="#F8E71C"/>' +
                '<path d="M74 50 Q86 40 84 28" stroke="#1A365D" stroke-width="4" stroke-linecap="round" fill="none"/>' +
                '<circle cx="84" cy="26" r="4.5" fill="#F8E71C"/>';
      floatingKernels = '<!-- Popping kernels celebrating -->' +
                        '<circle cx="20" cy="14" r="6" fill="#F8E71C" stroke="#F5A623" stroke-width="1.5"/>' +
                        '<circle cx="80" cy="14" r="6" fill="#F8E71C" stroke="#F5A623" stroke-width="1.5"/>' +
                        '<circle cx="50" cy="8" r="7" fill="#F5A623" stroke="#F8E71C" stroke-width="1.5"/>' +
                        '<polygon points="32,8 34,12 38,12 35,14 36,18 32,16 28,18 29,14 26,12 30,12" fill="#3D1E6D"/>' +
                        '<polygon points="68,8 70,12 74,12 71,14 72,18 68,16 64,18 65,14 62,12 66,12" fill="#3D1E6D"/>';
      break;

    case 'neutral':
    default:
      mouthPath = '<path d="M42 56 Q50 63 58 56" stroke="#1A365D" stroke-width="3" stroke-linecap="round" fill="none"/>';
      eyeElements = '<circle cx="42" cy="46" r="3.5" fill="#1A365D"/>' +
                    '<circle cx="58" cy="46" r="3.5" fill="#1A365D"/>' +
                    '<circle cx="43" cy="45" r="1.2" fill="#FFFFFF"/>' +
                    '<circle cx="59" cy="45" r="1.2" fill="#FFFFFF"/>';
      armsSvg = '<!-- Arms relaxed at sides -->' +
                '<path d="M26 50 Q16 58 20 66" stroke="#1A365D" stroke-width="4" stroke-linecap="round" fill="none"/>' +
                '<circle cx="20" cy="67" r="4" fill="#F8E71C"/>' +
                '<path d="M74 50 Q84 58 80 66" stroke="#1A365D" stroke-width="4" stroke-linecap="round" fill="none"/>' +
                '<circle cx="80" cy="67" r="4" fill="#F8E71C"/>';
      break;
  }

  return `<!-- TODO(mascot): Artist final version will be swapped in here -->
<svg${safeId} class="${safeClass}" width="${size}" height="${size}" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Popcorn Math bucket character mascot (${expression})">
  <defs>
    <linearGradient id="bucketGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#FFFFFF"/>
      <stop offset="100%" stop-color="#F5A623"/>
    </linearGradient>
    <linearGradient id="kernelGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#FFFFFF"/>
      <stop offset="100%" stop-color="#F8E71C"/>
    </linearGradient>
  </defs>

  <!-- Legs & Feet -->
  <path d="M40 76 L36 90" stroke="#1A365D" stroke-width="4" stroke-linecap="round"/>
  <ellipse cx="33" cy="91" rx="6" ry="3.5" fill="#3D1E6D"/>
  <path d="M60 76 L64 90" stroke="#1A365D" stroke-width="4" stroke-linecap="round"/>
  <ellipse cx="67" cy="91" rx="6" ry="3.5" fill="#3D1E6D"/>

  <!-- Arms -->
  ${armsSvg}

  <!-- Tapered Popcorn Bucket Body -->
  <path d="M26 36 L32 76 Q50 79 68 76 L74 36 Q50 33 26 36 Z" fill="#F8F9FA" stroke="#1A365D" stroke-width="2.5"/>

  <!-- Bucket Stripes (Brand Navy & Popcorn Yellow) -->
  <path d="M35 36 L39 76.5 L45 77 L42 35.5 Z" fill="#F5A623"/>
  <path d="M48 35.5 L49 77 L52 77 L52 35.5 Z" fill="#1A365D"/>
  <path d="M55 35.5 L55 77 L61 76.5 L65 36 Z" fill="#F5A623"/>

  <!-- Bucket Top Rim / Plum Banner -->
  <ellipse cx="50" cy="35" rx="25" ry="4.5" fill="#3D1E6D" stroke="#1A365D" stroke-width="1.5"/>

  <!-- Popping Popcorn Heap on Top -->
  <!-- Back cluster -->
  <circle cx="34" cy="28" r="9" fill="url(#kernelGrad)" stroke="#1A365D" stroke-width="1.5"/>
  <circle cx="66" cy="28" r="9" fill="url(#kernelGrad)" stroke="#1A365D" stroke-width="1.5"/>
  <circle cx="50" cy="22" r="11" fill="#FFFFFF" stroke="#1A365D" stroke-width="1.5"/>
  <!-- Front clusters -->
  <circle cx="41" cy="27" r="8.5" fill="url(#kernelGrad)" stroke="#1A365D" stroke-width="1.5"/>
  <circle cx="59" cy="27" r="8.5" fill="url(#kernelGrad)" stroke="#1A365D" stroke-width="1.5"/>
  <circle cx="50" cy="30" r="7" fill="#F8E71C" stroke="#1A365D" stroke-width="1.5"/>

  <!-- Mascot Face on Front of Bucket -->
  <!-- Rosy cheeks -->
  <circle cx="34" cy="50" r="3" fill="#FF8A80" opacity="0.5"/>
  <circle cx="66" cy="50" r="3" fill="#FF8A80" opacity="0.5"/>

  <!-- Eyes -->
  ${eyeElements}

  <!-- Mouth -->
  ${mouthPath}

  <!-- Floating / Popping Kernels in expression mode -->
  ${floatingKernels}
</svg>`;
}

module.exports = {
  renderBucketMascot
};

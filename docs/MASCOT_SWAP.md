# Swapping the Guide & Bucket Mascot Artwork

Both site mascots default to original inline SVG placeholders and can be swapped via configuration without editing templates:

1. **Tutor Time Guide Mascot** (`src/shared/components/mascotGuide.js`, configured via `config.mascots.guide`): used on the homepage hero, Readiness Check, and AI Chatbot widget.
2. **Popcorn Math Bucket Mascot** (`src/shared/components/mascotBucket.js`, configured via `config.mascots.bucket`): used on the Popcorn Math hub and mini-game.

> **Important Approval & Privacy Rule:** Real photographs of Teacher Cassie (Kashamar Lewis) must **not** be committed to git or bundled into Docker builds without Cassie's explicit approval, and must **never** be used for the Popcorn Bucket mascot.

## Option 1: Single Image Override via Environment Variables

Place approved artwork under `MyWebApp/src/main/webapp/assets/mascots/` and set:

```env
GUIDE_MASCOT_IMAGE_PATH=/assets/mascots/kashamar.png
BUCKET_MASCOT_IMAGE_PATH=/assets/mascots/popcorn-bucket.png
```

Leaving either variable unset (or `null` in `src/shared/config.js`) falls back cleanly to the built-in inline SVG.

## Option 2: Expression-Specific Image Set (Guide Mascot)

To preview or serve distinct images per expression (`neutral`, `happy`, `thinking`, `celebrating`):

- **Local preview (gitignored & Docker-ignored):**
  Place `guide-neutral.jpg`, `guide-happy.jpg`, `guide-thinking.jpg`, and `guide-celebrating.jpg` in `MyWebApp/src/main/webapp/assets/mascots-local-preview/` and start the server with:
  ```env
  GUIDE_MASCOT_EXPRESSIONS_DIR=/assets/mascots-local-preview
  ```
- **Production (after approval):**
  Configure `mascots.guide.expressions` (or `mascots.bucket.expressions`) in `src/shared/config.js`. `MyWebApp/src/main/webapp/js/readiness.js` automatically reads `data-expressions` and swaps the `<img>` `src` on each quiz reaction.

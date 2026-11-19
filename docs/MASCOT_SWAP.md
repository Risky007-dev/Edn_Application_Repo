# Swapping the Guide Mascot Artwork

The Tutor Time Guide mascot (used on the homepage hero, the CPEA Readiness Check, and the AI Chatbot widget) is currently an inline SVG placeholder rendered by `renderGuideMascot()` in `src/shared/components/mascotGuide.js`.

It is driven by a single config object: `mascots.guide` in `src/shared/config.js`.

## Option 1: Single Image Asset (Quickest)

1. Place Cassie's approved artwork in `MyWebApp/src/main/webapp/assets/mascots/` (e.g. `kashamar.png` or `kashamar.svg`).
2. Either:
   - Set the environment variable `GUIDE_MASCOT_IMAGE_PATH=/assets/mascots/kashamar.png`, **or**
   - Update `mascots.guide.imagePath` in `src/shared/config.js`:
     ```js
     mascots: {
       guide: {
         imagePath: '/assets/mascots/kashamar.png',
         expressions: null,
         alt: 'Tutor Time Guide avatar'
       }
     }
     ```
3. In this mode, `renderGuideMascot()` renders an `<img>` tag with `data-expression="..."`, and `MyWebApp/src/main/webapp/js/readiness.js` updates `data-expression` during the quiz so CSS state transitions (`.mascot-guide[data-expression="celebrating"]`, etc.) still animate reactions.

## Option 2: Expression-Specific Image Set

If Cassie provides separate images for each mood (`neutral`, `happy`, `thinking`, `celebrating`), set `mascots.guide.expressions` in `src/shared/config.js`:

```js
mascots: {
  guide: {
    imagePath: '/assets/mascots/kashamar-neutral.png',
    expressions: {
      neutral: '/assets/mascots/kashamar-neutral.png',
      happy: '/assets/mascots/kashamar-happy.png',
      thinking: '/assets/mascots/kashamar-thinking.png',
      celebrating: '/assets/mascots/kashamar-celebrating.png'
    },
    alt: 'Tutor Time Guide avatar'
  }
}
```

`readiness.js` automatically reads `data-expressions` and swaps the `<img>` `src` as the student answers questions.

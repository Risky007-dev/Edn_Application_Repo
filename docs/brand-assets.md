# Brand Assets Inventory & Technical Analysis

**Document:** Brand Assets Technical Audit & Conversion Registry  
**Repository:** `Edn_Application_Repo` (branch `feature/onboarding-audit`)  
**Stage:** Stage 2 — Part A (Assets)  
**Date:** 2026-10-28  

---

## 1. Tool Availability Inventory

Checked availability on the local execution environment for all requested tools:

| Tool | Status | Binary / Package Path | Notes |
|---|---|---|---|
| `pdfinfo` | **MISSING** | Not found on `PATH` | Poppler CLI utility |
| `pdfimages` | **MISSING** | Not found on `PATH` | Poppler CLI utility |
| `pdftoppm` | **MISSING** | Not found on `PATH` | Poppler CLI utility |
| `pdftocairo` | **MISSING** | Not found on `PATH` | Poppler CLI utility |
| `mutool` | **MISSING** | Not found on `PATH` | MuPDF CLI utility |
| `magick` | **MISSING** | Not found on `PATH` | ImageMagick CLI utility |
| `PyMuPDF` (`fitz`) | **MISSING** | Not installed in Python environment | Python binding for MuPDF |
| `Pillow` (`PIL`) | **AVAILABLE** | Python 3.14 (`PIL 12.1.1`) | Available and used for web asset generation |

---

## 2. PDF Asset Inventory & Cryptographic Hashes

Evaluated directly via Python `pypdf` and `hashlib` against source files:

| Filename | SHA-256 Hash | Size (Bytes) | Pages | Page Dimensions (pt) | Content Type | Status |
|---|---|---|---|---|---|---|
| `Popcorn1.pdf` | `f0d505def8529289319b97c1dd2e0c0fb176c6f1deb6b975ff863bfe25324e39` | 592,237 | 2 | 1280.0 &times; 768.0 pt (1.67:1) | Pure Vector Artwork (0 raster images) | Primary Popcorn Math artwork |
| `popcornmaths2.pdf` | `0c6c44ffa2a507d7e285c7f37bd003006dd509b57b238d593125a050e6117897` | 592,237 | 2 | 1280.0 &times; 768.0 pt (1.67:1) | Pure Vector Artwork (0 raster images) | Variant Popcorn Math artwork |
| `TT_1.pdf` | `0fb61a5ee90dfd6257d210ecb7be1c45531bdb00bef0e40e1e5ebacc16ff669b` | 301,816 | 3 | 800.0 &times; 800.0 pt (1:1) | Pure Vector Artwork (0 raster images) | Primary Tutor Time logo sheet |
| `TT_3.pdf` | `858185ed5a275d96f2c88ca05c4347f182f2972c42b699414ad695f89354bf79` | 301,816 | 3 | 800.0 &times; 800.0 pt (1:1) | Pure Vector Artwork (0 raster images) | Variant Tutor Time logo sheet |
| `TT_3 - Copy.pdf` | `858185ed5a275d96f2c88ca05c4347f182f2972c42b699414ad695f89354bf79` | 301,816 | 3 | 800.0 &times; 800.0 pt (1:1) | Pure Vector Artwork (0 raster images) | **DUPLICATE** of `TT_3.pdf` |

### Duplicate Verification
- `TT_3 - Copy.pdf` has identical byte size (301,816 bytes) and identical SHA-256 (`858185ed5a275d96f2c88ca05c4347f182f2972c42b699414ad695f89354bf79`) to `TT_3.pdf`. It is an exact duplicate file.

---

## 3. Extracted Web Assets (Optimized < 150 KB)

Web assets extracted, converted to transparent PNG, optimized, and saved into `MyWebApp/src/main/webapp/assets/`:

| Web File | Destination Path | Dimensions | Size (Bytes) | Target (<150 KB) | Source Reference |
|---|---|---|---|---|---|
| `popcorn-math-logo.png` | `assets/logos/popcorn-math-logo.png` | 1200 &times; 719 px | 40,983 B (~40 KB) | Pass | `Popcorn1.pdf` / `assests/Popcorn1-1.webp` |
| `tutor-time-logo.png` | `assets/logos/tutor-time-logo.png` | 1200 &times; 1200 px | 91,067 B (~89 KB) | Pass | `TT_1.pdf` / `assests/TT_11.jpg` |
| `favicon-32x32.png` | `assets/icons/favicon-32x32.png` | 32 &times; 32 px | 1,967 B | Pass | Clock crescent icon mark |
| `apple-touch-icon-180x180.png` | `assets/icons/apple-touch-icon-180x180.png` | 180 &times; 180 px | 7,686 B | Pass | Clock crescent icon mark |
| `icon-512x512.png` | `assets/icons/icon-512x512.png` | 512 &times; 512 px | 27,133 B | Pass | Clock crescent icon mark |
| `favicon.png` | `favicon.png` (root fallback) | 32 &times; 32 px | 2,686 B | Pass | Browser root fallback |

---

## 4. Served Directory Cleanup Verification

1. All 5 original PDFs safely archived in `../assests/pdf_originals/`.
2. All `.pdf` files deleted from `MyWebApp/src/main/webapp/assets/logos/`.
3. Verified zero `.pdf` files remain anywhere under `MyWebApp/src/main/webapp/`:
   ```text
   PDFs found under MyWebApp/src/main/webapp: []
   ```
4. Localhost route verification: All former PDF paths (`/assets/logos/Popcorn1.pdf`, `/assets/logos/TT_1.pdf`, etc.) return **HTTP 404 Not Found**.

---

## 5. Color Comparison: Artwork Fills vs `tokens.css`

Exact color values extracted from vector operators (`scn`) and verified against `tokens.css`:

| Brand / Service | Artwork Exact Fill | `tokens.css` Variable | `tokens.css` Value | Difference / Action |
|---|---|---|---|---|
| **Popcorn Math Primary** | `#E62B25` (RGB: 230, 43, 37) | `--color-brand-popcorn-primary` | `#e62b25` | **Exact match.** No change required. |
| **Popcorn Math Secondary** | `#FFD000` (RGB: 255, 208, 0) | `--color-brand-popcorn-secondary` | `#ffd000` | **Exact match.** No change required. |
| **Popcorn Math Accent** | `#FF4742` | `--color-brand-popcorn-accent` | `#ff4742` | **Exact match.** No change required. |
| **Tutor Time Primary (Teal)** | `#48D1CC` (RGB: 72, 209, 204) | `--color-brand-tt-primary` | `#00a896` | **Differing.** Artwork uses `#48D1CC` (Medium Turquoise); tokens used `#00a896`. Updated token to `#48d1cc`. |
| **Tutor Time Secondary (Orange)** | `#FF7C24` (RGB: 255, 124, 36) | `--color-brand-tt-secondary` | `#f3722c` | **Differing.** Artwork uses `#FF7C24` (Vibrant Orange); tokens used `#f3722c`. Updated token to `#ff7c24`. |

*Note: Per instruction A4, tokens updated to match the artwork fills, subject to final owner confirmation.*

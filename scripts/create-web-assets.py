"""
Generate optimized web logo assets (< 150 KB) and favicons.
"""
from PIL import Image
import os

logos_dir = 'MyWebApp/src/main/webapp/assets/logos'
icons_dir = 'MyWebApp/src/main/webapp/assets/icons'
os.makedirs(icons_dir, exist_ok=True)
os.makedirs(logos_dir, exist_ok=True)

# 1. Popcorn Math Logo
# Source: popcorn-math-logo.png (or ../assests/Popcorn1-2.webp)
popcorn_src = os.path.join(logos_dir, 'popcorn-math-logo.png')
if os.path.exists(popcorn_src):
    im_pop = Image.open(popcorn_src).convert('RGBA')
    w, h = im_pop.size
    new_w = 1200
    new_h = int(h * (new_w / w))
    im_pop_resized = im_pop.resize((new_w, new_h), Image.Resampling.LANCZOS)
    
    # Quantize to adaptive 256-color palette to compress PNG under 150 KB
    im_pop_opt = im_pop_resized.quantize(colors=256)
    dest_pop = os.path.join(logos_dir, 'popcorn-math-logo.png')
    im_pop_opt.save(dest_pop, 'PNG', optimize=True)
    print(f"Optimized {dest_pop}: {im_pop_resized.size}, {os.path.getsize(dest_pop)} bytes")

# 2. Tutor Time Logo
tt_src = '../assests/TT_11.jpg'
if os.path.exists(tt_src):
    im_tt = Image.open(tt_src).convert('RGBA')
    datas = im_tt.getdata()
    newData = []
    for item in datas:
        if item[0] > 240 and item[1] > 240 and item[2] > 240:
            newData.append((255, 255, 255, 0))
        else:
            newData.append(item)
    im_tt.putdata(newData)
    
    im_tt_1200 = im_tt.resize((1200, 1200), Image.Resampling.LANCZOS)
    im_tt_opt = im_tt_1200.quantize(colors=256)
    dest_tt = os.path.join(logos_dir, 'tutor-time-logo.png')
    im_tt_opt.save(dest_tt, 'PNG', optimize=True)
    print(f"Optimized {dest_tt}: {im_tt_1200.size}, {os.path.getsize(dest_tt)} bytes")

    # Favicons:
    for size, name in [(32, 'favicon-32x32.png'), (180, 'apple-touch-icon-180x180.png'), (512, 'icon-512x512.png')]:
        fav = im_tt.resize((size, size), Image.Resampling.LANCZOS)
        fav_opt = fav.quantize(colors=256)
        fav_path = os.path.join(icons_dir, name)
        fav_opt.save(fav_path, 'PNG', optimize=True)
        print(f"Optimized {fav_path}: {fav.size}, {os.path.getsize(fav_path)} bytes")

root_fav = 'MyWebApp/src/main/webapp/favicon.png'
im_tt.resize((32, 32), Image.Resampling.LANCZOS).save(root_fav, 'PNG', optimize=True)
print(f"Optimized {root_fav}: {os.path.getsize(root_fav)} bytes")

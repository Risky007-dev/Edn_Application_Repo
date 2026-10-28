import os
import re
import hashlib
import pypdf

files = ['Popcorn1.pdf', 'TT_1.pdf', 'TT_3 - Copy.pdf', 'TT_3.pdf', 'popcornmaths2.pdf']

print("================================================================")
print("             PDF ASSET INVENTORY & VECTOR ANALYSIS              ")
print("================================================================\n")

for name in files:
    path = os.path.join('../assests', name)
    if not os.path.exists(path):
        continue
    raw = open(path, 'rb').read()
    sha256 = hashlib.sha256(raw).hexdigest()
    size_kb = len(raw) / 1024
    
    reader = pypdf.PdfReader(path)
    num_pages = len(reader.pages)
    
    print(f"File: {name}")
    print(f"  SHA-256: {sha256}")
    print(f"  File Size: {size_kb:.2f} KB ({len(raw)} bytes)")
    print(f"  Page Count: {num_pages}")
    
    for i, p in enumerate(reader.pages):
        mb = p.mediabox
        w = float(mb.width)
        h = float(mb.height)
        
        # Check images
        images = list(p.images)
        has_raster = len(images) > 0
        
        # Check content stream
        contents = p.get_contents()
        rg_fills = []
        k_fills = []
        g_fills = []
        
        if contents:
            data = contents.get_data().decode('latin1', errors='ignore')
            rg_fills = re.findall(r'([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+rg\b', data)
            k_fills = re.findall(r'([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+k\b', data)
            g_fills = re.findall(r'([\d.]+)\s+g\b', data)

        print(f"  --- Page {i+1} ---")
        print(f"    Page Dimensions: {w:.1f} pt x {h:.1f} pt (Aspect: {w/h:.2f}:1)")
        print(f"    Vector or Raster: {'Embedded Raster' if has_raster else 'Pure Vector Artwork'}")
        if has_raster:
            print(f"    Embedded Images: {[img.name for img in images]}")
        else:
            print(f"    Embedded Images: 0 (No raster images found)")
        
        # Convert RGB fills to hex
        unique_rg = set(rg_fills)
        hex_colors = []
        for r, g, b in unique_rg:
            rf, gf, bf = float(r), float(g), float(b)
            hex_val = f"#{int(rf*255):02x}{int(gf*255):02x}{int(bf*255):02x}"
            hex_colors.append(hex_val)
        
        if hex_colors:
            print(f"    Detected RGB Fills: {hex_colors}")
        if k_fills:
            print(f"    Detected CMYK Fills: {set(k_fills)}")
        if g_fills:
            print(f"    Detected Gray Fills: {set(g_fills)}")
    print()

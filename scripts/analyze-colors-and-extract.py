"""
Analyze exact colors and generate web-ready logo PNGs and favicons.
"""
from PIL import Image
import os
import json

def get_palette_samples(img_path):
    img = Image.open(img_path).convert('RGB')
    # Get colors sorted by count
    colors = img.getcolors(maxcolors=2000000)
    if not colors:
        return []
    colors.sort(reverse=True, key=lambda x: x[0])
    return colors[:20]

def hex_color(rgb):
    return '#{:02X}{:02X}{:02X}'.format(rgb[0], rgb[1], rgb[2])

print("--- Popcorn1-1.webp color analysis ---")
for count, rgb in get_palette_samples('../assests/Popcorn1-1.webp')[:10]:
    print(f"  Count: {count}, RGB: {rgb}, HEX: {hex_color(rgb)}")

print("--- TT_11.jpg color analysis ---")
for count, rgb in get_palette_samples('../assests/TT_11.jpg')[:10]:
    print(f"  Count: {count}, RGB: {rgb}, HEX: {hex_color(rgb)}")

print("--- TT_3-2.webp color analysis ---")
for count, rgb in get_palette_samples('../assests/TT_3-2.webp')[:10]:
    print(f"  Count: {count}, RGB: {rgb}, HEX: {hex_color(rgb)}")

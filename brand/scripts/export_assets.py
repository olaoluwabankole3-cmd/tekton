#!/usr/bin/env python3
"""Export TEKTON v2 brand raster images from the checked SVG masters.

Use: python -m pip install -r brand/scripts/requirements.txt
     python brand/scripts/export_assets.py
Do not use earlier v1 logo artwork.
"""
from pathlib import Path
import io
from PIL import Image
import cairosvg

ROOT = Path(__file__).resolve().parents[1]
EXPORTS = {
    "logos/svg/tekton-primary-light.svg": ("logos/png/tekton-logo-charcoal-transparent.png", 1400),
    "logos/svg/tekton-primary-dark.svg": ("logos/png/tekton-logo-white-transparent.png", 1400),
    "logos/svg/tekton-tagline-light.svg": ("logos/png/tekton-logo-with-tagline.png", 1400),
    "icons/svg/tekton-symbol-light.svg": ("icons/png/tekton-symbol-1024.png", 1024),
    "icons/svg/tekton-symbol-dark.svg": ("icons/png/tekton-symbol-white-1024.png", 1024),
    "icons/svg/tekton-app-icon-dark.svg": ("icons/png/tekton-app-icon-dark-512.png", 512),
    "icons/svg/tekton-app-icon-light.svg": ("icons/png/tekton-app-icon-light-512.png", 512),
}
for source, (target, width) in EXPORTS.items():
    data = (ROOT / source).read_bytes()
    out = ROOT / target
    out.parent.mkdir(parents=True, exist_ok=True)
    cairosvg.svg2png(bytestring=data, write_to=str(out), output_width=width)
    print(f"Exported: {out.relative_to(ROOT)}")
favicon_svg = (ROOT / "icons/svg/tekton-app-icon-dark.svg").read_bytes()
favicon_png = cairosvg.svg2png(bytestring=favicon_svg, output_width=256)
Image.open(io.BytesIO(favicon_png)).convert("RGBA").save(
    ROOT / "icons/png/favicon.ico",
    sizes=[(16, 16), (32, 32), (48, 48), (64, 64)]
)
print("Exported: icons/png/favicon.ico")

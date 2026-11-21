#!/usr/bin/env python3
"""Fail the export if the approved logo's roof and pillar intersect."""
import json
from pathlib import Path
from shapely.geometry import Polygon
from shapely.ops import unary_union

source = Path(__file__).resolve().parents[1] / "guidelines/logo-geometry-QA.json"
d = json.loads(source.read_text())
roof = unary_union([Polygon(d["roof_left"]), Polygon(d["roof_right"])])
stem = Polygon(d["detached_stem"])
assert roof.intersection(stem).area == 0, "Invalid logo: roof overlaps vertical pillar"
assert roof.distance(stem) >= 6, "Insufficient negative space below roof"
print(f"PASS: zero overlap; gap {roof.distance(stem):.3f} SVG units")

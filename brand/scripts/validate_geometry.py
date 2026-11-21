#!/usr/bin/env python3
from pathlib import Path
import json
from shapely.geometry import Polygon
from shapely.ops import unary_union
d=json.loads((Path(__file__).resolve().parents[1]/"guidelines/logo-geometry-QA.json").read_text())
roof=unary_union([Polygon(d["roof_left"]), Polygon(d["roof_right"])])
stem=Polygon(d["pillar"])
assert roof.intersection(stem).area==0, "Roof overlaps approved pillar"
assert 8<roof.distance(stem)<15, "Approved pillar clearance drifted"
assert d["symbol_wordmark_ink_height_ratio"]==136/52
print("PASS: TEKTON approved proportions, detached pillar, stable lockup ratio")

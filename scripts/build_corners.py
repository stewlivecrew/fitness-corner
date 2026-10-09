#!/usr/bin/env python3
"""Regenerate the SG_CORNERS array (public fitness-corner locations) in
sandbox.html and fitness-corner-generator.jsx from NParks / URA open data on
data.gov.sg. Stdlib only.

Sources (all Singapore Open Data Licence v1.0, https://data.gov.sg/open-data-licence):
  - NParks "Park Facilities"        d_14d807e20158338fd578c2913953516e  (CLASS == "FITNESS AREA" -> the corners)
  - NParks "NParks Parks and Nature Reserves" d_77d7ec97be83d44f61b85454f844382f (polygons -> park name)
  - NParks "Park Connector Loop"     d_a69ef89737379f231d2ae93fd1c5707f  (lines -> PCN name, if within 60 m)
  - URA "Master Plan 2025 Planning Area Boundary (No Sea)" d_2cc750190544007400b2cfd5d7f53209 (-> area name, for search)

Downloads are cached in build/corners-src/ (gitignored). Pass --refresh to
re-download. The output is bundled in the app (works offline, no runtime
requests). After running: npm run release (or just commit sandbox.html).

Usage: python3 scripts/build_corners.py [--refresh]
"""
import json
import math
import re
import subprocess
import sys
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CACHE = ROOT / "build" / "corners-src"
TARGETS = [ROOT / "sandbox.html", ROOT / "fitness-corner-generator.jsx"]
DATASETS = {
    "facilities": "d_14d807e20158338fd578c2913953516e",
    "parks": "d_77d7ec97be83d44f61b85454f844382f",
    "pcn": "d_a69ef89737379f231d2ae93fd1c5707f",
    "areas": "d_2cc750190544007400b2cfd5d7f53209",
}
MERGE_M = 30      # facility points closer than this are one corner
PARK_NEAR_M = 80  # outside every park polygon: take the nearest park within this
PCN_NEAR_M = 60   # PCN line within this -> "on the <name> PCN"


def curl(url):
    return subprocess.run(["curl", "-sfL", url], check=True, capture_output=True).stdout


def fetch(key):
    CACHE.mkdir(parents=True, exist_ok=True)
    path = CACHE / f"{key}.geojson"
    if "--refresh" in sys.argv or not path.exists():
        did = DATASETS[key]
        meta = json.loads(curl(f"https://api-open.data.gov.sg/v1/public/api/datasets/{did}/poll-download"))
        path.write_bytes(curl(meta["data"]["url"]))
        print(f"downloaded {key} ({did})")
    return json.loads(path.read_text())


# ---- geometry (lng/lat, local metres — fine at Singapore's scale) ----
KX = 111320 * math.cos(math.radians(1.35))
KY = 110574


def xy(p):
    return (p[0] * KX, p[1] * KY)


def dist(a, b):
    return math.hypot(a[0] - b[0], a[1] - b[1])


def seg_dist(p, a, b):
    dx, dy = b[0] - a[0], b[1] - a[1]
    L = dx * dx + dy * dy
    t = 0 if L == 0 else max(0, min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L))
    return dist(p, (a[0] + t * dx, a[1] + t * dy))


def polys(geom):
    if geom["type"] == "Polygon":
        return [geom["coordinates"]]
    if geom["type"] == "MultiPolygon":
        return geom["coordinates"]
    return []


def lines(geom):
    if geom["type"] == "LineString":
        return [geom["coordinates"]]
    if geom["type"] == "MultiLineString":
        return geom["coordinates"]
    return []


def in_ring(p, ring):
    x, y = p
    inside = False
    j = len(ring) - 1
    for i in range(len(ring)):
        xi, yi = ring[i][0], ring[i][1]
        xj, yj = ring[j][0], ring[j][1]
        if (yi > y) != (yj > y) and x < (xj - xi) * (y - yi) / (yj - yi) + xi:
            inside = not inside
        j = i
    return inside


def in_geom(p, geom):
    for poly in polys(geom):
        if in_ring(p, poly[0]) and not any(in_ring(p, h) for h in poly[1:]):
            return True
    return False


def edge_dist(pm, geom):
    best = 1e18
    for coords in [r for poly in polys(geom) for r in poly] + lines(geom):
        pts = [xy(c) for c in coords]
        for a, b in zip(pts, pts[1:]):
            best = min(best, seg_dist(pm, a, b))
    return best


def bbox(geom):
    cs = [c for poly in polys(geom) for r in poly for c in r] + [c for ln in lines(geom) for c in ln]
    return (min(c[0] for c in cs), min(c[1] for c in cs), max(c[0] for c in cs), max(c[1] for c in cs))


def near_bbox(p, bb, m):
    dx, dy = m / KX, m / KY
    return bb[0] - dx <= p[0] <= bb[2] + dx and bb[1] - dy <= p[1] <= bb[3] + dy


# ---- names ----
ABBR = {"PG": "Playground", "PK": "Park", "OS": "Open Space", "PC": "PCN", "GDNS": "Gardens",
        "GDN": "Garden", "RD": "Rd", "JLN": "Jln", "AVE": "Ave", "DR": "Dr", "ST": "St",
        "CRES": "Cres", "LOR": "Lor", "BT": "Bt", "TG": "Tg", "STH": "Sth", "NTH": "Nth",
        "SBG": "Singapore Botanic Gardens"}
KEEP_UPPER = {"PCN", "FC", "JLG", "EC", "HDB", "AMK", "CCK", "ECP", "MCE", "KJE", "PIE", "BKE", "SLE", "TPE", "CTE", "AYE", "ECO"}


def nice(s):
    s = re.sub(r"\s+", " ", (s or "").replace("\r", " ").replace("\n", " ")).strip()
    out = []
    for w in s.split(" "):
        u = w.upper()
        if u in ABBR:
            out.append(ABBR[u])
        elif u in KEEP_UPPER and u != "ECO":
            out.append(u)
        elif re.fullmatch(r"[A-Z]", u) or re.fullmatch(r"\d+[A-Z]?", u):
            out.append(u)
        else:
            out.append("-".join(re.sub(r"^(\W*)(\w)", lambda m: m.group(1) + m.group(2).upper(), x.lower()) for x in w.split("-")))
    s = " ".join(out)
    s = re.sub(r"(\w)'S\b", r"\1's", s)
    s = re.sub(r"\bJlg\b", "JLG", s)
    return s.replace("Hortpark", "HortPark")


def pcn_name(s):
    s = re.split(r"[\r\n]", s or "")[0]
    s = re.sub(r"\s*\(.*$", "", s).strip()
    s = re.sub(r"\bPC\b", "PCN", s)
    s = re.sub(r"\bPark Connector\b", "PCN", s)
    return s


def desc(raw):
    r = (raw or "").strip()
    lo = r.lower()
    if not r or re.fullmatch(r"[\d\s]+", r):
        return ""
    if "3g" in lo:
        return "3-generation (3G) fitness area"
    if "adult" in lo:
        return "Adult fitness area"
    if "sand pit" in lo:
        return "Fitness sand pit"
    if lo in ("fitness", "fitness equipment", "fitness corner", "fitness area", "playground", "epdm flooring") \
            or re.fullmatch(r"playground \d+", lo):
        return ""
    return ""  # free-text names that echo the park name add nothing


def main():
    fac = fetch("facilities")
    parks = fetch("parks")
    pcn = fetch("pcn")
    areas = fetch("areas")

    pts = [f for f in fac["features"] if (f["properties"].get("CLASS") or "").upper() == "FITNESS AREA"
           and f["geometry"] and f["geometry"]["type"] == "Point"]
    pts.sort(key=lambda f: f["properties"]["UNIQUEID"])
    # Merge points that are the same corner (several stations logged separately).
    groups = []
    for f in pts:
        c = f["geometry"]["coordinates"]
        for g in groups:
            if dist(xy(c), xy(g["c"])) < MERGE_M:
                g["m"].append(f)
                break
        else:
            groups.append({"c": c, "m": [f]})

    park_idx = [(f, bbox(f["geometry"])) for f in parks["features"] if f["geometry"]]
    pcn_idx = [(f, bbox(f["geometry"])) for f in pcn["features"] if f["geometry"]]
    area_idx = [(f, bbox(f["geometry"])) for f in areas["features"] if f["geometry"]]

    out = []
    for g in groups:
        p = g["c"]
        pm = xy(p)
        park = None
        for f, bb in park_idx:
            if near_bbox(p, bb, 0) and in_geom(p, f["geometry"]):
                park = f["properties"]["NAME"]
                break
        if not park:
            best = (PARK_NEAR_M, None)
            for f, bb in park_idx:
                if near_bbox(p, bb, PARK_NEAR_M):
                    d = edge_dist(pm, f["geometry"])
                    if d < best[0]:
                        best = (d, f["properties"]["NAME"])
            park = best[1]
        best = (PCN_NEAR_M, None)
        for f, bb in pcn_idx:
            if near_bbox(p, bb, PCN_NEAR_M):
                d = edge_dist(pm, f["geometry"])
                if d < best[0]:
                    best = (d, f["properties"].get("PARK"))
        pcn_n = pcn_name(best[1]) if best[1] else ""
        area = ""
        for f, bb in area_idx:
            if near_bbox(p, bb, 0) and in_geom(p, f["geometry"]):
                area = nice(f["properties"]["PLN_AREA_N"])
                break
        descs = [d for d in (desc(f["properties"].get("NAME")) for f in g["m"]) if d]
        name = nice(park) if park else (pcn_n if pcn_n else f"Fitness area, {area or 'Singapore'}")
        out.append({"id": g["m"][0]["properties"]["UNIQUEID"], "name": name, "desc": descs[0] if descs else "",
                    "lat": round(p[1], 5), "lng": round(p[0], 5), "area": area,
                    "pcn": pcn_n if pcn_n and pcn_n != name else ""})

    # Several corners in one park: number them west -> east so names stay unique.
    by_name = {}
    for c in out:
        by_name.setdefault(c["name"], []).append(c)
    for nm, cs in by_name.items():
        if len(cs) > 1:
            for k, c in enumerate(sorted(cs, key=lambda c: (c["lng"], c["lat"])), 1):
                c["name"] = f"{nm} #{k}"
    out.sort(key=lambda c: c["name"])

    stamp = date.today().isoformat()
    js = lambda s: json.dumps(s, ensure_ascii=False)
    lines_ = [
        "// GENERATED by scripts/build_corners.py — do not hand-edit.",
        f"// Contains information from Park Facilities, NParks Parks and Nature Reserves and Park Connector Loop (NParks) and",
        f"// Master Plan 2025 Planning Area Boundary (URA), accessed {stamp} from data.gov.sg, made available under the",
        "// Singapore Open Data Licence v1.0 (https://data.gov.sg/open-data-licence).",
        f'const SG_CORNERS_META = {{ accessed: "{stamp}", count: {len(out)} }};',
        "// [datasetId, name, description, lat, lng, planning area, park connector]",
        "const SG_CORNERS = [",
    ]
    for c in out:
        lines_.append(f'  [{js(c["id"])}, {js(c["name"])}, {js(c["desc"])}, {c["lat"]}, {c["lng"]}, {js(c["area"])}, {js(c["pcn"])}],')
    lines_.append("];")
    block = "\n".join(lines_)
    pat = re.compile(r"// GENERATED by scripts/build_corners\.py.*?\nconst SG_CORNERS = \[.*?\n\];", re.S)
    for t in TARGETS:
        text = t.read_text()
        if not pat.search(text):
            print(f"WARNING: no SG_CORNERS block in {t.name}", file=sys.stderr)
            continue
        t.write_text(pat.sub(lambda _: block, text, count=1))
        print(f"Wrote {len(out)} corners ({len(pts)} facility points) into {t.name}")
    stats = {"points": len(pts), "corners": len(out), "with_park": sum(1 for c in out if not c["name"].startswith("Fitness area")),
             "with_pcn": sum(1 for c in out if c["pcn"]), "with_area": sum(1 for c in out if c["area"])}
    print(stats)


if __name__ == "__main__":
    main()

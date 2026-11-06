"""HydroRIVERS v1.0 (eu) → Türkiye'den doğan akarsular + denize kadar akış yolları → veri/nehirler.json

Kullanım: <pyshp kurulu python> araclar/hazirla.py
Seçim: Türkiye sınırları içinde kalan, yukarı havzası ≥ ESIK km² olan parçalar ve onların denize/göle kadar bütün aşağı parçaları.
"""
import json, math
from pathlib import Path
import shapefile

KOK = Path(__file__).resolve().parent.parent
ESIK = 100  # km²
r = shapefile.Reader(str(KOK / "ham/HydroRIVERS_v10_eu_shp/HydroRIVERS_v10_eu"))
alan = [f[0] for f in r.fields[1:]]
I = {a: i for i, a in enumerate(alan)}

# Türkiye sınırı (il çokgenleri birleşik) — nokta içinde mi testi
gj = json.load(open(KOK / "../goc-haritasi/ham/tur_adm1.geojson", encoding="utf-8"))
halkalar = []
for f in gj["features"]:
    g = f["geometry"]
    for poly in ([g["coordinates"]] if g["type"] == "Polygon" else g["coordinates"]):
        halkalar.append(poly[0])
def icinde(x, y):
    ic = False
    for h in halkalar:
        for i in range(len(h) - 1):
            (x1, y1), (x2, y2) = h[i][:2], h[i + 1][:2]
            if (y1 > y) != (y2 > y) and x < (x2 - x1) * (y - y1) / (y2 - y1) + x1:
                ic = not ic
    return ic

kayit = {}
sec = set()
print("okunuyor…", flush=True)
for sr in r.iterShapeRecords(bbox=[25.5, 35.7, 45.0, 42.2]):
    rec = sr.record
    if rec[I["UPLAND_SKM"]] < ESIK:
        continue
    pts = sr.shape.points
    mx, my = pts[len(pts) // 2]
    if not icinde(mx, my):
        continue
    sec.add(rec[I["HYRIV_ID"]])
print("Türkiye içi parça", len(sec), flush=True)

# bütün kayıtların aşağı bağlantısı (ID → NEXT_DOWN) ve aşağı yolları ekle
sonraki = {}
for rec in r.iterRecords(fields=["HYRIV_ID", "NEXT_DOWN"]):
    sonraki[rec[0]] = rec[1]
yol = set(sec)
for s in list(sec):
    n = sonraki.get(s)
    while n and n not in yol:
        yol.add(n); n = sonraki.get(n)
print("aşağı yollarla", len(yol), flush=True)

parca = {}
for sr in r.iterShapeRecords():
    rec = sr.record
    h = rec[I["HYRIV_ID"]]
    if h not in yol:
        continue
    pts = sr.shape.points
    # sadeleştir: ~1 km'den kısa adımları at, uçları koru
    sade = [pts[0]]
    for p in pts[1:-1]:
        if abs(p[0] - sade[-1][0]) + abs(p[1] - sade[-1][1]) > 0.012:
            sade.append(p)
    sade.append(pts[-1])
    parca[h] = {
        "n": rec[I["NEXT_DOWN"]], "km": rec[I["LENGTH_KM"]], "dn": rec[I["DIST_DN_KM"]], "up": rec[I["UPLAND_SKM"]],
        "q": rec[I["DIS_AV_CMS"]], "o": rec[I["ORD_CLAS"]], "e": rec[I["ENDORHEIC"]], "p": sade,
    }
ids = sorted(parca)
ix = {h: i for i, h in enumerate(ids)}
cikti = {"p": [], "n": [], "km": [], "dn": [], "up": [], "q": [], "o": [], "e": []}
for h in ids:
    d = parca[h]
    cikti["p"].append([round(c, 3) for xy in d["p"] for c in xy])
    cikti["n"].append(ix.get(d["n"], -1))
    for k in ("km", "dn", "up", "q", "o", "e"):
        cikti[k].append(round(d[k], 1) if isinstance(d[k], float) else d[k])
(KOK / "veri").mkdir(exist_ok=True)
json.dump(cikti, open(KOK / "veri/nehirler.json", "w"), separators=(",", ":"))
ag = sum(len(p) for p in cikti["p"]) // 2
print("parça", len(ids), "nokta", ag, "ağız", sum(1 for x in cikti["n"] if x < 0))

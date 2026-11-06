"use strict";
const $ = (id) => document.getElementById(id);
const sayi = (x, b = 0) => x.toLocaleString("tr-TR", { minimumFractionDigits: b, maximumFractionDigits: b });
const renk = (ad) => getComputedStyle(document.documentElement).getPropertyValue(ad).trim();
const HAZIR = [["Erzurum", 41.05, 39.95], ["Kars", 43.1, 40.6], ["Sivas", 37.0, 39.75], ["Ankara", 32.85, 39.93], ["Van", 43.4, 38.5], ["Konya", 32.5, 37.87], ["Kütahya", 29.98, 39.42], ["Bayburt", 40.23, 40.26]];
const GOLLER = [["Van Gölü'ne", 42.95, 38.64], ["Tuz Gölü'ne", 33.43, 38.71], ["Konya Ovası'ndaki kapalı havzaya", 33.29, 37.67], ["Ereğli (Konya) sazlıklarına", 33.77, 37.53], ["Akşehir ve Eber göllerine", 31.42, 38.52], ["Burdur Gölü'ne", 30.2, 37.72]];

let N, IL, cv, ctx, gorunum, izgara = new Map(), son = null, animasyon = null;
const COS = Math.cos((38.5 * Math.PI) / 180);

function ag(i) { return N.p[i]; }
function nereyeDokulur(i) {
  let k = i, yol = [i];
  while (N.n[k] >= 0) { k = N.n[k]; yol.push(k); if (yol.length > 5000) break; }
  const p = ag(k), x = p[p.length - 2], y = p[p.length - 1];
  let ad;
  if (N.e[k]) {
    const g = GOLLER.map(([a, gx, gy]) => [a, Math.hypot((gx - x) * COS, gy - y)]).sort((a, b) => a[1] - b[1])[0];
    ad = g[1] < 0.25 ? g[0] : "denize ulaşmayan kapalı bir havzaya";
  } else if (y < 31.5 && x > 45) ad = "Basra Körfezi'ne";
  else if (x > 46.5 && y > 36) ad = "Hazar Denizi'ne";
  else if (x > 26.6 && x < 29.95 && y > 40.25 && y < 41.06) ad = "Marmara Denizi'ne";
  else if (y >= 41.0 && x >= 27.9) ad = "Karadeniz'e";
  else if (x < 27.62 && y >= 36.6) ad = "Ege Denizi'ne";
  else if (y < 37.3) ad = "Akdeniz'e";
  else ad = "denize";
  return { yol, ad, son: k, x, y };
}

function gorunumAyarla(b) {
  const W = cv.clientWidth, H = cv.clientHeight, pay = 24;
  const s = Math.min((W - 2 * pay) / ((b[2] - b[0]) * COS), (H - 2 * pay) / (b[3] - b[1]));
  gorunum = { s, cx: (b[0] + b[2]) / 2, cy: (b[1] + b[3]) / 2, W, H };
}
const P = (x, y) => [gorunum.W / 2 + (x - gorunum.cx) * COS * gorunum.s, gorunum.H / 2 - (y - gorunum.cy) * gorunum.s];
const T = (px, py) => [gorunum.cx + (px - gorunum.W / 2) / (COS * gorunum.s), gorunum.cy - (py - gorunum.H / 2) / gorunum.s];

function cizgi(dizi, bitis) {
  const n = bitis === undefined ? dizi.length : bitis;
  for (let j = 0; j < n; j += 2) { const [a, b] = P(dizi[j], dizi[j + 1]); j ? ctx.lineTo(a, b) : ctx.moveTo(a, b); }
}

function taban() {
  const r = window.devicePixelRatio || 1;
  cv.width = cv.clientWidth * r; cv.height = cv.clientHeight * r;
  ctx.setTransform(r, 0, 0, r, 0, 0);
  ctx.fillStyle = renk("--dis"); ctx.fillRect(0, 0, gorunum.W, gorunum.H);
  ctx.beginPath(); IL.forEach((il) => il.h.forEach((h) => { cizgi(h); ctx.closePath(); }));
  ctx.fillStyle = renk("--kara"); ctx.fill("evenodd");
  ctx.strokeStyle = renk("--sinir"); ctx.lineWidth = 0.7; ctx.stroke();
  ctx.strokeStyle = renk("--nehir"); ctx.lineCap = "round"; ctx.lineJoin = "round";
  for (let i = 0; i < N.p.length; i++) {
    ctx.lineWidth = Math.max(0.5, Math.log10(N.up[i]) - 1.6);
    ctx.beginPath(); cizgi(ag(i)); ctx.stroke();
  }
}

function yolCiz(yol, oran) {
  // toplam nokta sayısına göre ilerle
  let topl = 0; yol.forEach((i) => (topl += ag(i).length / 2));
  let kalan = Math.ceil(topl * oran);
  ctx.strokeStyle = renk("--yol"); ctx.lineWidth = 3.5; ctx.lineCap = "round"; ctx.lineJoin = "round";
  ctx.beginPath();
  let ilk = true, sonN = null;
  for (const i of yol) {
    const p = ag(i);
    for (let j = 0; j < p.length && kalan > 0; j += 2, kalan--) {
      const [a, b] = P(p[j], p[j + 1]); ilk ? ctx.moveTo(a, b) : ctx.lineTo(a, b); ilk = false; sonN = [a, b];
    }
    if (kalan <= 0) break;
  }
  ctx.stroke();
  if (sonN) { ctx.fillStyle = renk("--yol"); ctx.beginPath(); ctx.arc(sonN[0], sonN[1], 5.5, 0, 7); ctx.fill(); ctx.strokeStyle = renk("--kara"); ctx.lineWidth = 2; ctx.stroke(); }
}

function enYakin(x, y) {
  let en = null, ed = Infinity;
  for (let r = 0; r <= 6 && !en; r++) {
    const gx = Math.floor(x * 10), gy = Math.floor(y * 10);
    for (let a = gx - r; a <= gx + r; a++) for (let b = gy - r; b <= gy + r; b++) {
      for (const [i, px, py] of izgara.get(a * 10000 + b) || []) {
        const d = Math.hypot((px - x) * COS, py - y);
        if (d < ed) { ed = d; en = i; }
      }
    }
  }
  return ed < 0.6 ? en : null;
}

function ilBul(x, y) {
  for (const il of IL) for (const h of il.h) {
    let ic = false;
    for (let i = 0, j = h.length - 2; i < h.length; j = i, i += 2) {
      const xi = h[i], yi = h[i + 1], xj = h[j], yj = h[j + 1];
      if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) ic = !ic;
    }
    if (ic) return il.ad;
  }
  return null;
}

function damla(x, y, etiket) {
  const i = enYakin(x, y);
  if (i === null) { $("sonuc").innerHTML = `<p class="cumle">Burada Türkiye'den çıkan bir akarsu bulunamadı. Türkiye sınırları içinde bir yere dokun.</p>`; return; }
  const r = nereyeDokulur(i);
  const km = N.dn[i] + N.km[i] / 2;
  // geçtiği iller (sırayla, tekrarsız) ve Türkiye dışı
  const iller = []; let dis = 0, top = 0;
  for (const k of r.yol) {
    const p = ag(k);
    for (let j = 0; j < p.length; j += 6) {
      const a = ilBul(p[j], p[j + 1]);
      top++;
      if (a) { if (iller[iller.length - 1] !== a && !iller.includes(a)) iller.push(a); }
      else dis++;
    }
  }
  const disari = dis > 3 && dis / top > 0.08; // delta uçlarının kıyı çizgisinden taşması sayılmasın
  const q = N.q[r.son];
  const il0 = ilBul(x, y);
  const nereden = etiket ? yonelme(etiket.split(",")[0]) : il0 ? `${bulunma(il0)}ki bu noktaya` : "Buraya";
  let c = `${nereden} düşen damla yaklaşık <b>${sayi(km)} km</b> yol alıp <b class="v">${r.ad}</b> ulaşır.`;
  if (disari && !N.e[r.son]) c += " Yolun bir kısmı Türkiye sınırının dışında.";
  $("sonuc").innerHTML = `<p class="cumle">${c}</p>
    <div class="kutular"><div class="kutu"><b>${sayi(km)} km</b><span>ağza kadar</span></div><div class="kutu"><b>${iller.length}</b><span>il geçiyor</span></div>
    <div class="kutu"><b>${q >= 10 ? sayi(q) : sayi(q, 1)} m³/sn</b><span>ağızda ortalama debi (model)</span></div></div>
    <p class="iller">Geçtiği iller: ${iller.join(" → ")}${disari ? " → Türkiye dışı" : ""}.</p>`;
  // görünüm: Türkiye + yol
  let b = [25.6, 35.8, 44.9, 42.2];
  for (const k of r.yol) { const p = ag(k); for (let j = 0; j < p.length; j += 2) { b = [Math.min(b[0], p[j]), Math.min(b[1], p[j + 1]), Math.max(b[2], p[j]), Math.max(b[3], p[j + 1])]; } }
  gorunumAyarla(b);
  cancelAnimationFrame(animasyon);
  const t0 = performance.now(), sure = new URLSearchParams(location.search).has("statik") ? 0 : 2200;
  const kare = (t) => {
    const o = sure ? Math.min(1, (t - t0) / sure) : 1;
    taban(); yolCiz(r.yol, 1 - Math.pow(1 - o, 2));
    const [a, bb] = P(x, y); ctx.fillStyle = renk("--yazi"); ctx.beginPath(); ctx.arc(a, bb, 4, 0, 7); ctx.fill();
    if (o < 1) animasyon = requestAnimationFrame(kare);
  };
  if (!sure) kare(t0); else animasyon = requestAnimationFrame(kare);
  son = { x, y, etiket };
  history.replaceState(null, "", `?x=${x.toFixed(3)}&y=${y.toFixed(3)}`);
}
function yonelme(s) { return `${s}'${ekA(s)}`; }
function bulunma(s) {
  const k = s.toLocaleLowerCase("tr"), sesli = [...k].reverse().find((h) => "aıoueiöü".includes(h));
  return `${s}'${"fstkçşhp".includes(k.slice(-1)) ? "t" : "d"}${"aıou".includes(sesli) ? "a" : "e"}`;
}
function ekA(ad) {
  const k = ad.toLocaleLowerCase("tr"), sesli = [...k].reverse().find((h) => "aıoueiöü".includes(h));
  const kalin = "aıou".includes(sesli);
  return ("aıoueiöü".includes(k.slice(-1)) ? "y" : "") + (kalin ? "a" : "e");
}

async function baslat() {
  cv = $("harita"); ctx = cv.getContext("2d");
  [N, IL] = await Promise.all([fetch("veri/nehirler.json").then((r) => r.json()), fetch("veri/iller.json").then((r) => r.json())]);
  for (let i = 0; i < N.p.length; i++) {
    const p = N.p[i];
    for (let j = 0; j < p.length; j += 2) {
      const k = Math.floor(p[j] * 10) * 10000 + Math.floor(p[j + 1] * 10);
      if (!izgara.has(k)) izgara.set(k, []);
      izgara.get(k).push([i, p[j], p[j + 1]]);
    }
  }
  $("bekle").hidden = true;
  gorunumAyarla([25.6, 35.8, 44.9, 42.2]); taban();
  cv.addEventListener("click", (e) => {
    const r = cv.getBoundingClientRect(); const [x, y] = T(e.clientX - r.left, e.clientY - r.top);
    damla(x, y);
  });
  HAZIR.forEach(([ad, x, y]) => { const b = document.createElement("button"); b.textContent = ad; b.onclick = () => damla(x, y, ad); $("hazir").appendChild(b); });
  window.addEventListener("resize", () => { if (son) damla(son.x, son.y, son.etiket); else { gorunumAyarla([25.6, 35.8, 44.9, 42.2]); taban(); } });
  matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => (son ? damla(son.x, son.y, son.etiket) : taban()));
  const p = new URLSearchParams(location.search);
  if (p.get("x")) damla(Number(p.get("x")), Number(p.get("y")));
  else damla(HAZIR[0][1], HAZIR[0][2], HAZIR[0][0]);
}
baslat();

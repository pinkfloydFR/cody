/* Rendu 3D du bras pivotant, sur place ou sur rail (three.js r128). Aucune image externe : les textures sont dessinées ici.
   Il reçoit les mêmes « vues » que le dessin 2D de secours (pivot.js).
   Les matières et les caisses sont recopiées de manutention-3d.js (comme dans tri-3d.js) :
   reporter toute retouche dans les trois fichiers. */
window.Rendu3DPivot = {
creer(toile, { PRISE, PAS, CRAN, rail, milieu, postes }) {
const T = window.THREE;
const rendu = new T.WebGLRenderer({ canvas: toile, antialias: true });
rendu.setPixelRatio(Math.min(devicePixelRatio, 1.5));
rendu.shadowMap.enabled = true;
rendu.shadowMap.type = T.PCFSoftShadowMap;
rendu.outputEncoding = T.sRGBEncoding;
rendu.toneMapping = T.ACESFilmicToneMapping;
rendu.toneMappingExposure = .86;
const monde = new T.Scene();
monde.background = new T.Color(0x1a2029);
monde.fog = new T.Fog(0x1a2029, 28, 55);

/* ---------- Textures dessinées dans le code ---------- */
let graine = 7;
const hasard = () => (graine = (graine * 16807) % 2147483647) / 2147483647;
function texture(l, h, dessin, rx = 1, ry = 1, couleur = true) {
  const c = document.createElement("canvas"); c.width = l; c.height = h;
  dessin(c.getContext("2d"), l, h);
  const t = new T.CanvasTexture(c);
  t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(rx, ry);
  t.anisotropy = rendu.capabilities.getMaxAnisotropy();
  if (couleur) t.encoding = T.sRGBEncoding;
  return t;
}
function grain(g, l, h, n, a, taille = 2) {
  for (let i = 0; i < n; i++) {
    g.fillStyle = hasard() > .5 ? `rgba(255,255,255,${hasard() * a})` : `rgba(0,0,0,${hasard() * a})`;
    g.fillRect(hasard() * l, hasard() * h, 1 + hasard() * taille, 1 + hasard() * taille);
  }
}
function rayures(g, l, h, n, coul, long = 40) {
  g.strokeStyle = coul;
  for (let i = 0; i < n; i++) {
    const x = hasard() * l, y = hasard() * h;
    g.lineWidth = .4 + hasard();
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + (hasard() - .5) * long, y + (hasard() - .5) * long * .3); g.stroke();
  }
}
const beton = texture(1024, 1024, (g, l, h) => {
  g.fillStyle = "#8b8e90"; g.fillRect(0, 0, l, h);
  for (let i = 0; i < 260; i++) {
    const x = hasard() * l, y = hasard() * h, r = 20 + hasard() * 130;
    const d = g.createRadialGradient(x, y, 0, x, y, r), v = hasard() > .5 ? "255,255,255" : "40,36,30";
    d.addColorStop(0, `rgba(${v},.10)`); d.addColorStop(1, `rgba(${v},0)`);
    g.fillStyle = d; g.fillRect(x - r, y - r, 2 * r, 2 * r);
  }
  grain(g, l, h, 26000, .22);
  rayures(g, l, h, 160, "rgba(40,40,40,.18)", 120);
  g.strokeStyle = "rgba(30,30,30,.45)"; g.lineWidth = 4; g.strokeRect(0, 0, l, h);
}, 5, 3);
const acier = (base, usure = 1) => texture(512, 512, (g, l, h) => {
  g.fillStyle = base; g.fillRect(0, 0, l, h);
  for (let i = 0; i < 1800; i++) {
    g.fillStyle = `rgba(${hasard() > .5 ? "255,255,255" : "0,0,0"},${hasard() * .06})`;
    g.fillRect(hasard() * l, hasard() * h, 40 + hasard() * 160, 1);
  }
  grain(g, l, h, 3500, .12);
  rayures(g, l, h, 70 * usure, "rgba(225,230,235,.35)");
  rayures(g, l, h, 40 * usure, "rgba(60,35,15,.35)");
});
const metal = (carte, m = .65, r = .45) => new T.MeshStandardMaterial({ map: carte, metalness: m, roughness: r });
const ACIER = metal(acier("#6f7c8c")), SOMBRE = metal(acier("#39424e"), .6, .55), CLAIR = metal(acier("#b9c0c8", .5), .85, .3);
const PETROLE = metal(acier("#157884"), .4, .45), CAOUTCHOUC = new T.MeshStandardMaterial({ color: 0x15171a, roughness: .9 });

/* ---------- Reflets : un petit atelier virtuel pour éclairer les métaux ---------- */
const pmrem = new T.PMREMGenerator(rendu), reflets = new T.Scene();
reflets.background = new T.Color(0x59636f);
for (const [x, y, z, l, h] of [[0, 9, 0, 14, 3], [-9, 4, 4, 3, 8], [9, 5, 6, 3, 6]]) {
  const p = new T.Mesh(new T.PlaneGeometry(l, h), new T.MeshBasicMaterial({ color: 0xffffff, side: T.DoubleSide }));
  p.position.set(x, y, z); p.lookAt(0, 0, 0); reflets.add(p);
}
monde.environment = pmrem.fromScene(reflets, .04).texture;

/* ---------- Outils ---------- */
function objet(geo, mat, x, y, z, parent = monde) {
  const m = new T.Mesh(geo, mat); m.position.set(x, y, z);
  m.castShadow = m.receiveShadow = true; parent.add(m); return m;
}
const bloc = (l, h, p, mat, x, y, z, parent) => objet(new T.BoxGeometry(l, h, p), mat, x, y, z, parent);
const cyl = (r, h, mat, x, y, z, parent, n = 24) => objet(new T.CylinderGeometry(r, r, h, n), mat, x, y, z, parent);
const boulon = (x, y, z) => { cyl(.055, .06, CLAIR, x, y, z, monde, 6).rotation.x = Math.PI / 2; };

const L = 1.5, H = .95, P = 1.3;
function bois(g, l, h, teinte) {
  g.fillStyle = teinte; g.fillRect(0, 0, l, h);
  const n = 4, e = h / n;
  for (let i = 0; i < n; i++) {
    g.fillStyle = `rgba(${hasard() > .5 ? "255,255,255" : "0,0,0"},${.03 + hasard() * .07})`; g.fillRect(0, i * e, l, e);
    for (let k = 0; k < 26; k++) {
      const y = i * e + hasard() * e;
      g.strokeStyle = `rgba(30,15,5,${.08 + hasard() * .2})`; g.lineWidth = .6 + hasard() * 1.8;
      g.beginPath(); g.moveTo(0, y);
      for (let x = 0; x <= l; x += 40) g.lineTo(x, y + Math.sin(x / 90 + k) * 3 * hasard());
      g.stroke();
    }
    for (let k = 0; k < 2; k++) {
      const x = hasard() * l, y = i * e + e * (.25 + hasard() * .5);
      for (let r = 12; r > 2; r -= 3) { g.strokeStyle = "rgba(35,18,6,.28)"; g.beginPath(); g.ellipse(x, y, r * 1.8, r * .6, 0, 0, 7); g.stroke(); }
    }
    g.fillStyle = "rgba(0,0,0,.5)"; g.fillRect(0, i * e, l, 4);
    g.fillStyle = "rgba(255,255,255,.16)"; g.fillRect(0, i * e + 4, l, 2);
  }
  /* Peinture écaillée : le bois nu réapparaît */
  for (let i = 0; i < 150; i++) {
    const bord = hasard() > .35;
    const x = bord ? (hasard() > .5 ? hasard() * 40 : l - hasard() * 40) : hasard() * l, y = hasard() * h;
    g.fillStyle = `rgba(184,140,88,${.25 + hasard() * .5})`;
    g.beginPath(); g.ellipse(x, y, 1 + hasard() * 7, .8 + hasard() * 2.5, hasard() * .5, 0, 7); g.fill();
  }
  rayures(g, l, h, 90, "rgba(240,225,200,.28)", 70);
  grain(g, l, h, 7000, .14);
}
function faceCaisse(teinte, lettre, nom) {
  return new T.MeshStandardMaterial({ roughness: .72, metalness: .05, map: texture(740, 440, (g, l, h) => {
    bois(g, l, h, teinte);
    if (!lettre) return;
    const x = l / 2 - 185, y = h / 2 - 170;
    g.fillStyle = "#efeadb"; g.fillRect(x, y, 370, 340); grain(g, l, h, 900, .1);
    g.strokeStyle = "rgba(30,30,30,.55)"; g.lineWidth = 5; g.strokeRect(x + 10, y + 10, 350, 320);
    g.fillStyle = "#191d24"; g.textAlign = "center"; g.textBaseline = "middle";
    g.font = "700 200px Luciole, sans-serif"; g.fillText(lettre, l / 2, y + 135);
    g.font = "700 76px Luciole, sans-serif"; g.fillText(nom, l / 2, y + 280);
  }) });
}
function fabriquerCaisse(teinte, lettre, nom) {
  const g = new T.Group(); monde.add(g);
  const nu = faceCaisse(teinte), marque = faceCaisse(teinte, lettre, nom);
  bloc(L, H, P, [nu, nu, marque, nu, marque, nu], 0, H / 2, 0, g);
  const e = .1;
  for (const sy of [e / 2, H - e / 2]) for (const sz of [-P / 2, P / 2]) bloc(L + .04, e, e, SOMBRE, 0, sy, sz, g);
  for (const sy of [e / 2, H - e / 2]) for (const sx of [-L / 2, L / 2]) bloc(e, e, P + .04, SOMBRE, sx, sy, 0, g);
  for (const sx of [-L / 2, L / 2]) for (const sz of [-P / 2, P / 2]) {
    bloc(e, H, e, SOMBRE, sx, H / 2, sz, g);
    for (const sy of [e / 2, H - e / 2]) objet(new T.SphereGeometry(.042, 12, 10), CLAIR, sx, sy, sz + Math.sign(sz) * .052, g);
  }
  return g;
}

/* ---------- Caisses : fabriquées à la première utilisation, puis réutilisées ---------- */
const TEINTES = { bleu: ["#2f66ad", "bleue"], rouge: ["#b23b2e", "rouge"], jaune: ["#a67f0c", "jaune"], vert: ["#2f7a49", "verte"] };
const stock = new Map();
function placer(c, x, y, z) {
  const cle = c.l + "-" + c.c;
  let g = stock.get(cle);
  if (!g) {
    graine = 7 + cle.charCodeAt(0) * 31 + cle.length; /* même usure à chaque affichage */
    g = fabriquerCaisse(TEINTES[c.c][0], c.l, TEINTES[c.c][1]);
    stock.set(cle, g);
  }
  g.position.set(x, y, z);
  g.visible = true;
}

/* ---------- Décor ---------- */
const matSol = new T.MeshStandardMaterial({ map: beton, color: 0xa9a39a, roughness: .95, envMapIntensity: .35 });
objet(new T.PlaneGeometry(60, 46), matSol, 0, 0, 0).rotation.x = -Math.PI / 2;
const matFond = new T.MeshBasicMaterial({ toneMapped: false, fog: false });
const fond = new T.Mesh(new T.PlaneGeometry(60, 22), matFond);
fond.position.set(0, 10.7, -12.5);
fond.scale.set(1.25, 1, 1);
monde.add(fond);
const fonds = new Map();
let decorAffiche = -1;
function decorer(i) {
  const n = i % window.Decors.liste.length;
  if (n === decorAffiche) return;
  decorAffiche = n;
  let t = fonds.get(n);
  if (!t) {
    t = new T.CanvasTexture(window.Decors.peindre(n));
    t.encoding = T.sRGBEncoding;
    t.anisotropy = rendu.capabilities.getMaxAnisotropy();
    fonds.set(n, t);
  }
  matFond.map = t;
  matFond.needsUpdate = true;
  matSol.color.setHex(window.Decors.liste[n].sol);
}
const danger = (rx, ry) => texture(256, 256, (g, l, h) => {
  g.fillStyle = "#e0a81e"; g.fillRect(0, 0, l, h); g.fillStyle = "#22262c";
  for (let i = -l; i < l * 2; i += 128) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i + 64, 0); g.lineTo(i - h + 64, h); g.lineTo(i - h, h); g.fill(); }
  grain(g, l, h, 2500, .3);
}, rx, ry);
const peint = (rx, ry) => new T.MeshStandardMaterial({ map: danger(rx, ry), roughness: .75 });

/* ---------- Tapis, construits vers l'est puis pivotés autour de leur cran ---------- */
const DEBUT = PRISE - .95;
const DIR = { O: Math.PI, N: Math.PI / 2, E: 0, S: -Math.PI / 2 };
/* abscisse d'un cran (nombre à virgule pendant un glissement) */
const enX = (cran) => (cran - milieu) * CRAN;
const au = (cap, r) => [Math.cos(cap) * r, -Math.sin(cap) * r];
const bandeTex = () => texture(512, 128, (g, l, h) => {
  g.fillStyle = "#1d2024"; g.fillRect(0, 0, l, h);
  g.strokeStyle = "#33383f"; g.lineWidth = 10;
  for (let x = 0; x < l; x += 64) { g.beginPath(); g.moveTo(x, 8); g.lineTo(x + 26, h / 2); g.lineTo(x, h - 8); g.stroke(); }
  grain(g, l, h, 2500, .12);
}, 3, 1);
const bandes = {};
for (const [poste, p] of Object.entries(postes)) {
  const g = new T.Group(); g.position.x = enX(p.cran); g.rotation.y = DIR[p.dir]; monde.add(g);
  if (p.pile) { /* la pile d'attente : une table */
    bloc(1.9, .18, 2.0, ACIER, PRISE, .52, 0, g);
    bloc(1.75, .02, 1.85, CAOUTCHOUC, PRISE, .626, 0, g);
    for (const dx of [-.78, .78]) for (const dz of [-.85, .85]) bloc(.16, .45, .16, SOMBRE, PRISE + dx, .225, dz, g);
    continue;
  }
  const x1 = p.fin, l = x1 - DEBUT, m = (x1 + DEBUT) / 2, bande = bandeTex();
  bandes[poste] = { bande, parMetre: 3 / l };
  bloc(l, .1, 1.62, new T.MeshStandardMaterial({ map: bande, roughness: .85 }), m, .6, 0, g);
  for (const z of [-.9, .9]) {
    bloc(l + .1, .3, .12, ACIER, m, .5, z, g);
    for (let x = DEBUT + .3; x < x1; x += .75) cyl(.065, .06, CLAIR, x, .5, z + Math.sign(z) * .07, g, 16).rotation.x = Math.PI / 2;
  }
  for (let x = DEBUT + .25; x <= x1; x += 1.9) for (const z of [-.8, .8]) bloc(.16, .45, .16, SOMBRE, x, .225, z, g);
  for (const x of [DEBUT, x1]) cyl(.17, 1.7, CLAIR, x, .5, 0, g).rotation.x = Math.PI / 2;
  /* Place de prise ou de dépose */
  bloc(1.7, .02, 1.5, peint(4, 1), PRISE, .622, 0, g);
  bloc(1.5, .022, 1.3, CAOUTCHOUC, PRISE, .626, 0, g);
  /* Capot au bout (pas sur un tapis trop court : il masquerait le bras) */
  if (p.visible > 2) {
    const G = metal(acier("#4a5666"), .55, .5), x = x1 - .6;
    bloc(1.8, .2, 2.2, G, x, 2.05, 0, g);
    for (const z of [1.04, -1.04]) bloc(1.8, 1.5, .14, G, x, 1.3, z, g);
    bloc(.14, 1.5, 2.2, G, x + .84, 1.3, 0, g);
    bloc(1.82, .16, 2.22, peint(4, 1), x, 1.88, 0, g);
    for (let z = -.85; z <= .86; z += .21) bloc(.05, 1.15, .17, CAOUTCHOUC, x - .92, 1.25, z, g);
  }
}

/* Panneaux de destination, face à la caméra */
function panneau(texte, x, y, z, l, entree) {
  const t = texture(640, 160, (g, w, h) => {
    g.fillStyle = entree ? "#e0a81e" : "#e9ebe6"; g.fillRect(0, 0, w, h); grain(g, w, h, 900, .12);
    g.strokeStyle = "#20262e"; g.lineWidth = 12; g.strokeRect(10, 10, w - 20, h - 20);
    g.fillStyle = "#20262e"; g.font = "700 82px Luciole, sans-serif"; g.textAlign = "center"; g.textBaseline = "middle";
    g.fillText(texte, w / 2, h / 2 + 6, w - 50);
  });
  const p = new T.Mesh(new T.PlaneGeometry(l, l / 4), new T.MeshBasicMaterial({ map: t, toneMapped: false }));
  p.position.set(x, y, z); p.rotation.x = -.45; monde.add(p);
}
if (rail) {
  panneau("ENTRÉE", -12.4, .6, 1.9, 3.6, true);
  for (const nom of ["A", "B", "C"]) panneau(nom, enX(postes[nom].cran), 3.15, -8.6, 3.8);
  panneau("D", 12.4, .75, 2.0, 3.8);
  panneau("ATTENTE", 2.55, .45, 4.7, 2.3);
} else {
  panneau("ENTRÉE · OUEST", -7.2, .45, 1.65, 3.5, true);
  panneau("NORD", 0, 2.75, -8.4, 2.3);
  panneau("EST", 7.2, .45, 1.65, 2.1);
  panneau("SUD", 2.1, .45, 6.4, 2.1);
}

/* ---------- Écran : instruction en cours ---------- */
const toileEcran = document.createElement("canvas");
toileEcran.width = 768; toileEcran.height = 300;
const carteEcran = new T.CanvasTexture(toileEcran);
carteEcran.encoding = T.sRGBEncoding;
let affiche = null;
function ecran(texte) {
  if (texte === affiche) return;
  affiche = texte;
  const g = toileEcran.getContext("2d");
  g.fillStyle = "#0d1b22"; g.fillRect(0, 0, 768, 300);
  g.textAlign = "center"; g.textBaseline = "middle";
  g.fillStyle = "#7fd8e6"; g.font = "700 50px Luciole, sans-serif"; g.fillText("INSTRUCTION EN COURS", 384, 86);
  g.fillStyle = "#ffffff"; g.font = "700 74px Luciole, sans-serif"; g.fillText(texte, 384, 200, 708);
  carteEcran.needsUpdate = true;
}
ecran("en attente");
{
  const ex = rail ? 11.6 : 8.8;
  const g = new T.Group(); g.position.set(ex, 2.9, -6.4); g.rotation.set(-.3, -.3, 0, "YXZ"); monde.add(g);
  bloc(4.5, 1.92, .26, metal(acier("#e8860f", .7), .35, .42), 0, 0, 0, g);
  objet(new T.PlaneGeometry(4.16, 1.63), new T.MeshBasicMaterial({ map: carteEcran, toneMapped: false }), 0, 0, .15, g);
  for (const dx of [-1.5, 1.5]) cyl(.07, 2.4, SOMBRE, ex + dx, 1.0, -6.7);
}

/* ---------- Socle : plateau tournant gradué, ou rail et chariot ---------- */
const NOIR = metal(acier("#2b3038"), .5, .5), ORANGE = metal(acier("#e8860f", .7), .35, .42);
function pastille(lettre, jaune, rayon, x, z) {
  const t = texture(128, 128, (g) => {
    g.fillStyle = jaune ? "#e0a81e" : "#e9ebe6"; g.beginPath(); g.arc(64, 64, 60, 0, 7); g.fill();
    g.fillStyle = "#20262e"; g.font = "700 84px Luciole, sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(lettre, 64, 70);
  });
  const p = new T.Mesh(new T.CircleGeometry(rayon, 32), new T.MeshBasicMaterial({ map: t, toneMapped: false }));
  p.rotation.x = -Math.PI / 2; p.position.set(x, .03, z); monde.add(p);
}
const chariot = new T.Group(); monde.add(chariot);
if (rail) {
  for (const z of [-.7, .7]) bloc(13.6, .16, .2, CLAIR, 0, .16, z);
  for (let x = -6.7; x <= 6.75; x += .62) bloc(.26, .08, 2.0, SOMBRE, x, .04, 0);
  for (const x of [-6.95, 6.95]) bloc(.34, .6, 2.0, peint(1, 1), x, .3, 0);
  for (const c of [1, 2, 3]) pastille(String(c), false, .5, enX(c) - (c === 2 ? 1.75 : 0), 2.0);
  bloc(2.2, .34, 2.0, NOIR, 0, .42, 0, chariot);
  bloc(2.22, .12, 2.02, peint(6, 1), 0, .56, 0, chariot);
} else {
  cyl(2.35, .22, NOIR, 0, .11, 0, monde, 64);
  cyl(2.05, .12, CLAIR, 0, .27, 0, monde, 64);
  cyl(1.85, .14, peint(10, 1), 0, .36, 0, monde, 64);
  cyl(1.6, .16, NOIR, 0, .45, 0, monde, 64);
  for (const [lettre, cap] of Object.entries(DIR)) pastille(lettre, lettre === "O", .36, ...au(cap, 2.72));
}

/* ---------- Bras pivotant : construit dans un plan, le groupe entier tourne ---------- */
const bras = new T.Group(); monde.add(bras);
cyl(1.15, .5, ORANGE, 0, .76, 0, bras, 48);
cyl(1.2, .12, NOIR, 0, 1.06, 0, bras, 48);
cyl(.75, .4, ORANGE, -.25, 1.3, 0, bras, 40);
bloc(.9, .75, 1.0, NOIR, -1.15, 1.35, 0, bras); /* contrepoids */
const v = (x, y, z = 0) => new T.Vector3(x, y, z);
const L1 = 3.5, L2 = 3.05, TIGE = 1.1;
/* Pièce allongée de longueur fixe, plus large au départ qu'à l'arrivée */
function segment(long, l0, l1, ep, mat) {
  const f = new T.Shape();
  f.moveTo(-l0 / 2, 0); f.lineTo(l0 / 2, 0); f.lineTo(l1 / 2, long); f.lineTo(-l1 / 2, long); f.closePath();
  const geo = new T.ExtrudeGeometry(f, { depth: ep, bevelEnabled: true, bevelSize: .06, bevelThickness: .06, bevelSegments: 2 });
  geo.translate(0, 0, -ep / 2);
  const uv = geo.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * .45, uv.getY(i) * .45);
  return objet(geo, mat, 0, 0, 0, bras);
}
function orienter(piece, a, b) {
  piece.position.copy(a);
  piece.rotation.z = Math.atan2(a.x - b.x, b.y - a.y);
}
function articulation(r, ep) {
  const g = new T.Group(); bras.add(g);
  for (const [ray, long, mat] of [[r, ep, ORANGE], [r * .66, ep + .08, NOIR], [r * .46, ep + .14, ORANGE], [r * .13, ep + .22, CLAIR]])
    cyl(ray, long, mat, 0, 0, 0, g, 40).rotation.x = Math.PI / 2;
  return g;
}
const epaule = v(-.25, 2.0);
orienter(segment(.62, 1.0, .8, .62, ORANGE), v(-.25, 1.4), epaule);
const haut = segment(L1, .85, .6, .46, ORANGE);
const avantNoir = segment(L2 * .52, .62, .52, .52, NOIR);
const avantOrange = segment(L2 * .48, .44, .3, .34, ORANGE);
const verinCorps = segment(L1 * .6 * .55, .17, .17, .1, NOIR);
const verinTige = segment(L1 * .6 * .5, .1, .1, .06, CLAIR);
const joints = { epaule: articulation(.62, .84), coude: articulation(.52, .76), poignet: articulation(.31, .5) };
const cable = objet(new T.BufferGeometry(), CAOUTCHOUC, 0, 0, 0, bras);
cable.frustumCulled = false;
/* Pince : y = 0 au-dessus de la caisse tenue. Le poignet compense la rotation du bras : la pince et
   la caisse restent alignées avec les tapis. */
const pince = new T.Group(); bras.add(pince);
cyl(.19, .75, NOIR, 0, .75, 0, pince);
cyl(.32, .18, CLAIR, 0, .47, 0, pince);
bloc(.8, .24, .6, ORANGE, 0, .3, 0, pince);
bloc(1.9, .16, .66, NOIR, 0, .11, 0, pince);
const doigts = [-1, 1].map((s) => {
  const d = new T.Group(); pince.add(d);
  bloc(.13, .85, .76, ORANGE, s * .87, -.3, 0, d);
  bloc(.07, .48, .62, CAOUTCHOUC, s * .79, -.48, 0, d);
  return [d, s];
});

let derniereHauteur = null;
function poserBras(sommet) {
  const poignet = v(PRISE, sommet + TIGE);
  const dx = poignet.x - epaule.x, dy = poignet.y - epaule.y;
  const d = Math.max(Math.abs(L1 - L2) + .01, Math.min(Math.hypot(dx, dy), L1 + L2 - .01));
  const a1 = Math.atan2(dy, dx) + Math.acos((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d));
  const coude = v(epaule.x + L1 * Math.cos(a1), epaule.y + L1 * Math.sin(a1));
  const milieu = coude.clone().lerp(poignet, .52);
  orienter(haut, epaule, coude);
  orienter(avantNoir, coude, milieu);
  orienter(avantOrange, milieu, poignet);
  const dec = v(0, 0, .42);
  const d0 = epaule.clone().lerp(coude, .12).add(dec), d1 = epaule.clone().lerp(coude, .72).add(dec);
  orienter(verinCorps, d0, d1);
  orienter(verinTige, d0.clone().lerp(d1, .5), d1);
  joints.epaule.position.copy(epaule); joints.coude.position.copy(coude); joints.poignet.position.copy(poignet);
  pince.position.set(PRISE, sommet, 0);
  const cle = sommet.toFixed(3);
  if (cle !== derniereHauteur) {
    derniereHauteur = cle;
    const trajet = new T.CatmullRomCurve3([epaule.clone().add(v(-.5, .2, -.3)), epaule.clone().lerp(coude, .5).add(v(-.6, .4, -.2)),
      coude.clone().add(v(-.1, .75, -.1)), coude.clone().lerp(poignet, .55).add(v(0, .55, -.2)), poignet.clone().add(v(0, .3, -.25))]);
    cable.geometry.dispose();
    cable.geometry = new T.TubeGeometry(trajet, 60, .06, 8);
  }
}

/* ---------- Lumières ---------- */
monde.add(new T.HemisphereLight(0xdfe9f5, 0x40382c, .48));
const soleil = new T.DirectionalLight(0xfff1dd, 1.35);
soleil.position.set(5, 14, 8); soleil.castShadow = true;
soleil.shadow.mapSize.set(2048, 2048); soleil.shadow.bias = -.0004; soleil.shadow.radius = 4;
Object.assign(soleil.shadow.camera, { left: -19, right: 19, top: 15, bottom: -15, near: 1, far: 50 });
monde.add(soleil);
const appoint = new T.PointLight(0x9fc4ff, .5, 30); appoint.position.set(9, 6, 5); monde.add(appoint);

/* Hauteur du dessous d'une caisse : posée, soulevée, ou à un étage de la pile */
const POSE = .66, LEVEE = 1.9, ETAGE = H + .02;

function disposer(vue) {
  for (const g of stock.values()) g.visible = false;
  for (const o of vue.caisses) {
    const [x, z] = au(DIR[o.dir], o.r);
    placer(o.c, enX(o.cran) + x, POSE + o.niveau * ETAGE, z);
  }
  for (const poste of Object.keys(bandes)) {
    bandes[poste].bande.offset.x = -(vue.avance[poste] || 0) * PAS * bandes[poste].parMetre;
  }
  /* angle en quarts de tour : 0 = ouest, 1 = nord… (sens des aiguilles d'une montre) */
  const cap = Math.PI - vue.angle * Math.PI / 2, ax = enX(vue.x);
  bras.position.x = chariot.position.x = ax;
  bras.rotation.y = cap;
  pince.rotation.y = -cap;
  /* Le bras reste au-dessus de la pile d'attente, quelle que soit sa hauteur */
  const levee = Math.max(LEVEE, POSE + vue.pile * ETAGE + .2);
  const bas = levee + (POSE + vue.cible * ETAGE - levee) * vue.bas;
  poserBras(bas + H + .02);
  if (vue.main) {
    const [x, z] = au(cap, PRISE);
    placer(vue.main, ax + x, bas, z);
  }
  for (const [d, s] of doigts) d.position.x = vue.main ? 0 : s * .13;
  ecran(vue.instruction);
  decorer(vue.decor);
}

/* ---------- Caméra plongeante : les quatre directions restent visibles ---------- */
const camera = new T.PerspectiveCamera(32, 1.6, .1, 120);
const DEPART = rail ? { angle: .08, hauteur: .6 } : { angle: .14, hauteur: .54 };
const VISE = rail ? new T.Vector3(0, .9, -1.3) : new T.Vector3(0, .9, .35);
let angle = DEPART.angle, hauteur = DEPART.hauteur, derniere = null;
function afficher() {
  const l = toile.clientWidth, h = toile.clientHeight;
  if (!l || !h || !derniere) return;
  rendu.setSize(l, h, false);
  camera.aspect = l / h;
  const dist = rail ? Math.max(29.5, 56 / camera.aspect) : Math.max(23.5, 42 / camera.aspect);
  camera.position.set(Math.sin(angle) * dist * Math.cos(hauteur), VISE.y + Math.sin(hauteur) * dist, Math.cos(angle) * dist * Math.cos(hauteur));
  camera.lookAt(VISE);
  camera.updateProjectionMatrix();
  rendu.render(monde, camera);
}
function dessiner(vue) { derniere = vue; disposer(vue); afficher(); }

/* Faire glisser pour tourner un peu, double-clic pour revenir */
let glisse = null;
toile.addEventListener("pointerdown", (e) => { glisse = [e.clientX, e.clientY]; toile.setPointerCapture(e.pointerId); });
toile.addEventListener("pointermove", (e) => {
  if (!glisse) return;
  angle = Math.max(-.6, Math.min(.6, angle - (e.clientX - glisse[0]) * .004));
  hauteur = Math.max(.3, Math.min(1.35, hauteur + (e.clientY - glisse[1]) * .003));
  glisse = [e.clientX, e.clientY];
  afficher();
});
for (const nom of ["pointerup", "pointercancel"]) toile.addEventListener(nom, () => { glisse = null; });
toile.addEventListener("dblclick", () => { ({ angle, hauteur } = DEPART); afficher(); });
new ResizeObserver(afficher).observe(toile);

return { dessiner };
},
};

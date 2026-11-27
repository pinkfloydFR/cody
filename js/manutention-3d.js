/* Rendu 3D de l'atelier Manutention (three.js r128) : bras articulé et tapis. Aucune image externe : les textures sont dessinées ici.
   Il reçoit les mêmes « vues » que le dessin 2D de secours (coordonnées 800 x 500). */
window.Rendu3D = {
creer(toile, { centres, sol: solY, haut }) {
const T = window.THREE;
const C = window.Commun3D;
const rendu = C.creerRendu(toile);
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
  t.anisotropy = C.anisotropie(rendu);
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

/* ---------- Décor ---------- */
const matSol = new T.MeshStandardMaterial({ map: beton, color: 0xa9a39a, roughness: .95, envMapIntensity: .35 });
const sol = objet(new T.PlaneGeometry(60, 30), matSol, 0, 0, 0);
sol.rotation.x = -Math.PI / 2;
/* Fond : un décor peint par niveau (manutention-decors.js), non éclairé pour garder ses couleurs.
   Chaque texture n'est dessinée qu'à sa première utilisation. */
const matFond = new T.MeshBasicMaterial({ toneMapped: false, fog: false });
const fond = new T.Mesh(new T.PlaneGeometry(60, 22), matFond);
fond.position.set(0, 11, -7);
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
    t.anisotropy = C.anisotropie(rendu);
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
function plaque(texte, l = 1.1) {
  const t = texture(512, 160, (g, w, h) => {
    g.fillStyle = "#e9ebe6"; g.fillRect(0, 0, w, h); grain(g, w, h, 900, .12);
    g.strokeStyle = "#20262e"; g.lineWidth = 12; g.strokeRect(10, 10, w - 20, h - 20);
    g.fillStyle = "#20262e"; g.font = "700 96px Luciole, sans-serif"; g.textAlign = "center"; g.textBaseline = "middle";
    g.fillText(texte, w / 2, h / 2 + 6);
  });
  return [new T.PlaneGeometry(l, l * .3125), new T.MeshStandardMaterial({ map: t, roughness: .6 })];
}

const L = 1.85, H = 1.1, P = 1.5;
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
  bloc(L, H, P, [nu, nu, nu, nu, marque, nu], 0, H / 2, 0, g);
  const e = .1;
  for (const sy of [e / 2, H - e / 2]) for (const sz of [-P / 2, P / 2]) bloc(L + .04, e, e, SOMBRE, 0, sy, sz, g);
  for (const sy of [e / 2, H - e / 2]) for (const sx of [-L / 2, L / 2]) bloc(e, e, P + .04, SOMBRE, sx, sy, 0, g);
  for (const sx of [-L / 2, L / 2]) for (const sz of [-P / 2, P / 2]) {
    bloc(e, H, e, SOMBRE, sx, H / 2, sz, g);
    for (const sy of [e / 2, H - e / 2]) objet(new T.SphereGeometry(.042, 12, 10), CLAIR, sx, sy, sz + Math.sign(sz) * .052, g);
  }
  return C.fusionner(g);
}

/* ---------- Caisses : fabriquées à la première utilisation, puis réutilisées ---------- */
const TEINTES = { bleu: ["#2f66ad", "bleue"], rouge: ["#b23b2e", "rouge"], jaune: ["#a67f0c", "jaune"], vert: ["#2f7a49", "verte"] };
const stock = new Map();
function placer(c, x, y) {
  const cle = c.l + "-" + c.c;
  let g = stock.get(cle);
  if (!g) {
    graine = 7 + cle.charCodeAt(0) * 31 + cle.length; /* même usure à chaque affichage */
    g = fabriquerCaisse(TEINTES[c.c][0], c.l, TEINTES[c.c][1]);
    stock.set(cle, g);
  }
  g.position.set(x, y, 0);
  g.visible = true;
}

/* ---------- Postes : trois piles au centre ---------- */
function pied(x, z, h) { bloc(.16, h, .16, SOMBRE, x, h / 2, z); }
for (const [nom, x] of [["1", -2.6], ["2", 0], ["3", 2.6]]) {
  bloc(2.2, .18, 1.85, ACIER, x, .55, 0);
  bloc(2.04, .02, 1.7, CAOUTCHOUC, x, .65, 0);
  for (const dx of [-.92, .92]) for (const dz of [-.75, .75]) pied(x + dx, dz, .48);
  objet(...plaque(nom, 1.05), x, .24, 1.0);
}

const bandes = {};
/* ---------- Tapis roulants ---------- */
const nouvelleBande = () => texture(512, 128, (g, l, h) => {
  g.fillStyle = "#1d2024"; g.fillRect(0, 0, l, h);
  g.strokeStyle = "#33383f"; g.lineWidth = 10;
  for (let x = 0; x < l; x += 64) { g.beginPath(); g.moveTo(x, 8); g.lineTo(x + 26, h / 2); g.lineTo(x, h - 8); g.stroke(); }
  grain(g, l, h, 2500, .12);
}, 3, 1);
function tapis(x0, x1, nom) {
  const l = x1 - x0, m = (x0 + x1) / 2;
  const bande = nouvelleBande();
  bandes[nom] = { bande, parMetre: 3 / l };
  bloc(l, .1, 1.62, new T.MeshStandardMaterial({ map: bande, roughness: .85 }), m, .6, 0);
  for (const z of [-.9, .9]) {
    bloc(l + .1, .3, .12, ACIER, m, .5, z);
    for (let x = x0 + .3; x < x1; x += .75) cyl(.065, .06, CLAIR, x, .5, z + Math.sign(z) * .07, monde, 16).rotation.x = Math.PI / 2;
  }
  for (let x = x0 + .25; x <= x1; x += 2.1) for (const z of [-.8, .8]) pied(x, z, .45);
  for (const x of [x0, x1]) cyl(.17, 1.7, CLAIR, x, .5, 0).rotation.x = Math.PI / 2;
  objet(...plaque(nom, 1.8), nom === "ENTRÉE" ? x1 - 1.1 : x0 + 1.1, .18, 1.12);
}
tapis(-11.4, -4.15, "ENTRÉE");
tapis(4.15, 11.4, "SORTIE");

/* Capots : les caisses suivantes sont cachées, comme dans l'exercice */
function capot(x, sens) {
  const G = metal(acier("#4a5666"), .55, .5);
  bloc(2.3, .22, 2.2, G, x, 2.35, 0);
  bloc(2.3, 1.8, .14, G, x, 1.45, 1.04);
  bloc(2.3, 1.8, .14, G, x, 1.45, -1.04);
  bloc(.14, 1.8, 2.2, G, x - sens * 1.08, 1.45, 0);
  bloc(2.32, .18, 2.22, peint(5, 1), x, 2.16, 0);
  for (let z = -.85; z <= .86; z += .21) bloc(.05, 1.35, .17, CAOUTCHOUC, x + sens * 1.12, 1.4, z).rotation.z = sens * .03;
}
capot(-10.5, 1);
capot(10.5, -1);

/* ---------- Décor : armoire de commande et écran ---------- */
const facade = texture(384, 640, (g, l, h) => {
  g.fillStyle = "#46566b"; g.fillRect(0, 0, l, h); grain(g, l, h, 3000, .1);
  g.strokeStyle = "#222b38"; g.lineWidth = 10; g.strokeRect(14, 14, l - 28, h - 28);
  g.fillStyle = "#101820"; g.fillRect(52, 60, 280, 130);
  g.strokeStyle = "#54e0a0"; g.lineWidth = 4; g.beginPath(); g.moveTo(66, 150);
  for (let x = 66; x < 320; x += 18) g.lineTo(x, 150 - hasard() * 70);
  g.stroke();
  for (let i = 0; i < 4; i++) { g.fillStyle = ["#e8860f", "#54e0a0", "#d8453a", "#d9dee5"][i]; g.beginPath(); g.arc(85 + i * 72, 250, 22, 0, 7); g.fill(); }
  g.fillStyle = "#222b38"; for (let y = 330; y < 450; y += 24) g.fillRect(60, y, 264, 10);
  g.fillStyle = "#e0a81e"; g.beginPath(); g.moveTo(192, 480); g.lineTo(248, 575); g.lineTo(136, 575); g.fill();
  g.fillStyle = "#222b38"; g.font = "700 56px Luciole, sans-serif"; g.textAlign = "center"; g.fillText("!", 192, 562);
});
const cote = metal(acier("#3d4a5c"), .4, .6);
bloc(2.2, 3.7, 1.1, [cote, cote, cote, cote, new T.MeshStandardMaterial({ map: facade, roughness: .6 }), cote], 8.4, 1.85, -4.2);

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
bloc(4.2, 1.8, .28, metal(acier("#e8860f", .7), .35, .42), 8.5, 6.3, -4.4);
objet(new T.PlaneGeometry(3.88, 1.52), new T.MeshBasicMaterial({ map: carteEcran, toneMapped: false }), 8.5, 6.3, -4.24);
for (const dx of [-1.4, 1.4]) cyl(.05, 5, SOMBRE, 8.5 + dx, 9.7, -4.45);

/* ---------- Bras articulé sur un rail, derrière les postes ---------- */
const ORANGE = metal(acier("#e8860f", .7), .35, .42), NOIR = metal(acier("#2b3038"), .5, .5);
const RAIL = -2.45, RECUL = 3.0, L1 = 4.1, L2 = 3.7, EPAULE = 2.15, TIGE = 1.35;
for (const dz of [-.55, .55]) bloc(13.4, .16, .18, CLAIR, -3, .14, RAIL + dz);
for (let x = -9.4; x <= 3.4; x += .62) bloc(.24, .07, 1.6, SOMBRE, x, .04, RAIL);
for (const x of [-9.85, 3.85]) bloc(.3, .45, 1.6, peint(1, 1), x, .25, RAIL);

const v = (x, y, z) => new T.Vector3(x, y, z);
const HAUT_Y = v(0, 1, 0);
/* La pince est toujours au même écart de l'épaule : le bras reste dans un plan de direction fixe */
const u = v(RECUL, 0, -RAIL).normalize();
const RAYON = Math.hypot(RECUL, RAIL);
const normale = u.clone().cross(HAUT_Y).normalize();
if (normale.z < 0) normale.negate();

const groupe = () => { const g = new T.Group(); monde.add(g); return g; };
/* Pièce allongée de longueur fixe, plus large au départ qu'à l'arrivée ; « orienter » la place */
function segment(long, l0, l1, ep, mat) {
  const forme = new T.Shape();
  forme.moveTo(-l0 / 2, 0); forme.lineTo(l0 / 2, 0); forme.lineTo(l1 / 2, long); forme.lineTo(-l1 / 2, long); forme.closePath();
  const geo = new T.ExtrudeGeometry(forme, { depth: ep, bevelEnabled: true, bevelSize: .06, bevelThickness: .06, bevelSegments: 2 });
  geo.translate(0, 0, -ep / 2);
  const uv = geo.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * .45, uv.getY(i) * .45);
  return objet(geo, mat, 0, 0, 0);
}
const base3 = new T.Matrix4();
function orienter(piece, a, b) {
  const axeY = b.clone().sub(a).normalize();
  const axeZ = normale.clone().sub(axeY.clone().multiplyScalar(normale.dot(axeY))).normalize();
  piece.position.copy(a);
  piece.quaternion.setFromRotationMatrix(base3.makeBasis(axeY.clone().cross(axeZ), axeY, axeZ));
}
function articulation(r, ep) {
  const g = groupe();
  const disque = (rayon, long, mat) => { cyl(rayon, long, mat, 0, 0, 0, g, 40).quaternion.setFromUnitVectors(HAUT_Y, normale); };
  disque(r, ep, ORANGE); disque(r * .66, ep + .08, NOIR); disque(r * .46, ep + .14, ORANGE); disque(r * .13, ep + .22, CLAIR);
  const cote = normale.clone().cross(HAUT_Y).normalize();
  for (let k = 0; k < 8; k++) {
    const a = k * Math.PI / 4;
    const q = cote.clone().multiplyScalar(Math.cos(a) * r * .82).add(v(0, Math.sin(a) * r * .82, 0))
      .add(normale.clone().multiplyScalar(ep / 2 + .02));
    objet(new T.SphereGeometry(.05, 10, 8), CLAIR, q.x, q.y, q.z, g);
  }
  return g;
}

/* Chariot et colonne */
const chariot = groupe();
bloc(2.1, .34, 1.55, NOIR, 0, .39, RAIL, chariot);
bloc(2.12, .12, 1.57, peint(6, 1), 0, .52, RAIL, chariot);
cyl(.82, .42, ORANGE, 0, .79, RAIL, chariot, 40);
cyl(.86, .1, NOIR, 0, 1.04, RAIL, chariot, 40);
cyl(.62, .36, ORANGE, 0, 1.27, RAIL, chariot, 40);
const colonne = segment(EPAULE - 1.35, 1.05, .8, .62, ORANGE);
const bras = segment(L1, .85, .6, .46, ORANGE);
const avantBrasNoir = segment(L2 * .52, .62, .52, .52, NOIR);
const avantBrasOrange = segment(L2 * .48, .44, .3, .34, ORANGE);
const verinCorps = segment(L1 * .6 * .55, .17, .17, .1, NOIR);
const verinTige = segment(L1 * .6 * .5, .1, .1, .06, CLAIR);
const joints = { epaule: articulation(.66, .86), coude: articulation(.55, .78), poignet: articulation(.33, .52) };
const cable = objet(new T.BufferGeometry(), CAOUTCHOUC, 0, 0, 0);
cable.frustumCulled = false;

/* Pince verticale ; y = 0 au-dessus de la caisse tenue */
const pince = groupe();
cyl(.2, TIGE - .45, NOIR, 0, (TIGE + .45) / 2, 0, pince);
cyl(.34, .18, CLAIR, 0, .52, 0, pince);
bloc(.9, .26, .6, ORANGE, 0, .34, 0, pince);
bloc(2.3, .18, .66, NOIR, 0, .13, 0, pince);
const doigts = [-1, 1].map((s) => {
  const d = new T.Group(); pince.add(d);
  bloc(.14, 1.0, .82, ORANGE, s * 1.06, -.36, 0, d);
  bloc(.07, .55, .68, CAOUTCHOUC, s * .975, -.56, 0, d);
  bloc(.26, .1, .82, NOIR, s * .95, -.89, 0, d);
  objet(new T.SphereGeometry(.09, 16, 12), CLAIR, s * 1.06, .06, .36, d);
  return [d, s];
});

let dernierCable = "";
function poserBras(x, sommet) {
  const epaule = v(x - RECUL, EPAULE, RAIL), poignet = v(x, sommet + TIGE, 0);
  const dh = poignet.y - EPAULE;
  const d = Math.max(Math.abs(L1 - L2) + .01, Math.min(Math.hypot(RAYON, dh), L1 + L2 - .01));
  const a1 = Math.atan2(dh, RAYON) + Math.acos((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d));
  const coude = epaule.clone().add(u.clone().multiplyScalar(L1 * Math.cos(a1))).add(v(0, L1 * Math.sin(a1), 0));
  const milieu = coude.clone().lerp(poignet, .52);
  chariot.position.x = epaule.x;
  orienter(colonne, v(epaule.x, 1.35, RAIL), epaule);
  orienter(bras, epaule, coude);
  orienter(avantBrasNoir, coude, milieu);
  orienter(avantBrasOrange, milieu, poignet);
  const decale = normale.clone().multiplyScalar(.42);
  const d0 = epaule.clone().lerp(coude, .12).add(decale), d1 = epaule.clone().lerp(coude, .72).add(decale);
  orienter(verinCorps, d0, d1);
  orienter(verinTige, d0.clone().lerp(d1, .5), d1);
  joints.epaule.position.copy(epaule); joints.coude.position.copy(coude); joints.poignet.position.copy(poignet);
  const cle = x.toFixed(3) + " " + sommet.toFixed(3);
  if (cle !== dernierCable) {
    dernierCable = cle;
    const trajet = new T.CatmullRomCurve3([epaule.clone().add(v(-.5, .2, -.3)), epaule.clone().lerp(coude, .5).add(v(-.75, .35, -.2)),
      coude.clone().add(v(-.25, .75, -.1)), coude.clone().lerp(poignet, .55).add(v(0, .55, -.2)), poignet.clone().add(v(0, .3, -.25))]);
    cable.geometry.dispose();
    cable.geometry = new T.TubeGeometry(trajet, 60, .06, 8);
  }
  pince.position.set(x, sommet, 0);
}

/* ---------- Lumières ---------- */
monde.add(new T.HemisphereLight(0xdfe9f5, 0x40382c, .45));
const soleil = new T.DirectionalLight(0xfff1dd, 1.35);
soleil.position.set(-6, 14, 9); soleil.castShadow = true;
soleil.shadow.bias = -.0004; soleil.shadow.radius = 4;
Object.assign(soleil.shadow.camera, { left: -15, right: 15, top: 13, bottom: -6, near: 1, far: 40 });
monde.add(soleil);
C.ombres(rendu, monde, soleil, () => afficher());
const appoint = new T.PointLight(0x9fc4ff, .5, 30); appoint.position.set(9, 6, 5); monde.add(appoint);



/* ---------- Passage des coordonnées de la scène 2D à la 3D ---------- */
const POSTES = ["E", "1", "2", "3", "S"], X3 = [-5.35, -2.6, 0, 2.6, 5.35];
const POSE = .66, PAS = H + .03, PAS_TAPIS_3D = 2.05;
const abscisses = POSTES.map((k) => centres[k]);
function enX(x) {
  let i = 0;
  while (i < abscisses.length - 2 && x > abscisses[i + 1]) i++;
  return X3[i] + (x - abscisses[i]) / (abscisses[i + 1] - abscisses[i]) * (X3[i + 1] - X3[i]);
}
/* yHaut : bord supérieur d'une caisse en coordonnées 2D -> hauteur 3D de son dessous */
const enBas = (yHaut) => POSE + (solY - yHaut - haut) / haut * PAS;

function ranger(piles, avance) {
  for (const g of stock.values()) g.visible = false;
  for (const k of ["1", "2", "3"]) piles[k].forEach((c, i) => placer(c, X3[POSTES.indexOf(k)], POSE + i * PAS));
  /* Tapis : 0 = devant la pince ; au-delà de 2 places, la caisse est sous le capot */
  piles.E.forEach((c, i) => {
    const rang = i + avance.E;
    if (rang <= 2.2) placer(c, X3[0] - rang * PAS_TAPIS_3D, POSE);
  });
  piles.S.forEach((c, i) => {
    const rang = piles.S.length - 1 - i + avance.S;
    if (rang <= 2.2) placer(c, X3[4] + rang * PAS_TAPIS_3D, POSE);
  });
  for (const [nom, sens, a] of [["ENTRÉE", 1, avance.E], ["SORTIE", -1, avance.S]]) {
    bandes[nom].bande.offset.x = sens * a * PAS_TAPIS_3D * bandes[nom].parMetre;
  }
}
function disposer(vue) {
  ranger(vue.piles, vue.tapis);
  const x = enX(vue.x), bas = enBas(vue.y);
  if (vue.main) placer(vue.main, x, bas);
  poserBras(x, bas + H + .02);
  /* Pince ouverte quand elle est vide */
  for (const [d, s] of doigts) d.position.x = vue.main ? 0 : s * .13;
  ecran(vue.instruction);
  decorer(vue.decor);
}

/* ---------- Caméra : presque de face pour que les piles restent lisibles ---------- */
const camera = new T.PerspectiveCamera(32, 1.6, .1, 120);
const DEPART = { angle: .1, hauteur: .2 };
let angle = DEPART.angle, hauteur = DEPART.hauteur, derniere = null;
function afficher() {
  const l = toile.clientWidth, h = toile.clientHeight;
  if (!l || !h || !derniere) return;
  rendu.setSize(l, h, false);
  camera.aspect = l / h;
  const dist = Math.max(19.2, 40.5 / camera.aspect);
  camera.position.set(Math.sin(angle) * dist * Math.cos(hauteur), 3.55 + Math.sin(hauteur) * dist, Math.cos(angle) * dist * Math.cos(hauteur));
  camera.lookAt(0, 3.55, 0);
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
  hauteur = Math.max(.04, Math.min(.55, hauteur + (e.clientY - glisse[1]) * .003));
  glisse = [e.clientX, e.clientY];
  afficher();
});
for (const nom of ["pointerup", "pointercancel"]) toile.addEventListener(nom, () => { glisse = null; });
toile.addEventListener("dblclick", () => { ({ angle, hauteur } = DEPART); afficher(); });
new ResizeObserver(afficher).observe(toile);

/* Pièces fixes fusionnées (moins d'appels de dessin) ; ce qui bouge reste à part */
C.fusionner(monde, [colonne, bras, avantBrasNoir, avantBrasOrange, verinCorps, verinTige, cable, chariot, pince, ...Object.values(joints)]);
C.fusionner(chariot);
C.fusionner(pince, doigts.map(([d]) => d));
for (const [d] of doigts) C.fusionner(d);
for (const g of Object.values(joints)) C.fusionner(g);

return { dessiner };
},
};

/* Rendu 3D du centre de tri (niveaux 13 à 18), three.js r128.
   Les matières et les caisses sont reprises de manutention-3d.js (copie : à reporter dans les deux).
   Fichier tiré de l'image fixe validée par l'enseignant (docs/essais/centre-de-tri.html). */
window.Rendu3DTri = {
creer(toile) {
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
    g.fillText(texte, w / 2, h / 2 + 6, w - 56);
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


/* ---------- Réglages propres à cette vue, plus haute et plus profonde ---------- */
fond.position.set(0, 4.2, -13);
fond.scale.set(1.35, .38, 1);
sol.scale.set(1.2, 1.3, 1);

const bandeTri = () => texture(512, 128, (g, l, h) => {
  g.fillStyle = "#1d2024"; g.fillRect(0, 0, l, h);
  g.strokeStyle = "#41474f"; g.lineWidth = 11;
  for (let x = 0; x < l; x += 64) { g.beginPath(); g.moveTo(x, 12); g.lineTo(x + 26, h / 2); g.lineTo(x, h - 12); g.stroke(); }
  grain(g, l, h, 2500, .12);
}, 3, 1);

/* Tapis de (x0,z0) à (x1,z1) ; les chevrons montrent le sens de marche */
function tapis(x0, z0, x1, z1) {
  const dx = x1 - x0, dz = z1 - z0, l = Math.hypot(dx, dz);
  const g = new T.Group(); monde.add(g);
  g.position.set((x0 + x1) / 2, 0, (z0 + z1) / 2);
  g.rotation.y = -Math.atan2(dz, dx);
  const bande = bandeTri(); bande.repeat.set(Math.max(1, l / 2.4), 1);
  bloc(l, .1, 1.62, new T.MeshStandardMaterial({ map: bande, roughness: .85 }), 0, .6, 0, g);
  for (const z of [-.9, .9]) {
    bloc(l, .3, .12, ACIER, 0, .5, z, g);
    for (let x = -l / 2 + .35; x < l / 2; x += .75) cyl(.065, .06, CLAIR, x, .5, z + Math.sign(z) * .07, g, 14).rotation.x = Math.PI / 2;
  }
  for (let x = -l / 2 + .3; x <= l / 2; x += 1.9) for (const z of [-.8, .8]) bloc(.16, .45, .16, SOMBRE, x, .22, z, g);
}

/* Plateau tournant : disque, cercle de sécurité et grande flèche vers la direction choisie */
const JAUNE = new T.MeshBasicMaterial({ color: 0xffb800, toneMapped: false });
const CERNE = new T.MeshBasicMaterial({ color: 0x1a1d22, toneMapped: false });
function plateau(x, angle, numero) {
  cyl(1.75, .5, SOMBRE, x, .25, 0, monde, 56);
  cyl(1.82, .1, peint(14, 1), x, .5, 0, monde, 56);
  cyl(1.6, .12, ACIER, x, .58, 0, monde, 56);
  const g = new T.Group(); g.position.set(x, .66, 0); g.rotation.y = -angle; monde.add(g);
  const bande = bandeTri(); bande.repeat.set(1.3, 1);
  bloc(3.1, .05, 1.5, new T.MeshStandardMaterial({ map: bande, roughness: .85 }), 0, 0, 0, g);
  for (const z of [-.82, .82]) bloc(3.1, .12, .1, CLAIR, 0, .04, z, g);
  /* flèche à plat, dépassant du bord pour rester visible quand une caisse occupe le plateau */
  const f = new T.Shape();
  [[1.2, -.36], [2.45, -.36], [2.45, -.95], [3.65, 0], [2.45, .95], [2.45, .36], [1.2, .36]].forEach(([a, b], i) => (i ? f.lineTo(a, b) : f.moveTo(a, b)));
  const geo = new T.ExtrudeGeometry(f, { depth: .14, bevelEnabled: false });
  const m = objet(geo, JAUNE, 0, .3, 0, g); m.rotation.x = -Math.PI / 2;
  const contour = new T.LineSegments(new T.EdgesGeometry(geo), new T.LineBasicMaterial({ color: 0x1a1d22 })); contour.position.copy(m.position); contour.rotation.copy(m.rotation); g.add(contour);
  objet(...plaque("PLATEAU " + numero, 2.3), x + (numero === 1 ? 2.1 : 0), .5, 2.75).rotation.x = -.6;
  return g;
}

/* Capot au bout d'une voie, ouverture tournée vers la voie */
function capot(x, z, angle) {
  const g = new T.Group(); g.position.set(x, 0, z); g.rotation.y = angle; monde.add(g);
  const G = metal(acier("#4a5666"), .55, .5);
  bloc(1.9, .2, 2.2, G, 0, 2.2, 0, g);
  for (const dz of [-1.04, 1.04]) bloc(1.9, 1.75, .14, G, 0, 1.35, dz, g);
  bloc(.14, 1.75, 2.2, G, -.9, 1.35, 0, g);
  bloc(1.92, .18, 2.22, peint(5, 1), 0, 2.02, 0, g);
  for (let dz = -.85; dz <= .86; dz += .21) bloc(.05, 1.2, .17, CAOUTCHOUC, .93, 1.4, dz, g);
}
function panneau(texte, x, y, z, l = 2.6) {
  objet(...plaque(texte, l), x, y, z).rotation.x = -.28;
}

const P1 = -3.6, P2 = 3.9;
tapis(-12.2, 0, P1 - 1.75, 0);          /* entrée */
tapis(P1 + 1.75, 0, P2 - 1.75, 0);      /* liaison */
tapis(P2 + 1.75, 0, 12.2, 0);           /* sortie C */
tapis(P1, -1.75, P1, -7.6);             /* sortie A */
tapis(P2, -1.75, P2, -7.6);             /* sortie B */
tapis(P1, 1.75, P1, 7.85);              /* attente */
const tournants = [plateau(P1, 0, 1), plateau(P2, 0, 2)];

capot(-12.4, 0, 0);
capot(12.4, 0, Math.PI);
capot(P1, -7.8, -Math.PI / 2);
capot(P2, -7.8, -Math.PI / 2);
/* butoir de la voie d'attente */
bloc(2.1, .75, .34, peint(5, 1), P1, .95, 8.0);

panneau("ENTRÉE", -9.4, .34, 1.35);
panneau("SORTIE C", 9.6, .34, 1.35);
panneau("SORTIE A", P1, 3.0, -7.4);
panneau("SORTIE B", P2, 3.0, -7.4);
panneau("ATTENTE", P1 - 2.45, .45, 4.4, 2.4);


/* ---------- Écran : instruction en cours ---------- */
const toileEcran = document.createElement("canvas");
toileEcran.width = 768; toileEcran.height = 300;
const carteEcran = new T.CanvasTexture(toileEcran);
carteEcran.encoding = T.sRGBEncoding;
let affiche = null;
function ecran(message) {
  if (message === affiche) return;
  affiche = message;
  const g = toileEcran.getContext("2d");
  g.fillStyle = "#0d1b22"; g.fillRect(0, 0, 768, 300);
  g.textAlign = "center"; g.textBaseline = "middle";
  g.fillStyle = "#7fd8e6"; g.font = "700 50px Luciole, sans-serif"; g.fillText("INSTRUCTION EN COURS", 384, 82);
  g.fillStyle = "#ffffff"; g.font = "700 62px Luciole, sans-serif"; g.fillText(message, 384, 200, 720);
  carteEcran.needsUpdate = true;
}
bloc(4.6, 1.95, .26, metal(acier("#e8860f", .7), .35, .42), 10.4, 2.45, -4.4);
objet(new T.PlaneGeometry(4.25, 1.66), new T.MeshBasicMaterial({ map: carteEcran, toneMapped: false }), 10.4, 2.45, -4.25);
for (const dx of [-1.6, 1.6]) cyl(.07, 1.7, SOMBRE, 10.4 + dx, .85, -4.55);

/* ---------- Caisses du centre : un peu plus petites, posées n'importe où au sol ---------- */
function poserCaisse(c, x, z) {
  placer(c, x, .74);
  const g = stock.get(c.l + "-" + c.c);
  g.position.z = z;
  g.scale.setScalar(.88);
}

/* ---------- Lumières ---------- */
monde.add(new T.HemisphereLight(0xdfe9f5, 0x40382c, .45));
const soleil = new T.DirectionalLight(0xfff1dd, 1.35);
soleil.position.set(-6, 14, 9); soleil.castShadow = true;
soleil.shadow.bias = -.0004; soleil.shadow.radius = 4;
Object.assign(soleil.shadow.camera, { left: -17, right: 17, top: 15, bottom: -12, near: 1, far: 40 });
monde.add(soleil);
C.ombres(rendu, monde, soleil, () => afficher());
const appoint = new T.PointLight(0x9fc4ff, .5, 30); appoint.position.set(9, 6, 5); monde.add(appoint);





/* ---------- Caméra : de trois quarts, assez haute pour lire les directions ---------- */
const camera = new T.PerspectiveCamera(32, 1.6, .1, 140);
const DEPART = { angle: .14, hauteur: .62 };
let angle = DEPART.angle, hauteur = DEPART.hauteur, derniere = null;
function afficher() {
  const l = toile.clientWidth, h = toile.clientHeight;
  if (!l || !h || !derniere) return;
  rendu.setSize(l, h, false);
  camera.aspect = l / h;
  const dist = Math.max(22.6, 49 / camera.aspect);
  camera.position.set(Math.sin(angle) * dist * Math.cos(hauteur), Math.sin(hauteur) * dist, Math.cos(angle) * dist * Math.cos(hauteur));
  camera.lookAt(0, .1, .5);
  camera.updateProjectionMatrix();
  rendu.render(monde, camera);
}
/* vue : { caisses: [{ c, x, z, cachee }], angles: [plateau 1, plateau 2], instruction, decor } */
function dessiner(vue) {
  derniere = vue;
  for (const g of stock.values()) g.visible = false;
  for (const o of vue.caisses) if (!o.cachee) poserCaisse(o.c, o.x, o.z);
  tournants.forEach((g, i) => { g.rotation.y = -vue.angles[i]; });
  ecran(vue.instruction);
  decorer(vue.decor);
  afficher();
}

/* Faire glisser pour tourner un peu, double-clic pour revenir */
let glisse = null;
toile.addEventListener("pointerdown", (e) => { glisse = [e.clientX, e.clientY]; toile.setPointerCapture(e.pointerId); });
toile.addEventListener("pointermove", (e) => {
  if (!glisse) return;
  angle = Math.max(-.6, Math.min(.6, angle - (e.clientX - glisse[0]) * .004));
  hauteur = Math.max(.3, Math.min(1.15, hauteur + (e.clientY - glisse[1]) * .003));
  glisse = [e.clientX, e.clientY];
  afficher();
});
for (const nom of ["pointerup", "pointercancel"]) toile.addEventListener(nom, () => { glisse = null; });
toile.addEventListener("dblclick", () => { ({ angle, hauteur } = DEPART); afficher(); });
new ResizeObserver(afficher).observe(toile);

/* Pièces fixes fusionnées (moins d'appels de dessin) ; les plateaux tournants restent à part */
C.fusionner(monde, tournants);
for (const g of tournants) C.fusionner(g);

return { dessiner };
},
};

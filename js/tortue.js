/* Maquette « Cody » pour PlayTP, atelier Traçage.
   Aucun eval : le programme de l'élève est lu bloc par bloc (compatible CSP stricte). */
{
  const B = window.Blockly;

  /* ---------- Niveaux ---------- */
  const fd = (d) => ({ t: "av", d });
  const rt = (a) => ({ t: "tr", a: -a });
  const lt = (a) => ({ t: "tr", a });
  const up = () => ({ t: "st", bas: false });
  const dn = () => ({ t: "st", bas: true });
  const co = (c) => ({ t: "co", c });
  const ROUGE = "#e63946", ORANGE = "#f4a261", VERT = "#2a9d8f", BLEU = "#457b9d";
  const R = (n, ...corps) => ({ rep: n, corps });
  const BASE = ["avancer", "tourner", "repeter"];
  const TOUS = ["avancer", "reculer", "tourner", "repeter", "stylo", "couleur", "epaisseur"];

  const NIVEAUX = [
    /* Classés par difficulté croissante. « couleurs » : la couleur de chaque trait est contrôlée.
       Changer cet ordre demande de déplacer les sauvegardes (voir « tortue-ordre-difficulte »). */
    { titre: "Le carré", verbe: "TRACER", texte: "un carré de 100 pas de côté.",
      indice: "Un carré, c'est 4 fois la même chose : avancer, puis tourner.",
      depart: [-50, -50, 90], prog: [R(4, fd(100), rt(90))], opt: 3, blocs: BASE },
    { titre: "Le carré rouge", verbe: "TRACER", texte: "un carré rouge de 100 pas de côté.", couleurs: true,
      indice: "Choisis la couleur du crayon avant de commencer à tracer.",
      depart: [-50, -50, 90], prog: [co(ROUGE), R(4, fd(100), rt(90))], opt: 4, blocs: [...BASE, "couleur"] },
    { titre: "Le triangle", verbe: "TRACER", texte: "un triangle dont les trois côtés mesurent 120 pas.",
      indice: "Quand il revient au départ, le crayon a fait un tour complet : 360°. Chacun des 3 virages vaut donc 360 ÷ 3.",
      depart: [-60, -50, 0], prog: [R(3, fd(120), lt(120))], opt: 3, blocs: BASE },
    { titre: "L'escalier", verbe: "TRACER", texte: "un escalier de 3 marches, chacune de 60 pas de haut et 60 pas de large.",
      indice: "Une marche : monter, tourner à droite, avancer, tourner à gauche. Puis répéter.",
      depart: [-90, -90, 90], prog: [R(3, fd(60), rt(90), fd(60), lt(90))], opt: 5, blocs: BASE },
    { titre: "Le carré bicolore", verbe: "TRACER", texte: "un carré de 100 pas dont les côtés sont tour à tour rouges et bleus. Commence en rouge, par le côté gauche.",
      couleurs: true, indice: "Le motif « un côté rouge, puis un côté bleu » se répète 2 fois.",
      depart: [-50, -50, 90], prog: [R(2, co(ROUGE), fd(100), rt(90), co(BLEU), fd(100), rt(90))], opt: 7, blocs: [...BASE, "couleur"] },
    { titre: "L'étoile", verbe: "TRACER", texte: "une étoile à 5 branches de 160 pas.",
      indice: "Pour une étoile, le crayon fait 2 tours complets (720°) en 5 virages.",
      depart: [-80, 30, 0], prog: [R(5, fd(160), rt(144))], opt: 3, blocs: BASE },
    { titre: "Les pointillés", verbe: "TRACER", texte: "5 tirets de 30 pas, séparés par des trous de 30 pas.",
      indice: "Pour avancer sans dessiner, lève le crayon… et pense à le baisser ensuite.",
      depart: [-150, 0, 0], prog: [R(5, fd(30), up(), fd(30), dn())], opt: 5, blocs: [...BASE, "stylo"] },
    { titre: "Le triangle tricolore", verbe: "TRACER", texte: "un triangle de 120 pas de côté : le bas en rouge, puis un côté vert et un côté bleu.",
      couleurs: true, indice: "Suis le sens du crayon : avance, puis tourne à gauche. Change de couleur avant chaque côté.",
      depart: [-60, -50, 0], prog: [co(ROUGE), fd(120), lt(120), co(VERT), fd(120), lt(120), co(BLEU), fd(120)], opt: 8,
      blocs: [...BASE, "couleur"] },
    { titre: "L'escalier coloré", verbe: "TRACER", texte: "un escalier de 3 marches de 60 pas : les montées en vert, les plats en orange.",
      couleurs: true, indice: "Change de couleur à l'intérieur de la boucle.",
      depart: [-90, -90, 90], prog: [R(3, co(VERT), fd(60), rt(90), co(ORANGE), fd(60), lt(90))], opt: 7, blocs: [...BASE, "couleur"] },
    { titre: "La rosace", verbe: "TRACER", texte: "8 carrés de 80 pas qui tournent autour du point de départ.",
      indice: "Une boucle dans une boucle : un carré, puis un petit virage de 360 ÷ 8.",
      depart: [0, 0, 90], prog: [R(8, R(4, fd(80), rt(90)), rt(45))], opt: 5, blocs: BASE },
    { titre: "La maison", verbe: "TRACER", texte: "une maison : un carré de 100 pas surmonté d'un toit en triangle.",
      indice: "Après le carré, le crayon est revenu au départ. Remonte d'abord le long du mur gauche.",
      depart: [-50, -80, 90], prog: [R(4, fd(100), rt(90)), fd(100), rt(30), fd(100), rt(120), fd(100)], opt: 8,
      blocs: [...BASE, "reculer", "stylo"] },
    { titre: "La rosace bicolore", verbe: "TRACER", texte: "8 carrés de 80 pas autour du point de départ, tour à tour rouges et bleus. Commence en rouge.",
      couleurs: true, indice: "Répète 4 fois le motif : un carré rouge, un virage, un carré bleu, un virage.",
      depart: [0, 0, 90], prog: [R(4, co(ROUGE), R(4, fd(80), rt(90)), rt(45), co(BLEU), R(4, fd(80), rt(90)), rt(45))], opt: 11,
      blocs: [...BASE, "couleur"] },
    { titre: "Création libre", verbe: "CRÉER", texte: "ton propre dessin, avec les couleurs et les épaisseurs (sans modèle).",
      indice: "Essaie de répéter 36 fois un carré en tournant de 10° à chaque fois…",
      depart: [0, 0, 90], prog: null, opt: 0, blocs: TOUS },
  ];

  const COULEURS = [
    ["bleu nuit", "#1d3557"], ["rouge", "#e63946"], ["orange", "#f4a261"], ["jaune", "#e9c46a"],
    ["vert", "#2a9d8f"], ["bleu", "#457b9d"], ["violet", "#7b5ea7"], ["rose", "#ff70a6"],
  ];
  const PASTILLE = (c) => "data:image/svg+xml," + encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26"><circle cx="13" cy="13" r="11" fill="${c}" stroke="#fff" stroke-width="2"/></svg>`);
  const ENCRE = "#1d3557";
  const EPAISSEUR = 4;

  /* ---------- Blocs ---------- */
  B.defineBlocksWithJsonArray([
    { type: "tortue_depart", message0: "DÉPART", nextStatement: null, style: "depart",
      tooltip: "Le programme commence ici. Accroche tes blocs dessous." },
    { type: "tortue_avancer", message0: "avancer de %1 pas",
      args0: [{ type: "field_number", name: "N", value: 100, min: 0, max: 600, precision: 1 }],
      previousStatement: null, nextStatement: null, style: "mouvement" },
    { type: "tortue_reculer", message0: "reculer de %1 pas",
      args0: [{ type: "field_number", name: "N", value: 50, min: 0, max: 600, precision: 1 }],
      previousStatement: null, nextStatement: null, style: "mouvement" },
    { type: "tortue_tourner", message0: "tourner à %1 de %2 °",
      args0: [{ type: "field_dropdown", name: "S", options: [["droite ↻", "D"], ["gauche ↺", "G"]] },
        { type: "field_number", name: "A", value: 90, min: 0, max: 360, precision: 1 }],
      previousStatement: null, nextStatement: null, style: "mouvement" },
    { type: "tortue_repeter", message0: "répéter %1 fois %2 %3",
      args0: [{ type: "field_number", name: "N", value: 4, min: 0, max: 100, precision: 1 },
        { type: "input_dummy" }, { type: "input_statement", name: "FAIRE" }],
      previousStatement: null, nextStatement: null, style: "boucle" },
    { type: "tortue_stylo", message0: "%1 le crayon",
      args0: [{ type: "field_dropdown", name: "E", options: [["lever", "H"], ["baisser", "B"]] }],
      previousStatement: null, nextStatement: null, style: "stylo" },
    { type: "tortue_couleur", message0: "couleur du crayon %1",
      args0: [{ type: "field_dropdown", name: "C",
        options: COULEURS.map(([nom, c]) => [{ src: PASTILLE(c), width: 26, height: 26, alt: nom }, c]) }],
      previousStatement: null, nextStatement: null, style: "stylo" },
    { type: "tortue_epaisseur", message0: "épaisseur du trait %1",
      args0: [{ type: "field_number", name: "N", value: 8, min: 1, max: 30, precision: 1 }],
      previousStatement: null, nextStatement: null, style: "stylo" },
  ]);

  const boiteOutils = (noms) => ({
    kind: "flyoutToolbox",
    contents: noms.map((n) => ({ kind: "block", type: "tortue_" + n })),
  });

  const A = window.Atelier, memo = A.memo;
  const ws = A.injecter("blockly", boiteOutils(BASE));
  const indice = A.boutonIndice(document.getElementById("indice"));

  let etoiles = memo.lire("tortue-etoiles", {});
  /* Les niveaux « couleurs » se sont insérés avant la création libre (ex-niveau 8) */
  if (!memo.lire("tortue-niveaux-couleurs", false)) {
    const libre = NIVEAUX.length - 1;
    const sauve = memo.lire("tortue-prog-7", null);
    if (sauve) { memo.ecrire("tortue-prog-" + libre, sauve); memo.ecrire("tortue-prog-7", null); }
    if (+memo.lire("tortue-niveau", 0) === 7) memo.ecrire("tortue-niveau", libre);
    memo.ecrire("tortue-niveaux-couleurs", true);
  }
  /* Niveaux reclassés par difficulté : VERS[ancien numéro] = nouveau numéro (à partir de 0) */
  if (!memo.lire("tortue-ordre-difficulte", false)) {
    const VERS = [0, 2, 3, 5, 6, 9, 10, 1, 4, 7, 8, 11, 12];
    const programmes = VERS.map((_, i) => memo.lire("tortue-prog-" + i, null));
    VERS.forEach((arrivee, depart) => memo.ecrire("tortue-prog-" + arrivee, programmes[depart]));
    etoiles = Object.fromEntries(Object.entries(etoiles).map(([i, note]) => [VERS[i], note]));
    memo.ecrire("tortue-etoiles", etoiles);
    const courant = +memo.lire("tortue-niveau", 0) || 0;
    memo.ecrire("tortue-niveau", VERS[courant] ?? 0);
    memo.ecrire("tortue-ordre-difficulte", true);
  }

  /* ---------- Programme de l'élève ---------- */
  const LIMITE = 20000;
  const debut = () => ws.getTopBlocks(false).find((b) => b.type === "tortue_depart");

  function compiler(b, out) {
    for (; b; b = b.getNextBlock()) {
      if (!b.isEnabled()) continue;
      out.push({ t: "hl", id: b.id });
      switch (b.type) {
        case "tortue_avancer": out.push(fd(+b.getFieldValue("N"))); break;
        case "tortue_reculer": out.push(fd(-b.getFieldValue("N"))); break;
        case "tortue_tourner": {
          const a = +b.getFieldValue("A");
          out.push(b.getFieldValue("S") === "D" ? rt(a) : lt(a));
          break;
        }
        case "tortue_repeter": {
          const n = +b.getFieldValue("N");
          const corps = b.getInputTargetBlock("FAIRE");
          for (let i = 0; i < n && corps; i++) {
            compiler(corps, out);
            out.push({ t: "hl", id: b.id });
          }
          break;
        }
        case "tortue_stylo": out.push(b.getFieldValue("E") === "B" ? dn() : up()); break;
        case "tortue_couleur": out.push({ t: "co", c: b.getFieldValue("C") }); break;
        case "tortue_epaisseur": out.push({ t: "ep", w: +b.getFieldValue("N") }); break;
      }
      if (out.length > LIMITE) throw new RangeError("trop");
    }
    return out;
  }

  function compter(b) {
    let n = 0;
    for (; b; b = b.getNextBlock()) {
      if (!b.isEnabled()) continue;
      n++;
      if (b.type === "tortue_repeter") n += compter(b.getInputTargetBlock("FAIRE"));
    }
    return n;
  }

  const aplatir = (prog, out = []) => {
    for (const c of prog) {
      if (c.rep) for (let i = 0; i < c.rep; i++) aplatir(c.corps, out);
      else out.push(c);
    }
    return out;
  };

  /* ---------- Géométrie ---------- */
  const etatInitial = (niv) => ({ x: niv.depart[0], y: niv.depart[1], h: niv.depart[2], bas: true, c: ENCRE, w: EPAISSEUR });
  const RAD = Math.PI / 180;

  function appliquer(st, c, segs) {
    if (c.t === "av") {
      const x2 = st.x + c.d * Math.cos(st.h * RAD), y2 = st.y + c.d * Math.sin(st.h * RAD);
      if (st.bas && segs) segs.push({ x1: st.x, y1: st.y, x2, y2, c: st.c, w: st.w });
      st.x = x2; st.y = y2;
    } else if (c.t === "tr") st.h += c.a;
    else if (c.t === "st") st.bas = c.bas;
    else if (c.t === "co") st.c = c.c;
    else if (c.t === "ep") st.w = c.w;
  }
  function tracer(cmds, niv) {
    const st = etatInitial(niv), segs = [];
    for (const c of cmds) appliquer(st, c, segs);
    return segs;
  }
  const X = (x) => 200 + x, Y = (y) => 200 - y;

  /* ---------- Toiles ---------- */
  const cFond = document.getElementById("c-fond").getContext("2d");
  const cEncre = document.getElementById("c-encre").getContext("2d");
  const cDessus = document.getElementById("c-dessus").getContext("2d");
  for (const c of [cFond, cEncre, cDessus]) { c.setTransform(2, 0, 0, 2, 0, 0); c.lineCap = "round"; c.lineJoin = "round"; }

  const PALETTE = {
    clair: { fond: "#ffffff", fin: "rgba(40,70,100,.07)", gros: "rgba(40,70,100,.17)", axe: "rgba(40,70,100,.48)",
      texte: "#566477", modele: "rgba(14,107,120,.70)", encre: ENCRE },
    sombre: { fond: "#121821", fin: "rgba(170,200,235,.06)", gros: "rgba(170,200,235,.14)", axe: "rgba(170,200,235,.42)",
      texte: "#9aabc2", modele: "rgba(95,200,212,.70)", encre: "#e8eef7" },
  };
  const palette = () => PALETTE[A.sombre.matches ? "sombre" : "clair"];
  /* L'encre par défaut suit le thème (bleu nuit illisible sur fond sombre) */
  const teinte = (c) => (c === ENCRE ? palette().encre : c);

  function ligne(ctx, x1, y1, x2, y2) { ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); }

  function dessinerFond(niv) {
    const p = palette();
    cFond.fillStyle = p.fond; cFond.fillRect(0, 0, 400, 400);
    cFond.lineWidth = 1;
    for (let i = 0; i <= 400; i += 10) {
      cFond.strokeStyle = i % 50 === 0 ? p.gros : p.fin;
      ligne(cFond, i, 0, i, 400); ligne(cFond, 0, i, 400, i);
    }
    cFond.strokeStyle = p.axe; ligne(cFond, 200, 0, 200, 400); ligne(cFond, 0, 200, 400, 200);
    cFond.fillStyle = p.texte; cFond.font = "9px Luciole, system-ui, sans-serif";
    for (let v = -150; v <= 150; v += 50) {
      if (!v) continue;
      ligne(cFond, X(v), 197, X(v), 203); ligne(cFond, 197, Y(v), 203, Y(v));
      cFond.textAlign = "center"; cFond.textBaseline = "top"; cFond.fillText(v, X(v), 205);
      cFond.textAlign = "right"; cFond.textBaseline = "middle"; cFond.fillText(v, 194, Y(v));
    }
    cFond.textAlign = "right"; cFond.textBaseline = "bottom"; cFond.fillText("x", 394, 196);
    cFond.textAlign = "left"; cFond.textBaseline = "top"; cFond.fillText("y", 206, 6);
    if (niv.prog) {
      cFond.save();
      cFond.setLineDash([6, 6]); cFond.lineWidth = 3; cFond.strokeStyle = p.modele;
      if (niv.couleurs) cFond.lineWidth = 5; /* plus épais : les couleurs se distinguent mieux */
      for (const s of tracer(aplatir(niv.prog), niv)) {
        if (niv.couleurs) cFond.strokeStyle = s.c;
        ligne(cFond, X(s.x1), Y(s.y1), X(s.x2), Y(s.y2));
      }
      cFond.restore();
    }
  }

  /* Curseur « crayon ». La mine est au point exact du tracé et pointe vers le cap (0 = droite). */
  function forme(ctx, points, remplissage) {
    ctx.beginPath();
    points.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.closePath();
    ctx.fillStyle = remplissage; ctx.fill();
  }
  const CONTOUR = [[0, 0], [-13, -7], [-47, -7], [-50, -4], [-50, 4], [-47, 7], [-13, 7]];
  function crayon(ctx, st) {
    ctx.save();
    ctx.translate(X(st.x), Y(st.y));
    /* Crayon levé : il se détache de la feuille et son ombre reste au sol */
    if (!st.bas) {
      ctx.save(); ctx.rotate(-st.h * RAD); forme(ctx, CONTOUR, "rgba(20,30,45,.18)"); ctx.restore();
      ctx.translate(-5, -9);
    }
    ctx.rotate(-st.h * RAD);
    ctx.globalAlpha = 0.94; /* le trait reste deviné sous le corps du crayon */
    forme(ctx, [[0, 0], [-13, -7], [-13, 7]], "#e8c89a");
    forme(ctx, [[0, 0], [-4.5, -2.4], [-4.5, 2.4]], teinte(st.c));
    forme(ctx, [[-13, -7], [-39, -7], [-39, -2.4], [-13, -2.4]], "#f6c445");
    forme(ctx, [[-13, -2.4], [-39, -2.4], [-39, 2.4], [-13, 2.4]], "#e5ac22");
    forme(ctx, [[-13, 2.4], [-39, 2.4], [-39, 7], [-13, 7]], "#c58d12");
    forme(ctx, [[-39, -7], [-44, -7], [-44, 7], [-39, 7]], "#aeb8c4");
    forme(ctx, [[-44, -7], [-47, -7], [-50, -4], [-50, 4], [-47, 7], [-44, 7]], "#d9776c");
    ctx.beginPath();
    CONTOUR.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.closePath();
    for (const x of [-40.7, -42.3]) { ctx.moveTo(x, -7); ctx.lineTo(x, 7); }
    ctx.strokeStyle = "#33404f"; ctx.lineWidth = 0.9; ctx.stroke();
    ctx.restore();
    /* Point visé sur la feuille quand le crayon est levé */
    if (!st.bas) {
      ctx.beginPath(); ctx.arc(X(st.x), Y(st.y), 2.6, 0, Math.PI * 2);
      ctx.strokeStyle = teinte(st.c); ctx.lineWidth = 1.2; ctx.stroke();
    }
  }

  /* ---------- Vérification par comparaison des dessins ---------- */
  const toileTest = document.createElement("canvas");
  toileTest.width = toileTest.height = 400;
  const cTest = toileTest.getContext("2d", { willReadFrequently: true });
  function masque(segs) {
    cTest.clearRect(0, 0, 400, 400);
    cTest.lineCap = "round"; cTest.lineWidth = 10; cTest.strokeStyle = "#000";
    for (const s of segs) { cTest.beginPath(); cTest.moveTo(X(s.x1), Y(s.y1)); cTest.lineTo(X(s.x2), Y(s.y2)); cTest.stroke(); }
    const d = cTest.getImageData(0, 0, 400, 400).data, m = new Uint8Array(160000);
    for (let i = 0; i < m.length; i++) m[i] = d[i * 4 + 3] > 100 ? 1 : 0;
    return m;
  }
  let calqueEcarts = null;
  function comparer(niv, segsEleve) {
    const mc = masque(tracer(aplatir(niv.prog), niv)), me = masque(segsEleve);
    let cible = 0, ecarts = 0;
    const img = cTest.createImageData(400, 400);
    for (let i = 0; i < mc.length; i++) {
      cible += mc[i];
      if (mc[i] !== me[i]) {
        ecarts++;
        const [r, g, b] = mc[i] ? [232, 85, 58] : [123, 94, 167];
        img.data.set([r, g, b, 210], i * 4);
      }
    }
    cTest.putImageData(img, 0, 0);
    calqueEcarts = document.createElement("canvas");
    calqueEcarts.width = calqueEcarts.height = 400;
    calqueEcarts.getContext("2d").drawImage(toileTest, 0, 0);
    return ecarts / Math.max(cible, 1);
  }

  /* Niveaux « couleurs » : pour chaque couleur, les traits de l'élève doivent couvrir les mêmes
     pixels que ceux du modèle. Rend vrai si une couleur s'en écarte de plus de 8 %. */
  function couleursFausses(niv, segsEleve) {
    const modele = tracer(aplatir(niv.prog), niv);
    const teintes = new Set([...modele, ...segsEleve].map((s) => s.c));
    return [...teintes].some((c) => {
      const mc = masque(modele.filter((s) => s.c === c)), me = masque(segsEleve.filter((s) => s.c === c));
      let cible = 0, ecarts = 0;
      for (let i = 0; i < mc.length; i++) { cible += mc[i]; if (mc[i] !== me[i]) ecarts++; }
      return ecarts / Math.max(cible, 1) > 0.08;
    });
  }

  /* ---------- Animation ---------- */
  const VITESSES = [0, 1.5, 3, 6, 14, Infinity];
  const ui = {
    lancer: document.getElementById("lancer"), effacer: document.getElementById("effacer"),
    vitesse: document.getElementById("vitesse"), verdict: document.getElementById("verdict"),
    etat: Object.fromEntries(["x", "y", "cap", "stylo"].map((k) => [k, document.getElementById("etat-" + k)])),
    compteur: document.getElementById("compteur"), python: document.getElementById("code-python"),
    copier: document.getElementById("copier"), nav: document.getElementById("niveaux"),
  };
  let niv = NIVEAUX[0], numNiv = 0, anim = null, etatVu = etatInitial(niv), boucle = 0;

  const dire = (etat, titre, detail, note) => A.verdict(ui.verdict, { etat, titre, detail, note });
  const attente = () => dire("info", "En attente", niv.prog ? "Reproduis le modèle en pointillés." : "Compose ton programme, puis exécute-le.");

  function dessus() {
    cDessus.clearRect(0, 0, 400, 400);
    if (calqueEcarts) cDessus.drawImage(calqueEcarts, 0, 0, 400, 400);
    crayon(cDessus, etatVu);
    const net = (v) => String(Math.round(v) || 0);
    ui.etat.x.textContent = net(etatVu.x);
    ui.etat.y.textContent = net(etatVu.y);
    ui.etat.cap.textContent = net(((etatVu.h % 360) + 360) % 360) + "°";
    ui.etat.stylo.textContent = etatVu.bas ? "baissé" : "levé";
  }
  function animer() {
    boucle = 0;
    if (anim) avancerAnim();
    dessus();
    if (anim) boucle = requestAnimationFrame(animer);
  }
  const relancer = () => { if (!boucle) boucle = requestAnimationFrame(animer); };

  function trait(x1, y1, x2, y2, st) {
    cEncre.strokeStyle = teinte(st.c); cEncre.lineWidth = st.w;
    cEncre.beginPath(); cEncre.moveTo(X(x1), Y(y1)); cEncre.lineTo(X(x2), Y(y2)); cEncre.stroke();
  }

  function avancerAnim() {
    const st = anim.st, cmds = anim.cmds;
    let budget = VITESSES[+ui.vitesse.value];
    while (budget > 0 && anim.i < cmds.length) {
      const c = cmds[anim.i];
      if (c.t === "av") {
        const total = Math.abs(c.d), pas = Math.min(total - anim.fait, budget), sens = Math.sign(c.d);
        const x2 = st.x + sens * pas * Math.cos(st.h * RAD), y2 = st.y + sens * pas * Math.sin(st.h * RAD);
        if (st.bas && pas > 0) trait(st.x, st.y, x2, y2, st);
        st.x = x2; st.y = y2; anim.fait += pas; budget -= pas;
        if (anim.fait >= total - 1e-9) { anim.i++; anim.fait = 0; }
      } else if (c.t === "tr") {
        const total = Math.abs(c.a), pas = Math.min(total - anim.fait, budget * 4);
        st.h += Math.sign(c.a) * pas; anim.fait += pas; budget -= pas / 4;
        if (anim.fait >= total - 1e-9) { anim.i++; anim.fait = 0; }
      } else {
        if (c.t === "hl") ws.highlightBlock(c.id); else appliquer(st, c, null);
        anim.i++;
      }
    }
    etatVu = st;
    if (anim.i >= cmds.length) terminer();
  }

  function effacer() {
    A.fermerFete();
    anim = null; calqueEcarts = null;
    cEncre.clearRect(0, 0, 400, 400);
    etatVu = etatInitial(niv);
    ws.highlightBlock(null);
    etatBouton(false);
    dessus();
  }
  const etatBouton = (enCours) => A.boutonExecuter(ui.lancer, enCours);

  function lancer() {
    if (anim) { effacer(); dire("info", "Programme arrêté", ""); return; }
    effacer();
    const d = debut();
    let cmds;
    try { cmds = compiler(d && d.getNextBlock(), []); }
    catch { dire("ko", "Programme trop long", "Vérifie le nombre de répétitions."); return; }
    if (!cmds.some((c) => c.t !== "hl")) {
      dire("ko", "Aucune instruction", "Accroche des blocs sous « DÉPART ».");
      return;
    }
    dire("info", "Exécution en cours", "");
    anim = { cmds, i: 0, fait: 0, st: etatInitial(niv), segs: tracer(cmds, niv) };
    etatBouton(true);
    relancer();
  }

  function terminer() {
    const segs = anim.segs;
    anim = null;
    ws.highlightBlock(null);
    etatBouton(false);
    if (!niv.prog) { dire("ok", "Tracé terminé", "Modifie un nombre et relance pour comparer."); return; }
    if (!segs.length) { dire("ko", "Tracé non conforme", "Rien n'est dessiné : le crayon était levé."); return; }
    const ecart = comparer(niv, segs);
    if (ecart < 0.05 && niv.couleurs && couleursFausses(niv, segs)) {
      calqueEcarts = null;
      dire("ko", "Couleurs non conformes", "La forme est juste, mais des traits n'ont pas la bonne couleur. Compare avec le modèle en pointillés.");
    } else if (ecart < 0.05) {
      calqueEcarts = null;
      const n = compter(debut().getNextBlock());
      const note = A.noter(n, niv.opt);
      if (note > (etoiles[numNiv] || 0)) { etoiles[numNiv] = note; memo.ecrire("tortue-etoiles", etoiles); construireNav(); }
      const bilan = `${n} bloc${n > 1 ? "s" : ""} · ${note === 3 ? "optimum atteint" : `optimum : ${niv.opt} blocs`}`;
      dire("ok", "Tracé conforme", bilan, note);
      A.feter(note, bilan, {
        retenter: () => ui.effacer.click(),
        suivant: numNiv < NIVEAUX.length - 1 ? () => ouvrir(numNiv + 1) : null,
      });
    } else {
      dire("ko", "Tracé non conforme", "Rouge : ce qui manque. Violet : ce qui dépasse.");
    }
  }

  /* ---------- Python ---------- */
  function python(b, ind, prof, lignes) {
    for (; b; b = b.getNextBlock()) {
      if (!b.isEnabled()) continue;
      const p = "    ".repeat(ind), v = (k) => b.getFieldValue(k);
      switch (b.type) {
        case "tortue_avancer": lignes.push(`${p}forward(${v("N")})`); break;
        case "tortue_reculer": lignes.push(`${p}backward(${v("N")})`); break;
        case "tortue_tourner": lignes.push(`${p}${v("S") === "D" ? "right" : "left"}(${v("A")})`); break;
        case "tortue_repeter": {
          const nom = "ijk"[prof] || "n" + prof, corps = b.getInputTargetBlock("FAIRE");
          lignes.push(`${p}for ${nom} in range(${v("N")}):`);
          if (corps) python(corps, ind + 1, prof + 1, lignes); else lignes.push(`${p}    pass`);
          break;
        }
        case "tortue_stylo": lignes.push(`${p}${v("E") === "B" ? "pendown" : "penup"}()`); break;
        case "tortue_couleur": lignes.push(`${p}pencolor("${v("C")}")`); break;
        case "tortue_epaisseur": lignes.push(`${p}pensize(${v("N")})`); break;
      }
    }
    return lignes;
  }
  function majPython() {
    const [x, y, h] = niv.depart, d = debut();
    const corps = python(d && d.getNextBlock(), 0, 0, []);
    ui.python.textContent = [
      "from turtle import *", "", "# Position de départ", "penup()", `goto(${x}, ${y})`,
      `setheading(${h})`, "pendown()", `pensize(${EPAISSEUR})`, `pencolor("${ENCRE}")`, "",
      "# Mon programme", ...(corps.length ? corps : ["# (aucun bloc)"]), "", "done()",
    ].join("\n");
  }

  /* ---------- Niveaux, sauvegarde ---------- */
  const construireNav = () => A.boutonsNiveaux(ui.nav, NIVEAUX, numNiv, etoiles, ouvrir);

  let chargement = false;
  /* « Recommencer le niveau » : le programme est effacé, les étoiles gagnées restent */
  const annulerVider = A.boutonConfirmer(document.getElementById("vider"), () => {
    memo.ecrire("tortue-prog-" + numNiv, null);
    ouvrir(numNiv);
  });

  function ouvrir(i) {
    annulerVider();
    effacer();
    numNiv = i; niv = NIVEAUX[i];
    memo.ecrire("tortue-niveau", i);
    document.getElementById("niv-num").textContent = `Niveau ${i + 1} sur ${NIVEAUX.length}`;
    document.getElementById("titre-niveau").textContent = niv.titre;
    A.consigne(document.getElementById("texte-niveau"), niv.verbe, niv.texte);
    A.bareme(document.getElementById("bareme"), niv.opt);
    indice(niv.indice);
    ws.updateToolbox(boiteOutils(niv.blocs));
    chargement = true;
    ws.clear();
    const sauve = memo.lire("tortue-prog-" + i, null);
    try { if (sauve) B.serialization.workspaces.load(sauve, ws); } catch { ws.clear(); }
    if (!debut()) {
      B.serialization.blocks.append({ type: "tortue_depart", x: 30, y: 30, deletable: false }, ws);
    }
    chargement = false;
    dessinerFond(niv);
    etatVu = etatInitial(niv);
    dessus();
    majProgramme();
    construireNav();
    attente();
  }

  function majProgramme() {
    const d = debut();
    const n = d ? compter(d.getNextBlock()) : 0;
    ui.compteur.textContent = `${n} bloc${n > 1 ? "s" : ""}`;
    majPython();
  }

  ws.addChangeListener((e) => {
    if (e.isUiEvent || chargement) return;
    majProgramme();
    memo.ecrire("tortue-prog-" + numNiv, B.serialization.workspaces.save(ws));
  });

  ui.lancer.addEventListener("click", lancer);
  ui.effacer.addEventListener("click", () => { effacer(); attente(); });
  A.boutonCopier(ui.copier, ui.python);
  A.sombre.addEventListener("change", () => { effacer(); dessinerFond(niv); attente(); });
  /* La police des graduations peut arriver après le premier dessin */
  document.fonts.ready.then(() => dessinerFond(niv));

  window.tortueTest = { NIVEAUX, ouvrir, ws, comparer, tracer, aplatir, get niv() { return niv; } };
  ouvrir(Math.min(+memo.lire("tortue-niveau", 0) || 0, NIVEAUX.length - 1));
}

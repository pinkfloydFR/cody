/* Bras pivotant : blocs, géométrie, dessin 2D, objectif et textes. L'interface commune est dans
   manutention.js ; les règles sont dans pivot-moteur.js. */
{
  const B = window.Blockly, M = window.Pivot;

  /* ---------- Blocs ---------- */
  const lien = { previousStatement: null, nextStatement: null };
  const corps = (name) => ({ type: "input_statement", name });
  B.defineBlocksWithJsonArray([
    { type: "pivot_tourner", message0: "tourner d'un quart de tour à %1", args0: [
      { type: "field_dropdown", name: "S", options: [["droite ↻", "D"], ["gauche ↺", "G"]] }], ...lien, style: "mouvement",
      tooltip: "Vu de dessus. À droite : ouest, nord, est, sud." },
    { type: "pivot_saisir", message0: "saisir la caisse", ...lien, style: "stylo" },
    { type: "pivot_poser", message0: "poser la caisse", ...lien, style: "stylo" },
    { type: "pivot_repeter", message0: "répéter %1 fois %2 %3", args0: [
      { type: "field_number", name: "N", value: 3, min: 0, max: 100, precision: 1 }, { type: "input_dummy" }, corps("FAIRE")],
      ...lien, style: "boucle" },
    { type: "pivot_jusqua", message0: "répéter jusqu'à être face à l'ouest %1 %2",
      args0: [{ type: "input_dummy" }, corps("FAIRE")], ...lien, style: "tantque",
      tooltip: "Vérifie avant chaque tour : si le bras est déjà face à l'ouest, rien n'est fait." },
    { type: "pivot_tantque", message0: "répéter tant qu'il y a une caisse ici %1 %2",
      args0: [{ type: "input_dummy" }, corps("FAIRE")], ...lien, style: "tantque" },
    { type: "pivot_sicaisse", message0: "s'il y a une caisse ici %1 %2", args0: [{ type: "input_dummy" }, corps("FAIRE")],
      message1: "sinon %1", args1: [corps("SINON")], ...lien, style: "condition" },
    { type: "pivot_si", message0: "si la caisse tenue est %1 %2 %3", args0: [
      { type: "field_dropdown", name: "C", options: [["rouge", "rouge"], ["bleue", "bleu"], ["jaune", "jaune"], ["verte", "vert"]] },
      { type: "input_dummy" }, corps("FAIRE")], message1: "sinon %1", args1: [corps("SINON")], ...lien, style: "condition" },
  ]);

  function compiler(b) {
    const out = [];
    for (; b; b = b.getNextBlock()) {
      if (!b.isEnabled()) continue;
      const t = b.type.slice("pivot_".length), c = { t, id: b.id };
      const dedans = (nom) => compiler(b.getInputTargetBlock(nom));
      if (t === "tourner") c.s = b.getFieldValue("S");
      else if (t === "repeter") { c.n = +b.getFieldValue("N"); c.corps = dedans("FAIRE"); }
      else if (t === "tantque" || t === "jusqua") c.corps = dedans("FAIRE");
      else if (t === "si" || t === "sicaisse") {
        if (t === "si") c.c = b.getFieldValue("C");
        c.alors = dedans("FAIRE"); c.sinon = dedans("SINON");
      }
      out.push(c);
    }
    return out;
  }

  /* ---------- Géométrie commune au 2D et à la 3D ---------- */
  /* Angles en quarts de tour : 0 = ouest, 1 = nord, 2 = est, 3 = sud (sens des aiguilles d'une montre) */
  const QUART = { O: 0, N: 1, E: 2, S: 3 };
  const TAPIS = { entree: "O", N: "N", E: "E", S: "S" };
  /* Distance au pivot de la place de prise ou de dépose, puis écart entre deux caisses */
  const PRISE = 4.1, PAS = 1.7;
  /* Rang au-delà duquel une caisse est sous le capot (le tapis sud est court : le capot gênerait) */
  const VISIBLE = { entree: 2.2, N: 2.2, E: 2.2, S: 1.2 };
  /* Place de chaque caisse sur les tapis ; « avance » : décalage (en caisses) de chaque tapis */
  function places(piles, avance) {
    const out = [];
    for (const [poste, dir] of Object.entries(TAPIS)) {
      piles[poste].forEach((c, i) => {
        const rang = (poste === "entree" ? i : piles[poste].length - 1 - i) + (avance[poste] || 0);
        if (rang <= VISIBLE[poste]) out.push({ c, dir, r: PRISE + rang * PAS });
      });
    }
    return out;
  }

  const vueDe = (etat, avance = {}) => ({ pivot: true, angle: QUART[etat.dir], bas: 0, main: etat.main,
    caisses: places(etat.piles, avance), avance, instruction: "en attente" });
  const fixe = (etat) => vueDe(etat);

  const COTE = { D: "droite", G: "gauche" };
  const libelle = (ev) => (ev.t === "tourner" ? `tourner à ${COTE[ev.instruction.s]}` : `${ev.t} la caisse`);

  /* Image intermédiaire entre l'état « avant » et l'événement ; u va de 0 à 1 */
  function image(avant, ev, u) {
    const doux = (v) => v * v * (3 - 2 * v);
    if (ev.t === "tourner") {
      return { ...vueDe(avant), angle: QUART[avant.dir] + (ev.instruction.s === "D" ? 1 : -1) * doux(u), instruction: libelle(ev) };
    }
    const poste = avant.dir === "O" ? "entree" : avant.dir;
    const etat = u < 0.5 ? avant : ev.etat, avance = {};
    /* La sortie fait de la place pendant la descente ; l'entrée avance pendant la remontée */
    if (ev.t === "poser" && u < 0.5) avance[poste] = doux(u * 2);
    if (ev.t === "saisir" && u >= 0.5) avance[poste] = 1 - doux((u - 0.5) * 2);
    return { ...vueDe(etat, avance), bas: doux(u < 0.5 ? u * 2 : (1 - u) * 2), instruction: libelle(ev) };
  }

  const etatDepart = (cas, dir) => ({ dir, main: null,
    piles: Object.fromEntries(Object.keys(TAPIS).map((k) => [k, [...(cas.depart[k] || [])]])) });

  /* ---------- Dessin 2D de secours : le poste vu de dessus (toile logique 1200 x 500) ---------- */
  const COULEURS = { bleu: ["#2b5c9c", "bleue"], rouge: ["#a8342a", "rouge"], jaune: ["#836400", "jaune"], vert: ["#2a6b43", "verte"] };
  const ECH = 25, CX = 600, CY = 250, FIN = { O: 10.2, N: 9.4, E: 10.2, S: 9.4 };
  /* point à la distance r dans la direction « angle » (quarts de tour) */
  const au = (angle, r) => [CX - Math.cos(angle * Math.PI / 2) * r * ECH, CY - Math.sin(angle * Math.PI / 2) * r * ECH];
  function texte(g, t, x, y, taille, couleur, gras = true) {
    g.fillStyle = couleur; g.font = `${gras ? "bold " : ""}${taille}px Luciole, system-ui, sans-serif`;
    g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(t, x, y);
  }
  function carre(g, x, y, c, l, h) {
    const [teinte, nom] = COULEURS[c.c];
    g.fillStyle = teinte; g.fillRect(x - l / 2, y - h / 2, l, h);
    texte(g, c.l, x, y - h * .14, h * .52, "#fff");
    texte(g, nom, x, y + h * .3, h * .26, "#fff", false);
  }
  function dessin2D(g, vue, t) {
    g.fillStyle = t.fond; g.fillRect(0, 0, 1200, 500);
    for (const [poste, dir] of Object.entries(TAPIS)) {
      const [x0, y0] = au(QUART[dir], 2.9), [x1, y1] = au(QUART[dir], FIN[dir]);
      g.strokeStyle = poste === "entree" ? "#e0a81e" : t.sol; g.lineWidth = 52;
      g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
    }
    for (const o of vue.caisses) carre(g, ...au(QUART[o.dir], o.r), o.c, 40, 40);
    g.beginPath(); g.arc(CX, CY, 56, 0, Math.PI * 2); g.fillStyle = t.acier; g.fill();
    const [px, py] = au(vue.angle, PRISE);
    g.strokeStyle = "#e8860f"; g.lineWidth = 18; g.lineCap = "round";
    g.beginPath(); g.moveTo(CX, CY); g.lineTo(px, py); g.stroke(); g.lineCap = "butt";
    g.beginPath(); g.arc(CX, CY, 17, 0, Math.PI * 2); g.fillStyle = "#e8860f"; g.fill();
    /* La pince se resserre (carré plus petit) quand elle descend */
    const cote = 58 - 10 * vue.bas;
    if (vue.main) carre(g, px, py, vue.main, cote - 10, cote - 10);
    g.strokeStyle = "#e8860f"; g.lineWidth = 6; g.strokeRect(px - cote / 2, py - cote / 2, cote, cote);
    texte(g, "ENTRÉE · OUEST", CX - 340, CY + 48, 20, t.texte);
    texte(g, "EST", CX + 340, CY + 48, 20, t.texte);
    texte(g, "NORD", CX + 84, CY - 200, 20, t.texte);
    texte(g, "SUD", CX + 84, CY + 200, 20, t.texte);
  }

  /* Vignette « Objectif » (600 x 255) : une ligne par tapis de sortie, première arrivée à gauche */
  const SORTIES = [["N", "NORD"], ["E", "EST"], ["S", "SUD"]];
  function objectif(g, cas, t) {
    g.fillStyle = t.fond; g.fillRect(0, 0, 600, 255);
    SORTIES.forEach(([k, nom], i) => {
      const y = 44 + i * 74;
      texte(g, nom, 78, y, 24, t.texte);
      g.fillStyle = t.sol; g.fillRect(160, y + 30, 424, 4);
      if (!cas.objectif[k].length) texte(g, "rien", 196, y, 20, t.texte, false);
      cas.objectif[k].forEach((c, j) => carre(g, 192 + j * 70, y, c, 62, 54));
    });
  }

  /* ---------- Relevé et messages ---------- */
  const VERS = { O: "vers l'ouest (l'entrée)", N: "vers le nord", E: "vers l'est", S: "vers le sud" };
  const COURT = { O: "ouest", N: "nord", E: "est", S: "sud" };
  const releve = (e) => [["bras face à", COURT[e.dir]], ["caisse tenue", e.main ? e.main.l : "aucune"],
    ["livrées", SORTIES.map(([k, nom]) => nom.toLowerCase() + " : " + (e.piles[k].map((c) => c.l).join(" ") || "—")).join("   ")]];

  window.KitPivot = {
    prefixe: "pivot_", moteur: M, compiler, etatDepart, fixe, image, libelle, dessin2D, objectif, releve,
    attente: (n) => (n.hasard ? "Les caisses et l'orientation du bras au départ sont tirées au hasard. Ton programme est aussi vérifié sur d'autres départs."
      : "Le bras ne démarre pas toujours tourné du même côté : ton programme est vérifié depuis ses 4 orientations."),
    enCours: (p) => `Au départ, le bras est tourné ${VERS[p]}.`,
    defaut: (bonne, mauvaise) => `Ton programme réussit quand le bras démarre tourné ${VERS[bonne]}, mais pas quand il démarre tourné ${VERS[mauvaise]}. Place-le toi-même avant d'agir.`,
    echec: (motif, e) => (motif === "pince" ? `la pince tient encore la caisse ${e.main.l}.`
      : e.piles.entree.length ? "il reste des caisses à l'entrée." : "les tapis de sortie ne correspondent pas à l'objectif."),
    verifie: " · vérifié depuis les 4 orientations du bras et, si les caisses changent, sur plusieurs arrivages",
    /* utilisés par le rendu 3D */
    geometrie: { PRISE, QUART },
  };
}

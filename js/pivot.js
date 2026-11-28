/* Bras pivotant, sur place et sur rail : blocs, géométrie, dessin 2D, objectif et textes. L'interface
   commune est dans manutention.js ; les règles sont dans pivot-moteur.js. */
{
  const B = window.Blockly;

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
    /* Rail seulement */
    { type: "pivot_glisser", message0: "glisser d'un cran vers %1", args0: [
      { type: "field_dropdown", name: "S", options: [["l'est →", "E"], ["l'ouest ←", "O"]] }], ...lien, style: "mouvement",
      tooltip: "Le bras avance sur le rail en gardant son orientation." },
    { type: "pivot_jusquarail", message0: "répéter jusqu'à être %1 %2 %3", args0: [
      { type: "field_dropdown", name: "BUT", options: [["face à l'ouest", "ouest"], ["au bout ouest du rail", "bout"]] },
      { type: "input_dummy" }, corps("FAIRE")], ...lien, style: "tantque",
      tooltip: "Vérifie avant chaque tour : si c'est déjà le cas, rien n'est fait." },
    { type: "pivot_tantque", message0: "répéter tant qu'il y a une caisse ici %1 %2",
      args0: [{ type: "input_dummy" }, corps("FAIRE")], ...lien, style: "tantque" },
    { type: "pivot_sicaisse", message0: "s'il y a une caisse ici %1 %2", args0: [{ type: "input_dummy" }, corps("FAIRE")],
      message1: "sinon %1", args1: [corps("SINON")], ...lien, style: "condition" },
    { type: "pivot_si", message0: "si la caisse tenue est %1 %2 %3", args0: [
      { type: "field_dropdown", name: "C", options: [["rouge", "rouge"], ["bleue", "bleu"], ["jaune", "jaune"], ["verte", "vert"]] },
      { type: "input_dummy" }, corps("FAIRE")], message1: "sinon %1", args1: [corps("SINON")], ...lien, style: "condition" },
  ]);
  /* Explications au survol des blocs (débutants) */
  window.Atelier.expliquer({
    pivot_tourner: "Le bras pivote d'un quart de tour, vu de dessus. À droite : ouest, nord, est, sud.",
    pivot_saisir: "La pince attrape la caisse du tapis **en face du bras**. Une seule à la fois.",
    pivot_poser: "La pince pose la caisse qu'elle tient sur le tapis **en face du bras**.",
    pivot_repeter: window.Atelier.TEXTE_REPETER,
    pivot_jusqua: "Répète les blocs rangés **DEDANS** jusqu'à ce que le bras soit face à l'ouest. Vérifié avant chaque tour : si c'est déjà le cas, rien n'est fait.",
    pivot_glisser: "Le bras avance d'un cran sur le rail, en gardant son orientation.",
    pivot_jusquarail: "Répète les blocs rangés **DEDANS** jusqu'à ce que ce soit le cas. Vérifié avant chaque tour : si c'est déjà le cas, rien n'est fait.",
    pivot_tantque: "Répète les blocs rangés **DEDANS** tant qu'il y a une caisse du côté où regarde le bras. La question est posée avant chaque tour.",
    pivot_sicaisse: "Pose la question **UNE seule fois** : si la réponse est oui, fait les blocs du haut ; sinon, ceux de « sinon ».",
    pivot_si: "Regarde la couleur de la caisse tenue, **une seule fois** : si c'est celle-là, fait les blocs du haut ; sinon, ceux de « sinon ».",
  });

  function compiler(b) {
    const out = [];
    for (; b; b = b.getNextBlock()) {
      if (!b.isEnabled()) continue;
      const t = b.type.slice("pivot_".length), c = { t, id: b.id };
      const dedans = (nom) => compiler(b.getInputTargetBlock(nom));
      if (t === "tourner" || t === "glisser") c.s = b.getFieldValue("S");
      else if (t === "jusquarail") { c.t = "jusqua"; c.but = b.getFieldValue("BUT"); c.corps = dedans("FAIRE"); }
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
  /* Distance au pivot de la place de prise ou de dépose, écart entre deux caisses, entre deux crans */
  const PRISE = 4.1, PAS = 1.7, CRAN = 5.2;

  /* Postes de chaque machine. « fin » : longueur du tapis ; « visible » : rang au-delà duquel une
     caisse est sous le capot (le tapis sud du pivot est court : un capot gênerait) ; « pile » : les
     caisses sont les unes sur les autres. « nom » : sur la vignette et le relevé. */
  const SUR_PLACE = {
    rail: false, milieu: 1,
    postes: {
      entree: { cran: 1, dir: "O", fin: 10.2, visible: 2.2 },
      N: { cran: 1, dir: "N", fin: 9, visible: 2.2, nom: "NORD" },
      E: { cran: 1, dir: "E", fin: 10.2, visible: 2.2, nom: "EST" },
      S: { cran: 1, dir: "S", fin: 7.4, visible: 1.2, nom: "SUD" },
    },
    sorties: ["N", "E", "S"],
  };
  const SUR_RAIL = {
    rail: true, milieu: 2,
    postes: {
      entree: { cran: 1, dir: "O", fin: 10.4, visible: 2.2 },
      A: { cran: 1, dir: "N", fin: 9.4, visible: 2.2, nom: "A" },
      B: { cran: 2, dir: "N", fin: 9.4, visible: 2.2, nom: "B" },
      C: { cran: 3, dir: "N", fin: 9.4, visible: 2.2, nom: "C" },
      D: { cran: 3, dir: "E", fin: 10.4, visible: 2.2, nom: "D" },
      attente: { cran: 2, dir: "S", pile: true },
    },
    sorties: ["A", "B", "C", "D"],
  };

  const COULEURS = { bleu: ["#2b5c9c", "bleue"], rouge: ["#a8342a", "rouge"], jaune: ["#836400", "jaune"], vert: ["#2a6b43", "verte"] };
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

  const COTE = { D: "droite", G: "gauche" }, VERS_RAIL = { E: "l'est", O: "l'ouest" };
  const VERS = { O: "vers l'ouest (l'entrée)", N: "vers le nord", E: "vers l'est", S: "vers le sud" };
  const COURT = { O: "ouest", N: "nord", E: "est", S: "sud" };
  const libelle = (ev) => (ev.t === "tourner" ? `tourner à ${COTE[ev.instruction.s]}`
    : ev.t === "glisser" ? `glisser vers ${VERS_RAIL[ev.instruction.s]}` : `${ev.t} la caisse`);
  const doux = (v) => v * v * (3 - 2 * v);

  /* La même interface pour les deux machines ; « M » : le moteur, « G » : les postes */
  function fabriquer(M, G, messages) {
    const posteVise = (e) => Object.keys(G.postes).find((k) => G.postes[k].cran === e.cran && G.postes[k].dir === e.dir);

    /* Place de chaque caisse ; « avance » : décalage (en caisses) de chaque tapis */
    function places(piles, avance) {
      const out = [];
      for (const [poste, p] of Object.entries(G.postes)) {
        piles[poste].forEach((c, i) => {
          if (p.pile) { out.push({ c, poste, cran: p.cran, dir: p.dir, r: PRISE, niveau: i }); return; }
          const rang = (poste === "entree" ? i : piles[poste].length - 1 - i) + (avance[poste] || 0);
          if (rang <= p.visible) out.push({ c, poste, cran: p.cran, dir: p.dir, r: PRISE + rang * PAS, niveau: 0 });
        });
      }
      return out;
    }

    /* x : cran du bras (nombre à virgule pendant un glissement) ; bas : 0 = pince levée, 1 = en bas ;
       cible : étage visé à la descente ; pile : hauteur de la pile d'attente */
    const vueDe = (etat, avance = {}) => ({ pivot: true, rail: G.rail, angle: QUART[etat.dir], x: etat.cran, bas: 0, cible: 0,
      pile: etat.piles.attente ? etat.piles.attente.length : 0, main: etat.main,
      caisses: places(etat.piles, avance), avance, instruction: "en attente" });
    const fixe = (etat) => vueDe(etat);

    /* Image intermédiaire entre l'état « avant » et l'événement ; u va de 0 à 1 */
    function image(avant, ev, u) {
      if (ev.t === "tourner") {
        return { ...vueDe(avant), angle: QUART[avant.dir] + (ev.instruction.s === "D" ? 1 : -1) * doux(u), instruction: libelle(ev) };
      }
      if (ev.t === "glisser") {
        return { ...vueDe(avant), x: avant.cran + (ev.etat.cran - avant.cran) * doux(u), instruction: libelle(ev) };
      }
      const poste = posteVise(avant), pile = !!G.postes[poste].pile;
      const etat = u < 0.5 ? avant : ev.etat, avance = {};
      /* La sortie fait de la place pendant la descente ; l'entrée avance pendant la remontée */
      if (!pile && ev.t === "poser" && u < 0.5) avance[poste] = doux(u * 2);
      if (!pile && ev.t === "saisir" && u >= 0.5) avance[poste] = 1 - doux((u - 0.5) * 2);
      const cible = pile ? avant.piles[poste].length - (ev.t === "saisir" ? 1 : 0) : 0;
      return { ...vueDe(etat, avance), cible, bas: doux(u < 0.5 ? u * 2 : (1 - u) * 2), instruction: libelle(ev) };
    }

    const etatDepart = (cas, position) => ({ ...M.lire(position), main: null,
      piles: Object.fromEntries(Object.keys(G.postes).map((k) => [k, [...(cas.depart[k] || [])]])) });

    /* ---------- Dessin 2D de secours : le poste vu de dessus (toile logique 1200 x 500) ---------- */
    const ECH = 25, CY = 258;
    const centre = (cran) => 600 + (cran - G.milieu) * CRAN * ECH;
    /* point à la distance r du cran, dans la direction « angle » (quarts de tour) */
    const au = (cran, angle, r) => [centre(cran) - Math.cos(angle * Math.PI / 2) * r * ECH, CY - Math.sin(angle * Math.PI / 2) * r * ECH];
    function dessin2D(g, vue, t) {
      g.fillStyle = t.fond; g.fillRect(0, 0, 1200, 500);
      for (const [poste, p] of Object.entries(G.postes)) {
        const [x0, y0] = au(p.cran, QUART[p.dir], 2.9), [x1, y1] = au(p.cran, QUART[p.dir], p.fin || 9.4);
        g.strokeStyle = poste === "entree" ? "#e0a81e" : t.sol; g.lineWidth = p.pile ? 12 : 52;
        g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
      }
      if (G.rail) {
        g.fillStyle = t.acier; g.fillRect(centre(1) - 40, CY - 8, centre(3) - centre(1) + 80, 16);
        for (const c of [1, 2, 3]) texte(g, String(c), centre(c) - (c === 2 ? 44 : 0), CY + 46, 24, t.texte);
      }
      for (const o of vue.caisses) {
        /* la pile est dépliée : le dessus à la place de prise, les autres derrière */
        const d = G.postes[o.poste].pile ? PRISE + (vue.pile - 1 - o.niveau) * PAS : o.r;
        carre(g, ...au(o.cran, QUART[o.dir], d), o.c, 40, 40);
      }
      const x = centre(vue.x);
      g.beginPath(); g.arc(x, CY, G.rail ? 36 : 56, 0, Math.PI * 2); g.fillStyle = t.acier; g.fill();
      const [px, py] = au(vue.x, vue.angle, PRISE);
      g.strokeStyle = "#e8860f"; g.lineWidth = 18; g.lineCap = "round";
      g.beginPath(); g.moveTo(x, CY); g.lineTo(px, py); g.stroke(); g.lineCap = "butt";
      g.beginPath(); g.arc(x, CY, 17, 0, Math.PI * 2); g.fillStyle = "#e8860f"; g.fill();
      /* La pince se resserre (carré plus petit) quand elle descend */
      const cote = 58 - 10 * vue.bas;
      if (vue.main) carre(g, px, py, vue.main, cote - 10, cote - 10);
      g.strokeStyle = "#e8860f"; g.lineWidth = 6; g.strokeRect(px - cote / 2, py - cote / 2, cote, cote);
      if (G.rail) {
        texte(g, "ENTRÉE", centre(1) - 200, CY + 46, 20, t.texte);
        for (const [nom, c] of [["A", 1], ["B", 2], ["C", 3]]) texte(g, nom, centre(c) + 48, CY - 190, 26, t.texte);
        texte(g, "D", centre(3) + 200, CY + 46, 26, t.texte);
        texte(g, "ATTENTE (pile)", centre(2) + 120, CY + 170, 20, t.texte);
      } else {
        texte(g, "ENTRÉE · OUEST", x - 340, CY + 48, 20, t.texte);
        texte(g, "EST", x + 340, CY + 48, 20, t.texte);
        texte(g, "NORD", x + 84, CY - 200, 20, t.texte);
        texte(g, "SUD", x + 84, CY + 200, 20, t.texte);
      }
    }

    /* Vignette « Objectif » (600 x 255) : une ligne par tapis de sortie, première arrivée à gauche */
    function objectif(g, cas, t) {
      g.fillStyle = t.fond; g.fillRect(0, 0, 600, 255);
      const pas = G.sorties.length > 3 ? 62 : 74, haut = G.sorties.length > 3 ? 48 : 54;
      G.sorties.forEach((k, i) => {
        const y = (G.sorties.length > 3 ? 32 : 44) + i * pas;
        texte(g, G.postes[k].nom, 78, y, 24, t.texte);
        g.fillStyle = t.sol; g.fillRect(160, y + haut / 2 + 3, 424, 4);
        if (!cas.objectif[k].length) texte(g, "rien", 196, y, 20, t.texte, false);
        cas.objectif[k].forEach((c, j) => carre(g, 192 + j * 70, y, c, 62, haut));
      });
    }

    const numeros = (l) => l.map((c) => c.l).join(" ") || "—";
    const releve = (e) => [...(G.rail ? [["cran", e.cran]] : []), ["bras face à", COURT[e.dir]],
      ["caisse tenue", e.main ? e.main.l : "aucune"], ...(G.rail ? [["en attente", numeros(e.piles.attente)]] : []),
      ["livrées", G.sorties.map((k) => G.postes[k].nom.toLowerCase().replace(/^[a-d]$/, (x) => x.toUpperCase()) + " : " + numeros(e.piles[k])).join("   ")]];

    /* « tourné vers le nord » ou « au cran 2, tourné vers le nord » */
    const decrire = (position) => {
      const { cran, dir } = M.lire(position);
      return `${G.rail ? `au cran ${cran}, ` : ""}tourné ${VERS[dir]}`;
    };

    return {
      prefixe: "pivot_", moteur: M, compiler, etatDepart, fixe, image, libelle, dessin2D, objectif, releve,
      attente: (n) => (n.hasard ? messages.hasard : messages.fixe),
      enCours: (p) => `Au départ, le bras est ${decrire(p)}.`,
      defaut: (bonne, mauvaise) => `Ton programme réussit quand le bras démarre ${decrire(bonne)}, mais pas quand il démarre ${decrire(mauvaise)}. Place-le toi-même avant d'agir.`,
      echec: (motif, e) => (motif === "pince" ? `la pince tient encore la caisse ${e.main.l}.`
        : e.piles.entree.length ? "il reste des caisses à l'entrée."
          : e.piles.attente && e.piles.attente.length ? "il reste des caisses en attente."
            : "les tapis de sortie ne correspondent pas à l'objectif."),
      verifie: messages.verifie,
      /* utilisé par le rendu 3D */
      geometrie: { PRISE, PAS, CRAN, rail: G.rail, milieu: G.milieu, postes: G.postes },
    };
  }

  window.KitPivot = fabriquer(window.Pivot, SUR_PLACE, {
    hasard: "Les caisses et l'orientation du bras au départ sont tirées au hasard. Ton programme est aussi vérifié sur d'autres départs.",
    fixe: "Le bras ne démarre pas toujours tourné du même côté : ton programme est vérifié depuis ses 4 orientations.",
    verifie: " · vérifié depuis les 4 orientations du bras et, si les caisses changent, sur plusieurs arrivages",
  });
  window.KitRail = fabriquer(window.PivotRail, SUR_RAIL, {
    hasard: "Les caisses, le cran et l'orientation du bras au départ sont tirés au hasard. Ton programme est aussi vérifié sur d'autres départs.",
    fixe: "Le bras ne démarre pas toujours au même cran ni tourné du même côté : ton programme est vérifié depuis ses 12 départs.",
    verifie: " · vérifié depuis les 12 départs du bras et, si les caisses changent, sur plusieurs arrivages",
  });
}

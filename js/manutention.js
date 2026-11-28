/* Atelier Manutention : blocs, scène et verdict. Les règles sont dans manutention-moteur.js. */
{
  const B = window.Blockly, A = window.Atelier, M = window.Manutention, memo = A.memo;
  /* Niveaux 1 à 12 : bras sur rail ; 13 à 18 : centre de tri (tri.js) ; 19 à 23 : bras pivotant ;
     24 à 27 : bras pivotant sur rail (pivot.js) */
  /* 28 à 34 : bras sur rail avec des variables (groupe « Variables », manutention-moteur.js) */
  const NIVEAUX = [...M.NIVEAUX, ...window.Tri.NIVEAUX, ...window.Pivot.NIVEAUX, ...window.PivotRail.NIVEAUX, ...M.VARIABLES];
  /* La machine d'un niveau, d'après son groupe */
  const machine = (n) => ({ Convoyeurs: "tri", Pivot: "pivot", "Pivot + rail": "rail" })[n.groupe] || "bras";
  const $ = (id) => document.getElementById(id);

  /* ---------- Blocs ---------- */
  const lien = { previousStatement: null, nextStatement: null };
  const nombre = { type: "field_number", name: "N", value: 3, min: 0, max: 100, precision: 1 };
  const corps = (name) => ({ type: "input_statement", name });

  /* Liste des variables : celles du niveau ouvert. Dans un espace caché (PDF des solutions d'autres
     niveaux), toutes celles de l'atelier, pour que chaque nom reste valable. */
  const TOUTES_VARIABLES = [...new Set(M.VARIABLES.flatMap((n) => n.variables))];
  function optionsVariables() {
    const bloc = this && this.getSourceBlock && this.getSourceBlock();
    const visible = bloc && (bloc.workspace === ws || bloc.workspace === ws.getFlyout().getWorkspace());
    const ici = niv.variables || [];
    const noms = visible && ici.length ? ici : [...ici, ...TOUTES_VARIABLES.filter((v) => !ici.includes(v))];
    return noms.map((v) => [v, v]);
  }
  class ChampVariable extends B.FieldDropdown {
    constructor() { super(optionsVariables); }
    static fromJson() { return new ChampVariable(); }
  }
  B.fieldRegistry.register("field_variable_cody", ChampVariable);
  const variable = { type: "field_variable_cody", name: "V" }, autre = { type: "field_variable_cody", name: "W" };
  const valeur = (v, min = 0) => ({ type: "field_number", name: "N", value: v, min, max: 100, precision: 1 });
  const comparaison = { type: "field_dropdown", name: "OP", options: [[">", "gt"], ["<", "lt"], ["=", "eq"], ["≠", "ne"]] };
  B.defineBlocksWithJsonArray([
    { type: "manut_mettre", message0: "mettre %1 à %2", args0: [variable, valeur(0)], ...lien, style: "variable",
      tooltip: "Donne une valeur à la variable." },
    { type: "manut_ajouter", message0: "ajouter %1 à %2", args0: [valeur(1, 1), variable], ...lien, style: "variable",
      tooltip: "Augmente la variable (incrémenter)." },
    { type: "manut_retirer", message0: "retirer %1 à %2", args0: [valeur(1, 1), variable], ...lien, style: "variable",
      tooltip: "Diminue la variable (décrémenter)." },
    { type: "manut_tantquevar", message0: "répéter tant que %1 %2 %3 %4 %5",
      args0: [variable, comparaison, valeur(0), { type: "input_dummy" }, corps("FAIRE")], ...lien, style: "tantque",
      tooltip: "Répète tant que la comparaison est vraie (elle est testée avant chaque tour)." },
    { type: "manut_sivar", message0: "si %1 %2 %3 %4 %5",
      args0: [variable, comparaison, valeur(0), { type: "input_dummy" }, corps("FAIRE")],
      message1: "sinon %1", args1: [corps("SINON")], ...lien, style: "condition" },
    { type: "manut_repetervar", message0: "répéter %1 fois %2 %3",
      args0: [variable, { type: "input_dummy" }, corps("FAIRE")], ...lien, style: "boucle",
      tooltip: "Répète autant de fois que la valeur de la variable (lue au début de la boucle)." },
    { type: "manut_tantquevar2", message0: "répéter tant que %1 %2 %3 %4 %5",
      args0: [variable, comparaison, autre, { type: "input_dummy" }, corps("FAIRE")], ...lien, style: "tantque",
      tooltip: "Répète tant que la comparaison des deux variables est vraie." },
    { type: "manut_sivar2", message0: "si %1 %2 %3 %4 %5",
      args0: [variable, comparaison, autre, { type: "input_dummy" }, corps("FAIRE")],
      message1: "sinon %1", args1: [corps("SINON")], ...lien, style: "condition" },
  ]);
  B.defineBlocksWithJsonArray([
    { type: "manut_depart", message0: "DÉPART", nextStatement: null, style: "depart", hat: "cap",
      tooltip: "Le programme commence ici. Accroche tes blocs dessous." },
    { type: "manut_aller", message0: "aller à %1", args0: [{ type: "field_dropdown", name: "P",
      options: [["l'emplacement 1", "1"], ["l'emplacement 2", "2"], ["l'emplacement 3", "3"], ["la sortie", "S"], ["l'entrée", "E"]] }],
      ...lien, style: "mouvement" },
    { type: "manut_saisir", message0: "saisir la caisse", ...lien, style: "stylo" },
    { type: "manut_poser", message0: "poser la caisse", ...lien, style: "stylo" },
    { type: "manut_repeter", message0: "répéter %1 fois %2 %3",
      args0: [nombre, { type: "input_dummy" }, corps("FAIRE")], ...lien, style: "boucle" },
    { type: "manut_tantque", message0: "répéter tant qu'il y a une caisse ici %1 %2",
      args0: [{ type: "input_dummy" }, corps("FAIRE")], ...lien, style: "tantque" },
    { type: "manut_sicaisse", message0: "s'il y a une caisse ici %1 %2",
      args0: [{ type: "input_dummy" }, corps("FAIRE")],
      message1: "sinon %1", args1: [corps("SINON")], ...lien, style: "condition" },
    { type: "manut_si", message0: "si la caisse tenue est %1 %2 %3",
      args0: [{ type: "field_dropdown", name: "C", options: [["rouge", "rouge"], ["bleue", "bleu"], ["jaune", "jaune"], ["verte", "vert"]] },
        { type: "input_dummy" }, corps("FAIRE")],
      message1: "sinon %1", args1: [corps("SINON")], ...lien, style: "condition" },
  ]);
  /* Explications au survol des blocs (débutants) */
  A.expliquer({
    manut_depart: "Le programme commence ici. Accroche tes blocs **en dessous**, dans l'ordre : ils sont joués de haut en bas.",
    manut_aller: "Le bras se déplace jusqu'au poste choisi.",
    manut_saisir: "La pince attrape une caisse **là où est le bras** : celle du dessus d'une pile, ou la première de l'entrée. Une seule à la fois.",
    manut_poser: "La pince pose la caisse qu'elle tient, **là où est le bras** (sur le dessus de la pile).",
    manut_repeter: A.TEXTE_REPETER,
    manut_tantque: "Répète les blocs rangés **DEDANS** tant qu'il reste une caisse là où est le bras. La question est posée avant chaque tour.",
    manut_sicaisse: "Pose la question **UNE seule fois** : si la réponse est oui, fait les blocs du haut ; sinon, ceux de « sinon ».",
    manut_si: "Regarde la couleur de la caisse tenue, **une seule fois** : si c'est celle-là, fait les blocs du haut ; sinon, ceux de « sinon ».",
    manut_mettre: "Range ce nombre dans la variable (l'ancienne valeur est effacée). À faire **au début**.",
    manut_ajouter: "Ajoute ce nombre à la variable : +1, comme quand on compte sur ses doigts.",
    manut_retirer: "Enlève ce nombre à la variable : -1, comme un compte à rebours.",
    manut_tantquevar: "Répète les blocs rangés **DEDANS** tant que la comparaison est vraie. Elle est vérifiée avant chaque tour.",
    manut_tantquevar2: "Répète les blocs rangés **DEDANS** tant que la comparaison des deux variables est vraie. Elle est vérifiée avant chaque tour.",
    manut_sivar: "Pose la question **UNE seule fois** : si la réponse est oui, fait les blocs du haut ; sinon, ceux de « sinon ».",
    manut_sivar2: "Pose la question **UNE seule fois** : si la réponse est oui, fait les blocs du haut ; sinon, ceux de « sinon ».",
    manut_repetervar: "Répète les blocs rangés **DEDANS** autant de fois que la valeur de la variable (lue au début de la boucle).",
  });

  /* Comparaison de deux variables : la boîte propose d'emblée les deux premières du niveau */
  const boiteOutils = (noms, prefixe = "manut_", variables = []) => ({
    kind: "flyoutToolbox",
    contents: noms.map((n) => ({ kind: "block", type: prefixe + n,
      ...(n.endsWith("var2") && variables.length > 1 ? { fields: { V: variables[0], W: variables[1] } } : {}) })),
  });
  const ws = A.injecter("blockly", boiteOutils(NIVEAUX[0].blocs), 1 / 1.2); /* un cran de « zoom moins » : choix de l'enseignant */
  const indice = A.boutonIndice($("indice"));
  const debut = () => ws.getTopBlocks(false).find((b) => b.type === "manut_depart");

  /* La partie « sinon » du bloc conditionnel prend un ton plus foncé. Un bloc Blockly n'a qu'une
     couleur : on superpose une copie de son contour, découpée à partir de la branche « sinon ». */
  const SVG = "http://www.w3.org/2000/svg";
  let numeroDecoupe = 0;
  function teinterSinon(bloc) {
    const racine = bloc.getSvgRoot(), entree = bloc.getInput("SINON");
    const contour = racine && racine.querySelector(":scope > .blocklyPath");
    if (!contour || !entree || !entree.connection) return;
    let copie = racine.querySelector(":scope > .cody-sinon");
    if (!copie) {
      const id = "cody-sinon-" + ++numeroDecoupe;
      const decoupe = document.createElementNS(SVG, "clipPath");
      decoupe.id = id;
      decoupe.append(document.createElementNS(SVG, "rect"));
      copie = document.createElementNS(SVG, "path");
      copie.setAttribute("class", "cody-sinon");
      copie.setAttribute("clip-path", `url(#${id})`);
      contour.after(decoupe, copie);
    }
    copie.setAttribute("d", contour.getAttribute("d") || "");
    const zone = copie.previousElementSibling.firstElementChild;
    for (const [nom, v] of Object.entries({ x: -20, y: entree.connection.getOffsetInBlock().y - 6, width: 3000, height: 3000 })) {
      zone.setAttribute(nom, v);
    }
  }
  /* Après chaque redessin de Blockly, y compris dans la boîte à outils */
  function suivreSinon(espace) {
    const maj = () => B.renderManagement.finishQueuedRenders().then(() => {
      for (const b of espace.getAllBlocks(false)) if (b.getInput("SINON")) teinterSinon(b);
    });
    espace.addChangeListener(maj);
    return maj;
  }
  const teinterProgramme = suivreSinon(ws);
  const teinterBoite = suivreSinon(ws.getFlyout().getWorkspace());

  /* Blocs -> instructions du moteur */
  function compiler(b) {
    const out = [];
    for (; b; b = b.getNextBlock()) {
      if (!b.isEnabled()) continue;
      const t = b.type.slice("manut_".length), c = { t, id: b.id };
      const dedans = (nom) => compiler(b.getInputTargetBlock(nom));
      if (t === "aller") c.p = b.getFieldValue("P");
      else if (t === "mettre" || t === "ajouter" || t === "retirer") { c.v = b.getFieldValue("V"); c.n = +b.getFieldValue("N"); }
      else if (t === "tantquevar") { c.v = b.getFieldValue("V"); c.op = b.getFieldValue("OP"); c.n = +b.getFieldValue("N"); c.corps = dedans("FAIRE"); }
      else if (t === "sivar") {
        c.v = b.getFieldValue("V"); c.op = b.getFieldValue("OP"); c.n = +b.getFieldValue("N");
        c.alors = dedans("FAIRE"); c.sinon = dedans("SINON");
      }
      else if (t === "repetervar") { c.v = b.getFieldValue("V"); c.corps = dedans("FAIRE"); }
      else if (t === "tantquevar2") { c.v = b.getFieldValue("V"); c.op = b.getFieldValue("OP"); c.w = b.getFieldValue("W"); c.corps = dedans("FAIRE"); }
      else if (t === "sivar2") {
        c.v = b.getFieldValue("V"); c.op = b.getFieldValue("OP"); c.w = b.getFieldValue("W");
        c.alors = dedans("FAIRE"); c.sinon = dedans("SINON");
      }
      else if (t === "repeter") { c.n = +b.getFieldValue("N"); c.corps = dedans("FAIRE"); }
      else if (t === "tantque") c.corps = dedans("FAIRE");
      else if (t === "si" || t === "sicaisse") {
        if (t === "si") c.c = b.getFieldValue("C");
        c.alors = dedans("FAIRE"); c.sinon = dedans("SINON");
      }
      out.push(c);
    }
    return out;
  }
  const programme = () => { const d = debut(); return kit.compiler(d && d.getNextBlock()); };

  /* ---------- Dessin ---------- */
  const COULEURS = { bleu: ["#2b5c9c", "bleue"], rouge: ["#a8342a", "rouge"], jaune: ["#836400", "jaune"], vert: ["#2a6b43", "verte"] };
  const PALETTE = {
    clair: { fond: "#ffffff", trame: "rgba(40,70,100,.07)", acier: "#5c6b80", sol: "#8995a8", texte: "#36404f", zone: "#eef5f6", repere: "#0e6b78" },
    sombre: { fond: "#121821", trame: "rgba(170,200,235,.06)", acier: "#8d9db4", sol: "#566478", texte: "#c9d4e3", zone: "#162630", repere: "#5fc8d4" },
  };
  const palette = () => PALETTE[A.sombre.matches ? "sombre" : "clair"];
  /* Repère du dessin : 1200 x 500. E = tapis d'entrée, S = tapis de sortie. */
  const CENTRE = { E: 320, 1: 460, 2: 600, 3: 740, S: 880 };
  const SOL = 436, LARG = 116, HAUT = 68, REPOS = 86, PAS_TAPIS = 125;
  const NOM = { E: "entrée", 1: "emplacement 1", 2: "emplacement 2", 3: "emplacement 3", S: "sortie" };

  function rect(g, x, y, w, h, c) { g.fillStyle = c; g.fillRect(x, y, w, h); }
  function ecrire(g, texte, x, y, taille, couleur, gras = true) {
    g.fillStyle = couleur; g.font = `${gras ? "bold " : ""}${taille}px Luciole, system-ui, sans-serif`;
    g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(texte, x, y);
  }
  /* Une caisse porte toujours son numéro et le nom de sa couleur */
  function caisse(g, x, y, c) {
    const [teinte, nom] = COULEURS[c.c];
    rect(g, x - LARG / 2, y + 1, LARG, HAUT - 2, teinte);
    g.strokeStyle = "rgba(255,255,255,.35)"; g.lineWidth = 2;
    g.strokeRect(x - LARG / 2 + 5, y + 6, LARG - 10, HAUT - 12);
    ecrire(g, c.l, x, y + 28, 32, "#fff");
    ecrire(g, nom, x, y + 52, 15, "#fff", false);
  }
  /* Place des caisses sur un tapis : 0 = devant la pince. Au-delà de 2, elles sont sous le capot. */
  function surTapis(p, tapis) {
    const E = p.E.map((c, i) => ({ c, x: CENTRE.E - (i + tapis.E) * PAS_TAPIS, rang: i + tapis.E }));
    const S = p.S.map((c, i) => {
      const rang = p.S.length - 1 - i + tapis.S;
      return { c, x: CENTRE.S + rang * PAS_TAPIS, rang };
    });
    return [...E, ...S].filter((o) => o.rang <= 2.2);
  }
  function postes(g, p, tapis) {
    const t = palette();
    for (const [x0, x1] of [[0, CENTRE.E + 70], [CENTRE.S - 70, 1200]]) {
      rect(g, x0, SOL, x1 - x0, 14, t.acier);
      for (let x = x0 + 14; x < x1; x += 34) { g.beginPath(); g.arc(x, SOL + 7, 5, 0, Math.PI * 2); g.fillStyle = t.fond; g.fill(); }
    }
    for (const k of ["1", "2", "3"]) {
      rect(g, CENTRE[k] - 66, SOL, 132, 6, t.sol);
      p[k].forEach((c, i) => caisse(g, CENTRE[k], SOL - HAUT * (i + 1), c));
    }
    for (const o of surTapis(p, tapis)) caisse(g, o.x, SOL - HAUT, o.c);
    for (const x of [0, 1140]) { rect(g, x, SOL - 96, 60, 96, t.acier); rect(g, x, SOL - 96, 60, 10, "#e0a81e"); }
    for (const k of M.POSITIONS) {
      ecrire(g, { E: "ENTRÉE", S: "SORTIE" }[k] || k, CENTRE[k], SOL + 36, 24, t.texte);
    }
  }
  function decor(g) {
    const t = palette();
    rect(g, 0, 0, 1200, 500, t.fond);
    for (let i = 0; i <= 1200; i += 25) { rect(g, i, 0, 1, 500, t.trame); if (i <= 500) rect(g, 0, i, 1200, 1, t.trame); }
  }

  const toile = $("c-scene").getContext("2d");
  toile.setTransform(2, 0, 0, 2, 0, 0);
  /* Rendu 3D quand le poste le permet ; sinon (ou avec ?2d dans l'adresse) le dessin 2D ci-dessous */
  const C3 = window.Commun3D;

  /* vue du bras : abscisse de la pince, sa hauteur, caisse tenue, piles, avance des tapis, instruction */
  function sceneBras(vue) {
    const t = palette();
    decor(toile);
    rect(toile, 14, 22, 1172, 12, t.acier);
    for (const x of [14, 1174]) rect(toile, x, 22, 12, 470, t.acier);
    postes(toile, vue.piles, vue.tapis);
    rect(toile, vue.x - 36, 12, 72, 32, t.repere);
    for (const dx of [-22, 22]) { toile.beginPath(); toile.arc(vue.x + dx, 20, 5, 0, Math.PI * 2); toile.fillStyle = t.fond; toile.fill(); }
    rect(toile, vue.x - 3, 44, 6, vue.y - 58, t.acier);
    rect(toile, vue.x - LARG / 2 - 9, vue.y - 14, LARG + 18, 10, t.repere);
    const jeu = vue.main ? 0 : 7;
    for (const s of [-1, 1]) {
      const x = vue.x + s * (LARG / 2 + 1 + jeu);
      rect(toile, s < 0 ? x - 8 : x, vue.y - 8, 8, 40, t.repere);
      rect(toile, s < 0 ? x - 8 : x - 4, vue.y + 28, 12, 6, t.repere);
    }
    if (vue.main) caisse(toile, vue.x, vue.y, vue.main);
    if (vue.variables) {
      toile.textAlign = "left";
      toile.fillStyle = t.repere; toile.font = "bold 22px Luciole, system-ui, sans-serif";
      toile.fillText(vue.variables, 40, 70);
    }
  }
  /* Valeurs des variables du niveau, pour l'écran de la scène (« ? » : pas encore définie) */
  const valeursVariables = (etat) => (niv.variables && etat.vars
    ? niv.variables.map((v) => `${v} : ${etat.vars[v] ?? "?"}`).join(" · ") : null);
  const fixe = (etat) => ({ x: CENTRE[etat.pos], y: REPOS, main: etat.main, piles: etat.piles,
    tapis: { E: 0, S: 0 }, instruction: "en attente", decor: numNiv, variables: valeursVariables(etat) });

  /* Vignette « Objectif » : un schéma qui montre toutes les caisses attendues. Les piles à gauche ;
     la sortie comme sur le tapis : dernière livrée à gauche, première livrée à droite. */
  const vignette = $("c-objectif").getContext("2d");
  function objectifBras(g, cas) {
    const t = palette(), cible = { 1: [], 2: [], 3: [], S: [], ...cas.objectif };
    const BAS = 206;
    rect(g, 0, 0, 600, 255, t.fond);
    const petite = (x, y, c) => {
      const [teinte, nom] = COULEURS[c.c];
      rect(g, x - 26, y, 52, 44, teinte);
      ecrire(g, c.l, x, y + 17, 24, "#fff");
      ecrire(g, nom, x, y + 35, 12, "#fff", false);
    };
    ["1", "2", "3"].forEach((k, n) => {
      const x = 40 + n * 64;
      rect(g, x - 29, BAS, 58, 5, t.sol);
      ecrire(g, k, x, BAS + 26, 22, t.texte);
      cible[k].forEach((c, h) => petite(x, BAS - 45 * (h + 1), c));
    });
    rect(g, 224, 20, 2, 220, t.sol);
    rect(g, 244, BAS, 342, 5, t.sol);
    ecrire(g, "SORTIE", 415, BAS + 26, 22, t.texte);
    cible.S.forEach((c, h) => petite(272 + (cible.S.length - 1 - h) * 57, BAS - 45, c));
    if (cible.S.length > 1) {
      ecrire(g, "dernière", 272, BAS - 62, 15, t.texte, false);
      ecrire(g, "première", 272 + (cible.S.length - 1) * 57, BAS - 62, 15, t.texte, false);
    }
    /* Variables : données de l'exercice, valeurs attendues à la fin */
    const liste = (o) => Object.entries(o).map(([v, n]) => `${v} = ${n}`).join(" · ");
    const donnees = niv.donnees && cas.vars ? Object.fromEntries(niv.donnees.map((v) => [v, cas.vars[v]])) : null;
    if (donnees) ecrire(g, `Départ : ${liste(donnees)}`, 415, 36, 19, t.repere);
    if (cas.varsFin) ecrire(g, `Fin : ${liste(cas.varsFin)}`, 415, niv.donnees ? 68 : 36, 19, t.repere);
  }

  /* ---------- Animation ---------- */
  const DUREES = [0, 1100, 700, 420, 200, 0];
  /* L'élève lance lui-même l'animation et la règle : le curseur au maximum donne le résultat immédiat.
     (Windows « effets d'animation » désactivés ne doit pas masquer les mouvements du bras.) */
  const duree = () => DUREES[+$("vitesse").value];
  let niv = NIVEAUX[0], numNiv = 0, anim = null, vu = null, montre = null;

  /* État de la machine au lancement (place de la pince ou orientation des plateaux) : inconnu de
     l'élève, il change à chaque essai */
  let pince = "1";
  const tirerPince = () => {
    const autres = kit.moteur.POSITIONS.filter((p) => p !== pince);
    pince = autres[Math.floor(Math.random() * autres.length)];
  };
  /* Départ affiché : tiré au hasard aux niveaux qui le permettent, sinon le seul du niveau */
  let tirage = null;
  /* Départ affiché (caisses et état de la machine) pas encore joué : « Exécuter » le garde. Il est
     neuf à l'ouverture du niveau et après « Configuration » (l'élève a pu en chercher un précis) ;
     après une exécution, l'essai suivant en tire un autre. */
  let neuf = false;
  const tirerDepart = () => {
    if (!niv.hasard) { tirage = niv.configs[0]; return; }
    const avant = tirage && JSON.stringify(tirage.depart);
    do tirage = niv.hasard(); while (JSON.stringify(tirage.depart) === avant);
  };
  /* Un départ avec le plus grand nombre de caisses possible, couleurs au hasard : on tire un
     grand nombre de départs et on garde le plus fourni */
  const nombreCaisses = (cas) => Object.values(cas.depart).reduce((n, pile) => n + pile.length, 0);
  /* Niveaux à variables données (commande, nombre, pile1…) : le nombre de caisses de départ ne change
     pas toujours ; on prend aussi les plus grandes valeurs de ces variables (niveau 28 : nombre = 3) */
  const taille = (cas) => nombreCaisses(cas) + (niv.donnees || []).reduce((n, v) => n + ((cas.vars || {})[v] || 0), 0);
  const departMaximum = () => {
    let meilleur = niv.hasard();
    for (let i = 0; i < 300; i++) {
      const cas = niv.hasard();
      if (taille(cas) > taille(meilleur)) meilleur = cas;
    }
    return meilleur;
  };
  const LIEU = { E: "de l'entrée", 1: "de l'emplacement 1", 2: "de l'emplacement 2", 3: "de l'emplacement 3", S: "de la sortie" };

  /* Relevé sous la scène : des couples [libellé, valeur] fournis par la machine */
  function releve(etat, mouvements) {
    const cases = [...kit.releve(etat), ["mouvements", mouvements]];
    $("releve").replaceChildren(...cases.map(([nom, valeur]) => {
      const d = A.creer("div");
      const dd = A.creer("dd", "", String(valeur));
      dd.dataset.nom = nom;
      d.append(A.creer("dt", "", nom), dd);
      return d;
    }));
  }
  const etatDepart = (cas, pos) => ({ pos, main: null, piles: { 1: [], 2: [], 3: [], S: [], E: [], ...cas.depart }, vars: { ...(cas.vars || {}) } });

  function montrer(cas = tirage, pos = pince) {
    montre = cas;
    vu = kit.etatDepart(cas, pos);
    scene(kit.fixe(vu));
    dessinerObjectif(cas);
    releve(vu, 0);
  }

  const VERS = { E: "à l'entrée", 1: "à l'emplacement 1", 2: "à l'emplacement 2", 3: "à l'emplacement 3", S: "à la sortie" };
  const OPERATION = { mettre: (ev) => `${ev.v} = ${ev.etat.vars[ev.v]}`, ajouter: (ev) => `${ev.v} augmente : ${ev.etat.vars[ev.v]}`,
    retirer: (ev) => `${ev.v} diminue : ${ev.etat.vars[ev.v]}` };
  const libelle = (ev) => (ev.t === "aller" ? `aller ${VERS[ev.etat.pos]}` : OPERATION[ev.t] ? OPERATION[ev.t](ev) : `${ev.t} la caisse`);

  /* Image intermédiaire entre l'état « avant » et l'événement ; u va de 0 à 1 */
  function image(avant, ev, u) {
    const doux = (v) => v * v * (3 - 2 * v);
    if (ev.t === "aller") {
      const x = CENTRE[avant.pos] + (CENTRE[ev.etat.pos] - CENTRE[avant.pos]) * doux(u);
      return { ...fixe(avant), x, instruction: libelle(ev) };
    }
    if (OPERATION[ev.t]) return { ...fixe(u < 0.5 ? avant : ev.etat), instruction: libelle(ev) };
    const tapis = avant.pos === "E" || avant.pos === "S";
    const hauteur = tapis ? 1 : (ev.t === "saisir" ? avant.piles[avant.pos] : ev.etat.piles[ev.etat.pos]).length;
    const bas = SOL - HAUT * hauteur;
    const etat = u < 0.5 ? avant : ev.etat;
    const vue = { ...fixe(etat), y: REPOS + (bas - REPOS) * doux(u < 0.5 ? u * 2 : (1 - u) * 2), instruction: libelle(ev) };
    /* La sortie fait de la place pendant la descente ; l'entrée avance pendant la remontée */
    if (avant.pos === "S" && ev.t === "poser" && u < 0.5) vue.tapis.S = doux(u * 2);
    if (avant.pos === "E" && ev.t === "saisir" && u >= 0.5) vue.tapis.E = 1 - doux((u - 0.5) * 2);
    return vue;
  }

  /* ---------- Les quatre machines : même interface ---------- */
  const KitBras = {
    prefixe: "manut_", moteur: M, compiler, etatDepart, fixe, image, libelle, dessin2D: (g, vue) => sceneBras(vue), objectif: objectifBras,
    releve: (e) => [["pince", NOM[e.pos]], ["caisse tenue", e.main ? e.main.l : "aucune"], ["livrées", e.piles.S.map((c) => c.l).join(", ") || "aucune"],
      ...(niv.variables || []).map((v) => [v, e.vars && v in e.vars ? e.vars[v] : "?"])],
    attente: (n) => (n.hasard ? "Les caisses et la position de la pince sont tirées au hasard. Ton programme est aussi vérifié sur d'autres départs."
      : "La pince ne démarre pas toujours au même endroit : ton programme est vérifié depuis toutes ses positions."),
    enCours: (pos) => `La pince part ${LIEU[pos]}`,
    defaut: (bonne, mauvaise) => `Ton programme réussit quand la pince part ${LIEU[bonne]}, mais pas quand elle part ${LIEU[mauvaise]}. Place-la toi-même avant d'agir.`,
    echec: (motif, e, cas) => (motif === "pince" ? `la pince tient encore la caisse ${e.main.l}.`
      : motif === "variables" ? `les caisses sont bien placées, mais ${Object.entries(cas.varsFin).filter(([v, n]) => (e.vars[v] || 0) !== n)
        .map(([v, n]) => `${v} vaut ${e.vars[v] ?? 0} au lieu de ${n}`).join(" et ")}.`
      : "les piles ne correspondent pas à l'objectif."),
    verifie: " · vérifié depuis toutes les positions de la pince",
  };
  let kit = KitBras;
  function scene(vue) {
    const moteur3D = moteur(machineVue(vue));
    if (moteur3D && ecran) envoyerVue({ ...vue, decor: numNiv });
    else if (moteur3D) moteur3D.dessiner({ ...vue, decor: numNiv });
    else kit.dessin2D(toile, vue, palette());
  }
  function dessinerObjectif(cas) {
    vignette.setTransform(1, 0, 0, 1, 0, 0);
    kit.objectif(vignette, cas, palette());
  }

  function pas(t) {
    if (!anim) return;
    const ev = anim.trace[anim.i], d = duree();
    if (!ev) { terminer(); return; }
    if (anim.t0 === null) { anim.t0 = t; ws.highlightBlock(ev.id); }
    const u = d ? Math.min((t - anim.t0) / d, 1) : 1;
    /* Au plus 60 images par seconde (30 en mode léger) : un écran à 144 Hz n'en demande pas plus */
    if (u >= 1 || anim.rendu === undefined || t - anim.rendu >= C3.intervalle() - 2) {
      scene(kit.image(vu, ev, u));
      surveiller(t - anim.rendu);
      anim.rendu = t;
    }
    if (u >= 1) { vu = ev.etat; anim.i++; anim.t0 = null; releve(vu, anim.i); }
    anim.demande = requestAnimationFrame(pas);
  }

  const dire = (etat, titre, detail, note) => A.verdict($("verdict"), { etat, titre, detail, note });
  const attente = () => dire("info", "En attente", kit.attente(niv));

  function arreter() {
    A.fermerFete();
    if (anim) cancelAnimationFrame(anim.demande);
    anim = null;
    ws.highlightBlock(null);
    A.marquerErreur(ws, null);
    A.boutonExecuter($("lancer"), false);
  }
  function reinitialiser() { arreter(); montrer(); }

  /* « impose » : départ à jouer à la place d'un nouveau tirage */
  function lancer(impose) {
    if (anim) { reinitialiser(); dire("info", "Programme arrêté", ""); return; }
    reinitialiser();
    const prog = programme();
    if (!prog.length) { dire("ko", "Aucune instruction", "Accroche des blocs sous « DÉPART »."); return; }
    if (impose) { tirerPince(); tirage = impose; }
    else if (!neuf) { tirerPince(); tirerDepart(); }
    neuf = false;
    const bilan = kit.moteur.verifier(niv, prog, pince, niv.hasard ? tirage : undefined);
    /* En cas d'échec, on rejoue le départ et la position de pince qui ont échoué ;
       en cas de réussite, on part d'une position tirée au hasard. */
    const pos = bilan.reussi ? pince : bilan.pos;
    const resultat = bilan.reussi ? kit.moteur.executer(prog, tirage.depart, pos, tirage.vars) : bilan.resultat;
    pince = pos;
    /* L'échec vient d'un cas vérifié en coulisses : la scène passe sur ce départ, et on le dit */
    const autreDepart = bilan.cas !== tirage;
    tirage = bilan.cas;
    montrer();
    anim = { bilan, resultat, autreDepart, prog, trace: resultat.trace, i: 0, t0: null, demande: 0 };
    A.boutonExecuter($("lancer"), true);
    if (autreDepart) dire("alerte", "Attention : le départ a changé", `Ton programme réussit sur le premier départ, mais échoue sur celui-ci. Observe-le. ${kit.enCours(pos)}`);
    else dire("info", "Exécution en cours", kit.enCours(pos));
    if (duree()) anim.demande = requestAnimationFrame(pas);
    else terminer();
  }

  function terminer() {
    const { bilan, resultat, autreDepart, prog, trace } = anim;
    const { motif, reussi, initialisation } = bilan;
    arreter();
    vu = resultat.etat;
    scene(kit.fixe(vu));
    releve(vu, trace.length);
    if (reussi) {
      const n = kit.moteur.compter(prog), note = A.noter(n, niv.opt);
      if (note > (notes[numNiv] || 0)) { notes[numNiv] = note; memo.ecrire("manut-notes-2", notes); construireNav(); }
      const score = `${n} blocs · ${note === 3 ? "optimum atteint" : `optimum : ${niv.opt} blocs`}`;
      dire("ok", "Objectif atteint", score +
        kit.verifie + (niv.hasard && kit === KitBras ? " et sur plusieurs départs" : ""), note);
      A.feter(note, score, {
        retenter: () => $("effacer").click(),
        maximum: niv.hasard ? () => lancer(departMaximum()) : null,
        suivant: numNiv < NIVEAUX.length - 1 ? () => ouvrir(numNiv + 1) : null,
      });
      return;
    }
    const ou = autreDepart ? "Ton programme réussit sur le premier départ tiré, mais pas sur celui qui est maintenant affiché : "
      : niv.hasard ? "Sur le départ affiché : " : "";
    if (initialisation) {
      if (resultat.erreur && resultat.erreur.id) A.marquerErreur(ws, resultat.erreur.id);
      dire("ko", "Défaut d'initialisation",
        kit.defaut(bilan.reussiDepuis, bilan.pos) + (autreDepart ? " Le départ affiché a changé pour te montrer ce cas." : ""));
    } else if (motif === "erreur") {
      if (resultat.erreur.id) A.marquerErreur(ws, resultat.erreur.id);
      dire("ko", "Arrêt du programme", ou + kit.moteur.ERREURS[resultat.erreur.code]);
    } else {
      dire("ko", "Objectif non atteint", ou + kit.echec(motif, resultat.etat, bilan.cas));
    }
  }

  /* ---------- Niveaux, sauvegarde ---------- */
  /* « -2 » : les scores d'avant l'initialisation obligatoire ne valent plus */
  let notes = memo.lire("manut-notes-2", {});
  /* Le niveau 10 a changé d'exercice : son ancien score ne vaut plus */
  /* La règle d'alignement des plateaux a changé les exercices 13 à 18 */
  if (!memo.lire("manut-tri-alignement", false)) {
    for (let i = 12; i < 18; i++) delete notes[i];
    memo.ecrire("manut-notes-2", notes);
    memo.ecrire("manut-tri-alignement", true);
  }
  /* Groupe « Variables » reclassé par difficulté (27/11/2026) : « Commande en double » (ancien 35,
     indice 34) passe en tête (indice 27) ; les anciens 28 à 34 (indices 27 à 33) avancent d'un rang.
     Étoiles, programmes et niveau ouvert suivent leur exercice. */
  if (!memo.lire("manut-variables-ordre", false)) {
    const place = (i) => (i === 34 ? 27 : i >= 27 && i <= 33 ? i + 1 : i);
    const anciens = Array.from({ length: 8 }, (_, k) => memo.lire("manut-prog-" + (27 + k), null));
    anciens.forEach((prog, k) => memo.ecrire("manut-prog-" + place(27 + k), prog));
    const avant = { ...notes };
    for (let i = 27; i <= 34; i++) delete notes[i];
    for (let i = 27; i <= 34; i++) if (avant[i] !== undefined) notes[place(i)] = avant[i];
    memo.ecrire("manut-notes-2", notes);
    const ouvert = +memo.lire("manut-niveau", 0) || 0;
    memo.ecrire("manut-niveau", place(ouvert));
    memo.ecrire("manut-variables-ordre", true);
  }
  if (!memo.lire("manut-niveau10-trois-couleurs", false)) {
    delete notes[9];
    memo.ecrire("manut-notes-2", notes);
    memo.ecrire("manut-niveau10-trois-couleurs", true);
  }
  let surIntro = false;
  function construireNav() {
    A.boutonsNiveaux($("niveaux"), NIVEAUX, numNiv, notes, ouvrir);
    /* Bouton « Aide » : les explications pour débutants, dans une fenêtre, pendant les niveaux */
    const b = A.creer("button", "niv niv-intro", "Aide");
    b.type = "button";
    b.title = "Aide : les blocs, les boucles, les variables…";
    b.hidden = surIntro;
    b.addEventListener("click", () => aider());
    $("niveaux").prepend(b);
    /* Sur l'accueil, aucun niveau n'est ouvert : aucun n'est mis en avant */
    if (surIntro) {
      for (const n of $("niveaux").querySelectorAll("[aria-current]")) n.removeAttribute("aria-current");
      for (const n of $("niveaux").querySelectorAll(".menu-courant")) n.classList.remove("menu-courant");
    }
  }
  /* Affiche la page d'accueil à la place de l'atelier, ou revient à l'atelier */
  function presenter(oui) {
    if (oui) { arreter(); montrer(); attente(); }
    surIntro = oui;
    $("intro").hidden = !oui;
    document.querySelector("main.jeu").hidden = oui;
    if (!oui) memo.ecrire("manut-intro-vue", true);
    construireNav();
  }

  /* ---------- Aide : un sujet à la fois, seulement ceux utiles au niveau ouvert ---------- */
  const fenetreAide = $("aide"), ouvrirAide = A.aide(fenetreAide);
  const aider = () => ouvrirAide(niv.blocs || [], !!(niv.variables || []).length);
  $("revoir-accueil").addEventListener("click", () => { fenetreAide.close(); presenter(true); });
  let chargement = false;

  function majProgramme() {
    const prog = programme(), n = kit.moteur.compter(prog);
    $("compteur").textContent = `${n} bloc${n > 1 ? "s" : ""}`;
    $("code-python").textContent = kit.moteur.python(prog);
  }

  /* « Recommencer le niveau » : le programme est effacé, les étoiles gagnées restent */
  const annulerVider = A.boutonConfirmer($("vider"), () => {
    memo.ecrire("manut-prog-" + numNiv, null);
    ouvrir(numNiv);
  });

  function ouvrir(i) {
    annulerVider();
    if (surIntro) presenter(false);
    arreter();
    numNiv = i; niv = NIVEAUX[i];
    kit = { tri: window.KitTri, pivot: window.KitPivot, rail: window.KitRail, bras: KitBras }[machine(niv)];
    basculer();
    memo.ecrire("manut-niveau", i);
    $("niv-num").textContent = `Niveau ${i + 1} sur ${NIVEAUX.length}`;
    $("titre-niveau").textContent = niv.titre;
    A.consigne($("texte-niveau"), niv.verbe, niv.texte);
    A.bareme($("bareme"), niv.opt);
    indice(niv.indice);
    chargement = true;
    ws.clear();
    ws.updateToolbox(boiteOutils(niv.blocs, kit.prefixe, niv.variables));
    const sauve = memo.lire("manut-prog-" + i, null);
    try { if (sauve) B.serialization.workspaces.load(sauve, ws); } catch { ws.clear(); }
    if (!debut()) B.serialization.blocks.append({ type: "manut_depart", x: 30, y: 30, deletable: false }, ws);
    A.cadrer(ws);
    chargement = false;
    teinterProgramme();
    teinterBoite();
    tirerPince();
    tirage = null;
    tirerDepart();
    neuf = true;
    montrer();
    majProgramme();
    construireNav();
    attente();
  }

  ws.addChangeListener((e) => {
    if (e.isUiEvent || chargement) return;
    majProgramme();
    memo.ecrire("manut-prog-" + numNiv, B.serialization.workspaces.save(ws));
  });

  const redessiner = () => { if (!anim) { scene(kit.fixe(vu)); dessinerObjectif(montre); } };
  $("lancer").addEventListener("click", () => lancer());
  $("effacer").addEventListener("click", () => { tirerPince(); tirerDepart(); neuf = true; reinitialiser(); attente(); });
  A.boutonCopier($("copier"), $("code-python"));
  A.boutonNettoyer($("nettoyer"), ws, "manut_depart");
  A.sombre.addEventListener("change", () => { redessiner(); dessinerObjectif(montre); });
  document.fonts.ready.then(redessiner);

  /* Un moteur 3D par machine, créé à la première ouverture d'un de ses niveaux (et non les quatre au
     chargement : temps de chargement et mémoire graphique divisés d'autant). null : 3D impossible. */
  let actif3D = false;
  const moteurs = {};
  const TOILES = { bras: "c-3d", tri: "c-tri", pivot: "c-pivot", rail: "c-rail" };
  const FABRIQUES = {
    bras: (c) => window.Rendu3D.creer(c, { centres: CENTRE, sol: SOL, haut: HAUT }),
    tri: (c) => window.Rendu3DTri.creer(c),
    pivot: (c) => window.Rendu3DPivot.creer(c, window.KitPivot.geometrie),
    rail: (c) => window.Rendu3DPivot.creer(c, window.KitRail.geometrie),
  };
  function moteur(nom) {
    if (!actif3D) return null;
    if (!(nom in moteurs)) {
      moteurs[nom] = null;
      const c = $(TOILES[nom]);
      try {
        /* la toile doit être visible pendant la création ; basculer() la cache ensuite si besoin */
        c.hidden = false;
        moteurs[nom] = FABRIQUES[nom](c);
        c.addEventListener("webglcontextlost", () => { moteurs[nom] = null; basculer(); scene(kit.fixe(vu)); });
      } catch (e) {
        console.warn("Affichage 3D impossible, dessin 2D utilisé.", e);
      }
    }
    return moteurs[nom];
  }
  const rendu3D = () => moteur(machine(niv));
  /* Animation trop lente (moins de 22 images par seconde) : mode léger, une fois */
  let ecarts = [];
  function surveiller(ecart) {
    if (!rendu3D() || ecran || C3.leger || !(ecart > 0 && ecart < 1000)) return;
    ecarts.push(ecart);
    if (ecarts.length < 40) return;
    ecarts.sort((a, b) => a - b);
    if (ecarts[20] > 45) C3.alleger();
    ecarts = [];
  }
  /* Avertissement « 3D sans carte graphique » : fermé, il ne revient pas avant la prochaine visite */
  let alerteFermee = false;
  try { alerteFermee = sessionStorage.getItem("cody-alerte-3d") === "1"; } catch { /* stockage indisponible */ }
  $("fermer-alerte-3d").addEventListener("click", () => {
    alerteFermee = true;
    try { sessionStorage.setItem("cody-alerte-3d", "1"); } catch { /* stockage indisponible */ }
    $("alerte-3d").hidden = true;
  });
  /* N'affiche que la toile utile : 3D de la machine du niveau, sinon dessin 2D */
  function basculer() {
    const actif = rendu3D() ? machine(niv) : null;
    for (const [nom, id] of Object.entries(TOILES)) $(id).hidden = nom !== actif;
    $("c-scene").hidden = !!actif;
    $("aide-3d").hidden = !actif;
    $("alerte-3d").hidden = !(actif && C3.sansCarte && !alerteFermee);
    /* Vue sur l'autre écran : un encart remplace la scène */
    $("deportee").hidden = !(actif && ecran);
    document.querySelector(".scene").hidden = !!(actif && ecran);
    $("vers-ecran").hidden = !(actif && deuxEcrans());
  }

  /* ---------- Vue 3D sur un second écran (demande de l'enseignant) ----------
     Fenêtre vue.html, placée sur l'autre écran quand le navigateur le permet (API Window Management,
     Chrome et Edge). Elle dessine les vues reçues par postMessage ; l'atelier ne dessine plus la 3D. */
  let ecran = null, ecranPret = false, guetteur = 0;
  /* Détection peu fiable : screen.isExtended répond false à tort (Brave, portable + écran HDMI en
     « Étendre » ; déjà constaté sur une autre appli) et n'existe pas dans Firefox. Le bouton est donc
     affiché sauf si getScreenDetails(), une fois l'autorisation accordée, ne voit qu'un écran. */
  let nbEcrans = null;
  const deuxEcrans = () => window.screen.isExtended === true || nbEcrans !== 1;
  if ("isExtended" in window.screen) window.screen.addEventListener("change", basculer);
  (async () => {
    try {
      if (!("getScreenDetails" in window)) return;
      const etat = await navigator.permissions.query({ name: "window-management" });
      if (etat.state !== "granted") return;
      const details = await window.getScreenDetails();
      const compter = () => { nbEcrans = details.screens.length; basculer(); };
      details.addEventListener("screenschange", compter);
      compter();
    } catch { /* API absente ou refusée : bouton affiché */ }
  })();
  const machineVue = (vue) => (vue.tri ? "tri" : vue.rail ? "rail" : vue.pivot ? "pivot" : "bras");
  function envoyerVue(vue) {
    if (ecranPret) ecran.postMessage({ type: "vue", machine: machineVue(vue), vue, titre: `Niveau ${numNiv + 1} · ${niv.titre}` }, "*");
  }
  async function deporter() {
    let place = "width=1280,height=720";
    try {
      /* Demande l'autorisation « gestion des fenêtres » la première fois */
      const details = await window.getScreenDetails();
      const autre = details.screens.find((s) => s !== details.currentScreen);
      if (autre) place = `left=${autre.availLeft},top=${autre.availTop},width=${autre.availWidth},height=${autre.availHeight}`;
    } catch { /* refusé ou non pris en charge : la fenêtre s'ouvre où le navigateur veut, on la déplace à la main */ }
    const f = window.open("vue.html", "cody-vue-3d", "popup," + place);
    if (!f) {
      dire("alerte", "Fenêtre bloquée", "Le navigateur a bloqué la fenêtre de la vue 3D. Autorise les fenêtres surgissantes pour ce site, puis clique à nouveau sur « Second écran ».");
      return;
    }
    ecran = f; ecranPret = false;
    clearInterval(guetteur);
    guetteur = setInterval(() => { if (ecran && ecran.closed) ramener(); }, 700);
    basculer();
  }
  function ramener() {
    clearInterval(guetteur);
    if (ecran && !ecran.closed) ecran.close();
    ecran = null; ecranPret = false;
    basculer();
    if (!anim) scene(kit.fixe(vu));
  }
  window.addEventListener("message", (e) => {
    if (!ecran || e.source !== ecran || !e.data) return;
    if (e.data.type === "prete") {
      ecranPret = true;
      ecran.postMessage({ type: "init", geo: {
        bras: { centres: CENTRE, sol: SOL, haut: HAUT }, pivot: window.KitPivot.geometrie, rail: window.KitRail.geometrie,
      } }, "*");
      if (!anim) scene(kit.fixe(vu));
    } else if (e.data.type === "echec") {
      ramener();
      dire("alerte", "Vue 3D ramenée", "La fenêtre du second écran n'a pas pu afficher la 3D.");
    }
  });
  window.addEventListener("pagehide", () => { if (ecran && !ecran.closed) ecran.close(); });
  $("vers-ecran").addEventListener("click", deporter);
  $("ramener").addEventListener("click", ramener);
  async function activer3D() {
    if (!window.THREE || new URLSearchParams(location.search).has("2d")) return;
    /* La police doit être prête avant de dessiner les étiquettes des caisses */
    await document.fonts.load("700 40px Luciole").catch(() => {});
    actif3D = true;
    basculer();
    scene(kit.fixe(vu));
  }

  /* PDF de l'élève et solutions de l'espace prof : programme modèle -> blocs (une règle par machine) */
  const PREFIXES = { bras: "manut_", tri: "tri_", pivot: "pivot_", rail: "pivot_" };
  function blocModele(c, m) {
    const b = { type: PREFIXES[m] + c.t, fields: {}, inputs: {} };
    if (c.t === "repeter") b.fields.N = c.n;
    if (m === "bras") {
      if (c.t === "aller") b.fields.P = c.p;
      if (c.v !== undefined) { b.fields.V = c.v; if (c.n !== undefined) b.fields.N = c.n; }
      if (c.w !== undefined) b.fields.W = c.w;
      if (c.op) b.fields.OP = c.op;
      if (c.t === "si") b.fields.C = c.c;
    } else if (m === "tri") {
      if (c.t === "orienter") { b.fields.N = String(c.n); b.fields.D = c.d; }
      if (c.t === "envoyer") b.fields.N = String(c.n);
      if (c.t === "tantque" || c.t === "sicaisse") b.fields.O = c.ou;
      if (c.t === "si") { b.fields.N = String(c.n); b.fields.C = c.c; }
    } else {
      if (c.t === "tourner" || c.t === "glisser") b.fields.S = c.s;
      if (c.t === "si") b.fields.C = c.c;
      if (c.t === "jusqua" && m === "rail") { b.type = "pivot_jusquarail"; b.fields.BUT = c.but || "ouest"; }
    }
    for (const [nom, liste] of [["FAIRE", c.corps || c.alors], ["SINON", c.sinon]]) {
      if (liste && liste.length) b.inputs[nom] = { block: chaineModele(liste, m) };
    }
    return b;
  }
  const chaineModele = (l, m) => l.reduceRight((suite, c) => {
    const b = blocModele(c, m);
    if (suite) b.next = { block: suite };
    return b;
  }, null);
  const versBlocs = (n) => ({ blocks: { languageVersion: 0, blocks: [{ type: "manut_depart", x: 30, y: 30, deletable: false,
    ...(n.prog.length ? { next: { block: chaineModele(n.prog, machine(n)) } } : {}) }] } });
  const KITS = () => ({ bras: KitBras, tri: window.KitTri, pivot: window.KitPivot, rail: window.KitRail });
  const infosNiveau = (n, i) => ({ num: i + 1, total: NIVEAUX.length, titre: n.titre, verbe: n.verbe, texte: n.texte, opt: n.opt, groupe: n.groupe });
  A.exports({
    atelier: "Manutention", fichier: "manutention", ws,
    niveau: () => infosNiveau(niv, numNiv),
    compter: () => kit.moteur.compter(programme()),
    solutions: () => NIVEAUX.map((n, i) => ({ ...infosNiveau(n, i), etat: versBlocs(n), nb: KITS()[machine(n)].moteur.compter(n.prog) })),
    /* la partie « sinon », plus foncée, est dessinée par cette page */
    apres: (espace) => { for (const b of espace.getAllBlocks(false)) if (b.getInput("SINON")) teinterSinon(b); },
    appliquer: (etat) => { memo.ecrire("manut-prog-" + numNiv, etat); ouvrir(numNiv); },
  });

  window.manutTest = { NIVEAUX, ouvrir, ws, departMaximum, nombreCaisses, get en3D() { return !!rendu3D(); }, get tirage() { return tirage; }, get pince() { return pince; } };
  /* « C'est parti » : retour au niveau en cours (le niveau 1 à la première visite) */
  $("commencer").addEventListener("click", () => ouvrir(numNiv));
  ouvrir(Math.min(+memo.lire("manut-niveau", 0) || 0, NIVEAUX.length - 1));
  /* À la première visite sur ce navigateur, on commence par les explications */
  if (!memo.lire("manut-intro-vue", false)) presenter(true);
  activer3D();
}

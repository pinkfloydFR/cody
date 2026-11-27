/* Atelier Manutention : blocs, scène et verdict. Les règles sont dans manutention-moteur.js. */
{
  const B = window.Blockly, A = window.Atelier, M = window.Manutention, memo = A.memo;
  /* Niveaux 1 à 12 : bras sur rail ; 13 à 18 : centre de tri (tri.js) ; 19 à 23 : bras pivotant ;
     24 à 27 : bras pivotant sur rail (pivot.js) */
  const NIVEAUX = [...M.NIVEAUX, ...window.Tri.NIVEAUX, ...window.Pivot.NIVEAUX, ...window.PivotRail.NIVEAUX];
  /* La machine d'un niveau, d'après son groupe */
  const machine = (n) => ({ Convoyeurs: "tri", Pivot: "pivot", "Pivot + rail": "rail" })[n.groupe] || "bras";
  const $ = (id) => document.getElementById(id);

  /* ---------- Blocs ---------- */
  const lien = { previousStatement: null, nextStatement: null };
  const nombre = { type: "field_number", name: "N", value: 3, min: 0, max: 100, precision: 1 };
  const corps = (name) => ({ type: "input_statement", name });
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

  const boiteOutils = (noms, prefixe = "manut_") => ({
    kind: "flyoutToolbox",
    contents: noms.map((n) => ({ kind: "block", type: prefixe + n })),
  });
  const ws = A.injecter("blockly", boiteOutils(NIVEAUX[0].blocs));
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
  let troisD = null;

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
  }
  const fixe = (etat) => ({ x: CENTRE[etat.pos], y: REPOS, main: etat.main, piles: etat.piles,
    tapis: { E: 0, S: 0 }, instruction: "en attente", decor: numNiv });

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
  const tirerDepart = () => {
    if (!niv.hasard) { tirage = niv.configs[0]; return; }
    const avant = tirage && JSON.stringify(tirage.depart);
    do tirage = niv.hasard(); while (JSON.stringify(tirage.depart) === avant);
  };
  /* Un départ avec le plus grand nombre de caisses possible, couleurs au hasard : on tire un
     grand nombre de départs et on garde le plus fourni */
  const nombreCaisses = (cas) => Object.values(cas.depart).reduce((n, pile) => n + pile.length, 0);
  const departMaximum = () => {
    let meilleur = niv.hasard();
    for (let i = 0; i < 300; i++) {
      const cas = niv.hasard();
      if (nombreCaisses(cas) > nombreCaisses(meilleur)) meilleur = cas;
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
  const etatDepart = (cas, pos) => ({ pos, main: null, piles: { 1: [], 2: [], 3: [], S: [], E: [], ...cas.depart } });

  function montrer(cas = tirage, pos = pince) {
    montre = cas;
    vu = kit.etatDepart(cas, pos);
    scene(kit.fixe(vu));
    dessinerObjectif(cas);
    releve(vu, 0);
  }

  const VERS = { E: "à l'entrée", 1: "à l'emplacement 1", 2: "à l'emplacement 2", 3: "à l'emplacement 3", S: "à la sortie" };
  const libelle = (ev) => (ev.t === "aller" ? `aller ${VERS[ev.etat.pos]}` : `${ev.t} la caisse`);

  /* Image intermédiaire entre l'état « avant » et l'événement ; u va de 0 à 1 */
  function image(avant, ev, u) {
    const doux = (v) => v * v * (3 - 2 * v);
    if (ev.t === "aller") {
      const x = CENTRE[avant.pos] + (CENTRE[ev.etat.pos] - CENTRE[avant.pos]) * doux(u);
      return { ...fixe(avant), x, instruction: libelle(ev) };
    }
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
    releve: (e) => [["pince", NOM[e.pos]], ["caisse tenue", e.main ? e.main.l : "aucune"], ["livrées", e.piles.S.map((c) => c.l).join(", ") || "aucune"]],
    attente: (n) => (n.hasard ? "Les caisses et la position de la pince sont tirées au hasard. Ton programme est aussi vérifié sur d'autres départs."
      : "La pince ne démarre pas toujours au même endroit : ton programme est vérifié depuis toutes ses positions."),
    enCours: (pos) => `La pince part ${LIEU[pos]}`,
    defaut: (bonne, mauvaise) => `Ton programme réussit quand la pince part ${LIEU[bonne]}, mais pas quand elle part ${LIEU[mauvaise]}. Place-la toi-même avant d'agir.`,
    echec: (motif, e) => (motif === "pince" ? `la pince tient encore la caisse ${e.main.l}.` : "les piles ne correspondent pas à l'objectif."),
    verifie: " · vérifié depuis toutes les positions de la pince",
  };
  let kit = KitBras;
  function scene(vue) {
    const moteur3D = vue.tri ? troisDTri : vue.rail ? troisDRail : vue.pivot ? troisDPivot : troisD;
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
    scene(kit.image(vu, ev, u));
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
    A.boutonExecuter($("lancer"), false);
  }
  function reinitialiser() { arreter(); montrer(); }

  /* « impose » : départ à jouer à la place d'un nouveau tirage */
  function lancer(impose) {
    if (anim) { reinitialiser(); dire("info", "Programme arrêté", ""); return; }
    reinitialiser();
    const prog = programme();
    if (!prog.length) { dire("ko", "Aucune instruction", "Accroche des blocs sous « DÉPART »."); return; }
    tirerPince();
    if (impose) tirage = impose;
    else tirerDepart();
    const bilan = kit.moteur.verifier(niv, prog, pince, niv.hasard ? tirage : undefined);
    /* En cas d'échec, on rejoue le départ et la position de pince qui ont échoué ;
       en cas de réussite, on part d'une position tirée au hasard. */
    const pos = bilan.reussi ? pince : bilan.pos;
    const resultat = bilan.reussi ? kit.moteur.executer(prog, tirage.depart, pos) : bilan.resultat;
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
      if (resultat.erreur && resultat.erreur.id) ws.highlightBlock(resultat.erreur.id);
      dire("ko", "Défaut d'initialisation",
        kit.defaut(bilan.reussiDepuis, bilan.pos) + (autreDepart ? " Le départ affiché a changé pour te montrer ce cas." : ""));
    } else if (motif === "erreur") {
      if (resultat.erreur.id) ws.highlightBlock(resultat.erreur.id);
      dire("ko", "Arrêt du programme", ou + kit.moteur.ERREURS[resultat.erreur.code]);
    } else {
      dire("ko", "Objectif non atteint", ou + kit.echec(motif, resultat.etat));
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
  if (!memo.lire("manut-niveau10-trois-couleurs", false)) {
    delete notes[9];
    memo.ecrire("manut-notes-2", notes);
    memo.ecrire("manut-niveau10-trois-couleurs", true);
  }
  let surIntro = false;
  function construireNav() {
    A.boutonsNiveaux($("niveaux"), NIVEAUX, numNiv, notes, ouvrir);
    /* Bouton « Aide » : la page d'explications, avant le niveau 1 */
    const b = A.creer("button", "niv niv-intro", "Aide");
    b.type = "button";
    b.title = "Explications avant de commencer";
    b.addEventListener("click", () => presenter(true));
    if (surIntro) {
      for (const autre of $("niveaux").querySelectorAll("[aria-current]")) autre.removeAttribute("aria-current");
      b.setAttribute("aria-current", "true");
    }
    $("niveaux").prepend(b);
  }
  /* Affiche la page d'explications à la place de l'atelier, ou revient à l'atelier */
  function presenter(oui) {
    if (oui) { arreter(); montrer(); attente(); }
    surIntro = oui;
    $("intro").hidden = !oui;
    document.querySelector("main.jeu").hidden = oui;
    if (!oui) memo.ecrire("manut-intro-vue", true);
    construireNav();
  }
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
    $("texte-indice").textContent = niv.indice;
    $("bloc-indice").open = false;
    chargement = true;
    ws.clear();
    ws.updateToolbox(boiteOutils(niv.blocs, kit.prefixe));
    const sauve = memo.lire("manut-prog-" + i, null);
    try { if (sauve) B.serialization.workspaces.load(sauve, ws); } catch { ws.clear(); }
    if (!debut()) B.serialization.blocks.append({ type: "manut_depart", x: 30, y: 30, deletable: false }, ws);
    chargement = false;
    teinterProgramme();
    teinterBoite();
    tirerPince();
    tirage = null;
    tirerDepart();
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
  $("effacer").addEventListener("click", () => { tirerPince(); tirerDepart(); reinitialiser(); attente(); });
  A.boutonCopier($("copier"), $("code-python"));
  A.sombre.addEventListener("change", () => { redessiner(); dessinerObjectif(montre); });
  document.fonts.ready.then(redessiner);

  let troisDTri = null, troisDPivot = null, troisDRail = null;
  const rendu3D = () => ({ bras: troisD, tri: troisDTri, pivot: troisDPivot, rail: troisDRail })[machine(niv)];
  const TOILES = { bras: "c-3d", tri: "c-tri", pivot: "c-pivot", rail: "c-rail" };
  /* N'affiche que la toile utile : 3D de la machine du niveau, sinon dessin 2D */
  function basculer() {
    const actif = rendu3D() ? machine(niv) : null;
    for (const [nom, id] of Object.entries(TOILES)) $(id).hidden = nom !== actif;
    $("c-scene").hidden = !!actif;
    $("aide-3d").hidden = !actif;
    /* Vue sur l'autre écran : un encart remplace la scène */
    $("deportee").hidden = !(actif && ecran);
    document.querySelector(".scene").hidden = !!(actif && ecran);
    $("vers-ecran").hidden = !(actif && deuxEcrans());
  }

  /* ---------- Vue 3D sur un second écran (demande de l'enseignant) ----------
     Fenêtre vue.html, placée sur l'autre écran quand le navigateur le permet (API Window Management,
     Chrome et Edge). Elle dessine les vues reçues par postMessage ; l'atelier ne dessine plus la 3D. */
  let ecran = null, ecranPret = false, guetteur = 0;
  /* screen.isExtended n'existe que dans Chrome et Edge : ailleurs, le bouton n'apparaît pas */
  const deuxEcrans = () => window.screen.isExtended === true;
  if ("isExtended" in window.screen) window.screen.addEventListener("change", basculer);
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
    const essayer = (id, creerRendu, perdre) => {
      try {
        /* la toile doit être visible pendant la création */
        $(id).hidden = false;
        const r = creerRendu($(id));
        $(id).addEventListener("webglcontextlost", () => { perdre(); basculer(); scene(kit.fixe(vu)); });
        return r;
      } catch (e) {
        console.warn("Affichage 3D impossible, dessin 2D utilisé.", e);
        return null;
      }
    };
    troisD = essayer("c-3d", (c) => window.Rendu3D.creer(c, { centres: CENTRE, sol: SOL, haut: HAUT }), () => { troisD = null; });
    troisDTri = essayer("c-tri", (c) => window.Rendu3DTri.creer(c), () => { troisDTri = null; });
    troisDPivot = essayer("c-pivot", (c) => window.Rendu3DPivot.creer(c, window.KitPivot.geometrie), () => { troisDPivot = null; });
    troisDRail = essayer("c-rail", (c) => window.Rendu3DPivot.creer(c, window.KitRail.geometrie), () => { troisDRail = null; });
    basculer();
    scene(kit.fixe(vu));
  }

  window.manutTest = { NIVEAUX, ouvrir, ws, departMaximum, nombreCaisses, get en3D() { return !!rendu3D(); } };
  $("commencer").addEventListener("click", () => ouvrir(0));
  ouvrir(Math.min(+memo.lire("manut-niveau", 0) || 0, NIVEAUX.length - 1));
  /* À la première visite sur ce navigateur, on commence par les explications */
  if (!memo.lire("manut-intro-vue", false)) presenter(true);
  activer3D();
}

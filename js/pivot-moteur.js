/* Moteur du bras pivotant : sur place (niveaux 19 à 23) et sur rail (24 à 27). Aucun accès à la page,
   testable avec Node. Aucun eval. Même interface que manutention-moteur.js.

   Le bras tourne par quarts de tour et ne touche que ce qu'il vise : le « plan » associe à chaque
   couple « cran,orientation » le poste atteint. L'entrée est une file (la première arrivée en tête
   de liste), l'attente une pile où l'on peut reprendre, les autres postes des tapis de sortie (dans
   l'ordre de livraison, on n'y reprend rien). Le pivot sur place est un rail à un seul cran. */
{
  const CAPACITE = { sortie: 6, attente: 4 };
  const LIMITE = 500;
  /* Orientations, dans le sens des aiguilles d'une montre */
  const CAPS = ["O", "N", "E", "S"];
  const PIVOT = { crans: 1, plan: { "1,O": "entree", "1,N": "N", "1,E": "E", "1,S": "S" } };
  const RAIL = { crans: 3, plan: { "1,O": "entree", "1,N": "A", "2,N": "B", "2,S": "attente", "3,N": "C", "3,E": "D" } };

  const COMMUNES = {
    saisir_sortie: "Une caisse livrée est partie : on ne la reprend pas sur un tapis de sortie.",
    saisir_plein: "La pince tient déjà une caisse : pose-la avant d'en saisir une autre.",
    poser_vide: "La pince est vide : il n'y a rien à poser.",
    sortie_pleine: `Ce tapis de sortie est plein : ${CAPACITE.sortie} caisses au maximum.`,
    si_vide: "La pince est vide : saisis d'abord la caisse, puis teste sa couleur.",
    limite: `Le programme dépasse ${LIMITE} actions : vérifie tes boucles.`,
  };
  const ERREURS_PIVOT = {
    ...COMMUNES,
    saisir_vide: "La pince n'a rien à saisir : aucune caisse n'attend à l'entrée.",
    poser_entree: "On ne pose rien sur le tapis d'entrée : tourne le bras vers une sortie.",
  };
  const ERREURS_RAIL = {
    ...COMMUNES,
    saisir_vide: "La pince n'a rien à saisir : il n'y a pas de caisse à cet endroit.",
    poser_entree: "On ne pose rien sur le tapis d'entrée.",
    rien: "Il n'y a ni tapis ni pile de ce côté : vérifie le cran et l'orientation du bras.",
    butee: "Butée : le rail s'arrête ici, le bras ne peut pas aller plus loin.",
    attente_pleine: `La pile d'attente est pleine : ${CAPACITE.attente} caisses au maximum.`,
  };

  /* ---------- Instructions ---------- */
  const droite = () => ({ t: "tourner", s: "D" });
  const gauche = () => ({ t: "tourner", s: "G" });
  const saisir = () => ({ t: "saisir" });
  const poser = () => ({ t: "poser" });
  const repeter = (n, ...corps) => ({ t: "repeter", n, corps });
  const jusqua = (...corps) => ({ t: "jusqua", corps });
  const glisser = (s) => ({ t: "glisser", s });
  const auBout = (...corps) => ({ t: "jusqua", but: "bout", corps });
  const tantque = (...corps) => ({ t: "tantque", corps });
  const sicaisse = (alors, sinon = []) => ({ t: "sicaisse", alors, sinon });
  const si = (c, alors, sinon = []) => ({ t: "si", c, alors, sinon });
  /* Initialisation, la même à tous les niveaux : revenir face à l'entrée */
  const init = () => jusqua(droite());

  /* ---------- Arrivages : R rouge, B bleue, J jaune, V verte ; numéros dans l'ordre d'arrivée ---------- */
  const COULEUR = { R: "rouge", B: "bleu", J: "jaune", V: "vert" };
  const arrivage = (motif) => [...motif].map((m, i) => ({ l: String(i + 1), c: COULEUR[m] }));
  const cas = (motif, regle) => {
    const entree = arrivage(motif);
    return { depart: { entree, N: [], E: [], S: [] }, objectif: { entree: [], N: [], E: [], S: [], ...regle(entree) } };
  };
  const entier = (alea, mini, maxi) => mini + Math.floor(alea() * (maxi - mini + 1));
  const motifAlea = (couleurs) => (alea) =>
    Array.from({ length: entier(alea, 1, 6) }, () => couleurs[entier(alea, 0, couleurs.length - 1)]).join("");
  const de = (couleur, l) => l.filter((x) => x.c === couleur);

  const niveau = (o, regle, motifs, tirer) => ({
    ...o, groupe: "Pivot",
    configs: motifs.map((m) => cas(m, regle)),
    ...(tirer ? { hasard: (alea = Math.random) => cas(tirer(alea), regle) } : {}),
  });
  const BASE = ["tourner", "saisir", "poser", "jusqua", "repeter"];
  const BOUCLE = [...BASE, "tantque", "sicaisse"];
  const CHANGE = " Il en arrive de 1 à 6. Leur nombre et leurs couleurs changent d'un essai à l'autre : les numéros indiquent seulement l'ordre d'arrivée.";

  const NIVEAUX = [
    niveau({ titre: "Demi-tour", verbe: "LIVRER", texte: "la caisse 1 sur le tapis est.",
      indice: "Tu ne sais pas vers où le bras est tourné au départ. Le bloc « répéter jusqu'à » le ramène face à l'entrée.",
      blocs: BASE, opt: 6,
      prog: [init(), saisir(), repeter(2, droite()), poser()] },
      (E) => ({ E }), ["R"]),
    niveau({ titre: "La navette", verbe: "TRANSFÉRER", texte: "toutes les caisses sur le tapis nord." + CHANGE,
      indice: "La boucle « tant qu'il y a une caisse ici » regarde du côté visé : à la fin de chaque tour, le bras doit être revenu face à l'entrée.",
      blocs: BOUCLE, opt: 7,
      prog: [init(), tantque(saisir(), droite(), poser(), gauche())] },
      (E) => ({ N: E }), ["RBJ", "V", "BRVJRB", "JJ"], motifAlea("RBJV")),
    niveau({ titre: "Rouges à part", verbe: "TRIER", texte: "les caisses : les rouges au nord, toutes les autres au sud." + CHANGE,
      indice: "Après avoir posé, tu ne sais plus si tu es au nord ou au sud. Un bloc que tu connais ramène le bras à l'ouest dans les deux cas.",
      blocs: [...BOUCLE, "si"], opt: 10,
      prog: [init(), tantque(saisir(), si("rouge", [droite()], [gauche()]), poser(), init())] },
      (E) => ({ N: de("rouge", E), S: E.filter((x) => x.c !== "rouge") }),
      ["RBJR", "R", "B", "VRRJBR", "BJV", "RRR"], motifAlea("RBJV")),
    niveau({ titre: "Trois directions", verbe: "TRIER", texte: "les caisses : les rouges au nord, les bleues à l'est, les jaunes au sud." + CHANGE,
      indice: "Nord, est, sud : ce sont un, deux et trois quarts de tour à droite. Tourne, puis demande-toi s'il faut tourner encore.",
      blocs: [...BOUCLE, "si"], opt: 12,
      prog: [init(), tantque(saisir(), droite(), si("rouge", [], [droite(), si("bleu", [], [droite()])]), poser(), init())] },
      (E) => ({ N: de("rouge", E), E: de("bleu", E), S: de("jaune", E) }),
      ["JRBJ", "R", "B", "J", "BBRBJJ", "RJRBRB"], motifAlea("RBJ")),
    niveau({ titre: "Chacun son tour", verbe: "DISTRIBUER", texte: "les caisses : la 1re au nord, la 2e à l'est, la 3e au sud, la 4e de nouveau au nord, et ainsi de suite." + CHANGE,
      indice: "Écris un tour complet pour trois caisses. Mais il n'en reste peut-être qu'une ou deux : avant la 2e et la 3e, vérifie qu'il y a bien une caisse.",
      blocs: BOUCLE, opt: 19,
      prog: [init(), tantque(saisir(), droite(), poser(), gauche(),
        sicaisse([saisir(), droite(), droite(), poser(), gauche(), gauche(),
          sicaisse([saisir(), gauche(), poser(), droite()])]))] },
      (E) => ({ N: E.filter((_, i) => i % 3 === 0), E: E.filter((_, i) => i % 3 === 1), S: E.filter((_, i) => i % 3 === 2) }),
      ["R", "RB", "RBJ", "RBJV", "VJBRV", "BRJVRB"], motifAlea("RBJV")),
  ];

  /* ---------- Niveaux du rail ---------- */
  const casRail = (motif, regle) => {
    const entree = arrivage(motif);
    const vide = () => ({ A: [], B: [], C: [], D: [], attente: [] });
    return { depart: { entree, ...vide() }, objectif: { entree: [], ...vide(), ...regle(entree) } };
  };
  const niveauRail = (o, regle, motifs, tirer) => ({
    ...o, groupe: "Pivot + rail",
    configs: motifs.map((m) => casRail(m, regle)),
    ...(tirer ? { hasard: (alea = Math.random) => casRail(tirer(alea), regle) } : {}),
  });
  /* au plus 4 bleues (la pile d'attente en tient 4) : les suivantes deviennent rouges */
  const quatreBleues = (tirer) => (alea) => {
    let k = 0;
    return [...tirer(alea)].map((m) => (m === "B" && ++k > 4 ? "R" : m)).join("");
  };
  /* Initialisation du rail : face à l'ouest, puis au bout ouest */
  const initRail = () => [init(), auBout(glisser("O"))];
  const BASE_RAIL = ["tourner", "glisser", "saisir", "poser", "jusquarail", "repeter"];
  const BOUCLE_RAIL = [...BASE_RAIL, "tantque", "sicaisse"];

  const NIVEAUX_RAIL = [
    niveauRail({ titre: "Premier voyage", verbe: "LIVRER", texte: "la caisse 1 sur le tapis C.",
      indice: "Au départ, tu ne connais ni l'orientation du bras ni son cran. Ramène-le face à l'ouest ET au bout ouest du rail.",
      blocs: BASE_RAIL, opt: 9,
      prog: [...initRail(), saisir(), droite(), repeter(2, glisser("E")), poser()] },
      (E) => ({ C: E }), ["R"]),
    niveauRail({ titre: "Bout de ligne", verbe: "TRANSFÉRER", texte: "toutes les caisses sur le tapis D." + CHANGE,
      indice: "Le bras peut tourner pendant le voyage. Cherche un petit groupe d'actions à répéter deux fois, à l'aller comme au retour.",
      blocs: BOUCLE_RAIL, opt: 13,
      prog: [...initRail(), tantque(saisir(), repeter(2, droite(), glisser("E")), poser(), repeter(2, droite(), glisser("O")))] },
      (E) => ({ D: E }), ["RBJ", "V", "BRVJRB", "JJ"], motifAlea("RBJV")),
    niveauRail({ titre: "Un quai par couleur", verbe: "TRIER", texte: "les caisses : les rouges en A, les bleues en B, les jaunes en C." + CHANGE,
      indice: "A, B et C sont tous au nord : tourne d'abord, puis avance plus ou moins loin selon la couleur. Au retour, une boucle te ramène au bout du rail, d'où que tu viennes.",
      blocs: [...BOUCLE_RAIL, "si"], opt: 15,
      prog: [...initRail(), tantque(saisir(), droite(),
        si("rouge", [], [glisser("E"), si("bleu", [], [glisser("E")])]), poser(), gauche(), auBout(glisser("O")))] },
      (E) => ({ A: de("rouge", E), B: de("bleu", E), C: de("jaune", E) }),
      ["JRBJ", "R", "B", "J", "BBRBJJ", "RJRBRB"], motifAlea("RBJ")),
    niveauRail({ titre: "Grand final", verbe: "EXPÉDIER", texte: "les rouges en A dès leur arrivée, puis les bleues en D, la dernière arrivée en premier. Il arrive de 1 à 6 caisses (4 bleues au maximum), différentes à chaque essai : les numéros indiquent seulement l'ordre d'arrivée.",
      indice: "Une pile rend d'abord la dernière caisse posée : range les bleues en attente. Quand l'entrée est vide, va vider la pile vers D, avec une seconde boucle.",
      blocs: [...BOUCLE_RAIL, "si"], opt: 24,
      prog: [...initRail(),
        tantque(saisir(), si("rouge", [droite()], [gauche(), glisser("E")]), poser(), init(), auBout(glisser("O"))),
        gauche(), glisser("E"),
        tantque(saisir(), gauche(), glisser("E"), poser(), glisser("O"), droite())] },
      (E) => ({ A: de("rouge", E), D: de("bleu", E).reverse() }),
      ["BRBR", "RBBRBB", "BBR", "R", "B", "BRBRBB"], quatreBleues(motifAlea("RB"))),
  ];

  /* ---------- Exécution ---------- */
  const tourne = (dir, s) => CAPS[(CAPS.indexOf(dir) + (s === "D" ? 1 : 3)) % 4];

  const compter = (prog) => prog.reduce((n, c) =>
    n + 1 + compter(c.corps || []) + compter(c.alors || []) + compter(c.sinon || []), 0);

  /* ---------- Python (lecture seule) ---------- */
  function lignes(prog, ind, prof, out) {
    const p = "    ".repeat(ind);
    const corps = (l, plus = 0) => { if (l.length) lignes(l, ind + 1, prof + plus, out); else out.push(`${p}    pass`); };
    for (const c of prog) {
      if (c.t === "tourner") out.push(`${p}tourner_${c.s === "D" ? "droite" : "gauche"}()`);
      else if (c.t === "glisser") out.push(`${p}glisser_${c.s === "E" ? "est" : "ouest"}()`);
      else if (c.t === "saisir" || c.t === "poser") out.push(`${p}${c.t}()`);
      else if (c.t === "repeter") { out.push(`${p}for ${"ijk"[prof] || "n" + prof} in range(${c.n}):`); corps(c.corps, 1); }
      else if (c.t === "jusqua") { out.push(`${p}while not ${c.but === "bout" ? "au_bout_ouest()" : 'tourne_vers("ouest")'}:`); corps(c.corps); }
      else if (c.t === "tantque") { out.push(`${p}while caisse_presente():`); corps(c.corps); }
      else {
        out.push(c.t === "si" ? `${p}if couleur_tenue() == "${c.c}":` : `${p}if caisse_presente():`);
        corps(c.alors); out.push(`${p}else:`); corps(c.sinon);
      }
    }
    return out;
  }
  const python = (prog) => [
    "# Fonctions propres à l'atelier : ce code ne s'exécute pas tel quel ailleurs.", "",
    ...(prog.length ? lignes(prog, 0, 0, []) : ["# (aucun bloc)"]),
  ].join("\n");

  /* Une machine (sur place ou sur rail) et ses niveaux, avec l'interface attendue par la page */
  function fabriquer({ crans, plan }, NIVEAUX, ERREURS) {
    const POSTES = Object.values(plan);
    /* « positions » de départ : « O » sur place ; « cran,orientation » sur le rail */
    const POSITIONS = crans === 1 ? [...CAPS]
      : Array.from({ length: crans }, (_, i) => CAPS.map((d) => `${i + 1},${d}`)).flat();
    const lire = (position) => {
      const [a, b] = position.split(",");
      return b ? { cran: +a, dir: b } : { cran: 1, dir: a };
    };
    const copier = (p) => Object.fromEntries(POSTES.map((k) => [k, [...(p[k] || [])]]));

    function executer(prog, depart, position = POSITIONS[0]) {
      const etat = { piles: copier(depart), ...lire(position), main: null };
      const trace = [];
      let compte = 0;
      const arret = (code, id) => { throw { arret: { code, id } }; };
      const user = (id) => { if (++compte > LIMITE) arret("limite", id); };
      const noter = (c) => trace.push({ t: c.t, id: c.id, instruction: c,
        etat: { piles: copier(etat.piles), cran: etat.cran, dir: etat.dir, main: etat.main } });
      /* Poste visé (undefined : rien de ce côté) et « il y a une caisse ici » */
      const vise = () => plan[`${etat.cran},${etat.dir}`];
      const presente = () => !!vise() && etat.piles[vise()].length > 0;

      function bloc(liste) {
        for (const c of liste) {
          user(c.id);
          if (c.t === "tourner") { etat.dir = tourne(etat.dir, c.s); noter(c); }
          else if (c.t === "glisser") {
            const cran = etat.cran + (c.s === "E" ? 1 : -1);
            if (cran < 1 || cran > crans) arret("butee", c.id);
            etat.cran = cran; noter(c);
          } else if (c.t === "saisir") {
            const poste = vise();
            if (etat.main) arret("saisir_plein", c.id);
            if (!poste) arret("rien", c.id);
            if (poste !== "entree" && poste !== "attente") arret("saisir_sortie", c.id);
            if (!etat.piles[poste].length) arret("saisir_vide", c.id);
            etat.main = poste === "entree" ? etat.piles[poste].shift() : etat.piles[poste].pop(); noter(c);
          } else if (c.t === "poser") {
            const poste = vise();
            if (!etat.main) arret("poser_vide", c.id);
            if (!poste) arret("rien", c.id);
            if (poste === "entree") arret("poser_entree", c.id);
            const sorte = poste === "attente" ? "attente" : "sortie";
            if (etat.piles[poste].length >= CAPACITE[sorte]) arret(`${sorte}_pleine`, c.id);
            etat.piles[poste].push(etat.main); etat.main = null; noter(c);
          } else if (c.t === "repeter") {
            for (let i = 0; i < c.n; i++) { user(c.id); bloc(c.corps); }
          } else if (c.t === "jusqua") {
            const atteint = () => (c.but === "bout" ? etat.cran === 1 : etat.dir === "O");
            while (!atteint()) { user(c.id); bloc(c.corps); }
          } else if (c.t === "tantque") {
            while (presente()) { user(c.id); bloc(c.corps); }
          } else if (c.t === "sicaisse") {
            bloc(presente() ? c.alors : c.sinon);
          } else if (c.t === "si") {
            if (!etat.main) arret("si_vide", c.id);
            bloc(etat.main.c === c.c ? c.alors : c.sinon);
          }
        }
      }

      try { bloc(prog); }
      catch (e) {
        if (!e.arret) throw e;
        return { etat, trace, erreur: e.arret };
      }
      return { etat, trace, erreur: null };
    }

    const memesPiles = (a, b) => POSTES.every((k) =>
      a[k].length === b[k].length && a[k].every((x, i) => x.l === b[k][i].l && x.c === b[k][i].c));
    function conforme(etat, objectif) {
      if (etat.main) return "pince";
      return memesPiles(etat.piles, objectif) ? null : "piles";
    }

    /* L'état du bras au lancement est inconnu : chaque arrivage est contrôlé depuis tous les départs.
       Même logique que manutention-moteur.js (défaut d'initialisation, cas à montrer). */
    function verifier(niv, prog, montree, tirage) {
      const liste = tirage ? [tirage, ...niv.configs] : niv.configs;
      const essai = (i, pos) => {
        const { depart, objectif } = liste[i];
        const resultat = executer(prog, depart, pos);
        return { config: i, pos, resultat, motif: resultat.erreur ? "erreur" : conforme(resultat.etat, objectif) };
      };
      const rates = POSITIONS.map((pos) => {
        for (let i = 0; i < liste.length; i++) {
          const e = essai(i, pos);
          if (e.motif) return e;
        }
        return undefined;
      });
      const premier = rates.find(Boolean);
      if (!premier) return { reussi: true, config: 0, cas: liste[0], pos: null, resultat: null, motif: null, initialisation: false, reussiDepuis: null };
      const bonne = POSITIONS.find((_, i) => !rates[i]) || null;
      const candidats = montree ? [...(tirage ? [0] : []), premier.config].map((i) => essai(i, montree)) : [];
      const vu = candidats.find((e) => e.motif) || premier;
      return { reussi: false, initialisation: !!bonne, reussiDepuis: bonne, ...vu, cas: liste[vu.config] };
    }

    return { CAPACITE, LIMITE, POSITIONS, ERREURS, NIVEAUX, executer, compter, verifier, conforme, python, lire };
  }

  const M = fabriquer(PIVOT, NIVEAUX, ERREURS_PIVOT);
  M.Rail = fabriquer(RAIL, NIVEAUX_RAIL, ERREURS_RAIL);
  if (typeof module !== "undefined" && module.exports) module.exports = M;
  else { window.Pivot = M; window.PivotRail = M.Rail; }
}

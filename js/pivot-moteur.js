/* Moteur du bras pivotant (niveaux 19 à 23) : aucun accès à la page, testable avec Node. Aucun eval.
   Même interface que manutention-moteur.js (executer, verifier, compter, python).

   Le bras pivote sur place par quarts de tour. Il ne touche que ce qu'il vise : à l'ouest le tapis
   d'entrée (une file, la première arrivée en tête de liste) ; au nord, à l'est et au sud un tapis de
   sortie (dans l'ordre de livraison, on n'y reprend rien). */
{
  const CAPACITE_SORTIE = 6;
  const LIMITE = 500;
  /* « positions » de départ : l'orientation du bras, dans le sens des aiguilles d'une montre */
  const POSITIONS = ["O", "N", "E", "S"];
  /* Poste visé selon l'orientation */
  const VISE = { O: "entree", N: "N", E: "E", S: "S" };
  const POSTES = ["entree", "N", "E", "S"];

  const ERREURS = {
    saisir_vide: "La pince n'a rien à saisir : aucune caisse n'attend à l'entrée.",
    saisir_sortie: "Une caisse livrée est partie : on ne la reprend pas sur un tapis de sortie.",
    saisir_plein: "La pince tient déjà une caisse : pose-la avant d'en saisir une autre.",
    poser_vide: "La pince est vide : il n'y a rien à poser.",
    poser_entree: "On ne pose rien sur le tapis d'entrée : tourne le bras vers une sortie.",
    sortie_pleine: `Ce tapis de sortie est plein : ${CAPACITE_SORTIE} caisses au maximum.`,
    si_vide: "La pince est vide : saisis d'abord la caisse, puis teste sa couleur.",
    limite: `Le programme dépasse ${LIMITE} actions : vérifie tes boucles.`,
  };

  /* ---------- Instructions ---------- */
  const droite = () => ({ t: "tourner", s: "D" });
  const gauche = () => ({ t: "tourner", s: "G" });
  const saisir = () => ({ t: "saisir" });
  const poser = () => ({ t: "poser" });
  const repeter = (n, ...corps) => ({ t: "repeter", n, corps });
  const jusqua = (...corps) => ({ t: "jusqua", corps });
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

  /* ---------- Exécution ---------- */
  const copier = (p) => Object.fromEntries(POSTES.map((k) => [k, [...(p[k] || [])]]));
  const tourne = (dir, s) => POSITIONS[(POSITIONS.indexOf(dir) + (s === "D" ? 1 : 3)) % 4];

  function executer(prog, depart, position = "O") {
    const etat = { piles: copier(depart), dir: position, main: null };
    const trace = [];
    let compte = 0;
    const arret = (code, id) => { throw { arret: { code, id } }; };
    const user = (id) => { if (++compte > LIMITE) arret("limite", id); };
    const noter = (c) => trace.push({ t: c.t, id: c.id, instruction: c,
      etat: { piles: copier(etat.piles), dir: etat.dir, main: etat.main } });
    const ici = () => etat.piles[VISE[etat.dir]];
    /* « Il y a une caisse ici » : seule l'entrée en propose à prendre, mais on voit aussi les sorties */
    const presente = () => ici().length > 0;

    function bloc(liste) {
      for (const c of liste) {
        user(c.id);
        if (c.t === "tourner") { etat.dir = tourne(etat.dir, c.s); noter(c); }
        else if (c.t === "saisir") {
          if (etat.main) arret("saisir_plein", c.id);
          if (etat.dir !== "O") arret("saisir_sortie", c.id);
          if (!ici().length) arret("saisir_vide", c.id);
          etat.main = ici().shift(); noter(c);
        } else if (c.t === "poser") {
          if (!etat.main) arret("poser_vide", c.id);
          if (etat.dir === "O") arret("poser_entree", c.id);
          if (ici().length >= CAPACITE_SORTIE) arret("sortie_pleine", c.id);
          ici().push(etat.main); etat.main = null; noter(c);
        } else if (c.t === "repeter") {
          for (let i = 0; i < c.n; i++) { user(c.id); bloc(c.corps); }
        } else if (c.t === "jusqua") {
          while (etat.dir !== "O") { user(c.id); bloc(c.corps); }
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

  const compter = (prog) => prog.reduce((n, c) =>
    n + 1 + compter(c.corps || []) + compter(c.alors || []) + compter(c.sinon || []), 0);

  const memesPiles = (a, b) => POSTES.every((k) =>
    a[k].length === b[k].length && a[k].every((x, i) => x.l === b[k][i].l && x.c === b[k][i].c));
  function conforme(etat, objectif) {
    if (etat.main) return "pince";
    return memesPiles(etat.piles, objectif) ? null : "piles";
  }

  /* L'orientation du bras au lancement est inconnue : chaque arrivage est contrôlé depuis les 4.
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

  /* ---------- Python (lecture seule) ---------- */
  function lignes(prog, ind, prof, out) {
    const p = "    ".repeat(ind);
    const corps = (l, plus = 0) => { if (l.length) lignes(l, ind + 1, prof + plus, out); else out.push(`${p}    pass`); };
    for (const c of prog) {
      if (c.t === "tourner") out.push(`${p}tourner_${c.s === "D" ? "droite" : "gauche"}()`);
      else if (c.t === "saisir" || c.t === "poser") out.push(`${p}${c.t}()`);
      else if (c.t === "repeter") { out.push(`${p}for ${"ijk"[prof] || "n" + prof} in range(${c.n}):`); corps(c.corps, 1); }
      else if (c.t === "jusqua") { out.push(`${p}while not tourne_vers("ouest"):`); corps(c.corps); }
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

  const M = { CAPACITE_SORTIE, LIMITE, POSITIONS, ERREURS, NIVEAUX, executer, compter, verifier, conforme, python };
  if (typeof module !== "undefined" && module.exports) module.exports = M;
  else window.Pivot = M;
}

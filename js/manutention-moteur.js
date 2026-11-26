/* Moteur de l'atelier Manutention : aucun accès à la page, testable avec Node. Aucun eval. */
{
  const HAUTEUR = 4;
  const CAPACITE_SORTIE = 6;
  const LIMITE = 500;
  /* « E » : tapis d'entrée (file, la première arrivée en tête de liste) ;
     « S » : tapis de sortie (dans l'ordre de livraison) ; « 1 » à « 3 » : piles (bas -> haut) */
  const POSITIONS = ["1", "2", "3", "S", "E"];

  const ERREURS = {
    saisir_vide: "La pince n'a rien à saisir : il n'y a pas de caisse à cet endroit.",
    saisir_plein: "La pince tient déjà une caisse : pose-la avant d'en saisir une autre.",
    poser_vide: "La pince est vide : il n'y a rien à poser.",
    poser_pleine: `La pile est pleine : ${HAUTEUR} caisses au maximum.`,
    si_vide: "La pince est vide : saisis d'abord la caisse, puis teste sa couleur.",
    poser_entree: "On ne pose rien sur le tapis d'entrée.",
    saisir_sortie: "Une caisse livrée est partie : on ne la reprend pas sur le tapis de sortie.",
    sortie_pleine: `Le tapis de sortie est plein : ${CAPACITE_SORTIE} caisses au maximum.`,
    limite: `Le programme dépasse ${LIMITE} actions : vérifie tes boucles.`,
  };

  /* ---------- Instructions ---------- */
  const aller = (p) => ({ t: "aller", p });
  const saisir = () => ({ t: "saisir" });
  const poser = () => ({ t: "poser" });
  const repeter = (n, ...corps) => ({ t: "repeter", n, corps });
  const tantque = (...corps) => ({ t: "tantque", corps });
  const si = (c, alors, sinon) => ({ t: "si", c, alors, sinon });
  /* Prendre la caisse du dessus en « de » et la poser en « vers » ; la pince est en « ici »
     (null : position inconnue, il faut donc y aller). */
  const porter = (ici, de, vers) => [...(ici === de ? [] : [aller(de)]), saisir(), aller(vers), poser()];

  /* ---------- Niveaux (piles notées de bas en haut) ---------- */
  const caisse = (l, c) => ({ l, c });
  const A = caisse("1", "bleu"), B = caisse("2", "rouge"), C = caisse("3", "jaune"), D = caisse("4", "vert");
  const piles = (o = {}) => ({ 1: [], 2: [], 3: [], S: [], E: [], ...o });
  const cas = (depart, objectif) => ({ depart: piles(depart), objectif: piles(objectif) });
  const vider = (l) => cas({ 1: l }, { S: [...l].reverse() });
  /* Tri : « motif » donne les couleurs de bas en haut, par exemple "RBBR" */
  const tri = (motif) => {
    const l = [...motif].map((m, i) => caisse("1234"[i], m === "R" ? "rouge" : "bleu"));
    const parCouleur = (c) => [...l].reverse().filter((x) => x.c === c);
    return cas({ 1: l }, { S: parCouleur("rouge"), 3: parCouleur("bleu") });
  };

  const BASE = ["aller", "saisir", "poser"];

  /* Arrivages : « motif » donne les couleurs dans l'ordre d'arrivée (R rouge, B bleue, J jaune, V verte) */
  const COULEUR = { R: "rouge", B: "bleu", J: "jaune", V: "vert" };
  const reception = (motif, attendu) => {
    const E = [...motif].map((m, i) => caisse("123456"[i], COULEUR[m]));
    return cas({ E }, attendu(E));
  };
  const rouges = (l) => l.filter((x) => x.c === "rouge");
  const autres = (l) => l.filter((x) => x.c !== "rouge");
  const toutLivrer = (E) => ({ S: [...E] });
  const de = (couleur, l) => l.filter((x) => x.c === couleur);
  const troisCouleurs = (E) => ({ S: rouges(E), 2: de("bleu", E), 3: de("jaune", E) });
  const inverser = (E) => ({ S: [...E].reverse() });
  /* Niveau 12 : le numéro est celui de la sortie attendue (demande de l'enseignant).
     Les mêmes objets figurent à l'entrée et à l'objectif : les deux sont numérotés d'un coup. */
  const urgents = (E) => {
    const S = [...rouges(E), ...autres(E)];
    S.forEach((c, i) => { c.l = String(i + 1); });
    return { S };
  };
  /* ---------- Départs tirés au hasard (« alea » rend un nombre entre 0 et 1, comme Math.random) ---------- */
  const entier = (alea, mini, maxi) => mini + Math.floor(alea() * (maxi - mini + 1));
  const motifAlea = (alea, mini, maxi, couleurs) =>
    Array.from({ length: entier(alea, mini, maxi) }, () => couleurs[entier(alea, 0, couleurs.length - 1)]).join("");
  /* Rouges et bleues, avec 4 bleues au maximum (les bleues attendent sur une pile de 4) */
  const motifTri = (alea, mini, maxi) => {
    let bleues = 0;
    return [...motifAlea(alea, mini, maxi, "RB")].map((m) => (m === "B" && ++bleues > 4 ? "R" : m)).join("");
  };
  /* Trois couleurs, 4 caisses au plus par pile : les bleues et les jaunes en trop deviennent rouges */
  const motifTrois = (alea, mini, maxi) => {
    const vus = { B: 0, J: 0 };
    return [...motifAlea(alea, mini, maxi, "RBJ")].map((m) => (m !== "R" && ++vus[m] > 4 ? "R" : m)).join("");
  };
  const empilees = (motif) => [...motif].map((m, i) => caisse("1234"[i], COULEUR[m]));
  const hasard = {
    vider: (alea) => vider(empilees(motifAlea(alea, 1, 4, "RBJV"))),
    trierPile: (alea) => tri(motifAlea(alea, 2, 4, "RB")),
    livrer: (alea) => reception(motifAlea(alea, 1, 6, "RBJV"), toutLivrer),
    troisCouleurs: (alea) => reception(motifTrois(alea, 1, 6), troisCouleurs),
    inverser: (alea) => reception(motifAlea(alea, 1, 4, "RBJV"), inverser),
    urgents: (alea) => reception(motifTri(alea, 1, 6), urgents),
  };

  /* Boucle de réception : tant qu'une caisse attend à l'entrée */
  const recevoir = (...actions) => tantque(saisir(), ...actions, poser(), aller("E"));
  /* Déplacer tout ce qui se trouve en « de » vers « vers » */
  const transvaser = (de, vers) => [aller(de), tantque(saisir(), aller(vers), poser(), aller(de))];

  const NIVEAUX = [
    { titre: "Première livraison", verbe: "LIVRER", texte: "la caisse 1 à la sortie.",
      indice: "Tu ne sais pas où est la pince : envoie-la d'abord à l'emplacement 1. Quatre blocs suffisent.",
      blocs: BASE, configs: [cas({ 1: [A] }, { S: [A] })], prog: porter(null, "1", "S"), opt: 4 },
    { titre: "La 2e de la pile", verbe: "LIVRER", texte: "la caisse 2 à la sortie. Les caisses 1 et 3 finissent à l'emplacement 1, la 3 au-dessus.",
      indice: "La pince ne prend que la caisse du dessus : mets d'abord la caisse 3 de côté.",
      blocs: BASE, configs: [cas({ 1: [A, B, C] }, { 1: [A, C], S: [B] })],
      prog: [...porter(null, "1", "2"), ...porter("2", "1", "S"), ...porter("S", "2", "1")], opt: 12 },
    { titre: "La caisse du fond", verbe: "LIVRER", texte: "la caisse 1 à la sortie. Les caisses 2 et 3 finissent à l'emplacement 1, dans le même ordre.",
      indice: "Avec deux emplacements libres, chaque caisse mise de côté peut avoir le sien.",
      blocs: BASE, configs: [cas({ 1: [A, B, C] }, { 1: [B, C], S: [A] })],
      prog: [...porter(null, "1", "2"), ...porter("2", "1", "3"), ...porter("3", "1", "S"),
        ...porter("S", "3", "1"), ...porter("1", "2", "1")], opt: 20 },
    { titre: "Déplacer sans inverser", verbe: "DÉPLACER", texte: "la pile de l'emplacement 1 vers l'emplacement 3, dans le même ordre.",
      indice: "Déplacer une pile caisse par caisse l'inverse. Et si tu la déplaces deux fois ?",
      blocs: [...BASE, "repeter"], configs: [cas({ 1: [A, B, C] }, { 3: [A, B, C] })],
      prog: [aller("1"), repeter(3, saisir(), aller("2"), poser(), aller("1")),
        aller("2"), repeter(3, saisir(), aller("3"), poser(), aller("2"))], opt: 12 },
    { titre: "Vider la pile", verbe: "LIVRER", texte: "les 4 caisses à la sortie.",
      indice: "Écris les actions pour une seule caisse, en finissant là où tu as commencé, puis répète-les.",
      blocs: [...BASE, "repeter"], configs: [vider([A, B, C, D])],
      prog: [aller("1"), repeter(4, saisir(), aller("S"), poser(), aller("1"))], opt: 6 },
    { titre: "Hauteur inconnue", verbe: "VIDER", texte: "l'emplacement 1 vers la sortie. La pile compte de 1 à 4 caisses, et ce nombre change d'un essai à l'autre : le même programme doit toujours réussir.",
      indice: "Tu ne connais pas le nombre de caisses : répète tant que la pile n'est pas vide.",
      blocs: [...BASE, "repeter", "tantque"],
      configs: [vider([A, B, C]), vider([A]), vider([A, B, C, D]), vider([A, B])],
      prog: [aller("1"), tantque(saisir(), aller("S"), poser(), aller("1"))], opt: 6 },
    { titre: "Tri par couleur", verbe: "TRIER", texte: "les caisses de l'emplacement 1 : les rouges à la sortie, les bleues à l'emplacement 3. Le nombre de caisses et leurs couleurs changent d'un essai à l'autre : ne te fie pas aux numéros.",
      indice: "Saisis une caisse, puis choisis sa destination selon sa couleur.",
      blocs: [...BASE, "repeter", "tantque", "si"],
      configs: [tri("RBBR"), tri("BRBB"), tri("RRB"), tri("BBRR"), tri("RBRB")],
      prog: [aller("1"), tantque(saisir(), si("rouge", [aller("S")], [aller("3")]), poser(), aller("1"))], opt: 8 },
    { titre: "Réception", verbe: "TRANSFÉRER", texte: "les 3 caisses du tapis d'entrée vers la sortie.",
      indice: "À l'entrée, seule la caisse en tête est accessible. Après chaque saisie, le tapis avance.",
      blocs: [...BASE, "repeter"], configs: [reception("JVB", toutLivrer)],
      prog: [aller("E"), repeter(3, saisir(), aller("S"), poser(), aller("E"))], opt: 6 },
    { titre: "Flux continu", verbe: "TRANSFÉRER", texte: "toutes les caisses de l'entrée vers la sortie. Il en arrive de 1 à 6. Leur nombre et leurs couleurs changent d'un essai à l'autre : les numéros indiquent seulement l'ordre d'arrivée.",
      indice: "Des caisses sont cachées, tu ne peux pas les compter : répète tant qu'il y en a une devant la pince.",
      blocs: [...BASE, "repeter", "tantque"],
      configs: ["JVB", "R", "BRJVRB", "VJ", "RBVJR"].map((m) => reception(m, toutLivrer)),
      prog: [aller("E"), recevoir(aller("S"))], opt: 6 },
    { titre: "Tri à trois couleurs", verbe: "TRIER", texte: "les caisses qui arrivent : les rouges à la sortie, les bleues à l'emplacement 2, les jaunes à l'emplacement 3. Il arrive de 1 à 6 caisses, avec au maximum 4 bleues et 4 jaunes. Leur nombre et leurs couleurs changent d'un essai à l'autre : les numéros indiquent seulement l'ordre d'arrivée.",
      indice: "« si… sinon » ne donne que deux chemins. Dans le « sinon », les caisses sont bleues ou jaunes : place un second « si » à cet endroit.",
      blocs: [...BASE, "repeter", "tantque", "si"],
      configs: ["JRBJ", "R", "BBRBBJ", "JJBJRJ", "BRB", "JRR"].map((m) => reception(m, troisCouleurs)),
      prog: [aller("E"), recevoir(si("rouge", [aller("S")], [si("bleu", [aller("2")], [aller("3")])]))], opt: 10 },
    { titre: "Ordre inversé", verbe: "EXPÉDIER", texte: "les caisses en commençant par la dernière arrivée. Il en arrive de 1 à 4. Leur nombre et leurs couleurs changent d'un essai à l'autre : les numéros indiquent seulement l'ordre d'arrivée.",
      indice: "L'entrée est une file : la première arrivée sort en premier. Une pile fait l'inverse.",
      blocs: [...BASE, "repeter", "tantque"],
      configs: ["JVB", "R", "BRJV", "VJ"].map((m) => reception(m, inverser)),
      prog: [aller("E"), recevoir(aller("2")), ...transvaser("2", "S")], opt: 12 },
    { titre: "Colis urgents", verbe: "EXPÉDIER", texte: "d'abord les caisses rouges, puis les bleues. Dans chaque couleur, respecte la règle FIFO : première arrivée, première partie. Les numéros donnent l'ordre de départ attendu. Il arrive de 1 à 6 caisses (4 bleues au maximum), différentes à chaque essai.",
      indice: "L'entrée est une file (FIFO : première arrivée, première sortie). Une pile fait l'inverse (LIFO : dernière posée, première reprise). Les rouges partent tout de suite ; les bleues qui attendent sur une pile se retrouvent à l'envers. Comment les remettre à l'endroit ?",
      blocs: [...BASE, "repeter", "tantque", "si"],
      configs: ["BRBR", "RBBRBB", "BBR", "R", "BRBRBR"].map((m) => reception(m, urgents)),
      prog: [aller("E"), recevoir(si("rouge", [aller("S")], [aller("2")])), ...transvaser("2", "3"), ...transvaser("3", "S")], opt: 20 },
  ];
  /* Niveaux à départ variable (numéro -> générateur). Les « configs » fixes restent contrôlées
     en coulisses : elles couvrent les cas limites quel que soit le tirage. */
  for (const [no, nom] of [[6, "vider"], [7, "trierPile"], [9, "livrer"], [10, "troisCouleurs"], [11, "inverser"], [12, "urgents"]]) {
    NIVEAUX[no - 1].hasard = (alea = Math.random) => hasard[nom](alea);
  }
  NIVEAUX.forEach((n, i) => {
    n.groupe = i < 7 ? "Piles" : "Tapis";
    /* La condition « s'il y a une caisse ici » accompagne la boucle, pour qu'on les compare */
    if (n.blocs.includes("tantque")) n.blocs = [...n.blocs, "sicaisse"];
  });

  /* ---------- Exécution ---------- */
  const copier = (p) => Object.fromEntries(POSITIONS.map((k) => [k, [...(p[k] || [])]]));

  function executer(prog, depart, position = "1") {
    const etat = { piles: copier(depart), pos: position, main: null };
    const trace = [];
    let compte = 0;
    const arret = (code, id) => { throw { arret: { code, id } }; };
    const user = (id) => { if (++compte > LIMITE) arret("limite", id); };
    const noter = (c) => trace.push({ t: c.t, id: c.id, etat: { piles: copier(etat.piles), pos: etat.pos, main: etat.main } });

    function bloc(liste) {
      for (const c of liste) {
        user(c.id);
        const pile = etat.piles[etat.pos];
        if (c.t === "aller") { etat.pos = c.p; noter(c); }
        else if (c.t === "saisir") {
          if (etat.main) arret("saisir_plein", c.id);
          if (etat.pos === "S") arret("saisir_sortie", c.id);
          if (!pile.length) arret("saisir_vide", c.id);
          etat.main = etat.pos === "E" ? pile.shift() : pile.pop(); noter(c);
        } else if (c.t === "poser") {
          if (!etat.main) arret("poser_vide", c.id);
          if (etat.pos === "E") arret("poser_entree", c.id);
          if (etat.pos === "S") { if (pile.length >= CAPACITE_SORTIE) arret("sortie_pleine", c.id); }
          else if (pile.length >= HAUTEUR) arret("poser_pleine", c.id);
          pile.push(etat.main); etat.main = null; noter(c);
        } else if (c.t === "repeter") {
          for (let i = 0; i < c.n; i++) { user(c.id); bloc(c.corps); }
        } else if (c.t === "tantque") {
          while (etat.piles[etat.pos].length) { user(c.id); bloc(c.corps); }
        } else if (c.t === "sicaisse") {
          bloc(etat.piles[etat.pos].length ? c.alors : c.sinon);
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

  const memesPiles = (a, b) => POSITIONS.every((k) =>
    a[k].length === b[k].length && a[k].every((x, i) => x.l === b[k][i].l && x.c === b[k][i].c));

  /* La position de la pince au lancement est inconnue, comme sur une vraie machine : chaque
     configuration est contrôlée depuis toutes les positions.
     Défaut d'initialisation : tout réussit depuis au moins une position (« reussiDepuis »), mais
     pas depuis les autres. Sinon, c'est une erreur de logique.
     « montree » : position de pince affichée ; « tirage » : départ affiché, tiré au hasard, contrôlé
     en plus des cas fixes. Si le programme échoue sur ce qui est affiché, c'est cela qui est rejoué,
     sinon un essai raté (« cas » : le départ à montrer). */
  function verifier(niv, prog, montree, tirage) {
    const liste = tirage ? [tirage, ...niv.configs] : niv.configs;
    const essai = (i, pos) => {
      const { depart, objectif } = liste[i];
      const resultat = executer(prog, depart, pos);
      const motif = resultat.erreur ? "erreur" : resultat.etat.main ? "pince"
        : memesPiles(resultat.etat.piles, objectif) ? null : "piles";
      return { config: i, pos, resultat, motif };
    };
    /* Premier essai raté depuis chaque position (undefined : tout réussit depuis celle-là) */
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
    /* Par ordre de préférence : le départ tiré, puis le départ raté, depuis la position montrée */
    const candidats = montree ? [...(tirage ? [0] : []), premier.config].map((i) => essai(i, montree)) : [];
    const vu = candidats.find((e) => e.motif) || premier;
    return { reussi: false, initialisation: !!bonne, reussiDepuis: bonne, ...vu, cas: liste[vu.config] };
  }

  /* ---------- Python (lecture seule) ---------- */
  function lignes(prog, ind, prof, out) {
    const p = "    ".repeat(ind);
    const corps = (liste, plus = 0) => {
      if (liste.length) lignes(liste, ind + 1, prof + plus, out); else out.push(`${p}    pass`);
    };
    for (const c of prog) {
      if (c.t === "aller") out.push(`${p}aller(${{ S: '"sortie"', E: '"entrée"' }[c.p] || c.p})`);
      else if (c.t === "saisir" || c.t === "poser") out.push(`${p}${c.t}()`);
      else if (c.t === "repeter") { out.push(`${p}for ${"ijk"[prof] || "n" + prof} in range(${c.n}):`); corps(c.corps, 1); }
      else if (c.t === "tantque") { out.push(`${p}while caisse_presente():`); corps(c.corps); }
      else if (c.t === "si" || c.t === "sicaisse") {
        out.push(c.t === "si" ? `${p}if couleur_tenue() == "${c.c}":` : `${p}if caisse_presente():`); corps(c.alors);
        out.push(`${p}else:`); corps(c.sinon);
      }
    }
    return out;
  }
  const python = (prog) => [
    "# Fonctions propres à l'atelier : ce code ne s'exécute pas tel quel ailleurs.",
    "",
    ...(prog.length ? lignes(prog, 0, 0, []) : ["# (aucun bloc)"]),
  ].join("\n");

  const M = { HAUTEUR, CAPACITE_SORTIE, LIMITE, POSITIONS, ERREURS, NIVEAUX, executer, compter, verifier, python };
  if (typeof module !== "undefined" && module.exports) module.exports = M;
  else window.Manutention = M;
}

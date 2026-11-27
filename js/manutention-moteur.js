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
  /* Variables (groupe « Variables ») : une ou plusieurs par niveau, nommées (« compteur », « rouges »…).
     La mettre à une valeur, l'augmenter, la diminuer, la tester (op : lt <, gt >, eq =, ne ≠). */
  const mettre = (v, n) => ({ t: "mettre", v, n });
  const ajouter = (v, n = 1) => ({ t: "ajouter", v, n });
  const retirer = (v, n = 1) => ({ t: "retirer", v, n });
  const tantquevar = (v, op, n, ...corps) => ({ t: "tantquevar", v, op, n, corps });
  const sivar = (v, op, n, alors, sinon) => ({ t: "sivar", v, op, n, alors, sinon });
  /* Comparer deux variables (niveaux 36 et 37 : une variable ne se compare pas qu'à un nombre) */
  /* Répéter autant de fois que la valeur d'une variable (lue une fois, au début de la boucle) */
  const repetervar = (v, ...corps) => ({ t: "repetervar", v, corps });
  const tantquevar2 = (v, op, w, ...corps) => ({ t: "tantquevar2", v, op, w, corps });
  const sivar2 = (v, op, w, alors, sinon) => ({ t: "sivar2", v, op, w, alors, sinon });
  const OPS = { lt: (a, b) => a < b, gt: (a, b) => a > b, eq: (a, b) => a === b, ne: (a, b) => a !== b };
  const OPS_PY = { lt: "<", gt: ">", eq: "==", ne: "!=" };
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
        aller("2"), repeter(3, saisir(), aller("3"), poser(), aller("2"))],
      /* La solution fait 12 blocs ; objectif assoupli de 2 (jugé trop dur à l'essai, 27/11/2026) */
      opt: 14, marge: 2 },
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

  /* ---------- Groupe « Variables » (niveaux 28 à 37 de l'atelier) : le même bras, plus des variables ----------
     Classés par difficulté : lire une variable (28), la modifier (29 à 35), en comparer deux (36, 37).
     Chaque niveau nomme ses variables (« variables ») ; chaque cas donne leurs valeurs au lancement
     (« vars ») et, quand elles sont contrôlées, leurs valeurs attendues à la fin (« varsFin »).
     Une variable qui n'est pas une donnée de l'exercice contient au lancement un nombre quelconque :
     il faut l'initialiser, comme la pince. « donnees » : les variables dont la valeur au lancement
     est l'énoncé (affichées dans l'objectif). Dans les consignes et les indices, {nom} désigne une
     variable : affichée à part (italique, couleur), accolades retirées dans le PDF. */
  const arrivage = (motif) => [...motif].map((m, i) => caisse(String(i + 1), COULEUR[m]));
  const avec = (c, vars, varsFin) => ({ ...c, vars, ...(varsFin ? { varsFin } : {}) });
  const quelconque = (alea) => entier(alea, 1, 9);
  const RBJ = "RBJ";
  /* Tout livrer en comptant les caisses */
  const compterTout = (motif, compteur) => {
    const E = arrivage(motif);
    return avec(cas({ E }, { S: [...E] }), { compteur }, { compteur: E.length });
  };
  /* Commande : livrer « n » caisses sur les 6 de l'entrée */
  const commande = (motif, n) => {
    const E = arrivage(motif);
    return avec(cas({ E }, { S: E.slice(0, n), E: E.slice(n) }), { compteur: n });
  };
  /* Les 4 premières sur la pile 1, les suivantes sur la pile 2 */
  const deuxPiles = (motif, compteur) => {
    const E = arrivage(motif);
    return avec(cas({ E }, { 1: E.slice(0, 4), 2: E.slice(4) }), { compteur });
  };
  /* Piles sur mesure : « pile1 » caisses à l'emplacement 1, puis « pile2 » à l'emplacement 2 */
  const surMesure = (motif, pile1, pile2) => {
    const E = arrivage(motif);
    return avec(cas({ E }, { 1: E.slice(0, pile1), 2: E.slice(pile1, pile1 + pile2), E: E.slice(pile1 + pile2) }), { pile1, pile2 });
  };
  /* Tout livrer en comptant les rouges et les bleues */
  const rougesBleues = (motif, rouges, bleues) => {
    const E = arrivage(motif), nb = (c) => E.filter((x) => x.c === c).length;
    return avec(cas({ E }, { S: [...E] }), { rouges, bleues }, { rouges: nb("rouge"), bleues: nb("bleu") });
  };
  /* Une caisse sur trois (la 3e, la 6e…) au contrôle, à l'emplacement 3 ; les autres à la sortie */
  const uneSurTrois = (motif, compteur) => {
    const E = arrivage(motif);
    return avec(cas({ E }, { S: E.filter((_, i) => i % 3 !== 2), 3: E.filter((_, i) => i % 3 === 2) }), { compteur });
  };
  /* Autant de vertes : toute l'entrée part, puis autant de vertes de l'emplacement 1 (pile de 4).
     L'ordre de la sortie interdit d'alterner : il faut retenir le nombre. */
  const VERTES = Array.from({ length: 4 }, (_, i) => caisse(String(i + 1), "vert"));
  const autant = (motif, compteur) => {
    const E = arrivage(motif), P = [...VERTES], n = E.length;
    return avec(cas({ 1: P, E }, { S: [...E, ...[...P].reverse().slice(0, n)], 1: P.slice(0, 4 - n) }), { compteur });
  };
  /* Commande en double : « nombre » caisses à la sortie, puis autant à l'emplacement 3 */
  const double = (motif, nombre) => {
    const E = arrivage(motif);
    return avec(cas({ E }, { S: E.slice(0, nombre), 3: E.slice(nombre, 2 * nombre), E: E.slice(2 * nombre) }), { nombre });
  };
  /* Bon de commande : livrer « commande » caisses en les comptant dans « livraisons » ; la commande
     ne doit pas changer */
  const bon = (motif, commande, livraisons) => {
    const E = arrivage(motif);
    return avec(cas({ E }, { S: E.slice(0, commande), E: E.slice(commande) }), { commande, livraisons }, { commande, livraisons: commande });
  };
  /* Couleur majoritaire : rouges en 2, bleues en 3, puis la pile la plus haute part à la sortie */
  const majorite = (motif, rouges, bleues) => {
    const E = arrivage(motif), R = E.filter((x) => x.c === "rouge"), Bl = E.filter((x) => x.c === "bleu");
    const objectif = R.length > Bl.length ? { S: [...R].reverse(), 3: Bl } : { S: [...Bl].reverse(), 2: R };
    return avec(cas({ E }, objectif), { rouges, bleues });
  };
  /* Rouges et bleues, 4 au plus de chaque, jamais autant des deux */
  const motifMajorite = (alea) => {
    for (;;) {
      const m = motifAlea(alea, 1, 7, "RB"), r = [...m].filter((x) => x === "R").length, b = m.length - r;
      if (r <= 4 && b <= 4 && r !== b) return m;
    }
  };
  const QUELCONQUE = "Au lancement, le {compteur} contient un nombre quelconque.";

  const VARIABLES = [
    { titre: "Commande en double", verbe: "LIVRER", variables: ["nombre"], donnees: ["nombre"],
      texte: "à la sortie autant de caisses que vaut la variable {nombre}, PUIS le MÊME nombre à l'emplacement 3, dans l'ordre d'arrivée. {nombre} vaut de 1 à 3 et change d'un essai à l'autre. L'entrée contient 6 caisses ; les autres y restent.",
      indice: "Le bloc « répéter … fois » peut aussi recevoir une variable : « répéter {nombre} fois ». Deux boucles suffisent.",
      blocs: [...BASE, "repeter", "repetervar"],
      configs: [["JVBRBJ", 2], ["RBJVRB", 1], ["BBRJVR", 3]].map(([m, n]) => double(m, n)),
      hasard: (alea = Math.random) => double(motifAlea(alea, 6, 6, "RBJV"), entier(alea, 1, 3)),
      prog: [repetervar("nombre", aller("E"), saisir(), aller("S"), poser()),
        repetervar("nombre", aller("E"), saisir(), aller("3"), poser())], opt: 10 },
    { titre: "Compter les caisses", verbe: "LIVRER", variables: ["compteur"],
      texte: `toutes les caisses de l'entrée et les COMPTER : à la fin, le {compteur} doit valoir le nombre de caisses livrées. Il en arrive de 1 à 6. ${QUELCONQUE}`,
      indice: "Mets d'abord le {compteur} à 0, puis ajoute 1 à chaque caisse livrée.",
      blocs: [...BASE, "tantque", "mettre", "ajouter"],
      configs: [["JVB", 5], ["R", 0], ["BRJVRB", 9], ["VJ", 3]].map(([m, c]) => compterTout(m, c)),
      hasard: (alea = Math.random) => compterTout(motifAlea(alea, 1, 6, "RBJV"), quelconque(alea)),
      prog: [mettre("compteur", 0), aller("E"), tantque(saisir(), aller("S"), poser(), ajouter("compteur"), aller("E"))], opt: 8 },
    { titre: "La commande", verbe: "LIVRER", variables: ["compteur"], donnees: ["compteur"],
      texte: "autant de caisses que la commande en demande. Au lancement, le {compteur} contient le nombre de caisses commandées, de 1 à 5 ; l'entrée en contient 6. Les autres restent à l'entrée.",
      indice: "Après chaque caisse livrée, retire 1 au {compteur}. Il reste des caisses à livrer tant que le {compteur} est plus grand que 0.",
      blocs: [...BASE, "repeter", "tantque", "retirer", "tantquevar"],
      configs: [["JVBRBJ", 3], ["RBJVRB", 1], ["BBRJVR", 5], ["VJRBVJ", 2]].map(([m, n]) => commande(m, n)),
      hasard: (alea = Math.random) => commande(motifAlea(alea, 6, 6, "RBJV"), entier(alea, 1, 5)),
      prog: [tantquevar("compteur", "gt", 0, aller("E"), saisir(), aller("S"), poser(), retirer("compteur"))], opt: 6 },
    { titre: "Deux piles", verbe: "EMPILER", variables: ["compteur"],
      texte: `les caisses de l'entrée : les 4 premières arrivées à l'emplacement 1, les suivantes à l'emplacement 2. Il en arrive de 1 à 8. ${QUELCONQUE}`,
      indice: "Compte les caisses déjà posées : tant qu'il y en a moins de 4, la suivante va à l'emplacement 1.",
      blocs: [...BASE, "tantque", "mettre", "ajouter", "sivar"],
      configs: [["JVBRBJ", 6], ["R", 2], ["BBRJVRJB", 0], ["VJRB", 7], ["JVRBV", 4]].map(([m, c]) => deuxPiles(m, c)),
      hasard: (alea = Math.random) => deuxPiles(motifAlea(alea, 1, 8, "RBJV"), quelconque(alea)),
      prog: [mettre("compteur", 0), aller("E"), tantque(saisir(), sivar("compteur", "lt", 4, [aller("1")], [aller("2")]), poser(), ajouter("compteur"), aller("E"))], opt: 10 },
    { titre: "Piles sur mesure", verbe: "EMPILER", variables: ["pile1", "pile2"], donnees: ["pile1", "pile2"],
      texte: "les caisses de l'entrée dans l'ordre d'arrivée : d'abord autant de caisses à l'emplacement 1 que l'indique la variable {pile1}, puis autant à l'emplacement 2 que l'indique {pile2}. Ces nombres vont de 0 à 4 et changent d'un essai à l'autre. L'entrée contient 8 caisses ; les autres y restent.",
      indice: "Deux boucles, une par variable : tant que {pile1} est plus grand que 0, une caisse va à l'emplacement 1 et {pile1} diminue de 1.",
      blocs: [...BASE, "repeter", "tantque", "retirer", "tantquevar"],
      configs: [["RBJVRBJV", 3, 2], ["JJBBRRVV", 0, 4], ["BRJVBRJV", 4, 0], ["VRBJVRBJ", 1, 1], ["RRBBJJVV", 4, 4]].map(([m, a, b]) => surMesure(m, a, b)),
      hasard: (alea = Math.random) => surMesure(motifAlea(alea, 8, 8, "RBJV"), entier(alea, 0, 4), entier(alea, 0, 4)),
      prog: [tantquevar("pile1", "gt", 0, aller("E"), saisir(), aller("1"), poser(), retirer("pile1")),
        tantquevar("pile2", "gt", 0, aller("E"), saisir(), aller("2"), poser(), retirer("pile2"))], opt: 12 },
    { titre: "Rouges et bleues", verbe: "LIVRER", variables: ["rouges", "bleues"],
      texte: "toutes les caisses de l'entrée et les COMPTER par couleur : à la fin, la variable {rouges} doit valoir le nombre de caisses rouges, et {bleues} celui des bleues. Il arrive de 1 à 6 caisses. Au lancement, les deux variables contiennent un nombre quelconque.",
      indice: "Mets les deux variables à 0. Après avoir saisi une caisse, choisis laquelle augmenter selon sa couleur.",
      blocs: [...BASE, "tantque", "si", "mettre", "ajouter"],
      configs: [["RBBR", 3, 1], ["B", 6, 0], ["RRRBRR", 0, 7], ["BRB", 8, 8]].map(([m, r, b]) => rougesBleues(m, r, b)),
      hasard: (alea = Math.random) => rougesBleues(motifAlea(alea, 1, 6, "RB"), quelconque(alea), quelconque(alea)),
      prog: [mettre("rouges", 0), mettre("bleues", 0), aller("E"),
        tantque(saisir(), si("rouge", [ajouter("rouges")], [ajouter("bleues")]), aller("S"), poser(), aller("E"))], opt: 11 },
    { titre: "Contrôle qualité", verbe: "EXPÉDIER", variables: ["compteur"],
      texte: `les caisses de l'entrée, sauf une sur trois : la 3e, la 6e… arrivée part au contrôle, à l'emplacement 3. Il en arrive de 1 à 8. ${QUELCONQUE}`,
      indice: "Compte les caisses : quand le {compteur} arrive à 3, la caisse part au contrôle et le {compteur} repart de 0.",
      blocs: [...BASE, "tantque", "mettre", "ajouter", "sivar"],
      configs: [["RBJVRBJV", 4], ["JV", 0], ["BRJ", 7], ["RBJVRB", 2], ["V", 3]].map(([m, c]) => uneSurTrois(m, c)),
      hasard: (alea = Math.random) => uneSurTrois(motifAlea(alea, 1, 8, RBJ), quelconque(alea)),
      prog: [mettre("compteur", 0), aller("E"), tantque(saisir(), ajouter("compteur"),
        sivar("compteur", "eq", 3, [aller("3"), mettre("compteur", 0)], [aller("S")]), poser(), aller("E"))], opt: 11 },
    { titre: "Autant de vertes", verbe: "LIVRER", variables: ["compteur"],
      texte: `toutes les caisses de l'entrée, PUIS le MÊME nombre de caisses vertes de l'emplacement 1. Il arrive de 1 à 3 caisses. ${QUELCONQUE}`,
      indice: "Compte les caisses de l'entrée pendant que tu les livres. Ensuite, livre une verte et retire 1 au {compteur}, tant qu'il est plus grand que 0.",
      blocs: [...BASE, "tantque", "mettre", "ajouter", "retirer", "tantquevar"],
      configs: [["RBJ", 5], ["J", 0], ["BR", 8], ["RRJ", 2]].map(([m, c]) => autant(m, c)),
      hasard: (alea = Math.random) => autant(motifAlea(alea, 1, 3, RBJ), quelconque(alea)),
      prog: [mettre("compteur", 0), aller("E"), tantque(saisir(), aller("S"), poser(), ajouter("compteur"), aller("E")),
        tantquevar("compteur", "gt", 0, aller("1"), saisir(), aller("S"), poser(), retirer("compteur"))], opt: 14 },
    { titre: "Bon de commande", verbe: "LIVRER", variables: ["commande", "livraisons"], donnees: ["commande"],
      texte: "autant de caisses que la commande en demande, en les COMPTANT dans {livraisons}. La variable {commande} (de 1 à 5) ne doit pas changer : à la fin, {livraisons} doit être égale à {commande}. L'entrée contient 6 caisses ; les autres y restent. Au lancement, {livraisons} contient un nombre quelconque.",
      indice: "Une variable peut se comparer à une autre : répète tant que {livraisons} est plus petite que {commande}.",
      blocs: [...BASE, "tantque", "mettre", "ajouter", "retirer", "tantquevar", "tantquevar2"],
      configs: [["JVBRBJ", 3, 7], ["RBJVRB", 1, 0], ["BBRJVR", 5, 2], ["VJRBVJ", 2, 9]].map(([m, c, l]) => bon(m, c, l)),
      hasard: (alea = Math.random) => bon(motifAlea(alea, 6, 6, "RBJV"), entier(alea, 1, 5), quelconque(alea)),
      prog: [mettre("livraisons", 0), tantquevar2("livraisons", "lt", "commande", aller("E"), saisir(), aller("S"), poser(), ajouter("livraisons"))], opt: 7 },
    { titre: "La couleur majoritaire", verbe: "TRIER", variables: ["rouges", "bleues"],
      texte: "les caisses de l'entrée : les rouges à l'emplacement 2, les bleues à l'emplacement 3. Ensuite, LIVRER toute la pile de la couleur la plus nombreuse ; l'autre reste en place. Il arrive de 1 à 7 caisses, 4 au plus de chaque couleur, jamais autant de rouges que de bleues. Au lancement, {rouges} et {bleues} contiennent un nombre quelconque.",
      indice: "Compte les rouges et les bleues pendant le tri. Puis compare les deux variables : si {rouges} > {bleues}, vide l'emplacement 2, sinon l'emplacement 3.",
      blocs: [...BASE, "tantque", "si", "mettre", "ajouter", "sivar2"],
      configs: [["RBBRR", 4, 0], ["B", 0, 6], ["RRRBBBB", 2, 2], ["BRB", 9, 1], ["RRRR", 5, 5]].map(([m, r, b]) => majorite(m, r, b)),
      hasard: (alea = Math.random) => majorite(motifMajorite(alea), quelconque(alea), quelconque(alea)),
      prog: [mettre("rouges", 0), mettre("bleues", 0), aller("E"),
        tantque(saisir(), si("rouge", [aller("2"), ajouter("rouges")], [aller("3"), ajouter("bleues")]), poser(), aller("E")),
        /* Choisir la pile une première fois, puis à chaque retour : plus court que deux boucles */
        sivar2("rouges", "gt", "bleues", [aller("2")], [aller("3")]),
        tantque(saisir(), aller("S"), poser(), sivar2("rouges", "gt", "bleues", [aller("2")], [aller("3")]))], opt: 22 },
  ];
  VARIABLES.forEach((n) => {
    n.groupe = "Variables";
    if (n.blocs.includes("tantque")) n.blocs = [...n.blocs, "sicaisse"];
  });

  /* ---------- Exécution ---------- */
  const copier = (p) => Object.fromEntries(POSITIONS.map((k) => [k, [...(p[k] || [])]]));

  function executer(prog, depart, position = "1", vars = {}) {
    const etat = { piles: copier(depart), pos: position, main: null, vars: { ...vars } };
    const trace = [];
    let compte = 0;
    const arret = (code, id) => { throw { arret: { code, id } }; };
    const user = (id) => { if (++compte > LIMITE) arret("limite", id); };
    const noter = (c) => trace.push({ t: c.t, id: c.id, ...(c.v === undefined ? {} : { v: c.v }), etat: { piles: copier(etat.piles), pos: etat.pos, main: etat.main, vars: { ...etat.vars } } });

    /* Variable jamais définie (programme d'un autre niveau) : 0 */
    const valeur = (v) => etat.vars[v] || 0;
    /* Comparaison à un nombre (« n ») ou à une autre variable (« w ») */
    const vrai = (c) => OPS[c.op](valeur(c.v), c.w === undefined ? c.n : valeur(c.w));
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
        } else if (c.t === "repetervar") {
          for (let i = 0, n = valeur(c.v); i < n; i++) { user(c.id); bloc(c.corps); }
        } else if (c.t === "tantque") {
          while (etat.piles[etat.pos].length) { user(c.id); bloc(c.corps); }
        } else if (c.t === "sicaisse") {
          bloc(etat.piles[etat.pos].length ? c.alors : c.sinon);
        } else if (c.t === "si") {
          if (!etat.main) arret("si_vide", c.id);
          bloc(etat.main.c === c.c ? c.alors : c.sinon);
        } else if (c.t === "mettre") { etat.vars[c.v] = c.n; noter(c); }
        else if (c.t === "ajouter") { etat.vars[c.v] = valeur(c.v) + c.n; noter(c); }
        else if (c.t === "retirer") { etat.vars[c.v] = valeur(c.v) - c.n; noter(c); }
        else if (c.t === "tantquevar" || c.t === "tantquevar2") {
          while (vrai(c)) { user(c.id); bloc(c.corps); }
        } else if (c.t === "sivar" || c.t === "sivar2") {
          bloc(vrai(c) ? c.alors : c.sinon);
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
      const { depart, objectif, vars, varsFin } = liste[i];
      const resultat = executer(prog, depart, pos, vars);
      const motif = resultat.erreur ? "erreur" : resultat.etat.main ? "pince"
        : !memesPiles(resultat.etat.piles, objectif) ? "piles"
        : varsFin && Object.entries(varsFin).some(([v, n]) => (resultat.etat.vars[v] || 0) !== n) ? "variables" : null;
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
      else if (c.t === "repeter" || c.t === "repetervar") { out.push(`${p}for ${"ijk"[prof] || "n" + prof} in range(${c.t === "repeter" ? c.n : c.v}):`); corps(c.corps, 1); }
      else if (c.t === "tantque") { out.push(`${p}while caisse_presente():`); corps(c.corps); }
      else if (c.t === "mettre") out.push(`${p}${c.v} = ${c.n}`);
      else if (c.t === "ajouter") out.push(`${p}${c.v} = ${c.v} + ${c.n}`);
      else if (c.t === "retirer") out.push(`${p}${c.v} = ${c.v} - ${c.n}`);
      else if (c.t === "tantquevar" || c.t === "tantquevar2") { out.push(`${p}while ${c.v} ${OPS_PY[c.op]} ${c.w ?? c.n}:`); corps(c.corps); }
      else if (c.t === "sivar" || c.t === "sivar2") {
        out.push(`${p}if ${c.v} ${OPS_PY[c.op]} ${c.w ?? c.n}:`); corps(c.alors);
        out.push(`${p}else:`); corps(c.sinon);
      }
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

  const M = { HAUTEUR, CAPACITE_SORTIE, LIMITE, POSITIONS, ERREURS, NIVEAUX, VARIABLES, executer, compter, verifier, python };
  if (typeof module !== "undefined" && module.exports) module.exports = M;
  else window.Manutention = M;
}

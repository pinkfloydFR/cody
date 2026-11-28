/* Moteur du centre de tri (niveaux 13 à 18) : aucun accès à la page, testable avec Node. Aucun eval.
   Même interface que manutention-moteur.js (executer, verifier, compter, python).

   Entrée (file) -> plateau 1 -> plateau 2 -> sortie C
   plateau 1 : « droit », « A » ou « attente » (voie sans issue : une pile) ; plateau 2 : « droit » ou « B » */
{
  const CAPACITE = { A: 6, B: 6, C: 6, attente: 4 };
  const LIMITE = 500;
  const DIRECTIONS = { 1: ["droit", "A", "attente"], 2: ["droit", "B"] };
  /* « positions » de départ : toutes les orientations des deux plateaux, écrites « d1,d2 » */
  const POSITIONS = DIRECTIONS[1].flatMap((a) => DIRECTIONS[2].map((b) => `${a},${b}`));
  const SORTIES = ["A", "B", "C"];

  const ERREURS = {
    entree_vide: "Aucune caisse n'attend à l'entrée.",
    alignement_entree: "Le plateau 1 n'est pas aligné avec l'entrée : oriente-le vers « le plateau 2 » (en ligne droite avec l'entrée) avant de faire entrer une caisse.",
    alignement_attente: "Le plateau 1 n'est pas aligné avec la voie d'attente : oriente-le vers « l'attente » avant de rappeler une caisse.",
    alignement_plateau2: "Le plateau 2 n'est pas aligné avec le tapis venant du plateau 1 : oriente-le vers « la sortie C » (en ligne droite) avant d'envoyer la caisse.",
    occupe: "Le plateau 1 est déjà occupé : envoie d'abord sa caisse.",
    plateau_vide: "Ce plateau est vide : il n'y a rien à envoyer.",
    collision: "Collision : le plateau 2 est déjà occupé. Envoie d'abord sa caisse.",
    direction: "Cette direction n'existe pas sur ce plateau (A et attente : plateau 1 ; B : plateau 2).",
    attente_vide: "La voie d'attente est vide.",
    attente_pleine: `La voie d'attente est pleine : ${CAPACITE.attente} caisses au maximum.`,
    sortie_pleine: "Cette sortie est pleine : 6 caisses au maximum.",
    si_vide: "Ce plateau est vide : aucune caisse dont tester la couleur.",
    limite: `Le programme dépasse ${LIMITE} actions : vérifie tes boucles.`,
  };

  /* ---------- Instructions ---------- */
  const entrer = () => ({ t: "entrer" });
  const rappeler = () => ({ t: "rappeler" });
  const envoyer = (n) => ({ t: "envoyer", n });
  const orienter = (n, d) => ({ t: "orienter", n, d });
  const repeter = (n, ...corps) => ({ t: "repeter", n, corps });
  const tantque = (ou, ...corps) => ({ t: "tantque", ou, corps });
  const sicaisse = (ou, alors, sinon = []) => ({ t: "sicaisse", ou, alors, sinon });
  const si = (n, c, alors, sinon) => ({ t: "si", n, c, alors, sinon });

  /* ---------- Arrivages : R rouge, B bleue, J jaune, V verte ; numéros dans l'ordre d'arrivée ---------- */
  const COULEUR = { R: "rouge", B: "bleu", J: "jaune", V: "vert" };
  const arrivage = (motif) => [...motif].map((m, i) => ({ l: String(i + 1), c: COULEUR[m] }));
  const cas = (motif, regle) => {
    const entree = arrivage(motif);
    return { depart: { entree, attente: [], A: [], B: [], C: [] }, objectif: { A: [], B: [], C: [], ...regle(entree) } };
  };
  const de = (couleur) => (l) => l.filter((x) => x.c === couleur);
  const rouges = de("rouge"), bleues = de("bleu"), jaunes = de("jaune");
  const entier = (alea, mini, maxi) => mini + Math.floor(alea() * (maxi - mini + 1));
  const motifAlea = (alea, mini, maxi, couleurs) =>
    Array.from({ length: entier(alea, mini, maxi) }, () => couleurs[entier(alea, 0, couleurs.length - 1)]).join("");
  /* au plus 4 bleues : les suivantes deviennent rouges */
  const quatreBleues = (motif) => {
    let n = 0;
    return [...motif].map((m) => (m === "B" && ++n > 4 ? "R" : m)).join("");
  };

  const niveau = (o, regle, tirer, motifs) => ({
    ...o, groupe: "Convoyeurs", opt: o.opt,
    configs: motifs.map((m) => cas(m, regle)),
    hasard: (alea = Math.random) => cas(tirer(alea), regle),
  });
  const COMMUN = ["entrer", "orienter", "envoyer", "repeter", "tantque"];
  const CHANGE = " Leur nombre et leurs couleurs changent d'un essai à l'autre.";

  const NIVEAUX = [
    niveau({ titre: "Premier aiguillage", verbe: "ENVOYER", texte: "toutes les caisses vers la sortie A. Il en arrive de 1 à 6." + CHANGE,
      indice: "Pour recevoir une caisse, le plateau doit être aligné avec le tapis d'où elle vient. Pour l'aligner avec l'entrée, oriente-le vers le plateau 2 ; fais entrer la caisse, puis tourne-le vers la sortie.",
      blocs: COMMUN, opt: 5,
      prog: [tantque("entree", orienter(1, "droit"), entrer(), orienter(1, "A"), envoyer(1))] },
      (e) => ({ A: [...e] }), (alea) => motifAlea(alea, 1, 6, "RBJV"), ["JVB", "R", "BRJVRB", "VJ"]),

    niveau({ titre: "Rouges à part", verbe: "TRIER", texte: "les caisses : les rouges vers la sortie A, toutes les autres vers la sortie C." + CHANGE,
      indice: "Avant chaque arrivée, remets le plateau 1 face à l'entrée. Pour aller en C, la caisse traverse les deux plateaux, qui doivent être alignés.",
      blocs: [...COMMUN, "si"], opt: 9,
      prog: [orienter(2, "droit"), tantque("entree", orienter(1, "droit"), entrer(),
        si(1, "rouge", [orienter(1, "A"), envoyer(1)], [envoyer(1), envoyer(2)]))] },
      (e) => ({ A: rouges(e), C: e.filter((x) => x.c !== "rouge") }), (alea) => motifAlea(alea, 1, 6, "RRBJ"),
      ["RBRJ", "BJB", "RRR", "J", "RBBRJR"]),

    niveau({ titre: "Trois destinations", verbe: "TRIER", texte: "les caisses : les rouges en A, les bleues en B, les jaunes en C." + CHANGE,
      indice: "Teste la couleur au plateau 1. Avant de lui envoyer une caisse, vérifie que le plateau 2 est aligné : tu le tourneras vers B seulement quand la caisse sera dessus.",
      blocs: [...COMMUN, "si"], opt: 11,
      prog: [tantque("entree", orienter(1, "droit"), entrer(), si(1, "rouge", [orienter(1, "A"), envoyer(1)],
        [orienter(2, "droit"), envoyer(1), si(2, "bleu", [orienter(2, "B")], []), envoyer(2)]))] },
      (e) => ({ A: rouges(e), B: bleues(e), C: jaunes(e) }), (alea) => motifAlea(alea, 1, 6, "RBJ"),
      ["JBR", "R", "BBJ", "J", "RJBJRB"]),

    niveau({ titre: "Une sur deux", verbe: "RÉPARTIR", texte: "les caisses en alternant : la 1re en A, la 2e en B, la 3e en A, et ainsi de suite, quelle que soit la couleur. Il en arrive de 1 à 6.",
      indice: "Pas besoin de compter : à chaque tour de boucle, traite deux caisses. Mais la deuxième existe-t-elle toujours ?",
      blocs: [...COMMUN, "sicaisse"], opt: 12,
      prog: [tantque("entree", orienter(1, "droit"), entrer(), orienter(1, "A"), envoyer(1),
        sicaisse("entree", [orienter(1, "droit"), entrer(), orienter(2, "droit"), envoyer(1), orienter(2, "B"), envoyer(2)]))] },
      (e) => ({ A: e.filter((_, i) => i % 2 === 0), B: e.filter((_, i) => i % 2 === 1) }),
      (alea) => motifAlea(alea, 1, 6, "RBJV"), ["JVBR", "R", "BRJ", "VJRBVJ", "RBVJR"]),

    niveau({ titre: "Ordre inversé", verbe: "EXPÉDIER", texte: "toutes les caisses vers la sortie C, la dernière arrivée en premier. Il en arrive de 1 à 4.",
      indice: "La voie d'attente est sans issue : la dernière caisse garée ressort la première. Pour la rappeler, le plateau 1 doit être tourné vers l'attente.",
      blocs: [...COMMUN, "rappeler", "sicaisse"], opt: 12,
      prog: [tantque("entree", orienter(1, "droit"), entrer(), orienter(1, "attente"), envoyer(1)), orienter(2, "droit"),
        tantque("attente", orienter(1, "attente"), rappeler(), orienter(1, "droit"), envoyer(1), envoyer(2))] },
      (e) => ({ C: [...e].reverse() }), (alea) => motifAlea(alea, 1, 4, "RBJV"), ["JVB", "R", "BRJV", "VJ"]),

    niveau({ titre: "Chargement du camion", verbe: "CHARGER", texte: "les rouges partent en A et les jaunes en B dès leur arrivée. Les bleues partent ensuite en C, la dernière arrivée en premier. Il arrive de 1 à 6 caisses, dont 4 bleues au maximum.",
      indice: "Traite d'abord tout l'arrivage en garant les bleues. Vide ensuite la voie d'attente.",
      blocs: [...COMMUN, "rappeler", "sicaisse", "si"], opt: 20,
      prog: [tantque("entree", orienter(1, "droit"), entrer(), si(1, "rouge", [orienter(1, "A"), envoyer(1)],
        [si(1, "jaune", [orienter(2, "droit"), envoyer(1), orienter(2, "B"), envoyer(2)], [orienter(1, "attente"), envoyer(1)])])),
      orienter(2, "droit"),
      tantque("attente", orienter(1, "attente"), rappeler(), orienter(1, "droit"), envoyer(1), envoyer(2))] },
      (e) => ({ A: rouges(e), B: jaunes(e), C: bleues(e).reverse() }),
      (alea) => quatreBleues(motifAlea(alea, 1, 6, "RJBB")), ["BRJB", "BBBBRJ", "RJ", "B", "JBRBJB"]),
  ];

  /* ---------- Exécution ---------- */
  const copier = (d) => ({ entree: [...(d.entree || [])], attente: [...(d.attente || [])], A: [...(d.A || [])], B: [...(d.B || [])], C: [...(d.C || [])] });
  const photo = (e) => ({ ...copier(e), p1: e.p1, p2: e.p2, dir: { ...e.dir } });

  function executer(prog, depart, position = POSITIONS[0]) {
    const [d1, d2] = position.split(",");
    const etat = { ...copier(depart), p1: null, p2: null, dir: { 1: d1, 2: d2 } };
    const trace = [];
    let compte = 0;
    const arret = (code, id) => { throw { arret: { code, id } }; };
    const user = (id) => { if (++compte > LIMITE) arret("limite", id); };
    const noter = (c) => trace.push({ t: c.t, n: c.n, d: c.d, id: c.id, instruction: c, etat: photo(etat) });
    const presente = (ou) => etat[ou].length > 0;
    const ranger = (voie, caisse, id) => {
      if (etat[voie].length >= CAPACITE[voie]) arret(voie === "attente" ? "attente_pleine" : "sortie_pleine", id);
      etat[voie].push(caisse);
    };

    function bloc(liste) {
      for (const c of liste) {
        user(c.id);
        if (c.t === "entrer" || c.t === "rappeler") {
          const voie = c.t === "entrer" ? "entree" : "attente";
          if (!presente(voie)) arret(c.t === "entrer" ? "entree_vide" : "attente_vide", c.id);
          if (etat.p1) arret("occupe", c.id);
          /* Une caisse ne monte que sur un plateau aligné avec le tapis d'où elle vient */
          if (etat.dir[1] !== (voie === "entree" ? "droit" : "attente")) {
            arret(voie === "entree" ? "alignement_entree" : "alignement_attente", c.id);
          }
          etat.p1 = c.t === "entrer" ? etat.entree.shift() : etat.attente.pop();
          noter(c);
        } else if (c.t === "orienter") {
          if (!DIRECTIONS[c.n].includes(c.d)) arret("direction", c.id);
          etat.dir[c.n] = c.d;
          noter(c);
        } else if (c.t === "envoyer") {
          const cle = "p" + c.n, caisse = etat[cle], d = etat.dir[c.n];
          if (!caisse) arret("plateau_vide", c.id);
          if (c.n === 1 && d === "droit") {
            if (etat.p2) arret("collision", c.id);
            if (etat.dir[2] !== "droit") arret("alignement_plateau2", c.id);
            etat.p2 = caisse;
          } else ranger(d === "droit" ? "C" : d, caisse, c.id);
          etat[cle] = null;
          noter(c);
        } else if (c.t === "repeter") {
          for (let i = 0; i < c.n; i++) { user(c.id); bloc(c.corps); }
        } else if (c.t === "tantque") {
          while (presente(c.ou)) { user(c.id); bloc(c.corps); }
        } else if (c.t === "sicaisse") {
          bloc(presente(c.ou) ? c.alors : c.sinon);
        } else if (c.t === "si") {
          const caisse = etat["p" + c.n];
          if (!caisse) arret("si_vide", c.id);
          bloc(caisse.c === c.c ? c.alors : c.sinon);
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

  /* null si tout est conforme ; « reste » : une caisse n'est pas partie ; « sorties » : mauvais tri ou ordre */
  function conforme(etat, objectif) {
    if (etat.entree.length || etat.attente.length || etat.p1 || etat.p2) return "reste";
    const memes = SORTIES.every((s) => etat[s].length === objectif[s].length &&
      etat[s].every((x, i) => x.l === objectif[s][i].l && x.c === objectif[s][i].c));
    return memes ? null : "sorties";
  }

  /* Même contrat que Manutention.verifier : cas fixes + départ tiré, depuis toutes les orientations */
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
  const NOMS = { A: "sortie A", B: "sortie B", attente: "attente" };
  const nom = (n, d) => (d === "droit" ? { 1: "plateau 2", 2: "sortie C" }[n] : NOMS[d]);
  const TEST = { entree: "caisse_a_l_entree()", attente: "caisse_en_attente()" };
  function lignes(prog, ind, prof, out) {
    const p = "    ".repeat(ind);
    const corps = (l, plus = 0) => { if (l.length) lignes(l, ind + 1, prof + plus, out); else out.push(`${p}    pass`); };
    for (const c of prog) {
      if (c.t === "entrer") out.push(`${p}faire_entrer()`);
      else if (c.t === "rappeler") out.push(`${p}rappeler()`);
      else if (c.t === "envoyer") out.push(`${p}envoyer(${c.n})`);
      else if (c.t === "orienter") out.push(`${p}orienter(${c.n}, "${nom(c.n, c.d)}")`);
      else if (c.t === "repeter") { out.push(`${p}for ${"ijk"[prof] || "n" + prof} in range(${c.n}):`); corps(c.corps, 1); }
      else if (c.t === "tantque") { out.push(`${p}while ${TEST[c.ou]}:`); corps(c.corps); }
      else {
        out.push(c.t === "si" ? `${p}if couleur_plateau(${c.n}) == "${c.c}":` : `${p}if ${TEST[c.ou]}:`);
        corps(c.alors); out.push(`${p}else:`); corps(c.sinon);
      }
    }
    return out;
  }
  const python = (prog) => [
    "# Fonctions propres à l'atelier : ce code ne s'exécute pas tel quel ailleurs.", "",
    ...(prog.length ? lignes(prog, 0, 0, []) : ["# (aucun bloc)"]),
  ].join("\n");

  const M = { CAPACITE, LIMITE, POSITIONS, ERREURS, NIVEAUX, executer, compter, verifier, conforme, python };
  if (typeof module !== "undefined" && module.exports) module.exports = M;
  else window.Tri = M;
}

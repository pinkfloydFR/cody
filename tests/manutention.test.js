const test = require("node:test");
const assert = require("node:assert/strict");
const M = require("../js/manutention-moteur.js");

const aller = (p) => ({ t: "aller", p });
const saisir = (id) => ({ t: "saisir", id });
const poser = (id) => ({ t: "poser", id });
const piles = (o = {}) => ({ 1: [], 2: [], 3: [], S: [], E: [], ...o });
const A = { l: "A", c: "bleu" }, B = { l: "B", c: "rouge" };

test("il y a 12 niveaux : 7 sur les piles, 5 avec les tapis", () => {
  assert.deepEqual(M.NIVEAUX.map((n) => n.groupe), [...Array(7).fill("Piles"), ...Array(5).fill("Tapis")]);
});

M.NIVEAUX.forEach((niv, i) => {
  test(`niveau ${i + 1} : la solution réussit avec le nombre optimal de blocs`, () => {
    const r = M.verifier(niv, niv.prog);
    assert.equal(r.reussi, true, JSON.stringify(r));
    assert.equal(M.compter(niv.prog), niv.opt);
  });
  test(`niveau ${i + 1} : un programme vide échoue`, () => assert.equal(M.verifier(niv, []).reussi, false));
});

test("optima attendus (initialisation comprise)", () => assert.deepEqual(M.NIVEAUX.map((n) => n.opt), [4, 12, 20, 12, 6, 6, 8, 6, 6, 10, 12, 20]));

/* La pince part d'une position inconnue : sans initialisation, le programme doit échouer. */
M.NIVEAUX.forEach((niv, i) => {
  test(`niveau ${i + 1} : réussi depuis chacune des positions de la pince`, () => {
    for (const { depart, objectif } of niv.configs) {
      for (const pos of M.POSITIONS) {
        const r = M.executer(niv.prog, depart, pos);
        assert.equal(r.erreur, null, pos);
        assert.deepEqual(r.etat.piles, objectif, pos);
      }
    }
  });
  test(`niveau ${i + 1} : sans le premier « aller », refusé pour défaut d'initialisation`, () => {
    assert.equal(niv.prog[0].t, "aller");
    const r = M.verifier(niv, niv.prog.slice(1));
    assert.equal(r.reussi, false);
    assert.equal(r.initialisation, true);
    assert.equal(r.reussiDepuis, niv.prog[0].p);
    assert.notEqual(r.pos, r.reussiDepuis);
  });
});

test("une erreur de logique n'est pas présentée comme un défaut d'initialisation", () => {
  const r = M.verifier(M.NIVEAUX[0], [aller("1"), saisir()]);
  assert.equal(r.initialisation, false);
  assert.equal(r.pos, "1");
});

test("la position de départ de la pince est respectée", () => {
  const r = M.executer([saisir()], piles({ 3: [A] }), "3");
  assert.equal(r.erreur, null);
  assert.deepEqual(r.etat.main, A);
});

test("mauvais ordre refusé", () => {
  const niv = { configs: [{ depart: piles({ 1: [A, B] }), objectif: piles({ 3: [A, B] }) }] };
  const inverse = [saisir(), aller("3"), poser(), aller("1"), saisir(), aller("3"), poser()];
  const r = M.verifier(niv, inverse);
  assert.equal(r.reussi, false);
  assert.equal(r.motif, "piles");
});

test("caisse restée dans la pince refusée", () => {
  const niv = { configs: [{ depart: piles({ 1: [A] }), objectif: piles() }] };
  const r = M.verifier(niv, [saisir()]);
  assert.equal(r.motif, "pince");
});

test("niveau 6 : une solution en dur échoue", () => {
  const dur = [{ t: "repeter", n: 3, corps: [saisir(), aller("S"), poser(), aller("1")] }];
  const r = M.verifier(M.NIVEAUX[5], dur);
  assert.equal(r.reussi, false);
  assert.ok(r.config > 0, "échec sur une autre configuration que la première");
});

test("niveau 7 : une solution en dur échoue", () => {
  const vers = (p) => [saisir(), aller(p), poser(), aller("1")];
  const depart = M.NIVEAUX[6].configs[0].depart[1];
  const dur = [...depart].reverse().flatMap((c) => vers(c.c === "rouge" ? "S" : "3"));
  const r = M.verifier(M.NIVEAUX[6], dur);
  assert.equal(r.reussi, false);
  assert.ok(r.config > 0);
});

for (const [code, depart, prog] of [
  ["saisir_vide", piles(), [saisir("x")]],
  ["saisir_plein", piles({ 1: [A, B] }), [saisir(), saisir("x")]],
  ["poser_vide", piles(), [poser("x")]],
  ["poser_pleine", piles({ 1: [A], 2: [A, A, A, A] }), [saisir(), aller("2"), poser("x")]],
  ["si_vide", piles(), [{ t: "si", c: "rouge", alors: [], sinon: [], id: "x" }]],
]) {
  test(`erreur ${code} : arrêt sur le bloc fautif`, () => {
    const r = M.executer(prog, depart);
    assert.deepEqual(r.erreur, { code, id: "x" });
    assert.ok(M.ERREURS[code]);
  });
}

for (const [nom, corps] of [["vide", []], ["sans effet", [aller("1")]]]) {
  test(`boucle « tant que » ${nom} : arrêt par la limite`, () => {
    const r = M.executer([{ t: "tantque", corps, id: "x" }], piles({ 1: [A] }));
    assert.equal(r.erreur.code, "limite");
  });
}

test("répétitions énormes : arrêt par la limite", () => {
  const r = M.executer([{ t: "repeter", n: 100, corps: [{ t: "repeter", n: 100, corps: [] }] }], piles());
  assert.equal(r.erreur.code, "limite");
});

test("le départ n'est jamais modifié et la trace garde chaque état", () => {
  const depart = piles({ 1: [A] });
  const r = M.executer([saisir("a"), aller("2"), poser()], depart);
  assert.deepEqual(depart, piles({ 1: [A] }));
  assert.deepEqual(r.trace.map((e) => e.t), ["saisir", "aller", "poser"]);
  assert.deepEqual(r.trace[0].etat.main, A);
  assert.deepEqual(r.etat.piles, piles({ 2: [A] }));
});

test("Python : boucles imbriquées, condition, branches vides", () => {
  const code = M.python([{ t: "tantque", corps: [saisir(), { t: "si", c: "rouge", alors: [aller("S")], sinon: [] }, poser()] }]);
  assert.match(code, /# Fonctions propres à l'atelier/);
  assert.match(code, /while caisse_presente\(\):\n    saisir\(\)\n    if couleur_tenue\(\) == "rouge":\n        aller\("sortie"\)\n    else:\n        pass\n    poser\(\)/);
});

test("un programme faux est rejoué depuis la position montrée à l'élève, pas toujours depuis « 1 »", () => {
  const faux = [aller("1"), saisir()];
  for (const montree of M.POSITIONS) {
    const r = M.verifier(M.NIVEAUX[0], faux, montree);
    assert.equal(r.pos, montree);
    assert.equal(r.motif, "pince");
    assert.equal(r.initialisation, false);
  }
});

test("défaut d'initialisation : si la position montrée réussit, on rejoue une position qui échoue", () => {
  const r = M.verifier(M.NIVEAUX[0], M.NIVEAUX[0].prog.slice(1), "1");
  assert.equal(r.initialisation, true);
  assert.notEqual(r.pos, "1");
});

test("défaut d'initialisation : la position montrée est gardée si elle échoue", () => {
  const r = M.verifier(M.NIVEAUX[0], M.NIVEAUX[0].prog.slice(1), "3");
  assert.equal(r.initialisation, true);
  assert.equal(r.pos, "3");
});

/* ---------- Tapis ---------- */
const C = { l: "C", c: "jaune" };

test("l'entrée est une file : la première arrivée est la première saisie", () => {
  const r = M.executer([aller("E"), saisir()], piles({ E: [A, B, C] }));
  assert.deepEqual(r.etat.main, A);
  assert.deepEqual(r.etat.piles.E, [B, C]);
});

test("la sortie garde l'ordre de livraison", () => {
  const un = [aller("E"), saisir(), aller("S"), poser()];
  const r = M.executer([...un, ...un], piles({ E: [A, B] }));
  assert.deepEqual(r.etat.piles.S, [A, B]);
});

for (const [code, depart, prog] of [
  ["poser_entree", piles({ 1: [A] }), [aller("1"), saisir(), aller("E"), poser("x")]],
  ["saisir_sortie", piles({ S: [A] }), [aller("S"), saisir("x")]],
  ["sortie_pleine", piles({ 1: [A], S: [A, A, A, A, A, A] }), [aller("1"), saisir(), aller("S"), poser("x")]],
]) {
  test(`erreur ${code} : arrêt sur le bloc fautif`, () => {
    assert.deepEqual(M.executer(prog, depart).erreur, { code, id: "x" });
    assert.ok(M.ERREURS[code]);
  });
}

test("la sortie accepte 6 caisses (les emplacements 4)", () => {
  const livrer = [aller("E"), { t: "tantque", corps: [saisir(), aller("S"), poser(), aller("E")] }];
  assert.equal(M.executer(livrer, piles({ E: [A, A, A, A, A, A] })).erreur, null);
});

for (const i of [8, 9, 10, 11]) {
  test(`niveau ${i + 1} : plusieurs arrivages différents, dans les limites des postes`, () => {
    const { configs } = M.NIVEAUX[i];
    assert.ok(configs.length >= 4);
    assert.equal(new Set(configs.map((k) => JSON.stringify(k.depart.E))).size, configs.length);
    for (const { depart, objectif } of configs) {
      assert.ok(depart.E.length >= 1 && depart.E.length <= 6);
      for (const k of ["1", "2", "3"]) assert.ok(objectif[k].length <= 4);
      assert.ok(objectif.S.length <= 6);
    }
  });
  test(`niveau ${i + 1} : les actions du premier arrivage recopiées sans boucle échouent sur un autre`, () => {
    const niv = M.NIVEAUX[i];
    const r = M.executer(niv.prog, niv.configs[0].depart);
    const dur = r.trace.map((e) => (e.t === "aller" ? aller(e.etat.pos) : { t: e.t }));
    const v = M.verifier(niv, dur);
    assert.equal(v.reussi, false);
    assert.ok(v.config > 0);
  });
}

test("ordre inversé et colis urgents : l'ordre attendu à la sortie", () => {
  const lettres = (l) => l.map((x) => x.l).join("");
  for (const { depart, objectif } of M.NIVEAUX[10].configs) assert.equal(lettres(objectif.S), lettres([...depart.E].reverse()));
  for (const { depart, objectif } of M.NIVEAUX[11].configs) {
    const par = (rouge) => depart.E.filter((x) => (x.c === "rouge") === rouge);
    assert.equal(lettres(objectif.S), lettres([...par(true), ...par(false)]));
  }
});

test("Python : l'entrée est nommée", () => assert.match(M.python([aller("E")]), /aller\("entrée"\)/));

/* ---------- « s'il y a une caisse ici » ---------- */
const siCaisse = (alors, sinon = []) => ({ t: "sicaisse", alors, sinon });

test("s'il y a une caisse ici : la branche « alors » n'est faite qu'une fois", () => {
  const r = M.executer([siCaisse([saisir(), aller("2"), poser(), aller("1")], [aller("3")])], piles({ 1: [A, B] }));
  assert.equal(r.erreur, null);
  assert.deepEqual(r.etat.piles, piles({ 1: [A], 2: [B] }));
  assert.equal(r.etat.pos, "1");
});

test("s'il y a une caisse ici : sinon quand le poste est vide", () => {
  assert.equal(M.executer([siCaisse([aller("2")], [aller("3")])], piles()).etat.pos, "3");
});

test("s'il y a une caisse ici : blocs comptés dans les deux branches", () => {
  assert.equal(M.compter([siCaisse([aller("2"), aller("3")], [saisir()])]), 4);
});

test("s'il y a une caisse ici : Python", () => {
  assert.match(M.python([siCaisse([saisir()])]), /if caisse_presente\(\):\n    saisir\(\)\nelse:\n    pass/);
});

test("le bloc est proposé partout où la boucle « tant que » l'est", () => {
  for (const n of M.NIVEAUX) assert.equal(n.blocs.includes("sicaisse"), n.blocs.includes("tantque"), n.titre);
});

/* ---------- Départs tirés au hasard ---------- */
const suite = (graine) => () => (graine = (graine * 16807) % 2147483647) / 2147483647;
const ALEATOIRES = [6, 7, 9, 10, 11, 12];
/* quantités permises : [minimum, maximum] de caisses au départ */
const BORNES = { 6: [1, 4], 7: [2, 4], 9: [1, 6], 10: [1, 6], 11: [1, 4], 12: [1, 6] };

test("seuls les niveaux à plusieurs départs sont tirés au hasard", () => {
  assert.deepEqual(M.NIVEAUX.flatMap((n, i) => (n.hasard ? [i + 1] : [])), ALEATOIRES);
});

for (const no of ALEATOIRES) {
  test(`niveau ${no} : 500 tirages respectent les limites et la solution les réussit tous`, () => {
    const niv = M.NIVEAUX[no - 1], alea = suite(12345 + no);
    const tailles = new Set(), departs = new Set();
    for (let k = 0; k < 500; k++) {
      const cas = niv.hasard(alea);
      const caisses = [...cas.depart["1"], ...cas.depart.E];
      tailles.add(caisses.length);
      departs.add(JSON.stringify(cas.depart));
      if (no === 10 || no === 12) assert.ok(caisses.filter((c) => c.c === "bleu").length <= 4, "4 bleues au plus");
      if ([7, 12].includes(no)) assert.ok(caisses.every((c) => c.c === "rouge" || c.c === "bleu"));
      if (no === 10) {
        assert.ok(caisses.every((c) => ["rouge", "bleu", "jaune"].includes(c.c)));
        assert.ok(caisses.filter((c) => c.c === "jaune").length <= 4, "4 jaunes au plus");
      }
      for (const pos of M.POSITIONS) {
        const r = M.executer(niv.prog, cas.depart, pos);
        assert.equal(r.erreur, null);
        assert.deepEqual(r.etat.piles, cas.objectif);
      }
    }
    const [mini, maxi] = BORNES[no];
    assert.deepEqual([...tailles].sort(), Array.from({ length: maxi - mini + 1 }, (_, i) => mini + i));
    assert.ok(departs.size > 12, "les départs varient vraiment");
  });
}

test("niveau 10 : un cas fixe teste les 4 bleues", () => {
  assert.ok(M.NIVEAUX[9].configs.some((k) => k.depart.E.filter((c) => c.c === "bleu").length === 4));
});

test("le départ tiré est rejoué quand le programme y échoue", () => {
  const niv = M.NIVEAUX[8], tirage = niv.hasard(suite(7));
  const r = M.verifier(niv, [aller("E"), saisir()], "2", tirage);
  assert.equal(r.cas, tirage);
  assert.equal(r.pos, "2");
});

test("réussir le départ tiré ne suffit pas : les cas fixes sont aussi contrôlés", () => {
  const niv = M.NIVEAUX[8];
  const tirage = niv.configs[0];
  const trace = M.executer(niv.prog, tirage.depart).trace;
  const enDur = trace.map((e) => (e.t === "aller" ? aller(e.etat.pos) : { t: e.t }));
  const r = M.verifier(niv, enDur, "1", tirage);
  assert.equal(r.reussi, false);
  assert.notEqual(r.cas, tirage);
  assert.ok(niv.configs.includes(r.cas));
});

test("niveau 12 : chaque caisse porte son numéro de sortie (cas fixes et 500 tirages)", () => {
  const niv = M.NIVEAUX[11], alea = suite(99);
  const cas = [...niv.configs, ...Array.from({ length: 500 }, () => niv.hasard(alea))];
  for (const { depart, objectif } of cas) {
    assert.deepEqual(objectif.S.map((c) => c.l), objectif.S.map((_, i) => String(i + 1)));
    assert.deepEqual(depart.E.map((c) => c.l).sort(), objectif.S.map((c) => c.l));
  }
});

test("toutes les caisses sont numérotées, dans tous les niveaux ; les textes ne parlent plus de lettres", () => {
  const alea = suite(5);
  for (const niv of M.NIVEAUX) {
    const cas = [...niv.configs, ...(niv.hasard ? Array.from({ length: 50 }, () => niv.hasard(alea)) : [])];
    for (const { depart, objectif } of cas) {
      for (const pile of [...Object.values(depart), ...Object.values(objectif)]) {
        for (const c of pile) assert.match(c.l, /^[1-6]$/, niv.titre);
      }
    }
    assert.doesNotMatch(`${niv.texte} ${niv.indice}`, /lettre|(?<![\p{L}'’])[BCD](?![\p{L}'’])|caisse A\b|\bA (et|au)\b/u, niv.titre);
  }
});

test("niveau 10 : tri à trois couleurs (rouges à la sortie, bleues au 2, jaunes au 3)", () => {
  const niv = M.NIVEAUX[9];
  for (const { depart, objectif } of niv.configs) {
    const de = (c) => depart.E.filter((x) => x.c === c);
    assert.deepEqual(objectif.S, de("rouge"));
    assert.deepEqual(objectif["2"], de("bleu"));
    assert.deepEqual(objectif["3"], de("jaune"));
  }
  for (const couleur of ["bleu", "jaune"]) {
    assert.ok(niv.configs.some((k) => k.depart.E.filter((c) => c.c === couleur).length === 4), "cas à 4 " + couleur);
  }
  /* l'ancienne solution à deux destinations ne suffit plus */
  const deux = [aller("E"), { t: "tantque", corps: [saisir(), { t: "si", c: "rouge", alors: [aller("S")], sinon: [aller("3")] }, poser(), aller("E")] }];
  assert.equal(M.verifier(niv, deux).reussi, false);
});

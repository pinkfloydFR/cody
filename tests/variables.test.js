const test = require("node:test");
const assert = require("node:assert/strict");
const M = require("../js/manutention-moteur.js");

const V = M.VARIABLES;
const aller = (p) => ({ t: "aller", p });
const saisir = () => ({ t: "saisir" });
const poser = () => ({ t: "poser" });
/* Générateur pseudo-aléatoire reproductible */
const graine = (n) => () => ((n = (n * 16807) % 2147483647) - 1) / 2147483646;

test("groupe « Variables » : 9 niveaux, optima attendus", () => {
  assert.deepEqual(V.map((n) => n.groupe), Array(10).fill("Variables"));
  assert.deepEqual(V.map((n) => n.opt), [8, 6, 10, 12, 11, 11, 14, 10, 7, 22]);
});

test("au moins deux niveaux comparent deux variables", () => {
  const compare = (l) => l.some((c) => c.t.endsWith("var2") || compare([...(c.corps || []), ...(c.alors || []), ...(c.sinon || [])]));
  assert.ok(V.filter((n) => compare(n.prog)).length >= 2);
});

test("au moins un niveau à plusieurs variables", () => {
  assert.ok(V.some((n) => n.variables.length > 1));
});

V.forEach((niv, i) => {
  const nom = `niveau ${28 + i} (${niv.titre})`;
  test(`${nom} : la solution réussit avec le nombre optimal de blocs`, () => {
    assert.equal(M.verifier(niv, niv.prog).reussi, true);
    assert.equal(M.compter(niv.prog), niv.opt);
  });
  test(`${nom} : un programme vide échoue`, () => assert.equal(M.verifier(niv, []).reussi, false));
  test(`${nom} : la solution réussit sur 200 départs tirés, depuis chaque position`, () => {
    const alea = graine(i + 7);
    for (let k = 0; k < 200; k++) {
      const cas = niv.hasard(alea);
      assert.ok(cas.depart.S.length === 0 && Object.values(cas.objectif).every((p, j) => p.length <= 8));
      assert.ok(cas.objectif.S.length <= M.CAPACITE_SORTIE);
      for (const pos of M.POSITIONS) assert.equal(M.verifier(niv, niv.prog, pos, cas).reussi, true, JSON.stringify(cas));
    }
  });
  test(`${nom} : chaque cas donne une valeur de départ à chaque variable du niveau`, () => {
    for (const cas of niv.configs) assert.deepEqual(Object.keys(cas.vars).sort(), [...niv.variables].sort());
  });
  if (niv.variables.some((v) => !(niv.donnees || []).includes(v))) {
    test(`${nom} : sans « mettre » au début, refusé (la valeur de départ est quelconque)`, () => {
      const sans = niv.prog.filter((c) => c.t !== "mettre" || niv.prog.indexOf(c) > 1);
      assert.ok(sans.length < niv.prog.length);
      assert.equal(M.verifier(niv, sans).reussi, false);
    });
  }
});

test("mettre, ajouter, retirer et la trace gardent les valeurs", () => {
  const prog = [{ t: "mettre", v: "a", n: 5 }, { t: "ajouter", v: "a", n: 2 }, { t: "retirer", v: "b", n: 1 }];
  const r = M.executer(prog, {}, "1", { b: 3 });
  assert.deepEqual(r.etat.vars, { a: 7, b: 2 });
  assert.deepEqual(r.trace.map((e) => [e.t, e.v, e.etat.vars.a]), [["mettre", "a", 5], ["ajouter", "a", 7], ["retirer", "b", 7]]);
});

test("comparaisons : <, >, =, ≠", () => {
  const essai = (op, n) => M.executer([{ t: "sivar", v: "x", op, n, alors: [{ t: "mettre", v: "r", n: 1 }], sinon: [{ t: "mettre", v: "r", n: 0 }] }], {}, "1", { x: 3 }).etat.vars.r;
  assert.deepEqual([essai("lt", 4), essai("lt", 3), essai("gt", 2), essai("gt", 3), essai("eq", 3), essai("eq", 2), essai("ne", 2), essai("ne", 3)],
    [1, 0, 1, 0, 1, 0, 1, 0]);
});

test("« tant que » sur une variable qui ne change pas : arrêt par la limite", () => {
  const r = M.executer([{ t: "tantquevar", v: "x", op: "gt", n: 0, corps: [aller("1")] }], {}, "1", { x: 1 });
  assert.equal(r.erreur.code, "limite");
});

test("variable contrôlée fausse : motif « variables », caisses bien placées", () => {
  const niv = V[0];
  const prog = [aller("E"), { t: "tantque", corps: [saisir(), aller("S"), poser(), aller("E")] }];
  const r = M.verifier(niv, prog);
  assert.equal(r.reussi, false);
  assert.equal(r.motif, "variables");
});

test("niveau 34 : livrer en alternant (sans variable) ne respecte pas l'ordre de la sortie", () => {
  const niv = V[6];
  const prog = [aller("E"), { t: "tantque", corps: [saisir(), aller("S"), poser(), aller("1"), saisir(), aller("S"), poser(), aller("E")] }];
  assert.equal(M.verifier(niv, prog).reussi, false);
});

test("Python : noms des variables et comparaisons", () => {
  const py = M.python(V[2].prog);
  assert.match(py, /^compteur = 0$/m);
  assert.match(py, /if compteur < 4:/);
  assert.match(py, /compteur = compteur \+ 1/);
  assert.match(M.python(V[1].prog), /while compteur > 0:/);
});

test("comparer deux variables : <, >, =, ≠", () => {
  const essai = (op, y) => M.executer([{ t: "sivar2", v: "x", op, w: "y", alors: [{ t: "mettre", v: "r", n: 1 }], sinon: [{ t: "mettre", v: "r", n: 0 }] }], {}, "1", { x: 3, y }).etat.vars.r;
  assert.deepEqual([essai("lt", 4), essai("lt", 3), essai("gt", 2), essai("eq", 3), essai("ne", 3)], [1, 0, 1, 1, 0]);
  assert.match(M.python([{ t: "tantquevar2", v: "a", op: "lt", w: "b", corps: [] }]), /while a < b:/);
});

test("niveau 36 : décompter la commande au lieu de compter les livrées est refusé (la commande change)", () => {
  const niv = V[8];
  const prog = [{ t: "mettre", v: "livraisons", n: 0 }, { t: "tantquevar", v: "commande", op: "gt", n: 0,
    corps: [aller("E"), saisir(), aller("S"), poser(), { t: "retirer", v: "commande", n: 1 }, { t: "ajouter", v: "livraisons", n: 1 }] }];
  const r = M.verifier(niv, prog);
  assert.equal(r.reussi, false);
  assert.equal(r.motif, "variables");
});

test("niveau 37 : jamais d'égalité entre rouges et bleues, 4 au plus de chaque", () => {
  const alea = graine(3);
  for (let k = 0; k < 300; k++) {
    const E = V[9].hasard(alea).depart.E, r = E.filter((x) => x.c === "rouge").length, b = E.length - r;
    assert.ok(r !== b && r <= 4 && b <= 4);
  }
});

test("répéter « variable » fois : la valeur est lue une fois, au début", () => {
  const prog = [{ t: "repetervar", v: "n", corps: [{ t: "ajouter", v: "k", n: 1 }, { t: "ajouter", v: "n", n: 1 }] }];
  assert.equal(M.executer(prog, {}, "1", { n: 3, k: 0 }).etat.vars.k, 3);
  assert.match(M.python(prog), /for i in range\(n\):/);
});

test("niveau 35 : un nombre fixe de répétitions échoue (nombre change)", () => {
  const corps = (p) => [aller("E"), saisir(), aller(p), poser()];
  const prog = [{ t: "repeter", n: 2, corps: corps("S") }, { t: "repeter", n: 2, corps: corps("3") }];
  assert.equal(M.verifier(V[7], prog).reussi, false);
});

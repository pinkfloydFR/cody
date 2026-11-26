const test = require("node:test");
const assert = require("node:assert/strict");
const M = require("../js/pivot-moteur.js");

const D = (id) => ({ t: "tourner", s: "D", id });
const G = (id) => ({ t: "tourner", s: "G", id });
const saisir = (id) => ({ t: "saisir", id });
const poser = (id) => ({ t: "poser", id });
const repeter = (n, ...corps) => ({ t: "repeter", n, corps });
const jusqua = (...corps) => ({ t: "jusqua", corps });
const tantque = (...corps) => ({ t: "tantque", corps });
const sicaisse = (alors, sinon = []) => ({ t: "sicaisse", alors, sinon });
const si = (c, alors, sinon = []) => ({ t: "si", c, alors, sinon });
const A = { l: "1", c: "rouge" }, B = { l: "2", c: "bleu" };
const depart = (o = {}) => ({ entree: [], N: [], E: [], S: [], ...o });
const suite = (graine) => () => (graine = (graine * 16807) % 2147483647) / 2147483647;

test("5 niveaux, groupe Pivot, 4 orientations de départ", () => {
  assert.equal(M.NIVEAUX.length, 5);
  assert.ok(M.NIVEAUX.every((n) => n.groupe === "Pivot"));
  assert.deepEqual(M.POSITIONS, ["O", "N", "E", "S"]);
});
test("optima", () => assert.deepEqual(M.NIVEAUX.map((n) => n.opt), [6, 7, 10, 12, 19]));

test("à droite, vu de dessus : ouest, nord, est, sud ; à gauche : l'inverse", () => {
  const caps = (s) => M.executer([s(), s(), s(), s()], depart(), "O").trace.map((e) => e.etat.dir);
  assert.deepEqual(caps(D), ["N", "E", "S", "O"]);
  assert.deepEqual(caps(G), ["S", "E", "N", "O"]);
});

test("« jusqu'à l'ouest » : de 0 à 3 tours selon l'orientation", () => {
  for (const [pos, tours] of [["O", 0], ["S", 1], ["E", 2], ["N", 3]]) {
    const r = M.executer([jusqua(D())], depart(), pos);
    assert.equal(r.etat.dir, "O", pos);
    assert.equal(r.trace.length, tours, pos);
  }
});

test("l'entrée est une file, les sorties gardent l'ordre d'arrivée", () => {
  const porter = [saisir(), D(), poser(), G()];
  const r = M.executer([...porter, ...porter], depart({ entree: [A, B] }), "O");
  assert.equal(r.erreur, null);
  assert.deepEqual(r.etat.piles.N, [A, B]);
  assert.deepEqual(r.etat.piles.entree, []);
});

test("saisir et poser agissent du côté visé", () => {
  const r = M.executer([saisir(), D(), D(), D(), poser()], depart({ entree: [A] }), "O");
  assert.deepEqual(r.etat.piles.S, [A]);
});

test("l'exécution ne modifie pas le départ", () => {
  const d = depart({ entree: [A] });
  M.executer([saisir(), D(), poser()], d, "O");
  assert.deepEqual(d.entree, [A]);
});

test("« il y a une caisse ici » regarde du côté visé", () => {
  const prog = [sicaisse([D()], [G()])];
  assert.equal(M.executer(prog, depart({ entree: [A] }), "O").etat.dir, "N");
  assert.equal(M.executer(prog, depart(), "O").etat.dir, "S");
  assert.equal(M.executer(prog, depart({ E: [A] }), "E").etat.dir, "S");
});

test("« si » teste la couleur de la caisse tenue", () => {
  const prog = [saisir(), si("rouge", [D()], [G()]), poser()];
  assert.deepEqual(M.executer(prog, depart({ entree: [A] }), "O").etat.piles.N, [A]);
  assert.deepEqual(M.executer(prog, depart({ entree: [B] }), "O").etat.piles.S, [B]);
});

const six = Array.from({ length: 6 }, (_, i) => ({ l: String(i + 1), c: "rouge" }));
for (const [code, prog, d, pos] of [
  ["saisir_vide", [saisir("x")], depart(), "O"],
  ["saisir_sortie", [saisir("x")], depart({ N: [A] }), "N"],
  ["saisir_plein", [saisir(), saisir("x")], depart({ entree: [A, B] }), "O"],
  ["poser_vide", [poser("x")], depart(), "N"],
  ["poser_entree", [saisir(), poser("x")], depart({ entree: [A] }), "O"],
  ["sortie_pleine", [saisir(), D(), poser("x")], depart({ entree: [A], N: six }), "O"],
  ["si_vide", [{ ...si("rouge", []), id: "x" }], depart(), "O"],
]) {
  test(`erreur ${code}, avec le bloc fautif`, () => {
    const r = M.executer(prog, d, pos);
    assert.deepEqual(r.erreur, { code, id: "x" });
    assert.ok(M.ERREURS[code]);
  });
}
for (const [nom, prog] of [["jusqu'à", [{ ...jusqua(), id: "x" }]], ["tant que", [{ ...tantque(), id: "x" }]]]) {
  test(`boucle « ${nom} » vide : arrêt à la limite`, () => {
    const pos = nom === "tant que" ? "O" : "N";
    assert.equal(M.executer(prog, depart({ entree: [A] }), pos).erreur.code, "limite");
  });
}

test("compter compte les blocs imbriqués", () => {
  assert.equal(M.compter([jusqua(D()), tantque(saisir(), si("rouge", [D()], [G()]))]), 7);
});

/* ---------- Niveaux ---------- */
M.NIVEAUX.forEach((n, i) => {
  const no = 19 + i;
  test(`niveau ${no} : la solution réussit sur 600 tirages, depuis les 4 orientations`, () => {
    const alea = suite(1000 + i);
    for (let k = 0; k < 600; k++) {
      const bilan = M.verifier(n, n.prog, "O", n.hasard ? n.hasard(alea) : undefined);
      assert.ok(bilan.reussi, JSON.stringify(bilan.cas.depart) + " " + bilan.pos);
    }
  });
  test(`niveau ${no} : la solution compte « opt » blocs, avec les seuls blocs proposés`, () => {
    assert.equal(M.compter(n.prog), n.opt);
    const vus = new Set();
    (function voir(l) { for (const c of l) { vus.add(c.t); voir(c.corps || []); voir(c.alors || []); voir(c.sinon || []); } })(n.prog);
    assert.deepEqual([...vus].filter((t) => !n.blocs.includes(t)), []);
  });
  test(`niveau ${no} : sans initialisation, défaut d'initialisation`, () => {
    const bilan = M.verifier(n, n.prog.slice(1), "N", n.hasard ? n.hasard(suite(7)) : undefined);
    assert.equal(bilan.reussi, false);
    assert.equal(bilan.initialisation, true);
    assert.equal(bilan.reussiDepuis, "O");
  });
  test(`niveau ${no} : un programme vide est refusé`, () => assert.equal(M.verifier(n, []).reussi, false));
});

test("les arrivages respectent les consignes (1 à 6 caisses, couleurs annoncées)", () => {
  const alea = suite(99);
  const permises = [null, ["rouge", "bleu", "jaune", "vert"], ["rouge", "bleu", "jaune", "vert"], ["rouge", "bleu", "jaune"], ["rouge", "bleu", "jaune", "vert"]];
  M.NIVEAUX.forEach((n, i) => {
    if (!permises[i]) { assert.equal(n.hasard, undefined); return; }
    const tailles = new Set();
    for (let k = 0; k < 500; k++) {
      const e = n.hasard(alea).depart.entree;
      tailles.add(e.length);
      assert.ok(e.every((c) => permises[i].includes(c.c)));
    }
    assert.deepEqual([...tailles].sort(), [1, 2, 3, 4, 5, 6]);
  });
});

test("une caisse restée à l'entrée ou dans la pince n'est pas une réussite", () => {
  const n = M.NIVEAUX[1];
  const uneSeule = [jusqua(D()), saisir(), D(), poser(), G()];
  assert.equal(M.verifier(n, uneSeule).reussi, false);
  assert.equal(M.verifier(M.NIVEAUX[0], [jusqua(D()), saisir()]).motif, "pince");
});

test("un échec sur un cas caché rend ce cas, à montrer à l'élève", () => {
  const n = M.NIVEAUX[2];
  const toutAuNord = [jusqua(D()), tantque(saisir(), D(), poser(), G())];
  const rouge = n.configs.find((c) => c.depart.entree.every((x) => x.c === "rouge"));
  const bilan = M.verifier(n, toutAuNord, "O", rouge);
  assert.equal(bilan.reussi, false);
  assert.notEqual(bilan.cas, rouge);
});

test("Python : lecture seule", () => {
  const py = M.python([jusqua(D()), tantque(saisir(), si("bleu", [G()]), poser())]);
  assert.match(py, /while not tourne_vers\("ouest"\):\n    tourner_droite\(\)/);
  assert.match(py, /while caisse_presente\(\):/);
  assert.match(py, /if couleur_tenue\(\) == "bleu":\n        tourner_gauche\(\)\n    else:\n        pass/);
});

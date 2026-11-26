const test = require("node:test");
const assert = require("node:assert/strict");
const M = require("../js/pivot-moteur.js").Rail;

const D = () => ({ t: "tourner", s: "D" });
const G = () => ({ t: "tourner", s: "G" });
const est = (id) => ({ t: "glisser", s: "E", id });
const ouest = (id) => ({ t: "glisser", s: "O", id });
const saisir = (id) => ({ t: "saisir", id });
const poser = (id) => ({ t: "poser", id });
const faceOuest = (...corps) => ({ t: "jusqua", but: "ouest", corps });
const auBout = (...corps) => ({ t: "jusqua", but: "bout", corps });
const tantque = (...corps) => ({ t: "tantque", corps });
const sicaisse = (alors, sinon = []) => ({ t: "sicaisse", alors, sinon });
const R = (l) => ({ l, c: "rouge" });
const depart = (o = {}) => ({ entree: [], attente: [], A: [], B: [], C: [], D: [], ...o });
const suite = (graine) => () => (graine = (graine * 16807) % 2147483647) / 2147483647;

test("4 niveaux, groupe « Pivot + rail », 12 départs (3 crans, 4 orientations)", () => {
  assert.equal(M.NIVEAUX.length, 4);
  assert.ok(M.NIVEAUX.every((n) => n.groupe === "Pivot + rail"));
  assert.equal(M.POSITIONS.length, 12);
  assert.equal(new Set(M.POSITIONS).size, 12);
});
test("optima", () => assert.deepEqual(M.NIVEAUX.map((n) => n.opt), [9, 13, 15, 24]));

test("glisser change de cran et garde l'orientation", () => {
  const r = M.executer([est(), est(), ouest()], depart(), "1,N");
  assert.equal(r.erreur, null);
  assert.deepEqual([r.etat.cran, r.etat.dir], [2, "N"]);
});
for (const [pos, bloc] of [["3,N", est("x")], ["1,S", ouest("x")]]) {
  test(`butée du rail au départ ${pos}`, () => {
    const r = M.executer([bloc], depart(), pos);
    assert.deepEqual(r.erreur, { code: "butee", id: "x" });
  });
}

test("« jusqu'au bout ouest » : de 0 à 2 crans", () => {
  for (const cran of [1, 2, 3]) {
    const r = M.executer([auBout(ouest())], depart(), cran + ",E");
    assert.equal(r.etat.cran, 1);
    assert.equal(r.trace.length, cran - 1);
  }
});

/* Les six postes du plan, et rien ailleurs */
const PLAN = { "1,O": "entree", "1,N": "A", "2,N": "B", "2,S": "attente", "3,N": "C", "3,E": "D" };
test("chaque poste est atteint depuis son cran et son orientation", () => {
  for (const [pos, poste] of Object.entries(PLAN)) {
    if (poste === "entree") continue;
    const r = M.executer([saisir(), ...allerDe(pos), poser()], depart({ entree: [R("1")] }), "1,O");
    assert.equal(r.erreur, null, pos);
    assert.equal(r.etat.piles[poste].length, 1, pos);
  }
});
function allerDe(pos) {
  const [cran, dir] = pos.split(",");
  const tours = { O: 0, N: 1, E: 2, S: 3 }[dir];
  return [...Array(tours).fill(D()), ...Array(cran - 1).fill(est())];
}
test("partout ailleurs : rien à saisir ni à poser, et aucune caisse « ici »", () => {
  const plein = () => depart({ entree: [R("1")], attente: [R("2")], A: [R("3")], B: [R("4")], C: [R("5")], D: [R("6")] });
  const vides = M.POSITIONS.filter((p) => !PLAN[p]);
  assert.equal(vides.length, 6);
  for (const p of vides) {
    assert.equal(M.executer([saisir("x")], plein(), p).erreur.code, "rien", p);
    assert.equal(M.executer([sicaisse([D()], [])], plein(), p).trace.length, 0, p);
  }
  const r = M.executer([saisir(), G(), poser("y")], plein(), "1,O");
  assert.deepEqual(r.erreur, { code: "rien", id: "y" });
});

test("l'attente est une pile : on peut y reprendre, la dernière posée d'abord", () => {
  const un = R("1"), deux = R("2");
  const r = M.executer([saisir()], depart({ attente: [un, deux] }), "2,S");
  assert.deepEqual(r.etat.main, deux);
  assert.deepEqual(r.etat.piles.attente, [un]);
});

const n = (k) => Array.from({ length: k }, (_, i) => R(String(i + 1)));
for (const [code, prog, d, pos] of [
  ["saisir_vide", [saisir("x")], depart(), "2,S"],
  ["saisir_sortie", [saisir("x")], depart({ B: n(1) }), "2,N"],
  ["saisir_plein", [saisir(), saisir("x")], depart({ entree: n(2) }), "1,O"],
  ["poser_vide", [poser("x")], depart(), "1,N"],
  ["poser_entree", [saisir(), poser("x")], depart({ entree: n(1) }), "1,O"],
  ["sortie_pleine", [saisir(), D(), poser("x")], depart({ entree: n(1), A: n(6) }), "1,O"],
  ["attente_pleine", [saisir(), G(), est(), poser("x")], depart({ entree: n(1), attente: n(4) }), "1,O"],
  ["si_vide", [{ t: "si", c: "rouge", alors: [], sinon: [], id: "x" }], depart(), "1,O"],
]) {
  test(`erreur ${code}, avec le bloc fautif`, () => {
    const r = M.executer(prog, d, pos);
    assert.deepEqual(r.erreur, { code, id: "x" });
    assert.ok(M.ERREURS[code]);
  });
}
test("chaque code d'erreur a son message", () => {
  for (const code of ["rien", "butee", "limite"]) assert.ok(M.ERREURS[code]);
});

M.NIVEAUX.forEach((niv, i) => {
  const no = 24 + i;
  test(`niveau ${no} : la solution réussit sur 300 tirages, depuis les 12 départs`, () => {
    const alea = suite(500 + i);
    for (let k = 0; k < 300; k++) {
      const bilan = M.verifier(niv, niv.prog, "1,O", niv.hasard ? niv.hasard(alea) : undefined);
      assert.ok(bilan.reussi, JSON.stringify(bilan.cas.depart) + " " + bilan.pos);
    }
  });
  test(`niveau ${no} : « opt » blocs, avec les seuls blocs proposés`, () => {
    assert.equal(M.compter(niv.prog), niv.opt);
    const vus = new Set();
    (function voir(l) {
      for (const c of l) {
        vus.add(c.t === "jusqua" && c.but === "bout" ? "jusquarail" : c.t === "jusqua" ? "jusquarail" : c.t);
        voir(c.corps || []); voir(c.alors || []); voir(c.sinon || []);
      }
    })(niv.prog);
    assert.deepEqual([...vus].filter((t) => !niv.blocs.includes(t)), []);
  });
  for (const [quoi, saute] of [["de l'orientation", 0], ["du cran", 1]]) {
    test(`niveau ${no} : sans initialisation ${quoi}, défaut d'initialisation`, () => {
      const prog = niv.prog.filter((_, k) => k !== saute);
      const bilan = M.verifier(niv, prog, "3,N", niv.hasard ? niv.hasard(suite(7)) : undefined);
      assert.equal(bilan.reussi, false);
      assert.equal(bilan.initialisation, true);
    });
  }
});

test("les arrivages respectent les consignes", () => {
  const alea = suite(42);
  const permises = [null, ["rouge", "bleu", "jaune", "vert"], ["rouge", "bleu", "jaune"], ["rouge", "bleu"]];
  M.NIVEAUX.forEach((niv, i) => {
    if (!permises[i]) { assert.equal(niv.hasard, undefined); return; }
    const tailles = new Set();
    for (let k = 0; k < 500; k++) {
      const e = niv.hasard(alea).depart.entree;
      tailles.add(e.length);
      assert.ok(e.every((c) => permises[i].includes(c.c)));
      if (i === 3) assert.ok(e.filter((c) => c.c === "bleu").length <= 4);
    }
    assert.deepEqual([...tailles].sort(), [1, 2, 3, 4, 5, 6]);
  });
});

test("niveau 27 : les bleues partent en D, la dernière arrivée en premier", () => {
  const cas = M.NIVEAUX[3].configs[0];
  const bleues = cas.depart.entree.filter((c) => c.c === "bleu");
  assert.deepEqual(cas.objectif.D, [...bleues].reverse());
  assert.deepEqual(cas.objectif.A, cas.depart.entree.filter((c) => c.c === "rouge"));
});

test("Python : glisser et les deux « jusqu'à »", () => {
  const py = M.python([faceOuest(D()), auBout(ouest()), tantque(saisir(), est(), poser())]);
  assert.match(py, /while not tourne_vers\("ouest"\):/);
  assert.match(py, /while not au_bout_ouest\(\):\n    glisser_ouest\(\)/);
  assert.match(py, /glisser_est\(\)/);
});

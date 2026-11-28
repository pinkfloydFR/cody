const test = require("node:test");
const assert = require("node:assert/strict");
const M = require("../js/tri-moteur.js");

const entrer = (id) => ({ t: "entrer", id });
const envoyer = (n, id) => ({ t: "envoyer", n, id });
const orienter = (n, d, id) => ({ t: "orienter", n, d, id });
const rappeler = (id) => ({ t: "rappeler", id });
const A = { l: "1", c: "rouge" }, B = { l: "2", c: "bleu" };
const depart = (o = {}) => ({ entree: [], attente: [], A: [], B: [], C: [], ...o });
const suite = (graine) => () => (graine = (graine * 16807) % 2147483647) / 2147483647;
const tout = (d) => ({ 1: d[0], 2: d[1] });

test("6 niveaux, groupe Convoyeurs, 6 orientations de départ", () => {
  assert.equal(M.NIVEAUX.length, 6);
  assert.ok(M.NIVEAUX.every((n) => n.groupe === "Convoyeurs"));
  assert.equal(M.POSITIONS.length, 6);
});
test("optima", () => assert.deepEqual(M.NIVEAUX.map((n) => n.opt), [5, 9, 11, 12, 12, 20]));

test("l'entrée est une file, l'attente une pile", () => {
  const garer = [orienter(1, "droit"), entrer(), orienter(1, "attente"), envoyer(1)];
  const r = M.executer([...garer, ...garer, rappeler()], depart({ entree: [A, B] }), "droit,droit");
  assert.equal(r.erreur, null);
  assert.deepEqual(r.etat.p1, B);
  assert.deepEqual(r.etat.attente, [A]);
});

test("tout droit : plateau 1 -> plateau 2 -> sortie C", () => {
  const r = M.executer([entrer(), envoyer(1), envoyer(2)], depart({ entree: [A] }), "droit,droit");
  assert.deepEqual(r.etat.C, [A]);
});

test("l'orientation est conservée jusqu'au prochain ordre", () => {
  const r = M.executer([entrer(), orienter(1, "A"), envoyer(1)], depart({ entree: [A] }), "droit,B");
  assert.deepEqual(r.etat.A, [A]);
  assert.deepEqual(r.etat.dir, tout(["A", "B"]));
});

/* Une caisse ne monte que sur un plateau aligné avec le tapis d'où elle vient */
for (const mauvaise of ["A", "attente"]) {
  test(`entrer sur un plateau 1 tourné vers « ${mauvaise} » est impossible`, () => {
    const r = M.executer([entrer("x")], depart({ entree: [A] }), mauvaise + ",droit");
    assert.deepEqual(r.erreur, { code: "alignement_entree", id: "x" });
    assert.deepEqual(r.etat.entree, [A]);
    assert.equal(r.etat.p1, null);
  });
}
for (const mauvaise of ["droit", "A"]) {
  test(`rappeler sur un plateau 1 tourné vers « ${mauvaise} » est impossible`, () => {
    const r = M.executer([rappeler("x")], depart({ attente: [A] }), mauvaise + ",droit");
    assert.deepEqual(r.erreur, { code: "alignement_attente", id: "x" });
    assert.deepEqual(r.etat.attente, [A]);
  });
}
test("passer du plateau 1 au plateau 2 tourné vers B est impossible", () => {
  const r = M.executer([entrer(), envoyer(1, "x")], depart({ entree: [A] }), "droit,B");
  assert.deepEqual(r.erreur, { code: "alignement_plateau2", id: "x" });
  assert.deepEqual(r.etat.p1, A);
  assert.equal(r.etat.p2, null);
});
test("les messages d'alignement existent", () => {
  for (const c of ["alignement_entree", "alignement_attente", "alignement_plateau2"]) assert.ok(M.ERREURS[c]);
});

const plein = Array(6).fill(A);
for (const [code, d, prog] of [
  ["entree_vide", depart(), [entrer("x")]],
  ["occupe", depart({ entree: [A, B] }), [entrer(), entrer("x")]],
  ["plateau_vide", depart(), [envoyer(1, "x")]],
  ["collision", depart({ entree: [A, B] }), [entrer(), envoyer(1), entrer(), envoyer(1, "x")]],
  ["direction", depart(), [orienter(2, "attente", "x")]],
  ["direction", depart(), [orienter(1, "B", "x")]],
  ["attente_vide", depart(), [rappeler("x")]],
  ["attente_pleine", depart({ entree: [A], attente: [A, A, A, A] }), [entrer(), orienter(1, "attente"), envoyer(1, "x")]],
  ["sortie_pleine", depart({ entree: [A], A: plein }), [entrer(), orienter(1, "A"), envoyer(1, "x")]],
  ["si_vide", depart(), [{ t: "si", n: 1, c: "rouge", alors: [], sinon: [], id: "x" }]],
]) {
  test(`erreur ${code} : arrêt sur le bloc fautif`, () => {
    assert.deepEqual(M.executer(prog, d, "droit,droit").erreur, { code, id: "x" });
    assert.ok(M.ERREURS[code]);
  });
}

test("boucle sans effet : arrêt par la limite", () => {
  const r = M.executer([{ t: "tantque", ou: "entree", corps: [], id: "x" }], depart({ entree: [A] }), "droit,droit");
  assert.equal(r.erreur.code, "limite");
});

M.NIVEAUX.forEach((niv, i) => {
  const no = 13 + i;
  test(`niveau ${no} : solution à l'optimum, cas fixes, depuis les 6 orientations`, () => {
    assert.equal(M.compter(niv.prog), niv.opt);
    const r = M.verifier(niv, niv.prog);
    assert.equal(r.reussi, true, JSON.stringify(r));
    assert.ok(niv.configs.length >= 4);
  });
  test(`niveau ${no} : 500 tirages réussis, dans les limites`, () => {
    const alea = suite(31 + no), tailles = new Set();
    for (let k = 0; k < 500; k++) {
      const cas = niv.hasard(alea);
      tailles.add(cas.depart.entree.length);
      assert.ok(cas.depart.entree.length >= 1 && cas.depart.entree.length <= 6);
      assert.ok(cas.depart.entree.every((c, j) => c.l === String(j + 1)));
      for (const s of ["A", "B", "C"]) assert.ok(cas.objectif[s].length <= 6);
      for (const pos of M.POSITIONS) {
        const r = M.executer(niv.prog, cas.depart, pos);
        assert.equal(r.erreur, null);
        assert.equal(M.conforme(r.etat, cas.objectif), null);
      }
    }
    assert.ok(tailles.size >= 4);
  });
  test(`niveau ${no} : un programme vide échoue ; la solution recopiée sans boucle aussi`, () => {
    assert.equal(M.verifier(niv, []).reussi, false);
    const r = M.executer(niv.prog, niv.configs[0].depart, "droit,droit");
    const dur = r.trace.map((e) => e.instruction);
    const v = M.verifier(niv, dur);
    assert.equal(v.reussi, false);
    assert.ok(v.config > 0);
  });
});

test("niveaux 17 et 18 : 4 caisses au plus en attente, cas à 4 testé", () => {
  for (const [i, test4] of [[4, (c) => true], [5, (c) => c.c === "bleu"]]) {
    const niv = M.NIVEAUX[i], alea = suite(3);
    const cas = [...niv.configs, ...Array.from({ length: 400 }, () => niv.hasard(alea))];
    assert.ok(cas.every((k) => k.depart.entree.filter(test4).length <= 4));
    assert.ok(niv.configs.some((k) => k.depart.entree.filter(test4).length === 4));
  }
});

test("sans initialisation : défaut signalé, et la position montrée est rejouée si elle échoue", () => {
  const niv = M.NIVEAUX[1];
  const r = M.verifier(niv, niv.prog.slice(1), "droit,B");
  assert.equal(r.initialisation, true);
  assert.ok(r.reussiDepuis.endsWith(",droit"));
  assert.equal(r.pos, "droit,B");
});

test("une caisse oubliée en route fait échouer", () => {
  const r = M.verifier({ configs: [{ depart: depart({ entree: [A] }), objectif: { A: [], B: [], C: [] } }] }, [entrer()]);
  assert.equal(r.motif, "reste");
});

test("Python lisible", () => {
  const code = M.python(M.NIVEAUX[5].prog);
  assert.match(code, /while caisse_a_l_entree\(\):\n    orienter\(1, "plateau 2"\)\n    faire_entrer\(\)\n    if couleur_plateau\(1\) == "rouge":\n        orienter\(1, "sortie A"\)/);
  assert.match(code, /while caisse_en_attente\(\):\n    orienter\(1, "attente"\)\n    rappeler\(\)/);
});

/* À évaluer dans la page manutention.html : noms des directions selon le plateau. */
(() => {
  const T = window.manutTest, B = window.Blockly, ws = T.ws;
  T.ouvrir(12);
  ws.clear();
  const b = B.serialization.blocks.append({ type: "tri_orienter" }, ws);
  const lu = () => ({ plateau: b.getFieldValue("N"), valeur: b.getFieldValue("D"), affiche: b.getField("D").getText(),
    liste: b.getField("D").getOptions(false).map((o) => o[0]) });
  const res = { depart: lu() };
  b.setFieldValue("2", "N"); res.sortieA_vers_plateau2 = lu();
  b.setFieldValue("B", "D"); res.choix_B = lu();
  b.setFieldValue("1", "N"); res.retour_plateau1 = lu();
  b.setFieldValue("2", "N"); res.droit_change_de_nom = lu();
  /* un programme enregistré se recharge à l'identique */
  const relu = [["1", "droit"], ["1", "A"], ["1", "attente"], ["2", "droit"], ["2", "B"]].map(([N, D]) => {
    const x = B.serialization.blocks.append({ type: "tri_orienter", fields: { N, D } }, ws);
    const copie = B.serialization.blocks.append(B.serialization.blocks.save(x), ws);
    return `${copie.getFieldValue("N")} ${copie.getFieldValue("D")} « ${copie.getField("D").getText()} »`;
  });
  res.rechargement = relu;
  ws.clear();
  B.serialization.blocks.append({ type: "manut_depart", x: 30, y: 30, deletable: false }, ws);
  return res;
})();

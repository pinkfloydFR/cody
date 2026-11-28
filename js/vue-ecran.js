/* Vue 3D seule, sur un second écran. La page de l'atelier (window.opener) envoie la géométrie puis
   chaque image (« vue ») par postMessage ; cette fenêtre ne fait que dessiner. Fermer la fenêtre
   ramène la vue dans l'atelier. */
{
  /* Même thème que l'atelier (« cody-theme », sombre par défaut) */
  try { if (JSON.parse(localStorage.getItem("cody-theme")) === "clair") document.documentElement.dataset.theme = "light"; } catch { /* rien */ }
  const $ = (id) => document.getElementById(id);
  const atelier = window.opener;
  const message = (texte) => { $("vue-message").textContent = texte; $("vue-message").hidden = !texte; };
  const envoyer = (donnees) => { if (atelier && !atelier.closed) atelier.postMessage(donnees, "*"); };

  let geo = null;
  const rendus = {};
  const CREER = {
    bras: (c) => window.Rendu3D.creer(c, geo.bras),
    tri: (c) => window.Rendu3DTri.creer(c),
    pivot: (c) => window.Rendu3DPivot.creer(c, geo.pivot),
    rail: (c) => window.Rendu3DPivot.creer(c, geo.rail),
  };
  /* Un moteur par machine, créé au premier besoin (la toile doit être visible pendant la création) */
  function rendu(machine) {
    for (const nom of Object.keys(CREER)) $("v-" + nom).hidden = nom !== machine;
    if (!rendus[machine]) {
      rendus[machine] = CREER[machine]($("v-" + machine));
      $("v-" + machine).addEventListener("webglcontextlost", () => envoyer({ type: "echec" }));
    }
    return rendus[machine];
  }

  window.addEventListener("message", (e) => {
    if (e.source !== atelier || !e.data) return;
    const d = e.data;
    if (d.type === "init") { geo = d.geo; return; }
    if (d.type !== "vue" || !geo) return;
    try {
      rendu(d.machine).dessiner(d.vue);
      $("vue-titre").textContent = d.titre || "";
      message("");
    } catch (err) {
      console.warn("Affichage 3D impossible dans cette fenêtre.", err);
      envoyer({ type: "echec" });
    }
  });

  /* Plein écran : un clic suffit (le navigateur exige un geste de l'utilisateur) */
  const plein = $("plein-ecran");
  plein.addEventListener("click", () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen().catch(() => {});
  });
  document.addEventListener("fullscreenchange", () => {
    plein.textContent = document.fullscreenElement ? "Quitter le plein écran" : "Plein écran";
  });

  if (!atelier || !window.THREE) message("Ouvre cette vue depuis l'atelier Manutention (bouton « Second écran »).");
  else {
    /* La police doit être prête avant de dessiner les étiquettes des caisses */
    document.fonts.load("700 40px Luciole").catch(() => {}).then(() => envoyer({ type: "prete" }));
    /* L'atelier est fermé ou a changé de page : cette fenêtre n'a plus de raison d'être */
    setInterval(() => { if (atelier.closed) window.close(); }, 1000);
  }
}

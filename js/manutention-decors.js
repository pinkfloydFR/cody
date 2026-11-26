/* Décors de fond de l'atelier Manutention : un par niveau (1 à 12 : bras ; 13 à 18 : centre de tri ;
   19 à 23 : bras pivotant).
   Tout est dessiné ici (aucune image externe). Repère en unités de la scène : x de -30 à 30,
   y de 0 (le sol) à 22, vers le haut. La caméra voit surtout x de -17 à 17 et y de 0 à 9.
   Le hasard est « à graine » : chaque décor est identique d'un affichage à l'autre. */
{
  const outils = (g, graine) => {
    const alea = () => (graine = (graine * 16807) % 2147483647) / 2147483647;
    const entre = (a, b) => a + alea() * (b - a);
    const rect = (x, y, l, h, c) => { g.fillStyle = c; g.fillRect(x, y, l, h); };
    const forme = (points, c) => {
      g.beginPath(); points.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath();
      g.fillStyle = c; g.fill();
    };
    const disque = (x, y, r, c) => { g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fillStyle = c; g.fill(); };
    const trait = (x1, y1, x2, y2, c, e) => { g.strokeStyle = c; g.lineWidth = e; g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke(); };
    /* dégradé vertical : [[hauteur, couleur], …] */
    const ciel = (arrets, y0 = 0, y1 = 22, x0 = -30, x1 = 30) => {
      const d = g.createLinearGradient(0, y0, 0, y1);
      for (const [y, c] of arrets) d.addColorStop((y - y0) / (y1 - y0), c);
      rect(x0, y0, x1 - x0, y1 - y0, d);
    };
    const halo = (x, y, r, c) => {
      const d = g.createRadialGradient(x, y, 0, x, y, r);
      d.addColorStop(0, c); d.addColorStop(1, "rgba(0,0,0,0)");
      rect(x - r, y - r, 2 * r, 2 * r, d);
    };
    const etoiles = (n, y0) => { for (let i = 0; i < n; i++) disque(entre(-30, 30), entre(y0, 22), entre(.015, .07), `rgba(255,255,255,${entre(.35, 1)})`); };
    const nuage = (x, y, t, c = "rgba(255,255,255,.85)") => {
      for (const [dx, dy, r] of [[0, 0, 1], [.9, .25, .75], [-.95, .1, .65], [1.7, -.05, .5]]) disque(x + dx * t, y + dy * t, r * t, c);
    };
    /* ligne de crêtes (montagnes, collines, dunes) */
    const cretes = (base, haut, pas, c) => {
      const p = [[-30, 0]];
      for (let x = -30; x <= 30 + pas; x += pas) p.push([x, base + entre(0, haut)]);
      p.push([31, 0]); forme(p, c);
    };
    const garde = (c = "#2b3442", y = 1.35) => { /* garde-corps au premier plan des vues extérieures */
      rect(-30, y, 60, .12, c); rect(-30, y - .6, 60, .08, c);
      for (let x = -30; x <= 30; x += 1.9) rect(x, 0, .11, y, c);
    };
    return { g, alea, entre, rect, forme, disque, trait, ciel, halo, etoiles, nuage, cretes, garde };
  };

  const DECORS = [
    { nom: "Atelier lumineux", sol: 0xc2bcae, dessiner(o) {
      o.ciel([[0, "#c8d6df"], [22, "#9fb4c4"]]);
      for (let x = -28; x < 28; x += 8) {
        o.ciel([[1.6, "#eaf7ff"], [11, "#79bdee"]], 1.6, 11, x, x + 6.4);
        o.nuage(x + o.entre(1.5, 4), o.entre(5, 8.5), o.entre(.5, .9));
        for (let i = 0; i <= 4; i++) o.rect(x + i * 1.6 - .06, 1.6, .12, 9.4, "#f4f7f9");
        for (let y = 1.6; y <= 11; y += 2.35) o.rect(x, y, 6.4, .1, "#f4f7f9");
        o.rect(x + 6.4, 0, 1.6, 22, "#8296a6"); o.rect(x + 6.75, 0, .35, 22, "#98abb9");
      }
      o.rect(-30, 0, 60, 1.6, "#6d8294"); o.rect(-30, 1.45, 60, .2, "#d9e2e8");
    } },
    { nom: "Entrepôt", sol: 0xa9a196, dessiner(o) {
      o.ciel([[0, "#4a4438"], [9, "#2c2a28"], [22, "#17171a"]]);
      for (let x = -30; x < 30; x += 5.4) {
        for (const y of [.15, 2.75, 5.35, 7.95]) {
          let cx = x + .45;
          while (cx < x + 4.4) {
            const l = o.entre(.8, 1.7), h = o.entre(1, 2);
            if (cx + l > x + 5) break;
            const c = ["#b08a58", "#94714a", "#c09a68", "#6f7f8c", "#8a9272"][Math.floor(o.entre(0, 5))];
            o.rect(cx, y + .28, l, h, c); o.rect(cx, y + .28 + h * .45, l, .12, "rgba(60,40,20,.45)");
            cx += l + .18;
          }
          o.rect(x, y, 5.4, .28, "#c8702a");
        }
        o.rect(x, 0, .3, 11, "#2f5a86"); o.rect(x + .09, 0, .1, 11, "#4b7fb4");
      }
      o.rect(-30, 0, 60, 22, "rgba(24,22,20,.30)");
      for (let x = -24; x <= 24; x += 8) { o.halo(x, 9.4, 4.2, "rgba(255,226,160,.42)"); o.rect(x - .7, 9.5, 1.4, .3, "#fff2c8"); }
    } },
    { nom: "Port au soleil couchant", sol: 0xb5a79c, dessiner(o) {
      o.ciel([[0, "#ffc27a"], [3.4, "#f58a66"], [6, "#b5628a"], [10, "#4a4a82"], [22, "#202650"]]);
      o.halo(6, 4.2, 7, "rgba(255,225,150,.75)"); o.disque(6, 4.2, 1.5, "#ffe3a1");
      o.ciel([[0, "#27406a"], [3.2, "#c0707a"]], 0, 3.2);
      for (let i = 0; i < 110; i++) o.rect(o.entre(-28, 28), o.entre(.3, 3), o.entre(.4, 2), .05, "rgba(255,214,160,.38)");
      for (const x of [-17, -9, 15]) { /* grues */
        const c = "#2c2440";
        o.rect(x, 2.2, .35, 6, c); o.rect(x + 2.4, 2.2, .35, 6, c); o.rect(x - .4, 7.9, 3.6, .55, c);
        o.rect(x - 3.2, 8.45, 7.8, .22, c); o.trait(x + 1.4, 10, x - 3.1, 8.6, c, .09); o.trait(x + 1.4, 10, x + 4.5, 8.6, c, .09);
        o.rect(x + 1.25, 8.4, .28, 1.7, c); o.trait(x - 2.2, 8.45, x - 2.2, 5.6, c, .06); o.rect(x - 2.9, 5.1, 1.5, .55, c);
      }
      for (let x = -27; x < 27; x += 2.7) {
        const etages = Math.floor(o.entre(0, 3.4));
        for (let k = 0; k < etages; k++) {
          const c = ["#7c3b4e", "#3d5578", "#8c5a3c", "#3f6b63"][Math.floor(o.entre(0, 4))];
          o.rect(x, 2.1 + k * .86, 2.5, .8, c);
          for (let i = .2; i < 2.4; i += .3) o.rect(x + i, 2.18 + k * .86, .07, .64, "rgba(0,0,0,.22)");
        }
      }
      o.rect(-30, 1.7, 60, .45, "#2b2338"); o.garde("#231c30");
    } },
    { nom: "Ville de nuit", sol: 0x858a96, dessiner(o) {
      o.ciel([[0, "#2b3566"], [6, "#151c40"], [22, "#070a1c"]]);
      o.etoiles(420, 5);
      o.halo(-11, 8, 3.4, "rgba(190,210,255,.35)"); o.disque(-11, 8, 1.05, "#f1f4ff"); o.disque(-10.55, 8.25, .86, "#d9def2");
      for (const [couche, c, haut] of [[0, "#1b2250", 6.2], [1, "#0e1331", 4.6]]) {
        let x = -30;
        while (x < 30) {
          const l = o.entre(1.3, 3.2), h = o.entre(2, haut);
          o.rect(x, 0, l, h, c);
          for (let wx = x + .22; wx < x + l - .3; wx += .46) {
            for (let wy = 1.4; wy < h - .35; wy += .55) {
              if (o.alea() < .34) o.rect(wx, wy, .2, .26, o.alea() < .75 ? "#ffd873" : "#9fe4ff");
            }
          }
          if (couche && o.alea() < .3) { o.rect(x + l / 2, h, .07, 1, c); o.disque(x + l / 2 + .03, h + 1.05, .11, "#ff5a5a"); }
          x += l + o.entre(.05, .35);
        }
      }
      o.halo(0, 0, 14, "rgba(120,110,255,.18)"); o.garde("#05070f");
    } },
    { nom: "Salle blanche", sol: 0xd8dde2, dessiner(o) {
      o.ciel([[0, "#e8eef2"], [22, "#bcc9d3"]]);
      for (let x = -30; x < 30; x += 4) {
        for (let y = 0; y < 20; y += 3.2) { o.rect(x + .08, y + .08, 3.84, 3.04, "rgba(255,255,255,.42)"); o.rect(x + .08, y + .08, 3.84, .1, "rgba(90,120,140,.25)"); }
      }
      for (const x of [-20, -8, 4, 16]) {
        o.rect(x - .25, 2.5, 7.5, 5, "#8fa3b2");
        o.ciel([[2.75, "#0f4a63"], [7.25, "#2a8aa6"]], 2.75, 7.25, x, x + 7);
        for (let i = 0; i < 5; i++) { /* silhouettes d'appareils */
          const bx = x + .5 + i * 1.3, h = o.entre(.7, 2.2);
          o.rect(bx, 2.75, .9, h, "rgba(8,36,50,.65)"); o.disque(bx + .45, 2.75 + h - .22, .09, "#6ff5c8");
        }
        o.forme([[x + .6, 2.75], [x + 2.2, 2.75], [x + 4.4, 7.25], [x + 2.8, 7.25]], "rgba(255,255,255,.12)");
        o.rect(x + 3.45, 2.75, .1, 4.5, "#8fa3b2");
      }
      o.rect(-30, 9, 60, .5, "#f8fbfd"); for (let x = -28; x < 28; x += 5) { o.halo(x + 1.5, 9, 2.4, "rgba(190,240,255,.6)"); o.rect(x, 9.12, 3, .22, "#ffffff"); }
      o.rect(-30, .9, 60, .18, "#35b6c9");
    } },
    { nom: "Usine bleue", sol: 0xaab6c4, dessiner(o) {
      o.ciel([[0, "#4aa8d8"], [9, "#2f7fb8"], [22, "#1d527f"]]);
      for (let x = -30; x < 30; x += 3.1) o.rect(x, 0, .12, 22, "rgba(255,255,255,.16)");
      for (const y of [2.6, 5.9]) o.rect(-30, y, 60, .12, "rgba(255,255,255,.16)");
      for (const x of [-15.5, 11]) { /* grandes portes */
        o.rect(x - .3, 0, 5.1, 6.2, "#d5e8f2"); o.rect(x, 0, 4.5, 5.9, "#5c86a8"); o.rect(x + 2.2, 0, .1, 5.9, "#33556f");
        for (const dx of [1.1, 3.4]) { o.disque(x + dx, 4.3, .52, "#d5e8f2"); o.disque(x + dx, 4.3, .38, "#7fd3ee"); }
        for (const dx of [1.8, 2.7]) o.rect(x + dx, 2.4, .12, 1, "#e6f2f8");
      }
      for (const [y, e, c] of [[7.6, .55, "#e9b93a"], [8.5, .34, "#9ccfe6"], [9.2, .34, "#9ccfe6"]]) {
        o.rect(-30, y, 60, e, c); o.rect(-30, y + e * .65, 60, e * .16, "rgba(255,255,255,.45)");
        for (let x = -28; x < 30; x += 4.6) o.rect(x, y - .08, .34, e + .16, "#1d4a6d");
      }
      for (const x of [-4.5, 1.8]) {
        o.rect(x, 2.9, 3.2, 2.4, "#c4dbe9"); o.rect(x + .2, 3.1, 2.8, 2, "#14344d");
        o.g.strokeStyle = "#63e7ff"; o.g.lineWidth = .09; o.g.beginPath(); o.g.moveTo(x + .35, 3.9);
        for (let i = .35; i < 2.9; i += .3) o.g.lineTo(x + i, 3.4 + o.entre(0, 1.4));
        o.g.stroke();
      }
    } },
    { nom: "Hangar d'aéroport", sol: 0xb3b5b4, dessiner(o) {
      o.ciel([[0, "#cfeaff"], [5, "#7fc0f2"], [22, "#2f77bd"]]);
      for (let i = 0; i < 9; i++) o.nuage(o.entre(-25, 25), o.entre(4.5, 9), o.entre(.45, 1));
      o.rect(-30, 0, 60, 2.4, "#6c7176"); o.rect(-30, 2.4, 60, .25, "#7fa05c");
      for (let x = -28; x < 28; x += 3.2) o.rect(x, 1.55, 1.7, .13, "#f2f2e8");
      const A = (x, y) => [x - 3, y]; /* avion de ligne, vu de profil */
      o.forme([A(-5, 4.2), A(-3.6, 5.05), A(6, 5.15), A(8.6, 6.9), A(9.7, 6.9), A(8.8, 4.7), A(7, 3.8), A(-3.8, 3.7)], "#f4f7fa");
      o.forme([A(.2, 4.1), A(4.6, 2.9), A(5.7, 2.9), A(3.4, 4.2)], "#b9c6d2");
      o.rect(-5.4, 3.92, 12, .18, "#d0463c");
      for (let x = -5.6; x < 3; x += .52) o.disque(x, 4.5, .13, "#37526e");
      o.disque(-.6, 3.25, .38, "#8995a2"); o.disque(-.6, 3.25, .22, "#333d48");
      for (const x of [-5.6, .4, 1]) { o.rect(x, 2.35, .09, 1.35, "#333d48"); o.disque(x + .04, 2.4, .2, "#1d242c"); }
      /* arche du hangar */
      o.g.beginPath(); o.g.rect(-31, -1, 62, 24); o.g.moveTo(-17, -1); o.g.lineTo(-17, 4.5);
      o.g.bezierCurveTo(-13, 11.2, 13, 11.2, 17, 4.5); o.g.lineTo(17, -1); o.g.closePath();
      o.g.fillStyle = "#3b4652"; o.g.fill("evenodd");
      for (let x = -29; x <= 29; x += 1.7) if (Math.abs(x) > 17.4) o.rect(x, 0, .22, 22, "rgba(255,255,255,.09)");
      o.g.strokeStyle = "#e0a81e"; o.g.lineWidth = .34; o.g.beginPath(); o.g.moveTo(-17, 0); o.g.lineTo(-17, 4.5);
      o.g.bezierCurveTo(-13, 11.2, 13, 11.2, 17, 4.5); o.g.lineTo(17, 0); o.g.stroke();
    } },
    { nom: "Quai de chargement", sol: 0xaaa39c, dessiner(o) {
      o.rect(-30, 0, 60, 22, "#8a5546");
      for (let y = 0; y < 14; y += .42) {
        for (let x = -30 - (Math.round(y / .42) % 2) * .55; x < 30; x += 1.1) {
          o.rect(x + .04, y + .04, 1.02, .34, `rgba(${o.alea() > .5 ? "255,190,150" : "40,10,0"},${o.entre(.04, .2)})`);
        }
      }
      [-17.5, -5.5, 6.5].forEach((x, i) => {
        o.rect(x - .3, 0, 8.6, 7.1, "#cfd3d6"); o.rect(x, 0, 8, 6.8, "#20262e");
        if (i === 1) { /* porte ouverte : l'arrière d'un camion */
          o.ciel([[0, "#9fc4dd"], [6.8, "#d8eefb"]], 0, 6.8, x, x + 8);
          o.rect(x + 1.2, 1.4, 5.6, 4.6, "#e9ecef"); o.rect(x + 3.95, 1.4, .1, 4.6, "#8b949c");
          for (const dx of [1.8, 3.4, 4.5, 6.1]) o.rect(x + dx, 1.9, .09, 3.6, "#5d6670");
          o.rect(x + 1.2, 1.1, 5.6, .35, "#3a424b"); o.rect(x + 1.4, 1.2, .55, .2, "#e2463c"); o.rect(x + 6.05, 1.2, .55, .2, "#e2463c");
          for (const dx of [1.8, 6.2]) o.disque(x + dx, .65, .62, "#15181c");
        } else {
          for (let y = .2; y < 6.6; y += .5) { o.rect(x, y, 8, .38, "#6e7d8c"); o.rect(x, y + .3, 8, .08, "#8d9cab"); }
        }
        for (let k = 0; k < 8; k += 1) o.rect(x + k, 6.8, .5, .3, "#e0a81e");
        o.disque(x + 4, 8.1, .26, i === 1 ? "#54e08c" : "#e2463c"); o.halo(x + 4, 8.1, 1.4, i === 1 ? "rgba(84,224,140,.5)" : "rgba(226,70,60,.45)");
      });
    } },
    { nom: "Base polaire", sol: 0xcdd9e4, dessiner(o) {
      o.ciel([[0, "#1f4a66"], [7, "#0e2444"], [22, "#050b1e"]]);
      o.etoiles(500, 4);
      for (const [y, c, a] of [[8.4, "90,255,180", .34], [9.6, "110,200,255", .26], [7.2, "180,130,255", .2]]) { /* aurore */
        for (let x = -30; x < 30; x += .28) {
          const base = y + Math.sin(x / 4.3 + y) * 1.1 + Math.sin(x / 1.7) * .3, h = 2.2 + Math.sin(x / 2.9 + y * 2) * 1.1;
          const d = o.g.createLinearGradient(0, base - .6, 0, base + h);
          d.addColorStop(0, `rgba(${c},0)`); d.addColorStop(.2, `rgba(${c},${a})`); d.addColorStop(1, `rgba(${c},0)`);
          o.rect(x, base - .6, .3, h + .6, d);
        }
      }
      o.cretes(3.2, 3.4, 2.6, "#7ea3c4"); o.cretes(2.4, 2.4, 1.9, "#b9d3e8"); o.cretes(1.5, .9, 3.4, "#e8f3fb");
      for (const x of [-13, 9.5]) { /* modules habités */
        o.rect(x, 1.9, 4.6, 1.5, "#c9542f"); o.rect(x - .2, 3.4, 5, .25, "#eef4f8");
        for (let i = .5; i < 4.4; i += 1.1) o.rect(x + i, 2.4, .6, .55, "#ffe28a");
        for (const dx of [.5, 3.9]) o.rect(x + dx, 1.1, .18, .85, "#3a4a58");
      }
      o.garde("#33495e");
    } },
    { nom: "Au cœur de la forêt", sol: 0xaca894, dessiner(o) {
      o.ciel([[0, "#e8f6e0"], [5, "#bfe3ee"], [22, "#6fb2dc"]]);
      o.halo(-9, 8.5, 5, "rgba(255,250,200,.7)");
      for (let i = 0; i < 6; i++) o.nuage(o.entre(-25, 25), o.entre(6.5, 9.5), o.entre(.4, .8));
      o.cretes(3.8, 2.6, 4.5, "#93bfae"); o.cretes(2.9, 1.7, 3.2, "#5f9a82");
      const sapin = (x, y, h, c) => { for (let k = 0; k < 3; k++) o.forme([[x - h * (.34 - k * .07), y + h * k * .24], [x, y + h * (.55 + k * .22)], [x + h * (.34 - k * .07), y + h * k * .24]], c); };
      for (let x = -30; x < 30; x += .75) sapin(x + o.entre(-.2, .2), o.entre(1.7, 2.5), o.entre(1.3, 2.4), "#2f6e55");
      for (let x = -30; x < 30; x += 1.05) sapin(x + o.entre(-.3, .3), o.entre(.6, 1.3), o.entre(1.5, 3), "#1c4a39");
      for (let x = -27.5; x < 30; x += 8.5) { o.rect(x, 0, .42, 22, "#7a5a3a"); o.rect(x + .1, 0, .1, 22, "#9c7a52"); }
      o.rect(-30, 9.6, 60, .45, "#7a5a3a"); o.garde("#5d442c", 1.1);
    } },
    { nom: "Station orbitale", sol: 0x7f8a99, dessiner(o) {
      o.ciel([[0, "#070a18"], [22, "#02030a"]]);
      o.etoiles(750, 0);
      o.halo(9, -9, 22, "rgba(70,160,255,.55)");
      o.disque(9, -9, 15.2, "#1d62b8"); /* la Terre */
      o.g.save(); o.g.beginPath(); o.g.arc(9, -9, 15.2, 0, Math.PI * 2); o.g.clip();
      for (let i = 0; i < 26; i++) { const x = o.entre(-4, 22), y = o.entre(-1, 6); for (let k = 0; k < 5; k++) o.disque(x + o.entre(-1.4, 1.4), y + o.entre(-.5, .5), o.entre(.3, 1.1), "#3f9159"); }
      for (let i = 0; i < 70; i++) o.rect(o.entre(-6, 24), o.entre(-2, 6.2), o.entre(.8, 3.6), o.entre(.07, .26), "rgba(255,255,255,.5)");
      o.g.restore();
      o.g.strokeStyle = "rgba(140,210,255,.85)"; o.g.lineWidth = .2; o.g.beginPath(); o.g.arc(9, -9, 15.3, 0, Math.PI * 2); o.g.stroke();
      o.disque(-12, 7.4, .8, "#cfd3da"); o.disque(-11.75, 7.6, .17, "#aab0ba"); o.disque(-12.3, 7.2, .12, "#aab0ba");
      for (let x = -28; x <= 28; x += 11) { /* montants du hublot */
        o.rect(x - .45, 0, .9, 22, "#525c6c"); o.rect(x - .18, 0, .16, 22, "#79859a");
        for (let y = .7; y < 11; y += 1.1) o.disque(x + .22, y, .09, "#a7b2c4");
      }
      o.rect(-30, 9.2, 60, .9, "#525c6c"); o.rect(-30, 0, 60, 1.1, "#3b4452"); o.rect(-30, 1.1, 60, .16, "#79859a");
      for (let x = -27; x < 28; x += 2.2) o.disque(x, .55, .13, x % 4.4 < 2 ? "#63e7ff" : "#ffd873");
    } },
    { nom: "Base martienne", sol: 0xc69a80, dessiner(o) {
      o.ciel([[0, "#f2b48a"], [4.5, "#c97b66"], [8, "#6f4560"], [22, "#1d1530"]]);
      o.etoiles(260, 8);
      o.disque(-12, 8.2, .95, "#e9d8cf"); o.disque(-11.7, 8.4, .2, "#c9b3a8"); o.disque(8.5, 9.3, .45, "#d6bfb4");
      o.halo(13, 4.6, 4, "rgba(255,236,210,.6)"); o.disque(13, 4.6, .55, "#fff2dc");
      o.cretes(2.9, 2.2, 3.6, "#9c4f43"); o.cretes(2.1, 1.3, 2.4, "#7d3a33");
      for (const [x, r] of [[-14, 2.5], [-9.4, 1.5], [7, 3]]) { /* dômes habités */
        o.g.beginPath(); o.g.arc(x, 1.7, r, 0, Math.PI); o.g.closePath(); o.g.fillStyle = "rgba(190,235,255,.30)"; o.g.fill();
        o.g.strokeStyle = "#e8f6ff"; o.g.lineWidth = .1; o.g.stroke();
        for (const a of [.35, .65]) { o.g.beginPath(); o.g.ellipse(x, 1.7, r * a, r, 0, 0, Math.PI); o.g.stroke(); }
        for (let i = -r + .5; i < r - .5; i += .8) o.rect(x + i, 1.75, .42, o.entre(.35, r * .5), "#ffe28a");
        o.rect(x - r - .2, 1.45, 2 * r + .4, .28, "#cdd5dc");
      }
      o.rect(.2, 1.6, .3, 4.4, "#cdd5dc"); /* fusée */
      o.forme([[-1.4, 2.2], [-1.4, 6], [-.65, 7.7], [.1, 6], [.1, 2.2]], "#eef2f5");
      o.forme([[-2.2, 1.7], [-1.4, 3.4], [-1.4, 2.2]], "#c7433a"); o.forme([[.9, 1.7], [.1, 3.4], [.1, 2.2]], "#c7433a");
      o.disque(-.65, 5.3, .34, "#4a7fa8");
      o.cretes(.9, .7, 2.9, "#5c2a28"); o.garde("#3a1d1e", 1.15);
    } },
    { nom: "Centre de tri postal", sol: 0xb7b0a2, dessiner(o) {
      o.ciel([[0, "#d9c79a"], [22, "#8f7f5c"]]);
      for (let x = -30; x < 30; x += 7.5) {
        o.rect(x + .5, 1.2, 6.5, 7.8, "#6d5a3c");
        for (let y = 1.5; y < 8.7; y += 1.45) for (let i = 0; i < 5; i++) {
          o.rect(x + .8 + i * 1.22, y, 1.05, 1.15, "#3f3322");
          if (o.alea() < .75) o.rect(x + .9 + i * 1.22, y + .05, .85, o.entre(.3, .8), ["#d8b77a", "#eef0e8", "#c98f55"][Math.floor(o.entre(0, 3))]);
        }
        o.rect(x + 2.2, 9.4, 3, .8, "#f0c52e"); o.disque(x + 3.7, 9.8, .24, "#33507a");
      }
      o.rect(-30, 0, 60, 1.1, "#4c4030");
    } },
    { nom: "Chocolaterie", sol: 0xc7b0a0, dessiner(o) {
      o.ciel([[0, "#f6dcc0"], [22, "#c99a78"]]);
      for (let x = -30; x < 30; x += 2.4) o.rect(x, 0, .1, 22, "rgba(120,70,40,.18)");
      for (const x of [-20, -7, 6, 19]) { /* cuves de cuivre */
        o.rect(x - 2.2, 1.3, 4.4, 4.6, "#b86a33"); o.disque(x, 5.9, 2.2, "#c97a3e"); o.rect(x - 1.7, 1.6, .5, 4.3, "rgba(255,225,190,.5)");
        o.rect(x - .25, 8, .5, 14, "#8d4f28"); o.disque(x, 3.8, .7, "#4a2a18"); o.disque(x, 3.8, .45, "#7a4527");
      }
      o.rect(-30, 8.4, 60, .45, "#8d4f28"); o.rect(-30, 0, 60, 1.3, "#6b3d22");
      for (let x = -29; x < 30; x += 1.6) o.disque(x, 1.3, .35, "#5a3019");
    } },
    { nom: "Grande gare", sol: 0xaeb0b3, dessiner(o) {
      o.ciel([[0, "#e9dfc6"], [10, "#a9c4d8"], [22, "#5d7f9d"]]);
      for (let x = -28; x <= 28; x += 9.3) { /* verrières en arcs */
        o.g.strokeStyle = "#4f5d66"; o.g.lineWidth = .32;
        for (const r of [4.4, 3.4, 2.3]) { o.g.beginPath(); o.g.arc(x, 4.2, r, 0, Math.PI); o.g.stroke(); }
        for (let a = 0; a <= Math.PI + .01; a += Math.PI / 8) o.trait(x, 4.2, x + Math.cos(a) * 4.4, 4.2 + Math.sin(a) * 4.4, "#4f5d66", .14);
        o.rect(x + 4.4, 0, .5, 9.4, "#6d5a4a");
      }
      for (const x of [-17, 4]) { /* trains à quai */
        o.rect(x, 1.1, 13, 2.8, "#31597f"); o.rect(x, 3.35, 13, .3, "#e8c14a");
        for (let i = .5; i < 12; i += 1.8) o.rect(x + i, 2.05, 1.3, 1.05, "#cfe6f2");
        for (let i = 1; i < 13; i += 2.2) o.disque(x + i, 1.05, .42, "#1c2228");
      }
      o.disque(0, 8.4, .95, "#f4f0e4"); o.trait(0, 8.4, 0, 9.1, "#222", .12); o.trait(0, 8.4, .48, 8.25, "#222", .12);
      o.rect(-30, 0, 60, .75, "#555c63");
    } },
    { nom: "Serre botanique", sol: 0xb2ad9a, dessiner(o) {
      o.ciel([[0, "#eaf7e8"], [22, "#8ecbe8"]]);
      const feuille = (x, y, r, c) => { o.g.beginPath(); o.g.ellipse(x, y, r, r * .38, o.entre(0, 3.14), 0, Math.PI * 2); o.g.fillStyle = c; o.g.fill(); };
      for (const [nb, teintes, haut] of [[260, ["#6fae78", "#82bd84"], 6], [240, ["#357a4c", "#4a9158"], 3.8]]) {
        for (let i = 0; i < nb; i++) feuille(o.entre(-30, 30), o.entre(.2, haut), o.entre(.5, 1.5), teintes[i % 2]);
      }
      for (const x of [-18, -3, 13]) { /* palmiers */
        o.rect(x - .18, 0, .36, 6.4, "#8a6a43");
        for (let a = 0; a < 7; a++) { const t = a / 6 * Math.PI; o.trait(x, 6.4, x + Math.cos(t) * 3, 6.4 + Math.sin(t) * 1.8 - .5, "#2f8a55", .55); }
      }
      for (let i = 0; i < 60; i++) o.disque(o.entre(-29, 29), o.entre(.4, 2.6), .16, ["#f06a7a", "#ffd54a", "#f4f4f4"][i % 3]);
      for (let x = -30; x <= 30; x += 3.8) o.rect(x - .09, 0, .18, 22, "#f2f6f4");
      for (const y of [4.9, 9]) o.rect(-30, y, 60, .18, "#f2f6f4");
    } },
    { nom: "Fond sous-marin", sol: 0x93aab0, dessiner(o) {
      o.ciel([[0, "#0c4d6e"], [6, "#12739a"], [22, "#7fd0e6"]]);
      for (let x = -28; x < 30; x += 6.5) o.forme([[x, 22], [x + 2, 22], [x - 1.5, 0], [x - 4, 0]], "rgba(190,240,255,.10)");
      o.cretes(1.4, 1.4, 2.6, "#0a3a52");
      for (let x = -29; x < 30; x += 1.25) { /* algues */
        const h = o.entre(1.2, 4.6); o.g.strokeStyle = ["#1f8a63", "#2aa371", "#176c50"][Math.floor(o.entre(0, 3))]; o.g.lineWidth = .22;
        o.g.beginPath(); o.g.moveTo(x, 0); o.g.bezierCurveTo(x - .8, h * .35, x + .9, h * .65, x + o.entre(-.4, .4), h); o.g.stroke();
      }
      for (const [x, y, t, c] of [[-14, 6.2, 1.2, "#ffb03a"], [-11, 5.2, .8, "#ffb03a"], [3, 7.4, 1.5, "#f2d94a"], [11, 4.6, 1, "#ef6f8f"], [18, 6.8, 1.1, "#ffb03a"], [-3, 3.8, .7, "#f2d94a"]]) {
        o.g.beginPath(); o.g.ellipse(x, y, t, t * .55, 0, 0, Math.PI * 2); o.g.fillStyle = c; o.g.fill();
        o.forme([[x - t * .8, y], [x - t * 1.7, y + t * .55], [x - t * 1.7, y - t * .55]], c); o.disque(x + t * .55, y + t * .1, t * .11, "#10222c");
      }
      for (let i = 0; i < 90; i++) { o.g.strokeStyle = "rgba(225,250,255,.7)"; o.g.lineWidth = .05; o.g.beginPath(); o.g.arc(o.entre(-29, 29), o.entre(1, 10), o.entre(.06, .24), 0, Math.PI * 2); o.g.stroke(); }
    } },
    { nom: "Ville du futur", sol: 0x9aa3b8, dessiner(o) {
      o.ciel([[0, "#f7b7d4"], [4.5, "#9d8cf0"], [10, "#4a55b8"], [22, "#171b4d"]]);
      o.etoiles(220, 8);
      for (const [c, haut] of [["#4a5a9e", 7.6], ["#2b356e", 5.6]]) {
        let x = -30;
        while (x < 30) {
          const l = o.entre(1.4, 3), h = o.entre(2.4, haut);
          o.rect(x, 0, l, h, c); o.disque(x + l / 2, h, l / 2, c);
          for (let y = .9; y < h - .2; y += .62) o.rect(x + .2, y, l - .4, .12, o.alea() < .5 ? "rgba(130,240,255,.75)" : "rgba(255,190,235,.55)");
          x += l + o.entre(.3, 1.3);
        }
      }
      for (const y of [3.4, 6.3]) { o.rect(-30, y, 60, .16, "#bfeaff"); for (let x = -26; x < 28; x += 9.5) { const dx = x + o.entre(0, 3); o.rect(dx, y + .2, 2.2, .55, "#ffe27a"); o.disque(dx + 2.2, y + .47, .28, "#ffe27a"); } }
      o.garde("#12163a");
    } },
    { nom: "Champs et éoliennes", sol: 0xb4ae93, dessiner(o) {
      o.ciel([[0, "#d9eefb"], [5, "#9fd0f2"], [22, "#4f8fd0"]]);
      for (let i = 0; i < 9; i++) o.nuage(o.entre(-26, 26), o.entre(5, 11), o.entre(.6, 1.2));
      for (let x = -24; x <= 24; x += 8) {
        const px = x + o.entre(-2, 2), h = o.entre(4.5, 7);
        o.trait(px, 1.5, px, h, "#f4f7fa", .22);
        for (let k = 0; k < 3; k++) { const a = .5 + k * 2.094 + x; o.trait(px, h, px + Math.cos(a) * 2.2, h + Math.sin(a) * 2.2, "#ffffff", .16); }
        o.disque(px, h, .22, "#c9d3dc");
      }
      o.cretes(2.4, 1.1, 5, "#7fb36a"); o.cretes(1.2, .8, 4, "#d9b94c"); o.cretes(.5, .5, 3, "#5f9a4f");
      o.garde("#6b5535", 1.1);
    } },
    { nom: "Désert et pyramides", sol: 0xcdb594, dessiner(o) {
      o.ciel([[0, "#ffe3ac"], [4, "#f7b66e"], [9, "#c97f8f"], [22, "#4d4f87"]]);
      o.halo(9, 6.2, 3.6, "rgba(255,238,190,.9)"); o.disque(9, 6.2, 1.25, "#fff1c4");
      for (const [x, h] of [[-13, 6.4], [-5, 4.6], [16, 5.2]]) {
        o.forme([[x - h, 1], [x, h], [x + h, 1]], "#c8925a");
        o.forme([[x, h], [x + h, 1], [x + h * .25, 1]], "#9d6c43");
      }
      o.cretes(1.6, 1.2, 7, "#dca45f"); o.cretes(.7, .8, 5, "#c88a49");
      o.garde("#5a3d28", 1.05);
    } },
    { nom: "Île tropicale", sol: 0xbdb49b, dessiner(o) {
      o.ciel([[0, "#c9f1f2"], [4.5, "#8fd6ee"], [22, "#2f82c4"]]);
      o.rect(-30, 0, 60, 3.4, "#1f97ad");
      for (let i = 0; i < 90; i++) o.rect(o.entre(-30, 29), o.entre(.8, 3.2), o.entre(.4, 1.8), .06, "rgba(255,255,255,.55)");
      for (let i = 0; i < 6; i++) o.nuage(o.entre(-26, 26), o.entre(6, 11), o.entre(.7, 1.3));
      for (const x of [-15, -6.5, 12.5, 20]) {
        o.forme([[x - 3.4, 1.4], [x - 1.4, 2.5], [x + 1.4, 2.5], [x + 3.4, 1.4]], "#e8cf8e");
        o.trait(x, 2.3, x + .7, 6, "#7a5530", .34);
        for (const [dx, dy] of [[-2.2, -.4], [-1.5, 1], [.1, 1.4], [1.7, .9], [2.3, -.5]]) o.forme([[x + .7, 6], [x + .7 + dx * .55, 6.35 + dy], [x + .7 + dx, 6 + dy * .5]], "#2f7d43");
      }
      o.garde("#6d4a2c", 1.1);
    } },
    { nom: "Fête foraine", sol: 0x9b97ad, dessiner(o) {
      o.ciel([[0, "#f2a07b"], [4.5, "#8d5f9e"], [10, "#34376f"], [22, "#131737"]]);
      o.etoiles(160, 7);
      const roue = (cx, cy, r) => {
        o.g.strokeStyle = "#e7d9f4"; o.g.lineWidth = .16; o.g.beginPath(); o.g.arc(cx, cy, r, 0, Math.PI * 2); o.g.stroke();
        for (let k = 0; k < 12; k++) {
          const a = k * Math.PI / 6, x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
          o.trait(cx, cy, x, y, "#a892c8", .08); o.disque(x, y, .42, ["#ffd35a", "#ff6f7d", "#62d6e8"][k % 3]);
        }
        o.trait(cx, cy, cx - r * .6, 0, "#6d5a8c", .3); o.trait(cx, cy, cx + r * .6, 0, "#6d5a8c", .3);
      };
      roue(-11, 5, 3.9); roue(15, 3.8, 2.6);
      for (let x = -4; x <= 9; x += 4.3) {
        o.rect(x - 1.6, 0, 3.2, 2.4, "#3a2f5c");
        for (let k = 0; k < 4; k++) o.forme([[x - 1.8 + k * .9, 2.4], [x, 4.4], [x - .9 + k * .9, 2.4]], k % 2 ? "#f2ead8" : "#c94452");
      }
      for (let x = -29; x < 29; x += .9) o.disque(x, 4.9 + Math.sin(x * .55) * .45, .11, "#ffe9a8");
      o.garde("#171433", 1.1);
    } },
    { nom: "Station de montagne", sol: 0xc3c8cc, dessiner(o) {
      o.ciel([[0, "#e6f4fd"], [5, "#a9d2f0"], [22, "#4a7fb8"]]);
      o.cretes(5.2, 3.6, 5.5, "#8aa3bd"); o.cretes(3.6, 2.4, 3.2, "#dfe8f0"); o.cretes(1.6, 1.6, 4, "#6f879c");
      o.trait(-30, 8.6, 30, 4.6, "#323c48", .09);
      for (const x of [-12, 3, 18]) {
        const y = 6.6 - x * (4 / 60);
        o.trait(x, y, x, y - .8, "#323c48", .12); o.rect(x - 1, y - 2.2, 2, 1.45, "#c4453c");
        o.rect(x - .8, y - 1.55, .65, .55, "#dff0fb"); o.rect(x + .15, y - 1.55, .65, .55, "#dff0fb");
      }
      for (let x = -28; x < 29; x += 2.1) { const h = o.entre(1.4, 2.9); o.forme([[x - .75, .4], [x, h], [x + .75, .4]], "#2f5a45"); }
      o.garde("#3c4651", 1);
    } },
  ];

  /* Rend le décor demandé dans une toile 3072 x 1126, pour un plan de 60 x 22 unités */
  function peindre(i) {
    const toile = document.createElement("canvas");
    toile.width = 3072; toile.height = 1126;
    const g = toile.getContext("2d"), echelle = toile.width / 60;
    g.setTransform(echelle, 0, 0, -echelle, toile.width / 2, toile.height);
    DECORS[i].dessiner(outils(g, 4271 + i * 977));
    return adoucir(toile);
  }

  /* Le fond doit rester en retrait des caisses et du bras (demande de l'enseignant) :
     flou, couleurs et contrastes atténués, puis voile gris-bleu. Les trois réglages sont ici. */
  const FLOU = 7, DOUCEUR = "saturate(.62) contrast(.84) brightness(.93)", VOILE = "rgba(96,108,124,.22)";
  function adoucir(source) {
    const toile = document.createElement("canvas");
    toile.width = source.width; toile.height = source.height;
    const g = toile.getContext("2d"), m = FLOU * 3;
    g.drawImage(source, 0, 0); /* base nette sous les bords, et secours si « filter » n'existe pas */
    g.filter = `blur(${FLOU}px) ${DOUCEUR}`;
    /* légèrement agrandi : le flou ne laisse pas de bord pâle */
    g.drawImage(source, -m, -m, toile.width + 2 * m, toile.height + 2 * m);
    g.filter = "none";
    g.fillStyle = VOILE; g.fillRect(0, 0, toile.width, toile.height);
    return toile;
  }

  window.Decors = { liste: DECORS, peindre };
}

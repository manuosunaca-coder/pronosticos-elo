/* Pronósticos Elo — widget para Blogger.
   Uso: <div id="pfe-app" data-view="all"></div><script src="https://USUARIO.github.io/pronosticos-elo/widget.js"></script>
   data-view: "all" (completo) | "picks" | "results" | "ranking" | "mini" (sidebar: top 5 fuertes) */
(function () {
  var SCRIPT = document.currentScript;
  var BASE = SCRIPT && SCRIPT.src ? SCRIPT.src.replace(/[^\/]*$/, "") : "";
  var CSS = "\
.pfe{--g:#14532d;--g2:#166534;--gl:#dcfce7;--ink:#0f172a;--mut:#64748b;--line:#e2e8f0;--bg:#fff;--soft:#f8fafc;--red:#b91c1c;--gold:#b45309;\
font:14px/1.45 system-ui,-apple-system,'Segoe UI',Roboto,Arial,sans-serif;color:var(--ink);background:var(--bg);max-width:100%;overflow:hidden;text-align:left}\
.pfe *{box-sizing:border-box}.pfe a{color:inherit}\
.pfe-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:0 0 12px}\
.pfe-stat{background:var(--soft);border:1px solid var(--line);border-radius:10px;padding:10px 12px}\
.pfe-stat b{display:block;font-size:22px;line-height:1.1;font-variant-numeric:tabular-nums}.pfe-stat span{font-size:12px;color:var(--mut)}\
.pfe-pos{color:var(--g2)}.pfe-neg{color:var(--red)}\
.pfe-tabs{display:flex;gap:4px;border-bottom:2px solid var(--g);margin-bottom:10px;overflow-x:auto}\
.pfe-tab{border:0;background:var(--soft);color:var(--ink);padding:8px 14px;border-radius:8px 8px 0 0;cursor:pointer;font:600 14px inherit;font-family:inherit;white-space:nowrap}\
.pfe-tab.on{background:var(--g);color:#fff}\
.pfe-filters{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:10px}\
.pfe-filters input[type=search],.pfe-filters select{padding:7px 9px;border:1px solid var(--line);border-radius:8px;font:inherit;background:#fff;color:var(--ink);min-width:0}\
.pfe-filters input[type=search]{flex:1 1 160px}.pfe-filters label{display:flex;gap:6px;align-items:center;font-size:13px;cursor:pointer;white-space:nowrap}\
.pfe-wrap{overflow-x:auto;-webkit-overflow-scrolling:touch}\
.pfe table{width:100%;border-collapse:collapse;font-variant-numeric:tabular-nums;margin:0}\
.pfe th{background:var(--g);color:#fff;font-weight:600;font-size:12px;padding:7px 6px;text-align:left;white-space:nowrap;border:0}\
.pfe td{padding:7px 6px;border:0;border-bottom:1px solid var(--line);vertical-align:middle}\
.pfe tr.pfe-sure td{background:#f0fdf4}.pfe tr:hover td{background:#f1f5f9}\
.pfe-day td{background:var(--soft)!important;font-weight:700;font-size:12px;color:var(--mut)}\
.pfe-lg{display:flex;align-items:center;gap:5px;white-space:nowrap;font-size:12px;color:var(--mut)}.pfe-lg img{width:18px;height:12px;border-radius:2px;box-shadow:0 0 0 1px rgba(0,0,0,.1)}\
.pfe-m{min-width:170px}.pfe-m b{font-weight:700}.pfe-up{color:var(--g2);font-weight:700}.pfe-dn{color:var(--red);font-weight:700}\
.pfe-o{display:inline-block;min-width:38px;text-align:center;padding:2px 4px;border-radius:5px;color:var(--mut)}\
.pfe-o.on{background:var(--g);color:#fff;font-weight:700}\
.pfe-c{display:inline-block;min-width:30px;text-align:center;padding:3px 6px;border-radius:999px;font-weight:700;font-size:12px;background:#e2e8f0}\
.pfe-c.c8{background:#bbf7d0;color:#14532d}.pfe-c.c9{background:#4ade80;color:#052e16}.pfe-c.c10{background:var(--g);color:#fff}\
.pfe-ok{color:var(--g2);font-weight:700}.pfe-ko{color:var(--red);font-weight:700}\
.pfe-note{font-size:12px;color:var(--mut);margin:10px 0 0}\
.pfe-rg{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:12px}\
.pfe-rg ol{margin:0;padding:0;list-style:none;border:1px solid var(--line);border-radius:10px;overflow:hidden}\
.pfe-rg li{display:flex;justify-content:space-between;gap:8px;padding:6px 10px;border-bottom:1px solid var(--line)}\
.pfe-rg li:last-child{border:0}.pfe-rg h4{margin:0 0 6px;font-size:14px;display:flex;gap:6px;align-items:center}\
.pfe-help{background:var(--soft);border:1px solid var(--line);border-radius:10px;padding:12px 16px}.pfe-help p{margin:0 0 8px}\
.pfe-18{display:flex;gap:10px;align-items:center;margin-top:12px;padding:10px 12px;border-radius:10px;background:#fff7ed;border:1px solid #fed7aa;font-size:12px;color:#7c2d12}\
.pfe-18 strong{display:inline-grid;place-items:center;min-width:34px;height:34px;border-radius:50%;border:2px solid #c2410c;font-size:13px;color:#c2410c}\
.pfe-empty{padding:24px;text-align:center;color:var(--mut)}\
.pfe-mini li{display:block}.pfe-mini small{color:var(--mut)}\
.pfe-cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:14px;padding:3px 1px}\
.pfe-card{background:#fff;border:1px solid var(--line);border-radius:14px;padding:14px 16px;display:flex;flex-direction:column;gap:10px;transition:transform .15s,box-shadow .15s}\
.pfe-card:hover{transform:translateY(-2px);box-shadow:0 10px 24px rgba(20,83,45,.12)}\
.pfe-card.hot{border-color:#86efac;background:linear-gradient(180deg,#f0fdf4,#fff 55%)}\
.pfe-card header{display:flex;justify-content:space-between;align-items:center;gap:8px;font-size:12px;color:var(--mut)}\
.pfe-card time{white-space:nowrap;font-variant-numeric:tabular-nums;font-weight:600}\
.pfe-teams{display:grid;gap:1px;font-size:15px;line-height:1.3}\
.pfe-teams .vs{font-size:10px;color:var(--mut);text-transform:uppercase;letter-spacing:.1em}\
.pfe-teams .on{font-weight:800;color:var(--g)}\
.pfe-pick{display:flex;justify-content:space-between;align-items:center;background:var(--g);color:#fff;border-radius:10px;padding:8px 12px;font-weight:600;font-size:14px}\
.pfe-pick b{font-size:20px;font-variant-numeric:tabular-nums}\
.pfe-meter{display:flex;align-items:center;gap:3px}\
.pfe-meter i{flex:1;height:6px;border-radius:3px;background:#e2e8f0}\
.pfe-meter i.on{background:#4ade80}.pfe-card.hot .pfe-meter i.on{background:#16a34a}\
.pfe-meter em{font-style:normal;font-size:12px;font-weight:800;margin-left:6px;color:var(--ink)}\
.pfe-card footer{display:flex;justify-content:space-between;font-size:12px;color:var(--mut)}\
@media(max-width:640px){.pfe-stats{grid-template-columns:repeat(2,1fr)}.pfe-hm{display:none}.pfe td,.pfe th{padding:6px 4px}.pfe{font-size:13px}.pfe-m{min-width:120px}.pfe-o{min-width:32px;padding:2px 2px}}\
";
  var LG_ES = { "1": "Local", "X": "Empate", "2": "Visitante" };

  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function flag(c) { return '<img loading="lazy" alt="" src="https://flagcdn.com/w40/' + esc(c) + '.png">'; }
  function tr(v) { return v > 0 ? ' <span class="pfe-up" title="En forma">↑</span>' : v < 0 ? ' <span class="pfe-dn" title="Mala racha">↓</span>' : ""; }
  function hm(t) { // football-data da la hora del Reino Unido; España es siempre +1
    var m = /^(\d{1,2}):(\d{2})/.exec(t || ""); if (!m) return "–";
    var h = (+m[1] + 1) % 24; return (h < 10 ? "0" : "") + h + ":" + m[2];
  }
  function dayShort(d) {
    var t = new Date(), iso = function (x) { return x.getFullYear() + "-" + ("0" + (x.getMonth() + 1)).slice(-2) + "-" + ("0" + x.getDate()).slice(-2); };
    if (d === iso(t)) return "Hoy";
    t.setDate(t.getDate() + 1); if (d === iso(t)) return "Mañana";
    return fmtDay(d).split(",")[0];
  }
  function sign(n) { return (n > 0 ? "+" : "") + n; }
  function fmtDay(d) {
    var dt = new Date(d + "T12:00:00");
    var s = dt.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" });
    return s.charAt(0).toUpperCase() + s.slice(1);
  }
  function el(html) { var t = document.createElement("div"); t.innerHTML = html; return t.firstChild; }

  function init(root) {
    if (root.__pfe) return; root.__pfe = 1;
    var view = root.getAttribute("data-view") || "all";
    var src = root.getAttribute("data-src") || BASE + "data.json";
    root.className += " pfe";
    root.innerHTML = '<div class="pfe-empty">Cargando pronósticos…</div>';
    fetch(src + (src.indexOf("?") < 0 ? "?" : "&") + "t=" + Math.floor(Date.now() / 600000))
      .then(function (r) { return r.json(); })
      .then(function (d) { render(root, d, view); })
      .catch(function () { root.innerHTML = '<div class="pfe-empty">No se han podido cargar los pronósticos. Inténtalo en unos minutos.</div>'; });
  }

  function statTiles(s) {
    var a = s.all_250, b = s.sure_250;
    function t(v, l, cls) { return '<div class="pfe-stat"><b class="' + (cls || "") + '">' + v + '</b><span>' + l + '</span></div>'; }
    if (!a || !a.n) return '<div class="pfe-stats">' + t("—", "Aciertos (se calcula al jugarse los primeros partidos)") + t("—", "Beneficio") + t("—", "ROI") + t("—", "Apuestas fuertes") + '</div>';
    return '<div class="pfe-stats">' +
      t(a.hit_rate + "%", "Aciertos · últimos " + a.n + " pronósticos") +
      t(sign(a.profit) + " u", "Beneficio a 1 unidad por apuesta", a.profit >= 0 ? "pfe-pos" : "pfe-neg") +
      t(sign(a.roi) + "%", "ROI · cuota media " + a.avg_odds, a.roi >= 0 ? "pfe-pos" : "pfe-neg") +
      t(b.n ? b.hit_rate + "%" : "—", "Aciertos apuestas fuertes (8-10)" + (b.n ? " · " + sign(b.roi) + "% ROI" : "")) + '</div>';
  }

  function render(root, d, view) {
    // ocultar partidos ya terminados (empezaron hace más de 2 horas)
    var now = Date.now();
    d.upcoming = d.upcoming.filter(function (u) {
      var k = Date.parse(u.date + "T" + (/^\d{1,2}:\d{2}$/.test(u.time) ? ("0" + u.time).slice(-5) : "12:00") + ":00Z");
      return isNaN(k) || k > now - 2 * 3600 * 1000;
    });
    // categorías: data-lg="SP1,SP2" limita la tabla a esas ligas
    var lgs = (root.getAttribute("data-lg") || "").split(",").filter(Boolean);
    if (lgs.length) {
      var inL = function (x) { return lgs.indexOf(x.lg) >= 0; };
      d.upcoming = d.upcoming.filter(inL); d.recent = d.recent.filter(inL);
      d.leagues = d.leagues.filter(inL); d.top = d.top.filter(inL);
      var st = function (ps) {
        if (!ps.length) return { n: 0, hits: 0, hit_rate: 0, profit: 0, roi: 0, avg_odds: 0 };
        var h = 0, pr = 0, od = 0; ps.forEach(function (p) { if (p.win) h++; pr += p.profit; od += p.pick_odds; });
        return { n: ps.length, hits: h, hit_rate: Math.round(1000 * h / ps.length) / 10, profit: Math.round(pr * 100) / 100, roi: Math.round(1000 * pr / ps.length) / 10, avg_odds: Math.round(100 * od / ps.length) / 100 };
      };
      var sure = d.recent.filter(function (p) { return p.conf >= 8; }), mo = new Date().toISOString().slice(0, 7);
      var inM = function (p) { return p.date.slice(0, 7) === mo; };
      d.stats = { all_250: st(d.recent), sure_250: st(sure), month: st(d.recent.filter(inM)), sure_month: st(sure.filter(inM)) };
    }
    var leagues = {}; d.upcoming.forEach(function (u) { leagues[u.lg] = u; });
    var opts = Object.keys(leagues).sort(function (a, b) { return leagues[a].league.localeCompare(leagues[b].league); })
      .map(function (k) { return '<option value="' + esc(k) + '">' + esc(leagues[k].league) + '</option>'; }).join("");
    var upd = new Date(d.generated).toLocaleString("es-ES", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

    if (view === "cards") {
      var max = +(root.getAttribute("data-max") || 6);
      var pool = d.upcoming.filter(function (u) { return u.conf >= 7; })
        .sort(function (a, b) { return b.conf - a.conf || (a.date + a.time).localeCompare(b.date + b.time); }).slice(0, max);
      if (!pool.length) { root.innerHTML = '<div class="pfe-empty">Ahora mismo no hay apuestas con suficiente valor. El modelo vuelve a calcular dos veces al día.</div>'; return; }
      root.innerHTML = '<div class="pfe-cards">' + pool.map(function (u) {
        var lbl = u.pick === "X" ? "Empate" : "Gana " + (u.pick === "1" ? u.home : u.away), seg = "";
        for (var i = 1; i <= 10; i++) seg += '<i class="' + (i <= u.conf ? "on" : "") + '"></i>';
        return '<article class="pfe-card' + (u.conf >= 8 ? " hot" : "") + '">' +
          '<header><span class="pfe-lg">' + flag(u.flag) + esc(u.league) + '</span><time>' + dayShort(u.date) + ' · ' + esc(hm(u.time)) + '</time></header>' +
          '<div class="pfe-teams"><span' + (u.pick === "1" ? ' class="on"' : "") + '>' + esc(u.home) + tr(u.tr_h) + '</span><span class="vs">vs</span><span' + (u.pick === "2" ? ' class="on"' : "") + '>' + esc(u.away) + tr(u.tr_a) + '</span></div>' +
          '<div class="pfe-pick"><span>' + esc(lbl) + '</span><b>' + u.pick_odds.toFixed(2) + '</b></div>' +
          '<div class="pfe-meter" title="Confianza ' + u.conf + ' de 10">' + seg + '<em>' + u.conf + '/10</em></div>' +
          '<footer><span>Probabilidad ' + u.pick_prob + '%</span><span class="pfe-pos">Valor ' + sign(u.edge) + '%</span></footer></article>';
      }).join("") + '</div>';
      return;
    }
    if (view === "mini") {
      var top = d.upcoming.filter(function (u) { return u.conf >= 8; }).sort(function (a, b) { return b.conf - a.conf || a.date.localeCompare(b.date); }).slice(0, 6);
      root.innerHTML = '<div class="pfe-rg pfe-mini" style="display:block"><ol>' + (top.length ? top.map(function (u) {
        var pick = u.pick === "1" ? u.home : u.pick === "2" ? u.away : "Empate";
        return '<li><span class="pfe-c c' + u.conf + '">' + u.conf + '</span> <b>' + esc(pick) + '</b> @' + u.pick_odds + '<br><small>' + esc(u.home) + ' – ' + esc(u.away) + ' · ' + esc(u.league) + '</small></li>';
      }).join("") : '<li>No hay apuestas fuertes ahora mismo.</li>') + '</ol></div><p class="pfe-note">+18 · Juega con responsabilidad. Actualizado ' + esc(upd) + '</p>';
      return;
    }

    var tabs = [["picks", "Pronósticos"], ["results", "Resultados"], ["ranking", "Ranking Elo"], ["help", "Cómo funciona"]];
    if (view !== "all") tabs = tabs.filter(function (t) { return t[0] === view; });
    root.innerHTML = (view === "all" || view === "picks" || view === "results" ? statTiles(d.stats) : "") +
      (tabs.length > 1 ? '<div class="pfe-tabs">' + tabs.map(function (t, i) { return '<button class="pfe-tab' + (i ? "" : " on") + '" data-t="' + t[0] + '">' + t[1] + '</button>'; }).join("") + '</div>' : "") +
      '<div class="pfe-body"></div>' +
      '<div class="pfe-18"><strong>+18</strong><span>Pronósticos generados por un modelo estadístico, con fines informativos. Ninguna apuesta es segura: apuesta solo lo que puedas permitirte perder. Ayuda: <a href="https://www.jugarbien.es" target="_blank" rel="nofollow noopener">jugarbien.es</a> · Actualizado ' + esc(upd) + '.</span></div>';
    var body = root.querySelector(".pfe-body");
    var state = { q: "", lg: "", sure: root.getAttribute("data-sure") === "1", day: "" };

    function picks() {
      var days = {}; d.upcoming.forEach(function (u) { days[u.date] = 1; });
      body.innerHTML = '<div class="pfe-filters"><input type="search" placeholder="Buscar equipo…" value="' + esc(state.q) + '">' +
        '<select data-f="lg"><option value="">Todas las ligas</option>' + opts + '</select>' +
        '<select data-f="day"><option value="">Todos los días</option>' + Object.keys(days).sort().map(function (k) { return '<option value="' + k + '">' + fmtDay(k) + '</option>'; }).join("") + '</select>' +
        '<label><input type="checkbox"' + (state.sure ? " checked" : "") + '> Solo apuestas fuertes (8-10)</label></div><div class="pfe-wrap pfe-t"></div>' +
        '<p class="pfe-note">En negrita, el equipo pronosticado y su cuota en verde. <b>Prob.</b> = probabilidad según el modelo. <b>Valor</b> = cuánto mejor es la cuota de lo que debería (más alto, mejor). ↑↓ = racha del equipo.</p>';
      body.querySelector("[data-f=lg]").value = state.lg; body.querySelector("[data-f=day]").value = state.day;
      body.querySelector("input[type=search]").oninput = function (e) { state.q = e.target.value; table(); };
      body.querySelector("[data-f=lg]").onchange = function (e) { state.lg = e.target.value; table(); };
      body.querySelector("[data-f=day]").onchange = function (e) { state.day = e.target.value; table(); };
      body.querySelector("input[type=checkbox]").onchange = function (e) { state.sure = e.target.checked; table(); };
      table();
    }
    function table() {
      var q = state.q.toLowerCase();
      var rows = d.upcoming.filter(function (u) {
        return (!state.lg || u.lg === state.lg) && (!state.day || u.date === state.day) && (!state.sure || u.conf >= 8) &&
          (!q || (u.home + " " + u.away).toLowerCase().indexOf(q) >= 0);
      });
      var t = body.querySelector(".pfe-t");
      if (!rows.length) { t.innerHTML = '<div class="pfe-empty">No hay partidos con esos filtros.</div>'; return; }
      var h = '<table><thead><tr><th title="Hora peninsular española">Hora</th><th class="pfe-hm">Liga</th><th>Partido</th><th>1</th><th>X</th><th>2</th><th class="pfe-hm">Prob.</th><th class="pfe-hm">Valor</th><th>Conf.</th></tr></thead><tbody>', last = "";
      rows.forEach(function (u) {
        if (u.date !== last) { last = u.date; h += '<tr class="pfe-day"><td colspan="9">' + fmtDay(u.date) + '</td></tr>'; }
        var hn = esc(u.home), an = esc(u.away);
        if (u.pick === "1") hn = "<b>" + hn + "</b>"; if (u.pick === "2") an = "<b>" + an + "</b>";
        var oc = function (i, s) { return '<td><span class="pfe-o' + (u.pick === s ? " on" : "") + '">' + u.odds[i].toFixed(2) + '</span></td>'; };
        h += '<tr class="' + (u.conf >= 8 ? "pfe-sure" : "") + '" title="Elo ' + u.home + ': ' + u.elo_h + ' · Elo ' + u.away + ': ' + u.elo_a + ' · Prob. 1/X/2: ' + u.prob.join(" / ") + '%">' +
          '<td>' + esc(hm(u.time)) + '</td><td class="pfe-hm"><span class="pfe-lg">' + flag(u.flag) + esc(u.league) + '</span></td>' +
          '<td class="pfe-m">' + hn + tr(u.tr_h) + ' – ' + an + tr(u.tr_a) + (u.pick === "X" ? ' <b>(empate)</b>' : "") + '</td>' +
          oc(0, "1") + oc(1, "X") + oc(2, "2") +
          '<td class="pfe-hm">' + u.pick_prob + '%</td><td class="pfe-hm ' + (u.edge > 0 ? "pfe-pos" : "pfe-neg") + '">' + sign(u.edge) + '%</td>' +
          '<td><span class="pfe-c c' + u.conf + '">' + u.conf + '</span></td></tr>';
      });
      t.innerHTML = h + "</tbody></table>";
    }
    function results() {
      var s = d.stats;
      if (!d.recent.length) { body.innerHTML = '<div class="pfe-empty">Aún no hay pronósticos terminados. En cuanto se jueguen los primeros partidos aparecerán aquí con su resultado.</div>'; return; }
      var h = '<p class="pfe-note" style="margin:0 0 8px">Este mes: ' + s.month.n + ' pronósticos, ' + s.month.hit_rate + '% de aciertos, ' + sign(s.month.profit) + ' unidades. Apuestas fuertes: ' + s.sure_month.n + ', ' + (s.sure_month.n ? s.sure_month.hit_rate + "% de aciertos, " + sign(s.sure_month.profit) + " u." : "—") + '</p>' +
        '<div class="pfe-wrap"><table><thead><tr><th>Fecha</th><th class="pfe-hm">Liga</th><th>Partido</th><th>Pronóstico</th><th>Res.</th><th></th><th>+/-</th></tr></thead><tbody>';
      d.recent.forEach(function (p) {
        var pk = p.pick === "1" ? p.home : p.pick === "2" ? p.away : "Empate";
        h += '<tr class="' + (p.conf >= 8 ? "pfe-sure" : "") + '"><td>' + p.date.slice(8, 10) + "/" + p.date.slice(5, 7) + '</td><td class="pfe-hm"><span class="pfe-lg">' + flag(p.flag) + esc(p.league) + '</span></td>' +
          '<td class="pfe-m">' + esc(p.home) + ' – ' + esc(p.away) + '</td><td>' + esc(pk) + ' @' + p.pick_odds + ' <span class="pfe-c c' + p.conf + '">' + p.conf + '</span></td>' +
          '<td>' + esc(p.score) + '</td><td class="' + (p.win ? "pfe-ok" : "pfe-ko") + '">' + (p.win ? "✔" : "✘") + '</td><td class="' + (p.profit >= 0 ? "pfe-pos" : "pfe-neg") + '">' + sign(p.profit) + '</td></tr>';
      });
      body.innerHTML = h + "</tbody></table></div>";
    }
    function ranking() {
      var h = '<div class="pfe-rg"><div><h4>🌍 Top 30 mundial</h4><ol>' + d.top.map(function (t, i) {
        return '<li><span>' + (i + 1) + '. ' + flag(t.flag).replace("<img", '<img style="width:16px;height:11px;vertical-align:-1px"') + ' ' + esc(t.team) + '</span><b>' + t.elo + '</b></li>';
      }).join("") + '</ol></div>';
      d.leagues.forEach(function (l) {
        h += '<div><h4>' + flag(l.flag).replace("<img", '<img style="width:18px;height:12px"') + esc(l.league) + '</h4><ol>' + l.teams.map(function (t, i) {
          return '<li><span>' + (i + 1) + '. ' + esc(t.team) + tr(t.tr) + '</span><b>' + t.elo + '</b></li>';
        }).join("") + '</ol></div>';
      });
      body.innerHTML = h + '</div>';
    }
    function help() {
      body.innerHTML = '<div class="pfe-help">' +
        '<p><b>1. Rating Elo.</b> Cada equipo tiene una puntuación que sube cuando gana y baja cuando pierde; gana más puntos si vence a un rival fuerte o por mucha diferencia. Se calcula con los resultados de las últimas ' + 3 + ' temporadas (' + d.model.matches.toLocaleString("es-ES") + ' partidos).</p>' +
        '<p><b>2. Probabilidades.</b> Con la diferencia de Elo (más la ventaja de jugar en casa) miramos qué pasó en miles de partidos parecidos: cuántas veces ganó el local, cuántas hubo empate y cuántas ganó el visitante.</p>' +
        '<p><b>3. Valor.</b> Comparamos esa probabilidad con las cuotas medias de las casas. Si la cuota paga más de lo que debería, hay valor. El pronóstico es la opción con más valor.</p>' +
        '<p><b>4. Confianza 1-10.</b> Depende del valor y de lo probable que sea el pronóstico. Las <b>apuestas fuertes</b> son las de 8, 9 y 10.</p>' +
        '<p><b>5. Transparencia.</b> Todos los pronósticos de 6 o más se guardan y se comprueban solos cuando termina el partido. Las estadísticas de arriba son reales, aciertos y fallos incluidos.</p>' +
        '<p style="margin:0">Se actualiza automáticamente dos veces al día. Datos de resultados y cuotas: football-data.co.uk.</p></div>';
    }
    var views = { picks: picks, results: results, ranking: ranking, help: help };
    root.querySelectorAll(".pfe-tab").forEach(function (b) {
      b.onclick = function () {
        root.querySelectorAll(".pfe-tab").forEach(function (x) { x.classList.remove("on"); });
        b.classList.add("on"); views[b.getAttribute("data-t")]();
      };
    });
    views[tabs[0][0]]();
  }

  function boot() {
    if (!document.getElementById("pfe-css")) {
      var st = document.createElement("style"); st.id = "pfe-css"; st.textContent = CSS; document.head.appendChild(st);
    }
    document.querySelectorAll("#pfe-app,.pfe-app").forEach(init);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();

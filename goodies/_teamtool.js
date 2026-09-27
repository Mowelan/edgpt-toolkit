/*
 * Gedeelde motor voor de teamtools op www.ed-gpt.nl/tools (keuzehulp, trainingskiezer, ai-act,
 * tijdwinst, promptbouwer). Gebouwd 27-09-2026.
 * Rekenlogica en teksten komen ongewijzigd uit de oude /tools-pagina:
 *   legacy/tools-logic.js  (window.EdTools: adviseerModel, kiesTraining, aiActCheck, berekenTijdwinst, bouwPrompt, samenvatting)
 *   legacy/tools-ui.js     (window.EdToolsUI: labels en uitkomstteksten; de oude mount-functie wordt niet gebruikt)
 *   legacy/vragen.js       (window.EDGPT_VRAGEN: vragen, opties en velden)
 */
(function () {
  if (window.EDGPT_TEAMTOOL) return;

  var LINKMAP = { '/trainingen#ai-basis': '/trainingen#basis', '/trainingen#werken-met-claude': '/trainingen#claude', '/trainingen#ai-agents': '/trainingen#agents', '/trainingen#content-en-research': '/trainingen#content' };
  var SITE = 'https://www.ed-gpt.nl';
  function fixLink(h) { h = LINKMAP[h] || h; return h.charAt(0) === '/' ? SITE + h : h; }
  function fixTekst(s) { for (var k in LINKMAP) { if (LINKMAP.hasOwnProperty(k)) s = s.split(k).join(LINKMAP[k]); } return s; }

  var CSS = '' +
    '.tt-head{display:grid;grid-template-columns:auto 1fr;gap:clamp(16px,2.4vw,28px);align-items:center;margin-bottom:clamp(24px,3.5vw,40px)}' +
    '.tt-head img{width:clamp(88px,11vw,132px);height:auto;border-radius:18px;display:block}' +
    '.tt-head h1{font-size:clamp(34px,5vw,60px);margin:6px 0 10px}' +
    '.tt-head p{margin:0;color:var(--ink70);max-width:60ch;font-size:clamp(16px,1.5vw,18px)}' +
    '@media(max-width:600px){.tt-head{grid-template-columns:1fr;gap:10px}.tt-head img{width:72px}}' +
    '.tt-card{background:var(--white);border:1px solid var(--line);border-radius:22px;padding:clamp(18px,3vw,36px)}' +
    '.tt-progress{display:flex;gap:5px;margin-bottom:clamp(18px,3vw,28px)}' +
    '.tt-progress span{flex:1;height:6px;border-radius:99px;background:var(--paper);cursor:pointer;border:0;padding:0}' +
    '.tt-progress span.is-done{background:var(--purple-soft)}' +
    '.tt-progress span.is-now{background:var(--purple)}' +
    '.tt-step{display:grid;grid-template-columns:1fr;gap:clamp(16px,3vw,40px);align-items:start}' +
    '@media(min-width:820px){.tt-step{grid-template-columns:minmax(0,.62fr) minmax(0,1.38fr)}}' +
    '.tt-step>img{width:100%;max-width:300px;height:auto;border-radius:18px;display:block;justify-self:center}' +
    '@media(max-width:819px){.tt-step>img{max-width:96px;justify-self:start}}' +
    '.tt-count{font:600 12px var(--body);letter-spacing:.18em;text-transform:uppercase;color:var(--purple)}' +
    '.tt-q h2{font-size:clamp(22px,2.6vw,32px);line-height:1.15;margin:8px 0 8px}' +
    '.tt-q .tt-sub{color:var(--ink70);font-size:15px;margin:0 0 16px}' +
    '.tt-opts{display:grid;grid-template-columns:1fr;gap:10px;margin-top:16px}' +
    '@media(min-width:560px){.tt-opts.is-short{grid-template-columns:1fr 1fr}}' +
    '.tt-opt{display:flex;align-items:center;gap:12px;text-align:left;width:100%;padding:15px 16px;border:1.5px solid var(--line-strong);border-radius:14px;background:var(--white);font:600 15.5px/1.35 var(--body);color:var(--ink);cursor:pointer;transition:border-color .12s,background .12s}' +
    '.tt-opt:hover{border-color:var(--ink)}' +
    '.tt-opt .tt-key{flex:none;width:28px;height:28px;border-radius:9px;background:var(--paper);display:grid;place-items:center;font:700 13px var(--head);color:var(--ink70)}' +
    '.tt-opt[aria-pressed="true"]{border-color:var(--purple);background:var(--purple-tint)}' +
    '.tt-opt[aria-pressed="true"] .tt-key{background:var(--purple);color:#fff}' +
    '.tt-nav{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-top:20px;min-height:44px}' +
    '.tt-link{background:none;border:0;font:600 14.5px var(--body);color:var(--ink70);cursor:pointer;padding:8px 0}' +
    '.tt-link:hover{color:var(--ink)}' +
    '.tt-link[hidden]{display:none}' +
    /* resultaat */
    '.tt-res-top{display:grid;grid-template-columns:1fr;gap:clamp(16px,3vw,36px);align-items:center;margin-bottom:24px}' +
    '@media(min-width:820px){.tt-res-top{grid-template-columns:minmax(0,1.4fr) minmax(0,.9fr)}}' +
    '.tt-res-top h2{font-size:clamp(28px,3.6vw,46px);line-height:1.05;margin:12px 0 12px}' +
    '.tt-res-top p{color:var(--ink70);margin:0 0 10px;max-width:62ch}' +
    '.tt-viz{background:var(--ink);color:var(--cream);border-radius:18px;padding:18px 20px}' +
    '.tt-viz h3{font:600 12px var(--body);letter-spacing:.18em;text-transform:uppercase;color:rgba(230,226,216,.72);margin:0 0 12px}' +
    '.tt-bar{display:grid;grid-template-columns:minmax(80px,auto) 1fr;gap:10px;align-items:center;margin:8px 0;font-size:14px}' +
    '.tt-bar i{display:block;height:12px;border-radius:99px;background:rgba(250,247,241,.14);position:relative;overflow:hidden}' +
    '.tt-bar i b{position:absolute;inset:0 auto 0 0;border-radius:99px;background:var(--purple-soft)}' +
    '.tt-bar.is-top i b{background:var(--yellow)}' +
    '.tt-bar.is-top span{font-weight:700;color:#fff}' +
    '.tt-blocks{display:grid;grid-template-columns:1fr;gap:12px}' +
    '@media(min-width:760px){.tt-blocks{grid-template-columns:1fr 1fr}}' +
    '.tt-block{background:var(--cream);border-radius:16px;padding:16px 18px}' +
    '.tt-block h4{font:600 12px var(--body);letter-spacing:.16em;text-transform:uppercase;color:var(--purple);margin:0 0 6px}' +
    '.tt-block p,.tt-block li{font-size:15px;color:var(--ink70);margin:0 0 6px}' +
    '.tt-block ul{margin:0;padding-left:18px}' +
    '.tt-block a{color:var(--ink);font-weight:700;text-decoration:underline;text-decoration-color:var(--purple);text-underline-offset:3px}' +
    '.tt-answers{display:flex;flex-wrap:wrap;gap:8px;margin:20px 0 4px}' +
    '.tt-answers button{font:500 13.5px var(--body);border:1px solid var(--line-strong);background:var(--white);border-radius:999px;padding:7px 12px;cursor:pointer;color:var(--ink70)}' +
    '.tt-answers button:hover{border-color:var(--ink);color:var(--ink)}' +
    '.tt-answers button b{color:var(--ink);font-weight:600}' +
    '.tt-actions{display:flex;flex-wrap:wrap;gap:10px;margin-top:20px}' +
    '.tt-small{font-size:13.5px;color:var(--ink50);margin-top:14px}' +
    '.tt-meter{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin:4px 0 10px}' +
    '.tt-meter span{height:12px;border-radius:99px;background:rgba(250,247,241,.14)}' +
    '.tt-meter span.is-on[data-l="op-orde"]{background:#5CC98A}.tt-meter span.is-on[data-l="aandacht"]{background:#F5B942}.tt-meter span.is-on[data-l="prioriteit"]{background:#EF6A5A}' +
    '.tt-meter-lbl{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;font-size:12.5px;color:rgba(230,226,216,.7)}' +
    /* tijdwinst */
    '.tt-calc{display:grid;grid-template-columns:1fr;gap:clamp(18px,3vw,32px)}' +
    '@media(min-width:900px){.tt-calc{grid-template-columns:minmax(0,1fr) minmax(0,1.05fr);align-items:start}}' +
    '.tt-range{margin-bottom:22px}' +
    '.tt-range label{display:flex;justify-content:space-between;align-items:baseline;gap:10px;font:600 15px var(--body);margin-bottom:8px}' +
    '.tt-range label output{font:700 26px var(--head);color:var(--purple);letter-spacing:-.02em}' +
    '.tt-range input[type=range]{width:100%;accent-color:var(--purple);height:28px}' +
    '.tt-range input[type=number]{width:140px;font:700 20px var(--head);border:1.5px solid var(--line);border-radius:12px;padding:8px 12px;background:var(--cream)}' +
    '.tt-range p{font-size:13.5px;color:var(--ink70);margin:6px 0 0}' +
    '.tt-stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-bottom:16px}' +
    '.tt-stat{background:rgba(250,247,241,.07);border-radius:14px;padding:12px}' +
    '.tt-stat b{display:block;font:700 clamp(22px,2.6vw,32px)/1.05 var(--head);color:#fff;letter-spacing:-.02em}' +
    '.tt-stat b small{font:600 13px var(--body);color:rgba(230,226,216,.8);margin-left:4px}' +
    '.tt-stat span{font-size:12.5px;color:rgba(230,226,216,.72);display:block;margin-top:4px;line-height:1.3}' +
    '.tt-viz p{font-size:14px;color:rgba(230,226,216,.86);margin:10px 0 0}' +
    /* promptbouwer */
    '.tt-pb{display:grid;grid-template-columns:1fr;gap:18px}' +
    '@media(min-width:940px){.tt-pb{grid-template-columns:minmax(0,1fr) minmax(0,1.05fr);align-items:start}}' +
    '.tt-field{margin-bottom:16px}' +
    '.tt-field label{display:block;font:600 15px var(--body);margin-bottom:6px}' +
    '.tt-field input,.tt-field textarea{width:100%;font:15.5px/1.5 var(--body);color:var(--ink);background:var(--cream);border:1.5px solid var(--line);border-radius:12px;padding:11px 13px;resize:vertical}' +
    '.tt-field input:focus,.tt-field textarea:focus{outline:none;border-color:var(--ink);background:var(--white)}' +
    '.tt-field p{font-size:13.5px;color:var(--ink70);margin:5px 0 0}' +
    '.tt-more summary{cursor:pointer;font:600 14.5px var(--body);color:var(--ink70);margin:4px 0 14px;list-style:none}' +
    '.tt-more summary::-webkit-details-marker{display:none}' +
    '.tt-mon{background:var(--ink);color:var(--cream);border-radius:20px;padding:clamp(18px,2.6vw,26px)}' +
    '@media(min-width:940px){.tt-mon{position:sticky;top:100px}}' +
    '.tt-mon h2{font-size:20px;margin:0 0 14px}' +
    '.tt-mon pre{font:14.5px/1.7 var(--mono);white-space:pre-wrap;word-wrap:break-word;margin:0;min-height:120px}' +
    '.tt-mon .tt-empty{color:rgba(230,226,216,.6);font:15px var(--body)}' +
    '.tt-mon .tk-btn{width:100%;margin-top:18px}' +
    '.tt-mon .tt-small{color:rgba(230,226,216,.7)}';

  function el(html) { var d = document.createElement('div'); d.innerHTML = html; return d.firstChild; }
  function leesQuery(toolId) {
    var uit = {}, q = location.search.replace(/^\?/, '');
    if (!q) return uit;
    q.split('&').forEach(function (p) {
      var kv = p.split('='), k = decodeURIComponent(kv[0] || ''), v = decodeURIComponent((kv[1] || '').replace(/\+/g, ' '));
      if (k.indexOf(toolId + '.') === 0) uit[k.slice(toolId.length + 1)] = v;
    });
    return uit;
  }
  function deelLink(toolId, waarden, slug) {
    var d = [];
    for (var k in waarden) { if (waarden.hasOwnProperty(k) && waarden[k] !== '' && waarden[k] != null) d.push(encodeURIComponent(toolId + '.' + k) + '=' + encodeURIComponent(String(waarden[k]))); }
    return location.href.split('#')[0].split('?')[0] + (d.length ? '?' + d.join('&') : '') + '#' + slug;
  }
  function kopieer(btn, tekst, api, ev) {
    var oud = btn.textContent;
    function ok() { btn.textContent = 'Gekopieerd'; setTimeout(function () { btn.textContent = oud; }, 1800); api.track(ev.name, ev.params); }
    function fallback() {
      var ta = document.createElement('textarea'); ta.value = tekst; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); ok(); } catch (e) { btn.textContent = 'Selecteer en kopieer zelf'; }
      document.body.removeChild(ta);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(tekst).then(ok, fallback); else fallback();
  }
  function bars(items, esc) {
    // items: [{naam, score}] -> balkjes relatief tussen laagste en hoogste score
    var min = Math.min.apply(null, items.map(function (x) { return x.score; }));
    var max = Math.max.apply(null, items.map(function (x) { return x.score; }));
    return items.slice().sort(function (a, b) { return b.score - a.score; }).map(function (x, i) {
      var pct = max === min ? 60 : Math.round(12 + 88 * (x.score - min) / (max - min));
      return '<div class="tt-bar' + (i === 0 ? ' is-top' : '') + '"><span>' + esc(x.naam) + '</span><i><b style="width:' + pct + '%"></b></i></div>';
    }).join('');
  }
  function head(g, data, api, eyebrow) {
    return '<header class="tt-head"><img src="' + api.base + g.icon + '" alt="" width="160" height="160">' +
      '<div><span class="tk-eyebrow">' + eyebrow + '</span><h1>' + api.esc(g.title) + '</h1><p>' + api.esc(data.lead) + '</p></div></header>';
  }

  var UITKOMST = {
    keuzehulp: function (T, C, a, api) {
      var L = C.tools.keuzehulp.labels, r = T.adviseerModel(a), u = C.tools.keuzehulp.uitkomsten[r.advies], esc = api.esc;
      var items = Object.keys(r.scores).map(function (k) { return { naam: T.MODELLEN[k] ? T.MODELLEN[k].naam : k, score: r.scores[k] }; });
      var h = '<div class="tt-res-top"><div><span class="tk-pill is-new">' + esc(L.advies) + ': ' + esc(r.adviesNaam) + '</span><h2>' + esc(u.kop) + '</h2>' +
        '<p>' + esc(r.toelichting) + '</p><p>' + esc(u.uitleg) + '</p></div>' +
        '<div class="tt-viz"><h3>Zo scoren de modellen op jouw antwoorden</h3>' + bars(items, esc) + '</div></div><div class="tt-blocks">' +
        '<div class="tt-block"><h4>' + esc(L.waarom) + '</h4><ul>' + r.uitleg.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul></div>' +
        '<div class="tt-block"><h4>' + esc(L.nadeel) + '</h4><p>' + esc(r.nadeel) + '</p></div>';
      if (r.alternatiefNaam && r.advies !== 'combinatie') {
        var alt = C.tools.keuzehulp.uitkomsten[r.alternatief].uitleg;
        h += '<div class="tt-block"><h4>' + esc(L.alternatief) + '</h4><p>' + esc((alt.indexOf(r.alternatiefNaam) === 0 ? '' : r.alternatiefNaam + ': ') + alt) + '</p></div>';
      }
      h += '<div class="tt-block"><h4>' + esc(L.training) + '</h4><p><a href="' + fixLink(r.trainingLink) + '">' + esc(r.trainingNaam) + '</a> ' + esc(r.trainingWaarom) + '</p></div></div>';
      return { html: h, r: r };
    },
    trainingskiezer: function (T, C, a, api) {
      var L = C.tools.trainingskiezer.labels, r = T.kiesTraining(a), esc = api.esc;
      var items = Object.keys(r.scores).map(function (k) { return { naam: T.TRAININGEN[k] ? T.TRAININGEN[k].kort : k, score: r.scores[k] }; });
      var h = '<div class="tt-res-top"><div><span class="tk-pill is-new">' + esc(L.advies) + '</span>' + (r.alternatiefNaam && r.combineer ? ' <span class="tk-pill">Combineer op een dag</span>' : '') +
        '<h2><a href="' + fixLink(r.link) + '">' + esc(r.naam) + '</a></h2><p>' + esc(r.waarom) + '</p></div>' +
        '<div class="tt-viz"><h3>Zo passen de trainingsvormen bij jullie</h3>' + bars(items, esc) + '</div></div><div class="tt-blocks">';
      if (r.alternatief) h += '<div class="tt-block"><h4>' + esc(L.alternatief) + '</h4><p><a href="' + fixLink(r.alternatiefLink) + '">' + esc(r.alternatiefNaam) + '</a>. ' + esc(r.alternatiefWaarom || '') + '</p></div>';
      h += '<div class="tt-block"><h4>Praktisch</h4><p>' + esc(L.praktisch) + '</p></div></div>';
      return { html: h, r: r };
    },
    aiact: function (T, C, a, api) {
      var tool = C.tools.aiact, L = tool.labels, r = T.aiActCheck(a), u = tool.uitkomsten[r.niveau], esc = api.esc;
      var lv = ['op-orde', 'aandacht', 'prioriteit'], namen = lv.map(function (k) { return tool.uitkomsten[k].naam; });
      var h = '<div class="tt-res-top"><div><span class="tk-pill is-new">' + esc(L.niveau) + ': ' + esc(u.naam) + '</span><h2>' + esc(u.kop) + '</h2><p>' + esc(u.uitleg) + '</p></div>' +
        '<div class="tt-viz"><h3>Waar sta je</h3><div class="tt-meter">' + lv.map(function (k) { return '<span data-l="' + k + '" class="' + (k === r.niveau ? 'is-on' : '') + '"></span>'; }).join('') + '</div>' +
        '<div class="tt-meter-lbl">' + namen.map(function (n) { return '<span>' + esc(n) + '</span>'; }).join('') + '</div></div></div><div class="tt-blocks">' +
        '<div class="tt-block"><h4>' + esc(L.punten) + '</h4><ul>' + r.punten.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul></div>' +
        '<div class="tt-block"><h4>' + esc(L.vervolg) + '</h4><p>' + esc(r.vervolg) + ' <a href="' + fixLink(r.vervolgLink) + '">' + esc(r.vervolgLinkTekst) + '</a></p></div></div>' +
        '<p class="tt-small">' + esc(r.disclaimer) + '</p>';
      return { html: h, r: r };
    }
  };

  /* ---------- vragenlijst: één vraag per scherm ---------- */
  function wizard(root, g, api, opt) {
    var T = window.EdTools, C = window.EdToolsUI, data = window.EDGPT_VRAGEN[opt.data], toolId = C.tools[opt.tool].id;
    var vragen = data.questions, n = vragen.length, antw = leesQuery(toolId), stap = 0, timer = null;
    root.innerHTML = head(g, data, api, 'Voor je team · Tool') + '<div class="tt-card"><div class="tt-progress"></div><div class="tt-body"></div></div>';
    var prog = root.querySelector('.tt-progress'), body = root.querySelector('.tt-body');
    prog.innerHTML = vragen.map(function (q, i) { return '<span role="button" tabindex="0" aria-label="Vraag ' + (i + 1) + '" data-i="' + i + '"></span>'; }).join('');

    function eersteOpen() { for (var i = 0; i < n; i++) { if (!antw[vragen[i].key]) return i; } return n; }
    function tekenProgress() {
      [].forEach.call(prog.children, function (s, i) {
        s.className = i === stap ? 'is-now' : (antw[vragen[i].key] ? 'is-done' : '');
      });
    }
    function regels() {
      return vragen.map(function (q) {
        var o = q.opts.filter(function (x) { return x.value === antw[q.key]; })[0];
        return { vraag: q.kort || q.legend, antwoord: o ? o.label : '' };
      });
    }
    function toonVraag(i) {
      stap = i; tekenProgress();
      var q = vragen[i], kort = q.opts.every(function (o) { return o.label.length < 34; });
      body.innerHTML = '<div class="tt-step"><img src="' + api.base + 'img/q-' + q.key + '.webp" alt="" width="320" height="320">' +
        '<div class="tt-q"><span class="tt-count">Vraag ' + (i + 1) + ' van ' + n + '</span><h2>' + api.esc(q.legend) + '</h2>' +
        '<div class="tt-opts' + (kort ? ' is-short' : '') + '">' + q.opts.map(function (o, j) {
          return '<button type="button" class="tt-opt" data-v="' + api.esc(o.value) + '" aria-pressed="' + (antw[q.key] === o.value ? 'true' : 'false') + '"><span class="tt-key">' + String.fromCharCode(65 + j) + '</span><span>' + api.esc(o.label) + '</span></button>';
        }).join('') + '</div><div class="tt-nav"><button type="button" class="tt-link" data-nav="terug"' + (i === 0 ? ' hidden' : '') + '>&larr; Vorige vraag</button>' +
        (antw[q.key] ? '<button type="button" class="tk-btn tk-btn-ink" data-nav="door">' + (i === n - 1 ? 'Bekijk het advies' : 'Volgende') + '</button>' : '') + '</div></div></div>';
    }
    function toonUitkomst() {
      stap = n; tekenProgress();
      var u = UITKOMST[opt.tool](T, C, antw, api), sv = fixTekst(T.samenvatting(opt.tool, u.r, regels()));
      body.innerHTML = '<div class="tt-result">' + u.html +
        '<div class="tt-answers">' + vragen.map(function (q, i) {
          var o = q.opts.filter(function (x) { return x.value === antw[q.key]; })[0];
          return o ? '<button type="button" data-i="' + i + '" title="Wijzig dit antwoord">' + api.esc(q.kort || ('Vraag ' + (i + 1))) + ': <b>' + api.esc(o.label) + '</b></button>' : '';
        }).join('') + '</div>' +
        '<div class="tt-actions"><button type="button" class="tk-btn tk-btn-ink" data-act="kopieer">Kopieer samenvatting</button>' +
        '<button type="button" class="tk-btn tk-btn-line" data-act="link">Kopieer link</button>' +
        '<button type="button" class="tt-link" data-act="opnieuw">Opnieuw beginnen</button></div></div>';
      body.querySelector('[data-act=kopieer]').onclick = function () { kopieer(this, sv, api, { name: 'toolkit_copy', params: { goodie: g.slug, soort: 'samenvatting' } }); };
      body.querySelector('[data-act=link]').onclick = function () { kopieer(this, deelLink(toolId, antw, g.slug), api, { name: 'toolkit_share', params: { goodie: g.slug } }); };
      body.querySelector('[data-act=opnieuw]').onclick = function () { antw = {}; toonVraag(0); };
      api.track('toolkit_result', { goodie: g.slug });
    }
    function ga(i) { if (timer) { clearTimeout(timer); timer = null; } if (i >= n) toonUitkomst(); else toonVraag(i); }
    function scrollIn() {
      var r = root.getBoundingClientRect();
      if (r.top < 0 || r.top > window.innerHeight * 0.5) window.scrollTo(0, Math.max(0, r.top + window.pageYOffset - 90));
    }

    body.addEventListener('click', function (e) {
      var o = e.target.closest('.tt-opt');
      if (o) {
        antw[vragen[stap].key] = o.getAttribute('data-v');
        [].forEach.call(body.querySelectorAll('.tt-opt'), function (x) { x.setAttribute('aria-pressed', x === o ? 'true' : 'false'); });
        tekenProgress();
        timer = setTimeout(function () { ga(stap + 1 < n ? stap + 1 : (eersteOpen() < n ? eersteOpen() : n)); scrollIn(); }, 320);
        return;
      }
      var nav = e.target.closest('[data-nav]');
      if (nav) { ga(nav.getAttribute('data-nav') === 'terug' ? stap - 1 : stap + 1); return; }
      var edit = e.target.closest('.tt-answers button');
      if (edit) { ga(+edit.getAttribute('data-i')); scrollIn(); }
    });
    prog.addEventListener('click', function (e) {
      var i = e.target.getAttribute('data-i');
      if (i !== null && (antw[vragen[+i].key] || +i <= eersteOpen())) ga(+i);
    });
    ga(eersteOpen());
  }

  /* ---------- tijdwinstcalculator ---------- */
  function tijdwinst(root, g, api) {
    var T = window.EdTools, C = window.EdToolsUI, L = C.tools.tijdwinst.labels, data = window.EDGPT_VRAGEN.tijdwinst, esc = api.esc;
    var toolId = C.tools.tijdwinst.id, pre = leesQuery(toolId), f = {};
    data.fields.forEach(function (x) { f[x.veld] = x; });
    var q = data.questions[0], w = {
      teamgrootte: pre.teamgrootte || f.teamgrootte.std, urenPerWeek: pre.urenPerWeek || f.urenPerWeek.std,
      uurtarief: pre.uurtarief || f.uurtarief.std, winstPercentage: pre.winstPercentage || (q.opts.filter(function (o) { return o.std === '1'; })[0] || q.opts[1]).value
    };
    function lbl(x) { return x.label.replace(/\s*[\d.,]+$/, ''); }
    root.innerHTML = head(g, data, api, 'Voor je team · Calculator') +
      '<div class="tt-calc"><div class="tt-card">' +
      '<div class="tt-range"><label for="tw-team">' + esc(lbl(f.teamgrootte)) + '<output data-o="teamgrootte"></output></label><input type="range" id="tw-team" data-v="teamgrootte" min="' + f.teamgrootte.min + '" max="' + f.teamgrootte.max + '" step="' + (f.teamgrootte.step || 1) + '" value="' + w.teamgrootte + '"></div>' +
      '<div class="tt-range"><label for="tw-uren">' + esc(lbl(f.urenPerWeek)) + '<output data-o="urenPerWeek"></output></label><input type="range" id="tw-uren" data-v="urenPerWeek" min="' + f.urenPerWeek.min + '" max="' + f.urenPerWeek.max + '" step="' + (f.urenPerWeek.step || 1) + '" value="' + w.urenPerWeek + '"><p>' + esc(f.urenPerWeek.hint) + '</p></div>' +
      '<div class="tt-range"><label for="tw-tarief">' + esc(lbl(f.uurtarief)) + '</label><input type="number" id="tw-tarief" data-v="uurtarief" min="' + f.uurtarief.min + '" max="' + f.uurtarief.max + '" step="' + (f.uurtarief.step || 5) + '" value="' + w.uurtarief + '"><p>' + esc(f.uurtarief.hint) + '</p></div>' +
      '<div class="tt-range"><label>Hoeveel van dat werk gaat sneller met AI?</label><div class="tt-opts is-short">' + q.opts.map(function (o) {
        return '<button type="button" class="tt-opt" data-p="' + esc(o.value) + '" aria-pressed="' + (o.value === String(w.winstPercentage) ? 'true' : 'false') + '"><span>' + esc(o.label) + '</span></button>';
      }).join('') + '</div></div></div>' +
      '<div class="tt-viz" aria-live="polite"><h3>Rekenvoorbeeld</h3><div class="tt-out"></div>' +
      '<div class="tt-actions"><button type="button" class="tk-btn tk-btn-y" data-act="kopieer">Kopieer samenvatting</button><button type="button" class="tk-btn tk-btn-ghost" data-act="link">Kopieer link</button></div></div></div>';
    var out = root.querySelector('.tt-out'), laatste = null;
    function stat(v, e, k) { return '<div class="tt-stat"><b>' + v + (e ? '<small>' + e + '</small>' : '') + '</b><span>' + esc(k) + '</span></div>'; }
    function update() {
      [].forEach.call(root.querySelectorAll('output[data-o]'), function (o) { o.textContent = String(w[o.getAttribute('data-o')]).replace('.', ','); });
      var r = T.berekenTijdwinst(w); laatste = r;
      if (!r.berekenbaar) { out.innerHTML = '<p>' + esc(L.nietTeBerekenen) + '</p>'; return; }
      var tvd = r.terugverdienDagen, tv = (tvd !== null && tvd <= r.aannames.werkdagenPerJaar) ? stat(String(tvd), tvd === 1 ? 'werkdag' : L.werkdagen, L.terugverdien) : stat('1+', 'jaar', L.terugverdien);
      var max = Math.max(r.euroPerJaar, r.vergelijkingHeleDag.prijs);
      function bar(naam, v, top) { return '<div class="tt-bar' + (top ? ' is-top' : '') + '"><span>' + esc(naam) + '</span><i><b style="width:' + Math.max(3, Math.round(100 * v / max)) + '%"></b></i></div>'; }
      out.innerHTML = '<div class="tt-stats">' + stat(T.formatGetal(r.urenPerMaand, 1), 'uur', L.urenPerMaand) + stat(T.formatGetal(r.euroPerJaar, 0), 'euro', L.euroPerJaar) + tv + '</div>' +
        bar('Waarde per jaar', r.euroPerJaar, true) + bar(L.heleDag, r.vergelijkingHeleDag.prijs) + bar(L.dagdeel, r.vergelijkingDagdeel.prijs) +
        '<p>' + esc(r.vergelijkingDagdeel.tekst) + '</p><p>' + esc(r.vergelijkingHeleDag.tekst) + '</p>' +
        (r.waarschuwingen.length ? '<p>' + r.waarschuwingen.map(esc).join('<br>') + '</p>' : '');
    }
    root.addEventListener('input', function (e) { var k = e.target.getAttribute('data-v'); if (k) { w[k] = e.target.value; update(); } });
    root.addEventListener('click', function (e) {
      var p = e.target.closest('[data-p]');
      if (p) { w.winstPercentage = p.getAttribute('data-p'); [].forEach.call(root.querySelectorAll('[data-p]'), function (x) { x.setAttribute('aria-pressed', x === p ? 'true' : 'false'); }); update(); }
      var a = e.target.closest('[data-act]');
      if (a && a.getAttribute('data-act') === 'kopieer') kopieer(a, T.samenvatting('tijdwinst', laatste), api, { name: 'toolkit_copy', params: { goodie: g.slug, soort: 'samenvatting' } });
      if (a && a.getAttribute('data-act') === 'link') kopieer(a, deelLink(toolId, laatste ? laatste.invoer : w, g.slug), api, { name: 'toolkit_share', params: { goodie: g.slug } });
    });
    update();
  }

  /* ---------- prompt-bouwer (tekst) ---------- */
  function promptbouwer(root, g, api) {
    var T = window.EdTools, C = window.EdToolsUI, L = C.tools.promptbouwer.labels, data = window.EDGPT_VRAGEN.promptbouwer, esc = api.esc;
    var basis = ['taak', 'rol', 'context'], w = {};
    function veld(x) {
      var inp = x.tag === 'textarea' ? '<textarea id="pb-' + x.veld + '" data-v="' + x.veld + '" rows="3" placeholder="' + esc(x.ph || '') + '"></textarea>' : '<input type="text" id="pb-' + x.veld + '" data-v="' + x.veld + '" placeholder="' + esc(x.ph || '') + '">';
      return '<div class="tt-field"><label for="pb-' + x.veld + '">' + esc(x.label) + '</label>' + inp + (x.hint ? '<p>' + esc(x.hint) + '</p>' : '') + '</div>';
    }
    var hoofd = basis.map(function (k) { return data.fields.filter(function (x) { return x.veld === k; })[0]; }).filter(Boolean);
    var extra = data.fields.filter(function (x) { return basis.indexOf(x.veld) < 0; });
    root.innerHTML = head(g, data, api, 'Voor je team · Tool') +
      '<div class="tt-pb"><div class="tt-card">' + hoofd.map(veld).join('') +
      '<details class="tt-more"><summary>+ Maak hem sterker: voorbeelden, format, toon en beperkingen</summary>' + extra.map(veld).join('') + '</details></div>' +
      '<section class="tt-mon" aria-live="polite"><h2>' + esc(L.resultaat) + '</h2><pre></pre><p class="tt-small"></p><button type="button" class="tk-btn tk-btn-y">' + esc(L.kopieer) + '</button></section></div>';
    var pre = root.querySelector('pre'), info = root.querySelector('.tt-mon .tt-small');
    function update() {
      var p = T.bouwPrompt(w);
      if (!p) { pre.innerHTML = '<span class="tt-empty">' + esc(L.leeg) + '</span>'; info.textContent = ''; return; }
      pre.textContent = p; info.textContent = p.split(/\s+/).length + ' woorden. Plak dit in ChatGPT, Claude, Copilot of Gemini.';
    }
    root.addEventListener('input', function (e) { var k = e.target.getAttribute('data-v'); if (k) { w[k] = e.target.value; update(); } });
    root.querySelector('.tt-mon .tk-btn').onclick = function () { kopieer(this, T.bouwPrompt(w) || L.leeg, api, { name: 'toolkit_copy', params: { goodie: g.slug, soort: 'prompt' } }); };
    update();
  }

  window.EDGPT_TEAMTOOL = {
    run: function (soort, root, g, api, opt) {
      if (!document.getElementById('tt-css')) { var st = document.createElement('style'); st.id = 'tt-css'; st.textContent = CSS; document.head.appendChild(st); }
      root.innerHTML = '<p class="tk-loading">Even laden…</p>';
      return api.js(api.base + 'legacy/tools-logic.js')
        .then(function () { return api.js(api.base + 'legacy/tools-ui.js'); })
        .then(function () { return api.js(api.base + 'legacy/vragen.js'); })
        .then(function () { ({ wizard: wizard, tijdwinst: tijdwinst, promptbouwer: promptbouwer })[soort](root, g, api, opt || {}); });
    }
  };
})();

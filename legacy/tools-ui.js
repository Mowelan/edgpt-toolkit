
window.EdToolsUI = {"knoppen":{"kopieer":"Kopieer samenvatting","kopieerLink":"Kopieer link","gekopieerd":"Gekopieerd","kopieerMislukt":"Kopiëren lukte niet, selecteer de tekst en kopieer handmatig","opnieuw":"Opnieuw beginnen"},"tools":{"keuzehulp":{"id":"keuzehulp","anker":"#keuzehulp","uitkomsten":{"chatgpt":{"naam":"ChatGPT","kop":"ChatGPT past het beste bij je team","uitleg":"ChatGPT is de breedste tool: tekst, beeld, spraak, zoeken op het web en agentachtige taken in een omgeving. Voor teams met wisselend werk of veel beeld is dat de logische start.","nadeel":"Breed betekent niet overal het beste. Voor lange documenten en genuanceerd schrijfwerk levert Claude vaak beter werk, en ChatGPT zit niet in je Office-bestanden zoals Copilot."},"claude":{"naam":"Claude","kop":"Claude past het beste bij je team","uitleg":"Claude is sterk in lange documenten, schrijfkwaliteit, nuance en code. Met projecten en artifacts werk je met context in plaats van losse chats.","nadeel":"Claude maakt zelf geen beeld of video en heeft een kleiner ecosysteem aan koppelingen dan ChatGPT. Voor beeldwerk heb je er een tweede tool naast nodig."},"copilot":{"naam":"Copilot","kop":"Copilot past het beste bij je team","uitleg":"Copilot leeft in Microsoft 365 en gebruikt jullie eigen tenantdata en de beveiliging die er al staat. Voor werk in Outlook, Word, Excel en Teams, met gevoelige data, is dat het sterkste argument.","nadeel":"Buiten Microsoft 365 heeft Copilot weinig te bieden, en voor lang schrijfwerk of diepe research halen ChatGPT en Claude vaak meer uit dezelfde vraag. De licentie is meestal een aparte add-on."},"gemini":{"naam":"Gemini","kop":"Gemini past het beste bij je team","uitleg":"Je team leeft in Google Workspace. Gemini zit in Gmail, Drive en Docs, dus daar begin je. Wat je in een training leert over prompten, context en werkwijze, pas je daar direct toe.","nadeel":"Voor het beste schrijfwerk, lange documenten of code kan een losse tool ernaast, Claude of ChatGPT, meer opleveren. En je bent gebonden aan wat er in je Google-abonnement zit."},"combinatie":{"naam":"Een combinatie","kop":"Kies niet een tool, maar een combinatie","uitleg":"Je antwoorden wijzen niet een kant op. Dat is normaal: de meeste teams gebruiken twee tools naast elkaar, elk voor waar hij goed in is. De vraag is dan niet welke tool, maar welke tool wanneer. Dat is precies wat je in een trainingsdag leert.","nadeel":"Twee tools betekent twee abonnementen, twee sets afspraken over data en meer uitleg aan je team. Begin met een, voeg de tweede toe als het werk erom vraagt."}},"labels":{"waarom":"Waarom dit advies","nadeel":"Eerlijk nadeel","alternatief":"Alternatief","training":"Passende training","nogNietIngevuld":"Beantwoord eerst de acht vragen. Daarna verschijnt hier het advies.","advies":"Advies","vraag":"Vraag","van":"van","vorige":"Vorige","volgende":"Volgende","bekijk":"Bekijk het advies"}},"promptbouwer":{"id":"promptbouwer","labels":{"resultaat":"Je prompt","kopieer":"Kopieer prompt","leeg":"Vul minimaal een taak in. De prompt verschijnt terwijl je typt."}},"tijdwinst":{"id":"tijdwinst","anker":"#tijdwinst","labels":{"urenPerMaand":"Gewonnen uren per maand","euroPerJaar":"Waarde per jaar","terugverdien":"Terugverdientijd van een trainingsdag","werkdagen":"werkdagen","dagdeel":"Dagdeel (1.250 euro)","heleDag":"Hele dag (2.250 euro)","nietTeBerekenen":"Vul uren en een uurtarief in om iets te kunnen berekenen."}},"trainingskiezer":{"id":"trainingskiezer","anker":"#trainingskiezer","labels":{"advies":"Deze vorm past het beste","waarom":"Waarom","alternatief":"Combineer met","praktisch":"Bij een hele dag doen we 's ochtends de basis en 's middags jullie eigen werk. Twee vormen op een dag kan, drie wordt te vol.","nogNietIngevuld":"Beantwoord de vier vragen. Het advies verschijnt terwijl je invult."}},"aiact":{"id":"ai-act","anker":"#ai-act","uitkomsten":{"op-orde":{"naam":"Basis staat","kop":"Je basis staat","uitleg":"Je team gebruikt AI bewust en de belangrijkste afspraken zijn geregeld. Houd het bij: tools veranderen, en de verplichtingen uit de AI Act worden stapsgewijs van kracht."},"aandacht":{"naam":"Aandacht nodig","kop":"Er zijn een paar losse eindjes","uitleg":"AI wordt gebruikt, maar niet alles is geregeld of aantoonbaar. Dat is bij de meeste teams zo. De punten hieronder zijn concreet en klein genoeg om deze maand op te pakken."},"prioriteit":{"naam":"Prioriteit","kop":"Dit verdient nu aandacht","uitleg":"Er is een combinatie van AI-gebruik, gevoelige data of toepassingen met impact op mensen, zonder dat afspraken en kennis aantoonbaar zijn. Begin deze maand, niet volgend kwartaal, en betrek een jurist bij de toepassingen met impact op mensen."},"onbekend":{"naam":"Nog geen beeld","kop":"Beantwoord de vragen voor een oriëntatie","uitleg":"De check geeft pas een oordeel als je alle zes de vragen hebt beantwoord. Vul de rest in voor een eerlijk beeld."}},"labels":{"niveau":"Oriëntatie","punten":"Wat je antwoorden betekenen","vervolg":"Eerste stap","nogNietIngevuld":"Beantwoord de vragen. De oriëntatie verschijnt terwijl je invult."}}}};
/* Tools-pagina: koppelt de statische markup aan window.EdTools (logic.js). ES5, geen libraries. */
window.EdToolsMount = function () {
  'use strict';
  var root = document.getElementById('edv2-tools');
  var T = window.EdTools;
  var C = window.EdToolsUI;
  if (!root || !T || !C) { return; }
  var KNOPPEN = C.knoppen;

  /* Ankers op /trainingen volgens het design system (SPEC): #basis, #claude, #agents, #content. */
  var LINKMAP = {
    '/trainingen#ai-basis': '/trainingen#basis',
    '/trainingen#werken-met-claude': '/trainingen#claude',
    '/trainingen#ai-agents': '/trainingen#agents',
    '/trainingen#content-en-research': '/trainingen#content'
  };
  function fixLink(h) { return LINKMAP[h] || h; }
  function fixTekst(s) {
    var k;
    for (k in LINKMAP) { if (LINKMAP.hasOwnProperty(k)) { s = s.split(k).join(LINKMAP[k]); } }
    return s;
  }

  /* ---------- DOM-hulpjes ---------- */
  function q(sel, ctx) { return (ctx || root).querySelector(sel); }
  function qa(sel, ctx) { return Array.prototype.slice.call((ctx || root).querySelectorAll(sel)); }
  function el(tag, attrs, kinderen) {
    var e = document.createElement(tag);
    var k, i;
    if (attrs) {
      for (k in attrs) {
        if (!attrs.hasOwnProperty(k)) { continue; }
        if (k === 'text') { e.textContent = attrs[k]; }
        else if (k === 'className') { e.className = attrs[k]; }
        else if (k === 'open') { e.open = attrs[k]; }
        else { e.setAttribute(k, attrs[k]); }
      }
    }
    if (kinderen) {
      for (i = 0; i < kinderen.length; i++) {
        if (kinderen[i] === null || kinderen[i] === undefined || kinderen[i] === '') { continue; }
        e.appendChild(typeof kinderen[i] === 'string' ? document.createTextNode(kinderen[i]) : kinderen[i]);
      }
    }
    return e;
  }
  function leeg(node) { while (node.firstChild) { node.removeChild(node.firstChild); } }
  function lijst(items) {
    var ul = el('ul', { className: 'list-plain' });
    for (var i = 0; i < items.length; i++) { ul.appendChild(el('li', { text: items[i] })); }
    return ul;
  }
  function link(href, tekst) { return el('a', { href: fixLink(href), className: 'link', text: tekst }); }
  function lbl(tekst) { return el('span', { className: 'res-lbl', text: tekst }); }
  function blok(label, kinderen) {
    var d = el('div', { className: 'res-blok' });
    d.appendChild(lbl(label));
    for (var i = 0; i < kinderen.length; i++) { d.appendChild(kinderen[i]); }
    return d;
  }
  function uitklap(label, node, open) {
    var d = el('details', { open: !!open });
    d.appendChild(el('summary', { text: label }));
    d.appendChild(node);
    return d;
  }
  function chip(tekst, variant) {
    return el('span', { className: 'chip' + (variant ? ' ' + variant : ''), text: tekst });
  }

  /* ---------- kopieren met fallback ---------- */
  function kopieer(tekst, status, knop) {
    var oud = knop.getAttribute('data-orig') || knop.textContent;
    knop.setAttribute('data-orig', oud);
    function klaar(gelukt) {
      status.textContent = gelukt ? '' : KNOPPEN.kopieerMislukt;
      if (gelukt) {
        knop.textContent = KNOPPEN.gekopieerd;
        knop.classList.add('is-copied');
        window.setTimeout(function () { knop.textContent = oud; knop.classList.remove('is-copied'); }, 1800);
      }
    }
    function fallback() {
      var ta = document.createElement('textarea');
      ta.value = tekst;
      ta.setAttribute('readonly', 'readonly');
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      var ok = false;
      try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
      document.body.removeChild(ta);
      klaar(ok);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(tekst).then(function () { klaar(true); }, fallback);
    } else {
      fallback();
    }
  }

  /* ---------- deelbare link via querystring (geen opslag) ---------- */
  function basisUrl() { return window.location.href.split('#')[0].split('?')[0]; }
  function deelLink(toolId, waarden, anker) {
    var delen = [];
    for (var k in waarden) {
      if (!waarden.hasOwnProperty(k)) { continue; }
      if (waarden[k] === '' || waarden[k] === null || waarden[k] === undefined) { continue; }
      delen.push(encodeURIComponent(toolId + '.' + k) + '=' + encodeURIComponent(String(waarden[k])));
    }
    return basisUrl() + (delen.length ? '?' + delen.join('&') : '') + anker;
  }
  function leesQuery() {
    var uit = {};
    var s = window.location.search.replace(/^\?/, '');
    if (!s) { return uit; }
    var paren = s.split('&');
    for (var i = 0; i < paren.length; i++) {
      var p = paren[i].split('=');
      if (p.length < 2) { continue; }
      var sleutel, waarde;
      try { sleutel = decodeURIComponent(p[0]); waarde = decodeURIComponent(p[1].replace(/\+/g, ' ')); } catch (e) { continue; }
      var punt = sleutel.indexOf('.');
      if (punt < 1) { continue; }
      var tool = sleutel.slice(0, punt);
      if (!uit[tool]) { uit[tool] = {}; }
      uit[tool][sleutel.slice(punt + 1)] = waarde;
    }
    return uit;
  }
  var vooraf = leesQuery();

  /* ---------- generiek: radio-tools ---------- */
  function leesRadio(form) {
    var a = {};
    var inputs = qa('input[type=radio]:checked', form);
    for (var i = 0; i < inputs.length; i++) { a[inputs[i].getAttribute('data-vraag')] = inputs[i].value; }
    return a;
  }
  function antwoordRegels(form) {
    var regels = [];
    var sets = qa('fieldset', form);
    for (var i = 0; i < sets.length; i++) {
      var legend = q('legend', sets[i]);
      var vraag = legend ? (legend.getAttribute('data-kort') || legend.textContent) : '';
      var checked = q('input[type=radio]:checked', sets[i]);
      var label = '';
      if (checked) {
        var span = checked.parentNode ? q('span', checked.parentNode) : null;
        label = span ? span.textContent : checked.value;
      }
      regels.push({ vraag: vraag, antwoord: label });
    }
    return regels;
  }
  function prefillRadio(form, toolId) {
    var w = vooraf[toolId];
    if (!w) { return; }
    var inputs = qa('input[type=radio]', form);
    for (var i = 0; i < inputs.length; i++) {
      var v = inputs[i].getAttribute('data-vraag');
      if (w[v] !== undefined && String(w[v]) === inputs[i].value) { inputs[i].checked = true; }
    }
  }
  function resetRadio(form) {
    var inputs = qa('input[type=radio]', form);
    for (var i = 0; i < inputs.length; i++) { inputs[i].checked = false; }
  }
  function bindForm(form, update) {
    var t = null;
    function traag() { if (t) { window.clearTimeout(t); } t = window.setTimeout(function () { t = null; update(); }, 400); }
    form.addEventListener('submit', function (e) { e.preventDefault(); });
    form.addEventListener('change', function () { if (t) { window.clearTimeout(t); t = null; } update(); });
    form.addEventListener('input', traag);
  }
  function bindKnoppen(sectie, opties) {
    var res = q('.result', sectie);
    var status = q('.status', res);
    var kk = q('[data-act=kopieer]', res);
    var kl = q('[data-act=link]', res);
    var rs = q('[data-act=reset]', sectie);
    if (kk) { kk.addEventListener('click', function () { kopieer(opties.tekst(), status, kk); }); }
    if (kl && opties.link) { kl.addEventListener('click', function () { kopieer(opties.link(), status, kl); }); }
    if (rs) { rs.addEventListener('click', function () { opties.reset(); }); }
  }

  /* ---------- 1. Model-keuzehulp: wizard, een vraag per stap ---------- */
  function initKeuzehulp() {
    var tool = C.tools.keuzehulp;
    var L = tool.labels;
    var sectie = document.getElementById(tool.id);
    if (!sectie) { return; }
    var kw = q('.kw', sectie);
    var form = q('form', sectie);
    var stappen = qa('fieldset.kw-step', form);
    var n = stappen.length;
    var teller = q('.kw-count', sectie);
    var bar = q('.kw-bar', sectie);
    var fill = q('.kw-fill', sectie);
    var kVorige = q('[data-kw=vorige]', sectie);
    var kVolgende = q('[data-kw=volgende]', sectie);
    var res = q('.result', sectie);
    var kop = q('.eyebrow', res);
    var body = q('.res-body', res);
    var sv = q('.sv', sectie);
    var laatste = {};
    var stap = 0;
    var timer = null;

    function zet(node, cls, aan) { if (aan) { node.classList.add(cls); } else { node.classList.remove(cls); } }
    function gekozen(i) { var c = q('input[type=radio]:checked', stappen[i]); return c ? c.value : ''; }
    function eersteOpen() { for (var i = 0; i < n; i++) { if (!gekozen(i)) { return i; } } return n; }
    function stopTimer() { if (timer) { window.clearTimeout(timer); timer = null; } }
    function rustig() { return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches); }
    function inBeeld(node) { var r = node.getBoundingClientRect(); return r.top >= 0 && r.top <= window.innerHeight - 120; }
    /* Focus zonder sprong; alleen scrollen als de kop buiten beeld staat. */
    function richt(node) {
      node.focus({ preventScroll: true });
      if (!inBeeld(node) && node.scrollIntoView) { node.scrollIntoView({ block: 'nearest', behavior: rustig() ? 'auto' : 'smooth' }); }
    }

    function update() {
      var a = leesRadio(form);
      var r = T.adviseerModel(a);
      laatste = a;
      leeg(body);
      if (r.beantwoord === 0) {
        kop.textContent = L.advies;
        body.appendChild(el('p', { className: 'res-leeg', text: L.nogNietIngevuld }));
        sv.value = '';
        return;
      }
      var u = tool.uitkomsten[r.advies];
      kop.textContent = L.advies + ': ' + r.adviesNaam;
      body.appendChild(el('h3', { className: 'res-kop res-live', text: u.kop }));
      body.appendChild(el('p', { text: r.toelichting }));
      body.appendChild(el('p', { text: u.uitleg }));
      body.appendChild(uitklap(L.waarom + ' (' + r.uitleg.length + ')', lijst(r.uitleg), false));
      body.appendChild(blok(L.nadeel, [el('p', { text: r.nadeel })]));
      if (r.alternatiefNaam && r.advies !== 'combinatie') {
        var altUitleg = tool.uitkomsten[r.alternatief].uitleg;
        var altPre = altUitleg.indexOf(r.alternatiefNaam) === 0 ? '' : r.alternatiefNaam + ': ';
        body.appendChild(blok(L.alternatief, [el('p', { text: altPre + altUitleg })]));
      }
      body.appendChild(blok(L.training, [el('p', {}, [link(r.trainingLink, r.trainingNaam), ' ', r.trainingWaarom])]));
      sv.value = fixTekst(T.samenvatting('keuzehulp', r, antwoordRegels(form)));
    }

    function toon(i, focus) {
      stopTimer();
      stap = i;
      var klaar = i >= n;
      for (var j = 0; j < n; j++) { zet(stappen[j], 'is-active', j === i); }
      if (klaar) {
        update();
        zet(kw, 'is-klaar', true);
        if (focus) { richt(res); }
        return;
      }
      zet(kw, 'is-klaar', false);
      teller.textContent = L.vraag + ' ' + (i + 1) + ' ' + L.van + ' ' + n;
      fill.style.width = String(Math.round((i + 1) / n * 1000) / 10) + '%';
      bar.setAttribute('aria-valuenow', String(i + 1));
      zet(kVorige, 'is-hidden', i === 0);
      kVolgende.disabled = !gekozen(i);
      kVolgende.textContent = i === n - 1 ? L.bekijk : L.volgende;
      if (focus) { var h = q('.kw-vraag', stappen[i]); if (h) { richt(h); } }
    }
    function volgende(focus) { if (stap < n && gekozen(stap)) { toon(stap + 1, focus); } }
    function vorige() { if (stap > 0 && stap <= n) { toon(stap - 1, true); } }

    form.addEventListener('submit', function (e) { e.preventDefault(); volgende(true); });
    form.addEventListener('change', function () { if (stap < n) { kVolgende.disabled = !gekozen(stap); } });
    /* Klik op een antwoord: na 350 ms door. Toetsenbord niet, dan kiest de gebruiker zelf Volgende. */
    form.addEventListener('click', function (e) {
      var t = e.target;
      if (!t || t.tagName === 'INPUT') { return; }
      while (t && t !== form && !(t.classList && t.classList.contains('kw-opt'))) { t = t.parentNode; }
      if (!t || t === form) { return; }
      stopTimer();
      timer = window.setTimeout(function () { timer = null; volgende(true); }, 350);
    });
    kVolgende.addEventListener('click', function () { volgende(true); });
    kVorige.addEventListener('click', vorige);

    prefillRadio(form, tool.id);
    bindKnoppen(sectie, {
      tekst: function () { return sv.value || L.nogNietIngevuld; },
      link: function () { return deelLink(tool.id, laatste, tool.anker); },
      reset: function () { resetRadio(form); laatste = {}; sv.value = ''; toon(0, true); }
    });
    toon(eersteOpen(), false);
  }
  /* ---------- 2. Prompt-bouwer ---------- */
  function initPromptbouwer() {
    var tool = C.tools.promptbouwer;
    var sectie = document.getElementById(tool.id);
    if (!sectie) { return; }
    var form = q('form', sectie);
    var res = q('.result', sectie);
    var body = q('.res-body', res);
    var pre = el('pre', { id: tool.id + '-out' });

    function waarden() {
      var w = {};
      var velden = qa('[data-veld]', form);
      for (var i = 0; i < velden.length; i++) {
        var f = velden[i];
        w[f.getAttribute('data-veld')] = f.type === 'checkbox' ? f.checked : f.value;
      }
      return w;
    }
    function prompt() { return T.bouwPrompt(waarden()); }
    function update() {
      var p = prompt();
      leeg(body);
      if (!p) { body.appendChild(el('p', { className: 'res-leeg', text: tool.labels.leeg })); return; }
      pre.textContent = p;
      body.appendChild(pre);
      var n = p.split(/\s+/).length;
      body.appendChild(el('p', { className: 'res-live t-small', text: n + ' woorden. Plak dit in ChatGPT, Claude, Copilot of Gemini.' }));
    }

    bindForm(form, update);
    bindKnoppen(sectie, {
      tekst: function () { return prompt() || tool.labels.leeg; },
      link: null,
      reset: function () { form.reset(); update(); }
    });
    update();
  }

  /* ---------- 3. Tijdwinstcalculator ---------- */
  function initTijdwinst() {
    var tool = C.tools.tijdwinst;
    var sectie = document.getElementById(tool.id);
    if (!sectie) { return; }
    var form = q('form', sectie);
    var res = q('.result', sectie);
    var body = q('.res-body', res);
    var sv = q('.sv', sectie);
    var laatste = null;

    function velden() { return qa('[data-veld]', form); }
    function waarden() {
      var w = {};
      var vs = velden();
      for (var i = 0; i < vs.length; i++) {
        var f = vs[i];
        if (f.type === 'radio') { if (f.checked) { w[f.getAttribute('data-veld')] = f.value; } }
        else { w[f.getAttribute('data-veld')] = f.value; }
      }
      return w;
    }
    function toonOutputs() {
      var outs = qa('output[data-for]', form);
      for (var i = 0; i < outs.length; i++) {
        var inp = document.getElementById(outs[i].getAttribute('data-for'));
        if (inp) { outs[i].value = String(inp.value).replace('.', ','); }
      }
    }
    function stat(v, eenheid, k) {
      var li = el('li');
      var sv2 = el('span', { className: 'v' });
      sv2.appendChild(document.createTextNode(v));
      if (eenheid) { sv2.appendChild(el('small', { text: eenheid })); }
      li.appendChild(sv2);
      li.appendChild(el('span', { className: 'k', text: k }));
      return li;
    }
    function update() {
      toonOutputs();
      var r = T.berekenTijdwinst(waarden());
      laatste = r;
      leeg(body);
      if (!r.berekenbaar) {
        body.appendChild(el('p', { className: 'res-leeg', text: tool.labels.nietTeBerekenen }));
        sv.value = T.samenvatting('tijdwinst', r);
        return;
      }
      var ul = el('ul', { className: 'stats-line' });
      ul.appendChild(stat(T.formatGetal(r.urenPerMaand, 1), 'uur', tool.labels.urenPerMaand));
      ul.appendChild(stat(T.formatGetal(r.euroPerJaar, 0), 'euro', tool.labels.euroPerJaar));
      var tvd = r.terugverdienDagen;
      if (tvd !== null && tvd <= r.aannames.werkdagenPerJaar) {
        ul.appendChild(stat(String(tvd), tvd === 1 ? 'werkdag' : tool.labels.werkdagen, tool.labels.terugverdien));
      } else {
        ul.appendChild(stat('1+', 'jaar', tool.labels.terugverdien));
      }
      body.appendChild(ul);
      body.appendChild(el('p', { className: 'res-live', text: 'Team van ' + r.invoer.teamgrootte + ', ' + T.formatGetal(r.invoer.urenPerWeek, 1) + ' uur per persoon per week, ' + r.invoer.winstPercentage + ' procent sneller.' }));
      body.appendChild(blok(tool.labels.dagdeel, [el('p', { text: r.vergelijkingDagdeel.tekst })]));
      body.appendChild(blok(tool.labels.heleDag, [el('p', { text: r.vergelijkingHeleDag.tekst })]));
      if (r.waarschuwingen.length) { body.appendChild(lijst(r.waarschuwingen)); }
      sv.value = T.samenvatting('tijdwinst', r);
    }

    /* prefill uit de deellink */
    if (vooraf[tool.id]) {
      var vs = velden();
      for (var i = 0; i < vs.length; i++) {
        var naam = vs[i].getAttribute('data-veld');
        var w = vooraf[tool.id][naam];
        if (w === undefined) { continue; }
        if (vs[i].type === 'radio') { vs[i].checked = (vs[i].value === String(w)); }
        else { vs[i].value = w; }
      }
    }
    bindForm(form, update);
    bindKnoppen(sectie, {
      tekst: function () { return sv.value; },
      link: function () { return deelLink(tool.id, laatste ? laatste.invoer : {}, tool.anker); },
      reset: function () {
        var vs = velden();
        for (var k = 0; k < vs.length; k++) {
          var std = vs[k].getAttribute('data-standaard');
          if (vs[k].type === 'radio') { vs[k].checked = (std === '1'); }
          else if (std !== null) { vs[k].value = std; }
        }
        update();
      }
    });
    update();
  }

  /* ---------- 4. Trainingskiezer ---------- */
  function initTrainingskiezer() {
    var tool = C.tools.trainingskiezer;
    var sectie = document.getElementById(tool.id);
    if (!sectie) { return; }
    var form = q('form', sectie);
    var res = q('.result', sectie);
    var body = q('.res-body', res);
    var sv = q('.sv', sectie);
    var laatste = {};

    function update() {
      var a = leesRadio(form);
      var r = T.kiesTraining(a);
      laatste = a;
      leeg(body);
      if (r.beantwoord === 0) {
        body.appendChild(el('p', { className: 'res-leeg', text: tool.labels.nogNietIngevuld }));
        sv.value = '';
        return;
      }
      var chips = el('div', { className: 'chips' });
      chips.appendChild(chip(tool.labels.advies, 'chip-y'));
      if (r.alternatiefNaam && r.combineer) { chips.appendChild(chip('Combineer op een dag')); }
      body.appendChild(chips);
      var kop = el('h3', { className: 'res-kop res-live' });
      kop.appendChild(el('a', { href: fixLink(r.link), text: r.naam }));
      body.appendChild(kop);
      body.appendChild(el('p', { text: r.waarom }));
      if (r.alternatief) {
        body.appendChild(blok(tool.labels.alternatief, [el('p', {}, [link(r.alternatiefLink, r.alternatiefNaam), '. ', r.alternatiefWaarom || ''])]));
      }
      body.appendChild(el('p', { className: 't-small', text: tool.labels.praktisch }));
      sv.value = fixTekst(T.samenvatting('trainingskiezer', r, antwoordRegels(form)));
    }

    prefillRadio(form, tool.id);
    bindForm(form, update);
    bindKnoppen(sectie, {
      tekst: function () { return sv.value || tool.labels.nogNietIngevuld; },
      link: function () { return deelLink(tool.id, laatste, tool.anker); },
      reset: function () { resetRadio(form); update(); }
    });
    update();
  }

  /* ---------- 5. AI Act-orientatie ---------- */
  function initAiAct() {
    var tool = C.tools.aiact;
    var sectie = document.getElementById(tool.id);
    if (!sectie) { return; }
    var form = q('form', sectie);
    var res = q('.result', sectie);
    var body = q('.res-body', res);
    var sv = q('.sv', sectie);
    var laatste = {};
    var CHIPVAR = { 'op-orde': 'chip-y', 'aandacht': '', 'prioriteit': 'chip-p', 'onbekend': '' };

    function update() {
      var a = leesRadio(form);
      var r = T.aiActCheck(a);
      laatste = a;
      leeg(body);
      if (r.beantwoord === 0) {
        body.appendChild(el('p', { className: 'res-leeg', text: tool.labels.nogNietIngevuld }));
        sv.value = '';
        return;
      }
      var u = tool.uitkomsten[r.niveau];
      var chips = el('div', { className: 'chips' });
      chips.appendChild(chip(tool.labels.niveau + ': ' + u.naam, CHIPVAR[r.niveau]));
      chips.appendChild(chip(r.beantwoord + ' van 6 beantwoord'));
      body.appendChild(chips);
      body.appendChild(el('h3', { className: 'res-kop res-live', text: u.kop }));
      body.appendChild(el('p', { text: u.uitleg }));
      body.appendChild(uitklap(tool.labels.punten + ' (' + r.punten.length + ')', lijst(r.punten), true));
      body.appendChild(blok(tool.labels.vervolg, [el('p', {}, [r.vervolg, ' ', link(r.vervolgLink, r.vervolgLinkTekst)])]));
      body.appendChild(el('p', { className: 't-small', text: r.disclaimer }));
      sv.value = fixTekst(T.samenvatting('aiact', r, antwoordRegels(form)));
    }

    prefillRadio(form, tool.id);
    bindForm(form, update);
    bindKnoppen(sectie, {
      tekst: function () { return sv.value || tool.labels.nogNietIngevuld; },
      link: function () { return deelLink(tool.id, laatste, tool.anker); },
      reset: function () { resetRadio(form); update(); }
    });
    update();
  }

  /* ---------- statische links naar /trainingen gelijktrekken ---------- */
  (function () {
    var links = qa('a[href^="/trainingen#"]');
    for (var i = 0; i < links.length; i++) { links[i].setAttribute('href', fixLink(links[i].getAttribute('href'))); }
  })();

  try {
    initKeuzehulp();
    initPromptbouwer();
    initTijdwinst();
    initTrainingskiezer();
    initAiAct();
    root.setAttribute('data-edtools', 'ok');
  } catch (e) {
    root.setAttribute('data-edtools', 'fout: ' + (e && e.message ? e.message : e));
  }
};

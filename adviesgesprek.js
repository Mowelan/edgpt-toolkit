/*
 * Adviesgesprek-pagina (www.ed-gpt.nl/adviesgesprek).
 * Squarespace-codeblok:  <div class="edgpt-toolkit" data-view="adviesgesprek"></div> plus embed.js.
 *
 * Een label kiezen = afscheuren: het label laat los van de lijn, draait om en op de achterkant staat de agenda.
 * Is de maand vol, dan hangt er een wachtlijst-label met een formulier op de achterkant.
 *
 * De stand komt uit adviesgesprek.json:
 *   plekken       aantal haken aan de lijn
 *   start         hoeveel labels er aan het begin van een maand hangen
 *   geboekt       reserve-stand per maand, { "JJJJ-MM": aantal }; alleen gebruikt als de teller niet antwoordt
 *   leegVolgorde  welke haak als eerste leeg is
 *   boekUrl       insluitlink van het afsprakenschema in Google Calendar (leeg = nog geen kalender)
 *   scriptUrl     web-app van google-script/adviesgesprek.gs: telt de echte boekingen in de agenda (GET)
 *                 en bewaart wachtlijst-aanmeldingen (POST). Leeg = reserve-stand en een mailto voor de wachtlijst.
 */
(function () {
  var MAANDEN = ['januari', 'februari', 'maart', 'april', 'mei', 'juni', 'juli', 'augustus', 'september', 'oktober', 'november', 'december'];
  var KORT = ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];
  var START_HOEK = [-10, 8, -12, 9, -7, 6, -8];
  var VEER = { label: [40, 2.2], los: [95, 1.4] }; // [stijfheid, demping]: een lege haak slingert sneller en lichter
  var MAIL = 'info@ed-gpt.nl';

  function maandNu() {
    var d = new Date(), y = d.getFullYear(), m = d.getMonth() + 1;
    try {
      new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Amsterdam', year: 'numeric', month: '2-digit' })
        .formatToParts(d).forEach(function (p) {
          if (p.type === 'year') y = +p.value;
          if (p.type === 'month') m = +p.value;
        });
    } catch (e) {}
    var vm = m % 12 + 1, vy = m === 12 ? y + 1 : y;
    function key(jaar, maand) { return jaar + '-' + (maand < 10 ? '0' : '') + maand; }
    return { key: key(y, m), naam: MAANDEN[m - 1], volgende: MAANDEN[vm - 1], volgendeKort: KORT[vm - 1], volgendeKey: key(vy, vm) };
  }
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
  /* Laatst bekende stand van deze bezoeker, zodat de lijn bij een volgend bezoek meteen klopt. */
  function onthouden(key) {
    try { var v = localStorage.getItem('edgpt-adviesgesprek-' + key); return v == null ? null : +v; } catch (e) { return null; }
  }
  function onthoud(key, aantal) {
    try { localStorage.setItem('edgpt-adviesgesprek-' + key, String(aantal)); } catch (e) {}
  }
  function hoofdletter(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  /* De echte stand: aantal boekingen van deze maand uit de agenda. De pagina wacht hier niet op (zie teken). */
  function live(url, key) {
    var wacht = new Promise(function (ok) { setTimeout(function () { ok(null); }, 8000); });
    var haal = fetch(url + (url.indexOf('?') < 0 ? '?' : '&') + 'maand=' + key)
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) { return d && typeof d.geboekt === 'number' ? d.geboekt : null; })
      .catch(function () { return null; });
    return Promise.race([haal, wacht]);
  }

  /* Slingers: elke haak is een gedempte slinger die reageert op de muis, op scrollen en af en toe op een zuchtje wind. */
  function slingers(rail, reduce) {
    var items = [], raf = 0, last = 0, zichtbaar = true;
    function tick(t) {
      var dt = Math.min(0.032, (t - last) / 1000) || 0.016;
      last = t;
      var bezig = false;
      items.forEach(function (p) {
        var acc = -p.k * p.a - p.c * p.v;
        p.v += acc * dt;
        p.a += p.v * dt;
        if (Math.abs(p.a) < 0.03 && Math.abs(p.v) < 0.08) { p.a = 0; p.v = 0; } else bezig = true;
        p.el.style.transform = 'rotate(' + p.a.toFixed(2) + 'deg)';
      });
      raf = bezig ? requestAnimationFrame(tick) : 0;
    }
    function wek() {
      if (raf || reduce) return;
      last = performance.now();
      raf = requestAnimationFrame(tick);
    }
    function duw(p, dv, wacht) {
      if (reduce) return;
      if (wacht) { setTimeout(function () { duw(p, dv); }, wacht); return; }
      p.v = clamp(p.v + dv, -420, 420);
      wek();
    }
    var kijker = null;
    if ('IntersectionObserver' in window) {
      kijker = new IntersectionObserver(function (e) { zichtbaar = e[0].isIntersecting; });
      kijker.observe(rail);
    }
    return {
      duw: duw,
      wek: wek,
      stop: function () { if (kijker) kijker.disconnect(); if (raf) cancelAnimationFrame(raf); },
      voegToe: function (el, soort, hoek) {
        var p = { el: el, a: reduce ? 0 : hoek, v: 0, k: VEER[soort][0], c: VEER[soort][1] };
        el.style.transform = 'rotate(' + p.a + 'deg)';
        items.push(p);
        return p;
      },
      zichtbaar: function () { return zichtbaar && document.visibilityState !== 'hidden'; }
    };
  }

  window.EDGPT_TOOLKIT_MODULES = window.EDGPT_TOOLKIT_MODULES || {};
  window.EDGPT_TOOLKIT_MODULES.adviesgesprek = function (root, data, api) {
    var esc = api.esc, p = (data && data.profile) || {};
    var reduce = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    var bust = /[?&]tkdev/.test(location.search) ? Date.now() : Math.floor(Date.now() / 300000);
    var nu = maandNu();
    var boekUrl = '', scriptUrl = '';
    var stand = { cfg: null, geboekt: 0 };
    var zelfGescheurd = []; // plekken die deze bezoeker afscheurde: die verdwijnen als eerste bij een nieuwe boeking
    var opruimers = []; // luisteraars en timers van de huidige lijn, zodat de lijn opnieuw getekend kan worden
    root.classList.add('ag');

    /* De pagina staat er meteen; de labels komen zodra de stand bekend is. */
    function teken(cfg) {
      var n = (cfg && cfg.plekken) || 5;
      boekUrl = (cfg && cfg.boekUrl) || '';
      scriptUrl = (cfg && cfg.scriptUrl) || '';

      var h = '<div class="tk-wrap ag-top"><span class="tk-eyebrow">Gratis adviesgesprek</span>' +
        '<h1>Wil je met AI aan de slag, maar loop je <em>vast</em>?</h1>' +
        '<p class="tk-lede">Of twijfel je waar je moet beginnen? Elke maand geef ik een paar gratis adviesgesprekken weg. 30 minuten online, geen pitch. Jouw vraag, mijn advies.</p></div>' +
        '<div class="ag-rail" style="--n:' + n + '">' +
        '<svg class="ag-string" viewBox="0 0 100 10" preserveAspectRatio="none" aria-hidden="true"><path d="M0,0 Q50,20 100,0" vector-effect="non-scaling-stroke"/></svg></div>' +
        '<div class="tk-wrap ag-status"></div>' +
        '<div class="tk-wrap ag-under"><section class="ag-wie"><div class="ag-ed">' +
        (p.photo ? '<img src="' + esc(p.photo) + '" alt="Ed van der Molen" width="76" height="76" loading="lazy">' : '') +
        '<div><b>' + esc(p.name || 'Ed van der Molen') + '</b><span>' + esc(p.tagline || '') + '</span></div></div>';
      if (api.logos && api.logos.length) {
        h += '<div class="ag-voor"><p class="tk-rail">Gewerkt voor</p><div class="ag-logos">' + api.logos.map(function (l) {
          return '<img src="' + l[1] + '?format=300w" alt="' + esc(l[0]) + '" loading="lazy">';
        }).join('') + '</div></div>';
      }
      h += '</section>' +
        '<p class="tk-privacy">Je gegevens gebruik ik alleen om dit gesprek te plannen. Meer in de <a href="https://www.ed-gpt.nl/privacyverklaring">privacyverklaring</a>.</p></div>';
      root.innerHTML = h;
      requestAnimationFrame(function () { root.querySelector('.ag-rail').classList.add('is-on'); });

      // meteen ophangen met de laatst bekende stand; de teller corrigeert op de achtergrond als die afwijkt
      var bekend = onthouden(nu.key);
      vul(cfg, bekend != null ? bekend : (cfg ? ((cfg.geboekt || {})[nu.key] || 0) : 0));
      if (scriptUrl) {
        live(scriptUrl, nu.key).then(function (g) {
          if (g == null) return;
          onthoud(nu.key, g);
          if (g !== stand.geboekt && !document.querySelector('.ag-layer')) herteken(g);
        });
      }
    }

    function hangHtml(i, soort, m) {
      var open = '<div class="ag-hang' + (soort === 'haak' ? ' is-leeg' : soort === 'weg' ? ' is-weg' : '') + '" style="--m:' + m + '"' +
        (soort === 'haak' || soort === 'weg' ? ' aria-hidden="true"' : '') + '><div class="ag-swing"><span class="ag-thread"></span>';
      if (soort === 'haak') return open + '<span class="ag-loop"></span></div></div>';
      open += '<span class="ag-scrap" aria-hidden="true"></span>';
      if (soort === 'weg') return open + '</div></div>';
      if (soort === 'wacht') {
        return open + '<button type="button" class="ag-tag is-wacht" data-wacht="1" aria-label="Wachtlijst voor ' + esc(nu.volgende) + '. Scheur af en laat je gegevens achter.">' +
          '<span class="ag-hole"></span><span class="ag-k">' + esc(nu.volgendeKort) + '</span><span class="ag-n">wacht<br>lijst</span>' +
          '<span class="ag-foot"><span>per mail</span></span></button></div></div>';
      }
      return open + '<button type="button" class="ag-tag" data-plek="' + i + '" aria-label="Plek ' + i + ', vrij. Scheur af en kies een moment.">' +
        '<span class="ag-hole"></span><span class="ag-k">Plek</span><span class="ag-n">' + i + '</span>' +
        '<span class="ag-foot"><span>30 min</span><span>gratis</span></span></button></div></div>';
    }

    /* Na een boeking klopt de lijn niet meer: haal de labels weg en hang ze opnieuw op met de nieuwe stand. */
    function herteken(geboekt) {
      opruimers.splice(0).forEach(function (weg) { weg(); });
      [].forEach.call(root.querySelectorAll('.ag-hang'), function (hang) { hang.parentNode.removeChild(hang); });
      vul(stand.cfg, geboekt);
    }

    function vul(cfg, geboekt) {
      stand = { cfg: cfg, geboekt: geboekt };
      var n = (cfg && cfg.plekken) || 5;
      var start = cfg ? clamp(cfg.start == null ? n : cfg.start, 0, n) : n;
      var weg = clamp(geboekt, 0, start), vrij = start - weg, vol = vrij === 0;
      var volgorde = ((cfg && cfg.leegVolgorde) || []).slice();
      for (var q = 1; q <= n; q++) if (volgorde.indexOf(q) < 0) volgorde.push(q);

      // per haak: nooit opgehangen (haak), echt geboekt (weg: snipper), vrij (label) of de wachtlijst
      var soort = {};
      volgorde.slice(0, n - start).forEach(function (plek) { soort[plek] = 'haak'; });
      var opgehangen = volgorde.slice(n - start);
      opgehangen = zelfGescheurd.filter(function (plek) { return opgehangen.indexOf(plek) > -1; })
        .concat(opgehangen.filter(function (plek) { return zelfGescheurd.indexOf(plek) < 0; }));
      opgehangen.slice(0, weg).forEach(function (plek) { soort[plek] = 'weg'; });
      if (vol) soort[volgorde[0]] = 'wacht';

      var rail = root.querySelector('.ag-rail'), h = '';
      for (var i = 1; i <= n; i++) {
        var t = (i - 0.5) / n;
        h += hangHtml(i, soort[i] || 'label', (4 * t * (1 - t)).toFixed(3));
      }
      rail.insertAdjacentHTML('beforeend', h);

      var s;
      if (!cfg) {
        s = '<p class="ag-count">Plan je gesprek in mijn agenda<small>Scheur een label af. Op de achterkant kies je een moment.</small></p>' +
          '<button type="button" class="tk-btn tk-btn-ink ag-go">Kies een moment</button>';
      } else if (vol) {
        s = '<p class="ag-count">' + esc(hoofdletter(nu.naam)) + ' zit vol<small>Scheur het wachtlijst-label af. Dan mail ik je zodra de plekken van ' + esc(nu.volgende) + ' er hangen.</small></p>' +
          '<button type="button" class="tk-btn tk-btn-ink ag-go">Zet me op de wachtlijst</button>';
      } else {
        s = '<p class="ag-count">Nog ' + vrij + (vrij === 1 ? ' plek' : ' plekken') + ' in ' + esc(nu.naam) + '<small>Scheur een label af. Op de achterkant kies je een moment.</small></p>' +
          '<button type="button" class="tk-btn tk-btn-ink ag-go">Kies een moment</button>';
      }
      root.querySelector('.ag-status').innerHTML = s;
      beweeg(rail);
    }

    /* ---------- achterkant van een label: de agenda, of het wachtlijst-formulier ---------- */
    function kalender() {
      return boekUrl
        ? '<iframe src="' + esc(boekUrl) + '" title="Kies een moment in de agenda van Ed"></iframe>'
        : '<div class="ag-paneel"><strong>Hier komt de boekingskalender van Google Calendar</strong>' +
          '<span>Het afsprakenschema bestaat nog niet. Zodra de link in adviesgesprek.json staat, verschijnt de kalender op deze plek.</span></div>';
    }
    function formulier() {
      return '<form class="ag-form" novalidate>' +
        '<label>Naam<input name="naam" type="text" autocomplete="name" required></label>' +
        '<label>E-mail<input name="email" type="email" autocomplete="email" inputmode="email" required></label>' +
        '<label>Waar wil je het over hebben? <i>Mag je overslaan.</i><textarea name="vraag" rows="4"></textarea></label>' +
        '<input class="ag-hp" name="website" type="text" tabindex="-1" autocomplete="off" aria-hidden="true">' +
        '<p class="ag-form-fout" role="alert" hidden></p>' +
        '<button type="submit" class="tk-btn tk-btn-ink">Zet me op de wachtlijst</button>' +
        '<p class="ag-form-priv">Ik gebruik je gegevens alleen om je over dit gesprek te mailen.</p></form>';
    }
    function koppelFormulier(paneel) {
      var form = paneel.querySelector('.ag-form');
      if (!form) return;
      var knop = form.querySelector('button'), fout = form.querySelector('.ag-form-fout');
      function meld(tekst) { fout.textContent = tekst; fout.hidden = false; }
      function klaar(kop, tekst) {
        paneel.innerHTML = '<div class="ag-paneel"><strong>' + kop + '</strong><span>' + tekst + '</span></div>';
      }
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var el = form.elements;
        var d = { naam: el.naam.value.trim(), email: el.email.value.trim(), vraag: el.vraag.value.trim(), website: el.website.value, maand: nu.volgendeKey };
        fout.hidden = true;
        if (!d.naam || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(d.email)) { meld('Vul je naam en een geldig e-mailadres in.'); return; }
        api.track('adviesgesprek_wachtlijst', {});
        if (!scriptUrl) {
          // nog geen script gekoppeld: het bericht gaat via het mailprogramma van de bezoeker
          location.href = 'mailto:' + MAIL + '?subject=' + encodeURIComponent('Wachtlijst adviesgesprek ' + nu.volgende) +
            '&body=' + encodeURIComponent('Naam: ' + d.naam + '\nE-mail: ' + d.email + (d.vraag ? '\n\n' + d.vraag : ''));
          klaar('Je mailprogramma opent', 'Er staat een bericht voor mij klaar. Verstuur het, dan sta je op de wachtlijst. Opent er niets? Mail dan naar <a href="mailto:' + MAIL + '">' + MAIL + '</a>.');
          return;
        }
        knop.disabled = true;
        knop.textContent = 'Bezig met versturen';
        // text/plain houdt het een eenvoudig verzoek; Apps Script beantwoordt geen preflight
        fetch(scriptUrl, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(d) })
          .then(function (r) { return r.json(); })
          .then(function (r) {
            if (!r || !r.ok) throw new Error('afgewezen');
            klaar('Je staat op de wachtlijst', 'Je krijgt een mail zodra de plekken van ' + esc(nu.volgende) + ' er hangen.');
          })
          .catch(function () {
            knop.disabled = false;
            knop.textContent = 'Zet me op de wachtlijst';
            meld('Versturen lukte niet. Probeer het opnieuw, of mail naar ' + MAIL + '.');
          });
      });
    }

    function beweeg(rail) {
      var sim = slingers(rail, reduce);
      var hangs = [].slice.call(rail.querySelectorAll('.ag-hang'));
      var perTag = [];
      var open = null;
      function aan(doel, type, fn, opties) {
        doel.addEventListener(type, fn, opties);
        opruimers.push(function () { doel.removeEventListener(type, fn, opties); });
      }
      opruimers.push(sim.stop);

      hangs.forEach(function (hang, i) {
        var los = !hang.querySelector('.ag-tag');
        perTag.push(sim.voegToe(hang.querySelector('.ag-swing'), los ? 'los' : 'label', los ? 16 - i * 6 : START_HOEK[i % START_HOEK.length]));
        // de ene opkomst: lijn, dan de labels een voor een
        setTimeout(function () { hang.classList.add('is-in'); sim.wek(); }, reduce ? 0 : 120 + i * 70);
      });

      // muis: een label dat je raakt, zwaait mee met de richting van je beweging
      var vx = 0, lx = null, lt = 0;
      aan(rail, 'pointermove', function (e) {
        if (e.pointerType === 'touch') return;
        var t = performance.now();
        if (lx != null && t > lt) vx = 0.6 * vx + 0.4 * ((e.clientX - lx) / (t - lt));
        lx = e.clientX; lt = t;
      });
      aan(rail, 'pointerleave', function () { lx = null; vx = 0; });
      // zodra iemand naar de labels gaat: verbinding met de agenda van Google alvast openen, dan laadt die sneller
      function warmOp() {
        if (!boekUrl || document.querySelector('link[data-ag-warm]')) return;
        var l = document.createElement('link');
        l.rel = 'preconnect'; l.href = 'https://calendar.google.com'; l.setAttribute('data-ag-warm', '1');
        document.head.appendChild(l);
      }
      aan(rail, 'pointerenter', warmOp);
      aan(rail, 'touchstart', warmOp, { passive: true });
      hangs.forEach(function (hang, i) {
        hang.querySelector('.ag-swing').addEventListener('pointerenter', function (e) {
          if (e.pointerType === 'touch') return;
          var dv = -clamp(vx * 140, -260, 260);
          if (Math.abs(dv) < 30) dv = (i % 2 ? 1 : -1) * 40;
          sim.duw(perTag[i], dv);
        });
      });

      // scrollen: de hele lijn beweegt mee
      var ly = window.pageYOffset, klaar = 0;
      aan(window, 'scroll', function () {
        var y = window.pageYOffset, dy = y - ly, t = performance.now();
        ly = y;
        if (t < klaar || !sim.zichtbaar()) return;
        klaar = t + 140;
        perTag.forEach(function (sl, i) { sim.duw(sl, clamp(dy * 1.4, -70, 70) * (0.55 + ((i * 37) % 10) / 14)); });
      }, { passive: true });

      // af en toe een zuchtje wind, van links naar rechts
      if (!reduce) {
        var wind = setInterval(function () {
          if (!sim.zichtbaar() || open) return;
          perTag.forEach(function (sl, i) { sim.duw(sl, -(10 + Math.random() * 10), i * 120); });
        }, 6200);
        opruimers.push(function () { clearInterval(wind); });
      }

      /* ---------- afscheuren: label laat los, vliegt naar het midden en draait om ---------- */
      var kanBewegen = !reduce && typeof document.body.animate === 'function';
      function T(x, y, rot, sc, ry) {
        return 'translate(-50%,-50%) translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px) rotate(' + rot.toFixed(2) + 'deg) rotateY(' + ry + 'deg) scale(' + sc.toFixed(4) + ')';
      }
      function B(ry, sc) { return 'translate(-50%,-50%) rotateY(' + ry + 'deg) scale(' + sc + ')'; }
      function vanMidden(el) {
        var r = el.getBoundingClientRect();
        return { x: r.left + r.width / 2 - window.innerWidth / 2, y: r.top + r.height / 2 - window.innerHeight / 2 };
      }
      function stap(el, frames, duur, easing) {
        return el.animate(frames, { duration: duur, easing: easing || 'linear', fill: 'forwards' }).finished;
      }

      function scheurAf(tag, viaToetsenbord) {
        if (open || !tag) return;
        var hang = tag.closest('.ag-hang'), i = hangs.indexOf(hang), sl = perTag[i];
        var wacht = tag.classList.contains('is-wacht'), plek = tag.getAttribute('data-plek');
        var vw = window.innerWidth, vh = window.innerHeight;
        var van = vanMidden(tag), hoek = sl.a;
        var fw = Math.min(vw - 56, Math.min(Math.min(860, vh - 20) * 0.84, 600) / 1.5);
        var s0 = tag.offsetWidth / fw;
        var titel = wacht ? 'Op de wachtlijst voor ' + nu.volgende : 'Kies een moment';

        var layer = document.createElement('div');
        layer.className = 'edtk ag ag-layer';
        layer.setAttribute('role', 'dialog');
        layer.setAttribute('aria-modal', 'true');
        layer.setAttribute('aria-label', wacht ? titel : 'Plek ' + plek + ': kies een moment');
        layer.innerHTML = '<div class="ag-dim"></div>' +
          '<div class="ag-front" style="--fw:' + fw.toFixed(1) + 'px" aria-hidden="true"><div class="ag-tag' + (wacht ? ' is-wacht' : '') + '">' + tag.innerHTML + '</div></div>' +
          '<div class="ag-back"><div class="ag-back-in"><span class="ag-hole"></span>' +
          '<div class="ag-back-head"><div><span class="ag-k">' + (wacht ? 'Wachtlijst' : 'Plek ' + esc(plek)) + '</span><h2>' + esc(titel) + '</h2></div>' +
          '<button type="button" class="tk-btn tk-btn-ink ag-x">Sluiten</button></div>' +
          '<p class="ag-back-sub">' + (wacht
            ? esc(hoofdletter(nu.naam)) + ' zit vol. Laat je gegevens achter, dan mail ik je zodra de plekken van ' + esc(nu.volgende) + ' er hangen.'
            : 'Je kiest zelf een dag en tijd in mijn agenda. Ik spreek je online via Google Meet. De link staat in je bevestigingsmail.') + '</p>' +
          '<div class="ag-cal">' + (wacht ? formulier() : kalender()) + '</div></div></div>';
        document.body.appendChild(layer);

        var front = layer.querySelector('.ag-front'), back = layer.querySelector('.ag-back'), x = layer.querySelector('.ag-x');
        open = { tag: tag, hang: hang, sl: sl, layer: layer, front: front, back: back, s0: s0, wacht: wacht, bezig: true,
          terug: viaToetsenbord ? document.activeElement : null }; // alleen wie met het toetsenbord kwam, krijgt de focus terug
        open.toets = function (e) { if (e.key === 'Escape') sluit(); };
        document.addEventListener('keydown', open.toets);
        layer.querySelector('.ag-dim').addEventListener('click', sluit);
        x.addEventListener('click', sluit);
        koppelFormulier(layer.querySelector('.ag-cal'));
        // de agenda van Google heeft even nodig: zeg dat, tot hij er staat
        var agenda = layer.querySelector('.ag-cal iframe');
        if (agenda) {
          var laadt = document.createElement('p');
          laadt.className = 'ag-laadt';
          laadt.textContent = 'De agenda van Google laadt. Dat duurt een paar seconden.';
          agenda.parentNode.insertBefore(laadt, agenda);
          agenda.addEventListener('load', function () { if (laadt.parentNode) laadt.parentNode.removeChild(laadt); });
        }
        // de pagina eronder scrolt niet mee; de agenda en het formulier zelf wel
        ['wheel', 'touchmove'].forEach(function (ev) {
          layer.addEventListener(ev, function (e) {
            if (!(e.target.closest && e.target.closest('.ag-cal'))) e.preventDefault();
          }, { passive: false });
        });

        // de haak: label weg, snipper blijft, het touw veert op en de buren schrikken mee
        hang.classList.add('is-af');
        sl.k = VEER.los[0]; sl.c = VEER.los[1];
        sim.duw(sl, -280);
        if (perTag[i - 1]) sim.duw(perTag[i - 1], 55, 60);
        if (perTag[i + 1]) sim.duw(perTag[i + 1], -55, 60);
        api.track('adviesgesprek_plek', { plek: wacht ? 'wachtlijst' : plek });

        function staat() {
          if (open) open.bezig = false;
          (layer.querySelector('.ag-form input') || x).focus({ preventScroll: true });
        }
        requestAnimationFrame(function () { layer.classList.add('is-open'); });
        if (!kanBewegen) {
          front.style.visibility = 'hidden';
          back.style.visibility = 'visible';
          staat();
          return;
        }
        front.animate([
          { transform: T(van.x, van.y, hoek, s0, 0), easing: 'cubic-bezier(.2,1.5,.4,1)' },
          { transform: T(van.x, van.y + 20, hoek + 7, s0, 0), offset: 0.2, easing: 'cubic-bezier(.45,0,.15,1)' },
          { transform: T(0, 0, 0, 1, 0) }
        ], { duration: 540, fill: 'forwards' }).finished
          .then(function () { return stap(front, [{ transform: T(0, 0, 0, 1, 0) }, { transform: T(0, 0, 0, 1, 90) }], 140, 'cubic-bezier(.5,0,1,.6)'); })
          .then(function () {
            front.style.visibility = 'hidden';
            back.style.visibility = 'visible';
            return stap(back, [{ transform: B(-90, 0.9) }, { transform: B(0, 1) }], 260, 'cubic-bezier(.2,.9,.3,1.12)');
          })
          .then(staat, staat);
      }

      function sluit() {
        if (!open || open.bezig) return;
        var o = open;
        o.bezig = true;
        o.layer.classList.remove('is-open');
        function hangTerug() {
          document.removeEventListener('keydown', o.toets);
          if (o.layer.parentNode) o.layer.parentNode.removeChild(o.layer);
          o.hang.classList.remove('is-af');
          o.sl.k = VEER.label[0]; o.sl.c = VEER.label[1];
          sim.duw(o.sl, 160);
          open = null;
          if (o.terug && document.contains(o.terug)) o.terug.focus({ preventScroll: true });
          api.track('adviesgesprek_sluit', {});
          // net geboekt? Dan telt de agenda er een meer en hangt dit label er niet meer
          if (scriptUrl && !o.wacht) {
            var plek = +o.tag.getAttribute('data-plek');
            live(scriptUrl + (scriptUrl.indexOf('?') < 0 ? '?' : '&') + 'vers=1', nu.key).then(function (g) {
              if (g != null) onthoud(nu.key, g);
              if (g == null || g === stand.geboekt || open) return;
              if (g > stand.geboekt && zelfGescheurd.indexOf(plek) < 0) zelfGescheurd.unshift(plek);
              herteken(g);
            });
          }
        }
        if (!kanBewegen) { hangTerug(); return; }
        var naar = vanMidden(o.tag);
        stap(o.back, [{ transform: B(0, 1) }, { transform: B(-90, 0.9) }], 140, 'cubic-bezier(.5,0,1,.6)')
          .then(function () {
            o.back.style.visibility = 'hidden';
            o.front.style.visibility = 'visible';
            return stap(o.front, [{ transform: T(0, 0, 0, 1, 90) }, { transform: T(0, 0, 0, 1, 0) }], 140, 'cubic-bezier(0,.4,.5,1)');
          })
          .then(function () { return stap(o.front, [{ transform: T(0, 0, 0, 1, 0) }, { transform: T(naar.x, naar.y, 0, o.s0, 0) }], 320, 'cubic-bezier(.45,0,.2,1)'); })
          .then(hangTerug, hangTerug);
      }

      aan(rail, 'click', function (e) {
        var tag = e.target.closest && e.target.closest('.ag-tag');
        if (tag) scheurAf(tag, e.detail === 0);
      });
      var go = root.querySelector('.ag-go');
      if (go) go.addEventListener('click', function (e) {
        api.track('adviesgesprek_knop', {});
        scheurAf(rail.querySelector('.ag-tag'), e.detail === 0);
      });
    }

    fetch(api.base + 'adviesgesprek.json?v=' + bust)
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(teken)
      .catch(function () { teken(null); });
  };
})();

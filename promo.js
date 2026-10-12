/*
 * Site-brede promotie voor de gratis AI-adviesgesprekken (www.ed-gpt.nl/adviesgesprek):
 *   - een gele balk bovenaan elke pagina
 *   - een kaartje dat na een paar seconden oppopt, hooguit eenmaal per week per bezoeker
 * Beide tonen het aantal plekken uit dezelfde bron als de pagina zelf (adviesgesprek.json plus de teller in de agenda)
 * en melden "zit vol" als de maand vol is. Niet op /adviesgesprek, /linkinbio en in de Squarespace-editor.
 *
 * Squarespace: Settings > Developer Tools > Code Injection > Footer, een regel:
 *   <script src="https://mowelan.github.io/edgpt-toolkit/promo.js" defer></script>
 * Uitzetten: die regel weghalen. Geen andere bestanden van de site worden gewijzigd.
 */
(function () {
  if (window.__edgptPromo) return;
  window.__edgptPromo = true;
  try { if (window.top !== window.self) return; } catch (e) { return; }
  var pad = location.pathname.replace(/\/+$/, '').toLowerCase();
  if (/^\/(adviesgesprek|linkinbio|links|config)(\/|$)/.test(pad)) return;

  var script = document.currentScript;
  var BASE = window.EDGPT_PROMO_BASE || (script && script.src ? script.src.replace(/[^\/]*(\?.*)?$/, '') : 'https://mowelan.github.io/edgpt-toolkit/');
  var BUST = Math.floor(Date.now() / 300000);
  var LINK = '/adviesgesprek';
  var MAANDEN = ['januari', 'februari', 'maart', 'april', 'mei', 'juni', 'juli', 'augustus', 'september', 'oktober', 'november', 'december'];
  var WEEK = 7 * 864e5, VERS = 10 * 6e4;

  function maandNu() {
    var d = new Date(), y = d.getFullYear(), m = d.getMonth() + 1;
    try {
      new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Amsterdam', year: 'numeric', month: '2-digit' })
        .formatToParts(d).forEach(function (p) { if (p.type === 'year') y = +p.value; if (p.type === 'month') m = +p.value; });
    } catch (e) {}
    return { key: y + '-' + (m < 10 ? '0' : '') + m, naam: MAANDEN[m - 1], volgende: MAANDEN[m % 12] };
  }
  var nu = maandNu();
  function lees(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function schrijf(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function meet(naam, p) { try { if (window.gtag) window.gtag('event', naam, p || {}); } catch (e) {} }
  function hoofd(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  // wat we weten: aantal vrije plekken (null = nog niet bekend)
  var vrij = lees('edgpt-promo-vrij-' + nu.key);
  vrij = vrij === null ? null : +vrij;

  var css = document.createElement('style');
  css.textContent =
    '#egp-bar{position:absolute;left:0;right:0;top:0;z-index:10;height:46px;display:flex;align-items:center;justify-content:center;gap:20px;padding:0 14px;background:#FFD02F;color:#1A1A1A!important;font:700 15px/1 Raleway,system-ui,sans-serif;text-decoration:none!important;white-space:nowrap}' +
    '#egp-bar b{font:700 17px/1 "Space Grotesk",system-ui,sans-serif;letter-spacing:-.01em}' +
    '#egp-bar u{text-decoration:none;background:#1A1A1A;color:#FFD02F;padding:9px 16px;border-radius:99px}' +
    '#egp-bar:hover u{background:#000}' +
    '#egp-bar:focus-visible{outline:3px solid #5123EB;outline-offset:-3px}' +
    'html.egp-bar #header{top:46px!important}' +
    '#egp-pop{position:fixed;right:28px;bottom:28px;z-index:2147483000;width:318px;padding:24px 24px 22px;background:#FFD02F;color:#1A1A1A;border-radius:20px;transform:rotate(-2deg);box-shadow:0 22px 40px -10px rgba(0,0,0,.35);font-family:Raleway,system-ui,sans-serif}' +
    '#egp-pop.egp-in{animation:egp-in .55s cubic-bezier(.2,.9,.3,1.15) both}' +
    '@keyframes egp-in{from{transform:translateY(34px) rotate(-5deg);opacity:0}to{transform:translateY(0) rotate(-2deg);opacity:1}}' +
    '#egp-pop small{display:block;font:600 11px/1 Raleway,system-ui,sans-serif;letter-spacing:.18em;text-transform:uppercase}' +
    '#egp-pop strong{display:block;font:700 30px/1.02 "Space Grotesk",system-ui,sans-serif;letter-spacing:-.025em;margin:10px 0 8px;color:#1A1A1A}' +
    '#egp-pop p{margin:0 0 16px;font:500 15px/1.4 Raleway,system-ui,sans-serif;color:#1A1A1A}' +
    '#egp-pop a{display:inline-block;background:#1A1A1A;color:#FFD02F!important;padding:12px 22px;border-radius:99px;font:700 15px/1 Raleway,system-ui,sans-serif;text-decoration:none!important}' +
    '#egp-pop a:hover{background:#000}' +
    '#egp-pop button{position:absolute;right:8px;top:6px;width:40px;height:40px;border:0;background:none;font:500 28px/1 Raleway,system-ui,sans-serif;color:#1A1A1A;cursor:pointer;padding:0}' +
    '#egp-pop a:focus-visible,#egp-pop button:focus-visible{outline:3px solid #5123EB;outline-offset:2px;border-radius:99px}' +
    '@media(max-width:640px){#egp-bar{height:40px;gap:10px;font-size:12.5px}#egp-bar b{font-size:13.5px}#egp-bar u{padding:7px 11px}#egp-bar .egp-lang{display:none}html.egp-bar #header{top:40px!important}' +
    '#egp-pop{left:12px;right:12px;bottom:12px;width:auto;padding:16px 18px 16px;transform:none;border-radius:16px}#egp-pop strong{font-size:23px;margin:7px 0 5px}#egp-pop p{font-size:14px;margin-bottom:12px}#egp-pop a{padding:11px 20px}' +
    '#egp-pop.egp-in{animation-name:egp-in-m}@keyframes egp-in-m{from{transform:translateY(40px);opacity:0}to{transform:none;opacity:1}}}' +
    '@media(max-width:380px){#egp-bar span.egp-kort{display:none}}' +
    '@media(prefers-reduced-motion:reduce){#egp-pop.egp-in{animation:none}}';
  document.head.appendChild(css);

  function tekst() {
    var plek = vrij === 1 ? 'plek' : 'plekken';
    if (vrij === null) return { regel: 'Plan je gesprek in mijn agenda', knop: 'Claim je plek', kaart: '30 minuten online, geen pitch. Jouw vraag, mijn advies.', kaartKnop: 'Claim je plek' };
    if (vrij === 0) return { regel: hoofd(nu.naam) + ' zit vol', knop: 'Wachtlijst', kaart: 'Alle plekken van ' + nu.naam + ' zijn weg. Zet je op de wachtlijst voor ' + nu.volgende + '.', kaartKnop: 'Naar de wachtlijst' };
    return { regel: 'Nog ' + vrij + ' ' + plek + ' in ' + nu.naam, knop: 'Claim je plek', kaart: '30 minuten online, geen pitch. Nog ' + vrij + ' ' + plek + ' in ' + nu.naam + '.', kaartKnop: 'Claim je plek' };
  }

  var bar = document.createElement('a');
  bar.id = 'egp-bar'; bar.href = LINK;
  function tekenBar() {
    var t = tekst();
    bar.innerHTML = '<b>Gratis AI-adviesgesprek</b><span class="egp-lang">' + t.regel + '</span><u>' + t.knop + '</u>';
    // op een smalle telefoon past de volle titel niet: korte regel in plaats daarvan
    bar.setAttribute('aria-label', 'Gratis AI-adviesgesprek. ' + t.regel + '. ' + t.knop);
  }
  tekenBar();
  bar.addEventListener('click', function () { meet('promo_balk_klik', { vrij: vrij === null ? 'onbekend' : vrij }); });
  function zetBar() {
    if (!document.body) return;
    document.body.insertBefore(bar, document.body.firstChild);
    document.documentElement.classList.add('egp-bar');
  }
  if (document.body) zetBar(); else document.addEventListener('DOMContentLoaded', zetBar);

  /* ---------- het kaartje ---------- */
  var kaart = null, getoond = false;
  function weggeklikt() { var t = +lees('edgpt-promo-weg') || 0; return Date.now() - t < WEEK; }
  function sluit(reden) {
    schrijf('edgpt-promo-weg', String(Date.now()));
    if (kaart && kaart.parentNode) kaart.parentNode.removeChild(kaart);
    kaart = null;
    meet('promo_kaart_' + reden);
  }
  function toonKaart() {
    if (getoond || weggeklikt() || !document.body) return;
    getoond = true;
    var t = tekst();
    kaart = document.createElement('div');
    kaart.id = 'egp-pop';
    kaart.setAttribute('role', 'complementary');
    kaart.setAttribute('aria-label', 'Gratis AI-adviesgesprek');
    kaart.innerHTML = '<button type="button" aria-label="Sluiten">&times;</button><small>Gratis</small><strong>AI-adviesgesprek</strong><p></p><a href="' + LINK + '"></a>';
    kaart.querySelector('p').textContent = t.kaart;
    kaart.querySelector('a').textContent = t.kaartKnop;
    kaart.querySelector('button').addEventListener('click', function () { sluit('sluit'); });
    kaart.querySelector('a').addEventListener('click', function () { schrijf('edgpt-promo-weg', String(Date.now())); meet('promo_kaart_klik', { vrij: vrij === null ? 'onbekend' : vrij }); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && kaart) sluit('sluit'); });
    document.body.appendChild(kaart);
    requestAnimationFrame(function () { kaart.classList.add('egp-in'); });
    meet('promo_kaart_zicht');
  }
  var wacht = (window.matchMedia && window.matchMedia('(max-width:640px)').matches) ? 12000 : 8000;
  setTimeout(toonKaart, wacht);

  function bijwerken(nieuw) {
    if (nieuw === vrij) return;
    vrij = nieuw;
    schrijf('edgpt-promo-vrij-' + nu.key, String(vrij));
    tekenBar();
    if (kaart) {
      var t = tekst();
      kaart.querySelector('p').textContent = t.kaart;
      kaart.querySelector('a').textContent = t.kaartKnop;
    }
  }

  /* ---------- het aantal plekken: zelfde bron als de pagina ---------- */
  fetch(BASE + 'adviesgesprek.json?v=' + BUST)
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(function (cfg) {
      var n = cfg.plekken || 5, start = cfg.start == null ? n : cfg.start;
      function uitGeboekt(g) { return Math.max(0, Math.min(n, start - g)); }
      var reserve = (cfg.geboekt || {})[nu.key] || 0;
      if (vrij === null) bijwerken(uitGeboekt(reserve)); // reserve-stand alleen als we nog niets eerders wisten
      if (!cfg.scriptUrl) return;
      var vers = null;
      try { vers = JSON.parse(lees('edgpt-promo-live-' + nu.key) || 'null'); } catch (e) {}
      if (vers && Date.now() - vers.t < VERS) { bijwerken(uitGeboekt(vers.g)); return; }
      var klaar = false;
      setTimeout(function () { klaar = true; }, 8000);
      fetch(cfg.scriptUrl + (cfg.scriptUrl.indexOf('?') < 0 ? '?' : '&') + 'maand=' + nu.key)
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (d) {
          if (klaar || !d || typeof d.geboekt !== 'number') return;
          schrijf('edgpt-promo-live-' + nu.key, JSON.stringify({ g: d.geboekt, t: Date.now() }));
          bijwerken(uitGeboekt(d.geboekt));
        })
        .catch(function () {});
    })
    .catch(function () {});
})();

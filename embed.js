/*
 * EdGPT Toolkit embed.
 * Squarespace-codeblok:  <div class="edgpt-toolkit" data-view="toolkit"></div>
 *                        <script src="https://mowelan.github.io/edgpt-toolkit/embed.js" defer></script>
 * data-view: "toolkit" (www.ed-gpt.nl/tools: overzicht + tools via #slug) of "links" (link in bio).
 * Nieuwe goodie = regel in goodies.js plus (bij een tool) goodies/{slug}.js. Squarespace blijft ongemoeid.
 */
(function () {
  if (window.__edgptToolkit) return;
  window.__edgptToolkit = true;

  var script = document.currentScript || document.querySelector('script[src*="toolkit/embed.js"]');
  var BASE = script.src.replace(/[^\/]*(\?.*)?$/, '');
  var BUST = Math.floor(Date.now() / 300000); // registry en modules max 5 minuten oud
  var SITE = 'https://www.ed-gpt.nl';
  var LINKS = {
    toolkit: SITE + '/tools',
    trainingen: SITE + '/trainingen',
    blog: SITE + '/blog',
    kennismaking: 'https://calendly.com/edvandermolen-info/30min',
    instagram: 'https://www.instagram.com/edgpt_nl/',
    tiktok: 'https://www.tiktok.com/@ed_gpt',
    linkedin: 'https://www.linkedin.com/in/edvandermolen/'
  };
  window.EDGPT_TOOLKIT_MODULES = window.EDGPT_TOOLKIT_MODULES || {};

  function addCss(href) {
    if (document.querySelector('link[href="' + href + '"]')) return;
    var l = document.createElement('link');
    l.rel = 'stylesheet'; l.href = href;
    document.head.appendChild(l);
  }
  var loaded = {};
  function loadJs(src) {
    if (!loaded[src]) {
      loaded[src] = new Promise(function (ok, fail) {
        var s = document.createElement('script');
        s.src = src; s.async = true; s.onload = ok;
        s.onerror = function () { delete loaded[src]; fail(); };
        document.head.appendChild(s);
      });
    }
    return loaded[src];
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }
  function track(name, params) {
    try { if (window.gtag) window.gtag('event', name, params || {}); } catch (e) {}
  }

  // Fonts staan al in de site-header (edv2); dit is alleen een vangnet voor losse previews.
  if (!document.querySelector('link[href*="Space+Grotesk"]')) {
    addCss('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=Raleway:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
  }
  addCss(BASE + 'toolkit.css?v=' + BUST);

  var api = { esc: esc, track: track, links: LINKS, base: BASE, bridge: bridge,
    css: function (href) { addCss(href + '?v=' + BUST); }, js: function (src) { return loadJs(src + '?v=' + BUST); } };

  function bridge(line) {
    return '<section class="tk-bridge"><div>' +
      '<h2>Dit met je hele team leren?</h2>' +
      '<p>' + esc(line || 'Ik geef praktische AI-trainingen voor marketing- en contentteams. Met jullie eigen werk als oefenmateriaal, zodat je het de dag erna gewoon gebruikt.') + '</p>' +
      '</div><div class="tk-btns">' +
      '<a class="tk-btn tk-btn-y" href="' + LINKS.trainingen + '">Bekijk de trainingen</a>' +
      '<a class="tk-btn tk-btn-ghost" href="' + LINKS.kennismaking + '" target="_blank" rel="noopener">Plan een kennismaking</a>' +
      '</div></section>';
  }

  function fromLine(g) {
    return g.video ? '<span class="tk-feature-from">Uit ' + esc(g.video) + '</span>' : '';
  }
  function cta(g) {
    return g.cta || { Tool: 'Open de tool', Prompts: 'Bekijk de prompts', Guide: 'Lees de guide' }[g.type] || 'Bekijk hem hier';
  }
  function goodieHref(g, absolute) {
    if (g.href) return g.href;
    return (absolute ? LINKS.toolkit : '') + '#' + g.slug;
  }

  /* ---------- tools-overzicht ---------- */
  var GROUPS = [
    { id: 'team', title: 'Voor je team', empty: '' },
    { id: 'video', title: 'Uit mijn video\'s', empty: 'Bij mijn video\'s komt hier steeds iets bij. Volg me op <a href="' + LINKS.instagram + '" target="_blank" rel="noopener">Instagram</a> of <a href="' + LINKS.tiktok + '" target="_blank" rel="noopener">TikTok</a>, dan zie je als eerste wat er nieuw is.' }
  ];
  function newest(data) {
    return data.goodies.slice().sort(function (a, b) { return a.date < b.date ? 1 : -1; })[0];
  }
  function card(g) {
    return '<a class="tk-card" href="' + goodieHref(g) + '"><span class="tk-pill">' + esc(g.type) + '</span>' +
      '<h3>' + esc(g.title) + '</h3><p>' + esc(g.line) + '</p>' + fromLine(g) + '<span class="tk-go">' + esc(cta(g)) + ' &rarr;</span></a>';
  }
  function renderOverview(root, data) {
    var top = newest(data);
    var h = '<div class="tk-wrap">' +
      '<header class="tk-hero"><span class="tk-eyebrow">Gratis tools</span>' +
      '<h1>AI-tools die je meteen kunt gebruiken.</h1>' +
      '<p class="tk-lede">Geen account en geen formulier. Wat je invult blijft in je browser. Bij mijn video\'s komt er steeds iets bij, het nieuwste staat bovenaan.</p></header>';
    if (top) {
      h += '<article class="tk-feature"><div class="tk-feature-body">' +
        '<span class="tk-pill is-new">Nieuw · ' + esc(top.type) + '</span>' +
        '<h2>' + esc(top.title) + '</h2><p>' + esc(top.line) + '</p>' + fromLine(top) +
        '<a class="tk-btn tk-btn-ink" href="' + goodieHref(top) + '">' + esc(cta(top)) + '</a>' +
        '</div><div class="tk-feature-art" aria-hidden="true">' + (top.art || '') + '</div></article>';
    }
    GROUPS.forEach(function (gr) {
      var items = data.goodies.filter(function (g) { return (g.group || 'video') === gr.id && g !== top; });
      if (!items.length && !gr.empty) return;
      h += '<h2 class="tk-section-title">' + gr.title + '</h2>';
      h += items.length ? '<div class="tk-grid">' + items.map(card).join('') + '</div>' : '<p class="tk-follow">' + gr.empty + '</p>';
    });
    h += bridge() + '<p class="tk-privacy">Wat je in deze tools invult, blijft in je browser en wordt niet opgeslagen. Meer in de <a href="' + SITE + '/privacyverklaring">privacyverklaring</a>.</p></div>';
    root.innerHTML = h;
  }

  /* ---------- een goodie openen ---------- */
  function renderGoodie(root, g) {
    root.innerHTML = '<div class="tk-wrap tk-wrap-top"><a class="tk-back" href="#">&larr; Alle tools</a></div>' +
      '<div class="tk-goodie' + (g.fullBleed ? '' : ' tk-wrap tk-wrap-mid') + '"><p class="tk-loading">Even laden…</p></div>' +
      '<div class="tk-wrap tk-wrap-bottom"></div>';
    var slot = root.querySelector('.tk-goodie'), after = root.querySelector('.tk-wrap-bottom');
    var mod = window.EDGPT_TOOLKIT_MODULES[g.slug];
    var ready = mod ? Promise.resolve() : loadJs(BASE + 'goodies/' + g.slug + '.js?v=' + BUST);
    ready.then(function () {
      window.EDGPT_TOOLKIT_MODULES[g.slug](slot, g, api);
      after.insertAdjacentHTML('beforeend', bridge(g.training) +
        (g.updated ? '<p class="tk-updated">' + esc(g.updated) + '</p>' : ''));
      track('toolkit_open', { goodie: g.slug });
    }).catch(function () {
      slot.innerHTML = '<p class="tk-follow">Deze tool laadt nu niet. Ververs de pagina, of <a href="' + LINKS.instagram + '" target="_blank" rel="noopener">stuur me een DM</a>, dan stuur ik hem je zo.</p>';
    });
  }

  function mountToolkit(root, data) {
    var baseTitle = document.title;
    var current = null;
    function find(slug) {
      return data.goodies.filter(function (x) { return !x.href && (x.slug === slug || (x.aliases || []).indexOf(slug) > -1); })[0];
    }
    function route(scroll, fromHashChange) {
      var slug = decodeURIComponent((location.hash || '').replace(/^#\/?/, ''));
      var g = find(slug);
      // ankers binnen een tool (bv. #keuzehulp-result) laten we met rust
      if (!g && slug && fromHashChange) return;
      if (g && current === g) return;
      current = g || null;
      if (g) { renderGoodie(root, g); document.title = g.title + ' · EdGPT'; }
      else { renderOverview(root, data); document.title = baseTitle; }
      if (scroll) {
        var y = root.getBoundingClientRect().top + window.pageYOffset - 90;
        window.scrollTo(0, Math.max(0, y));
      }
    }
    window.addEventListener('hashchange', function () { route(true, true); });
    route(!!location.hash);
  }

  /* ---------- link in bio ---------- */
  function mountLinks(root, data) {
    root.classList.add('tk-links');
    var top = data.goodies.slice().sort(function (a, b) { return a.date < b.date ? 1 : -1; })[0];
    var p = data.profile || {};
    function link(href, title, sub, ext) {
      return '<a class="tk-link" href="' + href + '"' + (ext ? ' target="_blank" rel="noopener"' : '') + '><span>' + esc(title) +
        (sub ? '<small>' + esc(sub) + '</small>' : '') + '</span><span class="tk-arr" aria-hidden="true">&rarr;</span></a>';
    }
    var h = '<div class="tk-links-in">' +
      (p.photo ? '<img class="tk-avatar" src="' + esc(p.photo) + '" alt="Ed van der Molen" width="104" height="104">' : '') +
      '<h1>' + esc(p.name || 'Ed van der Molen') + '</h1>' +
      '<p class="tk-sub">' + esc(p.tagline || '') + '</p><div class="tk-linklist">';
    if (top) {
      h += '<a class="tk-link is-featured" href="' + goodieHref(top, true) + '">' +
        '<span class="tk-pill">Uit mijn nieuwste video</span><span class="tk-t">' + esc(top.title) + '</span>' +
        '<small>' + esc(top.short || top.line) + '</small></a>';
    }
    h += link(LINKS.toolkit, 'Gratis AI-tools', 'Prompt-bouwers, model-keuzehulp, tijdwinstcalculator en meer') +
      link(LINKS.trainingen, 'AI-training voor je team', 'Praktisch, met jullie eigen werk als oefenmateriaal') +
      link(LINKS.kennismaking, 'Plan een kennismaking', '30 minuten, gewoon even sparren', true) +
      link(LINKS.blog, 'Blog', 'Wat ik test, en wat wel en niet werkt') +
      '</div><div class="tk-socials">' +
      '<a href="' + LINKS.instagram + '" target="_blank" rel="noopener">Instagram</a>' +
      '<a href="' + LINKS.tiktok + '" target="_blank" rel="noopener">TikTok</a>' +
      '<a href="' + LINKS.linkedin + '" target="_blank" rel="noopener">LinkedIn</a>' +
      '</div><p class="tk-links-foot"><a href="' + SITE + '">www.ed-gpt.nl</a></p></div>';
    root.innerHTML = h;
    root.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a');
      if (a) track('linkinbio_click', { link: a.textContent.trim().slice(0, 60) });
    });
  }

  function boot() {
    var roots = document.querySelectorAll('.edgpt-toolkit');
    if (!roots.length) return;
    [].forEach.call(roots, function (r) { r.classList.add('edtk'); r.innerHTML = '<p class="tk-loading">Even laden…</p>'; });
    loadJs(BASE + 'goodies.js?v=' + BUST).then(function () {
      var data = window.EDGPT_TOOLKIT;
      [].forEach.call(roots, function (r) {
        if (r.getAttribute('data-view') === 'links') mountLinks(r, data);
        else mountToolkit(r, data);
      });
    }).catch(function () {
      [].forEach.call(roots, function (r) {
        r.innerHTML = '<div class="tk-wrap"><p class="tk-follow">De tools laden nu even niet. Ververs de pagina over een minuutje, of <a href="' + LINKS.instagram + '" target="_blank" rel="noopener">stuur me een DM</a>.</p></div>';
      });
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();

/*
 * EdGPT Toolkit embed.
 * Squarespace-codeblok:  <div class="edgpt-toolkit" data-view="toolkit"></div>
 *                        <script src="https://mowelan.github.io/edgpt-toolkit/embed.js" defer></script>
 * data-view: "toolkit" (www.ed-gpt.nl/tools: overzicht + tools via #slug) of "linkinbio" (www.ed-gpt.nl/linkinbio; "links" werkt ook).
 * Nieuwe goodie = regel in goodies.js plus (bij een tool) goodies/{slug}.js. Squarespace blijft ongemoeid.
 */
(function () {
  if (window.__edgptToolkit) return;
  window.__edgptToolkit = true;

  var script = document.currentScript || document.querySelector('script[src*="toolkit/embed.js"]');
  var BASE = script.src.replace(/[^\/]*(\?.*)?$/, '');
  var BUST = /[?&]tkdev/.test(location.search) ? Date.now() : Math.floor(Date.now() / 300000); // max 5 min oud; ?tkdev = altijd vers
  var SITE = 'https://www.ed-gpt.nl';
  var LINKS = {
    toolkit: SITE + '/tools',
    trainingen: SITE + '/trainingen',
    blog: SITE + '/blog',
    kennismaking: 'https://calendly.com/edvandermolen-info/30min',
    instagram: 'https://www.instagram.com/edgpt_nl/',
    tiktok: 'https://www.tiktok.com/@ed_gpt',
    linkedin: 'https://www.linkedin.com/in/edvandermolen/',
    portfolio: SITE + '/portfolio',
    contact: SITE + '/contact'
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
    return '<a class="tk-card" href="' + goodieHref(g) + '">' + (g.icon ? '<img class="tk-card-icon" src="' + BASE + g.icon + '" alt="" width="160" height="160" loading="lazy">' : '') + '<span class="tk-pill">' + esc(g.type) + '</span>' +
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
        '</div><div class="tk-feature-art' + (top.image ? ' has-image' : '') + '" aria-hidden="true">' + (top.image ? '<img src="' + BASE + top.image + '" alt="">' : (top.art || '')) + '</div></article>';
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

  /* ---------- link in bio (www.ed-gpt.nl/linkinbio): nieuwste goodie, dan twee sporen ---------- */
  var ICON = {
    instagram: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10Zm0 8.2a3.2 3.2 0 1 1 0-6.4 3.2 3.2 0 0 1 0 6.4ZM17.3 5.5a1.2 1.2 0 1 0 0 2.4 1.2 1.2 0 0 0 0-2.4ZM12 3.8c2.7 0 3 0 4 .1 2.7.1 4 1.4 4.1 4.1v8c-.1 2.7-1.4 4-4.1 4.1H8c-2.7-.1-4-1.4-4.1-4.1V8C4 5.3 5.3 4 8 3.9h4ZM12 2H7.9C4.3 2.2 2.2 4.2 2 7.9v8.2c.2 3.6 2.2 5.7 5.9 5.9h8.2c3.6-.2 5.7-2.2 5.9-5.9V7.9C21.8 4.3 19.8 2.2 16.1 2H12Z"/></svg>',
    tiktok: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M16.6 2h-3.3v13.4a2.9 2.9 0 1 1-2-2.8V9.2a6.2 6.2 0 1 0 5.3 6.2V8.6a7.6 7.6 0 0 0 4.4 1.4V6.7a4.4 4.4 0 0 1-4.4-4.4Z"/></svg>',
    linkedin: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M20.4 2H3.6C2.7 2 2 2.7 2 3.6v16.8c0 .9.7 1.6 1.6 1.6h16.8c.9 0 1.6-.7 1.6-1.6V3.6c0-.9-.7-1.6-1.6-1.6ZM8 19H5V9.5h3V19ZM6.5 8.2a1.7 1.7 0 1 1 0-3.5 1.7 1.7 0 0 1 0 3.5ZM19 19h-3v-4.6c0-1.1 0-2.5-1.5-2.5s-1.8 1.2-1.8 2.4V19h-3V9.5h2.9v1.3a3.1 3.1 0 0 1 2.8-1.5c3 0 3.6 2 3.6 4.6V19Z"/></svg>'
  };
  var LOGOS = [
    ['MediaMarkt', 'https://images.squarespace-cdn.com/content/6916e92cba58a67204dfe745/177f411c-cc6f-43a6-821d-43515020eb42/Media_Markt_logo_black.png'],
    ['Big Green Egg', 'https://images.squarespace-cdn.com/content/6916e92cba58a67204dfe745/f0f6f01f-3e70-494c-9768-969813e5bb05/Big-Green-Egg.png'],
    ['YoungCapital', 'https://images.squarespace-cdn.com/content/6916e92cba58a67204dfe745/76a54a13-a389-4091-9397-d8cdf9a7a8fd/youngcapital_black.png'],
    ['Parkeren Delft', 'https://images.squarespace-cdn.com/content/6916e92cba58a67204dfe745/1327b6b7-d258-480d-9a1f-d7dadb42bd54/ParkerenDelft-Logo.png']
  ];
  function mountLinks(root, data) {
    root.classList.add('tk-links');
    var list = data.goodies.slice().sort(function (a, b) { return a.date < b.date ? 1 : -1; });
    var top = list[0], p = data.profile || {};
    var ext = ' target="_blank" rel="noopener"';
    function toolRow(g) {
      return '<a class="tk-trow" href="' + goodieHref(g, true) + '" data-spoor="' + ((g.group || 'video') === 'team' ? 'team' : 'zelf') + '">' +
        (g.icon ? '<img src="' + BASE + g.icon + '" alt="" width="160" height="160" loading="lazy">' : '') +
        '<span class="tk-trow-b"><span class="tk-trow-t">' + esc(g.title) + '</span><span class="tk-trow-s">' + esc(g.short || g.line) + '</span></span>' +
        '<span class="tk-arr" aria-hidden="true">&rarr;</span></a>';
    }
    function social(key, label, href) {
      return '<a class="tk-soc" href="' + href + '"' + ext + ' data-spoor="zelf">' + ICON[key] + '<span>' + label + '</span></a>';
    }
    var videoTools = list.filter(function (g) { return g !== top && (g.group || 'video') === 'video'; });
    var teamTools = list.filter(function (g) { return g !== top && g.group === 'team'; });

    var h = '<div class="tk-links-in">' +
      '<header class="tk-bio-head">' +
      (p.photo ? '<img class="tk-avatar" src="' + esc(p.photo) + '" alt="Ed van der Molen" width="104" height="104">' : '') +
      '<p class="tk-bio-name">' + esc(p.name || 'Ed van der Molen') + ' <span>· EdGPT</span></p>' +
      '<h1>' + esc(p.headline || 'AI begrijpelijk maken voor de gewone mens.') + '</h1>' +
      '<p class="tk-sub">' + esc(p.tagline || '') + '</p></header>';

    if (top) {
      h += '<a class="tk-hero-card" href="' + goodieHref(top, true) + '" data-spoor="video">' + (top.image ? '<img src="' + BASE + top.image + '" alt="" width="1600" height="900">' : '') +
        '<span class="tk-hero-body"><span class="tk-pill is-new">Uit mijn nieuwste video</span><span class="tk-t">' + esc(top.title) + '</span>' +
        '<span class="tk-hero-s">' + esc(top.short || top.line) + '</span><span class="tk-hero-go">' + esc(cta(top)) + ' &rarr;</span></span></a>';
    }

    // de splitsing: twee sporen
    h += '<p class="tk-rail">Waar kom je voor?</p><nav class="tk-split" aria-label="Kies je spoor">' +
      '<a class="tk-split-c" href="#tk-zelf" data-spoor="zelf"><span class="tk-split-k">Voor jezelf</span><span class="tk-split-s">Tools en prompts uit mijn video\'s, en volgen wat ik test</span><span class="tk-arr" aria-hidden="true">&darr;</span></a>' +
      '<a class="tk-split-c is-team" href="#tk-team" data-spoor="team"><span class="tk-split-k">Voor je team</span><span class="tk-split-s">In-company AI-training, workflows en advies</span><span class="tk-arr" aria-hidden="true">&darr;</span></a>' +
      '</nav>';

    // spoor 1: voor jezelf
    h += '<section class="tk-spoor" id="tk-zelf"><h2>Voor jezelf</h2>';
    if (videoTools.length) h += '<div class="tk-tlist">' + videoTools.map(toolRow).join('') + '</div>';
    h += '<p class="tk-rail">Volg wat ik test</p>' +
      '<div class="tk-socs">' + social('instagram', 'Instagram', LINKS.instagram) + social('tiktok', 'TikTok', LINKS.tiktok) + social('linkedin', 'LinkedIn', LINKS.linkedin) + '</div>' +
      '<div class="tk-more"><a href="' + LINKS.toolkit + '" data-spoor="zelf">Alle tools</a><a href="' + LINKS.blog + '" data-spoor="zelf">Blog: wat ik test en wat werkt</a></div>' +
      '</section>';

    // spoor 2: voor je team (de salesfunnel: aanbod, bewijs, CTA)
    h += '<section class="tk-spoor tk-team" id="tk-team"><h2>Voor je team</h2>' +
      '<p class="tk-team-l">Praktische AI-trainingen voor marketing- en contentteams. Met jullie eigen werk als oefenmateriaal, zodat je het de dag erna gewoon gebruikt.</p>' +
      '<p class="tk-rail is-dark">Gewerkt voor</p><div class="tk-logos">' + LOGOS.map(function (l) {
        return '<img src="' + l[1] + '?format=300w" alt="' + esc(l[0]) + '" loading="lazy">';
      }).join('') + '</div>' +
      '<p class="tk-rail is-dark">Waarmee ik help</p><div class="tk-svc">' +
      '<a href="' + LINKS.trainingen + '" data-spoor="team"><span class="tk-svc-n">01</span><span class="tk-svc-b"><span class="tk-svc-t">In-company AI-training</span><span class="tk-svc-s">Een dagdeel of een hele dag, voor teams die met AI willen werken</span></span><span class="tk-arr" aria-hidden="true">&rarr;</span></a>' +
      '<a href="' + LINKS.portfolio + '" data-spoor="team"><span class="tk-svc-n">02</span><span class="tk-svc-b"><span class="tk-svc-t">Workflows bouwen</span><span class="tk-svc-s">Concrete AI-oplossingen voor herhalend werk</span></span><span class="tk-arr" aria-hidden="true">&rarr;</span></a>' +
      '<a href="' + LINKS.contact + '" data-spoor="team"><span class="tk-svc-n">03</span><span class="tk-svc-b"><span class="tk-svc-t">Advies en spreken</span><span class="tk-svc-s">Keynote, workshop of sparren op directieniveau</span></span><span class="tk-arr" aria-hidden="true">&rarr;</span></a>' +
      '</div>' +
      '<a class="tk-cta" href="' + LINKS.kennismaking + '"' + ext + ' data-spoor="team"><span class="tk-cta-t">Plan een kennismaking</span><span class="tk-cta-s">30 minuten, geen pitch. Jouw vraag, mijn advies.</span></a>';
    if (teamTools.length) {
      h += '<p class="tk-rail is-dark">Eerst zelf verkennen?</p><div class="tk-strip">' + teamTools.map(function (g) {
        return '<a href="' + goodieHref(g, true) + '" data-spoor="team"><img src="' + BASE + g.icon + '" alt="" width="160" height="160" loading="lazy"><span>' + esc(g.title) + '</span></a>';
      }).join('') + '</div>';
    }
    h += '</section><p class="tk-links-foot"><a href="' + SITE + '">www.ed-gpt.nl</a></p></div>';
    root.innerHTML = h;

    // ankers zelf afhandelen: de site heeft smooth scroll en een vaste header
    root.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a');
      if (!a) return;
      track('linkinbio_click', { link: (a.querySelector('.tk-t,.tk-split-k,.tk-trow-t,.tk-svc-t,.tk-cta-t,span') || a).textContent.trim().slice(0, 60), spoor: a.getAttribute('data-spoor') || '' });
      var hash = a.getAttribute('href');
      if (hash && hash.charAt(0) === '#') {
        var t = root.querySelector(hash);
        if (t) { e.preventDefault(); window.scrollTo({ top: t.getBoundingClientRect().top + window.pageYOffset - 16, behavior: 'smooth' }); }
      }
    });
  }

  /* ---------- losse pagina met eigen module en stijl (bv. www.ed-gpt.nl/adviesgesprek) ---------- */
  var PAGES = ['adviesgesprek'];
  function mountPage(root, data, name) {
    api.logos = LOGOS;
    api.css(BASE + name + '.css');
    api.js(BASE + name + '.js').then(function () {
      window.EDGPT_TOOLKIT_MODULES[name](root, data, api);
    }).catch(function () {
      root.innerHTML = '<div class="tk-wrap"><p class="tk-follow">Deze pagina laadt nu niet. Ververs de pagina over een minuutje, of <a href="' + LINKS.contact + '">stuur me een bericht</a>.</p></div>';
    });
  }

  function boot() {
    var roots = document.querySelectorAll('.edgpt-toolkit');
    if (!roots.length) return;
    [].forEach.call(roots, function (r) { r.classList.add('edtk'); r.innerHTML = '<p class="tk-loading">Even laden…</p>'; });
    loadJs(BASE + 'goodies.js?v=' + BUST).then(function () {
      var data = window.EDGPT_TOOLKIT;
      [].forEach.call(roots, function (r) {
        var view = r.getAttribute('data-view');
        if (PAGES.indexOf(view) > -1) mountPage(r, data, view);
        else if (/^(links|linkinbio)$/.test(view)) mountLinks(r, data);
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

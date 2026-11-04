/*
 * Projectenpagina (www.ed-gpt.nl/projecten).
 * Squarespace-codeblok:  <div class="edgpt-toolkit" data-view="projecten"></div> plus embed.js.
 *
 * Elk project draait in de pagina zelf: een klik op het beeld zet het spel of de app in een iframe op die plek.
 * Er draait er steeds één tegelijk (WebGL en de emulator zijn zwaar op een telefoon).
 * eigenScherm: het project opent schermvullend over de hele pagina, met een terugknop (Ed, 3 nov: Haaibert niet tussen de rest).
 * Met eigenScherm opent de link /projecten#{slug} het project meteen schermvullend (Ed, 4 nov: direct kunnen linken).
 * Nieuw project = een regel in PROJECTEN; de app zelf staat in projecten/{slug}/ of op een eigen adres (url).
 */
(function () {
  var PROJECTEN = [
    {
      slug: 'haaibert',
      titel: 'Haaibert',
      soort: '3D-game',
      tekst: [
        'Een verkeersspel dat ik voor thuis maakte, uit de verkeerslessen van groep 5 en 6. Haaibert de haai woont onder het asfalt, en Baron Toeter heeft al zijn tanden gestolen en op de kruisingen geplakt. Elk goed antwoord geeft hem een tand terug.',
        'Mijn kinderen bedachten mee wat erin moest. De vraag was dan steeds: wat doet het in het spel, en waarom?'
      ],
      feiten: ['Three.js', 'Stemmen met ElevenLabs', 'Gebouwd met Claude Code'],
      start: 'Speel Haaibert',
      noot: 'Het spel opent schermvullend. Zet je geluid aan.',
      eigenScherm: true,
      beeld: 'img/proj-haaibert.webp',
      pad: 'projecten/haaibert/'
    },
    {
      slug: 'knex-studio',
      titel: "K'NEX Studio",
      soort: '3D-bouwdoos',
      tekst: [
        "Bouwen met klassieke K'NEX in je browser: staven, verbinders, wielen en motoren, met natuurkunde erbij. Zet een windmolen in elkaar, of een rover, en zet de motor aan.",
        "De onderdelen zijn nagebouwd naar echte K'NEX-onderdelen, al blijven maten en natuurkunde een benadering. Het is een eigen project, geen officieel product van K'NEX."
      ],
      feiten: ['Three.js', 'cannon-es', 'Gebouwd met Codex'],
      start: "Open K'NEX Studio",
      noot: 'Je bouwwerken blijven in je eigen browser.',
      beeld: 'img/proj-knex.webp',
      url: 'https://ed-gpt.github.io/knex-studio/',
      bron: 'https://github.com/Ed-GPT/knex-studio'
    },
    {
      slug: 'gb-diffusion',
      titel: 'Game Boy Diffusion',
      soort: 'AI op een Game Boy',
      tekst: [
        'Een diffusion model, het soort AI achter beeldgenerators, maar dan op een Game Boy Color. Kies een categorie, druk op A, en de processor van de Game Boy tekent een krabbel uit ruis, in 16 stappen.',
        'Hier draait de echte ROM in een emulator. Op een echte Game Boy duurt één tekening zo\'n anderhalve minuut, dus op 10x snelheid gaat het wat vlotter.'
      ],
      feiten: ['1,08 miljoen parameters', '16 stappen', 'ROM van 2 MB'],
      start: 'Zet de Game Boy aan',
      noot: 'Getraind op tekeningen uit Quick, Draw! van Google (CC BY 4.0).',
      beeld: 'img/proj-gbdiff.webp',
      beeldPas: true,
      pad: 'projecten/gb-diffusion/',
      bron: 'https://github.com/Mowelan/gb-diffusion'
    }
  ];

  window.EDGPT_TOOLKIT_MODULES = window.EDGPT_TOOLKIT_MODULES || {};
  window.EDGPT_TOOLKIT_MODULES.projecten = function (root, data, api) {
    var esc = api.esc;
    function adres(p) { return p.url || api.base + p.pad; }

    var h = '<div class="tk-wrap pj">' +
      '<header class="tk-hero"><span class="tk-eyebrow">Projecten</span>' +
      '<h1>Wat ik bouw met AI.</h1>' +
      '<p class="tk-lede">Naast mijn trainingen bouw ik eigen projecten, omdat ik zelf wil weten wat er kan. Alles hieronder draait gewoon hier in je browser, zonder installatie.</p></header>';

    PROJECTEN.forEach(function (p, i) {
      h += '<article class="pj-item" id="' + p.slug + '">' +
        '<div class="pj-tekst"><span class="tk-pill">' + esc(p.soort) + '</span><h2>' + esc(p.titel) + '</h2>' +
        p.tekst.map(function (t) { return '<p>' + esc(t) + '</p>'; }).join('') +
        '<div class="pj-zij"><ul class="pj-feiten">' + p.feiten.map(function (f) { return '<li>' + esc(f) + '</li>'; }).join('') + '</ul>' +
        '<p class="pj-noot">' + esc(p.noot) + '</p>' +
        (p.bron ? '<a class="pj-link" href="' + p.bron + '" target="_blank" rel="noopener">Broncode op GitHub &rarr;</a>' : '') +
        '</div></div>' +
        '<div class="pj-stage" data-i="' + i + '">' +
        '<button class="pj-poster' + (p.beeldPas ? ' is-pas' : '') + '" type="button">' +
        '<img src="' + api.base + p.beeld + '" alt="" loading="' + (i ? 'lazy' : 'eager') + '">' +
        '<span class="pj-play"><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M8 5.5v13l10.5-6.5z"/></svg>' + esc(p.start) + '</span>' +
        '</button>' +
        '<div class="pj-balk" hidden>' +
        '<button type="button" class="pj-knop" data-doe="groot">Volledig scherm</button>' +
        '<a class="pj-knop" href="' + adres(p) + '" target="_blank" rel="noopener">Nieuw tabblad</a>' +
        '<button type="button" class="pj-knop" data-doe="stop">Stoppen</button>' +
        '</div></div></article>';
    });

    h += '<p class="pj-tools">Op zoek naar de tools uit mijn video\'s? Die staan op <a href="' + api.links.toolkit + '">de toolspagina</a>.</p>' +
      api.bridge('Ik leer marketing- en contentteams werken met AI, met hun eigen werk als oefenmateriaal. Zo gebruik je het de dag erna gewoon.') + '</div>';
    root.innerHTML = h;

    var actief = null;
    function stop(stage) {
      var f = stage.querySelector('iframe');
      if (f) f.remove();
      stage.classList.remove('is-aan');
      stage.querySelector('.pj-poster').hidden = false;
      stage.querySelector('.pj-balk').hidden = true;
      if (actief === stage) actief = null;
    }
    function start(stage) {
      if (actief && actief !== stage) stop(actief);
      var p = PROJECTEN[+stage.getAttribute('data-i')];
      var f = document.createElement('iframe');
      f.src = adres(p);
      f.title = p.titel;
      f.allow = 'autoplay; fullscreen';
      stage.insertBefore(f, stage.firstChild);
      stage.classList.add('is-aan');
      stage.querySelector('.pj-poster').hidden = true;
      stage.querySelector('.pj-balk').hidden = false;
      actief = stage;
      f.focus();
      api.track('project_start', { project: p.slug });
    }
    // Schermvullend over de hele site heen, ook op iPhone (geen Fullscreen API nodig).
    // De terugknop van de browser sluit het weer: daarvoor een eigen geschiedenisregel zonder adreswijziging.
    var los = null;
    function sluitLos() {
      if (!los) return;
      los.remove(); los = null;
      document.documentElement.classList.remove('pj-los-open');
    }
    function openLos(p) {
      if (actief) stop(actief);
      los = document.createElement('div');
      los.className = 'edtk pj-los';
      los.setAttribute('role', 'dialog');
      los.setAttribute('aria-modal', 'true');
      los.setAttribute('aria-label', p.titel);
      los.innerHTML = '<div class="pj-los-balk">' +
        '<button type="button" class="pj-los-terug"><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" d="M15 5l-7 7 7 7"/></svg>Terug naar projecten</button>' +
        '<span class="pj-los-titel">' + esc(p.titel) + '</span></div>' +
        '<iframe src="' + adres(p) + '" title="' + esc(p.titel) + '" allow="autoplay; fullscreen"></iframe>';
      document.body.appendChild(los);
      document.documentElement.classList.add('pj-los-open');
      history.pushState({ pjLos: p.slug }, '');
      los.querySelector('.pj-los-terug').addEventListener('click', function () {
        if (history.state && history.state.pjLos) history.back(); else sluitLos();
      });
      los.querySelector('iframe').focus();
      api.track('project_start', { project: p.slug });
    }
    window.addEventListener('popstate', sluitLos);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && los && history.state && history.state.pjLos) history.back(); });

    function groot(stage) {
      var req = stage.requestFullscreen || stage.webkitRequestFullscreen;
      if (req && (document.fullscreenEnabled || document.webkitFullscreenEnabled)) {
        req.call(stage);
      } else {
        // iPhone kent geen volledig scherm voor een pagina-onderdeel: dan los openen
        window.open(stage.querySelector('iframe').src, '_blank', 'noopener');
      }
    }

    root.addEventListener('click', function (e) {
      var stage = e.target.closest && e.target.closest('.pj-stage');
      if (!stage) return;
      if (e.target.closest('.pj-poster')) {
        var p = PROJECTEN[+stage.getAttribute('data-i')];
        if (p.eigenScherm) openLos(p); else start(stage);
      }
      var doe = e.target.closest('[data-doe]');
      if (doe && doe.getAttribute('data-doe') === 'stop') stop(stage);
      if (doe && doe.getAttribute('data-doe') === 'groot') groot(stage);
    });

    // direct naar een project via #slug (bv. www.ed-gpt.nl/projecten#haaibert)
    var slug = (location.hash || '').slice(1), doel = slug && root.querySelector('#' + slug.replace(/[^a-z0-9-]/gi, ''));
    // Een project met eigenScherm opent via die link meteen schermvullend; terug landt op het project in de lijst.
    if (doel) setTimeout(function () {
      window.scrollTo(0, doel.getBoundingClientRect().top + window.pageYOffset - 90);
      var p = PROJECTEN.filter(function (x) { return x.slug === doel.id; })[0];
      if (p && p.eigenScherm) openLos(p);
    }, 50);
  };
})();

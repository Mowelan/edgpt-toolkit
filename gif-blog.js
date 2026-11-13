/*
 * Blog www.ed-gpt.nl/gif (13-11-2026): bestemming van "Comment GIF" uit de gifjes-short.
 * Rendert het hele artikel: wat je nodig hebt, prompt 1 (jezelf in een nieuw gifje), prompt 2 (bekend gifje nadoen,
 * met de frames-tool uit gif-raster.js), doorpraten, part 2 en het verkoopblok (adviesgesprek, trainingen, volgen).
 *
 * Squarespace-codeblok (twee regels):
 *   <div class="edgpt-gif-blog"></div>
 *   <script src="https://mowelan.github.io/edgpt-toolkit/gif-blog.js" defer></script>
 *
 * Werkende recepten, getest door Ed op 13-11-2026:
 *  - foto + prompt 1  -> gifje (video)
 *  - 9 losse frames van een bekend gifje + foto + Eds zin -> gifje; één rasterplaat werkt NIET (ChatGPT gaat dan met code plakken)
 */
(function () {
  'use strict';
  if (window.__edgptGifBlog) return; window.__edgptGifBlog = true;
  var me = document.currentScript || document.querySelector('script[src*="gif-blog.js"]');
  var BASE = me.src.replace(/[^\/]*(\?.*)?$/, '');
  var BUST = /[?&]tkdev/.test(location.search) ? Date.now() : Math.floor(Date.now() / 300000);
  var SITE = 'https://www.ed-gpt.nl';
  var L = { trainingen: SITE + '/trainingen', advies: SITE + '/adviesgesprek', tiktok: 'https://www.tiktok.com/@ed_gpt', instagram: 'https://www.instagram.com/edgpt_nl/' };

  var P1 = 'Gebruik deze referentiefoto om een gif te maken van mij, waarbij ik sneaky om het hoekje kom kijken en door een verrekijker kijk.';
  // prompt voor de frames staat in de tool zelf (gif-raster.js, promptText)
  var P3 = 'Maak een gifje van mij op basis van deze referentie-image. De tweede foto ben ik. Vervang de persoon door mij. In het gifje gebeurt dit: [beschrijf kort de beweging, bijvoorbeeld: hij lacht, kijkt opzij en zwaait].';

  var CSS = '' +
    '.gb{--ink:#1A1A1A;--ink70:#4A4A4A;--ink50:#7A7A7A;--y:#FFD02F;--yt:#FFF4CC;--paper:#F2EEE4;--line:rgba(26,26,26,.12);font-family:"Raleway",system-ui,sans-serif;color:var(--ink);font-size:19px;line-height:1.7;}' +
    '.gb *{box-sizing:border-box;}.gb [hidden]{display:none!important;}' +
    '.gb p{margin:0 0 18px;}' +
    '.gb h2{font-family:"Space Grotesk",sans-serif;font-size:clamp(26px,3vw,34px);letter-spacing:-.03em;line-height:1.15;margin:48px 0 14px;}' +
    '.gb .gb-h3{font:700 21px/1.25 "Space Grotesk",sans-serif;letter-spacing:-.02em;margin:28px 0 8px;}' +
    '.gb .lead{font-size:21px;line-height:1.6;color:var(--ink70);}' +
    '.gb .k{font:600 12px "Raleway",sans-serif;letter-spacing:.18em;text-transform:uppercase;color:var(--ink50);display:block;margin-bottom:6px;}' +
    '.gb-nodig{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:8px 0 10px;}' +
    '.gb-nodig div{background:#fff;border:1px solid var(--line);border-radius:18px;padding:18px 20px;font-size:16px;line-height:1.55;}' +
    '.gb-nodig b{display:block;font:700 18px "Space Grotesk",sans-serif;margin-bottom:4px;}' +
    '.gb-prompt{background:#fff;border:1px solid var(--line);border-radius:18px;padding:18px 20px;margin:12px 0 22px;}' +
    '.gb-prompt p{font:16px/1.6 "JetBrains Mono",ui-monospace,monospace;margin:0 0 14px;}' +
    '.gb-kopie{font:700 15px "Raleway",sans-serif;min-height:46px;padding:0 20px;border-radius:999px;border:0;background:var(--ink);color:var(--y);cursor:pointer;}' +
    '.gb-kopie.ok{background:var(--y);color:var(--ink);}' +
    '.gb-kopie:focus-visible,.gb a:focus-visible{outline:3px solid #2563eb;outline-offset:3px;}' +
    '.gb figure{margin:18px 0 26px;}.gb figure img{width:100%;max-width:520px;height:auto;display:block;border-radius:18px;}' +
    '.gb figcaption{font-size:14px;color:var(--ink50);margin-top:8px;}' +
    '.gb-stappen{counter-reset:s;list-style:none;padding:0;margin:8px 0 6px;}' +
    '.gb-stappen li{counter-increment:s;position:relative;padding-left:46px;margin-bottom:12px;}' +
    '.gb-stappen li::before{content:counter(s);position:absolute;left:0;top:1px;width:32px;height:32px;border-radius:50%;background:var(--y);font:700 15px "Space Grotesk",sans-serif;display:flex;align-items:center;justify-content:center;}' +
    '.gb-tip{background:var(--paper);border-radius:16px;padding:14px 18px;font-size:16px;line-height:1.55;margin:4px 0 22px;}' +
    '.gb-verkoop{background:var(--y);border-radius:24px;padding:clamp(22px,4vw,36px);margin:52px 0 10px;}' +
    '.gb-verkoop h3{font:700 clamp(23px,3vw,30px)/1.15 "Space Grotesk",sans-serif;letter-spacing:-.02em;margin:4px 0 10px;}' +
    '.gb-verkoop .k{color:var(--ink);}' +
    '.gb-advies{display:flex;align-items:center;gap:14px;background:#fff;border-radius:18px;padding:16px 18px;text-decoration:none;color:var(--ink);margin-bottom:18px;}' +
    '.gb-advies .g{font:700 11px "Raleway",sans-serif;letter-spacing:.14em;text-transform:uppercase;background:var(--ink);color:var(--y);border-radius:999px;padding:5px 10px;flex:none;}' +
    '.gb-advies b{display:block;font:700 18px "Space Grotesk",sans-serif;}.gb-advies small{display:block;font-size:14px;color:var(--ink70);line-height:1.4;}' +
    '.gb-advies .pijl{margin-left:auto;font:700 22px "Space Grotesk",sans-serif;}' +
    '.gb-knop{display:inline-flex;align-items:center;justify-content:center;min-height:54px;padding:0 26px;border-radius:999px;background:var(--ink);color:var(--y)!important;font:700 16px "Raleway",sans-serif;text-decoration:none!important;}' +
    '.gb-volg{display:flex;flex-wrap:wrap;align-items:center;gap:10px;margin-top:22px;font-weight:600;font-size:16px;}' +
    '.gb-volg a{display:inline-flex;align-items:center;min-height:44px;padding:0 16px;border-radius:999px;border:1.5px solid var(--ink);color:var(--ink)!important;text-decoration:none!important;}' +
    '@media(max-width:640px){.gb{font-size:18px}.gb-nodig{grid-template-columns:1fr}.gb-knop{width:100%}}';

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function prompt(label, txt) { return '<div class="gb-prompt"><span class="k">' + esc(label) + '</span><p>' + esc(txt) + '</p><button type="button" class="gb-kopie">Kopieer prompt</button></div>'; }

  function render(root) {
    if (!document.getElementById('gb-css')) { var st = document.createElement('style'); st.id = 'gb-css'; st.textContent = CSS; document.head.appendChild(st); }
    root.innerHTML = '<article class="gb">' +
      '<p class="lead">Je zag mijn video en je wilt jezelf ook in een gifje zetten. Hieronder staan mijn prompts, met een knop om ze te kopiëren, en een tool om jezelf in een bekend gifje te zetten.</p>' +

      '<h2>Wat je nodig hebt</h2>' +
      '<div class="gb-nodig"><div><b>ChatGPT</b>Volgens OpenAI zit Images 2.6 sinds 4 november 2026 in alle abonnementen, ook gratis, op web, desktop en mobiel. De gif-functie wordt in stapjes uitgerold: zie je hem nog niet, dan zit je account er nog niet bij.</div>' +
      '<div><b>Een foto van jezelf</b>Een duidelijke foto waarop je gezicht goed te zien is. Die stuur je mee met de prompt, in de app via het plusje.</div></div>' +

      '<h2>Jezelf in een nieuw gifje</h2>' +
      '<p>Dit is de prompt uit de video. Stuur je foto mee en verander de actie aan het eind in wat jij wilt zien.</p>' +
      prompt('Met je foto erbij', P1) +
      '<figure><img src="' + BASE + 'img/gif-jezelf.webp" alt="ChatGPT met mijn referentiefoto en prompt, en als resultaat een gifje waarin ik met een verrekijker om het hoekje kijk" width="1080" height="1350" loading="lazy"><figcaption>Mijn eigen prompt en resultaat in ChatGPT.</figcaption></figure>' +

      '<h2>Jezelf in een bekend gifje</h2>' +
      '<p>Hier zit een addertje. Als je een gifje uploadt, ziet ChatGPT alleen één stilstaand plaatje en weet hij niet hoe het beweegt. Er zijn twee manieren om dat op te lossen.</p>' +
      '<h3 class="gb-h3">Snel: één screenshot en een beschrijving</h3>' +
      '<p>Maak een screenshot van het gifje op het mooiste moment. Stuur die mee met een foto van jezelf, en beschrijf in de prompt kort wat er in het gifje gebeurt.</p>' +
      prompt('Met de screenshot en je foto erbij', P3) +
      '<h3 class="gb-h3">Beste resultaat: de losse frames</h3>' +
      '<p>Wil je dat het echt op het origineel lijkt, geef ChatGPT dan de losse frames van het gifje. Deze tool haalt ze er voor je uit, in je eigen browser. Op de computer gaat dit het makkelijkst: download de frames en sleep ze samen met je foto in ChatGPT.</p>' +
      '<div class="edgpt-gif-raster" data-kort></div>' +
      '<div class="gb-tip"><strong>Tip voor je telefoon:</strong> een gifje uit WhatsApp staat op je iPhone vaak als korte video. Die kun je ook gewoon in de tool zetten.</div>' +

      '<h2>Daarna gewoon doorpraten</h2>' +
      '<p>Als je gifje er staat, kan je er gewoon op doorgaan. In de video deed ik er roze lasers bij en zette ik hem sneller. Snelheid kan ook via het knopje op je gifje, van 0,5x tot 2x.</p>' +
      prompt('Iets toevoegen', 'Doe er roze lasers bij.') + prompt('Sneller', 'Maak hem twee keer zo snel.') +

      '<h2>Part 2: je gifje online zetten</h2>' +
      '<p>In part 2 laat ik zien hoe je je gifje online zet, zodat iedereen hem kan vinden. Die komt hier te staan zodra hij er is.</p>' +

      '<section class="gb-verkoop" aria-label="Voor je team">' +
      '<a class="gb-advies" href="' + L.advies + '"><span class="g">Gratis</span><span><b>AI-adviesgesprek</b><small>30 minuten online, geen pitch. Jouw vraag, mijn advies.</small></span><span class="pijl" aria-hidden="true">→</span></a>' +
      '<span class="k">Voor je team</span><h3>Wil je dat je team zo met AI werkt?</h3>' +
      '<p>Ik geef praktische AI-trainingen voor marketing- en contentteams, met jullie eigen werk als oefenmateriaal.</p>' +
      '<a class="gb-knop" href="' + L.trainingen + '">Bekijk de trainingen</a>' +
      '<div class="gb-volg">Part 2 niet missen? <a href="' + L.tiktok + '" target="_blank" rel="noopener">TikTok</a><a href="' + L.instagram + '" target="_blank" rel="noopener">Instagram</a></div>' +
      '</section></article>';

    root.querySelectorAll('.gb-kopie').forEach(function (b) {
      b.addEventListener('click', function () {
        var t = b.parentNode.querySelector('p').textContent;
        function ok() { b.textContent = 'Gekopieerd'; b.classList.add('ok'); setTimeout(function () { b.textContent = 'Kopieer prompt'; b.classList.remove('ok'); }, 1800); }
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(ok, function () {});
      });
    });
    // de frames-tool
    if (window.EDGPT_GIF_RASTER) window.EDGPT_GIF_RASTER.mount(root.querySelector('.edgpt-gif-raster'));
    else { var s = document.createElement('script'); s.src = BASE + 'gif-raster.js?v=' + BUST; document.head.appendChild(s); }
  }

  function init() { Array.prototype.forEach.call(document.querySelectorAll('.edgpt-gif-blog'), render); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();

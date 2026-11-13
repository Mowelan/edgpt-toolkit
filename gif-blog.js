/*
 * Blog www.ed-gpt.nl/gif (13-11-2026): bestemming van "Comment GIF" uit de gifjes-short.
 * Rendert het hele artikel: wat je nodig hebt, prompt 1 (jezelf in een nieuw gifje), prompt 2 (bekend gifje nadoen,
 * met de frames-tool uit gif-raster.js), doorpraten, part 2 en het verkoopblok (adviesgesprek, trainingen, volgen).
 *
 * v2 (13-11-2026, Ed: "mag wat sexier, meer animatie, geen zwarte knoppen, een flex"):
 *  - donkere hero met een groepsapp waarin Eds echte ChatGPT-gifjes binnenkomen (img/gifjes/*.mp4)
 *  - parallax op de gifjes, gele ticker die meebuigt met je scrollsnelheid, leesvoortgang bovenin
 *  - koppen woord voor woord, secties schuiven binnen, prompts typen zichzelf in, confetti bij kopiëren
 *  - het heg-gifje speelt frame voor frame af terwijl je scrolt (img/gifjes/heg-frames.jpg, 9 frames naast elkaar)
 *  - prefers-reduced-motion: alles staat meteen stil en leesbaar
 * Vorige versie: workspace/runs/run-20261113-133500-gif-pagina-flex/v1-origineel/
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
  var IMG = BASE + 'img/gifjes/';
  var SITE = 'https://www.ed-gpt.nl';
  var L = { trainingen: SITE + '/trainingen', advies: SITE + '/adviesgesprek', tiktok: 'https://www.tiktok.com/@ed_gpt', instagram: 'https://www.instagram.com/edgpt_nl/' };
  var STIL = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  var P1 = 'Gebruik deze referentiefoto om een gif te maken van mij, waarbij ik sneaky om het hoekje kom kijken en door een verrekijker kijk.';
  // prompt voor de frames staat in de tool zelf (gif-raster.js, promptText)
  var P3 = 'Maak een gifje van mij op basis van deze referentie-image. De tweede foto ben ik. Vervang de persoon door mij. In het gifje gebeurt dit: [beschrijf kort de beweging, bijvoorbeeld: hij lacht, kijkt opzij en zwaait].';

  // De groepsapp in de hero. g = gifje van Ed (img/gifjes/{g}.mp4), t = bericht van een ander.
  var CHAT = [
    { t: 'Wie komt er vrijdag?', van: 'Sanne' },
    { g: 'verrekijker', r: 478 / 357 },
    { t: 'hahaha nee', van: 'Joost' },
    { g: 'toost', r: 550 / 309 },
    { t: 'Ed. Stop.', van: 'Sanne' },
    { g: 'heg', r: 426 / 402 },
    { t: 'ik leg mijn telefoon weg', van: 'Joost' }
  ];
  var TICKER = ['sneaky om het hoekje', 'door een verrekijker', 'proosten met champagne', 'verdwijnen in de heg', 'roze lasers erbij', 'twee keer zo snel'];
  var HEG_FRAMES = 9;

  var CSS = '' +
    '.fluid-engine:has(.edgpt-gif-blog){grid-template-rows:repeat(8,minmax(0,auto))!important;row-gap:0!important}' +
    '.fluid-engine:has(.edgpt-gif-blog) .fe-block:has(.edgpt-gif-blog){grid-row:1/-1!important;grid-column:1/-1!important}' +
    '.edgpt-gif-blog{max-width:1180px;margin:0 auto;padding:0 0 40px;}' +
    'body:has(.edgpt-gif-blog){overflow-x:clip;}' +
    '.gb{--ink:#1A1A1A;--ink70:#4A4A4A;--ink50:#7A7A7A;--y:#FFD02F;--yt:#FFF4CC;--paper:#F2EEE4;--line:rgba(26,26,26,.12);--ease:cubic-bezier(.2,.8,.2,1);--spring:cubic-bezier(.34,1.56,.64,1);font-family:"Raleway",system-ui,sans-serif;color:var(--ink);font-size:19px;line-height:1.7;}' +
    '.gb *{box-sizing:border-box;}.gb [hidden]{display:none!important;}' +
    '.gb p{margin:0 0 18px;}' +
    '.gb a:focus-visible,.gb button:focus-visible{outline:3px solid #2563eb;outline-offset:3px;}' +

    /* leesvoortgang */
    '.gb-prog{position:fixed;left:0;top:0;height:4px;width:100%;background:var(--y);transform-origin:0 50%;transform:scaleX(0);z-index:9999;pointer-events:none;}' +

    /* knoppen: geel met harde schaduw, ingedrukt bij klikken */
    '.gb-btn{position:relative;display:inline-flex;align-items:center;justify-content:center;gap:10px;min-height:54px;padding:0 28px;border-radius:999px;border:0;background:var(--y);color:var(--ink)!important;font:600 16px "Raleway",sans-serif;letter-spacing:.01em;text-decoration:none!important;cursor:pointer;transition:transform .3s var(--ease),box-shadow .3s var(--ease),background .2s;}' +
    '.gb-btn:hover{transform:translateY(-2px);box-shadow:0 12px 28px -10px rgba(26,26,26,.35);}' +
    '.gb-btn:active{transform:scale(.97);box-shadow:none;transition-duration:.08s;}' +
    '.gb-btn svg{width:20px;height:20px;flex:none;transition:transform .25s var(--ease);}' +
    '.gb-btn:hover svg.pijl{transform:translateX(4px);}' +
    '.gb-btn.op-donker:hover{box-shadow:0 12px 32px -8px rgba(255,208,47,.45);}' +
    '.gb-btn.leeg{background:transparent;color:var(--ink)!important;box-shadow:inset 0 0 0 1px rgba(26,26,26,.18);}' +
    '.gb-btn.leeg:hover{background:#fff;box-shadow:inset 0 0 0 1px rgba(26,26,26,.28),0 12px 28px -14px rgba(26,26,26,.3);}' +

    /* hero */
    '.gb-hero{position:relative;width:100vw;margin-left:calc(50% - 50vw);background:transparent;color:var(--ink);padding:clamp(40px,7vw,104px) max(20px,calc((100vw - 1180px) / 2)) clamp(28px,4vw,56px);display:grid;grid-template-columns:1.05fr .95fr;gap:clamp(24px,4vw,56px);align-items:center;overflow:hidden;isolation:isolate;}' +
    '.gb-hero::before{content:"";position:absolute;inset:0;background-image:radial-gradient(rgba(26,26,26,.1) 1px,transparent 1.5px);background-size:24px 24px;z-index:-1;-webkit-mask-image:radial-gradient(ellipse at 70% 40%,#000,transparent 70%);mask-image:radial-gradient(ellipse at 70% 40%,#000,transparent 70%);transform:translateY(var(--py,0px));}' +
    '.gb-kicker{display:inline-flex;align-items:center;gap:8px;font:700 13px "Raleway",sans-serif;letter-spacing:.04em;color:var(--ink);background:var(--y);border-radius:999px;padding:6px 14px 6px 10px;}' +
    '.gb-kicker i{width:8px;height:8px;border-radius:50%;background:#e5484d;display:block;animation:gb-rec 1.4s infinite;}' +
    '@keyframes gb-rec{50%{opacity:.25}}' +
    '.gb h1{font:700 clamp(40px,6.4vw,84px)/.98 "Space Grotesk",sans-serif;letter-spacing:-.045em;margin:22px 0 22px;color:var(--ink);}' +
    '.gb-w{display:inline-block;overflow:hidden;vertical-align:top;padding-bottom:.08em;margin-bottom:-.08em;}' +
    '.gb-w>span{display:inline-block;transform:translateY(105%);transition:transform .9s var(--ease);}' +
    '.is-in .gb-w>span{transform:none;}' +
    '.gb-mark{position:relative;color:var(--ink);z-index:0;}' +
    '.gb-mark::before{content:"";position:absolute;left:-.08em;right:-.08em;top:.12em;bottom:.02em;background:var(--y);border-radius:.12em;z-index:-1;transform:scaleX(0) rotate(-1.5deg);transform-origin:0 50%;transition:transform .7s var(--ease) .9s;}' +
    '.is-in .gb-mark::before{transform:scaleX(1) rotate(-1.5deg);}' +
    '.gb-hero .lead{font-size:clamp(18px,1.6vw,21px);line-height:1.6;color:var(--ink70);max-width:34ch;margin-bottom:20px;}' +
    '.gb-cta{display:flex;flex-wrap:wrap;gap:14px;}' +
    '.gb-let{display:flex;gap:12px;align-items:flex-start;max-width:46ch;background:#FDECEC;color:#7F1D1D;border:1px solid rgba(220,38,38,.25);border-left:4px solid #DC2626;border-radius:14px;padding:14px 16px;margin:0 0 28px;font-size:16px;line-height:1.5;box-shadow:0 18px 40px -28px rgba(127,29,29,.35);}' +
    '.gb-let svg{width:20px;height:20px;flex:none;margin-top:2px;color:#DC2626;}' +
    '.gb-let b{font-weight:700;color:#B91C1C;}' +
    '.gb-fade{opacity:0;transform:translateY(18px);transition:opacity .8s var(--ease),transform .8s var(--ease);}' +
    '.is-in .gb-fade{opacity:1;transform:none;}' +

    /* groepsapp */
    '.gb-stage{position:relative;height:clamp(440px,46vw,560px);}' +
    '.gb-chat{position:absolute;inset:0 6% 0 6%;background:#fff;border:1px solid var(--line);border-radius:30px;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 1px 2px rgba(26,26,26,.04),0 50px 90px -40px rgba(26,26,26,.38);transform:translateY(var(--py,0px)) rotate(0deg);}' +
    '.gb-chat-kop{display:flex;align-items:center;gap:12px;padding:16px 18px;border-bottom:1px solid var(--line);font-size:15px;}' +
    '.gb-chat-kop b{display:block;font:700 16px "Space Grotesk",sans-serif;color:var(--ink);}.gb-chat-kop small{color:var(--ink50);font-size:13px;}' +
    '.gb-ava{width:38px;height:38px;border-radius:50%;background:var(--y);color:var(--ink);display:flex;align-items:center;justify-content:center;font:700 15px "Space Grotesk",sans-serif;flex:none;}' +
    '.gb-msgs{flex:1;display:flex;flex-direction:column;justify-content:flex-end;gap:10px;padding:16px;overflow:hidden;}' +
    '.gb-msg{max-width:78%;transform-origin:0 100%;animation:gb-pop .55s var(--spring) both;}' +
    '.gb-msg.ed{align-self:flex-end;transform-origin:100% 100%;}' +
    '.gb-msg.weg{animation:gb-weg .35s var(--ease) both;}' +
    '@keyframes gb-pop{from{opacity:0;transform:translateY(16px) scale(.6)}to{opacity:1;transform:none}}' +
    '@keyframes gb-weg{to{opacity:0;transform:translateY(-12px) scale(.9);margin-top:-40px}}' +
    '.gb-msg .tx{background:#F1EEE7;color:var(--ink);border-radius:18px 18px 18px 6px;padding:9px 14px;font-size:15px;line-height:1.4;}' +
    '.gb-msg .tx small{display:block;font:700 12px "Raleway",sans-serif;color:var(--ink50);margin-bottom:1px;}' +
    '.gb-msg .gf{position:relative;border-radius:20px 20px 6px 20px;overflow:hidden;background:#222;width:min(240px,52vw);}' +
    '.gb-msg .gf video{display:block;width:100%;height:auto;}' +
    '.gb-msg .gf span{position:absolute;left:8px;bottom:8px;font:700 11px "Raleway",sans-serif;letter-spacing:.06em;background:rgba(0,0,0,.6);color:#fff;border-radius:6px;padding:2px 6px;}' +
    '.gb-typ{align-self:flex-start;background:#F1EEE7;border-radius:18px;padding:12px 14px;display:flex;gap:5px;animation:gb-pop .4s var(--spring) both;}' +
    '.gb-typ i{width:7px;height:7px;border-radius:50%;background:rgba(26,26,26,.4);animation:gb-dot 1s infinite;}' +
    '.gb-typ i:nth-child(2){animation-delay:.15s}.gb-typ i:nth-child(3){animation-delay:.3s}' +
    '@keyframes gb-dot{0%,60%,100%{transform:none;opacity:.5}30%{transform:translateY(-4px);opacity:1}}' +
    '.gb-sticker{position:absolute;width:clamp(96px,11vw,140px);border-radius:18px;overflow:hidden;box-shadow:0 30px 60px -24px rgba(26,26,26,.45),0 0 0 1px rgba(26,26,26,.06);z-index:2;}' +
    '.gb-sticker video{display:block;width:100%;height:auto;}' +
    '.gb-sticker.s1{left:-2%;bottom:8%;transform:translateY(var(--py,0px)) rotate(-4deg);}' +
    '.gb-sticker.s2{right:-3%;top:6%;transform:translateY(var(--py,0px)) rotate(4deg);}' +

    /* ticker */
    '.gb-ticker{width:100vw;margin-left:calc(50% - 50vw);margin-top:0;position:relative;border-block:1px solid var(--line);padding:16px 0!important;background:transparent;padding:6px 0;overflow:hidden;-webkit-mask-image:linear-gradient(90deg,transparent,#000 8%,#000 92%,transparent);mask-image:linear-gradient(90deg,transparent,#000 8%,#000 92%,transparent);}' +
    '.gb-ticker-in{display:flex;width:max-content;transform:skewX(var(--skew,0deg));}' +
    '.gb-ticker-rij{display:flex;flex:none;gap:28px;padding-right:28px;animation:gb-tick 30s linear infinite;font:500 clamp(18px,2vw,24px)/1 "Space Grotesk",sans-serif;letter-spacing:-.02em;white-space:nowrap;color:var(--ink70);}' +
    '.gb-ticker-rij span::after{content:"";display:inline-block;width:6px;height:6px;border-radius:50%;background:var(--y);margin-left:28px;vertical-align:.25em;}' +
    '@keyframes gb-tick{to{transform:translateX(-100%)}}' +

    /* artikel */
    '.gb-body{max-width:780px;margin:0 auto;padding:clamp(48px,7vw,96px) 16px 0;}' +
    '.gb-sec{position:relative;margin-bottom:clamp(56px,8vw,96px);}' +
    '.gb-num{position:absolute;right:calc(100% + 36px);top:6px;font:500 13px/1 "JetBrains Mono",ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.08em;color:var(--ink50);display:flex;align-items:center;gap:10px;transform:translateY(var(--py,0px));}' +
    '.gb-num::after{content:"";width:40px;height:1px;background:var(--ink50);opacity:.5;}' +
    '.gb h2{font:700 clamp(30px,4vw,46px)/1.05 "Space Grotesk",sans-serif;letter-spacing:-.035em;margin:0 0 18px;}' +
    '.gb .gb-h3{font:700 22px/1.25 "Space Grotesk",sans-serif;letter-spacing:-.02em;margin:34px 0 8px;display:flex;align-items:center;gap:10px;}' +
    '.gb .gb-h3 em{font:600 12px "Raleway",sans-serif;font-style:normal;letter-spacing:.04em;background:var(--yt);color:var(--ink);border-radius:999px;padding:4px 10px;}' +
    '.gb .k{font:700 12px "Raleway",sans-serif;letter-spacing:.06em;color:var(--ink70);display:block;margin-bottom:6px;}' +
    '.gb-rv{opacity:0;transform:translateY(40px);transition:opacity .9s var(--ease),transform .9s var(--ease);}' +
    '.gb-rv.is-in{opacity:1;transform:none;}' +
    '.gb-sec h2 .gb-w>span{transition-duration:.8s;}' +

    '.gb-nodig{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin:10px 0;}' +
    '.gb-nodig>div{background:#fff;border:1px solid var(--line);border-radius:24px;padding:24px;font-size:16px;line-height:1.55;box-shadow:0 1px 2px rgba(26,26,26,.04);transition:transform .4s var(--ease),box-shadow .4s var(--ease);}' +
    '.gb-nodig>div:hover{transform:translateY(-4px);box-shadow:0 24px 48px -24px rgba(26,26,26,.25);}' +
    '.gb-nodig .ic{width:44px;height:44px;border-radius:12px;background:var(--yt);display:flex;align-items:center;justify-content:center;margin-bottom:14px;}' +
    '.gb-nodig .ic svg{width:22px;height:22px;}' +
    '.gb-nodig b{display:block;font:700 20px "Space Grotesk",sans-serif;margin-bottom:4px;}' +

    /* prompt als invoerveld */
    '.gb-prompt{position:relative;background:#fff;border:1px solid var(--line);border-radius:26px;padding:22px 22px 16px;margin:16px 0 26px;box-shadow:0 1px 2px rgba(26,26,26,.04),0 20px 44px -28px rgba(26,26,26,.28);transition:box-shadow .4s var(--ease);}' +
    '.gb-prompt:hover{box-shadow:0 1px 2px rgba(26,26,26,.04),0 28px 56px -28px rgba(26,26,26,.34);}' +
    '.gb-prompt p{font:16px/1.6 "JetBrains Mono",ui-monospace,SFMono-Regular,Menlo,monospace;margin:0 0 16px;min-height:3.2em;}' +
    '.gb-prompt p .car{display:inline-block;width:.55em;height:1.1em;background:var(--ink);vertical-align:-.18em;margin-left:2px;animation:gb-rec 1s steps(1) infinite;}' +
    '.gb-prompt .rij{display:flex;align-items:center;gap:12px;}' +
    '.gb-prompt .plus{width:40px;height:40px;border-radius:50%;border:1.5px solid var(--line);display:flex;align-items:center;justify-content:center;color:var(--ink50);flex:none;}' +
    '.gb-prompt .plus svg{width:18px;height:18px;}' +
    '.gb-prompt .rij small{font-size:14px;color:var(--ink50);line-height:1.35;}' +
    '.gb-kopie{margin-left:auto;min-height:44px;font-size:15px;padding:0 18px;}' +
    '.gb-kopie.ok{background:var(--ink);color:var(--y)!important;}' +
    '.gb-confetti{position:fixed;width:7px;height:7px;pointer-events:none;z-index:9999;border-radius:50%;}' +

    '.gb figure{margin:26px 0 30px;}' +
    '.gb figure img{width:100%;max-width:520px;height:auto;display:block;border-radius:24px;box-shadow:0 40px 80px -40px rgba(26,26,26,.5);}' +
    '.gb figure.gb-rv{transform:translateY(70px) scale(.94);}.gb figure.gb-rv.is-in{transform:none;}' +
    '.gb figcaption{font-size:14px;color:var(--ink50);margin-top:16px;}' +

    /* scroll = afspelen */
    '.gb-scrub{background:var(--ink);border-radius:28px;padding:clamp(16px,3vw,26px);margin:22px 0 10px;color:#fff;}' +
    '.gb-scrub-groot{position:relative;aspect-ratio:478/357;border-radius:18px;overflow:hidden;background-color:#222;background-size:900% 100%;background-repeat:no-repeat;}' +
    '.gb-scrub-groot span{position:absolute;right:10px;top:10px;font:700 13px "Space Grotesk",sans-serif;background:var(--y);color:var(--ink);border-radius:8px;padding:3px 9px;}' +
    '.gb-film{display:grid;grid-template-columns:repeat(9,1fr);gap:6px;margin-top:10px;}' +
    '.gb-film i{display:block;aspect-ratio:478/357;border-radius:6px;background-color:#222;background-size:900% 100%;background-repeat:no-repeat;opacity:.35;transition:opacity .2s,transform .25s var(--spring),outline-color .2s;outline:2px solid transparent;outline-offset:1px;}' +
    '.gb-film i.nu{opacity:1;transform:translateY(-4px);outline-color:var(--y);}' +
    '.gb-scrub p{font-size:15px;line-height:1.5;color:rgba(255,255,255,.7);margin:14px 2px 2px;}' +
    '.gb-scrub p b{color:var(--y);}' +

    '.gb-tip{display:flex;gap:14px;background:var(--yt);border-radius:18px;padding:16px 18px;font-size:16px;line-height:1.55;margin:4px 0 22px;}' +
    '.gb-tip svg{width:22px;height:22px;flex:none;margin-top:2px;}' +
    '.gb-part2{display:flex;gap:18px;align-items:center;background:var(--paper);border-radius:24px;padding:22px 24px;}' +
    '.gb-part2 .ic{width:54px;height:54px;border-radius:50%;background:var(--ink);color:var(--y);display:flex;align-items:center;justify-content:center;flex:none;animation:gb-puls 2.4s var(--ease) infinite;}' +
    '.gb-part2 .ic svg{width:24px;height:24px;}' +
    '@keyframes gb-puls{0%{box-shadow:0 0 0 0 rgba(255,208,47,.9)}70%{box-shadow:0 0 0 16px rgba(255,208,47,0)}100%{box-shadow:0 0 0 0 rgba(255,208,47,0)}}' +
    '.gb-part2 p{margin:0;font-size:17px;}' +

    /* verkoop */
    '.gb-verkoop{position:relative;background:var(--y);border-radius:32px;padding:clamp(24px,4vw,48px);margin:20px 0 10px;}' +
    '.gb-verkoop.gb-rv{transform:translateY(60px) scale(.96);}.gb-verkoop.gb-rv.is-in{transform:none;}' +
    '.gb-verkoop h3{font:700 clamp(26px,3.4vw,38px)/1.08 "Space Grotesk",sans-serif;letter-spacing:-.03em;margin:4px 0 12px;}' +
    '.gb-verkoop .k{color:var(--ink);}' +
    '.gb-advies{display:flex;align-items:center;gap:14px;background:#fff;border-radius:20px;padding:16px 18px;text-decoration:none!important;color:var(--ink)!important;margin-bottom:26px;transition:transform .2s var(--ease),box-shadow .2s var(--ease);}' +
    '.gb-advies:hover{transform:translateY(-2px);box-shadow:0 18px 36px -18px rgba(26,26,26,.35);}' +
    '.gb-advies .g{font:700 12px "Raleway",sans-serif;letter-spacing:.04em;background:var(--ink);color:var(--y);border-radius:999px;padding:5px 11px;flex:none;}' +
    '.gb-advies b{display:block;font:700 19px "Space Grotesk",sans-serif;}.gb-advies small{display:block;font-size:14px;color:var(--ink70);line-height:1.4;}' +
    '.gb-advies svg{margin-left:auto;width:24px;height:24px;flex:none;transition:transform .25s var(--ease);}' +
    '.gb-advies:hover svg{transform:translateX(5px);}' +
    '.gb-verkoop .gb-btn{background:#fff;color:var(--ink)!important;}' +
    '.gb-volg{display:flex;flex-wrap:wrap;align-items:center;gap:10px;margin-top:26px;font-weight:700;font-size:16px;}' +
    '.gb-volg a{display:inline-flex;align-items:center;gap:8px;min-height:44px;padding:0 18px;border-radius:999px;background:rgba(255,255,255,.55);color:var(--ink)!important;text-decoration:none!important;transition:transform .2s var(--ease),box-shadow .2s var(--ease);}' +
    '.gb-volg a:hover{background:#fff;transform:translateY(-2px);}' +
    '.gb-volg svg{width:18px;height:18px;}' +

    '@media(max-width:1100px){.gb-num{position:static;margin-bottom:14px;transform:none;}}' +
    '@media(max-width:860px){.gb-hero{grid-template-columns:1fr;}.gb-stage{height:440px;}.gb-hero .lead{max-width:none;}}' +
    '@media(max-width:640px){.gb{font-size:18px}.gb-nodig{grid-template-columns:1fr}.gb-cta .gb-btn{width:100%}.gb-verkoop .gb-btn{width:100%}' +
    '.gb-chat{inset:0;transform:none!important;}.gb-sticker{display:none;}.gb-stage{height:420px;}.gb-hero{padding:28px 16px 32px;}' +
    '.gb-prompt .rij small{display:none;}.gb-film{gap:3px;}.gb-part2{flex-direction:column;align-items:flex-start;}}' +
    '@media(prefers-reduced-motion:reduce){.gb *,.gb *::before{animation:none!important;transition:none!important;}' +
    '.gb-rv,.gb-fade,.gb-w>span{opacity:1!important;transform:none!important;}.gb-mark::before{transform:rotate(-1.5deg)!important;}}';

  /* Lucide-iconen (ISC-licentie), inline */
  function ic(paths) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + paths + '</svg>'; }
  var I = {
    pijl: ic('<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>').replace('<svg', '<svg class="pijl"'),
    omlaag: ic('<path d="M12 5v14"/><path d="m19 12-7 7-7-7"/>'),
    kopie: ic('<rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>'),
    check: ic('<path d="M20 6 9 17l-5-5"/>'),
    plus: ic('<path d="M5 12h14"/><path d="M12 5v14"/>'),
    chat: ic('<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>'),
    camera: ic('<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/>'),
    telefoon: ic('<rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/>'),
    upload: ic('<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/>'),
    info: ic('<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>'),
    play: ic('<polygon points="6 3 20 12 6 21 6 3"/>'),
    insta: ic('<rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>')
  };

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  // Splitst een kop in woorden die elk van onderen binnenschuiven. *woord* krijgt de gele markering.
  function woorden(txt, start) {
    var d = start || 0;
    return txt.split(' ').map(function (w, i) {
      var mark = /^\*.*\*$/.test(w); if (mark) w = w.slice(1, -1);
      return '<span class="gb-w"><span style="transition-delay:' + (d + i * 0.07).toFixed(2) + 's"' + (mark ? ' class="gb-mark"' : '') + '>' + esc(w) + '</span></span>';
    }).join(' ');
  }
  function prompt(label, txt) {
    return '<div class="gb-prompt gb-rv"><span class="k">' + esc(label) + '</span><p data-tekst="' + esc(txt) + '">' + esc(txt) + '</p>' +
      '<div class="rij"><span class="plus">' + I.plus + '</span><small>Plak in ChatGPT</small>' +
      '<button type="button" class="gb-btn gb-kopie">' + I.kopie + '<span>Kopieer prompt</span></button></div></div>';
  }
  function sec(nr, titel, inhoud, id) {
    return '<section class="gb-sec"' + (id ? ' id="' + id + '"' : '') + '><span class="gb-num" aria-hidden="true" data-par="-0.12">' + nr + '</span>' +
      '<h2 class="gb-rv">' + woorden(titel) + '</h2>' + inhoud + '</section>';
  }
  function video(naam) { return '<video src="' + IMG + naam + '.mp4" poster="' + IMG + naam + '.jpg" autoplay muted loop playsinline preload="metadata" aria-hidden="true"></video>'; }

  function render(root) {
    if (!document.getElementById('gb-css')) { var st = document.createElement('style'); st.id = 'gb-css'; st.textContent = CSS; document.head.appendChild(st); }
    var tick = TICKER.map(function (t) { return '<span>' + esc(t) + '</span>'; }).join('');
    root.innerHTML = '<article class="gb">' +
      '<div class="gb-prog" aria-hidden="true"></div>' +

      '<header class="gb-hero">' +
      '<div class="gb-hero-tekst"><span class="gb-kicker gb-fade"><i></i>Uit mijn video</span>' +
      '<h1>' + woorden('Gifjes van *jezelf* maken met ChatGPT', 0.15) + '</h1>' +
      '<p class="lead gb-fade" style="transition-delay:.7s">Je zag mijn video en je wilt jezelf ook in een gifje zetten. Hieronder staan mijn prompts, met een knop om ze te kopiëren, en een tool om jezelf in een bekend gifje te zetten.</p>' +
      '<p class="gb-let gb-fade" role="note" style="transition-delay:.78s">' + I.info + '<span><b>Op dit moment:</b> dit werkt alleen in de gewone chat van ChatGPT. In Work en Codex werkt het nog niet.</span></p>' +
      '<div class="gb-cta gb-fade" style="transition-delay:.85s"><a class="gb-btn op-donker" href="#gb-nieuw">Naar de prompts ' + I.omlaag + '</a>' +
      '<a class="gb-btn leeg" href="#gb-bekend">Jezelf in een bekend gifje ' + I.pijl + '</a></div></div>' +
      '<div class="gb-stage gb-fade" style="transition-delay:.4s" aria-hidden="true">' +
      '<div class="gb-chat" data-par="-0.06"><div class="gb-chat-kop"><span class="gb-ava">V</span><div><b>Vrijdagborrel</b><small>Ed, Sanne, Joost en 6 anderen</small></div></div><div class="gb-msgs"></div></div>' +
      '<div class="gb-sticker s1" data-par="-0.16">' + video('toost') + '</div>' +
      '<div class="gb-sticker s2" data-par="0.1">' + video('heg') + '</div>' +
      '</div></header>' +

      '<div class="gb-ticker" aria-hidden="true"><div class="gb-ticker-in"><div class="gb-ticker-rij">' + tick + '</div><div class="gb-ticker-rij">' + tick + '</div></div></div>' +

      '<div class="gb-body">' +
      sec('01', 'Wat je nodig hebt',
        '<div class="gb-nodig gb-rv"><div><span class="ic">' + I.chat + '</span><b>ChatGPT</b>Volgens OpenAI zit Images 2.6 sinds 4 november 2026 in alle abonnementen, ook gratis, op web, desktop en mobiel. De gif-functie wordt in stapjes uitgerold: zie je hem nog niet, dan zit je account er nog niet bij. Gebruik de gewone chat: in Work en Codex werkt het nog niet.</div>' +
        '<div><span class="ic">' + I.camera + '</span><b>Een foto van jezelf</b>Een duidelijke foto waarop je gezicht goed te zien is. Die stuur je mee met de prompt, in de app via het plusje.</div></div>') +

      sec('02', 'Jezelf in een nieuw gifje',
        '<p class="gb-rv">Dit is de prompt uit de video. Stuur je foto mee en verander de actie aan het eind in wat jij wilt zien.</p>' +
        prompt('Met je foto erbij', P1) +
        '<figure class="gb-rv"><img src="' + BASE + 'img/gif-jezelf.webp" alt="ChatGPT met mijn referentiefoto en prompt, en als resultaat een gifje waarin ik met een verrekijker om het hoekje kijk" width="1080" height="1350" loading="lazy"><figcaption>Mijn eigen prompt en resultaat in ChatGPT.</figcaption></figure>', 'gb-nieuw') +

      sec('03', 'Jezelf in een bekend gifje',
        '<p class="gb-rv">Hier zit een addertje. Als je een gifje uploadt, ziet ChatGPT alleen één stilstaand plaatje en weet hij niet hoe het beweegt. Er zijn twee manieren om dat op te lossen.</p>' +
        '<div class="gb-scrub gb-rv" aria-hidden="true"><div class="gb-scrub-groot"><span>frame 1/9</span></div><div class="gb-film">' + new Array(HEG_FRAMES + 1).join('<i></i>') + '</div>' +
        '<p>Scroll rustig door: dit gifje bestaat uit <b>9 losse frames</b>. ChatGPT ziet er bij een upload maar één van. Geef je hem alle frames, dan snapt hij de beweging.</p></div>' +
        '<h3 class="gb-h3 gb-rv">Snel: één screenshot en een beschrijving</h3>' +
        '<p class="gb-rv">Maak een screenshot van het gifje op het mooiste moment. Stuur die mee met een foto van jezelf, en beschrijf in de prompt kort wat er in het gifje gebeurt.</p>' +
        prompt('Met de screenshot en je foto erbij', P3) +
        '<h3 class="gb-h3 gb-rv">Beste resultaat: de losse frames <em>Tool</em></h3>' +
        '<p class="gb-rv">Wil je dat het echt op het origineel lijkt, geef ChatGPT dan de losse frames van het gifje. Deze tool haalt ze er voor je uit, in je eigen browser. Op de computer gaat dit het makkelijkst: download de frames en sleep ze samen met je foto in ChatGPT.</p>' +
        '<div class="edgpt-gif-raster gb-rv" data-kort></div>' +
        '<div class="gb-tip gb-rv">' + I.telefoon + '<div><strong>Tip voor je telefoon:</strong> een gifje uit WhatsApp staat op je iPhone vaak als korte video. Die kun je ook gewoon in de tool zetten.</div></div>', 'gb-bekend') +

      sec('04', 'Daarna gewoon doorpraten',
        '<p class="gb-rv">Als je gifje er staat, kan je er gewoon op doorgaan. In de video deed ik er roze lasers bij en zette ik hem sneller. Snelheid kan ook via het knopje op je gifje, van 0,5x tot 2x.</p>' +
        prompt('Iets toevoegen', 'Doe er roze lasers bij.') + prompt('Sneller', 'Maak hem twee keer zo snel.')) +

      sec('05', 'Part 2: je gifje online zetten',
        '<div class="gb-part2 gb-rv"><span class="ic">' + I.upload + '</span><p>In part 2 laat ik zien hoe je je gifje online zet, zodat iedereen hem kan vinden. Die komt hier te staan zodra hij er is.</p></div>') +

      '<section class="gb-verkoop gb-rv" aria-label="Voor je team">' +
      '<a class="gb-advies" href="' + L.advies + '"><span class="g">Gratis</span><span><b>AI-adviesgesprek</b><small>30 minuten online, geen pitch. Jouw vraag, mijn advies.</small></span>' + I.pijl + '</a>' +
      '<span class="k">Voor je team</span><h3>Wil je dat je team zo met AI werkt?</h3>' +
      '<p>Ik geef praktische AI-trainingen voor marketing- en contentteams, met jullie eigen werk als oefenmateriaal.</p>' +
      '<a class="gb-btn" href="' + L.trainingen + '">Bekijk de trainingen ' + I.pijl + '</a>' +
      '<div class="gb-volg">Part 2 niet missen? <a href="' + L.tiktok + '" target="_blank" rel="noopener">' + I.play + 'TikTok</a><a href="' + L.instagram + '" target="_blank" rel="noopener">' + I.insta + 'Instagram</a></div>' +
      '</section></div></article>';

    var gb = root.querySelector('.gb');
    kopieerKnoppen(gb);
    scrubInit(gb);
    if (STIL) { gb.querySelectorAll('.gb-rv,.gb-hero').forEach(function (e) { e.classList.add('is-in'); }); }
    else { reveals(gb); typen(gb); scroll(gb); }
    requestAnimationFrame(function () { requestAnimationFrame(function () { gb.querySelector('.gb-hero').classList.add('is-in'); }); });
    groepsapp(gb);

    // de frames-tool
    if (window.EDGPT_GIF_RASTER) window.EDGPT_GIF_RASTER.mount(root.querySelector('.edgpt-gif-raster'));
    else { var s = document.createElement('script'); s.src = BASE + 'gif-raster.js?v=' + BUST; document.head.appendChild(s); }
  }

  /* ---------- kopiëren met confetti ---------- */
  function kopieerKnoppen(gb) {
    gb.querySelectorAll('.gb-kopie').forEach(function (b) {
      var label = b.querySelector('span');
      b.addEventListener('click', function () {
        var t = b.closest('.gb-prompt').querySelector('p').getAttribute('data-tekst');
        function ok() {
          b.classList.add('ok'); label.textContent = 'Gekopieerd'; b.querySelector('svg').outerHTML = I.check;
          confetti(b);
          setTimeout(function () { b.classList.remove('ok'); label.textContent = 'Kopieer prompt'; b.querySelector('svg').outerHTML = I.kopie; }, 1800);
        }
        // oude manier als het klembord geweigerd wordt (ingebedde pagina's, oudere browsers)
        function oud() {
          var ta = document.createElement('textarea'); ta.value = t; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;opacity:0;top:0;left:0';
          document.body.appendChild(ta); ta.select(); var gelukt = false; try { gelukt = document.execCommand('copy'); } catch (e) {}
          ta.remove(); if (gelukt) ok();
        }
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(ok, oud); else oud();
      });
    });
  }
  function confetti(el) {
    if (STIL || !Element.prototype.animate) return;
    var r = el.getBoundingClientRect(), kl = ['#FFD02F', '#FFE27A', '#1A1A1A', '#FFD02F'];
    for (var i = 0; i < 22; i++) {
      var c = document.createElement('i'); c.className = 'gb-confetti';
      c.style.left = (r.left + r.width / 2) + 'px'; c.style.top = (r.top + r.height / 2) + 'px';
      c.style.background = kl[i % kl.length];
      document.body.appendChild(c);
      var a = Math.random() * Math.PI * 2, v = 60 + Math.random() * 90, dx = Math.cos(a) * v, dy = Math.sin(a) * v - 60;
      c.animate([{ transform: 'translate(-50%,-50%) rotate(0)', opacity: 1 },
        { transform: 'translate(calc(-50% + ' + dx + 'px),calc(-50% + ' + (dy + 120) + 'px)) rotate(' + (Math.random() * 720 - 360) + 'deg)', opacity: 0 }],
        { duration: 800 + Math.random() * 400, easing: 'cubic-bezier(.2,.8,.2,1)' }).onfinish = (function (n) { return function () { n.remove(); }; })(c);
    }
  }

  /* ---------- secties komen binnen ---------- */
  function reveals(gb) {
    if (!('IntersectionObserver' in window)) { gb.querySelectorAll('.gb-rv').forEach(function (e) { e.classList.add('is-in'); }); return; }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -12% 0px' });
    gb.querySelectorAll('.gb-rv').forEach(function (e) { io.observe(e); });
  }

  /* ---------- prompts typen zichzelf in zodra ze in beeld komen ---------- */
  function typen(gb) {
    if (!('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return; io.unobserve(e.target);
        var p = e.target, t = p.getAttribute('data-tekst'), i = 0, stap = Math.max(1, Math.round(t.length / 55));
        p.setAttribute('aria-label', t);
        (function volgende() {
          i = Math.min(t.length, i + stap);
          p.innerHTML = esc(t.slice(0, i)) + (i < t.length ? '<span class="car"></span>' : '');
          if (i < t.length) setTimeout(volgende, 18);
        })();
      });
    }, { rootMargin: '0px 0px -20% 0px' });
    gb.querySelectorAll('.gb-prompt p').forEach(function (p) { p.innerHTML = '<span class="car"></span>'; io.observe(p); });
  }

  /* ---------- het heg-gifje speelt af op je scroll ---------- */
  var scrubUpdate = function () {};
  function scrubInit(gb) {
    var box = gb.querySelector('.gb-scrub'); if (!box) return;
    var url = 'url(' + IMG + 'heg-frames.jpg)', groot = box.querySelector('.gb-scrub-groot'), lab = groot.querySelector('span'), film = box.querySelectorAll('.gb-film i'), laatst = -1;
    groot.style.backgroundImage = url;
    film.forEach(function (f, i) { f.style.backgroundImage = url; f.style.backgroundPosition = (i / (HEG_FRAMES - 1) * 100) + '% 0'; });
    function zet(n) {
      if (n === laatst) return; laatst = n;
      groot.style.backgroundPosition = (n / (HEG_FRAMES - 1) * 100) + '% 0';
      lab.textContent = 'frame ' + (n + 1) + '/' + HEG_FRAMES;
      film.forEach(function (f, i) { f.classList.toggle('nu', i === n); });
    }
    zet(0);
    if (STIL) return;
    scrubUpdate = function (vh) {
      var r = box.getBoundingClientRect();
      if (r.bottom < 0 || r.top > vh) return;
      // van 'onderkant in beeld' tot 'bovenkant bijna uit beeld' loopt het gifje één keer door
      var p = Math.min(1, Math.max(0, (vh * 0.9 - r.top) / (vh * 0.9)));
      zet(Math.min(HEG_FRAMES - 1, Math.floor(p * HEG_FRAMES)));
    };
  }

  /* ---------- parallax, leesvoortgang, ticker die meebuigt ---------- */
  function scroll(gb) {
    var prog = gb.querySelector('.gb-prog'), par = gb.querySelectorAll('[data-par]'), hero = gb.querySelector('.gb-hero'),
      tick = gb.querySelector('.gb-ticker-in'), lastY = window.scrollY, skew = 0, bezig = false;
    function frame() {
      bezig = false;
      var vh = window.innerHeight, y = window.scrollY, gr = gb.getBoundingClientRect();
      var p = Math.min(1, Math.max(0, -gr.top / Math.max(1, gr.height - vh)));
      prog.style.transform = 'scaleX(' + p.toFixed(4) + ')';
      par.forEach(function (el) {
        var r = el.getBoundingClientRect(), mid = r.top + r.height / 2 - vh / 2;
        if (r.bottom < -200 || r.top > vh + 200) return;
        el.style.setProperty('--py', (mid * parseFloat(el.getAttribute('data-par'))).toFixed(1) + 'px');
      });
      hero.style.setProperty('--py', (y * 0.25).toFixed(1) + 'px');
      var v = y - lastY; lastY = y;
      skew += (Math.max(-12, Math.min(12, v * 0.35)) - skew) * 0.25;
      tick.style.setProperty('--skew', skew.toFixed(2) + 'deg');
      scrubUpdate(vh);
      if (Math.abs(skew) > 0.05) aan();
    }
    function aan() { if (!bezig) { bezig = true; requestAnimationFrame(frame); } }
    window.addEventListener('scroll', aan, { passive: true });
    window.addEventListener('resize', aan);
    aan();
  }

  /* ---------- groepsapp: berichten en gifjes komen één voor één binnen ---------- */
  function groepsapp(gb) {
    var box = gb.querySelector('.gb-msgs'), i = 0, timer = null, zichtbaar = true, MAX = 4;
    function bericht(m) {
      var d = document.createElement('div');
      if (m.g) { d.className = 'gb-msg ed'; d.innerHTML = '<div class="gf">' + video(m.g) + '<span>GIF</span></div>'; }
      else { d.className = 'gb-msg'; d.innerHTML = '<div class="tx"><small>' + esc(m.van) + '</small>' + esc(m.t) + '</div>'; }
      return d;
    }
    function opruimen() {
      var msgs = box.querySelectorAll('.gb-msg:not(.weg)');
      // houd het aantal beperkt zodat er geen scrollbalk ontstaat
      for (var k = 0; k < msgs.length - MAX; k++) {
        (function (n) { n.classList.add('weg'); setTimeout(function () { n.remove(); }, 360); })(msgs[k]);
      }
    }
    if (STIL) { CHAT.slice(1, 5).forEach(function (m) { box.appendChild(bericht(m)); }); return; }
    function volgende() {
      if (!zichtbaar) { timer = null; return; }
      var m = CHAT[i % CHAT.length]; i++;
      if (!m.g) {
        var typ = document.createElement('div'); typ.className = 'gb-typ'; typ.innerHTML = '<i></i><i></i><i></i>'; box.appendChild(typ);
        timer = setTimeout(function () { typ.remove(); box.appendChild(bericht(m)); opruimen(); timer = setTimeout(volgende, 1300); }, 850);
      } else { box.appendChild(bericht(m)); opruimen(); timer = setTimeout(volgende, 2300); }
    }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) {
        zichtbaar = es[0].isIntersecting;
        if (zichtbaar && !timer) timer = setTimeout(volgende, 500);
      }).observe(box);
    } else volgende();
  }

  function init() { Array.prototype.forEach.call(document.querySelectorAll('.edgpt-gif-blog'), render); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();

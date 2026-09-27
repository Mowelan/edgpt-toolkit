/*
 * Goodie: Video Prompt Bouwer (drone-video, 27 sep 2026).
 * Modellen en tips gecontroleerd op 27-09-2026, bronnen in
 * workspace/runs/run-20260927-132214-toolkit/modellen-check.md.
 * Model bijwerken: MODELS aanpassen en zo nodig een structuur in buildMake() of buildEdit().
 */
(function () {
  var MODELS = {
    edit: [
      { id: 'aleph', name: 'Runway Aleph 2.0', tip: '<strong>Aleph 2.0 bewerkt clips tot 30 seconden.</strong> Je kunt ook een frame dat je al hebt aangepast als voorbeeld meegeven. Dan ziet het model precies welke kant je op wilt.' },
      { id: 'kling', name: 'Kling 3.0 Omni', tip: '<strong>Kling verwijst naar je clip met @Video.</strong> Upload je video en laat die verwijzing in de prompt staan, zo weet het model welke clip je bedoelt.' },
      { id: 'seedance', name: 'Seedance 2.0', tip: '<strong>Seedance werkt met verwijzingen.</strong> Upload je clip en noem hem @Video 1 in je prompt. Een referentiebeeld geef je mee als @Image 1, bijvoorbeeld van de auto die erin moet.' },
      { id: 'luma', name: 'Luma Modify', tip: '<strong>Luma Modify (Ray3.2) wil een duidelijke instructie.</strong> Zorg dat wat je wilt veranderen in het eerste of laatste frame te zien is. Met de instellingen voor beweging en structuur bepaal je hoe dicht je bij het origineel blijft.' },
      { id: 'omni', name: 'Gemini Omni', tip: '<strong>Omni bewerk je via een chat.</strong> Houd de opdracht kort. De regel "Keep everything else the same" zit er al in, want die raadt Google zelf aan.' },
      { id: 'general', name: 'Ander model', tip: '<strong>Deze structuur werkt in de meeste bewerkmodellen:</strong> zeg wat er verandert, waarin, en wat er hetzelfde moet blijven.' }
    ],
    make: [
      { id: 'kling', name: 'Kling 3.0', tip: '<strong>Kling 3.0 kan meerdere shots in één clip.</strong> Nummer ze dan: <code>Shot 1, ...</code> en <code>Shot 2, ...</code>' },
      { id: 'seedance', name: 'Seedance 2.0', tip: '<strong>Seedance werkt goed met eigen beelden.</strong> Verwijs ernaar met @, bijvoorbeeld <code>the car from @Image 1</code>.' },
      { id: 'veo', name: 'Veo 3.1', tip: '<strong>Veo maakt ook geluid.</strong> Laat je iemand praten, zet de tekst dan tussen aanhalingstekens: <code>A man says, "Check dit dan."</code>' },
      { id: 'runway', name: 'Runway Gen-4.5', tip: '<strong>Runway raadt aan om positief te formuleren.</strong> Beschrijf wat je wél wilt zien. Begin je met een foto, beschrijf dan alleen de beweging.' },
      { id: 'omni', name: 'Gemini Omni', tip: '<strong>Omni maakt standaard meerdere shots.</strong> Daarom staat er "Single unbroken scene" achter je prompt. Haal het weg als je juist wel wisselende shots wilt.' }
    ]
  };

  var CAM = {
    orbit: ['Drone orbit (cirkel eromheen)', 'slow aerial drone orbit around the subject'],
    reveal: ['Drone reveal (van laag naar hoog)', 'drone rising slowly from low to high, revealing the scene'],
    follow: ['Drone follow (volgt van achteren)', 'drone following the subject from behind'],
    topdown: ['Top-down (recht van boven)', 'top-down drone view looking straight down'],
    fpv: ['FPV-drone (snel en dichtbij)', 'fast FPV drone flight close to the action'],
    tracking: ['Tracking shot (vanaf de zijkant)', 'smooth tracking shot alongside the subject'],
    pushin: ['Langzame push-in', 'slow push-in to a close-up'],
    handheld: ['Handheld', 'handheld shot with natural movement'],
    stat: ['Statisch shot', 'static locked-off shot']
  };
  var LIGHT = {
    golden: ['Golden hour', 'warm golden hour light with long shadows'],
    blue: ['Blue hour', 'blue hour with soft, cool light'],
    overcast: ['Bewolkt en zacht', 'soft overcast daylight'],
    fog: ['Mistige ochtend', 'misty morning with diffused light'],
    neon: ['Nacht met neon', 'night, lit by colorful neon signs'],
    noon: ['Felle middagzon', 'harsh midday sun with strong contrast']
  };
  var STYLE = {
    cinematic: ['Cinematic', 'cinematic, shallow depth of field, anamorphic look'],
    commercial: ['Commercial', 'high-end car commercial look, crisp and clean'],
    docu: ['Documentaire', 'documentary style with natural colors'],
    ugc: ['Smartphone / social', 'shot on a smartphone, authentic social media look'],
    film: ['35mm film', 'shot on 35mm film with subtle grain']
  };
  var KEEPS = [
    ['camera', 'Camerabeweging', 'the camera movement'],
    ['subject', 'Hoofdonderwerp', 'the main subject'],
    ['timing', 'Timing', 'the timing'],
    ['bg', 'Achtergrond', 'the background'],
    ['people', 'Personen en gezichten', 'the people and their faces'],
    ['colors', 'Kleuren', 'the original colors']
  ];
  var EDIT = {
    replace: { lbl: 'Iets vervangen', what: 'Wat wil je vervangen?', to: 'Waarmee?', w: 'the car', t: 'a classic Volkswagen Beetle in pastel blue', keep: ['camera', 'timing', 'bg'] },
    env: { lbl: 'Andere omgeving', what: null, to: 'Welke omgeving?', w: '', t: 'a neon-lit street in Tokyo at night', keep: ['camera', 'subject', 'timing'] },
    weather: { lbl: 'Weer of seizoen', what: null, to: 'Welk weer of seizoen?', w: '', t: 'a snowy winter day with fresh snow on the road and falling snowflakes', keep: ['camera', 'subject', 'timing'] },
    remove: { lbl: 'Iets weghalen', what: 'Wat moet er weg?', to: null, w: 'the people in the background', t: '', keep: ['camera', 'subject', 'timing'] },
    add: { lbl: 'Iets toevoegen', what: 'Wat wil je toevoegen?', to: null, w: 'a hot air balloon drifting in the sky', t: '', keep: ['camera', 'subject', 'timing'] },
    restyle: { lbl: 'Andere stijl', what: null, to: 'Welke stijl?', w: '', t: 'a hand-drawn anime look', keep: ['camera', 'timing'] },
    relight: { lbl: 'Ander licht of tijdstip', what: null, to: 'Welk licht of tijdstip?', w: '', t: 'warm golden hour light', keep: ['camera', 'subject', 'timing', 'bg'] },
    angle: { lbl: 'Nieuwe camerahoek', what: null, to: 'Welke camerahoek?', w: '', t: 'a low angle close to the road', keep: ['subject', 'bg'] },
    custom: { lbl: 'Eigen opdracht', what: null, to: null, custom: true, w: '', t: '', keep: ['camera', 'timing'] }
  };
  var NAMES = { ref: 'Referentie', subject: 'Onderwerp', action: 'Actie', setting: 'Plek', camera: 'Camera', light: 'Licht', style: 'Stijl', audio: 'Geluid', act: 'Opdracht', what: 'Wat', to: 'Wordt', keep: 'Blijft' };

  /* Referenties: rollen per type en hoe elk model ernaar verwijst (zie referenties-check.md). */
  var REF_ROLES = {
    image: [['subject', 'Onderwerp'], ['style', 'Stijl'], ['setting', 'Omgeving'], ['start', 'Startbeeld'], ['end', 'Eindbeeld']],
    video: [['motion', 'Beweging'], ['camera', 'Camerabeweging'], ['style', 'Stijl']],
    audio: [['music', 'Muziek'], ['voice', 'Voice-over'], ['sfx', 'Geluidseffecten']]
  };
  var REF_LABEL = { image: 'Beeld', video: 'Video', audio: 'Audio' };
  var REF_WORD = { image: 'image', video: 'video', audio: 'audio' };
  var REF_STYLE = {
    // standaard: neutrale verwijzing, werkt in elk model dat bijlagen leest
    general: { name: function (t, n) { return 'reference ' + REF_WORD[t] + ' ' + n; } },
    seedance: { name: function (t, n) { return '@' + REF_LABEL[t].replace('Beeld', 'Image') + ' ' + n; }, editVideoOffset: 1 }
  };
  function refStyle(m) { return REF_STYLE[m] || REF_STYLE.general; }

  function opts(obj, def) {
    return Object.keys(obj).map(function (k) {
      return '<option value="' + k + '"' + (k === def ? ' selected' : '') + '>' + obj[k][0] + '</option>';
    }).join('');
  }
  function editOpts(base) {
    return Object.keys(EDIT).map(function (k, i) {
      return '<button type="button" class="vp-act" data-act="' + k + '" aria-pressed="' + (i === 0 ? 'true' : 'false') + '">' +
        '<img src="' + base + 'img/act-' + k + '.webp" alt="" width="160" height="160" loading="lazy"><span>' + EDIT[k].lbl + '</span></button>';
    }).join('');
  }
  function dot(k) { return '<span class="vp-dot" style="background:var(--k-' + k + ')"></span>'; }

  var CSS = '' +
    '.vp-hero{display:grid;grid-template-columns:1fr;gap:18px;align-items:center;margin-bottom:clamp(28px,4vw,48px)}' +
    '@media(min-width:940px){.vp-hero{grid-template-columns:minmax(0,1fr) minmax(0,1.05fr)}.vp-hero>div{padding-right:clamp(8px,2vw,28px)}}' +
    '.vp-hero h1{font-size:clamp(40px,5.2vw,68px);margin-bottom:18px}' +
    '.vp-hero img{width:100%;height:auto;aspect-ratio:16/10;object-fit:cover;object-position:60% 50%;border-radius:20px;display:block}' +
    '.vp-acts{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}' +
    '.vp-act{display:flex;flex-direction:column;align-items:center;gap:6px;padding:8px 6px 10px;border:1.5px solid var(--line);border-radius:14px;background:var(--white);cursor:pointer;font:600 13.5px/1.2 var(--body);color:var(--ink);text-align:center}' +
    '.vp-act img{width:100%;max-width:92px;height:auto;border-radius:10px}' +
    '.vp-act:hover{border-color:var(--ink)}' +
    '.vp-act[aria-pressed="true"]{border-color:var(--purple);box-shadow:0 0 0 2px var(--purple);background:var(--purple-tint)}' +
    '.vp-opt{font-weight:500;color:var(--ink50);font-size:13px}' +
    '.vp-field textarea{width:100%;font:15px/1.5 var(--body);color:var(--ink);background:var(--cream);border:1.5px solid var(--line);border-radius:12px;padding:12px 14px;resize:vertical}' +
    '.vp-field textarea:focus{outline:none;border-color:var(--ink);background:var(--white)}' +
    '.vp-after{margin-top:14px;font-size:14px;color:rgba(230,226,216,.8)}' +
    '.vp-after a{color:var(--yellow);font-weight:700}' +
    '.vp-demo{margin-top:clamp(48px,7vw,80px)}' +
    '.vp-demo h2{font-size:clamp(28px,3.6vw,44px);margin-bottom:10px}' +
    '.vp-demo>p{color:var(--ink70);max-width:60ch;margin-bottom:24px}' +
    '.vp-frames{display:grid;grid-auto-flow:column;grid-auto-columns:minmax(140px,190px);justify-content:start;gap:14px;overflow-x:auto;padding-bottom:6px;scroll-snap-type:x mandatory}' +
    '.vp-frame{margin:0;scroll-snap-align:start}' +
    '.vp-frame img{width:100%;aspect-ratio:9/16;object-fit:cover;border-radius:16px;display:block;background:var(--paper)}' +
    '.vp-frame figcaption{font-size:14px;color:var(--ink70);margin-top:8px;line-height:1.4}' +
    '.vp-frame figcaption b{display:block;color:var(--ink);font-family:var(--head);font-size:16px}' +
    '.vp-frame.is-orig img{box-shadow:0 0 0 3px var(--ink)}' +
    '.vp-more,.vp-why{margin:0 0 16px}' +
    '.vp-more summary,.vp-why summary{cursor:pointer;font:600 14.5px var(--body);color:var(--ink70);list-style:none}' +
    '.vp-more summary::-webkit-details-marker,.vp-why summary::-webkit-details-marker,.vp-more-guide summary::-webkit-details-marker{display:none}' +
    '.vp-more summary:hover,.vp-why summary:hover{color:var(--ink)}' +
    '.vp-more .vp-field{margin:10px 0 0}' +
    '.vp-why summary::before{content:"? ";display:inline-block;width:20px;height:20px;border-radius:50%;background:var(--paper);text-align:center;line-height:20px;margin-right:6px;font-size:12px}' +
    '.vp-why p{font-size:14.5px;color:var(--ink70);margin:10px 0 0}' +
    '.vp-more-guide{margin-top:8px;border-top:1px solid var(--line);padding-top:18px}' +
    '.vp-more-guide summary{cursor:pointer;list-style:none;font:700 clamp(20px,2.2vw,26px)/1.2 var(--head);letter-spacing:-.02em}' +
    '.vp-more-guide summary::after{content:" +";color:var(--purple)}' +
    '.vp-more-guide[open] summary::after{content:" \\2212"}' +
    '.vp-more-guide .vp-parts{margin-top:18px}' +
    '.vp-refs{border:1.5px dashed var(--line-strong);border-radius:14px;padding:12px 14px;margin:0 0 16px}' +
    '.vp-refs-head{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:8px}' +
    '.vp-refs-head .vp-lbl{margin:0;font-size:14.5px}' +
    '.vp-refs-add{display:flex;gap:6px}' +
    '.vp-refs-add button{font:600 13.5px var(--body);border:1.5px solid var(--line-strong);background:var(--white);border-radius:999px;padding:6px 11px;cursor:pointer}' +
    '.vp-refs-add button:hover{border-color:var(--ink)}' +
    '.vp-ref{display:grid;grid-template-columns:auto 1fr auto;gap:8px;align-items:center;margin-top:10px}' +
    '.vp-ref .vp-ref-tag{font:700 12px var(--mono);background:var(--paper);border-radius:8px;padding:6px 8px;white-space:nowrap}' +
    '.vp-ref-fields{display:grid;grid-template-columns:1fr;gap:6px}' +
    '@media(min-width:520px){.vp-ref-fields{grid-template-columns:minmax(0,.9fr) minmax(0,1.1fr)}}' +
    '.vp-ref select,.vp-ref input{width:100%;font:14.5px var(--body);color:var(--ink);background:var(--cream);border:1.5px solid var(--line);border-radius:10px;padding:8px 10px}' +
    '.vp-ref-x{border:0;background:none;font-size:20px;line-height:1;color:var(--ink50);cursor:pointer;padding:4px}' +
    '.vp-ref-x:hover{color:var(--ink)}' +
    '.vp-step img{width:72px;height:72px;border-radius:12px;margin-bottom:12px;display:block}' +
    '.vp-builder{display:grid;grid-template-columns:1fr;gap:18px}' +
    '@media(min-width:940px){.vp-builder{grid-template-columns:minmax(0,1fr) minmax(0,1.05fr);align-items:start}}' +
    '.vp-panel{background:var(--white);border:1px solid var(--line);border-radius:20px;padding:clamp(18px,2.6vw,28px)}' +
    '.vp-mode{display:grid;grid-template-columns:1fr 1fr;background:var(--paper);border-radius:999px;padding:4px;margin-bottom:24px}' +
    '.vp-mode button{font:700 15px var(--body);border:0;background:transparent;color:var(--ink70);padding:12px 8px;border-radius:999px;cursor:pointer}' +
    '.vp-mode button[aria-pressed="true"]{background:var(--ink);color:var(--cream)}' +
    '.vp-fs{border:0;margin:0 0 20px;padding:0;min-width:0}' +
    '.vp-lbl{font:600 15px var(--body);margin:0 0 8px;display:flex;align-items:center;gap:8px;padding:0;color:var(--ink)}' +
    '.vp-dot{width:10px;height:10px;border-radius:50%;flex:none;box-shadow:0 0 0 1px rgba(26,26,26,.18)}' +
    '.vp-models{display:flex;flex-wrap:wrap;gap:8px}' +
    '.vp-models button{font:600 14.5px var(--body);border:1.5px solid var(--line-strong);background:var(--white);color:var(--ink);padding:9px 15px;border-radius:999px;cursor:pointer}' +
    '.vp-models button:hover{border-color:var(--ink)}' +
    '.vp-models button[aria-pressed="true"]{background:var(--purple);color:#fff;border-color:var(--purple)}' +
    '.vp-field{margin-bottom:18px}' +
    '.vp-field input[type=text],.vp-field select{width:100%;font:16px var(--body);color:var(--ink);background:var(--cream);border:1.5px solid var(--line);border-radius:12px;padding:12px 14px;appearance:auto}' +
    '.vp-field input[type=text]:focus,.vp-field select:focus{outline:none;border-color:var(--ink);background:var(--white)}' +
    '.vp-hint{font-size:14px;color:var(--ink70);margin:6px 0 0}' +
    '.vp-hint+.vp-hint,[data-id="editFields"]+.vp-hint,[data-id="makeFields"]+.vp-hint{margin-top:10px}' +
    '.vp-check{display:flex;gap:10px;align-items:flex-start;font-size:15px;cursor:pointer;margin-bottom:20px;background:var(--paper);padding:13px 15px;border-radius:12px}' +
    '.vp-check input{margin-top:4px;width:17px;height:17px;accent-color:var(--purple);flex:none}' +
    '.vp-keeps{display:flex;flex-wrap:wrap;gap:8px}' +
    '.vp-keeps label{display:flex;gap:7px;align-items:center;font-size:14.5px;border:1.5px solid var(--line);border-radius:999px;padding:7px 13px;cursor:pointer;background:var(--white)}' +
    '.vp-keeps label:has(input:checked){border-color:var(--ink)}' +
    '.vp-keeps input{accent-color:var(--purple);margin:0}' +
    '.vp-row2{display:grid;grid-template-columns:1fr;gap:0 14px}' +
    '@media(min-width:560px){.vp-row2{grid-template-columns:1fr 1fr}}' +
    '.vp-monitor{background:var(--ink);color:var(--cream);border-radius:20px;padding:clamp(18px,2.6vw,26px)}' +
    '@media(min-width:940px){.vp-monitor{position:sticky;top:100px}}' +
    '.vp-mon-head{display:flex;justify-content:space-between;align-items:baseline;gap:12px;margin-bottom:16px}' +
    '.vp-mon-head h2{font-size:20px}' +
    '.vp-mon-head span{font-size:14px;color:rgba(230,226,216,.7)}' +
    '.vp-track{display:flex;gap:3px;height:32px;margin-bottom:6px}' +
    '.vp-track div{border-radius:6px;min-width:6px;transition:flex-grow .35s ease;position:relative;overflow:hidden}' +
    '.vp-track div span{position:absolute;left:8px;top:50%;transform:translateY(-50%);font:700 11.5px var(--body);color:var(--ink);white-space:nowrap}' +
    '.vp-ruler{height:8px;background:repeating-linear-gradient(90deg,rgba(250,247,241,.2) 0 1px,transparent 1px 12px);margin-bottom:18px;border-radius:2px}' +
    '.vp-prompt{font:15px/1.8 var(--mono);min-height:140px;overflow-wrap:anywhere}' +
    '.vp-prompt span[data-k]{border-bottom:2px solid var(--kc);background:color-mix(in srgb,var(--kc) 18%,transparent);border-radius:3px;padding:1px 2px}' +
    '.vp-prompt .vp-empty{color:rgba(230,226,216,.6);font-family:var(--body)}' +
    '.vp-copy{margin-top:20px;width:100%}' +
    '.vp-copy.is-done{background:#fff;border-color:#fff}' +
    '.vp-tip{margin-top:18px;font-size:14.5px;line-height:1.55;color:rgba(230,226,216,.9);background:rgba(250,247,241,.07);padding:13px 15px;border-radius:12px}' +
    '.vp-tip strong{color:var(--cream)}' +
    '.vp-tip code,.vp-guide code{font:13.5px var(--mono)}' +
    '.vp-guide{margin-top:clamp(48px,7vw,80px)}' +
    '.vp-guide h2{font-size:clamp(28px,3.6vw,44px);margin-bottom:14px}' +
    '.vp-guide>p{color:var(--ink70);max-width:60ch;margin-bottom:28px}' +
    '.vp-steps{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:16px;margin-bottom:20px}' +
    '.vp-step{background:var(--white);border:1px solid var(--line);border-radius:18px;padding:22px}' +
    '.vp-step b{display:block;font:700 13px var(--body);letter-spacing:.16em;text-transform:uppercase;color:var(--purple);margin-bottom:10px}' +
    '.vp-step h3{font-size:21px;margin-bottom:8px}' +
    '.vp-step p{font-size:15.5px;color:var(--ink70);margin:0}' +
    '.vp-callout{background:var(--yellow-tint);border-radius:18px;padding:20px 22px;font-size:15.5px;margin-bottom:clamp(40px,6vw,64px)}' +
    '.vp-callout strong{font-family:var(--head);font-size:18px;display:block;margin-bottom:4px}' +
    '.vp-parts{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:1px;background:var(--line);border:1px solid var(--line);border-radius:18px;overflow:hidden}' +
    '.vp-part{background:var(--white);padding:18px 18px 20px}' +
    '.vp-part h3{font-size:18px;margin-bottom:6px;display:flex;align-items:center;gap:9px}' +
    '.vp-part p{margin:0;font-size:15.5px;color:var(--ink70)}';

  function html(base) {
    return '<style>' + CSS + '</style>' +
      '<header class="vp-hero"><div><span class="tk-eyebrow">Tool · uit de drone-video</span>' +
      '<h1>Video Prompt Bouwer</h1>' +
      '<p class="tk-lede">Vervang de auto, de omgeving of het weer in een video die je al hebt. Of bouw een compleet nieuw shot. Kies je model, vul in wat je wilt zien en kopieer je prompt.</p></div>' +
      '<img src="' + base + 'img/hero-video-prompts.webp" alt="Illustratie: een drone cirkelt rond een auto, het landschap verandert van polder naar bergen" width="1600" height="900"></header>' +

      '<div class="vp-builder"><section class="vp-panel" aria-label="Instellingen">' +
      '<div class="vp-mode" role="group" aria-label="Wat wil je doen?">' +
      '<button type="button" data-mode="edit" aria-pressed="true">Video bewerken</button>' +
      '<button type="button" data-mode="make" aria-pressed="false">Nieuwe video maken</button></div>' +

      '<fieldset class="vp-fs"><legend class="vp-lbl">Welk model gebruik je?</legend><div class="vp-models" data-id="models"></div></fieldset>' +

      // bewerken
      '<div data-id="editFields">' +
      '<fieldset class="vp-fs"><legend class="vp-lbl">' + dot('act') + 'Wat wil je doen?</legend><div class="vp-acts" role="group">' + editOpts(base) + '</div><input type="hidden" id="vp-editAction" value="replace"></fieldset>' +
      '<div class="vp-field" data-f="custom"><label class="vp-lbl" for="vp-custom">' + dot('act') + 'Beschrijf wat er moet veranderen</label><textarea id="vp-custom" rows="3">make it look like the car is driving through a heavy thunderstorm at night, with lightning in the distance and rain on the road</textarea><p class="vp-hint">Schrijf het als een opdracht aan een editor. Liefst in het Engels.</p></div>' +
      '<div class="vp-field" data-f="what"><label class="vp-lbl" for="vp-what">' + dot('what') + '<span data-id="whatLbl"></span></label><input type="text" id="vp-what"></div>' +
      '<div class="vp-field" data-f="to"><label class="vp-lbl" for="vp-to">' + dot('to') + '<span data-id="toLbl"></span></label><input type="text" id="vp-to"></div>' +
      '<details class="vp-more"><summary>+ Extra details</summary><div class="vp-field"><input type="text" id="vp-extra" aria-label="Extra details" placeholder="bv. the new car has the same color as the original"></div></details>' +
      '<fieldset class="vp-fs" data-f="keeps"><legend class="vp-lbl">' + dot('keep') + 'Wat moet hetzelfde blijven?</legend><div class="vp-keeps" data-id="keeps"></div></fieldset>' +
      '<p class="vp-hint">Tip: één wijziging per prompt werkt het best. Andere auto én sneeuw? Doe het in twee rondes.</p></div>' +

      // maken
      '<div data-id="makeFields" hidden>' +
      '<label class="vp-check"><input type="checkbox" id="vp-i2v"><span>Ik begin met een foto of afbeelding<br><span class="vp-hint" style="margin:0">Dan beschrijf je alleen beweging en camera. De rest ziet het model al. Nog geen startbeeld? Maak het eerst met een beeldmodel zoals Seedream of ChatGPT.</span></span></label>' +
      '<div class="vp-field" data-f="subject"><label class="vp-lbl" for="vp-subject">' + dot('subject') + 'Wie of wat zie je?</label><input type="text" id="vp-subject" value="a classic red convertible"></div>' +
      '<div class="vp-field"><label class="vp-lbl" for="vp-action">' + dot('action') + 'Wat gebeurt er?</label><input type="text" id="vp-action" value="drives along a winding coastal road"></div>' +
      '<div class="vp-field" data-f="setting"><label class="vp-lbl" for="vp-setting">' + dot('setting') + 'Waar?</label><input type="text" id="vp-setting" value="through the Dutch dunes on a sunny autumn day"></div>' +
      '<div class="vp-row2"><div class="vp-field"><label class="vp-lbl" for="vp-camera">' + dot('camera') + 'Camera</label><select id="vp-camera">' + opts(CAM, 'orbit') + '</select></div>' +
      '<div class="vp-field" data-f="light"><label class="vp-lbl" for="vp-light">' + dot('light') + 'Licht</label><select id="vp-light">' + opts(LIGHT, 'golden') + '</select></div></div>' +
      '<div class="vp-field" data-f="style"><label class="vp-lbl" for="vp-style">' + dot('style') + 'Stijl</label><select id="vp-style">' + opts(STYLE, 'cinematic') + '</select></div>' +
      '<div class="vp-field"><label class="vp-lbl" for="vp-audio">' + dot('audio') + 'Wat hoor je?</label><input type="text" id="vp-audio" value="engine hum, wind and distant seagulls"></div>' +
      '</div>' +
      '<div class="vp-refs"><div class="vp-refs-head"><span class="vp-lbl">' + dot('ref') + 'Stuur je ook beeld, video of audio mee?</span>' +
      '<div class="vp-refs-add"><button type="button" data-add="image">+ Beeld</button><button type="button" data-add="video">+ Video</button><button type="button" data-add="audio">+ Audio</button></div></div>' +
      '<div data-id="refs"></div><p class="vp-hint" data-id="refhint" hidden></p></div>' +
      '<details class="vp-why"><summary>Waarom schrijf je de prompt in het Engels?</summary><p>Nederlands werkt vaak ook, maar Engels is voorspelbaarder. De officiële promptgidsen van deze modellen zijn Engelstalig, en vaktermen als <code>orbit</code>, <code>push-in</code> of <code>golden hour</code> pakken ze in het Engels het best op. Denk je liever in het Nederlands? Typ je idee en laat ChatGPT of Claude het vertalen.</p></details>' +
      '</section>' +

      '<section class="vp-monitor" aria-live="polite" aria-label="Jouw prompt">' +
      '<div class="vp-mon-head"><h2>Jouw prompt</h2><span data-id="modelName"></span></div>' +
      '<div class="vp-track" data-id="track" aria-hidden="true"></div><div class="vp-ruler" aria-hidden="true"></div>' +
      '<div class="vp-prompt" data-id="prompt"></div>' +
      '<button type="button" class="tk-btn tk-btn-y vp-copy" data-id="copy">Kopieer prompt</button>' +
      '<div class="vp-tip" data-id="tip"></div>' +
      '<p class="vp-after">Wil je dat je hele team zo met AI werkt? <a href="' + 'https://www.ed-gpt.nl/trainingen' + '">Bekijk de trainingen &rarr;</a></p></section></div>' +
      '<section class="vp-demo"><h2>Zo zag het eruit in mijn video</h2>' +
      '<p>Mijn eigen auto, gefilmd met een drone. Daarna liet ik AI de omgeving of de auto zelf vervangen. Links het origineel, daarnaast wat er van dezelfde opnames overbleef.</p>' +
      '<div class="vp-frames">' +
      '<figure class="vp-frame is-orig"><img src="' + base + 'img/still-origineel.webp" alt="Origineel: witte auto op een polderweg, gefilmd met een drone" loading="lazy" width="540" height="960"><figcaption><b>Origineel</b>Mijn eigen auto, gefilmd met een drone</figcaption></figure>' +
      '<figure class="vp-frame"><img src="' + base + 'img/still-omgeving.webp" alt="Dezelfde auto op een bergweg langs een fjord" loading="lazy" width="540" height="960"><figcaption><b>Andere omgeving</b>Zelfde auto, ineens in de bergen</figcaption></figure>' +
      '<figure class="vp-frame"><img src="' + base + 'img/still-pickup.webp" alt="Een blauwe pick-up op dezelfde polderweg, van bovenaf" loading="lazy" width="540" height="960"><figcaption><b>Iets vervangen</b>De auto wordt een pick-up</figcaption></figure>' +
      '<figure class="vp-frame"><img src="' + base + 'img/still-vuilniswagen.webp" alt="Een vuilniswagen op dezelfde polderweg, van bovenaf" loading="lazy" width="540" height="960"><figcaption><b>Iets vervangen</b>Of gewoon een vuilniswagen</figcaption></figure>' +
      '</div></section>' +

      '<section class="vp-guide"><h2>Zo schrijf je een bewerk-prompt die werkt</h2>' +
      '<p>Een bewerkmodel ziet je hele video, maar weet niet wat jij eraan wilt veranderen. Een goede prompt geeft daarom antwoord op drie vragen.</p>' +
      '<div class="vp-steps">' +
      '<div class="vp-step"><img src="' + base + 'img/act-replace.webp" alt="" loading="lazy"><b>1 · Wat</b><h3>Wat verandert er?</h3><p>Noem het ding zoals je het in beeld ziet: <code>the car</code>, <code>the sky</code>, <code>the background</code>. Eén ding per prompt.</p></div>' +
      '<div class="vp-step"><img src="' + base + 'img/act-restyle.webp" alt="" loading="lazy"><b>2 · Waarin</b><h3>Waarin verandert het?</h3><p>Hoe concreter, hoe beter. <code>a classic Volkswagen Beetle in pastel blue</code> geeft een veel voorspelbaarder resultaat dan <code>an old car</code>.</p></div>' +
      '<div class="vp-step"><img src="' + base + 'img/act-angle.webp" alt="" loading="lazy"><b>3 · Blijft</b><h3>Wat blijft hetzelfde?</h3><p>Camerabeweging, timing, de rest van het beeld. Die regel sla je snel over, en juist die houdt je shot heel.</p></div>' +
      '</div>' +
      '<div class="vp-callout"><strong>Filmen voor AI? Houd het shot rustig.</strong>Snelle, wilde camerabewegingen geven vaker flikkering. Eén rustig rondje met de drone is een prima start.</div>' +
      '<details class="vp-more-guide"><summary>Een nieuw shot maken? Dit zijn de bouwstenen</summary>' +
      '<p>Hoe meer van deze bouwstenen je invult, hoe minder je hoeft te gokken en opnieuw te genereren. De kleuren zijn dezelfde als in je prompt hierboven.</p>' +
      '<div class="vp-parts">' +
      '<div class="vp-part"><h3>' + dot('subject') + 'Onderwerp</h3><p>Wie of wat is de hoofdrol? <code>a man in a yellow raincoat</code> werkt beter dan <code>a person</code>.</p></div>' +
      '<div class="vp-part"><h3>' + dot('action') + 'Actie</h3><p>Video is beweging. Zeg wat er gebeurt, anders krijg je een bewegende foto.</p></div>' +
      '<div class="vp-part"><h3>' + dot('setting') + 'Plek</h3><p>Waar speelt het zich af? Seizoen en weer erbij maken een groot verschil.</p></div>' +
      '<div class="vp-part"><h3>' + dot('camera') + 'Camera</h3><p>Hoe beweegt de camera? Een drone-orbit of een langzame push-in bepaalt hoe professioneel je shot oogt.</p></div>' +
      '<div class="vp-part"><h3>' + dot('light') + 'Licht</h3><p>Golden hour, mist of neon. Licht bepaalt de sfeer meer dan je denkt.</p></div>' +
      '<div class="vp-part"><h3>' + dot('style') + 'Stijl en geluid</h3><p>Film, commercial of smartphone-look. De meeste modellen maken nu ook geluid, dus beschrijf wat je hoort.</p></div>' +
      '</div></details></section>';
  }

  window.EDGPT_TOOLKIT_MODULES['video-prompts'] = function (root, goodie, api) {
    root.innerHTML = html(api.base);
    var q = function (sel) { return root.querySelector(sel); };
    var $ = function (id) { return root.querySelector('[data-id="' + id + '"]') || root.querySelector('#vp-' + id); };
    var state = { mode: 'edit', model: { edit: 'aleph', make: 'kling' }, text: '', refs: [] };

    $('keeps').innerHTML = KEEPS.map(function (k) {
      return '<label><input type="checkbox" value="' + k[0] + '"> ' + k[1] + '</label>';
    }).join('');

    function applyEditDefaults() {
      var e = EDIT[$('editAction').value];
      $('what').value = e.w; $('to').value = e.t;
      [].forEach.call(root.querySelectorAll('[data-id="keeps"] input'), function (i) { i.checked = e.keep.indexOf(i.value) > -1; });
    }

    function renderModels() {
      var box = $('models');
      box.innerHTML = '';
      MODELS[state.mode].forEach(function (m) {
        var b = document.createElement('button');
        b.type = 'button'; b.textContent = m.name;
        b.setAttribute('aria-pressed', state.model[state.mode] === m.id ? 'true' : 'false');
        b.onclick = function () { state.model[state.mode] = m.id; renderModels(); update(); };
        box.appendChild(b);
      });
    }

    function v(id) { return ($(id).value || '').trim(); }
    function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }
    function seg(k, t) { return { k: k, t: t }; }
    function sentence(parts) {
      parts = parts.filter(function (p) { return p[1] && p[1].trim(); });
      if (!parts.length) return [];
      var r = [];
      parts.forEach(function (p, i) {
        var t = p[1].trim();
        if (i === 0) t = cap(t);
        if (i > 0) r.push(seg(null, p[2] !== undefined ? p[2] : ' '));
        r.push(seg(p[0], t));
      });
      r.push(seg(null, '. '));
      return r;
    }
    function labeled(k, lab, t) { return t ? [seg(null, lab + ': '), seg(k, t), seg(null, '. ')] : []; }
    function listJoin(a) { return a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1]; }
    function need(x) { return x || '...'; }

    function buildMake() {
      var m = state.model.make, i2v = $('i2v').checked;
      var S = v('subject'), A = v('action'), W = v('setting'), U = v('audio');
      var C = CAM[$('camera').value][1], L = LIGHT[$('light').value][1], Y = STYLE[$('style').value][1];
      var sound = m === 'veo' ? 'Ambient noise' : m === 'seedance' ? 'Sound' : 'Audio';
      var o = [];
      if (i2v) {
        var move = A ? [[null, 'The subject'], ['action', A]] : [];
        o = o.concat(sentence([['camera', C]]), sentence(move), labeled('audio', sound, U));
      } else {
        var main = [['subject', S], ['action', A], ['setting', W]];
        if (m === 'veo' || m === 'omni') {
          // Google: cinematografie eerst, dan onderwerp, actie, context, stijl en sfeer
          o = o.concat(sentence([['camera', C]]), sentence(main), sentence([['light', L], ['style', Y, ', ']]), labeled('audio', sound, U));
        } else if (m === 'runway') {
          o = o.concat(sentence([['camera', C]]), sentence(main), sentence([['light', L]]), sentence([['style', Y]]), labeled('audio', sound, U));
        } else {
          o = o.concat(sentence(main), sentence([['camera', C]]), sentence([['light', L], ['style', Y, ', ']]), labeled('audio', sound, U));
        }
      }
      o = o.concat(refSegs('make', m));
      if (m === 'omni') o.push(seg(null, 'Single unbroken scene.'));
      return o;
    }

    function refSegs(mode, m) {
      var st = refStyle(m), count = { image: 0, video: 0, audio: 0 }, o = [];
      state.refs.forEach(function (r) {
        count[r.type]++;
        var n = count[r.type] + (r.type === 'video' && mode === 'edit' && st.editVideoOffset ? st.editVideoOffset : 0);
        var R = st.name(r.type, n), D = (r.desc || '').trim().replace(/[.\s]+$/, '');
        var p = {
          'image:subject': ['Use ', ' as the reference for the main subject'],
          'image:style': ['Match the visual style of ', ''],
          'image:setting': ['Use ', ' as the reference for the environment'],
          'image:start': ['Start from ', ' as the first frame'],
          'image:end': ['End on ', ' as the last frame'],
          'video:motion': ['Copy the motion and timing of ', ''],
          'video:camera': ['Follow the camera movement of ', ''],
          'video:style': ['Match the look of ', ''],
          'audio:music': ['Use ', ' as the music'],
          'audio:voice': ['Use ', ' as the voice-over'],
          'audio:sfx': ['Use ', ' for the sound effects']
        }[r.type + ':' + r.role];
        o.push(seg(null, p[0]), seg('ref', R + (D ? ' (' + D + ')' : '')), seg(null, p[1] + '. '));
      });
      return o;
    }

    function renderRefs() {
      var box = $('refs');
      box.innerHTML = state.refs.map(function (r, i) {
        return '<div class="vp-ref" data-i="' + i + '"><span class="vp-ref-tag">' + REF_LABEL[r.type] + '</span><div class="vp-ref-fields">' +
          '<select aria-label="Waarvoor gebruik je deze ' + REF_LABEL[r.type].toLowerCase() + '?">' + REF_ROLES[r.type].map(function (x) {
            return '<option value="' + x[0] + '"' + (x[0] === r.role ? ' selected' : '') + '>' + x[1] + '</option>';
          }).join('') + '</select>' +
          '<input type="text" aria-label="Wat staat erop?" placeholder="' + { image: 'bv. my car, a white SUV', video: 'bv. a slow drone orbit', audio: 'bv. upbeat synthwave' }[r.type] + '" value="' + api.esc(r.desc) + '"></div>' +
          '<button type="button" class="vp-ref-x" aria-label="Verwijder">&times;</button></div>';
      }).join('');
    }

    function buildEdit() {
      var m = state.model.edit, a = $('editAction').value, W = need(v('what')), T = need(v('to'));
      var keeps = [].slice.call(root.querySelectorAll('[data-id="keeps"] input:checked')).map(function (i) {
        return KEEPS.filter(function (k) { return k[0] === i.value; })[0][2];
      });
      var o;
      if (a === 'custom') {
        var C = v('custom').replace(/[.\s]+$/, '') || '...';
        o = m === 'kling' ? [seg(null, 'In @Video, '), seg('act', C)]
          : m === 'seedance' ? [seg(null, 'Edit @Video 1: '), seg('act', C)]
          : [seg('act', cap(C))];
      } else if (m === 'kling') {
        o = {
          replace: [seg('act', 'Change '), seg('what', W), seg('act', ' in @Video to '), seg('to', T)],
          env: [seg('act', 'Change the background in @Video to '), seg('to', T)],
          weather: [seg('act', 'Change the weather in @Video to '), seg('to', T)],
          remove: [seg('act', 'Remove '), seg('what', W), seg('act', ' from @Video')],
          add: [seg('act', 'Add '), seg('what', W), seg('act', ' to @Video')],
          restyle: [seg('act', 'Change the style of @Video to '), seg('to', T)],
          relight: [seg('act', 'Change the lighting in @Video to '), seg('to', T)],
          angle: [seg('act', 'Show the scene in @Video from '), seg('to', T)]
        }[a];
      } else {
        o = {
          replace: [seg('act', 'Replace '), seg('what', W), seg('act', ' with '), seg('to', T)],
          env: [seg('act', 'Replace the environment with '), seg('to', T)],
          weather: [seg('act', 'Change the weather and season to '), seg('to', T)],
          remove: [seg('act', 'Remove '), seg('what', W), seg('act', ' from the scene')],
          add: [seg('act', 'Add '), seg('what', W), seg('act', ' to the scene')],
          restyle: [seg('act', 'Change the style of the video to '), seg('to', T)],
          relight: [seg('act', 'Change the lighting to '), seg('to', T)],
          angle: [seg('act', 'Show the same scene from '), seg('to', T)]
        }[a];
      }
      if (m === 'seedance' && a !== 'custom') o = [seg(null, 'Edit @Video 1: ')].concat(o.map(function (x, i) { return i === 0 ? seg(x.k, x.t.charAt(0).toLowerCase() + x.t.slice(1)) : x; }));
      o = o.concat([seg(null, '. ')]);
      var X = v('extra').replace(/[.\s]+$/, '');
      if (X) o = o.concat([seg('to', cap(X)), seg(null, '. ')]);
      o = o.concat(refSegs('edit', m));
      if (m === 'omni') return o.concat([seg('keep', 'Keep everything else the same.')]);
      if (keeps.length) o = o.concat([seg(null, 'Keep '), seg('keep', listJoin(keeps)), seg(null, ' unchanged.')]);
      return o;
    }

    function update() {
      var make = state.mode === 'make', m = state.model[state.mode], i2v = $('i2v').checked;
      ['subject', 'setting', 'light', 'style'].forEach(function (f) { q('[data-f="' + f + '"]').hidden = i2v; });
      var e = EDIT[$('editAction').value];
      q('[data-f="what"]').hidden = !e.what;
      q('[data-f="to"]').hidden = !e.to;
      q('[data-f="custom"]').hidden = !e.custom;
      q('[data-f="keeps"]').hidden = (m === 'omni');
      if (e.what) $('whatLbl').textContent = e.what;
      if (e.to) $('toLbl').textContent = e.to;

      var segs = make ? buildMake() : buildEdit();
      var out = '', text = '', lens = {}, order = [];
      segs.forEach(function (s) {
        text += s.t;
        if (s.k) {
          out += '<span data-k="' + s.k + '" style="--kc:var(--k-' + s.k + ')">' + api.esc(s.t) + '</span>';
          if (!(s.k in lens)) { lens[s.k] = 0; order.push(s.k); }
          lens[s.k] += s.t.length;
        } else out += api.esc(s.t);
      });
      text = text.trim();
      $('prompt').innerHTML = text ? out : '<span class="vp-empty">Vul links iets in, dan bouwt je prompt zich hier op.</span>';
      var tr = $('track');
      tr.innerHTML = '';
      order.forEach(function (k) {
        var d = document.createElement('div');
        d.style.background = 'var(--k-' + k + ')';
        d.style.flexGrow = Math.max(lens[k], 6);
        d.innerHTML = '<span>' + NAMES[k] + '</span>';
        tr.appendChild(d);
      });
      var model = MODELS[state.mode].filter(function (x) { return x.id === m; })[0];
      $('modelName').textContent = model.name;
      $('tip').innerHTML = model.tip;
      state.text = text;
    }

    [].forEach.call(root.querySelectorAll('.vp-mode button'), function (b) {
      b.onclick = function () {
        state.mode = b.getAttribute('data-mode');
        [].forEach.call(root.querySelectorAll('.vp-mode button'), function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
        $('makeFields').hidden = state.mode !== 'make';
        $('editFields').hidden = state.mode !== 'edit';
        renderModels(); update();
      };
    });
    [].forEach.call(root.querySelectorAll('.vp-act'), function (b) {
      b.onclick = function () {
        [].forEach.call(root.querySelectorAll('.vp-act'), function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
        $('editAction').value = b.getAttribute('data-act');
        applyEditDefaults(); update();
        if (b.getAttribute('data-act') === 'custom') $('custom').focus();
      };
    });
    [].forEach.call(root.querySelectorAll('[data-add]'), function (b) {
      b.onclick = function () {
        var t = b.getAttribute('data-add');
        state.refs.push({ type: t, role: REF_ROLES[t][0][0], desc: '' });
        renderRefs(); update();
        var rows = root.querySelectorAll('.vp-ref'); rows[rows.length - 1].querySelector('input').focus();
      };
    });
    $('refs').addEventListener('input', function (e) {
      var row = e.target.closest('.vp-ref'); if (!row) return;
      var r = state.refs[+row.getAttribute('data-i')];
      if (e.target.tagName === 'SELECT') r.role = e.target.value; else r.desc = e.target.value;
    });
    $('refs').addEventListener('change', function (e) {
      var row = e.target.closest('.vp-ref'); if (row && e.target.tagName === 'SELECT') state.refs[+row.getAttribute('data-i')].role = e.target.value;
    });
    $('refs').addEventListener('click', function (e) {
      if (!e.target.classList.contains('vp-ref-x')) return;
      state.refs.splice(+e.target.closest('.vp-ref').getAttribute('data-i'), 1); renderRefs(); update();
    });
    q('.vp-panel').addEventListener('input', update);
    q('.vp-panel').addEventListener('change', update);

    $('copy').onclick = function () {
      var btn = this, t = state.text || '';
      function ok() {
        btn.textContent = 'Gekopieerd'; btn.classList.add('is-done');
        setTimeout(function () { btn.textContent = 'Kopieer prompt'; btn.classList.remove('is-done'); }, 1800);
        api.track('toolkit_copy', { goodie: 'video-prompts', mode: state.mode, model: state.model[state.mode] });
      }
      function fallback() {
        var ta = document.createElement('textarea');
        ta.value = t; ta.style.position = 'fixed'; ta.style.opacity = '0';
        document.body.appendChild(ta); ta.select();
        try { document.execCommand('copy'); ok(); } catch (e) { btn.textContent = 'Selecteer de prompt en kopieer hem zelf'; }
        document.body.removeChild(ta);
      }
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(ok, fallback);
      else fallback();
    };

    applyEditDefaults();
    renderModels();
    update();
  };
})();

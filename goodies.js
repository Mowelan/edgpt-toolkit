/*
 * Register van de toolkit. Nieuwste goodie = hoogste datum, die staat automatisch bovenaan
 * op /tools en als uitgelichte kaart op /linkinbio.
 *
 * Velden: slug (ook het #anker), title, type (Tool | Prompts | Guide), line (1-2 zinnen),
 * short (korte versie voor /links), video (bronvideo, leest als "Uit ..."), cta (optionele knoptekst), keyword (comment-keyword,
 * alleen voor mijn eigen administratie), date (JJJJ-MM-DD), updated (voetregel), training
 * (optionele eigen regel in het trainingsblok), art (optionele HTML voor het uitgelichte vlak),
 * href (alleen als de goodie een los bestand is, bv. een PDF; dan geen module nodig),
 * icon/image (paden in public/img), group ('video' = uit mijn video's, 'team' = voor je team), aliases (oude ankers), fullBleed (tool zonder eigen marge).
 */
window.EDGPT_TOOLKIT = {
  profile: {
    name: 'Ed van der Molen',
    headline: 'AI begrijpelijk maken voor de gewone mens.',
    tagline: 'Ik test de nieuwste AI-tools en laat zien hoe je ze echt gebruikt. En ik train teams om er zelf mee te werken.',
    photo: 'https://images.squarespace-cdn.com/content/v1/6916e92cba58a67204dfe745/e5fad7c0-4450-4fcf-bd10-ec5ddc23738d/ed_headernew.png?format=500w'
  },
  goodies: [
    {
      slug: 'video-prompts',
      title: 'Video Prompt Bouwer',
      type: 'Tool',
      group: 'video',
      icon: 'img/tool-video-prompts.webp',
      image: 'img/hero-video-prompts.webp',
      training: 'Ik geef praktische AI-trainingen voor marketing- en contentteams, met jullie eigen werk als oefenmateriaal. Wil je dat je team zo met AI-beeld en -video leert werken? In een kennismaking kijken we wat daarvoor nodig is.',
      line: 'Vervang een auto, een omgeving of het weer in je eigen video, of maak een compleet nieuw shot. Kies je model, vul in wat je wilt zien en kopieer je prompt.',
      short: 'De tool uit de drone-video: bouw je prompt voor AI-video in een minuut',
      video: 'mijn drone-video, waarin mijn auto steeds in iets anders verandert',
      keyword: 'PROMPT',
      date: '2026-09-27',
      updated: 'Videomodellen veranderen snel. Deze tool is bijgewerkt in september 2026.',
      art: '<p class="tk-art-prompt">' +
        '<span style="--kc:var(--k-act)">Replace</span> <span style="--kc:var(--k-what)">the car</span> ' +
        '<span style="--kc:var(--k-act)">with</span> <span style="--kc:var(--k-to)">a classic Volkswagen Beetle in pastel blue</span>. ' +
        'Keep <span style="--kc:var(--k-keep)">the camera movement and the road</span> unchanged.</p>'
    },
    /* Voor je team: logica en teksten van de oude /tools-pagina, bediening vernieuwd in goodies/_teamtool.js (27-09-2026). */
    { slug: 'keuzehulp', icon: 'img/tool-keuzehulp.webp', title: 'Model-keuzehulp', type: 'Tool', group: 'team', date: '2026-09-05',
      line: 'Acht vragen over je werk, je team en je data. Je krijgt een advies met uitleg per antwoord en een eerlijk nadeel.' },
    { slug: 'promptbouwer', icon: 'img/tool-promptbouwer.webp', aliases: ['prompt'], title: 'Prompt-bouwer', type: 'Tool', group: 'team', date: '2026-09-05',
      line: 'Rol, taak, context, voorbeelden, format, toon en beperkingen. Je krijgt een prompt die je zo in ChatGPT, Claude, Copilot of Gemini plakt.' },
    { slug: 'tijdwinst', icon: 'img/tool-tijdwinst.webp', title: 'Tijdwinst\u00ADcalculator', type: 'Tool', group: 'team', date: '2026-09-05',
      line: 'Teamgrootte, uren repetitief werk en uurtarief. Je ziet uren per maand en euro per jaar, afgezet tegen een dagdeel of een trainingsdag.' },
    { slug: 'trainingskiezer', icon: 'img/tool-trainingskiezer.webp', title: 'Trainingskiezer', type: 'Tool', group: 'team', date: '2026-09-05',
      line: 'Vier vragen, zes trainingsvormen. Je krijgt de vorm die het beste past en een alternatief om mee te combineren.' },
    { slug: 'ai-act', icon: 'img/tool-ai-act.webp', title: 'AI Act-check', type: 'Tool', group: 'team', date: '2026-09-05',
      line: 'Zes vragen over gebruik, beleid, AI-geletterdheid en risico. Een oriëntatie op waar je staat, geen juridisch advies.' }
  ]
};

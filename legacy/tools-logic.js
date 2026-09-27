
/*
 * EdGPT Tools: logica voor de Tools-pagina (www.ed-gpt.nl/tools)
 * Pure functies, geen DOM, ES5. Werkt in de browser (window.EdTools) en in Node (module.exports).
 *
 * adviseerModel(antwoorden)  -> { advies, alternatief, uitleg[], training, ... }
 * bouwPrompt(velden)         -> string
 * berekenTijdwinst(invoer)   -> { urenPerMaand, euroPerJaar, terugverdienDagen, vergelijkingDagdeel, vergelijkingHeleDag, ... }
 * kiesTraining(antwoorden)   -> { training, waarom, alternatief, ... }
 * aiActCheck(antwoorden)     -> { niveau, punten[], vervolg, ... }
 * samenvatting(tool, resultaat, antwoordregels) -> string (deelbare tekst)
 */
(function (root) {
  'use strict';

  var SITE = 'https://www.ed-gpt.nl';

  var PRIJZEN = { dagdeel: 1250, heleDag: 2250 };

  var AANNAMES = {
    werkwekenPerJaar: 46,
    werkdagenPerJaar: 230,
    standaardWinstPercentage: 20,
    maxTeamgrootte: 500,
    maxUrenPerWeek: 60,
    maxUurtarief: 1000
  };

  var TRAININGEN = {
    'ai-basis': {
      naam: 'AI-basis voor je team',
      kort: 'AI-basis',
      link: '/trainingen#ai-basis',
      pitch: 'Iedereen op hetzelfde startpunt: wat kun je ermee, waar liggen de grenzen, en welke tool zet je wanneer in.'
    },
    'werken-met-claude': {
      naam: 'Werken met Claude',
      kort: 'Werken met Claude',
      link: '/trainingen#werken-met-claude',
      pitch: 'Diep in Claude: projecten, artifacts en lange documenten. Voor teams die verder willen dan losse chats.'
    },
    'ai-agents': {
      naam: 'AI-agents die werk overnemen',
      kort: 'AI-agents',
      link: '/trainingen#ai-agents',
      pitch: 'Agents die taken zelfstandig uitvoeren, van research tot terugkerende workflows. Je leert ze inrichten, sturen en vertrouwen.'
    },
    'vibecoden': {
      naam: 'Vibecoden: tools bouwen zonder code',
      kort: 'Vibecoden',
      link: '/trainingen#vibecoden',
      pitch: 'Bouw je eigen tools, prototypes en interne apps door te beschrijven wat je wilt. Van idee naar werkend prototype in een middag.'
    },
    'content-en-research': {
      naam: 'Content en research',
      kort: 'Content en research',
      link: '/trainingen#content-en-research',
      pitch: 'Van briefing naar eerste versie in jullie tone of voice, en research die je niet elke keer opnieuw begint.'
    },
    'ai-act': {
      naam: 'AI Act en verantwoord werken',
      kort: 'AI Act',
      link: '/trainingen#ai-act',
      pitch: 'Wat de regels praktisch voor jullie betekenen en hoe je laat zien dat je team aantoonbaar met AI kan werken.'
    }
  };

  var TRAINING_VOLGORDE = ['ai-basis', 'content-en-research', 'werken-met-claude', 'ai-agents', 'vibecoden', 'ai-act'];

  var MODELLEN = {
    chatgpt: {
      naam: 'ChatGPT',
      nadeel: 'Breed betekent niet overal het beste. Voor lange documenten en genuanceerd schrijfwerk levert Claude vaak beter werk, en ChatGPT zit niet in je Office-bestanden zoals Copilot.'
    },
    claude: {
      naam: 'Claude',
      nadeel: 'Claude maakt zelf geen beeld of video en heeft een kleiner ecosysteem aan koppelingen dan ChatGPT. Voor beeldwerk heb je er een tweede tool naast nodig.'
    },
    copilot: {
      naam: 'Copilot',
      nadeel: 'Buiten Microsoft 365 heeft Copilot weinig te bieden, en voor lang schrijfwerk of diepe research halen ChatGPT en Claude vaak meer uit dezelfde vraag. De licentie is meestal een aparte add-on.'
    },
    gemini: {
      naam: 'Gemini',
      nadeel: 'Voor het beste schrijfwerk, lange documenten of code kan een losse tool ernaast, Claude of ChatGPT, meer opleveren. En je bent gebonden aan wat er in je Google-abonnement zit.'
    },
    combinatie: {
      naam: 'Een combinatie',
      nadeel: 'Twee tools betekent twee abonnementen, twee sets afspraken over data en meer uitleg aan je team. Begin met een, voeg de tweede toe als het werk erom vraagt.'
    }
  };

  var MODEL_VOLGORDE = ['chatgpt', 'claude', 'copilot', 'gemini'];

  /* ---------- hulpfuncties ---------- */

  function isLeeg(v) {
    return v === undefined || v === null || v === '';
  }

  function tekst(v) {
    if (isLeeg(v)) { return ''; }
    if (Object.prototype.toString.call(v) === '[object Array]') {
      var delen = [];
      for (var i = 0; i < v.length; i++) {
        var t = tekst(v[i]);
        if (t) { delen.push(t); }
      }
      return delen.join('\n');
    }
    return String(v).replace(/\r\n/g, '\n').replace(/^\s+|\s+$/g, '');
  }

  function getal(v, fallback) {
    if (typeof v === 'string') { v = v.replace(',', '.'); }
    var n = parseFloat(v);
    if (isNaN(n) || !isFinite(n)) { return fallback; }
    return n;
  }

  function klem(n, min, max) {
    if (n < min) { return min; }
    if (n > max) { return max; }
    return n;
  }

  function rond(n, decimalen) {
    var f = Math.pow(10, decimalen || 0);
    return Math.round(n * f) / f;
  }

  function formatGetal(n, decimalen) {
    var vast = rond(n, decimalen || 0);
    var negatief = vast < 0;
    var s = String(Math.abs(vast));
    var delen = s.split('.');
    var geheel = delen[0];
    var rest = delen.length > 1 ? delen[1] : '';
    var uit = '';
    var teller = 0;
    for (var i = geheel.length - 1; i >= 0; i--) {
      uit = geheel.charAt(i) + uit;
      teller++;
      if (teller % 3 === 0 && i > 0) { uit = '.' + uit; }
    }
    if (rest) { uit += ',' + rest; }
    return (negatief ? '-' : '') + uit;
  }

  function formatEuro(n) {
    return formatGetal(n, 0) + ' euro';
  }

  function meervoud(n, enkel, meer) {
    return n === 1 ? enkel : meer;
  }

  function trainingInfo(slug) {
    var t = TRAININGEN[slug] || TRAININGEN['ai-basis'];
    return { training: slug, trainingNaam: t.naam, trainingKort: t.kort, trainingLink: t.link, trainingWaarom: t.pitch };
  }

  function rangschik(scores, volgorde) {
    var lijst = volgorde.slice();
    lijst.sort(function (x, y) {
      if (scores[y] !== scores[x]) { return scores[y] - scores[x]; }
      return volgorde.indexOf(x) - volgorde.indexOf(y);
    });
    return lijst;
  }

  /* ---------- 1. Model-keuzehulp ---------- */

  function adviseerModel(antwoorden) {
    var a = antwoorden || {};
    var s = { chatgpt: 0, claude: 0, copilot: 0, gemini: 0 };
    var uitleg = [];
    var beantwoord = 0;
    var ms = a.werkplek === 'microsoft';
    var gg = a.werkplek === 'google';
    var werkplekBekend = ms || gg || a.werkplek === 'anders';

    function punt(model, p) { s[model] += p; }
    function zeg(t) { uitleg.push(t); }

    /* taak */
    switch (a.taak) {
      case 'schrijven':
        beantwoord++; punt('claude', 3); punt('chatgpt', 1);
        zeg('Schrijven en herschrijven: Claude staat bekend om schrijfkwaliteit en nuance. ChatGPT is een goede tweede.');
        break;
      case 'documenten':
        beantwoord++; punt('claude', 3);
        zeg('Lange documenten lezen, samenvatten en vergelijken is precies waar Claude sterk in is.');
        break;
      case 'office':
        beantwoord++; punt('copilot', 3);
        zeg('Werken in Word, Excel en Outlook: Copilot zit daar al in, dus je hoeft niets te kopiëren en plakken.');
        break;
      case 'beeld':
        beantwoord++; punt('chatgpt', 3);
        zeg('Beeld, spraak en video: ChatGPT is op dit vlak de breedste tool.');
        break;
      case 'research':
        beantwoord++; punt('chatgpt', 2); punt('gemini', 1);
        zeg('Research en zoeken op het web: ChatGPT combineert browsen met agentachtige taken. Gemini leunt op Google.');
        break;
      case 'code':
        beantwoord++; punt('claude', 2); punt('chatgpt', 1);
        zeg('Code en prototypes: Claude is sterk in code. ChatGPT kan het ook.');
        break;
      case 'gemengd':
        beantwoord++; punt('chatgpt', 2);
        zeg('Wisselend werk vraagt om de breedste tool, en dat is ChatGPT. Of om twee tools naast elkaar.');
        break;
      default:
        break;
    }

    /* werkplek */
    if (ms) {
      beantwoord++; punt('copilot', 3);
      zeg('Je team leeft in Microsoft 365. Copilot gebruikt jullie tenantdata en de beveiliging die er al staat.');
    } else if (gg) {
      beantwoord++; punt('gemini', 3);
      zeg('Google Workspace: Gemini zit in Gmail, Drive en Docs, dus daar begin je.');
    } else if (a.werkplek === 'anders') {
      beantwoord++; punt('chatgpt', 1); punt('claude', 1);
      zeg('Zonder Microsoft of Google als basis kies je een losse tool. ChatGPT of Claude ligt dan voor de hand.');
    }

    /* data */
    switch (a.data) {
      case 'vertrouwelijk':
        beantwoord++;
        if (ms) {
          punt('copilot', 2);
          zeg('Vertrouwelijke data blijft met Copilot binnen je eigen tenant. Dat is het sterkste argument voor Copilot.');
        } else if (gg) {
          punt('gemini', 1);
          zeg('Vertrouwelijke data: binnen je Google Workspace-abonnement gelden de afspraken van dat abonnement. Check ze met je beheerder voordat het team begint.');
        } else {
          zeg('Vertrouwelijke data: neem een zakelijk abonnement waarbij je data niet wordt gebruikt om modellen te trainen, en leg vast wat er wel en niet in mag. Dat geldt voor ChatGPT en Claude allebei.');
        }
        break;
      case 'intern':
        beantwoord++;
        if (ms) { punt('copilot', 1); }
        zeg('Interne data: een zakelijk account met dataregels is genoeg. Regel het wel voordat het team begint, niet erna.');
        break;
      case 'openbaar':
        beantwoord++;
        zeg('Niet gevoelig: dan telt vooral wat de tool kan, niet waar de data heen gaat.');
        break;
      default:
        break;
    }

    /* lange documenten */
    switch (a.lang) {
      case 'ja':
        beantwoord++; punt('claude', 2); punt('gemini', 1);
        zeg('Lange documenten: Claude verwerkt ze goed en blijft consistent over veel pagina\'s.');
        break;
      case 'soms':
        beantwoord++; punt('claude', 1);
        zeg('Af en toe een lang document: Claude heeft hier een streepje voor, maar het is geen doorslaggevend punt.');
        break;
      case 'nee':
        beantwoord++;
        zeg('Weinig lange documenten: dan speelt contextlengte nauwelijks een rol.');
        break;
      default:
        break;
    }

    /* beeld */
    switch (a.beeld) {
      case 'ja':
        beantwoord++; punt('chatgpt', 3); punt('claude', -2);
        zeg('Beeld, spraak of video: ChatGPT. Claude maakt zelf geen afbeeldingen of video.');
        break;
      case 'nee':
        beantwoord++;
        zeg('Vooral tekst: dan weegt schrijfkwaliteit zwaarder dan beeldfuncties.');
        break;
      default:
        break;
    }

    /* code */
    switch (a.code) {
      case 'ja':
        beantwoord++; punt('claude', 2); punt('chatgpt', 1);
        zeg('Zelf bouwen: Claude is sterk in code, en Vibecoden begint daar. ChatGPT is een goed alternatief.');
        break;
      case 'nee':
        beantwoord++;
        zeg('Geen code nodig: dan telt dit punt niet mee.');
        break;
      default:
        break;
    }

    /* team */
    switch (a.team) {
      case 'klein':
        beantwoord++;
        zeg('Een klein team kan prima met losse accounts starten en later opschalen.');
        break;
      case 'middel':
        beantwoord++;
        zeg('Bij zes tot vijftien mensen wil je afspraken over accounts en data voordat je start. Dat is precies de groepsgrootte van een trainingsdag.');
        break;
      case 'groot':
        beantwoord++;
        if (ms) {
          punt('copilot', 1);
          zeg('Meer dan vijftien mensen: beheer via je Microsoft-licentie scheelt gedoe. Copilot krijgt hier een punt.');
        } else if (gg) {
          punt('gemini', 1);
          zeg('Meer dan vijftien mensen: beheer via je Google-licentie scheelt gedoe. Gemini krijgt hier een punt.');
        } else {
          zeg('Meer dan vijftien mensen: kies een zakelijk abonnement met centraal beheer, welke tool het ook wordt.');
        }
        break;
      default:
        break;
    }

    /* budget */
    switch (a.budget) {
      case 'proberen':
        beantwoord++; punt('chatgpt', 1); punt('claude', 1);
        if (a.data === 'vertrouwelijk') {
          zeg('Gratis proberen kan met ChatGPT en Claude, maar niet met vertrouwelijke data. Test met openbaar materiaal tot je een zakelijk account hebt.');
        } else {
          zeg('Gratis proberen kan met ChatGPT en Claude. Zet er geen vertrouwelijke data in tot je een zakelijk account hebt.');
        }
        break;
      case 'per-persoon':
        beantwoord++;
        zeg('Betalen per gebruiker: dan kies je op wat de tool kan, niet op wat je al hebt.');
        break;
      case 'licentie':
        beantwoord++;
        if (ms) {
          punt('copilot', 2);
          zeg('Binnen je Microsoft-licentie blijven: Copilot is dan de logische stap. Meestal een aparte add-on, check dat bij je IT-beheerder.');
        } else if (gg) {
          punt('gemini', 2);
          zeg('Binnen je Google-licentie blijven: Gemini. Check bij je beheerder welke functies in jullie abonnement zitten.');
        } else {
          zeg('Je hebt geen Microsoft- of Google-licentie als basis, dus dit argument valt weg. Kies op wat de tool kan.');
        }
        break;
      default:
        break;
    }

    /* Copilot en Gemini hebben alleen zin binnen hun eigen werkplek. */
    if (werkplekBekend && !ms) { punt('copilot', -3); }
    if (werkplekBekend && !gg) { punt('gemini', -3); }

    var rang = rangschik(s, MODEL_VOLGORDE);
    var top = rang[0];
    var tweede = rang[1];
    var advies;
    var combinatie = null;
    var toelichting;

    if (beantwoord === 0) {
      advies = 'combinatie';
      combinatie = ['chatgpt', 'claude'];
      toelichting = 'Je hebt nog niets ingevuld. Zonder antwoorden is het eerlijke advies: begin met ChatGPT of Claude naast elkaar en kijk wat je team het meest gebruikt.';
    } else if (s[top] < 3 || (s[top] - s[tweede] <= 1 && s[tweede] > 0)) {
      advies = 'combinatie';
      combinatie = s[tweede] > 0 ? [top, tweede] : [top, (top === 'claude' ? 'chatgpt' : 'claude')];
      toelichting = MODELLEN[combinatie[0]].naam + ' en ' + MODELLEN[combinatie[1]].naam + ' liggen op je antwoorden dicht bij elkaar. Gebruik ze naast elkaar, elk voor waar hij goed in is.';
    } else {
      advies = top;
      toelichting = MODELLEN[top].naam + ' scoort op je antwoorden duidelijk hoger dan ' + MODELLEN[tweede].naam + '.';
    }

    if (advies === 'copilot' && !werkplekBekend) {
      zeg('Let op: Copilot heeft alleen zin als je team in Microsoft 365 werkt. Vul de werkplek-vraag in om dat zeker te weten.');
    }

    var alternatief = null;
    if (advies === 'combinatie') {
      alternatief = combinatie[0];
    } else if (s[tweede] > 0) {
      alternatief = tweede;
    }

    /* training */
    var trainingSlug;
    if (a.taak === 'code') {
      trainingSlug = 'vibecoden';
    } else if (advies === 'claude') {
      trainingSlug = 'werken-met-claude';
    } else if (advies === 'chatgpt' && (a.taak === 'beeld' || a.taak === 'research' || a.taak === 'schrijven')) {
      trainingSlug = 'content-en-research';
    } else if (advies === 'chatgpt' && a.code === 'ja') {
      trainingSlug = 'vibecoden';
    } else {
      trainingSlug = 'ai-basis';
    }

    var uit = {
      advies: advies,
      adviesNaam: advies === 'combinatie'
        ? MODELLEN[combinatie[0]].naam + ' en ' + MODELLEN[combinatie[1]].naam + ' naast elkaar'
        : MODELLEN[advies].naam,
      combinatie: combinatie,
      alternatief: alternatief,
      alternatiefNaam: alternatief ? MODELLEN[alternatief].naam : null,
      toelichting: toelichting,
      uitleg: uitleg,
      nadeel: MODELLEN[advies].nadeel,
      scores: { chatgpt: s.chatgpt, claude: s.claude, copilot: s.copilot, gemini: s.gemini },
      beantwoord: beantwoord
    };
    var ti = trainingInfo(trainingSlug);
    for (var k in ti) { if (ti.hasOwnProperty(k)) { uit[k] = ti[k]; } }
    return uit;
  }

  /* ---------- 2. Prompt-bouwer ---------- */

  function bouwPrompt(velden) {
    var v = velden || {};
    var rol = tekst(v.rol);
    var taak = tekst(v.taak);
    var context = tekst(v.context);
    var voorbeelden = tekst(v.voorbeelden);
    var format = tekst(v.format);
    var toon = tekst(v.toon);
    var beperkingen = tekst(v.beperkingen);
    var vragenVooraf = v.vragenVooraf === true || v.vragenVooraf === 'true' || v.vragenVooraf === 'ja' || v.vragenVooraf === 1;

    var blokken = [];

    if (rol) {
      var r = rol.replace(/^je bent\s+/i, '').replace(/[.\s]+$/, '');
      blokken.push('Je bent ' + r + '.');
    }
    if (taak) {
      blokken.push('Opdracht:\n' + taak);
    }
    if (context) {
      blokken.push('Context:\n' + context);
    }
    if (voorbeelden) {
      blokken.push('Voorbeelden van wat ik goed vind:\n' + voorbeelden);
    }
    if (format) {
      blokken.push('Format:\n' + format);
    }
    if (toon) {
      blokken.push('Toon:\n' + toon);
    }
    if (beperkingen) {
      blokken.push('Beperkingen:\n' + beperkingen);
    }

    if (blokken.length === 0) { return ''; }

    if (vragenVooraf) {
      blokken.push('Als iets onduidelijk is, stel dan eerst je vragen voordat je begint.');
    }

    return blokken.join('\n\n');
  }

  /* ---------- 3. Tijdwinstcalculator ---------- */

  function berekenTijdwinst(invoer) {
    var i = invoer || {};
    var waarschuwingen = [];

    var teamgrootte = getal(i.teamgrootte, 0);
    var urenPerWeek = getal(i.urenPerWeek, 0);
    var uurtarief = getal(i.uurtarief, 0);
    var winst = getal(i.winstPercentage, AANNAMES.standaardWinstPercentage);

    if (teamgrootte < 0) { teamgrootte = 0; }
    if (urenPerWeek < 0) { urenPerWeek = 0; }
    if (uurtarief < 0) { uurtarief = 0; }

    if (teamgrootte > AANNAMES.maxTeamgrootte) {
      teamgrootte = AANNAMES.maxTeamgrootte;
      waarschuwingen.push('Teamgrootte begrensd op ' + AANNAMES.maxTeamgrootte + '. Voor grotere organisaties rekenen we liever per afdeling.');
    }
    if (urenPerWeek > AANNAMES.maxUrenPerWeek) {
      urenPerWeek = AANNAMES.maxUrenPerWeek;
      waarschuwingen.push('Uren per week begrensd op ' + AANNAMES.maxUrenPerWeek + '. Meer uren repetitief werk per week is niet realistisch.');
    }
    if (uurtarief > AANNAMES.maxUurtarief) {
      uurtarief = AANNAMES.maxUurtarief;
      waarschuwingen.push('Uurtarief begrensd op ' + AANNAMES.maxUurtarief + ' euro.');
    }
    if (winst < 0 || winst > 100) {
      winst = klem(winst, 0, 100);
      waarschuwingen.push('Tijdwinst begrensd op ' + winst + ' procent.');
    }

    teamgrootte = Math.floor(teamgrootte);

    var fractie = winst / 100;
    var urenTotaalPerJaar = teamgrootte * urenPerWeek * AANNAMES.werkwekenPerJaar;
    var urenPerJaar = urenTotaalPerJaar * fractie;
    var urenPerMaand = urenPerJaar / 12;
    var euroPerJaar = urenPerJaar * uurtarief;
    var euroPerMaand = euroPerJaar / 12;
    var euroPerWerkdag = euroPerJaar / AANNAMES.werkdagenPerJaar;

    function vergelijk(prijs, naam) {
      var dagen = null;
      var keerPerJaar = 0;
      var t;
      if (euroPerWerkdag > 0) {
        dagen = Math.ceil(prijs / euroPerWerkdag);
        keerPerJaar = rond(euroPerJaar / prijs, 1);
        if (dagen > AANNAMES.werkdagenPerJaar) {
          t = naam + ' (' + formatEuro(prijs) + ') is bij deze cijfers niet binnen een jaar terugverdiend. Dan is training vooral zinvol om andere redenen dan tijdwinst, zoals kwaliteit of AI-geletterdheid.';
        } else {
          t = naam + ' (' + formatEuro(prijs) + ') is terugverdiend in ' + dagen + ' ' + meervoud(dagen, 'werkdag', 'werkdagen') + '. Per jaar levert de tijdwinst ' + formatGetal(keerPerJaar, 1) + ' keer de prijs op.';
        }
      } else {
        t = naam + ' (' + formatEuro(prijs) + '): niet te berekenen zonder uren of uurtarief.';
      }
      return { prijs: prijs, terugverdienDagen: dagen, keerPerJaar: keerPerJaar, tekst: t };
    }

    var dagdeel = vergelijk(PRIJZEN.dagdeel, 'Een dagdeel');
    var heleDag = vergelijk(PRIJZEN.heleDag, 'Een trainingsdag');

    return {
      invoer: { teamgrootte: teamgrootte, urenPerWeek: urenPerWeek, uurtarief: uurtarief, winstPercentage: winst },
      urenTotaalPerMaand: rond(urenTotaalPerJaar / 12, 1),
      urenTotaalPerJaar: rond(urenTotaalPerJaar, 1),
      urenPerMaand: rond(urenPerMaand, 1),
      urenPerJaar: rond(urenPerJaar, 1),
      euroPerMaand: Math.round(euroPerMaand),
      euroPerJaar: Math.round(euroPerJaar),
      terugverdienDagen: heleDag.terugverdienDagen,
      vergelijkingDagdeel: dagdeel,
      vergelijkingHeleDag: heleDag,
      aannames: {
        werkwekenPerJaar: AANNAMES.werkwekenPerJaar,
        werkdagenPerJaar: AANNAMES.werkdagenPerJaar,
        prijsDagdeel: PRIJZEN.dagdeel,
        prijsHeleDag: PRIJZEN.heleDag
      },
      waarschuwingen: waarschuwingen,
      berekenbaar: euroPerJaar > 0
    };
  }

  /* ---------- 4. Trainingskiezer ---------- */

  var TRAINING_REDENEN = {
    'ai-basis': {
      'ervaring.start': 'je team net begint',
      'ervaring.chat': 'je team nog niet verder komt dan een vraag stellen',
      'doel.basis': 'je wilt dat iedereen dezelfde taal spreekt'
    },
    'werken-met-claude': {
      'ervaring.gevorderd': 'je team al met context en templates werkt',
      'ervaring.chat': 'je team verder wil dan losse chats',
      'werk.documenten': 'lange documenten en rapporten de meeste tijd kosten',
      'doel.content': 'content sneller naar een eerste versie moet',
      'werk.content': 'content maken en herschrijven veel tijd kost'
    },
    'ai-agents': {
      'doel.automatiseren': 'je wilt dat terugkerend werk zonder iemand erbij loopt',
      'werk.herhaalwerk': 'dezelfde rapportage of ronde elke week terugkomt',
      'ervaring.gevorderd': 'je team de basis al beheerst'
    },
    'vibecoden': {
      'doel.bouwen': 'je zelf tools en prototypes wilt maken',
      'werk.handwerk': 'er handwerk ligt waar een klein tooltje voor zou moeten zijn',
      'ervaring.gevorderd': 'je team de basis al beheerst'
    },
    'content-en-research': {
      'doel.content': 'content en research sneller naar een eerste versie moeten',
      'werk.content': 'content maken en herschrijven de meeste tijd kost',
      'werk.research': 'research nu elke keer opnieuw begint',
      'ervaring.chat': 'je team al chat maar er meer uit wil halen'
    },
    'ai-act': {
      'regels.urgent': 'je iets moet kunnen laten zien over verantwoord AI-gebruik',
      'doel.verantwoord': 'je wilt aantonen dat je team verantwoord met AI werkt',
      'regels.komt': 'de AI Act eraan komt'
    }
  };

  function kiesTraining(antwoorden) {
    var a = antwoorden || {};
    var s = { 'ai-basis': 0, 'content-en-research': 0, 'werken-met-claude': 0, 'ai-agents': 0, 'vibecoden': 0, 'ai-act': 0 };
    var beantwoord = 0;
    var gekozen = [];

    function punt(t, p) { s[t] += p; }

    switch (a.ervaring) {
      case 'start':
        beantwoord++; gekozen.push('ervaring.start');
        punt('ai-basis', 3); punt('ai-agents', -2); punt('vibecoden', -1);
        break;
      case 'chat':
        beantwoord++; gekozen.push('ervaring.chat');
        punt('ai-basis', 1); punt('werken-met-claude', 1); punt('content-en-research', 1);
        break;
      case 'gevorderd':
        beantwoord++; gekozen.push('ervaring.gevorderd');
        punt('werken-met-claude', 2); punt('ai-agents', 1); punt('vibecoden', 1); punt('ai-basis', -2);
        break;
      default:
        break;
    }

    switch (a.doel) {
      case 'basis':
        beantwoord++; gekozen.push('doel.basis');
        punt('ai-basis', 3);
        break;
      case 'content':
        beantwoord++; gekozen.push('doel.content');
        punt('content-en-research', 3); punt('werken-met-claude', 1);
        break;
      case 'automatiseren':
        beantwoord++; gekozen.push('doel.automatiseren');
        punt('ai-agents', 3);
        break;
      case 'bouwen':
        beantwoord++; gekozen.push('doel.bouwen');
        punt('vibecoden', 3);
        break;
      case 'verantwoord':
        beantwoord++; gekozen.push('doel.verantwoord');
        punt('ai-act', 4);
        break;
      default:
        break;
    }

    switch (a.werk) {
      case 'content':
        beantwoord++; gekozen.push('werk.content');
        punt('content-en-research', 2); punt('werken-met-claude', 1);
        break;
      case 'documenten':
        beantwoord++; gekozen.push('werk.documenten');
        punt('werken-met-claude', 3);
        break;
      case 'research':
        beantwoord++; gekozen.push('werk.research');
        punt('content-en-research', 3);
        break;
      case 'herhaalwerk':
        beantwoord++; gekozen.push('werk.herhaalwerk');
        punt('ai-agents', 3);
        break;
      case 'handwerk':
        beantwoord++; gekozen.push('werk.handwerk');
        punt('vibecoden', 3);
        break;
      default:
        break;
    }

    switch (a.regels) {
      case 'urgent':
        beantwoord++; gekozen.push('regels.urgent');
        punt('ai-act', 4);
        break;
      case 'komt':
        beantwoord++; gekozen.push('regels.komt');
        punt('ai-act', 1);
        break;
      case 'nee':
        beantwoord++;
        break;
      default:
        break;
    }

    var rang = rangschik(s, TRAINING_VOLGORDE);
    var winnaar = rang[0];
    var tweede = rang[1];

    if (beantwoord === 0 || s[winnaar] <= 0) {
      winnaar = 'ai-basis';
      tweede = null;
    }

    function redenen(slug) {
      var lijst = [];
      var tabel = TRAINING_REDENEN[slug] || {};
      for (var i = 0; i < gekozen.length; i++) {
        if (tabel[gekozen[i]]) { lijst.push(tabel[gekozen[i]]); }
      }
      return lijst;
    }

    function zinnen(lijst) {
      if (lijst.length === 0) { return ''; }
      if (lijst.length === 1) { return lijst[0]; }
      return lijst.slice(0, lijst.length - 1).join(', ') + ' en ' + lijst[lijst.length - 1];
    }

    var waarom;
    var redenenWinnaar = redenen(winnaar);
    if (beantwoord === 0) {
      waarom = 'Je hebt nog niets ingevuld. Zonder antwoorden begin ik bij de basis: dan staat iedereen op hetzelfde startpunt.';
    } else if (redenenWinnaar.length === 0) {
      waarom = TRAININGEN[winnaar].kort + ' is het veiligste startpunt bij deze antwoorden. ' + TRAININGEN[winnaar].pitch;
    } else {
      waarom = TRAININGEN[winnaar].kort + ' past omdat ' + zinnen(redenenWinnaar) + '. ' + TRAININGEN[winnaar].pitch;
    }

    var alternatief = null;
    var alternatiefWaarom = null;
    var combineer = false;
    if (tweede && s[tweede] > 0) {
      alternatief = tweede;
      combineer = (s[winnaar] - s[tweede]) <= 1;
      var redenenAlt = redenen(tweede);
      if (redenenAlt.length > 0) {
        alternatiefWaarom = TRAININGEN[tweede].kort + ' sluit hierbij aan omdat ' + zinnen(redenenAlt) + '.';
      } else {
        alternatiefWaarom = TRAININGEN[tweede].kort + ' is een logische tweede vorm op dezelfde dag.';
      }
      if (combineer) {
        alternatiefWaarom += ' De twee liggen op je antwoorden dicht bij elkaar; combineer ze op een dag.';
      }
    } else if (winnaar !== 'ai-basis' && a.ervaring === 'start') {
      alternatief = 'ai-basis';
      alternatiefWaarom = 'Je team begint net. Doe AI-basis in de ochtend, dan landt de rest in de middag.';
    }

    /* AI-agents of Vibecoden voor een beginnend team: basis erbij */
    if ((winnaar === 'ai-agents' || winnaar === 'vibecoden') && a.ervaring === 'start' && alternatief !== 'ai-basis') {
      alternatief = 'ai-basis';
      alternatiefWaarom = 'Je team begint net. Doe AI-basis in de ochtend, dan landt ' + TRAININGEN[winnaar].kort + ' in de middag.';
      combineer = true;
    }

    return {
      training: winnaar,
      naam: TRAININGEN[winnaar].naam,
      kort: TRAININGEN[winnaar].kort,
      link: TRAININGEN[winnaar].link,
      waarom: waarom,
      alternatief: alternatief,
      alternatiefNaam: alternatief ? TRAININGEN[alternatief].naam : null,
      alternatiefLink: alternatief ? TRAININGEN[alternatief].link : null,
      alternatiefWaarom: alternatiefWaarom,
      combineer: combineer,
      scores: s,
      beantwoord: beantwoord
    };
  }

  /* ---------- 5. AI Act-oriëntatie ---------- */

  var AIACT_PUNTEN = {
    'gebruik.breed': { score: 2, tekst: 'AI wordt breed gebruikt. Dan geldt de plicht tot AI-geletterdheid (artikel 4 AI Act, sinds 2 februari 2025) voor iedereen die ermee werkt.' },
    'gebruik.beperkt': { score: 1, tekst: 'Een paar mensen gebruiken AI. Breng in kaart wie, waarvoor en met welke data. Ook voor hen geldt de plicht tot AI-geletterdheid.' },
    'gebruik.nee': { score: 0, tekst: 'Nog geen AI-gebruik. Reken erop dat het toch gebeurt, op privé-accounts. Een korte afspraak vooraf voorkomt dat.' },
    'gebruik.onbekend': { score: 2, tekst: 'Je weet niet wie wat gebruikt. Dat is het eerste dat je regelt: een inventarisatie, geen verbod. Blokkeren werkt averechts.' },

    'beleid.ja': { score: 0, tekst: 'Er is beleid. Check of het over de tools van nu gaat en of iedereen het kent.' },
    'beleid.informeel': { score: 1, tekst: 'Informele afspraken zijn een begin, maar niet aantoonbaar. Zet ze op een A4: welke tools, welke data, wie kijkt het werk na.' },
    'beleid.nee': { score: 2, tekst: 'Geen afspraken. Begin met een A4: welke tools mogen, welke data er niet in mag en wie het werk nakijkt.' },

    'geletterdheid.aantoonbaar': { score: 0, tekst: 'AI-geletterdheid is geregeld en aantoonbaar. Bewaar deelnemerslijsten en inhoud; dat is wat je later moet kunnen laten zien.' },
    'geletterdheid.deels': { score: 1, tekst: 'Deels geregeld. Maak het compleet en leg vast wie wanneer welke training heeft gehad.' },
    'geletterdheid.nee': { score: 2, tekst: 'AI-geletterdheid is niet geregeld. Dit is de verplichting die al geldt, voor elke organisatie die AI inzet. Een trainingsdag met verslag is een concrete manier om het aantoonbaar te maken.' },

    'hoogrisico.ja': { score: 4, tekst: 'AI bij beslissingen over mensen (werving, beoordeling, krediet, toegang tot diensten) valt mogelijk onder hoog risico. Daar gelden de zwaarste eisen. Laat dit door een jurist beoordelen.' },
    'hoogrisico.misschien': { score: 2, tekst: 'Onduidelijk of AI meebeslist over mensen. Zoek dat uit; het verschil tussen hulpmiddel en beslisser is hier bepalend.' },
    'hoogrisico.nee': { score: 0, tekst: 'Geen AI bij beslissingen over mensen. Dan blijven de zwaarste eisen buiten beeld, zolang dat zo blijft.' },

    'persoonsgegevens.ja': { score: 2, tekst: 'Persoonsgegevens of klantdata gaan de tools in. Dat raakt de AVG net zo hard als de AI Act: zakelijke accounts, een verwerkersovereenkomst en duidelijke afspraken over wat er niet in mag.' },
    'persoonsgegevens.soms': { score: 1, tekst: 'Soms gaan er persoonsgegevens in. Maak duidelijk wanneer dat wel en niet mag, en regel een zakelijk account.' },
    'persoonsgegevens.nee': { score: 0, tekst: 'Geen persoonsgegevens in de tools. Houd dat vol en zet het in de afspraken.' },

    'transparantie.ja': { score: 1, tekst: 'Je zet AI in richting klanten of publiceert AI-gemaakte beelden. Voor chatbots en bepaalde AI-gegenereerde content gelden transparantieverplichtingen: mensen moeten weten dat ze met AI te maken hebben.' },
    'transparantie.nee': { score: 0, tekst: 'Geen AI-chatbots of AI-beelden naar buiten. Dan speelt transparantie richting klanten nu niet.' }
  };

  var AIACT_VRAGEN = ['gebruik', 'beleid', 'geletterdheid', 'hoogrisico', 'persoonsgegevens', 'transparantie'];

  var AIACT_VERVOLG = {
    'op-orde': {
      tekst: 'Wil je het scherp houden? De AI Act-training gaat over wat de regels praktisch betekenen voor jullie werk, en hoe je dat aantoonbaar houdt.',
      link: '/trainingen#ai-act',
      linkTekst: 'Bekijk de AI Act-training'
    },
    'aandacht': {
      tekst: 'De AI Act-training maakt AI-geletterdheid in een dag aantoonbaar en levert de afspraken op die je nog mist. Voor de juridische kant schakel je een jurist in.',
      link: '/trainingen#ai-act',
      linkTekst: 'Bekijk de AI Act-training'
    },
    'prioriteit': {
      tekst: 'Plan een kennismaking; dan kijken we welke stappen deze maand nodig zijn en wat een trainingsdag daarin doet. Voor toepassingen met impact op mensen schakel je daarnaast een jurist in.',
      link: '/contact',
      linkTekst: 'Plan een kennismaking'
    },
    'onbekend': {
      tekst: 'Beantwoord alle zes de vragen om een oriëntatie te krijgen.',
      link: '/trainingen#ai-act',
      linkTekst: 'Bekijk de AI Act-training'
    }
  };

  function aiActCheck(antwoorden) {
    var a = antwoorden || {};
    var score = 0;
    var punten = [];
    var beantwoord = 0;
    var hoogrisico = false;

    for (var i = 0; i < AIACT_VRAGEN.length; i++) {
      var vraag = AIACT_VRAGEN[i];
      var waarde = a[vraag];
      if (isLeeg(waarde)) { continue; }
      var sleutel = vraag + '.' + waarde;
      var p = AIACT_PUNTEN[sleutel];
      if (!p) { continue; }
      beantwoord++;
      score += p.score;
      punten.push(p.tekst);
      if (sleutel === 'hoogrisico.ja') { hoogrisico = true; }
    }

    var niveau;
    if (beantwoord === 0) {
      niveau = 'onbekend';
    } else if (hoogrisico || score >= 8) {
      niveau = 'prioriteit';
    } else if (score >= 4) {
      niveau = 'aandacht';
    } else if (beantwoord < 5) {
      niveau = 'onbekend';
    } else {
      niveau = 'op-orde';
    }

    var v = AIACT_VERVOLG[niveau];

    return {
      niveau: niveau,
      score: score,
      punten: punten,
      vervolg: v.tekst,
      vervolgLink: v.link,
      vervolgLinkTekst: v.linkTekst,
      hoogrisico: hoogrisico,
      beantwoord: beantwoord,
      disclaimer: 'Dit is een oriëntatie, geen juridisch advies. Voor een beoordeling van jullie situatie schakel je een jurist in.'
    };
  }

  /* ---------- Deelbare samenvatting ---------- */

  function regelsVanAntwoorden(antwoordregels) {
    var uit = [];
    if (!antwoordregels || !antwoordregels.length) { return uit; }
    for (var i = 0; i < antwoordregels.length; i++) {
      var r = antwoordregels[i] || {};
      if (isLeeg(r.antwoord)) { continue; }
      uit.push('- ' + (r.vraag ? r.vraag + ': ' : '') + r.antwoord);
    }
    return uit;
  }

  function samenvatting(tool, resultaat, antwoordregels) {
    var r = resultaat || {};
    var regels = [];
    var antwoorden = regelsVanAntwoorden(antwoordregels);
    var i;

    switch (tool) {
      case 'keuzehulp':
        regels.push('EdGPT model-keuzehulp');
        regels.push('Advies: ' + (r.adviesNaam || 'nog geen advies'));
        if (r.toelichting) { regels.push(r.toelichting); }
        if (antwoorden.length) { regels.push(''); regels.push('Antwoorden:'); regels = regels.concat(antwoorden); }
        if (r.uitleg && r.uitleg.length) {
          regels.push(''); regels.push('Waarom:');
          for (i = 0; i < r.uitleg.length; i++) { regels.push('- ' + r.uitleg[i]); }
        }
        if (r.nadeel) { regels.push(''); regels.push('Eerlijk nadeel: ' + r.nadeel); }
        if (r.alternatiefNaam && r.advies !== 'combinatie') { regels.push('Alternatief: ' + r.alternatiefNaam); }
        if (r.trainingNaam) { regels.push(''); regels.push('Passende training: ' + r.trainingNaam + ' (' + SITE + r.trainingLink + ')'); }
        regels.push(''); regels.push('Zelf doen: ' + SITE + '/tools#keuzehulp');
        break;

      case 'promptbouwer':
        regels.push('Prompt, gebouwd met de EdGPT prompt-bouwer');
        regels.push('');
        regels.push(typeof r === 'string' ? r : (r.prompt || ''));
        regels.push('');
        regels.push('Zelf bouwen: ' + SITE + '/tools#promptbouwer');
        break;

      case 'tijdwinst':
        regels.push('EdGPT tijdwinstcalculator');
        if (r.invoer) {
          regels.push('Team van ' + r.invoer.teamgrootte + ', ' + formatGetal(r.invoer.urenPerWeek, 1) + ' uur per persoon per week aan repetitief werk, ' + formatEuro(r.invoer.uurtarief) + ' per uur, ' + r.invoer.winstPercentage + ' procent tijdwinst.');
        }
        regels.push('');
        regels.push('Gewonnen uren per maand: ' + formatGetal(r.urenPerMaand || 0, 1));
        regels.push('Waarde per jaar: ' + formatEuro(r.euroPerJaar || 0));
        if (r.vergelijkingDagdeel && r.vergelijkingDagdeel.tekst) { regels.push(r.vergelijkingDagdeel.tekst); }
        if (r.vergelijkingHeleDag && r.vergelijkingHeleDag.tekst) { regels.push(r.vergelijkingHeleDag.tekst); }
        if (r.waarschuwingen && r.waarschuwingen.length) {
          regels.push('');
          for (i = 0; i < r.waarschuwingen.length; i++) { regels.push('Let op: ' + r.waarschuwingen[i]); }
        }
        regels.push('');
        regels.push('Rekenvoorbeeld, geen belofte. 46 werkweken per jaar, prijzen vanaf en ex btw.');
        regels.push('Zelf rekenen: ' + SITE + '/tools#tijdwinst');
        break;

      case 'trainingskiezer':
        regels.push('EdGPT trainingskiezer');
        regels.push('Advies: ' + (r.naam || 'nog geen advies'));
        if (r.waarom) { regels.push(r.waarom); }
        if (r.alternatiefNaam) { regels.push('Combineer met: ' + r.alternatiefNaam + (r.alternatiefWaarom ? '. ' + r.alternatiefWaarom : '')); }
        if (antwoorden.length) { regels.push(''); regels.push('Antwoorden:'); regels = regels.concat(antwoorden); }
        if (r.link) { regels.push(''); regels.push('Meer over deze training: ' + SITE + r.link); }
        regels.push('Zelf doen: ' + SITE + '/tools#trainingskiezer');
        break;

      case 'aiact':
        regels.push('EdGPT AI Act-oriëntatie');
        regels.push('Oriëntatie: ' + (r.niveau === 'op-orde' ? 'basis staat' : r.niveau === 'aandacht' ? 'aandacht nodig' : r.niveau === 'prioriteit' ? 'prioriteit' : 'nog geen beeld'));
        if (antwoorden.length) { regels.push(''); regels.push('Antwoorden:'); regels = regels.concat(antwoorden); }
        if (r.punten && r.punten.length) {
          regels.push(''); regels.push('Wat dit betekent:');
          for (i = 0; i < r.punten.length; i++) { regels.push('- ' + r.punten[i]); }
        }
        if (r.vervolg) { regels.push(''); regels.push('Eerste stap: ' + r.vervolg); }
        if (r.vervolgLink) { regels.push(SITE + r.vervolgLink); }
        regels.push('');
        regels.push('Oriëntatie, geen juridisch advies. Zelf doen: ' + SITE + '/tools#ai-act');
        break;

      default:
        regels.push('EdGPT tools: ' + SITE + '/tools');
        break;
    }

    return regels.join('\n');
  }

  var EdTools = {
    adviseerModel: adviseerModel,
    bouwPrompt: bouwPrompt,
    berekenTijdwinst: berekenTijdwinst,
    kiesTraining: kiesTraining,
    aiActCheck: aiActCheck,
    samenvatting: samenvatting,
    formatEuro: formatEuro,
    formatGetal: formatGetal,
    TRAININGEN: TRAININGEN,
    MODELLEN: MODELLEN,
    PRIJZEN: PRIJZEN,
    AANNAMES: AANNAMES,
    SITE: SITE
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = EdTools;
  } else {
    root.EdTools = EdTools;
  }
})(typeof window !== 'undefined' ? window : this);

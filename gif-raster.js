/*
 * Gif naar raster (13-11-2026). Staat in de blog op www.ed-gpt.nl/gif.
 * Zet een gifje (of een korte video, zoals een WhatsApp-"gif" die op iPhone als mp4 bewaard is)
 * om naar 9 of 6 losse frames, gelijk verdeeld over de tijd. Die frames plus een foto van jezelf
 * gaan naar ChatGPT; zo ziet het model de echte frames in plaats van één stilstaand beeld.
 * Alles gebeurt in de browser van de bezoeker; er wordt niets geüpload.
 *
 * Gebruik in Squarespace (codeblok):
 *   <div class="edgpt-gif-raster"></div>
 *   <script src="https://mowelan.github.io/edgpt-toolkit/gif-raster.js" defer></script>
 * Eigen GIF-decoder (LZW, interlace, disposal 2 en 3), geen externe bibliotheken.
 */
(function () {
  'use strict';

  /* ---------- GIF lezen ---------- */
  function GifError(msg) { this.message = msg; }

  function parseGif(buf) {
    var b = new Uint8Array(buf), p = 0;
    function u8() { return b[p++]; }
    function u16() { var v = b[p] | (b[p + 1] << 8); p += 2; return v; }
    function subBlocks() { var parts = [], len = 0, n; while ((n = b[p++])) { parts.push(b.subarray(p, p + n)); len += n; p += n; } var out = new Uint8Array(len), o = 0; for (var i = 0; i < parts.length; i++) { out.set(parts[i], o); o += parts[i].length; } return out; }
    function skipBlocks() { var n; while ((n = b[p++])) p += n; }
    var sig = String.fromCharCode(b[0], b[1], b[2], b[3], b[4], b[5]);
    if (sig !== 'GIF87a' && sig !== 'GIF89a') throw new GifError('Dit is geen gifbestand.');
    p = 6;
    var W = u16(), H = u16(), f = u8(); u8(); u8();
    var gct = null;
    if (f & 0x80) { var n = 3 * (1 << ((f & 7) + 1)); gct = b.subarray(p, p + n); p += n; }
    var frames = [], gce = { disposal: 0, delay: 0, transparent: -1 };
    while (p < b.length) {
      var c = u8();
      if (c === 0x3B) break;
      if (c === 0x21) {
        var label = u8();
        if (label === 0xF9) { u8(); var pf = u8(); var d = u16(); var ti = u8(); u8();
          gce = { disposal: (pf >> 2) & 7, delay: d, transparent: (pf & 1) ? ti : -1 }; }
        else skipBlocks();
      } else if (c === 0x2C) {
        var x = u16(), y = u16(), w = u16(), h = u16(), ff = u8(), lct = null;
        if (ff & 0x80) { var ln = 3 * (1 << ((ff & 7) + 1)); lct = b.subarray(p, p + ln); p += ln; }
        var min = u8(), data = subBlocks();
        frames.push({ x: x, y: y, w: w, h: h, interlace: !!(ff & 0x40), pal: lct || gct, min: min, data: data,
          disposal: gce.disposal, delay: gce.delay, transparent: gce.transparent });
        gce = { disposal: 0, delay: 0, transparent: -1 };
      } else if (p >= b.length) { break; }
      else throw new GifError('Dit gifje lijkt beschadigd.');
    }
    if (!frames.length) throw new GifError('In dit gifje staan geen beelden.');
    return { width: W, height: H, frames: frames };
  }

  function lzw(min, data, count) {
    var out = new Uint8Array(count), clear = 1 << min, eoi = clear + 1;
    var size = min + 1, mask = (1 << size) - 1, next = eoi + 1;
    var prefix = new Int16Array(4096), suffix = new Uint8Array(4096), stack = new Uint8Array(4097);
    for (var i = 0; i < clear; i++) { prefix[i] = -1; suffix[i] = i; }
    var bits = 0, acc = 0, dp = 0, op = 0, old = -1, first = 0;
    while (op < count) {
      while (bits < size) { if (dp >= data.length) return out; acc |= data[dp++] << bits; bits += 8; }
      var code = acc & mask; acc >>>= size; bits -= size;
      if (code === clear) { size = min + 1; mask = (1 << size) - 1; next = eoi + 1; old = -1; continue; }
      if (code === eoi) break;
      if (old === -1) { out[op++] = suffix[code]; old = code; first = code; continue; }
      var cur = code, sp = 0;
      if (code >= next) { stack[sp++] = first; cur = old; }
      while (cur >= clear) { stack[sp++] = suffix[cur]; cur = prefix[cur]; }
      first = suffix[cur]; stack[sp++] = first;
      while (sp && op < count) out[op++] = stack[--sp];
      if (next < 4096) { prefix[next] = old; suffix[next] = first; next++;
        if (next > mask && size < 12) { size++; mask = (1 << size) - 1; } }
      old = code;
    }
    return out;
  }

  function deinterlace(px, w, h) {
    var out = new Uint8Array(px.length), row = 0, passes = [[0, 8], [4, 8], [2, 4], [1, 2]];
    for (var k = 0; k < 4; k++) for (var y = passes[k][0]; y < h; y += passes[k][1]) { out.set(px.subarray(row * w, row * w + w), y * w); row++; }
    return out;
  }

  // Browsers spelen een vertraging van 0 of 1 (honderdste seconde) af als 10.
  function delayMs(d) { return (d <= 1 ? 10 : d) * 10; }

  function pickByTime(delays, n) {
    var total = 0, starts = [];
    for (var i = 0; i < delays.length; i++) { starts.push(total); total += delays[i]; }
    if (delays.length <= n) return { idx: delays.map(function (_, i) { return i; }), total: total };
    var idx = [];
    for (var k = 0; k < n; k++) {
      var t = total * k / n, j = 0;
      while (j + 1 < starts.length && starts[j + 1] <= t) j++;
      if (idx[idx.length - 1] !== j) idx.push(j);
    }
    return { idx: idx, total: total };
  }

  // Composeert alle frames op volgorde (nodig voor deltaframes) en bewaart alleen de gekozen.
  function gifFrames(gif, n) {
    var W = gif.width, H = gif.height, canvasPx = new Uint8ClampedArray(W * H * 4), saved = null;
    var delays = gif.frames.map(function (f) { return delayMs(f.delay); });
    var pick = pickByTime(delays, n), want = {}, shots = [];
    pick.idx.forEach(function (i) { want[i] = true; });
    for (var i = 0; i < gif.frames.length; i++) {
      var f = gif.frames[i];
      if (f.disposal === 3) saved = canvasPx.slice();
      if (f.pal) {
        var px = lzw(f.min, f.data, f.w * f.h);
        if (f.interlace) px = deinterlace(px, f.w, f.h);
        for (var yy = 0; yy < f.h; yy++) {
          var Y = f.y + yy; if (Y >= H) break;
          for (var xx = 0; xx < f.w; xx++) {
            var X = f.x + xx; if (X >= W) continue;
            var ci = px[yy * f.w + xx]; if (ci === f.transparent) continue;
            var o = (Y * W + X) * 4, q = ci * 3;
            canvasPx[o] = f.pal[q]; canvasPx[o + 1] = f.pal[q + 1]; canvasPx[o + 2] = f.pal[q + 2]; canvasPx[o + 3] = 255;
          }
        }
      }
      if (want[i]) { var cv = document.createElement('canvas'); cv.width = W; cv.height = H;
        cv.getContext('2d').putImageData(new ImageData(canvasPx.slice(), W, H), 0, 0); shots.push(cv); }
      if (f.disposal === 2) { for (var y2 = f.y; y2 < Math.min(H, f.y + f.h); y2++) canvasPx.fill(0, (y2 * W + f.x) * 4, (y2 * W + Math.min(W, f.x + f.w)) * 4); }
      else if (f.disposal === 3 && saved) canvasPx = saved;
    }
    return { frames: shots, width: W, height: H, total: pick.total, count: gif.frames.length };
  }

  /* ---------- video lezen (bv. een WhatsApp-gif die als mp4 is bewaard) ---------- */
  function videoFrames(file, n) {
    return new Promise(function (resolve, reject) {
      var v = document.createElement('video'), url = URL.createObjectURL(file), shots = [], k = 0;
      v.muted = true; v.playsInline = true; v.preload = 'auto'; v.src = url;
      function fail() { URL.revokeObjectURL(url); reject(new GifError('Deze video kan ik niet lezen. Probeer een gifbestand.')); }
      v.onerror = fail;
      v.onloadedmetadata = function () {
        if (!isFinite(v.duration) || v.duration <= 0) return fail();
        if (v.duration > 20) { URL.revokeObjectURL(url); return reject(new GifError('Deze video is langer dan 20 seconden. Kies een kort fragment.')); }
        seek();
      };
      function seek() { v.currentTime = Math.min(v.duration - 0.01, v.duration * k / n + 0.001); }
      v.onseeked = function () {
        var cv = document.createElement('canvas'); cv.width = v.videoWidth; cv.height = v.videoHeight;
        cv.getContext('2d').drawImage(v, 0, 0); shots.push(cv); k++;
        if (k < n) seek(); else { URL.revokeObjectURL(url);
          resolve({ frames: shots, width: v.videoWidth, height: v.videoHeight, total: Math.round(v.duration * 1000), count: null }); }
      };
    });
  }

  /* ---------- losse frames maken ----------
   * 13-11-2026 (test Ed): één rasterplaat laat ChatGPT de frames met code uitknippen en samenvoegen, waardoor
   * hij zijn eigen gif-generatie overslaat. Met losse beelden werkt het wel. Daarom levert de tool losse frames. */
  var MAXZIJDE = 1024;
  function frameBlobs(r) {
    var s = Math.min(1, MAXZIJDE / Math.max(r.width, r.height)), w = Math.round(r.width * s), h = Math.round(r.height * s);
    return Promise.all(r.frames.map(function (f, i) {
      var cv = document.createElement('canvas'); cv.width = w; cv.height = h;
      var g = cv.getContext('2d'); g.imageSmoothingQuality = 'high'; g.drawImage(f, 0, 0, w, h);
      return new Promise(function (res) { cv.toBlob(function (b) {
        res(new File([b], 'frame-' + (i < 9 ? '0' : '') + (i + 1) + '.png', { type: 'image/png' })); }, 'image/png'); });
    }));
  }

  // Eds werkende zin uit zijn test van 13-11-2026 (9 losse frames plus zijn foto), met één verduidelijking over de laatste foto.
  function promptText() {
    return 'Maak een gifje van mij op basis van deze referentie-images. De laatste foto ben ik. Vervang de persoon in de gif door mij.';
  }

  // eigen foto: verkleind naar jpg, zodat ook een grote iPhone-foto snel deelt
  function fotoFile(f) {
    if (!window.createImageBitmap) return Promise.resolve(f);
    return createImageBitmap(f).then(function (bm) {
      var s = Math.min(1, 1600 / Math.max(bm.width, bm.height)), cv = document.createElement('canvas');
      cv.width = Math.round(bm.width * s); cv.height = Math.round(bm.height * s);
      cv.getContext('2d').drawImage(bm, 0, 0, cv.width, cv.height);
      return new Promise(function (res) { cv.toBlob(function (b) { res(new File([b], 'mijn-foto.jpg', { type: 'image/jpeg' })); }, 'image/jpeg', .9); });
    }).catch(function () { return f; });
  }

  /* ---------- scherm ---------- */
  var CSS = '' +
    '.gr{--ink:#1A1A1A;--ink70:#4A4A4A;--y:#FFD02F;--line:rgba(26,26,26,.14);font-family:"Raleway",system-ui,-apple-system,sans-serif;color:var(--ink);font-size:18px;line-height:1.55;border:1px solid var(--line);border-radius:22px;padding:clamp(18px,4vw,30px);background:#fff;margin:24px 0 32px;}' +
    '.gr *{box-sizing:border-box;}.gr [hidden]{display:none!important;}' +
    '.gr h3{font-family:"Space Grotesk",sans-serif;font-size:clamp(22px,2.6vw,26px);letter-spacing:-.02em;line-height:1.2;margin:0 0 6px;}' +
    '.gr p{margin:0 0 14px;}' +
    '.gr-drop{display:block;border:2px dashed var(--line);border-radius:18px;padding:22px 18px;text-align:center;cursor:pointer;}' +
    '.gr-drop.is-over{border-color:var(--ink);background:#fffbe8;}' +
    '.gr-drop input{position:absolute;width:1px;height:1px;opacity:0;}' +
    '.gr-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:52px;padding:0 24px;border-radius:999px;border:2px solid var(--ink);background:var(--ink);color:var(--y);font:700 17px "Raleway",system-ui,sans-serif;cursor:pointer;text-decoration:none;}' +
    '.gr-btn.alt{background:#fff;color:var(--ink);}' +
    '.gr-btn:focus-visible,.gr-drop:focus-within,.gr-seg input:focus-visible+span,.gr textarea:focus-visible,.gr-frames a:focus-visible{outline:3px solid #2563eb;outline-offset:3px;}' +
    '.gr-sub{display:block;margin-top:10px;font-size:15px;color:var(--ink70);}' +
    '.gr-seg{display:flex;gap:8px;flex-wrap:wrap;margin:16px 0 4px;border:0;padding:0;}' +
    '.gr-seg legend{font-weight:700;margin-bottom:8px;padding:0;}' +
    '.gr-seg label{position:relative;}' +
    '.gr-seg input{position:absolute;opacity:0;width:1px;height:1px;}' +
    '.gr-seg span{display:inline-flex;align-items:center;min-height:44px;padding:0 18px;border:2px solid var(--line);border-radius:999px;cursor:pointer;font-weight:600;}' +
    '.gr-seg input:checked+span{border-color:var(--ink);background:var(--y);}' +
    '.gr-status{min-height:1.5em;margin:14px 0 0;font-weight:600;}' +
    '.gr-status.err{color:#b42318;}' +
    '.gr-out{margin-top:18px;}' +
    '.gr .gr-frames{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;list-style:none;padding:0;margin:0;}.gr .gr-frames li{margin:0;}' +
    '.gr-frames li{position:relative;}' +
    '.gr-frames a{display:block;border-radius:12px;overflow:hidden;border:1px solid var(--line);background:#111;}' +
    '.gr-frames img{display:block;width:100%;height:auto;}' +
    '.gr-frames span{position:absolute;left:6px;top:6px;background:var(--y);color:var(--ink);font:700 13px "Space Grotesk",sans-serif;border-radius:7px;padding:1px 7px;}' +
    '.gr-acts{display:flex;flex-wrap:wrap;gap:10px;margin:16px 0;}' +
    '.gr-acts .gr-btn{flex:1 1 220px;}' +
    '.gr textarea{width:100%;min-height:110px;font:15px/1.5 "JetBrains Mono",ui-monospace,monospace;border:1px solid var(--line);border-radius:14px;padding:14px;color:var(--ink);background:#fafafa;resize:vertical;}' +
    '.gr ol{margin:10px 0 0;padding-left:22px;}.gr ol li{margin-bottom:6px;}' +
    '.gr-foto{display:flex;flex-wrap:wrap;align-items:center;gap:12px 14px;margin:18px 0 4px;padding:14px;border-radius:18px;background:#FFF4CC;}' +
    '.gr-foto>div{flex:1 1 180px;}.gr-foto>label{flex:1 1 140px;display:flex;}.gr-foto>label .gr-btn{width:100%;}' +
    '.gr-foto input{position:absolute;width:1px;height:1px;opacity:0;}' +
    '.gr-foto img{width:64px;height:64px;border-radius:14px;object-fit:cover;background:#fff;flex:none;}' +
    '.gr-foto .gr-btn{min-height:48px;font-size:16px;}' +
    '.gr-foto label:focus-within .gr-btn{outline:3px solid #2563eb;outline-offset:3px;}' +
    '.gr-foto small{display:block;font-size:14px;color:var(--ink70);}';

  function mount(root) {
    if (root.getAttribute('data-klaar')) return; root.setAttribute('data-klaar', '1');
    if (!document.getElementById('gr-css')) { var st = document.createElement('style'); st.id = 'gr-css'; st.textContent = CSS; document.head.appendChild(st); }
    var id = 'gr' + Math.random().toString(36).slice(2, 7);
    root.innerHTML =
      '<section class="gr" aria-labelledby="' + id + '-t">' +
      '<h3 id="' + id + '-t">Gifje omzetten naar losse frames</h3>' +
      (root.hasAttribute('data-kort') ? '<p>Alles gebeurt op je eigen telefoon of computer; er wordt niets geüpload.</p>' :
      '<p>ChatGPT ziet een geüpload gifje als één stilstaand plaatje. Deze tool haalt de frames eruit als losse beelden, zodat ChatGPT de hele beweging ziet. Alles gebeurt op je eigen telefoon of computer; er wordt niets geüpload.</p>') +
      '<label class="gr-drop"><input type="file" accept="image/gif,video/mp4,video/quicktime,video/webm,video/*" id="' + id + '-f">' +
      '<span class="gr-btn" aria-hidden="true">Kies je gifje</span>' +
      '<span class="gr-sub">Een gif of een korte video. Op de computer kun je hem ook hierheen slepen.</span></label>' +
      '<fieldset class="gr-seg"><legend>Aantal frames</legend>' +
      '<label><input type="radio" name="' + id + '-n" value="9" checked><span>9 (meer beweging)</span></label>' +
      '<label><input type="radio" name="' + id + '-n" value="6"><span>6 (sneller klaar)</span></label></fieldset>' +
      '<p class="gr-status" role="status" aria-live="polite"></p>' +
      '<div class="gr-out" hidden>' +
      '<ol class="gr-frames" aria-label="Frames uit je gifje, op volgorde"></ol>' +
      '<div class="gr-foto"><img alt="" hidden><div><strong>Nu een foto van jezelf</strong><small>Een duidelijke foto waarop je gezicht goed te zien is. Hij gaat mee als laatste beeld.</small></div>' +
      '<label><input type="file" accept="image/*" id="' + id + '-foto"><span class="gr-btn alt" aria-hidden="true">Kies foto</span><span class="gr-sr" style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)">Kies een foto van jezelf</span></label></div>' +
      '<div class="gr-acts">' +
      '<button type="button" class="gr-btn gr-share" hidden>Stuur naar ChatGPT</button>' +
      '<button type="button" class="gr-btn alt gr-dl">Download alle frames</button>' +
      '<button type="button" class="gr-btn alt gr-copy">Kopieer prompt</button></div>' +
      '<label for="' + id + '-p"><strong>Prompt</strong> (staat ook op je klembord na delen of kopiëren)</label>' +
      '<textarea id="' + id + '-p" readonly></textarea>' +
      '<ol class="gr-stappen"></ol>' +
      '</div></section>';

    var q = function (s) { return root.querySelector(s); };
    var input = q('#' + id + '-f'), drop = q('.gr-drop'), status = q('.gr-status'), out = q('.gr-out'), lijst = q('.gr-frames'),
      share = q('.gr-share'), dl = q('.gr-dl'), copy = q('.gr-copy'), ta = q('textarea');
    var file = null, files = [], urls = [], foto = null, fotoUrl = null;
    var fotoIn = q('#' + id + '-foto'), fotoImg = q('.gr-foto img'), stappen = q('.gr-stappen');
    function stapTekst() {
      var deel = !share.hidden;
      stappen.innerHTML = deel
        ? '<li>Tik op <strong>Stuur naar ChatGPT</strong> en kies ChatGPT. ' + (foto ? 'De frames en je foto gaan in één keer mee.' : 'Voeg daarna in ChatGPT nog een foto van jezelf toe.') + '</li><li>Plak de prompt (die staat al op je klembord) en verstuur.</li>'
        : '<li>Download de frames en open ChatGPT.</li><li>Sleep de frames op volgorde in een nieuwe chat, en daarna een foto van jezelf.</li><li>Plak de prompt en verstuur.</li>';
    }
    function deelbaar() { var fs = foto ? files.concat([foto]) : files; share.hidden = !(fs.length && navigator.canShare && navigator.canShare({ files: fs })); stapTekst(); }
    fotoIn.addEventListener('change', function () {
      var f = fotoIn.files && fotoIn.files[0]; if (!f) return;
      fotoFile(f).then(function (ff) { foto = ff; if (fotoUrl) URL.revokeObjectURL(fotoUrl); fotoUrl = URL.createObjectURL(ff);
        fotoImg.src = fotoUrl; fotoImg.alt = 'Jouw foto'; fotoImg.hidden = false; deelbaar(); say('Foto toegevoegd. Tik op Stuur naar ChatGPT.'); });
    });

    function say(t, err) { status.textContent = t; status.classList.toggle('err', !!err); }
    function frameCount() { return +root.querySelector('input[name="' + id + '-n"]:checked').value; }

    function run() {
      if (!file) return;
      var n = frameCount(), isGif = /gif$/i.test(file.type) || /\.gif$/i.test(file.name);
      if (file.size > 40 * 1024 * 1024) return say('Dit bestand is groter dan 40 MB. Kies een kleiner gifje.', true);
      say('Bezig met lezen…');
      var info;
      var job = isGif ? file.arrayBuffer().then(function (buf) { return gifFrames(parseGif(buf), n); }) : videoFrames(file, n);
      job.then(function (r) { info = r; return frameBlobs(r); }).then(function (fs) {
        files = fs; urls.forEach(URL.revokeObjectURL); urls = fs.map(function (f) { return URL.createObjectURL(f); });
        lijst.innerHTML = fs.map(function (f, i) {
          return '<li><a href="' + urls[i] + '" download="' + f.name + '"><img src="' + urls[i] + '" alt="Frame ' + (i + 1) + ' van ' + fs.length + '"></a><span aria-hidden="true">' + (i + 1) + '</span></li>';
        }).join('');
        ta.value = promptText(); out.hidden = false;
        deelbaar();
        var sec = (Math.round(info.total / 100) / 10).toString().replace('.', ',');
        if (info.count && info.count <= fs.length) say('Klaar: alle ' + info.count + ' frames van je gifje (' + sec + ' seconden).');
        else say('Klaar: ' + fs.length + ' frames, gelijk verdeeld over je ' + (info.count ? 'gifje' : 'video') + ' van ' + sec + ' seconden.');
      }).catch(function (e) { out.hidden = true; say(e && e.message ? e.message : 'Dit bestand kan ik niet lezen. Probeer een ander gifje.', true); });
    }

    function copyPrompt() {
      var done = function () { say('Prompt gekopieerd. Plak hem in ChatGPT.'); };
      if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(ta.value).then(done, function () { ta.select(); });
      ta.select(); try { document.execCommand('copy'); done(); } catch (e) {}
    }

    input.addEventListener('change', function () { file = input.files && input.files[0]; run(); });
    root.querySelectorAll('input[name="' + id + '-n"]').forEach(function (r) { r.addEventListener('change', run); });
    ['dragenter', 'dragover'].forEach(function (t) { drop.addEventListener(t, function (e) { e.preventDefault(); drop.classList.add('is-over'); }); });
    ['dragleave', 'drop'].forEach(function (t) { drop.addEventListener(t, function () { drop.classList.remove('is-over'); }); });
    drop.addEventListener('drop', function (e) { e.preventDefault(); var f = e.dataTransfer.files && e.dataTransfer.files[0]; if (f) { file = f; run(); } });
    copy.addEventListener('click', copyPrompt);
    dl.addEventListener('click', function () {
      // een voor een, met een korte pauze; de browser vraagt soms eenmalig of meerdere downloads mogen
      urls.forEach(function (u, i) { setTimeout(function () { var a = document.createElement('a'); a.href = u; a.download = files[i].name; document.body.appendChild(a); a.click(); a.remove(); }, i * 300); });
      say('De ' + files.length + ' frames staan in je downloads. Sleep ze op volgorde in ChatGPT.');
    });
    share.addEventListener('click', function () {
      if (!files.length) return;
      copyPrompt();   // eerst op het klembord: in ChatGPT hoef je alleen nog te plakken
      navigator.share({ files: foto ? files.concat([foto]) : files }).catch(function () {});
    });
  }

  function init() { Array.prototype.forEach.call(document.querySelectorAll('.edgpt-gif-raster'), mount); }
  window.EDGPT_GIF_RASTER = { parseGif: parseGif, gifFrames: gifFrames, frameBlobs: frameBlobs, promptText: promptText, pickByTime: pickByTime, mount: mount };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();

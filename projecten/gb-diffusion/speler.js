// Speler voor Game Boy Diffusion op www.ed-gpt.nl/projecten: de echte ROM in binjgb (WebAssembly, MIT),
// met de emulatorlijm uit GB Live (gebaseerd op rgbds-live, MIT). Zonder geluid: de ROM maakt geen geluid.
import Binjgb from "./emu/binjgb.js";

const FRAME_TICKS = 70224, FPS = 59.7275, TICKS_PER_S = FRAME_TICKS * FPS;
const KEYS = { right: "_set_joyp_right", left: "_set_joyp_left", a: "_set_joyp_A" };
// adressen uit rom/build/diffusion.sym (WRAM-bank 0, altijd zichtbaar)
const W_STEP = 0xce45, W_STATE = 0xce4d, STEPS = 16;
const CATS = ["kat", "huis", "boom", "vis", "auto", "appel", "zon", "smiley"];
const W_CAT = 0xce42;

const $ = (s) => document.querySelector(s);
const canvas = $("#lcd"), ctx = canvas.getContext("2d"), img = ctx.createImageData(160, 144);
const meter = $("#meter"), knopA = $("#teken");

const [Module, rom] = await Promise.all([
  Binjgb(),
  fetch("gb-diffusion-28x28.gbc").then((r) => r.arrayBuffer()).then((b) => new Uint8Array(b)),
]);
const size = Math.max(0x8000, ((rom.length - 1) | 0x3fff) + 1);
const ptr = Module._malloc(size);
Module.HEAP8.subarray(ptr, ptr + size).fill(0);
Module.HEAP8.set(rom, ptr);
const e = Module._emulator_new_simple(ptr, size, 44100, 2048);
Module._emulator_set_default_joypad_callback(e, 0);
$("#laden").remove();

const ticks = () => Module._emulator_get_ticks_f64(e);
const read = (a) => Module._emulator_read_mem(e, a);

// Een tik op een knop: indrukken en na 4 Game Boy-frames loslaten, op elke snelheid.
const loslaten = [];
function druk(k) {
  if (!KEYS[k]) return;
  Module[KEYS[k]](e, 1);
  loslaten.push({ k, t: ticks() + 4 * FRAME_TICKS });
  document.querySelectorAll(`[data-knop="${k}"]`).forEach((b) => { b.classList.add("is-in"); setTimeout(() => b.classList.remove("is-in"), 120); });
}

let snelheid = 10, laatste = performance.now(), start = null, duur = null, vorigeState = 0;

function stap(nu) {
  const dt = Math.min(100, nu - laatste); laatste = nu;
  const doel = ticks() + (dt / 1000) * TICKS_PER_S * snelheid;
  const tot = performance.now() + 14; // rekenbudget per beeld, zodat de pagina vloeiend blijft
  while (ticks() < doel && performance.now() < tot) {
    const volgende = Math.min(doel, ticks() + FRAME_TICKS);
    const r = Module._emulator_run_until_f64(e, volgende);
    if (r & 16) break;
    for (let i = loslaten.length - 1; i >= 0; i--) {
      if (ticks() >= loslaten[i].t) { Module[KEYS[loslaten[i].k]](e, 0); loslaten.splice(i, 1); }
    }
  }
  img.data.set(new Uint8Array(Module.HEAP8.buffer, Module._get_frame_buffer_ptr(e), Module._get_frame_buffer_size(e)));
  ctx.putImageData(img, 0, 0);
  toonStand();
  requestAnimationFrame(stap);
}

function tijd(s) {
  s = Math.round(s);
  return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0");
}
let vorigeTekst = "";
function toonStand() {
  const state = read(W_STATE), cat = CATS[read(W_CAT) & 7];
  if (state === 1 && vorigeState !== 1) { start = ticks(); duur = null; }
  if (state !== 1 && vorigeState === 1 && start !== null) duur = (ticks() - start) / TICKS_PER_S;
  vorigeState = state;
  knopA.disabled = state === 1;
  let t;
  if (state === 1) {
    // wStep loopt één voor op de teller in beeld
    const s = Math.max(0, Math.min(STEPS, read(W_STEP) - 1)), gb = (ticks() - start) / TICKS_PER_S;
    t = `Bezig met een ${cat}: stap <b>${s} van ${STEPS}</b>` +
      `<div class="balk"><i style="width:${(100 * s) / STEPS}%"></i></div>Game Boy-tijd <b>${tijd(gb)}</b>`;
  } else if (duur !== null) {
    t = `Klaar. Op een echte Game Boy Color duurde deze ${cat} <b>${tijd(duur)}</b>.<br>Druk op A voor een nieuwe, met nieuwe ruis.`;
  } else {
    t = `Categorie: <b>${cat}</b>. Kies met de pijlen en druk op A.`;
  }
  if (t !== vorigeTekst) { meter.innerHTML = t; vorigeTekst = t; }
}

document.querySelectorAll("[data-knop]").forEach((b) => b.addEventListener("click", () => druk(b.dataset.knop)));
document.querySelectorAll("[data-x]").forEach((b) => b.addEventListener("click", () => {
  snelheid = +b.dataset.x;
  document.querySelectorAll("[data-x]").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
}));
addEventListener("keydown", (ev) => {
  const k = { ArrowLeft: "left", ArrowRight: "right", z: "a", Z: "a", " ": "a", Enter: "a" }[ev.key];
  if (!k || ev.repeat) return;
  ev.preventDefault();
  if (k === "a" && knopA.disabled) return;
  druk(k);
});

requestAnimationFrame((t) => { laatste = t; stap(t); });

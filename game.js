// Darkcoin Arena Cyberpunk 2025
console.log("Darkcoin Arena iniciando...");

// Funções utilitárias
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const rng = (a, b) => Math.random() * (b - a) + a;
const rint = (a, b) => Math.floor(rng(a, b + 1));
const fmt = n => Number(n).toLocaleString('pt-BR');
const SAVE = "darkcoin_cyberpunk_v2";

// Estado do jogo
const state = {
  seed: Math.floor(Math.random() * 1e9),
  wallet: 100,
  xp: 0,
  lvl: 1,
  xpCap: 100,
  sound: true,
  fast: false,
  p: { hp: 100, mp: 60, atk: 14, barrier: 0, maxHp: 100, maxMp: 60, vuln: 0, str: 0 },
  e: { hp: 130, mp: 40, atk: 12, barrier: 0, maxHp: 130, maxMp: 40, vuln: 0, enr: 0 },
  turn: "player",
  arena: { round: 0, wins: 0, running: false },
  cards: {
    playerHand: [],
    enemyHand: [],
    playerDeck: [],
    enemyDeck: [],
    playerEnergy: 3,
    enemyEnergy: 3,
    turn: "player"
  },
  inv: [],
  lore: [],
  ach: [],
  selectedTotem: null,
  cardsCollected: 0
};

// Gerador de números aleatórios
function mulberry32(a) {
  return function() {
    let t = a += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
}
const R = mulberry32(state.seed);

// Sistema de áudio
const Actx = window.AudioContext || window.webkitAudioContext;
let actx = null, master = null;

function audioInit() {
  if (actx) return;
  actx = new Actx();
  master = actx.createGain();
  master.gain.value = .12;
  master.connect(actx.destination);
}

function beep(freq = 440, dur = .08, type = "sine") {
  if (!state.sound) return;
  audioInit();
  const o = actx.createOscillator();
  const g = actx.createGain();
  o.type = type;
  o.frequency.value = freq;
  g.gain.setValueAtTime(0.0001, actx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.5, actx.currentTime + .01);
  g.gain.exponentialRampToValueAtTime(0.0001, actx.currentTime + dur);
  o.connect(g);
  g.connect(master);
  o.start();
  o.stop(actx.currentTime + dur + .02);
}

// Sistema de save/load
function save() {
  localStorage.setItem(SAVE, JSON.stringify(state));
  beep(640, .08);
}

function load() {
  try {
    const s = localStorage.getItem(SAVE);
    if (!s) return false;
    Object.assign(state, JSON.parse(s));
    return true;
  } catch (e) {
    return false;
  }
}

// Canvas e desenho
const canvas = document.getElementById('battle');
const ctx = canvas.getContext('2d');
let frame = 0;

function drawScene() {
  if (!canvas) return;
  
  ctx.fillStyle = '#0a0a0a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Efeitos de partículas
  for (let i = 0; i < 20; i++) {
    const x = (frame * 0.5 + i * 50) % canvas.width;
    const y = (i * 30 + frame * 0.3) % canvas.height;
    const alpha = 0.3 + Math.sin(frame * 0.1 + i) * 0.2;
    
    ctx.fillStyle = `rgba(139, 69, 19, ${alpha})`;
    ctx.fillRect(x, y, 2, 2);
  }
  
  // Personagens
  if (state.p.hp > 0) {
    ctx.fillStyle = '#86efac';
    ctx.fillRect(50, 150, 40, 60);
    ctx.fillStyle = '#ffffff';
    ctx.fillText('P', 65, 185);
  }
  
  if (state.e.hp > 0) {
    ctx.fillStyle = '#fca5a5';
    ctx.fillRect(310, 150, 40, 60);
    ctx.fillStyle = '#ffffff';
    ctx.fillText('E', 325, 185);
  }
  
  frame++;
  requestAnimationFrame(drawScene);
}

function setBars() {
  const pBar = $('#php');
  const eBar = $('#ehp');
  const pMp = $('#pmp');
  const eMp = $('#emp');
  
  if (pBar) pBar.style.width = (state.p.hp / state.p.maxHp * 100) + '%';
  if (eBar) eBar.style.width = (state.e.hp / state.e.maxHp * 100) + '%';
  if (pMp) pMp.style.width = (state.p.mp / state.p.maxMp * 100) + '%';
  if (eMp) eMp.style.width = (state.e.mp / state.e.maxMp * 100) + '%';
  
  $('#pstats').textContent = `${state.p.hp}/${state.p.maxHp} HP | ${state.p.mp}/${state.p.maxMp} MP`;
  $('#estats').textContent = `${state.e.hp}/${state.e.maxHp} HP | ${state.e.mp}/${state.e.maxMp} MP`;
}

function log(s) {
  const el = $('.log');
  if (el) {
    el.innerHTML += s + "<br/>";
    el.scrollTop = el.scrollHeight;
  }
}

function dmg(amount) {
  return `<span style="color:#fca5a5">-${amount}</span>`;
}

function takeDamage(target, amount) {
  let left = amount;
  if (target.barrier > 0) {
    const use = Math.min(target.barrier, left);
    target.barrier -= use;
    left -= use;
  }
  if (left > 0) {
    target.hp = clamp(target.hp - left, 0, target.maxHp);
  }
  beep(320, .1);
}

function win() {
  log(`<b style="color:#86efac">Vitória!</b> +${fmt(15)} DC, +${fmt(25)} XP`);
  state.wallet += 15;
  state.xp += 25;
  levelCheck();
  updateHUD();
  initBattle();
}

function lose() {
  log(`<b style="color:#fca5a5">Derrota…</b> -${fmt(8)} DC`);
  state.wallet = Math.max(0, state.wallet - 8);
  updateHUD();
  initBattle();
}

function endCheck() {
  if (state.e.hp <= 0) {
    setTimeout(win, 500);
  } else if (state.p.hp <= 0) {
    setTimeout(lose, 500);
  }
}

// Habilidades
function skillCurse() {
  if (state.p.mp < 20 || state.turn !== "player") return;
  state.p.mp -= 20;
  const dmg = state.p.atk + rint(3, 8);
  takeDamage(state.e, dmg);
  state.e.vuln = Math.max(state.e.vuln, 2);
  log(`Maldição! ${dmg(dmg)} | Inimigo Vulnerável`);
  setBars();
  endCheck();
  if (state.e.hp > 0) nextTurn();
}

function skillSacrifice() {
  if (state.p.mp < 15 || state.turn !== "player") return;
  state.p.mp -= 15;
  const dmg = state.p.atk * 2 + rint(5, 12);
  takeDamage(state.p, 8);
  takeDamage(state.e, dmg);
  log(`Sacrifício! ${dmg(dmg)} | ${dmg(8)}`);
  setBars();
  endCheck();
  if (state.e.hp > 0) nextTurn();
}

function skillWard() {
  if (state.p.mp < 12 || state.turn !== "player") return;
  state.p.mp -= 12;
  state.p.barrier = clamp(state.p.barrier + 25, 0, 100);
  log(`Barreira! +25 Proteção`);
  setBars();
  nextTurn();
}

function nextTurn() {
  state.turn = "enemy";
  $('#turnBanner').textContent = "Turno do Inimigo";
  setTimeout(enemyAct, 1000);
}

function enemyAct() {
  const acts = [
    () => {
      const dmg = state.e.atk + rint(2, 6);
      takeDamage(state.p, dmg);
      log(`Inimigo ataca! ${dmg(dmg)}`);
    },
    () => {
      if (state.e.mp >= 15) {
        state.e.mp -= 15;
        state.e.barrier = clamp(state.e.barrier + 20, 0, 100);
        log("Inimigo usa Barreira!");
      }
    }
  ];
  
  acts[rint(0, acts.length - 1)]();
  setBars();
  endCheck();
  
  if (state.p.hp > 0) {
    setTimeout(() => {
      state.turn = "player";
      $('#turnBanner').textContent = "Seu Turno";
    }, 1000);
  }
}

function initBattle() {
  state.p.hp = state.p.maxHp;
  state.p.mp = state.p.maxMp;
  state.p.barrier = 0;
  state.e.hp = state.e.maxHp;
  state.e.mp = state.e.maxMp;
  state.e.barrier = 0;
  state.turn = "player";
  $('#turnBanner').textContent = "Seu Turno";
  setBars();
  log("Nova batalha iniciada!");
}

// Arena automática
let arenaInterval = null;

function aStart() {
  if (state.arena.running) return;
  state.arena.running = true;
  state.arena.round = 0;
  $('#aStart').textContent = "Parar Arena";
  arenaInterval = setInterval(aTick, state.fast ? 100 : 500);
  aLog("Arena iniciada!");
}

function aStop() {
  if (!state.arena.running) return;
  state.arena.running = false;
  $('#aStart').textContent = "Iniciar Arena";
  clearInterval(arenaInterval);
  aLog("Arena parada.");
}

function aTick() {
  state.arena.round++;
  aStepSim();
  updateHUD();
}

function aStepSim() {
  const pDmg = state.p.atk + rint(2, 8);
  const eDmg = state.e.atk + rint(1, 6);
  
  takeDamage(state.e, pDmg);
  takeDamage(state.p, eDmg);
  
  if (state.e.hp <= 0) {
    aVictory();
  } else if (state.p.hp <= 0) {
    aDefeat();
  }
}

function aVictory() {
  state.arena.wins++;
  state.wallet += 5;
  state.xp += 8;
  levelCheck();
  aLog(`<b style="color:#86efac">Vitória!</b> +5 DC, +8 XP`);
  initBattle();
}

function aDefeat() {
  state.wallet = Math.max(0, state.wallet - 3);
  aLog(`<b style="color:#fca5a5">Derrota</b> -3 DC`);
  initBattle();
}

function aLog(s) {
  const el = $('#alog');
  if (el) {
    el.innerHTML += s + "<br/>";
    el.scrollTop = el.scrollHeight;
  }
}

// Sistema de totens
const TOTENS = {
  neural: {
    name: "Neural Bot",
    desc: "IA assistente",
    responses: [
      "Analisando padrões de combate...",
      "Sugestão: Use Barreira antes de atacar",
      "Detectei vulnerabilidade no inimigo",
      "Otimizando estratégia de combate..."
    ]
  },
  oracle: {
    name: "Oracle",
    desc: "Vidente digital",
    responses: [
      "Vejo sangue e circuitos...",
      "O futuro é incerto, mas promissor",
      "As cartas revelam sua vitória",
      "Cuidado com o próximo movimento..."
    ]
  }
};

function tLog(s) {
  const el = $('#totemLog');
  if (el) {
    el.innerHTML += s + "<br/>";
    el.scrollTop = el.scrollHeight;
  }
}

function speak(text) {
  if ('speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'pt-BR';
    utterance.rate = 0.9;
    speechSynthesis.speak(utterance);
  }
}

function totemReply(totem) {
  const responses = TOTENS[totem].responses;
  const response = responses[Math.floor(Math.random() * responses.length)];
  tLog(`<b>${TOTENS[totem].name}:</b> ${response}`);
  speak(response);
}

// Sistema de progressão
function levelCheck() {
  while (state.xp >= state.xpCap) {
    state.xp -= state.xpCap;
    state.lvl++;
    state.xpCap = Math.floor(state.xpCap * 1.2);
    
    // Melhorias de nível
    state.p.maxHp += 10;
    state.p.maxMp += 5;
    state.p.atk += 2;
    state.p.hp = state.p.maxHp;
    state.p.mp = state.p.maxMp;
    
    log(`<b style="color:#fbbf24">Nível ${state.lvl}!</b> +10 HP, +5 MP, +2 ATK`);
    beep(800, .15);
  }
}

// Interface
function updateHUD() {
  $('#dc').textContent = fmt(state.wallet);
  $('#lvl').textContent = state.lvl;
  $('#xp').textContent = `${fmt(state.xp)} / ${fmt(state.xpCap)}`;
  $('#aWins').textContent = fmt(state.arena.wins);
  $('#aRound').textContent = fmt(state.arena.round);
  $('#seed').textContent = state.seed;
}

function bind() {
  $('#save').onclick = save;
  $('#load').onclick = () => { load(); updateHUD(); setBars(); };
  $('#export').onclick = () => {
    const data = JSON.stringify(state, null, 2);
    const blob = new Blob([data], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'darkcoin_save.json';
    a.click();
  };
  $('#import').onclick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          Object.assign(state, JSON.parse(e.target.result));
          updateHUD();
          setBars();
          log("Save importado!");
        } catch (err) {
          log("Erro ao importar save!");
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };
  
  // Combate
  $('#skCurse').onclick = skillCurse;
  $('#skSac').onclick = skillSacrifice;
  $('#skWard').onclick = skillWard;
  
  // Arena
  $('#aStart').onclick = () => state.arena.running ? aStop() : aStart();
  $('#aFast').onclick = () => {
    state.fast = !state.fast;
    $('#aFast').textContent = state.fast ? "⏩ x1" : "⏩ x2";
  };
  
  // Tabs
  $$('.tab').forEach(tab => {
    tab.onclick = () => {
      const target = tab.dataset.tab;
      $$('.tab').forEach(t => t.classList.remove('active'));
      $$('[data-view]').forEach(v => v.hidden = true);
      tab.classList.add('active');
      $(`[data-view="${target}"]`).hidden = false;
    };
  });
  
  // Teclas
  document.onkeydown = (e) => {
    if (e.key === 'q' || e.key === 'Q') skillCurse();
    if (e.key === 'w' || e.key === 'W') skillSacrifice();
    if (e.key === 'e' || e.key === 'E') skillWard();
    if (e.key === 's' && e.ctrlKey) { e.preventDefault(); save(); }
    if (e.key === 'l' && e.ctrlKey) { e.preventDefault(); load(); updateHUD(); setBars(); }
  };
}

function hydrate() {
  updateHUD();
  setBars();
  initBattle();
  if (canvas) drawScene();
}

function boot() {
  load();
  hydrate();
  bind();
  log("Darkcoin Arena carregado! Use Q,W,E para habilidades. Ctrl+S/L para save/load.");
}

// Inicialização
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
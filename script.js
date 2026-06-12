/* ═══════════════════════════════════════════════════════
   script.js — Halo Série · Melhorias Interativas
   ═══════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', function () {

/* ── 1. ACTIVE NAV HIGHLIGHT (Intersection Observer) ─────────────
   Ilumina o link de nav correspondente à seção visível na tela.   */
(function activeNav() {
  const sections = document.querySelectorAll('main section[id]');
  const navLinks = document.querySelectorAll('nav .nav-item[href^="#"]');

  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          navLinks.forEach(link => link.classList.remove('nav-active'));
          const active = document.querySelector(`nav a[href="#${entry.target.id}"]`);
          if (active) active.classList.add('nav-active');
        }
      });
    },
    { threshold: 0.45 }
  );

  sections.forEach(s => observer.observe(s));

  /* Adiciona estilo do estado ativo inline (sem tocar no CSS externo) */
  const style = document.createElement('style');
  style.textContent = `
    .nav-active {
      color: var(--neon-cyan) !important;
    }
    .nav-active::after {
      width: 100% !important;
    }
    body.game-active,
    body.game-active .cursor,
    body.game-active .cursor-ring {
      cursor: default !important;
    }
    body.game-active .cursor,
    body.game-active .cursor-ring {
      display: none !important;
    }
  `;
  document.head.appendChild(style);
})();


/* ── 2. TYPING EFFECT no subtítulo hero ──────────────────────────
   "A SÉRIE" é revelada letra a letra como um terminal UNSC.        */
(function typingEffect() {
  const glitchWrap = document.querySelector('.glitch-wrap[data-text="A SÉRIE"]');
  if (!glitchWrap) return;

  const finalText = 'A SÉRIE';
  glitchWrap.textContent = '';
  glitchWrap.dataset.text = '';

  // Aguarda a animação de entrada do hero antes de começar
  setTimeout(() => {
    let i = 0;
    const interval = setInterval(() => {
      glitchWrap.textContent += finalText[i];
      glitchWrap.dataset.text = glitchWrap.textContent;
      i++;
      if (i >= finalText.length) clearInterval(interval);
    }, 90);
  }, 900); // sincroniza com o delay da animação CSS do hero
})();


/* ── 3. PARTÍCULAS AO CLICAR ─────────────────────────────────────
   Pequenas partículas neon explodem em qualquer clique na página.  */
(function clickParticles() {
  const canvas = document.createElement('canvas');
  const ctx    = canvas.getContext('2d');

  Object.assign(canvas.style, {
    position: 'fixed',
    top: '0', left: '0',
    width: '100%', height: '100%',
    pointerEvents: 'none',
    zIndex: '99997',
  });

  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
  document.body.appendChild(canvas);

  window.addEventListener('resize', () => {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  });

  const particles = [];
  const COLORS = ['#00ffe7', '#00c8ff', '#ffffff', '#f0a500'];

  class Particle {
    constructor(x, y) {
      this.x    = x;
      this.y    = y;
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 3.5 + 1;
      this.vx   = Math.cos(angle) * speed;
      this.vy   = Math.sin(angle) * speed;
      this.r    = Math.random() * 2.5 + 1;
      this.life = 1;
      this.decay= Math.random() * 0.03 + 0.02;
      this.color= COLORS[Math.floor(Math.random() * COLORS.length)];
    }

    update() {
      this.x   += this.vx;
      this.y   += this.vy;
      this.vy  += 0.07; // gravidade suave
      this.life -= this.decay;
    }

    draw() {
      ctx.save();
      ctx.globalAlpha = Math.max(this.life, 0);
      ctx.shadowBlur  = 8;
      ctx.shadowColor = this.color;
      ctx.fillStyle   = this.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  document.addEventListener('click', e => {
    for (let i = 0; i < 18; i++) {
      particles.push(new Particle(e.clientX, e.clientY));
    }
  });

  function loop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = particles.length - 1; i >= 0; i--) {
      particles[i].update();
      particles[i].draw();
      if (particles[i].life <= 0) particles.splice(i, 1);
    }
    requestAnimationFrame(loop);
  }
  loop();
})();


/* ── 4. SOM SINTÉTICO NOS LINKS (Web Audio API) ──────────────────
   Um clique curto e futurista — sem arquivos de áudio externos.    */
(function uiSounds() {
  let audioCtx = null;

  function getCtx() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    return audioCtx;
  }

  function playClick() {
    try {
      const ctx  = getCtx();
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type            = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.12);
    } catch (_) { /* silêncio se o browser bloquear */ }
  }

  document.querySelectorAll('a, button').forEach(el => {
    el.addEventListener('click', playClick);
  });
})();


/* ── 5. KONAMI CODE → SPARTAN PROTOCOL GAME ──────────────────────
   MODOS: Classic · Survival · Boss Rush · Shield Mode
   NOVIDADES: Dash, Super-tiro, Câmera shake, Obstáculos,
   Trilha sonora, Padrões de formação, Contador de ondas        */
(function konamiGame() {

  /* ══ KONAMI DETECTOR ══ */
  const SEQ = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown',
                'ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
  let seqIdx = 0;
  document.addEventListener('keydown', e => {
    seqIdx = (e.key === SEQ[seqIdx]) ? seqIdx + 1 : (e.key === SEQ[0] ? 1 : 0);
    if (seqIdx === SEQ.length) { seqIdx = 0; openMenu(); }
  });

  /* ══ AUDIO ENGINE ══ */
  let _AC = null;
  function AC() {
    if (!_AC) _AC = new (window.AudioContext || window.webkitAudioContext)();
    return _AC;
  }

  function beep(freq, dur, type='square', vol=0.06, delay=0) {
    try {
      const c=AC(), o=c.createOscillator(), g=c.createGain();
      o.connect(g); g.connect(c.destination);
      o.type=type; o.frequency.value=freq;
      g.gain.setValueAtTime(vol, c.currentTime+delay);
      g.gain.exponentialRampToValueAtTime(0.001, c.currentTime+delay+dur);
      o.start(c.currentTime+delay); o.stop(c.currentTime+delay+dur);
    } catch(_){}
  }

  function chord(notes) { notes.forEach((f,i)=>beep(f,0.25,'square',0.06,i*0.1)); }

  function noise(vol=0.2, dur=0.15) {
    try {
      const c=AC(), buf=c.createBuffer(1,c.sampleRate*dur,c.sampleRate),
            d=buf.getChannelData(0), src=c.createBufferSource(), g=c.createGain();
      for(let i=0;i<d.length;i++) d[i]=(Math.random()*2-1)*(1-i/d.length);
      src.buffer=buf; src.connect(g); g.connect(c.destination); g.gain.value=vol;
      src.start(c.currentTime);
    } catch(_){}
  }

  function shoot()    { beep(880,0.06,'sawtooth',0.04); beep(440,0.04,'sawtooth',0.02,0.04); }
  function superShoot(){ beep(440,0.15,'sawtooth',0.12); beep(220,0.2,'sawtooth',0.08,0.05); noise(0.15,0.1); }
  function dashSound(){ beep(660,0.08,'sine',0.08); beep(880,0.06,'sine',0.05,0.05); }
  function explode()  { noise(0.22,0.18); }
  function powerUp()  { chord([523,659,784,1047]); }
  function bossRoar() { beep(80,0.5,'sawtooth',0.18); beep(60,0.4,'square',0.12,0.1); }
  function hitSound() { beep(150,0.18,'square',0.15); }
  function bombSound(){ beep(60,0.6,'sawtooth',0.28); noise(0.45,0.28); }
  function levelUp()  { [523,659,784,880,1047].forEach((f,i)=>beep(f,0.15,'sine',0.1,i*0.08)); }

  /* Trilha de fundo — pulso rítmico discreto */
  let bgInterval = null;
  function startBGMusic() {
    stopBGMusic();
    let tick = 0;
    bgInterval = setInterval(() => {
      tick++;
      beep(55, 0.08, 'sine', 0.03);
      if (tick % 4 === 0) beep(82, 0.06, 'sine', 0.02, 0.05);
      if (tick % 8 === 0) beep(110, 0.1, 'triangle', 0.025, 0.1);
    }, 500);
  }
  function stopBGMusic() {
    if (bgInterval) { clearInterval(bgInterval); bgInterval = null; }
  }

  /* ══ HIGHSCORE ══ */
  const HS_KEY = 'spartan_hs_v2';
  function getHS() { try { return JSON.parse(localStorage.getItem(HS_KEY)||'{}'); } catch(_){ return {}; } }
  function setHS(mode, sc) {
    try { const h=getHS(); if((h[mode]||0)<sc){ h[mode]=sc; localStorage.setItem(HS_KEY,JSON.stringify(h)); } } catch(_){}
  }

  /* ══ SHARED STYLES ══ */
  function injectStyles() {
    if (document.getElementById('sg-styles')) return;
    const s = document.createElement('style');
    s.id = 'sg-styles';
    s.textContent = `
      .sg-overlay {
        position:fixed;inset:0;z-index:1000000;background:#020914;
        display:flex;flex-direction:column;align-items:center;justify-content:center;
        font-family:'Orbitron',sans-serif;color:#00ffe7;text-align:center;
        gap:1rem;cursor:default;
      }
      .sg-btn {
        padding:0.75rem 2.5rem;border:1px solid #00ffe7;background:rgba(0,200,255,0.08);
        color:#00ffe7;font-family:'Orbitron',sans-serif;font-size:0.75rem;
        letter-spacing:3px;cursor:pointer;text-transform:uppercase;
        transition:background 0.2s,box-shadow 0.2s;
      }
      .sg-btn:hover { background:rgba(0,200,255,0.18);box-shadow:0 0 20px rgba(0,200,255,0.3); }
      .sg-btn-ghost {
        padding:0.4rem 1.5rem;border:1px solid rgba(0,200,255,0.2);background:transparent;
        color:rgba(0,200,255,0.4);font-family:'Orbitron',sans-serif;font-size:0.6rem;
        letter-spacing:3px;cursor:pointer;
      }
      .sg-btn-ghost:hover { color:#00ffe7;border-color:rgba(0,200,255,0.6); }
      .sg-mode-grid { display:grid;grid-template-columns:1fr 1fr;gap:1rem;max-width:600px;width:90%; }
      .sg-mode-card {
        border:1px solid rgba(0,200,255,0.25);background:rgba(0,200,255,0.04);
        padding:1.2rem;cursor:pointer;transition:all 0.25s;border-radius:2px;
      }
      .sg-mode-card:hover { border-color:#00ffe7;background:rgba(0,200,255,0.1);
        box-shadow:0 0 24px rgba(0,200,255,0.2); }
      .sg-mode-icon { font-size:1.8rem;margin-bottom:0.5rem; }
      .sg-mode-name { font-size:0.75rem;font-weight:700;letter-spacing:3px;color:#00ffe7;margin-bottom:0.3rem; }
      .sg-mode-desc { font-size:0.65rem;letter-spacing:1px;color:#7ab8d4;line-height:1.5;
        font-family:'Rajdhani',sans-serif; }
      #sg-canvas { display:block;width:100%;height:100%;cursor:default; }
      #sg-wrap {
        position:fixed;inset:0;z-index:1000000;background:#020914;
        overflow:hidden;font-family:'Orbitron',sans-serif;cursor:default;user-select:none;
      }
      #sg-hud {
        position:absolute;top:0;left:0;right:0;
        display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;
        padding:0.55rem 3.5rem 0.55rem 1rem;background:rgba(2,9,20,0.9);
        border-bottom:1px solid rgba(0,200,255,0.2);pointer-events:none;gap:0.5rem;
      }
      .sg-hud-cell { font-size:clamp(0.45rem,1.5vw,0.65rem);letter-spacing:2px;color:#00ffe7; }
      .sg-hud-cell.warn { color:#ff6600; }
      .sg-hud-cell.crit { color:#ff003c;animation:sg-crit-blink 0.5s infinite; }
      @keyframes sg-crit-blink { 50%{opacity:0.4;} }
      #sg-base-bar-bg { position:absolute;bottom:0;left:0;right:0;height:4px;background:rgba(0,200,255,0.1); }
      #sg-base-bar    { height:100%;background:linear-gradient(90deg,#00ffe7,#00c8ff);
        box-shadow:0 0 8px #00ffe7;transition:width 0.25s,background 0.3s; }
      #sg-esc { position:absolute;top:0.5rem;right:0.6rem;background:transparent;
        border:1px solid rgba(0,200,255,0.25);color:rgba(0,200,255,0.45);
        font-family:'Orbitron',sans-serif;font-size:0.45rem;letter-spacing:2px;
        padding:0.2rem 0.5rem;cursor:pointer;z-index:10; }
      #sg-esc:hover { color:#00ffe7;border-color:#00ffe7; }
      #sg-announce {
        position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);
        font-size:clamp(1.2rem,5vw,2.8rem);font-weight:900;letter-spacing:6px;color:#00ffe7;
        text-shadow:0 0 40px #00ffe7;pointer-events:none;opacity:0;transition:opacity 0.35s;
        white-space:nowrap;text-align:center;
      }
      #sg-power-bar {
        position:absolute;bottom:12px;left:50%;transform:translateX(-50%);
        display:flex;gap:6px;pointer-events:none;align-items:flex-end;
      }
      .sg-power-slot {
        width:38px;height:38px;border:1px solid rgba(0,200,255,0.3);
        background:rgba(0,200,255,0.04);display:flex;align-items:center;
        justify-content:center;font-size:1rem;border-radius:2px;
        transition:border-color 0.2s,background 0.2s;position:relative;flex-direction:column;
      }
      .sg-power-slot.ready { border-color:#00ffe7;background:rgba(0,200,255,0.12);
        box-shadow:0 0 10px rgba(0,200,255,0.25); }
      .sg-power-slot.cooldown { opacity:0.4; }
      .sg-power-slot .sg-cd-fill {
        position:absolute;bottom:0;left:0;right:0;background:rgba(0,200,255,0.15);
        transition:height 0.1s;border-radius:0 0 2px 2px;
      }
      .sg-power-key {
        position:absolute;top:2px;right:3px;font-size:0.4rem;
        color:rgba(0,200,255,0.5);font-family:'Orbitron',sans-serif;
      }
      #sg-combo {
        position:absolute;right:1rem;top:50%;transform:translateY(-50%);
        font-size:clamp(1rem,3vw,2rem);font-weight:900;letter-spacing:4px;
        color:#f0a500;text-shadow:0 0 20px #f0a500;pointer-events:none;
        opacity:0;transition:opacity 0.4s;
      }
      #sg-charge-bar {
        position:absolute;bottom:58px;left:50%;transform:translateX(-50%);
        width:120px;height:4px;background:rgba(255,255,255,0.1);border-radius:2px;
        pointer-events:none;opacity:0;transition:opacity 0.3s;
      }
      #sg-charge-fill {
        height:100%;width:0%;border-radius:2px;
        background:linear-gradient(90deg,#f0a500,#ff6600);
        box-shadow:0 0 8px #f0a500;transition:width 0.05s;
      }
      #sg-enemies-left {
        position:absolute;top:50%;right:8px;transform:translateY(-50%);
        font-size:0.5rem;letter-spacing:2px;color:rgba(0,200,255,0.35);
        font-family:'Orbitron',sans-serif;pointer-events:none;text-align:right;
        writing-mode:vertical-rl;text-orientation:mixed;
      }
      #sg-dash-indicator {
        position:absolute;bottom:58px;left:1rem;
        font-size:0.5rem;letter-spacing:2px;color:rgba(0,200,255,0.5);
        font-family:'Orbitron',sans-serif;pointer-events:none;
      }
      body.game-active, body.game-active * { cursor:default !important; }
      body.game-active .cursor, body.game-active .cursor-ring { display:none!important; }
      @media(max-width:500px){ .sg-mode-grid{grid-template-columns:1fr;} }
    `;
    document.head.appendChild(s);
  }

  function removeEl(id) { document.getElementById(id)?.remove(); }
  function closeGame() {
    stopBGMusic();
    removeEl('sg-wrap');
    removeEl('sg-styles');
    document.body.classList.remove('game-active');
  }

  /* ══ MAIN MENU ══ */
  function openMenu() {
    injectStyles();
    removeEl('sg-menu');
    chord([523,659,784,1047]);
    const hs = getHS();
    const menu = document.createElement('div');
    menu.id = 'sg-menu';
    menu.className = 'sg-overlay';
    document.body.classList.add('game-active');

    menu.innerHTML = `
      <div style="font-size:clamp(0.5rem,1.8vw,0.7rem);letter-spacing:6px;color:#7ab8d4;">⬆⬆⬇⬇⬅➡⬅➡ B A</div>
      <div style="font-size:clamp(2rem,7vw,4rem);font-weight:900;letter-spacing:4px;text-shadow:0 0 40px #00ffe7,0 0 80px #00c8ff;">SPARTAN PROTOCOL</div>
      <div style="font-size:clamp(0.55rem,1.8vw,0.8rem);letter-spacing:4px;color:#7ab8d4;">JOHN-117 · SELECIONE A MISSÃO</div>
      <div class="sg-mode-grid">
        <div class="sg-mode-card" data-mode="classic">
          <div class="sg-mode-icon">🛡️</div>
          <div class="sg-mode-name">CLASSIC</div>
          <div class="sg-mode-desc">Ondas de Covenant. Defenda a base UNSC. Sobreviva o máximo possível.</div>
          <div style="font-size:0.55rem;color:#f0a500;margin-top:0.5rem;letter-spacing:2px;">RECORDE: ${hs.classic||0}</div>
        </div>
        <div class="sg-mode-card" data-mode="survival">
          <div class="sg-mode-icon">⚡</div>
          <div class="sg-mode-name">SURVIVAL</div>
          <div class="sg-mode-desc">Sem base. Desvie e sobreviva. Score por tempo e kills.</div>
          <div style="font-size:0.55rem;color:#f0a500;margin-top:0.5rem;letter-spacing:2px;">RECORDE: ${hs.survival||0}</div>
        </div>
        <div class="sg-mode-card" data-mode="boss">
          <div class="sg-mode-icon">👾</div>
          <div class="sg-mode-name">BOSS RUSH</div>
          <div class="sg-mode-desc">5 chefes em sequência. Cada um com padrões únicos de ataque.</div>
          <div style="font-size:0.55rem;color:#f0a500;margin-top:0.5rem;letter-spacing:2px;">RECORDE: ${hs.boss||0}</div>
        </div>
        <div class="sg-mode-card" data-mode="shield">
          <div class="sg-mode-icon">🔵</div>
          <div class="sg-mode-name">SHIELD MODE</div>
          <div class="sg-mode-desc">Escudo reflete projéteis de volta. Destrua o Covenant com suas próprias balas.</div>
          <div style="font-size:0.55rem;color:#f0a500;margin-top:0.5rem;letter-spacing:2px;">RECORDE: ${hs.shield||0}</div>
        </div>
      </div>
      <div style="font-size:0.55rem;letter-spacing:2px;color:rgba(0,200,255,0.35);margin-top:0.5rem;font-family:'Rajdhani',sans-serif;line-height:1.9;">
        ← → / A D · MOVER &nbsp;·&nbsp; SHIFT · DASH &nbsp;·&nbsp; ESPAÇO · SUPER TIRO &nbsp;·&nbsp; 1-4 · PODERES &nbsp;·&nbsp; ESC · SAIR
      </div>
      <button class="sg-btn-ghost" id="sg-menu-close">[ ESC · ABORTAR ]</button>
    `;
    document.body.appendChild(menu);

    menu.querySelectorAll('.sg-mode-card').forEach(card => {
      card.addEventListener('click', () => { menu.remove(); startGame(card.dataset.mode); });
    });
    document.getElementById('sg-menu-close').addEventListener('click', () => {
      menu.remove(); document.body.classList.remove('game-active');
    });
    function menuEsc(e) {
      if (e.key === 'Escape') { menu.remove(); document.body.classList.remove('game-active'); document.removeEventListener('keydown', menuEsc); }
    }
    document.addEventListener('keydown', menuEsc);
  }

  /* ══ GAME ENGINE ══ */
  function startGame(mode) {
    injectStyles();
    removeEl('sg-wrap');
    startBGMusic();

    /* ── DOM ── */
    const wrap   = document.createElement('div'); wrap.id = 'sg-wrap';
    const canvas = document.createElement('canvas'); canvas.id = 'sg-canvas';
    wrap.appendChild(canvas);

    const hud = document.createElement('div'); hud.id = 'sg-hud';
    hud.innerHTML = `
      <span class="sg-hud-cell" id="sg-h-score">SCORE · 0</span>
      <span class="sg-hud-cell" id="sg-h-mode">${mode.toUpperCase()}</span>
      <span class="sg-hud-cell" id="sg-h-wave">WAVE · 1</span>
      <span class="sg-hud-cell" id="sg-h-base">BASE ██████</span>
      <span class="sg-hud-cell" id="sg-h-lives">❤❤❤</span>
    `;
    wrap.appendChild(hud);

    const baseBg  = document.createElement('div'); baseBg.id  = 'sg-base-bar-bg';
    const baseBar = document.createElement('div'); baseBar.id = 'sg-base-bar';
    baseBg.appendChild(baseBar); wrap.appendChild(baseBg);

    const announce = document.createElement('div'); announce.id = 'sg-announce'; wrap.appendChild(announce);
    const comboEl  = document.createElement('div'); comboEl.id  = 'sg-combo';   wrap.appendChild(comboEl);

    // Enemies left counter
    const enemyCount = document.createElement('div'); enemyCount.id = 'sg-enemies-left'; wrap.appendChild(enemyCount);

    // Dash indicator
    const dashInd = document.createElement('div'); dashInd.id = 'sg-dash-indicator'; dashInd.textContent = 'DASH [SHIFT] ●●●'; wrap.appendChild(dashInd);

    // Charge bar
    const chargeBar  = document.createElement('div'); chargeBar.id  = 'sg-charge-bar';
    const chargeFill = document.createElement('div'); chargeFill.id = 'sg-charge-fill';
    chargeBar.appendChild(chargeFill); wrap.appendChild(chargeBar);

    // Powers
    const powerBar = document.createElement('div'); powerBar.id = 'sg-power-bar';
    const POWERS = [
      {key:'1', icon:'🔫', name:'DOUBLE SHOT', cd:7000},
      {key:'2', icon:'🛡️', name:'SHIELD',      cd:10000},
      {key:'3', icon:'💣', name:'NOVA BOMB',   cd:18000},
      {key:'4', icon:'⏱️', name:'SLOW TIME',  cd:13000},
    ];
    const powerSlots = POWERS.map((p,i) => {
      const slot = document.createElement('div');
      slot.className = 'sg-power-slot ready';
      slot.innerHTML = `<span>${p.icon}</span><span class="sg-power-key">[${p.key}]</span><div class="sg-cd-fill" id="sg-cd-${i}" style="height:0%"></div>`;
      slot.id = `sg-ps-${i}`;
      powerBar.appendChild(slot);
      return slot;
    });
    wrap.appendChild(powerBar);

    const esc = document.createElement('button'); esc.id='sg-esc'; esc.textContent='ESC'; wrap.appendChild(esc);

    document.body.appendChild(wrap);
    document.body.classList.add('game-active');

    const ctx = canvas.getContext('2d');
    const W = () => canvas.width, H = () => canvas.height;
    function resize() { canvas.width=wrap.clientWidth; canvas.height=wrap.clientHeight; }
    resize();
    window.addEventListener('resize', resize);

    /* ── State ── */
    let running=true;
    let score=0, wave=1, baseHp=100, lives=3;
    let frameN=0;
    let comboCount=0, comboTimer=0;
    let slowFactor=1, slowTimer=0;
    let bossPhase=0, bossAlive=false;
    let shakeAmt=0;

    const powerCooldowns = POWERS.map(()=>0);
    const powerActive    = [false,false,false,false];

    /* ── Player ── */
    const P = {
      x:0, y:0, w:36, h:44, spd:6.5,
      inv:0, shield:false, shieldHp:0,
      dashCd:0, dashCharges:3, maxDashCharges:3, dashing:false, dashVx:0, dashTimer:0,
      chargeTime:0, charging:false,
    };

    /* ── Collections ── */
    let bullets=[], eBullets=[], enemies=[], drops=[], particles=[], obstacles=[];
    let shootTimer=0;
    const keys={};

    /* ── Announce ── */
    let annTimer=null;
    const annEl = document.getElementById('sg-announce');
    function showAnnounce(txt, color='#00ffe7', dur=1800) {
      annEl.textContent=txt; annEl.style.color=color;
      annEl.style.textShadow=`0 0 40px ${color}`; annEl.style.opacity='1';
      clearTimeout(annTimer);
      annTimer=setTimeout(()=>{ annEl.style.opacity='0'; }, dur);
    }

    /* ── Camera shake ── */
    function shake(amt) { shakeAmt = Math.max(shakeAmt, amt); }

    /* ── Particles ── */
    function burst(x,y,color,n=16,spd=4) {
      for(let i=0;i<n;i++){
        const a=Math.random()*Math.PI*2, s=Math.random()*spd+1;
        particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,r:Math.random()*3+1,life:1,decay:Math.random()*0.04+0.02,color});
      }
    }
    function textPop(x,y,txt,color='#f0a500') {
      particles.push({type:'text',x,y,vy:-1.2,txt,color,life:1,decay:0.018});
    }
    function burstRing(x,y,color,n=12,radius=30) {
      for(let i=0;i<n;i++){
        const a=(i/n)*Math.PI*2;
        particles.push({x:x+Math.cos(a)*radius*0.3, y:y+Math.sin(a)*radius*0.3,
          vx:Math.cos(a)*3.5, vy:Math.sin(a)*3.5, r:2.5, life:1, decay:0.025, color});
      }
    }

    /* ── Drops ── */
    function spawnDrop(x,y) {
      if(Math.random()>0.32) return;
      const types=['health','shield','bomb','slow','double'];
      const type=types[Math.floor(Math.random()*types.length)];
      const icons={health:'❤',shield:'🛡',bomb:'💣',slow:'⏱',double:'🔫'};
      drops.push({x,y,type,icon:icons[type],vy:1.0,life:300,bob:Math.random()*Math.PI*2});
    }

    /* ── Obstacles ── */
    function spawnObstacle() {
      const x=Math.random()*(W()-60)+30;
      obstacles.push({x, y:-20, w:22, h:22, hp:4, maxHp:4, vy:0.4+Math.random()*0.3, rot:0, rotSpd:(Math.random()-0.5)*0.04});
    }

    /* ── Enemy factory ── */
    function mkEnemy(type, x, y, waveN) {
      const base={x,y,vx:0,vy:0,inv:0};
      // shootInt is the ms between shots — keep it high so fewer bullets
      switch(type){
        case 'grunt':  return {...base, w:30,h:34, hp:1,
          spd:0.12+waveN*0.008, shootInt:2200, shootT:800+Math.random()*600,
          color:'#ff003c', pts:10*waveN, type:'grunt', dodge:0, dodgeT:0};
        case 'elite':  return {...base, w:36,h:42, hp:1+Math.floor(waveN/6),
          spd:0.16+waveN*0.01, shootInt:1800, shootT:600+Math.random()*500,
          color:'#ff6600', pts:25*waveN, type:'elite', dodge:0, dodgeT:0, zigzag:0};
        case 'hunter': return {...base, w:44,h:50, hp:3+Math.floor(waveN/3),
          spd:0.09+waveN*0.007, shootInt:2600, shootT:1200,
          color:'#cc00ff', pts:50*waveN, type:'hunter', dodge:0, dodgeT:0, charge:false, chargeT:0};
        case 'jackal': return {...base, w:28,h:36, hp:1,
          spd:0.35+waveN*0.015, shootInt:9999, shootT:0,
          color:'#00aaff', pts:15*waveN, type:'jackal', dodge:0, dodgeT:0, shield:true};
        case 'boss':   return {...base, w:80,h:70, hp:25+waveN*5, maxHp:25+waveN*5,
          spd:0.16+waveN*0.015, shootInt:1400, shootT:400,
          color:'#ff0080', pts:500*waveN, type:'boss',
          phase:0, sideDir:1, sideT:0, dodge:0, dodgeT:0, pattern:0, patternT:0};
      }
    }

    /* ── Wave spawner — formation patterns ── */
    function spawnWave(n) {
      const configs = [
        [{t:'grunt',c:4}],
        [{t:'grunt',c:5},{t:'jackal',c:1}],
        [{t:'grunt',c:4},{t:'elite',c:1}],
        [{t:'elite',c:3},{t:'jackal',c:2}],
        [{t:'hunter',c:1},{t:'grunt',c:3},{t:'elite',c:1}],
        [{t:'hunter',c:1},{t:'elite',c:2},{t:'jackal',c:2}],
      ];
      const cfg = configs[Math.min(n-1, configs.length-1)];
      const formation = (n % 3 === 0) ? 'V' : (n % 3 === 1) ? 'line' : 'stagger';
      let idx=0, total=0;
      cfg.forEach(g=>total+=g.c);

      cfg.forEach(g => {
        for(let i=0;i<g.c;i++){
          idx++;
          let ex, ey;
          if(formation==='V'){
            const half=Math.floor(total/2);
            const dist=Math.abs(idx-half-0.5);
            ex=W()/2 + (idx-half-0.5)*(W()/(total+1));
            ey=-50 - dist*40;
          } else if(formation==='line'){
            ex=(W()/(total+1))*idx;
            ey=-60;
          } else {
            ex=(W()/(total+1))*idx;
            ey=-60 - (idx%2)*60;
          }
          enemies.push(mkEnemy(g.t, ex-15, ey, n));
        }
      });

      // Spawn an obstacle every 2 waves
      if(n%2===0) spawnObstacle();
    }

    /* ── Boss spawner ── */
    function spawnBoss(phase) {
      bossAlive=true;
      const b=mkEnemy('boss', W()/2-40, -100, phase+1);
      b.pattern=phase%3;
      enemies.push(b);
      showAnnounce(`⚠ BOSS ${phase+1}/5 ⚠`,'#ff0080',2500);
      bossRoar();
    }

    /* ── Powers ── */
    function activatePower(i) {
      if(powerCooldowns[i]>0) return;
      switch(i){
        case 0: // Double shot
          powerActive[0]=true;
          setTimeout(()=>powerActive[0]=false, 5000);
          showAnnounce('🔫 DOUBLE SHOT','#00ffe7',1200);
          break;
        case 1: // Shield
          P.shield=true; P.shieldHp=6;
          showAnnounce('🛡️ SHIELD ACTIVE','#00c8ff',1200);
          break;
        case 2: // Nova bomb
          bombSound(); shake(12);
          burst(W()/2,H()/2,'#f0a500',60,9);
          burstRing(W()/2,H()/2,'#f0a500',20,100);
          showAnnounce('💣 NOVA BOMB','#f0a500',1200);
          enemies=enemies.filter(en=>{
            if(en.type!=='boss'){ burst(en.x+en.w/2,en.y+en.h/2,en.color,20); score+=en.pts; return false; }
            en.hp-=20; return true;
          });
          break;
        case 3: // Slow time
          slowFactor=0.28; slowTimer=5000;
          showAnnounce('⏱ SLOW TIME','#7ab8d4',1200);
          break;
      }
      powerCooldowns[i]=POWERS[i].cd;
      powerUp();
    }

    /* ── Input ── */
    function onKeyDown(e) {
      if(e.key==='Escape'){ endGame(false); return; }
      keys[e.key]=true;
      if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown',' '].includes(e.key)) e.preventDefault();
      if(e.key==='1') activatePower(0);
      if(e.key==='2') activatePower(1);
      if(e.key==='3') activatePower(2);
      if(e.key==='4') activatePower(3);
      // Dash
      if((e.key==='Shift'||e.key==='ShiftLeft'||e.key==='ShiftRight') && P.dashCharges>0 && !P.dashing){
        const dir=(keys['ArrowLeft']||keys['a']||keys['A'])?-1:(keys['ArrowRight']||keys['d']||keys['D'])?1:0;
        if(dir!==0){
          P.dashing=true; P.dashVx=dir*18; P.dashTimer=180; P.inv=400;
          P.dashCharges=Math.max(0,P.dashCharges-1);
          dashSound(); burst(P.x+P.w/2,P.y+P.h/2,'#00ffe7',8,3);
        }
      }
    }
    function onKeyUp(e) { keys[e.key]=false; }
    document.addEventListener('keydown', onKeyDown, true);
    document.addEventListener('keyup',   onKeyUp);
    esc.addEventListener('click',()=>endGame(false));

    // Touch
    let touchX=null;
    canvas.addEventListener('touchstart',e=>{ touchX=e.touches[0].clientX; e.preventDefault(); },{passive:false});
    canvas.addEventListener('touchmove', e=>{
      const dx=e.touches[0].clientX-touchX; touchX=e.touches[0].clientX;
      P.x=Math.max(0,Math.min(W()-P.w, P.x+dx*1.4));
      e.preventDefault();
    },{passive:false});
    // Double-tap dash on mobile
    let lastTap=0;
    canvas.addEventListener('touchstart',e=>{
      const now=Date.now();
      if(now-lastTap<300 && P.dashCharges>0){
        P.dashing=true; P.dashVx=(P.x<W()/2?1:-1)*16; P.dashTimer=150; P.inv=400;
        P.dashCharges=Math.max(0,P.dashCharges-1);
        dashSound();
      }
      lastTap=now;
    },{passive:true});

    /* ── Update ── */
    function update(dt) {
      frameN++;
      const sf=slowFactor;

      // Timers
      if(slowTimer>0){ slowTimer-=dt; if(slowTimer<=0) slowFactor=1; }
      if(shakeAmt>0) shakeAmt*=0.85;

      // Power cooldowns
      POWERS.forEach((_,i)=>{
        if(powerCooldowns[i]>0){ powerCooldowns[i]-=dt; if(powerCooldowns[i]<0) powerCooldowns[i]=0; }
      });

      // Dash charge regen (1 charge every 3s)
      if(P.dashCd>0) P.dashCd-=dt;
      if(P.dashCd<=0 && P.dashCharges<P.maxDashCharges){ P.dashCharges++; P.dashCd=3000; }

      // Player movement
      P.y=H()-P.h-28;
      if(P.dashing){
        P.x+=P.dashVx*sf;
        P.dashTimer-=dt;
        if(P.dashTimer<=0){ P.dashing=false; P.dashVx=0; }
        burst(P.x+P.w/2, P.y+P.h/2, '#00c8ff', 3, 2);
      } else {
        if((keys['ArrowLeft']||keys['a']||keys['A']) && P.x>0)     P.x-=P.spd*sf;
        if((keys['ArrowRight']||keys['d']||keys['D']) && P.x<W()-P.w) P.x+=P.spd*sf;
      }
      P.x=Math.max(0,Math.min(W()-P.w,P.x));
      if(P.inv>0) P.inv-=dt;

      // Charge shot (hold SPACE)
      if(keys[' ']){
        P.charging=true;
        P.chargeTime=Math.min(P.chargeTime+dt, 1500);
      } else if(P.charging){
        P.charging=false;
        if(P.chargeTime>=400){
          // Super shot
          const power=P.chargeTime/1500;
          const w=6+power*10, n=Math.round(1+power*3);
          for(let i=0;i<n;i++){
            const spread=(i-(n-1)/2)*20;
            bullets.push({x:P.x+P.w/2+spread-w/2, y:P.y, w, h:20+power*10, spd:14, super:true});
          }
          superShoot(); shake(3);
        }
        P.chargeTime=0;
      }

      // Auto shoot
      if(!P.charging){
        shootTimer+=dt;
        const interval=powerActive[0]?90:160;
        if(shootTimer>=interval){
          shootTimer=0;
          bullets.push({x:P.x+P.w/2-2,y:P.y,w:4,h:14,spd:13});
          if(powerActive[0]) bullets.push({x:P.x+P.w/2-10,y:P.y+8,w:4,h:12,spd:12});
          shoot();
        }
      }

      // Move bullets
      bullets=bullets.filter(b=>b.y+b.h>0);
      bullets.forEach(b=>b.y-=b.spd*sf);

      // Combo decay
      if(comboTimer>0){ comboTimer-=dt; if(comboTimer<=0){ comboCount=0; comboEl.style.opacity='0'; } }

      // Drops
      drops.forEach(d=>{ d.bob+=0.05; d.y+=d.vy*sf; d.life--; });
      drops=drops.filter(d=>d.life>0&&d.y<H()+20);
      drops=drops.filter(d=>{
        const hit=d.x<P.x+P.w&&d.x+20>P.x&&d.y<P.y+P.h&&d.y+20>P.y;
        if(hit){
          powerUp(); textPop(d.x,d.y,'+'+d.icon);
          switch(d.type){
            case 'health':  baseHp=Math.min(100,baseHp+25); lives=Math.min(5,lives+1); break;
            case 'shield':  P.shield=true; P.shieldHp=4; break;
            case 'bomb':    activatePower(2); break;
            case 'slow':    activatePower(3); break;
            case 'double':  activatePower(0); break;
          }
        }
        return !hit;
      });

      // Obstacles: float and rotate, block bullets
      obstacles.forEach(o=>{ o.y+=o.vy*sf; o.rot+=o.rotSpd; });
      obstacles=obstacles.filter(o=>o.y<H()+30 && o.hp>0);

      // Player bullets vs obstacles
      bullets=bullets.filter(b=>{
        let blocked=false;
        obstacles.forEach(o=>{
          if(!blocked && b.x<o.x+o.w&&b.x+b.w>o.x&&b.y<o.y+o.h&&b.y+b.h>o.y){
            blocked=true; o.hp--; burst(b.x,b.y,'#888',4,2);
            if(o.hp<=0){ burst(o.x+o.w/2,o.y+o.h/2,'#aaa',12,3); explode(); }
          }
        });
        return !blocked;
      });

      // Enemies
      enemies.forEach(en=>{
        en.y+=en.spd*sf;

        if(en.type==='elite'){
          en.zigzag=(en.zigzag||0)+0.03*sf;
          en.x+=Math.sin(en.zigzag)*1.0*sf;
        }
        if(en.type==='hunter'){
          en.chargeT=(en.chargeT||0)+dt;
          if(en.chargeT>2500){ en.charge=true; }
          if(en.chargeT>2900){ en.chargeT=0; en.charge=false; }
          if(en.charge) en.y+=0.9*sf;
        }
        if(en.type==='boss'){
          en.sideT+=dt;
          if(en.sideT>1400){ en.sideDir*=-1; en.sideT=0; }
          // Boss movement patterns
          const pat=en.pattern||0;
          if(pat===0){ // side to side
            en.x+=en.sideDir*(1.2+en.phase*0.4)*sf;
          } else if(pat===1){ // figure-8
            en.patternT=(en.patternT||0)+dt*0.001;
            en.x=W()/2-en.w/2+Math.sin(en.patternT)*W()*0.35;
            en.y=Math.max(80, Math.min(180, 80+Math.sin(en.patternT*2)*60));
          } else { // spiral dive
            en.patternT=(en.patternT||0)+dt*0.0015;
            en.x=W()/2-en.w/2+Math.cos(en.patternT)*W()*0.3;
            en.y=Math.max(60, en.y);
          }
          en.x=Math.max(0,Math.min(W()-en.w,en.x));
          const pct=en.hp/en.maxHp;
          if(pct<0.5&&en.phase===0){ en.phase=1; showAnnounce('⚠ BOSS ENRAGED','#ff0080',1500); }
          if(pct<0.25&&en.phase===1){ en.phase=2; showAnnounce('⚠ FINAL FORM','#ff003c',1500); }
        }

        // Dodge (mild)
        en.dodgeT-=dt;
        if(en.dodgeT<=0){ en.dodge=(Math.random()<0.5?-1:1); en.dodgeT=600+Math.random()*800; }
        if(en.type!=='boss') en.x+=en.dodge*(wave*0.04+0.08)*sf;
        en.x=Math.max(0,Math.min(W()-en.w,en.x));

        // Shoot — single bullet only, generous interval
        en.shootT-=dt*sf;
        if(en.shootT<=0){
          en.shootT=en.shootInt+Math.random()*en.shootInt*0.4;
          const cx=en.x+en.w/2, cy=en.y+en.h;
          const px=P.x+P.w/2,   py=P.y+P.h/2;
          const dist=Math.sqrt((px-cx)**2+(py-cy)**2)||1;
          const spd= en.type==='boss'   ? 1.1+en.phase*0.15 :
                     en.type==='hunter' ? 1.4 : 0.9+wave*0.03;
          // Boss phase 1+: shoots 2 bullets (not 3), wider spread
          const shots=(en.type==='boss'&&en.phase>=1)?2:1;
          for(let s=0;s<shots;s++){
            const spread=(s-(shots-1)/2)*0.35;
            eBullets.push({
              x:cx-4, y:cy,
              vx:(px-cx)/dist*spd+spread, vy:(py-cy)/dist*spd,
              w:8, h:8, color:en.color, r:4
            });
          }
        }
      });

      // Move enemy bullets
      eBullets=eBullets.filter(b=>b.y<H()+20&&b.x>-20&&b.x<W()+20);
      eBullets.forEach(b=>{ b.x+=b.vx*sf; b.y+=b.vy*sf; });

      // Enemy bullets vs obstacles (block)
      eBullets=eBullets.filter(b=>{
        let blocked=false;
        obstacles.forEach(o=>{
          if(!blocked&&b.x<o.x+o.w&&b.x+b.w>o.x&&b.y<o.y+o.h&&b.y+b.h>o.y){
            blocked=true; burst(b.x,b.y,'#888',4,2);
          }
        });
        return !blocked;
      });

      // Player bullets vs enemies
      bullets=bullets.filter(pb=>{
        let hit=false;
        enemies=enemies.filter(en=>{
          if(hit) return true;
          const jackShield=en.type==='jackal'&&en.shield;
          const col=pb.x<en.x+en.w&&pb.x+pb.w>en.x&&pb.y<en.y+en.h&&pb.y+pb.h>en.y;
          if(col&&!jackShield){
            hit=true;
            const dmg=pb.super?3:1;
            en.hp-=dmg; burst(pb.x,pb.y,en.color,pb.super?10:5,3);
            if(en.hp<=0){
              burst(en.x+en.w/2,en.y+en.h/2,en.color,en.type==='boss'?60:22,5);
              burstRing(en.x+en.w/2,en.y+en.h/2,en.color,10);
              explode(); shake(en.type==='boss'?8:3);
              comboCount++; comboTimer=2500;
              const mul=Math.min(comboCount,8);
              const pts=en.pts*mul;
              score+=pts;
              textPop(en.x+en.w/2,en.y,`+${pts}${mul>1?` x${mul}`:''}`,comboCount>3?'#f0a500':'#00ffe7');
              if(comboCount>2){ comboEl.textContent=`${comboCount}× COMBO`; comboEl.style.opacity='1'; }
              if(en.type==='boss'){ bossAlive=false; levelUp(); bossPhase++; }
              spawnDrop(en.x+en.w/2,en.y+en.h/2);
              return false;
            }
            en.inv=220;
          }
          if(col&&jackShield){ hit=true; burst(pb.x,pb.y,'#00aaff',5,2); }
          return true;
        });
        return !hit;
      });

      // Enemy bullets vs player
      if(P.inv<=0){
        eBullets=eBullets.filter(b=>{
          const col=b.x<P.x+P.w&&b.x+b.w>P.x&&b.y<P.y+P.h&&b.y+b.h>P.y;
          if(col){
            burst(b.x,b.y,b.color,8,3);
            if(P.shield){
              eBullets.push({...b,vx:-b.vx*1.2,vy:-b.vy*1.2,color:'#00ffe7'});
              P.shieldHp--; if(P.shieldHp<=0) P.shield=false;
              showAnnounce('🛡 REFLECTED!','#00c8ff',700);
            } else {
              hitSound(); shake(6);
              P.inv=3500; comboCount=0; comboEl.style.opacity='0';
              if(mode==='survival'||mode==='boss') lives--;
              else baseHp-=2;
            }
            return false;
          }
          return true;
        });
      }

      // Enemies reach base
      enemies=enemies.filter(en=>{
        if(en.y+en.h>=H()-10){
          burst(en.x+en.w/2,en.y+en.h/2,en.color,20,4); explode(); shake(5);
          if(mode==='survival'||mode==='boss') lives--;
          else baseHp-=3;
          hitSound(); return false;
        }
        return true;
      });

      if(mode==='survival') score+=Math.floor(dt/50);

      // Particles
      particles=particles.filter(p=>p.life>0);
      particles.forEach(p=>{ p.x+=p.vx||0; p.y+=p.vy||0; if(!p.type) p.vy+=0.07; p.life-=p.decay; });

      baseHp=Math.max(0,Math.min(100,baseHp));

      // Wave / boss logic
      if(mode==='classic'||mode==='shield'){
        if(enemies.length===0&&!bossAlive){
          if(wave%5===0){ spawnBoss(bossPhase); }
          else { setTimeout(()=>{ wave++; showAnnounce(`WAVE ${wave}`,'#00ffe7',1500); spawnWave(wave); },1400); }
          wave++;
        }
        if(baseHp<=0) endGame(false);
      }
      if(mode==='survival'){
        if(enemies.length<2+Math.floor(score/2500)&&frameN%260===0){
          const types=['grunt','grunt','elite','jackal'];
          const t=types[Math.floor(Math.random()*types.length)];
          enemies.push(mkEnemy(t,Math.random()*(W()-40),-60,Math.max(1,Math.floor(score/1800))));
        }
        if(lives<=0) endGame(false);
      }
      if(mode==='boss'){
        if(enemies.length===0&&!bossAlive){
          if(bossPhase>=5) endGame(true);
          else setTimeout(()=>spawnBoss(bossPhase),1200);
        }
        if(lives<=0) endGame(false);
      }

      // HUD
      document.getElementById('sg-h-score').textContent=`SCORE · ${score.toLocaleString()}`;
      document.getElementById('sg-h-wave').textContent=mode==='boss'?`BOSS ${bossPhase+1}/5`:`WAVE · ${wave}`;
      const bars=Math.ceil(baseHp/100*6);
      const baseEl=document.getElementById('sg-h-base');
      if(mode==='survival'||mode==='boss'){
        baseEl.textContent=`❤ ${lives}`;
      } else {
        baseEl.textContent=`BASE ${'█'.repeat(bars)}${'░'.repeat(6-bars)}`;
      }
      baseEl.className=`sg-hud-cell${baseHp<30?' crit':baseHp<60?' warn':''}`;
      document.getElementById('sg-h-lives').textContent='❤'.repeat(Math.max(0,lives));
      baseBar.style.width=(mode==='survival'||mode==='boss'?lives/5*100:baseHp)+'%';
      if(baseHp<30) baseBar.style.background='linear-gradient(90deg,#ff003c,#ff6600)';

      // Power slots
      POWERS.forEach((_,i)=>{
        const slot=powerSlots[i];
        const fill=document.getElementById(`sg-cd-${i}`);
        if(powerCooldowns[i]>0){
          slot.className='sg-power-slot cooldown';
          if(fill) fill.style.height=((powerCooldowns[i]/POWERS[i].cd)*100)+'%';
        } else {
          slot.className='sg-power-slot ready';
          if(fill) fill.style.height='0%';
        }
      });

      // Charge bar
      if(P.charging&&P.chargeTime>100){
        chargeBar.style.opacity='1';
        chargeFill.style.width=(P.chargeTime/1500*100)+'%';
      } else {
        chargeBar.style.opacity='0';
      }

      // Enemies left
      enemyCount.textContent=enemies.length>0?`${enemies.length} INIMIGOS`:'';

      // Dash indicator
      const dots='●'.repeat(P.dashCharges)+'○'.repeat(P.maxDashCharges-P.dashCharges);
      dashInd.textContent=`DASH [SHIFT] ${dots}`;
      dashInd.style.color=P.dashCharges>0?'rgba(0,200,255,0.55)':'rgba(255,100,0,0.5)';
    }

    /* ── Draw ── */
    function drawSpartan(x,y,w,h,inv,shield) {
      if(inv>200&&Math.floor(inv/80)%2===0) return;
      ctx.save();
      // Dash trail
      if(P.dashing){
        ctx.globalAlpha=0.3; ctx.fillStyle='#00c8ff';
        ctx.fillRect(x+w*.2,y+h*.3,w*.6,h*.55);
        ctx.globalAlpha=1;
      }
      if(shield){
        ctx.beginPath(); ctx.arc(x+w/2,y+h/2,w*0.85,0,Math.PI*2);
        ctx.strokeStyle='#00c8ff'; ctx.lineWidth=3;
        ctx.shadowBlur=20; ctx.shadowColor='#00c8ff';
        ctx.globalAlpha=0.55; ctx.stroke(); ctx.globalAlpha=1;
      }
      ctx.shadowBlur=18; ctx.shadowColor='#00ffe7';
      ctx.fillStyle='#00ffe7'; ctx.fillRect(x+w*.2,y+h*.3,w*.6,h*.55);
      ctx.fillStyle='#00c8ff'; ctx.fillRect(x+w*.15,y+h*.05,w*.7,h*.3);
      ctx.fillStyle='#f0a500'; ctx.shadowColor='#f0a500';
      ctx.fillRect(x+w*.25,y+h*.1,w*.5,h*.15);
      ctx.fillStyle='rgba(255,255,255,0.15)'; ctx.fillRect(x+w*.28,y+h*.12,w*.2,h*.05);
      ctx.fillStyle='#00ffe7'; ctx.shadowColor='#00ffe7';
      ctx.fillRect(x+w*.2,y+h*.82,w*.25,h*.18);
      ctx.fillRect(x+w*.55,y+h*.82,w*.25,h*.18);
      // Charge glow
      if(P.charging&&P.chargeTime>200){
        const r=P.chargeTime/1500;
        ctx.shadowBlur=30*r; ctx.shadowColor='#f0a500';
        ctx.strokeStyle=`rgba(240,165,0,${r*0.8})`; ctx.lineWidth=2;
        ctx.beginPath(); ctx.arc(x+w/2,y+h/2,w*(0.6+r*0.4),0,Math.PI*2); ctx.stroke();
      }
      ctx.restore();
    }

    function drawEnemy(en) {
      if(en.inv>0&&Math.floor(en.inv/60)%2===0) return;
      ctx.save();
      ctx.shadowBlur=14; ctx.shadowColor=en.color; ctx.fillStyle=en.color;
      if(en.type==='boss'){
        ctx.beginPath();
        ctx.moveTo(en.x+en.w/2,en.y);
        ctx.lineTo(en.x+en.w,en.y+en.h*.4);
        ctx.lineTo(en.x+en.w*.85,en.y+en.h);
        ctx.lineTo(en.x+en.w*.15,en.y+en.h);
        ctx.lineTo(en.x,en.y+en.h*.4);
        ctx.closePath(); ctx.fill();
        // HP bar
        const pct=en.hp/en.maxHp;
        ctx.fillStyle='rgba(0,0,0,0.5)'; ctx.fillRect(en.x,en.y-14,en.w,7);
        ctx.fillStyle=pct>0.5?en.color:pct>0.25?'#ff6600':'#ff003c';
        ctx.fillRect(en.x,en.y-14,en.w*pct,7);
        // Eye
        ctx.fillStyle='#fff'; ctx.shadowColor='#fff'; ctx.shadowBlur=10;
        ctx.beginPath(); ctx.arc(en.x+en.w/2,en.y+en.h*.38,9,0,Math.PI*2); ctx.fill();
        ctx.fillStyle=en.phase>0?'#ff003c':'#000';
        ctx.beginPath(); ctx.arc(en.x+en.w/2,en.y+en.h*.38,5,0,Math.PI*2); ctx.fill();
        // Phase indicator wings
        if(en.phase>=1){
          ctx.fillStyle=en.color; ctx.shadowBlur=18;
          ctx.beginPath(); ctx.moveTo(en.x-10,en.y+en.h*.3); ctx.lineTo(en.x-30,en.y+en.h*.1); ctx.lineTo(en.x-5,en.y+en.h*.7); ctx.closePath(); ctx.fill();
          ctx.beginPath(); ctx.moveTo(en.x+en.w+10,en.y+en.h*.3); ctx.lineTo(en.x+en.w+30,en.y+en.h*.1); ctx.lineTo(en.x+en.w+5,en.y+en.h*.7); ctx.closePath(); ctx.fill();
        }
      } else if(en.type==='hunter'){
        ctx.beginPath(); ctx.arc(en.x+en.w/2,en.y+en.h/2,en.w/2,0,Math.PI*2); ctx.fill();
        ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.lineWidth=2;
        ctx.beginPath(); ctx.arc(en.x+en.w/2,en.y+en.h/2,en.w/2-4,0,Math.PI*2); ctx.stroke();
        // Eye
        ctx.fillStyle='#fff'; ctx.shadowColor='#fff'; ctx.shadowBlur=8;
        ctx.beginPath(); ctx.arc(en.x+en.w/2,en.y+en.h/2,5,0,Math.PI*2); ctx.fill();
      } else if(en.type==='jackal'){
        ctx.fillRect(en.x+en.w*.3,en.y+en.h*.1,en.w*.4,en.h*.8);
        if(en.shield){
          ctx.strokeStyle='#00aaff'; ctx.lineWidth=4; ctx.shadowColor='#00aaff'; ctx.shadowBlur=14;
          ctx.beginPath(); ctx.arc(en.x-4,en.y+en.h/2,en.h/2,Math.PI*3/2,Math.PI/2); ctx.stroke();
        }
      } else {
        ctx.beginPath(); ctx.arc(en.x+en.w/2,en.y+en.h*.35,en.w*.35,0,Math.PI*2); ctx.fill();
        ctx.fillRect(en.x+en.w*.2,en.y+en.h*.5,en.w*.6,en.h*.35);
        ctx.fillStyle='#fff'; ctx.shadowColor='#fff'; ctx.shadowBlur=5;
        ctx.beginPath(); ctx.arc(en.x+en.w*.35,en.y+en.h*.3,en.w*.08,0,Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(en.x+en.w*.65,en.y+en.h*.3,en.w*.08,0,Math.PI*2); ctx.fill();
        if(en.type==='elite'){
          ctx.fillStyle=en.color; ctx.shadowColor=en.color;
          ctx.fillRect(en.x-6,en.y+en.h*.2,8,en.h*.4);
          ctx.fillRect(en.x+en.w-2,en.y+en.h*.2,8,en.h*.4);
        }
      }
      ctx.restore();
    }

    function drawObstacle(o) {
      ctx.save();
      ctx.translate(o.x+o.w/2, o.y+o.h/2);
      ctx.rotate(o.rot);
      const pct=o.hp/o.maxHp;
      ctx.fillStyle=`rgba(80,80,100,${0.4+pct*0.4})`;
      ctx.strokeStyle=`rgba(120,120,160,${0.5+pct*0.3})`;
      ctx.lineWidth=2;
      ctx.shadowBlur=6; ctx.shadowColor='rgba(100,100,200,0.5)';
      ctx.fillRect(-o.w/2,-o.h/2,o.w,o.h);
      ctx.strokeRect(-o.w/2,-o.h/2,o.w,o.h);
      ctx.restore();
    }

    function draw() {
      ctx.save();
      // Camera shake
      if(shakeAmt>0.5){
        ctx.translate((Math.random()-0.5)*shakeAmt,(Math.random()-0.5)*shakeAmt);
      }

      ctx.clearRect(-20,-20,W()+40,H()+40);

      // Background grid
      ctx.strokeStyle='rgba(0,200,255,0.03)'; ctx.lineWidth=1;
      for(let x=0;x<W();x+=60){ ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H());ctx.stroke(); }
      for(let y=0;y<H();y+=60){ ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W(),y);ctx.stroke(); }

      // Scanlines
      ctx.fillStyle='rgba(0,0,0,0.025)';
      for(let y=0;y<H();y+=4) ctx.fillRect(0,y,W(),2);

      // Slow-time vignette
      if(slowFactor<1){
        ctx.save(); ctx.globalAlpha=0.1;
        const rg=ctx.createRadialGradient(W()/2,H()/2,W()*.2,W()/2,H()/2,W()*.8);
        rg.addColorStop(0,'transparent'); rg.addColorStop(1,'#4488ff');
        ctx.fillStyle=rg; ctx.fillRect(0,0,W(),H()); ctx.restore();
      }

      // Obstacles
      obstacles.forEach(o=>drawObstacle(o));

      // Drops (bobbing)
      drops.forEach(d=>{
        ctx.save();
        ctx.font=`${15+Math.sin(d.bob)*2}px serif`;
        ctx.globalAlpha=Math.min(1,d.life/60);
        ctx.shadowBlur=8; ctx.shadowColor='#00ffe7';
        ctx.fillText(d.icon,d.x,d.y+Math.sin(d.bob)*4);
        ctx.restore();
      });

      // Player bullets
      bullets.forEach(b=>{
        ctx.save();
        ctx.shadowBlur=b.super?24:14;
        ctx.shadowColor=b.super?'#f0a500':'#00ffe7';
        ctx.fillStyle=b.super?'#f0a500':'#00ffe7';
        ctx.fillRect(b.x,b.y,b.w,b.h);
        ctx.restore();
      });

      // Enemy bullets
      eBullets.forEach(b=>{
        ctx.save(); ctx.shadowBlur=12; ctx.shadowColor=b.color; ctx.fillStyle=b.color;
        ctx.beginPath(); ctx.arc(b.x+b.r,b.y+b.r,b.r,0,Math.PI*2); ctx.fill();
        ctx.restore();
      });

      enemies.forEach(en=>drawEnemy(en));
      drawSpartan(P.x,P.y,P.w,P.h,P.inv,P.shield);

      // Base line
      if(mode==='classic'||mode==='shield'){
        ctx.save(); ctx.strokeStyle='rgba(0,200,255,0.18)'; ctx.lineWidth=1;
        ctx.setLineDash([8,6]);
        ctx.beginPath(); ctx.moveTo(0,H()-8); ctx.lineTo(W(),H()-8); ctx.stroke();
        ctx.restore();
      }

      // Particles
      particles.forEach(p=>{
        ctx.save(); ctx.globalAlpha=Math.max(p.life,0);
        if(p.type==='text'){
          ctx.font=`bold 12px 'Orbitron',sans-serif`;
          ctx.fillStyle=p.color; ctx.shadowColor=p.color; ctx.shadowBlur=8;
          ctx.fillText(p.txt,p.x,p.y);
        } else {
          ctx.shadowBlur=8; ctx.shadowColor=p.color; ctx.fillStyle=p.color;
          ctx.beginPath(); ctx.arc(p.x,p.y,Math.max(p.r,0.1),0,Math.PI*2); ctx.fill();
        }
        ctx.restore();
      });

      ctx.restore(); // end shake transform
    }

    /* ── Loop ── */
    let raf, lastT=0;
    function loop(ts){
      if(!running) return;
      const dt=Math.min(ts-lastT,50); lastT=ts;
      update(dt); draw();
      raf=requestAnimationFrame(loop);
    }

    /* ── End Game ── */
    function endGame(won){
      running=false;
      stopBGMusic();
      cancelAnimationFrame(raf);
      document.removeEventListener('keydown',onKeyDown,true);
      document.removeEventListener('keyup',  onKeyUp);
      window.removeEventListener('resize',resize);
      document.body.classList.remove('game-active');
      setHS(mode,score);
      const hs=getHS();

      setTimeout(()=>{
        wrap.innerHTML='';
        wrap.style.cssText='position:fixed;inset:0;z-index:1000000;background:#020914;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1rem;font-family:Orbitron,sans-serif;color:#00ffe7;text-align:center;cursor:default;';
        const isHS=score>0&&score===hs[mode];
        wrap.innerHTML=`
          <div style="font-size:clamp(0.55rem,2vw,0.75rem);letter-spacing:6px;color:#7ab8d4;">${won?'SPARTAN — MISSÃO CUMPRIDA':'O COVENANT VENCEU'}</div>
          <div style="font-size:clamp(2rem,7vw,3.5rem);font-weight:900;letter-spacing:4px;text-shadow:0 0 40px #00ffe7;">${won?'VITÓRIA':'DERROTA'}</div>
          <div style="font-size:clamp(0.9rem,3vw,1.4rem);letter-spacing:4px;color:#f0a500;text-shadow:0 0 20px #f0a500;">${score.toLocaleString()} pts</div>
          ${isHS?`<div style="font-size:0.75rem;letter-spacing:4px;color:#00ffe7;">🏆 NOVO RECORDE!</div>`:''}
          <div style="font-size:0.6rem;letter-spacing:3px;color:rgba(0,200,255,0.4);">WAVES · ${wave-1} &nbsp;·&nbsp; MODO · ${mode.toUpperCase()} &nbsp;·&nbsp; RECORDE · ${(hs[mode]||0).toLocaleString()}</div>
          <div style="display:flex;gap:1rem;margin-top:1.5rem;flex-wrap:wrap;justify-content:center;">
            <button id="sg-retry"    style="padding:0.7rem 2rem;border:1px solid #00ffe7;background:rgba(0,200,255,0.08);color:#00ffe7;font-family:Orbitron,sans-serif;font-size:0.65rem;letter-spacing:3px;cursor:pointer;">REINICIAR</button>
            <button id="sg-menu-btn" style="padding:0.7rem 2rem;border:1px solid rgba(0,200,255,0.4);background:transparent;color:rgba(0,200,255,0.7);font-family:Orbitron,sans-serif;font-size:0.65rem;letter-spacing:3px;cursor:pointer;">MENU</button>
            <button id="sg-quit2"    style="padding:0.7rem 2rem;border:1px solid rgba(0,200,255,0.2);background:transparent;color:rgba(0,200,255,0.4);font-family:Orbitron,sans-serif;font-size:0.65rem;letter-spacing:3px;cursor:pointer;">SAIR</button>
          </div>
        `;
        document.body.classList.add('game-active');
        document.getElementById('sg-retry').onclick=()=>{ wrap.remove(); startGame(mode); };
        document.getElementById('sg-menu-btn').onclick=()=>{ closeGame(); openMenu(); };
        document.getElementById('sg-quit2').onclick=()=>{ closeGame(); };
      },500);
    }

    /* ── Init ── */
    P.x=W()/2-P.w/2;
    if(mode==='boss'){
      setTimeout(()=>spawnBoss(bossPhase),1200);
    } else {
      showAnnounce('WAVE 1','#00ffe7',1500);
      setTimeout(()=>spawnWave(1),1500);
    }
    requestAnimationFrame(ts=>{ lastT=ts; loop(ts); });
  }

})();


/* ── 6. TOOLTIP DE SEÇÃO NO SCROLL ───────────────────────────────
   Um pequeno HUD no canto mostra qual seção está sendo lida.       */
(function sectionHUD() {
  const hud = document.createElement('div');
  Object.assign(hud.style, {
    position: 'fixed',
    bottom: '2rem',
    right: '1.5rem',
    fontFamily: "'Orbitron', sans-serif",
    fontSize: '0.6rem',
    letterSpacing: '3px',
    color: 'rgba(0,200,255,0.55)',
    textTransform: 'uppercase',
    pointerEvents: 'none',
    zIndex: '5000',
    transition: 'opacity 0.4s',
    opacity: '0',
    textAlign: 'right',
  });
  document.body.appendChild(hud);

  const sectionNames = {
    sobre:        '// SOBRE',
    enredo:       '// ENREDO',
    'master-chief':'// MASTER CHIEF',
    diferencas:   '// DIFERENÇAS',
    cancelacao:   '// CANCELAÇÃO',
    temporadas:   '// TEMPORADAS',
    assista:      '// ONDE ASSISTIR',
  };

  let hudTimer = null;

  const sections = document.querySelectorAll('main section[id]');
  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          hud.textContent = sectionNames[entry.target.id] || '';
          hud.style.opacity = '1';
          clearTimeout(hudTimer);
          hudTimer = setTimeout(() => { hud.style.opacity = '0'; }, 2200);
        }
      });
    },
    { threshold: 0.5 }
  );

  sections.forEach(s => observer.observe(s));
})();

}); // fim do DOMContentLoaded

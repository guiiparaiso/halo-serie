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

  /* ══ BOTÃO SECRETO MOBILE: 5 taps no logo do header ══ */
  (function secretLogoTap() {
    const logo = document.getElementById('logo');
    if (!logo) return;
    let tapCount = 0, tapTimer = null;

    function handleTap(e) {
      // Bloqueia o href="#" para não rolar a página
      e.preventDefault();
      tapCount++;
      clearTimeout(tapTimer);
      if (tapCount >= 5) {
        tapCount = 0;
        openMenu();
        return;
      }
      tapTimer = setTimeout(function() { tapCount = 0; }, 1500);
    }

    // touchstart: sem delay de 300ms, funciona melhor no mobile
    logo.addEventListener('touchstart', handleTap, { passive: false });
    // click: fallback para desktop (Konami já funciona, mas deixa como backup)
    logo.addEventListener('click', function(e) {
      e.preventDefault();
    });
  })();

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

      /* ── CONTROLES TOUCH ── */
      #sg-touch-controls {
        position:absolute;bottom:0;left:0;right:0;
        height:160px;pointer-events:none;z-index:20;
        display:none;
      }
      #sg-touch-controls.visible { display:block; }

      /* Joystick esquerdo */
      #sg-joystick-zone {
        position:absolute;bottom:20px;left:20px;
        width:120px;height:120px;pointer-events:all;
      }
      #sg-joystick-base {
        position:absolute;inset:0;border-radius:50%;
        border:2px solid rgba(0,200,255,0.3);
        background:rgba(0,200,255,0.05);
      }
      #sg-joystick-knob {
        position:absolute;
        width:48px;height:48px;
        border-radius:50%;
        background:rgba(0,200,255,0.25);
        border:2px solid rgba(0,200,255,0.6);
        box-shadow:0 0 12px rgba(0,200,255,0.3);
        top:50%;left:50%;
        transform:translate(-50%,-50%);
        transition:transform 0.05s;
        pointer-events:none;
      }

      /* Botão de tiro */
      #sg-btn-shoot {
        position:absolute;bottom:30px;right:20px;
        width:72px;height:72px;border-radius:50%;
        border:2px solid rgba(0,200,255,0.5);
        background:rgba(0,200,255,0.1);
        color:#00ffe7;font-size:1.4rem;
        display:flex;align-items:center;justify-content:center;
        pointer-events:all;user-select:none;
        box-shadow:0 0 16px rgba(0,200,255,0.2);
        font-family:'Orbitron',sans-serif;font-size:0.5rem;
        letter-spacing:1px;flex-direction:column;gap:2px;
      }
      #sg-btn-shoot.active { background:rgba(0,200,255,0.3); box-shadow:0 0 24px rgba(0,200,255,0.5); }

      /* Botão dash */
      #sg-btn-dash {
        position:absolute;bottom:110px;right:100px;
        width:48px;height:48px;border-radius:50%;
        border:2px solid rgba(0,255,231,0.4);
        background:rgba(0,255,231,0.08);
        color:#00ffe7;font-size:0.45rem;letter-spacing:1px;
        display:flex;align-items:center;justify-content:center;
        pointer-events:all;user-select:none;
        font-family:'Orbitron',sans-serif;flex-direction:column;
      }
      #sg-btn-dash.active { background:rgba(0,255,231,0.25); }

      /* Botões de poderes touch */
      #sg-touch-powers {
        position:absolute;top:52px;right:4px;
        display:flex;flex-direction:column;gap:4px;
        pointer-events:all;
      }
      .sg-touch-power {
        width:40px;height:40px;border-radius:4px;
        border:1px solid rgba(0,200,255,0.3);
        background:rgba(0,200,255,0.06);
        display:flex;align-items:center;justify-content:center;
        font-size:1rem;pointer-events:all;user-select:none;
        position:relative;
      }
      .sg-touch-power.ready { border-color:#00ffe7; background:rgba(0,200,255,0.14); box-shadow:0 0 8px rgba(0,200,255,0.2); }
      .sg-touch-power.cooldown { opacity:0.35; }
      .sg-touch-power .sg-cd-fill { position:absolute;bottom:0;left:0;right:0;background:rgba(0,200,255,0.15);border-radius:0 0 4px 4px; }

      @media(min-width:701px){ #sg-touch-controls { display:none!important; } }
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
  

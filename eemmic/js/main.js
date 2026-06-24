/* ═══════════════════════════════════════════════════════════
   EEMMIC — main.js
   Background: energy grid — circuit lines, pulsing nodes,
   travelling electricity pulses, arc sparks, hex cells
   ═══════════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {

  /* ══════════════════════════════════════════════════════════
     1.  ENERGY GRID BACKGROUND
     ══════════════════════════════════════════════════════════ */
  const canvas = document.getElementById('ember-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let W, H;

  /* ── Colour palette ─── */
  const C = {
    amber:     'rgba(199,125,10,',
    amberBr:   'rgba(232,148,12,',
    amberHot:  'rgba(255,185,60,',
    white:     'rgba(240,237,230,',
    dim:       'rgba(199,125,10,0.06)',
    dimLine:   'rgba(199,125,10,0.10)',
  };

  /* ── State containers ─ */
  let nodes = [], edges = [], pulses = [], arcs = [], hexes = [];

  /* ════════════════════════════════════
     RESIZE  — rebuild everything
     ════════════════════════════════════ */
  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
    buildScene();
  }

  /* ════════════════════════════════════
     HEX GRID  (faint structural layer)
     ════════════════════════════════════ */
  function buildHexGrid() {
    hexes = [];
    const size = 52;
    const cols = Math.ceil(W / (size * 1.75)) + 2;
    const rows = Math.ceil(H / (size * 1.52)) + 2;
    for (let r = -1; r < rows; r++) {
      for (let c = -1; c < cols; c++) {
        const x = c * size * 1.75 + (r % 2 === 0 ? 0 : size * 0.875);
        const y = r * size * 1.52;
        hexes.push({ x, y, s: size,
          alpha: 0.04 + Math.random() * 0.05,
          pulse: Math.random() * Math.PI * 2,
          speed: 0.003 + Math.random() * 0.005 });
      }
    }
  }

  function drawHex({ x, y, s, alpha, pulse }) {
    const a = alpha + Math.sin(pulse) * 0.025;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i - Math.PI / 6;
      const px = x + s * Math.cos(angle);
      const py = y + s * Math.sin(angle);
      i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.strokeStyle = C.amber + a + ')';
    ctx.lineWidth = 0.5;
    ctx.stroke();
  }

  /* ════════════════════════════════════
     CIRCUIT NODES  (power substations)
     ════════════════════════════════════ */
  function buildNodes() {
    nodes = [];
    // Distribute nodes across a grid with jitter
    const cols = Math.max(3, Math.floor(W / 200));
    const rows = Math.max(3, Math.floor(H / 160));
    const cellW = W / cols, cellH = H / rows;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        nodes.push({
          x:       cellW * c + cellW * (0.2 + Math.random() * 0.6),
          y:       cellH * r + cellH * (0.2 + Math.random() * 0.6),
          r:       2 + Math.random() * 3,
          phase:   Math.random() * Math.PI * 2,
          speed:   0.012 + Math.random() * 0.02,
          major:   Math.random() < 0.18,   // larger hub nodes
          active:  false,
        });
      }
    }
  }

  /* ════════════════════════════════════
     EDGES  (circuit traces between nodes)
     ════════════════════════════════════ */
  function buildEdges() {
    edges = [];
    const MAX_DIST = Math.min(W, H) * 0.32;
    nodes.forEach((a, i) => {
      nodes.forEach((b, j) => {
        if (j <= i) return;
        const dx = b.x - a.x, dy = b.y - a.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < MAX_DIST && Math.random() < 0.55) {
          edges.push({ a: i, b: j, dist,
            alpha: 0.06 + Math.random() * 0.10,
            dash: Math.random() < 0.3,
          });
        }
      });
    });
  }

  /* ════════════════════════════════════
     PULSE SYSTEM  (electricity travelling along edges)
     ════════════════════════════════════ */
  function spawnPulse() {
    if (!edges.length) return;
    const edge = edges[Math.floor(Math.random() * edges.length)];
    const fwd  = Math.random() < 0.5;
    pulses.push({
      edge,
      t:      0,
      speed:  0.003 + Math.random() * 0.005,
      fwd,
      size:   1.5 + Math.random() * 2.5,
      bright: 0.6 + Math.random() * 0.4,
      tail:   [],          // stores recent positions for tail trail
    });
  }

  /* ════════════════════════════════════
     ARC SPARKS  (random lightning arcs)
     ════════════════════════════════════ */
  function spawnArc() {
    if (nodes.length < 2) return;
    const i = Math.floor(Math.random() * nodes.length);
    let j = Math.floor(Math.random() * nodes.length);
    while (j === i) j = Math.floor(Math.random() * nodes.length);
    const a = nodes[i], b = nodes[j];
    const dx = b.x - a.x, dy = b.y - a.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > 260) return;

    // Build a jagged lightning path
    const segs = 4 + Math.floor(Math.random() * 5);
    const pts  = [{ x: a.x, y: a.y }];
    for (let s = 1; s < segs; s++) {
      const frac = s / segs;
      const mx   = a.x + dx * frac + (Math.random() - 0.5) * 28;
      const my   = a.y + dy * frac + (Math.random() - 0.5) * 28;
      pts.push({ x: mx, y: my });
    }
    pts.push({ x: b.x, y: b.y });

    arcs.push({ pts, life: 0, maxLife: 8 + Math.floor(Math.random() * 10) });
  }

  /* ════════════════════════════════════
     BUILD WHOLE SCENE
     ════════════════════════════════════ */
  function buildScene() {
    buildHexGrid();
    buildNodes();
    buildEdges();
    pulses = [];
    arcs   = [];
    // Pre-spawn several pulses
    for (let i = 0; i < 14; i++) spawnPulse();
  }

  /* ════════════════════════════════════
     DRAW  —  called every frame
     ════════════════════════════════════ */
  function draw() {
    ctx.clearRect(0, 0, W, H);

    /* ── 1. Hex grid ── */
    hexes.forEach(h => {
      h.pulse += h.speed;
      drawHex(h);
    });

    /* ── 2. Edges / circuit traces ── */
    edges.forEach(e => {
      const a = nodes[e.a], b = nodes[e.b];
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      // slight orthogonal bend — circuit PCB style
      const mx = (a.x + b.x) / 2;
      ctx.lineTo(mx, a.y);
      ctx.lineTo(mx, b.y);
      ctx.lineTo(b.x, b.y);
      ctx.strokeStyle = C.amber + e.alpha + ')';
      ctx.lineWidth   = 0.7;
      if (e.dash) {
        ctx.setLineDash([4, 8]);
      } else {
        ctx.setLineDash([]);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    });

    /* ── 3. Nodes / substations ── */
    nodes.forEach(n => {
      n.phase += n.speed;
      const pulse = 0.5 + 0.5 * Math.sin(n.phase);
      const baseR = n.major ? 5 : n.r;
      const glowR = baseR * (1 + 0.6 * pulse);

      // Outer glow ring
      const grd = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, glowR * 5);
      grd.addColorStop(0, C.amberBr + (0.25 * pulse) + ')');
      grd.addColorStop(1, C.amber + '0)');
      ctx.beginPath();
      ctx.arc(n.x, n.y, glowR * 5, 0, Math.PI * 2);
      ctx.fillStyle = grd;
      ctx.fill();

      // Core dot
      ctx.beginPath();
      ctx.arc(n.x, n.y, glowR, 0, Math.PI * 2);
      ctx.fillStyle = C.amberHot + (0.4 + 0.55 * pulse) + ')';
      ctx.fill();

      // Cross tick marks for major nodes
      if (n.major) {
        const tick = glowR * 2.5;
        ctx.strokeStyle = C.amber + '0.35)';
        ctx.lineWidth = 0.7;
        ctx.beginPath();
        ctx.moveTo(n.x - tick, n.y); ctx.lineTo(n.x + tick, n.y);
        ctx.moveTo(n.x, n.y - tick); ctx.lineTo(n.x, n.y + tick);
        ctx.stroke();
      }
    });

    /* ── 4. Travelling pulses ── */
    pulses.forEach((p, pi) => {
      p.t += p.speed;
      const e  = p.edge;
      const nA = nodes[e.a], nB = nodes[e.b];
      const src = p.fwd ? nA : nB;
      const dst = p.fwd ? nB : nA;

      // PCB path: go horizontal first then vertical (matching edge drawing)
      const mx  = (src.x + dst.x) / 2;
      const seg1End  = { x: mx,    y: src.y };
      const seg2End  = { x: mx,    y: dst.y };
      // Total path length approximation
      const d1  = Math.abs(mx - src.x);
      const d2  = Math.abs(dst.y - src.y);
      const d3  = Math.abs(dst.x - mx);
      const tot = d1 + d2 + d3 || 1;
      const pos = p.t * tot;

      let px, py;
      if (pos < d1) {
        const f = pos / d1;
        px = src.x + (mx - src.x) * f;
        py = src.y;
      } else if (pos < d1 + d2) {
        const f = (pos - d1) / d2;
        px = mx;
        py = src.y + (dst.y - src.y) * f;
      } else {
        const f = (pos - d1 - d2) / d3;
        px = mx + (dst.x - mx) * f;
        py = dst.y;
      }

      // Tail trail
      p.tail.unshift({ x: px, y: py });
      if (p.tail.length > 18) p.tail.pop();

      // Draw tail
      p.tail.forEach((pt, ti) => {
        const ta = (1 - ti / p.tail.length) * 0.7 * p.bright;
        const tr = p.size * (1 - ti / p.tail.length);
        if (tr < 0.2) return;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, tr, 0, Math.PI * 2);
        ctx.fillStyle = C.amberHot + ta + ')';
        ctx.fill();
      });

      // Head glow
      const hGrd = ctx.createRadialGradient(px, py, 0, px, py, p.size * 4);
      hGrd.addColorStop(0, C.white   + (0.7 * p.bright) + ')');
      hGrd.addColorStop(0.3, C.amberHot + (0.5 * p.bright) + ')');
      hGrd.addColorStop(1, C.amber + '0)');
      ctx.beginPath();
      ctx.arc(px, py, p.size * 4, 0, Math.PI * 2);
      ctx.fillStyle = hGrd;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(px, py, p.size, 0, Math.PI * 2);
      ctx.fillStyle = C.white + p.bright + ')';
      ctx.fill();

      if (p.t >= 1) {
        pulses.splice(pi, 1);
        spawnPulse();
      }
    });

    /* ── 5. Arc sparks ── */
    arcs.forEach((arc, ai) => {
      arc.life++;
      const fade = 1 - arc.life / arc.maxLife;
      ctx.beginPath();
      ctx.moveTo(arc.pts[0].x, arc.pts[0].y);
      arc.pts.slice(1).forEach(p => ctx.lineTo(p.x, p.y));
      ctx.strokeStyle = C.amberHot + (0.55 * fade) + ')';
      ctx.lineWidth = 0.8 + fade * 0.8;
      ctx.shadowColor = 'rgba(255,185,60,0.6)';
      ctx.shadowBlur  = 6;
      ctx.stroke();
      ctx.shadowBlur  = 0;

      if (arc.life >= arc.maxLife) arcs.splice(ai, 1);
    });

    requestAnimationFrame(draw);
  }

  /* ── Timers ── */
  setInterval(spawnPulse, 380);
  setInterval(() => { if (Math.random() < 0.4) spawnArc(); }, 800);

  window.addEventListener('resize', () => { resize(); });
  resize();
  draw();


  /* ══════════════════════════════════════════════════════════
     2.  HEADLINE WORD-BY-WORD REVEAL
     ══════════════════════════════════════════════════════════ */
  const headline = document.getElementById('headline');
  if (headline) {
    function wrapWords(node) {
      if (node.nodeType === Node.TEXT_NODE) {
        const parts = node.textContent.split(/(\s+)/);
        const frag  = document.createDocumentFragment();
        parts.forEach(part => {
          if (/\s+/.test(part)) {
            frag.appendChild(document.createTextNode(part));
          } else if (part.length) {
            const span = document.createElement('span');
            span.className = 'word';
            span.textContent = part;
            frag.appendChild(span);
          }
        });
        node.parentNode.replaceChild(frag, node);
      } else if (node.nodeType === Node.ELEMENT_NODE && !node.classList.contains('accent')) {
        Array.from(node.childNodes).forEach(wrapWords);
      }
    }
    wrapWords(headline);

    const accent = headline.querySelector('.accent');
    if (accent) accent.classList.add('word');

    const words = Array.from(headline.querySelectorAll('.word'));
    words.forEach((w, i) => {
      setTimeout(() => w.classList.add('visible'), 850 + i * 110);
    });
  }


  /* ══════════════════════════════════════════════════════════
     3.  EMAIL NOTIFY FORM
     ══════════════════════════════════════════════════════════ */
  const notifyBtn  = document.getElementById('notify-btn');
  const emailInput = document.getElementById('email-input');
  const emailRow   = document.getElementById('email-row');
  const successMsg = document.getElementById('success-msg');

  if (notifyBtn && emailInput) {
    function trySubmit() {
      const val   = emailInput.value.trim();
      const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
      if (!valid) {
        emailInput.style.outline = '1.5px solid rgba(200,60,60,0.6)';
        emailInput.focus();
        setTimeout(() => { emailInput.style.outline = ''; }, 1800);
        return;
      }
      // ⚠️ TODO: connect to real mailing list
      console.log('[EEMMIC] Email captured (not yet connected):', val);
      if (emailRow)   emailRow.style.display   = 'none';
      if (successMsg) successMsg.style.display = 'block';
    }
    notifyBtn.addEventListener('click', trySubmit);
    emailInput.addEventListener('keydown', e => { if (e.key === 'Enter') trySubmit(); });
  }


  /* ══════════════════════════════════════════════════════════
     4.  CONTACT FORM
     ══════════════════════════════════════════════════════════ */
  const contactForm = document.getElementById('contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', e => {
      e.preventDefault();
      const btn      = contactForm.querySelector('button[type="submit"]');
      const original = btn.textContent;
      // ⚠️ TODO: wire to real backend / Formspree / EmailJS
      btn.textContent      = '✓  Message sent';
      btn.style.background = '#1a6641';
      btn.disabled         = true;
      setTimeout(() => {
        btn.textContent      = original;
        btn.style.background = '';
        btn.disabled         = false;
        contactForm.reset();
      }, 3000);
    });
  }

});

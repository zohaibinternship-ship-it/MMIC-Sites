/* ═════════════════════════════════════════════════════════════════════════════
   AGEMMIC — Living Botanical Backdrop
   Features: Swaying grass meadow + drifting leaves, both reacting to the cursor.
   Applies dynamically to all pages across the project.
   ═════════════════════════════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {

  const canvas = document.getElementById('organic-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let W, H, DPR;
  let mouse = { x: -9999, y: -9999, targetX: -9999, targetY: -9999, active: false };
  let globalTime = 0;

  // Botanical palette tuned to the sage-cream theme
  const palette = {
    grassDeep:  '#3B5E0B',
    grassMid:   '#4D7C0F',
    grassLight: '#6B9A24',
    leafGreen:  '#5E8C1E',
    leafGold:   '#C28E2B',
    leafSoft:   '#8FB347'
  };

  let blades = [];   // grass blades anchored along the bottom
  let leaves = [];   // free-floating drifting leaves

  /* ── Helpers ──────────────────────────────────────────────────────────── */
  function rand(min, max) { return min + Math.random() * (max - min); }

  function pickGrassColor() {
    const r = Math.random();
    if (r < 0.34) return palette.grassDeep;
    if (r < 0.7)  return palette.grassMid;
    return palette.grassLight;
  }

  function pickLeafColor() {
    const r = Math.random();
    if (r < 0.5)  return palette.leafGreen;
    if (r < 0.8)  return palette.leafSoft;
    return palette.leafGold;
  }

  /* ── Build the ecosystem ──────────────────────────────────────────────── */
  function initEcosystem() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;

    canvas.width  = W * DPR;
    canvas.height = H * DPR;
    canvas.style.width  = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

    blades = [];
    leaves = [];

    // 1. Grass meadow — dense blades across the full width, anchored at the base.
    const spacing = 9;                       // px between blade roots
    const bladeCount = Math.floor(W / spacing) + 6;
    for (let i = 0; i < bladeCount; i++) {
      const baseX = i * spacing + rand(-4, 4);
      const height = rand(55, 140);
      blades.push({
        baseX,
        height,
        width: rand(2.2, 4.5),
        color: pickGrassColor(),
        swaySpeed: rand(0.6, 1.4),
        swayPhase: rand(0, Math.PI * 2),
        swayAmount: rand(8, 22),
        bend: 0,
        bendVel: 0
      });
    }

    // 2. Drifting leaves — gentle ambient fall + cursor scatter.
    const leafCount = Math.max(14, Math.floor((W * H) / 65000));
    for (let i = 0; i < leafCount; i++) {
      leaves.push(makeLeaf(true));
    }
  }

  function makeLeaf(anywhere) {
    return {
      x: rand(0, W),
      y: anywhere ? rand(0, H) : rand(-60, -10),
      size: rand(9, 20),
      color: pickLeafColor(),
      rot: rand(0, Math.PI * 2),
      rotSpeed: rand(-0.02, 0.02),
      driftX: rand(-0.3, 0.3),
      fallSpeed: rand(0.25, 0.75),
      swayPhase: rand(0, Math.PI * 2),
      swaySpeed: rand(0.8, 1.8),
      swayAmt: rand(0.4, 1.2),
      vx: 0,
      vy: 0
    };
  }

  /* ── Draw a single leaf shape ─────────────────────────────────────────── */
  function drawLeaf(l) {
    ctx.save();
    ctx.translate(l.x, l.y);
    ctx.rotate(l.rot);
    ctx.fillStyle = l.color;

    const s = l.size;
    ctx.beginPath();
    ctx.moveTo(0, -s);
    ctx.quadraticCurveTo(s * 0.6, -s * 0.2, 0, s);
    ctx.quadraticCurveTo(-s * 0.6, -s * 0.2, 0, -s);
    ctx.fill();

    // central vein
    ctx.strokeStyle = 'rgba(25, 32, 23, 0.18)';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(0, -s);
    ctx.lineTo(0, s);
    ctx.stroke();
    ctx.restore();
  }

  /* ── Main render loop ─────────────────────────────────────────────────── */
  function renderEcosystem() {
    globalTime += 0.016;
    ctx.clearRect(0, 0, W, H);

    // Smooth cursor easing
    mouse.x += (mouse.targetX - mouse.x) * 0.12;
    mouse.y += (mouse.targetY - mouse.y) * 0.12;

    /* ── Leaves ── */
    leaves.forEach(l => {
      l.swayPhase += l.swaySpeed * 0.02;
      l.x += l.driftX + Math.sin(l.swayPhase) * l.swayAmt;
      l.y += l.fallSpeed;
      l.rot += l.rotSpeed;

      // Cursor repulsion — leaves scatter away from the pointer
      if (mouse.active) {
        const dx = l.x - mouse.x;
        const dy = l.y - mouse.y;
        const d = Math.hypot(dx, dy) || 1;
        const radius = 150;
        if (d < radius) {
          const force = (radius - d) / radius;
          l.vx += (dx / d) * force * 1.4;
          l.vy += (dy / d) * force * 1.4;
          l.rot += force * 0.15;
        }
      }

      l.x += l.vx;
      l.y += l.vy;
      l.vx *= 0.92;
      l.vy *= 0.92;

      // Recycle off-screen leaves back to the top
      if (l.y > H + 40 || l.x < -60 || l.x > W + 60) {
        Object.assign(l, makeLeaf(false));
      }

      drawLeaf(l);
    });

    /* ── Grass ── */
    blades.forEach(b => {
      const breeze = Math.sin(globalTime * b.swaySpeed + b.swayPhase) * b.swayAmount;

      let target = breeze;
      if (mouse.active) {
        const tipX = b.baseX + breeze;
        const tipY = H - b.height;
        const dx = tipX - mouse.x;
        const dy = tipY - mouse.y;
        const d = Math.hypot(dx, dy) || 1;
        const radius = 130;
        if (d < radius) {
          const force = (radius - d) / radius;
          target += (dx / d) * force * 55;
        }
      }

      // Spring physics for smooth, organic bend + return
      const accel = (target - b.bend) * 0.08;
      b.bendVel = (b.bendVel + accel) * 0.82;
      b.bend += b.bendVel;

      const rootX = b.baseX;
      const rootY = H + 2;
      const tipX  = b.baseX + b.bend;
      const tipY  = H - b.height;
      const ctrlX = b.baseX + b.bend * 0.5;
      const ctrlY = H - b.height * 0.55;

      ctx.beginPath();
      ctx.moveTo(rootX - b.width, rootY);
      ctx.quadraticCurveTo(ctrlX - b.width * 0.4, ctrlY, tipX, tipY);
      ctx.quadraticCurveTo(ctrlX + b.width * 0.4, ctrlY, rootX + b.width, rootY);
      ctx.closePath();
      ctx.fillStyle = b.color;
      ctx.fill();
    });

    requestAnimationFrame(renderEcosystem);
  }

  /* ── Pointer + window listeners ───────────────────────────────────────── */
  window.addEventListener('mousemove', e => {
    mouse.targetX = e.clientX;
    mouse.targetY = e.clientY;
    mouse.active = true;
  });
  window.addEventListener('mouseleave', () => {
    mouse.active = false;
    mouse.targetX = -9999;
    mouse.targetY = -9999;
  });
  window.addEventListener('touchmove', e => {
    if (e.touches[0]) {
      mouse.targetX = e.touches[0].clientX;
      mouse.targetY = e.touches[0].clientY;
      mouse.active = true;
    }
  }, { passive: true });
  window.addEventListener('touchend', () => { mouse.active = false; });
  window.addEventListener('resize', initEcosystem);

  initEcosystem();
  renderEcosystem();

  /* ═══════════════════════════════════════════════════════════════════════════
     2. WORD-BY-WORD REVEAL INTERACTION
     ═══════════════════════════════════════════════════════════════════════════ */
  const headline = document.getElementById('headline');
  if (headline) {
    function processTypography(node) {
      if (node.nodeType === Node.TEXT_NODE) {
        const structuralParts = node.textContent.split(/(\s+)/);
        const segment = document.createDocumentFragment();

        structuralParts.forEach(part => {
          if (/\s+/.test(part)) {
            segment.appendChild(document.createTextNode(part));
          } else if (part.length) {
            const span = document.createElement('span');
            span.className = 'word';
            span.textContent = part;
            segment.appendChild(span);
          }
        });
        node.parentNode.replaceChild(segment, node);
      } else if (node.nodeType === Node.ELEMENT_NODE && !node.classList.contains('accent')) {
        Array.from(node.childNodes).forEach(processTypography);
      }
    }
    processTypography(headline);

    const accent = headline.querySelector('.accent');
    if (accent) accent.classList.add('word');

    const elements = Array.from(headline.querySelectorAll('.word'));
    elements.forEach((el, index) => {
      setTimeout(() => el.classList.add('visible'), 500 + index * 90);
    });
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     3. INTERACTIVE FORMS PIPELINE
     ═══════════════════════════════════════════════════════════════════════════ */
  const notifyBtn  = document.getElementById('notify-btn');
  const emailInput = document.getElementById('email-input');
  const emailRow   = document.getElementById('email-row');
  const successMsg = document.getElementById('success-msg');

  if (notifyBtn && emailInput) {
    function runSubmission() {
      const isOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput.value.trim());
      if (!isOk) {
        emailInput.style.outline = '2px solid #C28E2B';
        emailInput.focus();
        setTimeout(() => emailInput.style.outline = '', 1200);
        return;
      }
      if (emailRow) emailRow.style.display = 'none';
      if (successMsg) successMsg.style.display = 'block';
    }
    notifyBtn.addEventListener('click', runSubmission);
    emailInput.addEventListener('keydown', e => { if (e.key === 'Enter') runSubmission(); });
  }

  const contactForm = document.getElementById('contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', e => {
      e.preventDefault();
      const btn = contactForm.querySelector('button[type="submit"]');
      const text = btn.textContent;
      btn.textContent = '🌱 Message Sent Perfectly';
      btn.style.background = '#3B5E0B';
      btn.disabled = true;
      setTimeout(() => {
        btn.textContent = text;
        btn.style.background = '';
        btn.disabled = false;
        contactForm.reset();
      }, 2500);
    });
  }
});

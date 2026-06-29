/* FOEMMIC — Fresh Market Backdrop (LIGHT)
   Healthy ingredients (avocado, tomato, lemon, leaf, broccoli, berry, mint, pea)
   float, bob, and rotate. Strong cursor interaction: a bright follow-spotlight,
   parallax tilt of the whole field, and active repel of nearby ingredients. */
document.addEventListener('DOMContentLoaded', () => {

  const canvas = document.getElementById('food-canvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let W, H, DPR, t = 0;
    // eased cursor for smooth, strong follow
    let mouse = { x: 0, y: 0, ex: 0, ey: 0, has: false };
    let items = [];
    const rand = (a, b) => a + Math.random() * (b - a);

    // fresh, healthy palette
    const C = {
      avocado: '#7BA05B', avoFlesh: '#C7DC9E', pit: '#9C7A4A',
      tomato: '#E0523B', tomLeaf: '#5E8C3A',
      lemon: '#F2C84B', lemonHi: '#FBE89A',
      leaf: '#6FAE54', leafDk: '#4E8C3A',
      broc: '#5C8A3C', brocStem: '#9FBF6E',
      berry: '#9B3B6A', berryHi: '#C96A93',
      mint: '#7CC07C',
      pea: '#8FBF52',
      orange: '#F0913E'
    };

    const KINDS = ['avocado','tomato','lemon','leaf','broccoli','berry','mint','orange'];

    function init() {
      DPR = Math.min(window.devicePixelRatio || 1, 2);
      W = innerWidth; H = innerHeight;
      canvas.width = W * DPR; canvas.height = H * DPR;
      canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      mouse.x = mouse.ex = W / 2; mouse.y = mouse.ey = H / 2;

      items = [];
      const count = Math.max(16, Math.floor((W * H) / 48000));
      for (let i = 0; i < count; i++) items.push(make(true));
    }

    function make(any) {
      const depth = rand(0.4, 1);          // near items are bigger + parallax more
      return {
        kind: KINDS[Math.floor(Math.random() * KINDS.length)],
        x: rand(0, W), y: any ? rand(0, H) : rand(-40, -10),
        baseX: 0, baseY: 0,
        size: rand(20, 52) * depth,
        depth,
        rot: rand(0, Math.PI * 2),
        rotSpd: rand(-0.01, 0.01),
        bobPh: rand(0, Math.PI * 2),
        bobSpd: rand(0.4, 1.1),
        bobAmt: rand(6, 18),
        driftX: rand(-0.12, 0.12),
        driftY: rand(0.05, 0.18),
        alpha: rand(0.65, 1),
        vx: 0, vy: 0
      };
    }

    // ── ingredient drawings (origin-centered, ~unit size before scale) ──
    function draw(kind, s) {
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      const stroke = (col, w) => { ctx.strokeStyle = col; ctx.lineWidth = w; };

      if (kind === 'avocado') {
        ctx.fillStyle = C.avocado;
        ctx.beginPath();
        ctx.moveTo(0, -s*0.6);
        ctx.bezierCurveTo(s*0.5,-s*0.55, s*0.55,s*0.1, s*0.32,s*0.5);
        ctx.bezierCurveTo(s*0.15,s*0.75, -s*0.15,s*0.75, -s*0.32,s*0.5);
        ctx.bezierCurveTo(-s*0.55,s*0.1, -s*0.5,-s*0.55, 0,-s*0.6);
        ctx.fill();
        ctx.fillStyle = C.avoFlesh;
        ctx.beginPath(); ctx.ellipse(0, s*0.05, s*0.32, s*0.42, 0, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = C.pit;
        ctx.beginPath(); ctx.arc(0, s*0.12, s*0.16, 0, Math.PI*2); ctx.fill();

      } else if (kind === 'tomato') {
        ctx.fillStyle = C.tomato;
        ctx.beginPath(); ctx.arc(0, s*0.06, s*0.5, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.22)';
        ctx.beginPath(); ctx.ellipse(-s*0.16,-s*0.1,s*0.12,s*0.18,-0.5,0,Math.PI*2); ctx.fill();
        ctx.fillStyle = C.tomLeaf;
        for (let k=0;k<5;k++){ const a=(k/5)*Math.PI*2 - Math.PI/2;
          ctx.beginPath(); ctx.ellipse(Math.cos(a)*s*0.14, -s*0.4+Math.sin(a)*s*0.06, s*0.06, s*0.16, a, 0, Math.PI*2); ctx.fill(); }

      } else if (kind === 'lemon') {
        ctx.fillStyle = C.lemon;
        ctx.beginPath(); ctx.ellipse(0,0,s*0.52,s*0.38,0,0,Math.PI*2); ctx.fill();
        ctx.fillStyle = C.lemonHi;
        ctx.beginPath(); ctx.ellipse(-s*0.16,-s*0.08,s*0.18,s*0.12,0,0,Math.PI*2); ctx.fill();
        ctx.fillStyle = C.leafDk;
        ctx.beginPath(); ctx.ellipse(s*0.5,-s*0.18,s*0.05,s*0.04,0,0,Math.PI*2); ctx.fill();

      } else if (kind === 'leaf') {
        ctx.fillStyle = C.leaf;
        ctx.beginPath();
        ctx.moveTo(0,-s*0.6);
        ctx.quadraticCurveTo(s*0.55,-s*0.1, 0,s*0.6);
        ctx.quadraticCurveTo(-s*0.55,-s*0.1, 0,-s*0.6);
        ctx.fill();
        stroke('rgba(255,255,255,0.4)', s*0.04);
        ctx.beginPath(); ctx.moveTo(0,-s*0.5); ctx.lineTo(0,s*0.5); ctx.stroke();
        for(let k=-2;k<=2;k++){ ctx.beginPath(); ctx.moveTo(0,k*s*0.16);
          ctx.lineTo(s*0.2*(k>0?1:1), k*s*0.16+s*0.12); ctx.stroke(); }

      } else if (kind === 'broccoli') {
        ctx.fillStyle = C.brocStem;
        ctx.beginPath(); ctx.roundRect(-s*0.1, 0, s*0.2, s*0.5, s*0.08); ctx.fill();
        ctx.fillStyle = C.broc;
        const florets=[[0,-s*0.3,s*0.26],[-s*0.24,-s*0.16,s*0.2],[s*0.24,-s*0.16,s*0.2],[-s*0.1,-s*0.42,s*0.16],[s*0.12,-s*0.42,s*0.16]];
        florets.forEach(f=>{ ctx.beginPath(); ctx.arc(f[0],f[1],f[2],0,Math.PI*2); ctx.fill(); });

      } else if (kind === 'berry') {
        ctx.fillStyle = C.berry;
        const pts=[[0,-s*0.1],[-s*0.22,-s*0.18],[s*0.22,-s*0.18],[-s*0.14,s*0.12],[s*0.14,s*0.12],[0,s*0.28],[0,-s*0.34]];
        pts.forEach(p=>{ ctx.beginPath(); ctx.arc(p[0],p[1],s*0.16,0,Math.PI*2); ctx.fill(); });
        ctx.fillStyle = C.berryHi;
        ctx.beginPath(); ctx.arc(-s*0.06,-s*0.06,s*0.05,0,Math.PI*2); ctx.fill();

      } else if (kind === 'mint') {
        ctx.fillStyle = C.mint;
        [[-s*0.18,0,-0.5],[s*0.18,0,0.5],[0,-s*0.22,0]].forEach(l=>{
          ctx.save(); ctx.translate(l[0],l[1]); ctx.rotate(l[2]);
          ctx.beginPath(); ctx.moveTo(0,-s*0.3); ctx.quadraticCurveTo(s*0.26,0,0,s*0.32);
          ctx.quadraticCurveTo(-s*0.26,0,0,-s*0.3); ctx.fill(); ctx.restore(); });

      } else { // orange
        ctx.fillStyle = C.orange;
        ctx.beginPath(); ctx.arc(0,0,s*0.5,0,Math.PI*2); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.25)';
        ctx.beginPath(); ctx.ellipse(-s*0.16,-s*0.14,s*0.12,s*0.16,-0.5,0,Math.PI*2); ctx.fill();
        ctx.fillStyle = C.leafDk;
        ctx.beginPath(); ctx.ellipse(s*0.34,-s*0.42,s*0.16,s*0.08,-0.6,0,Math.PI*2); ctx.fill();
      }
    }

    function render() {
      t += 0.016;
      // strong, eased cursor follow
      mouse.ex += (mouse.x - mouse.ex) * 0.10;
      mouse.ey += (mouse.y - mouse.ey) * 0.10;

      ctx.clearRect(0, 0, W, H);

      // bright follow-spotlight tied to the cursor (content highlight)
      if (mouse.has) {
        const g = ctx.createRadialGradient(mouse.ex, mouse.ey, 0, mouse.ex, mouse.ey, 320);
        g.addColorStop(0, 'rgba(255,214,120,0.30)');
        g.addColorStop(0.45, 'rgba(126,192,124,0.12)');
        g.addColorStop(1, 'rgba(126,192,124,0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(mouse.ex, mouse.ey, 320, 0, Math.PI*2); ctx.fill();
      }

      const px = (mouse.ex - W/2);
      const py = (mouse.ey - H/2);

      items.forEach(it => {
        it.bobPh += it.bobSpd * 0.02;
        it.rot += it.rotSpd;
        it.x += it.driftX;
        it.y += it.driftY;

        // parallax tilt of the whole field toward cursor (depth-scaled)
        const parX = -px * 0.05 * it.depth;
        const parY = -py * 0.05 * it.depth;

        // strong repel near cursor
        if (mouse.has) {
          const dx = it.x - mouse.ex, dy = it.y - mouse.ey, d = Math.hypot(dx, dy) || 1;
          const R = 200;
          if (d < R) { const f = (R - d) / R; it.vx += dx/d * f * 4.0; it.vy += dy/d * f * 4.0; }
        }
        it.x += it.vx; it.y += it.vy; it.vx *= 0.90; it.vy *= 0.90;

        if (it.y > H + 60 || it.x < -60 || it.x > W + 60) Object.assign(it, make(false));

        const drawX = it.x + parX;
        const drawY = it.y + parY + Math.sin(it.bobPh) * it.bobAmt;

        // soft shadow for the light bg
        ctx.save();
        ctx.translate(drawX, drawY);
        ctx.globalAlpha = it.alpha * 0.18;
        ctx.fillStyle = '#5E4632';
        ctx.beginPath(); ctx.ellipse(0, it.size*0.55, it.size*0.4, it.size*0.14, 0, 0, Math.PI*2); ctx.fill();
        ctx.restore();

        ctx.save();
        ctx.translate(drawX, drawY);
        ctx.rotate(it.rot);
        ctx.globalAlpha = it.alpha;
        draw(it.kind, it.size);
        ctx.restore();
        ctx.globalAlpha = 1;
      });

      requestAnimationFrame(render);
    }

    addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; mouse.has = true; });
    addEventListener('mouseleave', () => { mouse.has = false; });
    addEventListener('touchmove', e => { if (e.touches[0]) { mouse.x = e.touches[0].clientX; mouse.y = e.touches[0].clientY; mouse.has = true; } }, { passive:true });
    addEventListener('touchend', () => { mouse.has = false; });
    addEventListener('resize', init);
    init(); render();
  }

  // headline word-by-word reveal
  const headline = document.getElementById('headline');
  if (headline) {
    (function proc(node){
      if(node.nodeType===3){ const parts=node.textContent.split(/(\s+)/); const f=document.createDocumentFragment();
        parts.forEach(p=>{ if(/\s+/.test(p)) f.appendChild(document.createTextNode(p));
          else if(p.length){ const s=document.createElement('span'); s.className='word'; s.textContent=p; f.appendChild(s); } });
        node.parentNode.replaceChild(f,node);
      } else if(node.nodeType===1 && !node.classList.contains('accent')){ Array.from(node.childNodes).forEach(proc); }
    })(headline);
    const ac=headline.querySelector('.accent'); if(ac) ac.classList.add('word');
    Array.from(headline.querySelectorAll('.word')).forEach((el,i)=> setTimeout(()=>el.classList.add('visible'),500+i*100));
  }

  // content tilt-follow: hero block leans slightly toward the cursor (strong but smooth)
  const tiltTarget = document.querySelector('.container');
  if (tiltTarget) {
    let tx=0, ty=0, cx=0, cy=0;
    addEventListener('mousemove', e => {
      tx = (e.clientX / innerWidth - 0.5);
      ty = (e.clientY / innerHeight - 0.5);
    });
    (function tiltLoop(){
      cx += (tx - cx) * 0.08; cy += (ty - cy) * 0.08;
      tiltTarget.style.transform = `perspective(1200px) rotateY(${cx*5}deg) rotateX(${-cy*5}deg)`;
      requestAnimationFrame(tiltLoop);
    })();
  }

  // email capture
  const nb=document.getElementById('notify-btn'), ei=document.getElementById('email-input'),
        er=document.getElementById('email-row'), sm=document.getElementById('success-msg');
  if(nb&&ei){ const go=()=>{ if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ei.value.trim())){ ei.style.outline='2px solid #E0523B'; ei.focus(); setTimeout(()=>ei.style.outline='',1200); return; }
    if(er) er.style.display='none'; if(sm) sm.style.display='block'; };
    nb.addEventListener('click',go); ei.addEventListener('keydown',e=>{ if(e.key==='Enter') go(); }); }
});
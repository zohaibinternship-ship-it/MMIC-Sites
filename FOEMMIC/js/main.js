/* FOEMMIC — Fresh Market Backdrop (LIGHT) · v2
   Realistic, layered produce with soft shading + depth-of-field blur, gentle
   drift/bob/rotate, warm light bloom, and a cursor follow-spotlight + repel.
   NOTE: the page content is NOT tilted by the cursor anymore. */
document.addEventListener('DOMContentLoaded', () => {

  const canvas = document.getElementById('food-canvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let W, H, DPR, t = 0;
    let mouse = { x: 0, y: 0, ex: 0, ey: 0, has: false };
    let items = [], motes = [];
    const rand = (a, b) => a + Math.random() * (b - a);

    const C = {
      avocado:'#7BA05B', avoDk:'#5E7E42', avoFlesh:'#CFE0A2', pit:'#9C7A4A', pitHi:'#B89360',
      tomato:'#E0523B', tomDk:'#B83A28', tomLeaf:'#5E8C3A',
      lemon:'#F2C84B', lemonDk:'#D9A82E', lemonHi:'#FBE89A',
      leaf:'#6FAE54', leafDk:'#4E8C3A', leafHi:'#9ED27E',
      broc:'#5C8A3C', brocDk:'#456C2C', brocStem:'#A7C77A',
      berry:'#9B3B6A', berryDk:'#742A50', berryHi:'#C96A93',
      mint:'#7CC07C', mintDk:'#589C58',
      orange:'#F0913E', orangeDk:'#CF7124', orangeHi:'#FFB877'
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
      const count = Math.max(14, Math.floor((W * H) / 52000));
      for (let i = 0; i < count; i++) items.push(make(true));
      items.sort((a, b) => a.depth - b.depth);

      motes = [];
      const mc = Math.max(18, Math.floor((W * H) / 26000));
      for (let i = 0; i < mc; i++) motes.push({
        x: rand(0, W), y: rand(0, H), r: rand(0.6, 2.2),
        a: rand(0.05, 0.22), sp: rand(0.15, 0.5),
        ph: rand(0, Math.PI * 2), phS: rand(0.4, 1.1), amt: rand(8, 26)
      });
    }

    function make(any) {
      const depth = rand(0.35, 1);
      return {
        kind: KINDS[Math.floor(Math.random() * KINDS.length)],
        x: rand(0, W), y: any ? rand(0, H) : rand(-50, -10),
        size: rand(18, 50) * (0.55 + depth * 0.6),
        depth,
        blur: (1 - depth) * 5,
        rot: rand(0, Math.PI * 2),
        rotSpd: rand(-0.008, 0.008),
        bobPh: rand(0, Math.PI * 2),
        bobSpd: rand(0.4, 1.0),
        bobAmt: rand(5, 16),
        driftX: rand(-0.10, 0.10) * depth,
        driftY: rand(0.04, 0.16) * depth,
        alpha: rand(0.55, 0.95) * (0.5 + depth * 0.5),
        vx: 0, vy: 0
      };
    }

    function sphere(x, y, r, light, dark) {
      const g = ctx.createRadialGradient(x - r*0.32, y - r*0.34, r*0.1, x, y, r);
      g.addColorStop(0, light); g.addColorStop(1, dark);
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI*2); ctx.fill();
    }
    function specular(x, y, r) {
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.beginPath(); ctx.ellipse(x - r*0.34, y - r*0.36, r*0.18, r*0.12, -0.5, 0, Math.PI*2); ctx.fill();
    }

    function draw(kind, s) {
      ctx.lineJoin = 'round'; ctx.lineCap = 'round';

      if (kind === 'avocado') {
        const grd = ctx.createLinearGradient(0, -s*0.6, 0, s*0.7);
        grd.addColorStop(0, C.avocado); grd.addColorStop(1, C.avoDk);
        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.moveTo(0, -s*0.6);
        ctx.bezierCurveTo(s*0.5,-s*0.55, s*0.55,s*0.1, s*0.32,s*0.5);
        ctx.bezierCurveTo(s*0.15,s*0.75, -s*0.15,s*0.75, -s*0.32,s*0.5);
        ctx.bezierCurveTo(-s*0.55,s*0.1, -s*0.5,-s*0.55, 0,-s*0.6);
        ctx.fill();
        ctx.fillStyle = C.avoFlesh;
        ctx.beginPath(); ctx.ellipse(0, s*0.06, s*0.32, s*0.42, 0, 0, Math.PI*2); ctx.fill();
        sphere(0, s*0.14, s*0.17, C.pitHi, C.pit);

      } else if (kind === 'tomato') {
        sphere(0, s*0.06, s*0.5, C.tomato, C.tomDk);
        specular(0, s*0.06, s*0.5);
        ctx.fillStyle = C.tomLeaf;
        for (let k=0;k<5;k++){ const a=(k/5)*Math.PI*2 - Math.PI/2;
          ctx.beginPath(); ctx.ellipse(Math.cos(a)*s*0.14, -s*0.4+Math.sin(a)*s*0.06, s*0.06, s*0.16, a, 0, Math.PI*2); ctx.fill(); }

      } else if (kind === 'lemon') {
        const g = ctx.createRadialGradient(-s*0.18,-s*0.16,s*0.06, 0,0,s*0.55);
        g.addColorStop(0, C.lemonHi); g.addColorStop(1, C.lemonDk);
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.ellipse(0,0,s*0.52,s*0.38,0,0,Math.PI*2); ctx.fill();
        specular(-s*0.05,-s*0.04,s*0.5);
        ctx.fillStyle = C.leafDk;
        ctx.beginPath(); ctx.ellipse(s*0.5,-s*0.18,s*0.05,s*0.04,0,0,Math.PI*2); ctx.fill();

      } else if (kind === 'leaf') {
        const g = ctx.createLinearGradient(-s*0.5,0,s*0.5,0);
        g.addColorStop(0, C.leafDk); g.addColorStop(0.5, C.leaf); g.addColorStop(1, C.leafHi);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.moveTo(0,-s*0.6);
        ctx.quadraticCurveTo(s*0.55,-s*0.1, 0,s*0.6);
        ctx.quadraticCurveTo(-s*0.55,-s*0.1, 0,-s*0.6);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = s*0.04;
        ctx.beginPath(); ctx.moveTo(0,-s*0.5); ctx.lineTo(0,s*0.5); ctx.stroke();
        for(let k=-2;k<=2;k++){ ctx.beginPath(); ctx.moveTo(0,k*s*0.16);
          ctx.lineTo(s*0.2, k*s*0.16+s*0.12); ctx.stroke(); }

      } else if (kind === 'broccoli') {
        ctx.fillStyle = C.brocStem;
        ctx.beginPath(); ctx.roundRect(-s*0.1, 0, s*0.2, s*0.5, s*0.08); ctx.fill();
        const florets=[[0,-s*0.3,s*0.26],[-s*0.24,-s*0.16,s*0.2],[s*0.24,-s*0.16,s*0.2],[-s*0.1,-s*0.42,s*0.16],[s*0.12,-s*0.42,s*0.16]];
        florets.forEach(f=> sphere(f[0],f[1],f[2], C.broc, C.brocDk));

      } else if (kind === 'berry') {
        const pts=[[0,-s*0.1],[-s*0.22,-s*0.18],[s*0.22,-s*0.18],[-s*0.14,s*0.12],[s*0.14,s*0.12],[0,s*0.28],[0,-s*0.34]];
        pts.forEach(p=> sphere(p[0],p[1],s*0.16, C.berryHi, C.berryDk));

      } else if (kind === 'mint') {
        [[-s*0.18,0,-0.5],[s*0.18,0,0.5],[0,-s*0.22,0]].forEach(l=>{
          ctx.save(); ctx.translate(l[0],l[1]); ctx.rotate(l[2]);
          const g = ctx.createLinearGradient(0,-s*0.3,0,s*0.32);
          g.addColorStop(0, C.mint); g.addColorStop(1, C.mintDk); ctx.fillStyle = g;
          ctx.beginPath(); ctx.moveTo(0,-s*0.3); ctx.quadraticCurveTo(s*0.26,0,0,s*0.32);
          ctx.quadraticCurveTo(-s*0.26,0,0,-s*0.3); ctx.fill(); ctx.restore(); });

      } else { // orange
        sphere(0, 0, s*0.5, C.orangeHi, C.orangeDk);
        specular(0,0,s*0.5);
        ctx.fillStyle = C.leafDk;
        ctx.beginPath(); ctx.ellipse(s*0.34,-s*0.42,s*0.16,s*0.08,-0.6,0,Math.PI*2); ctx.fill();
      }
    }

    function render() {
      t += 0.016;
      mouse.ex += (mouse.x - mouse.ex) * 0.10;
      mouse.ey += (mouse.y - mouse.ey) * 0.10;
      ctx.clearRect(0, 0, W, H);

      motes.forEach(m => {
        m.ph += m.phS * 0.02; m.y -= m.sp * 0.4;
        const x = m.x + Math.sin(m.ph) * m.amt;
        if (m.y < -10) { m.y = H + 10; m.x = rand(0, W); }
        ctx.beginPath(); ctx.arc(x, m.y, m.r, 0, Math.PI*2);
        ctx.fillStyle = `rgba(224,178,90,${m.a.toFixed(3)})`; ctx.fill();
      });

      if (mouse.has) {
        const g = ctx.createRadialGradient(mouse.ex, mouse.ey, 0, mouse.ex, mouse.ey, 300);
        g.addColorStop(0, 'rgba(255,214,120,0.22)');
        g.addColorStop(0.45, 'rgba(126,192,124,0.09)');
        g.addColorStop(1, 'rgba(126,192,124,0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(mouse.ex, mouse.ey, 300, 0, Math.PI*2); ctx.fill();
      }

      const px = (mouse.ex - W/2), py = (mouse.ey - H/2);

      items.forEach(it => {
        it.bobPh += it.bobSpd * 0.02;
        it.rot += it.rotSpd;
        it.x += it.driftX; it.y += it.driftY;

        const parX = -px * 0.04 * it.depth;
        const parY = -py * 0.04 * it.depth;

        if (mouse.has) {
          const dx = it.x - mouse.ex, dy = it.y - mouse.ey, d = Math.hypot(dx, dy) || 1;
          const R = 190;
          if (d < R) { const f = (R - d) / R; it.vx += dx/d * f * 3.4; it.vy += dy/d * f * 3.4; }
        }
        it.x += it.vx; it.y += it.vy; it.vx *= 0.90; it.vy *= 0.90;

        if (it.y > H + 70 || it.x < -70 || it.x > W + 70) Object.assign(it, make(false));

        const drawX = it.x + parX;
        const drawY = it.y + parY + Math.sin(it.bobPh) * it.bobAmt;

        ctx.save();
        ctx.globalAlpha = it.alpha * 0.16;
        ctx.fillStyle = '#5E4632';
        ctx.beginPath(); ctx.ellipse(drawX, drawY + it.size*0.58, it.size*0.42, it.size*0.14, 0, 0, Math.PI*2); ctx.fill();
        ctx.restore();

        ctx.save();
        if (it.blur > 0.3) ctx.filter = `blur(${it.blur.toFixed(1)}px)`;
        ctx.translate(drawX, drawY);
        ctx.rotate(it.rot);
        ctx.globalAlpha = it.alpha;
        draw(it.kind, it.size);
        ctx.restore();
        ctx.globalAlpha = 1; ctx.filter = 'none';
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

  const nb=document.getElementById('notify-btn'), ei=document.getElementById('email-input'),
        er=document.getElementById('email-row'), sm=document.getElementById('success-msg');
  if(nb&&ei){ const go=()=>{ if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ei.value.trim())){ ei.style.outline='2px solid #E0523B'; ei.focus(); setTimeout(()=>ei.style.outline='',1200); return; }
    if(er) er.style.display='none'; if(sm) sm.style.display='block'; };
    nb.addEventListener('click',go); ei.addEventListener('keydown',e=>{ if(e.key==='Enter') go(); }); }
});

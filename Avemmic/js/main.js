/* AVEMMIC — Living Sky · bold, high-visibility, cursor-reactive */
document.addEventListener('DOMContentLoaded', () => {

  const canvas = document.getElementById('sky-canvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let W, H, DPR, t = 0;
    let mouse = { x: -9999, y: -9999, has: false };
    let nodes = [], shooters = [], planes = [], arc = {};
    let arcP = 0;
    const rand = (a, b) => a + Math.random() * (b - a);
    const bez = (u, a, b, c) => { const m = 1 - u; return m*m*a + 2*m*u*b + u*u*c; };

    function init() {
      DPR = Math.min(window.devicePixelRatio || 1, 2);
      W = innerWidth; H = innerHeight;
      canvas.width = W * DPR; canvas.height = H * DPR;
      canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

      // Constellation nodes — float freely, link to neighbours.
      nodes = [];
      const count = Math.max(70, Math.floor((W * H) / 14000));
      for (let i = 0; i < count; i++) {
        const big = Math.random() < 0.18;
        nodes.push({
          x: rand(0, W), y: rand(0, H),
          vx: rand(-0.25, 0.25), vy: rand(-0.22, 0.22),
          r: big ? rand(2.2, 3.6) : rand(1, 2),
          big, tw: rand(0, Math.PI * 2), twS: rand(0.6, 1.8)
        });
      }
      shooters = [];
      arc = { x0:-W*0.05, y0:H*0.82, cx:W*0.5, cy:H*0.16, x1:W*1.05, y1:H*0.40 };
      planes = [
        { t:0.0,  spd:0.00022, size:1.15, trail:[] },
        { t:0.5,  spd:0.00022, size:0.85, trail:[] }
      ];
    }

    function spawnShooter() {
      if (Math.random() < 0.02 && shooters.length < 4) {
        const L = Math.random() < 0.5;
        shooters.push({ x:L?rand(0,W*0.3):rand(W*0.7,W), y:rand(0,H*0.45),
          vx:(L?1:-1)*rand(7,12), vy:rand(3,5), life:1, len:rand(120,220) });
      }
    }

    function render() {
      t += 0.016;
      ctx.clearRect(0, 0, W, H);

      // ── cursor halo (bright, obvious) ──
      if (mouse.has) {
        const g = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 220);
        g.addColorStop(0, 'rgba(59,143,212,0.20)');
        g.addColorStop(1, 'rgba(59,143,212,0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(mouse.x, mouse.y, 220, 0, Math.PI*2); ctx.fill();
      }

      // ── move nodes + pointer push ──
      nodes.forEach(n => {
        n.x += n.vx; n.y += n.vy;
        if (n.x < 0 || n.x > W) n.vx *= -1;
        if (n.y < 0 || n.y > H) n.vy *= -1;
        if (mouse.has) {
          const dx = n.x - mouse.x, dy = n.y - mouse.y, d = Math.hypot(dx, dy) || 1;
          if (d < 160) { const f = (160 - d) / 160; n.x += dx/d*f*2.2; n.y += dy/d*f*2.2; }
        }
        n.tw += n.twS * 0.02;
      });

      // ── links between nearby nodes (brighter near cursor) ──
      ctx.lineWidth = 1;
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i], b = nodes[j];
          const dx = a.x - b.x, dy = a.y - b.y, d = Math.hypot(dx, dy);
          if (d < 130) {
            let alpha = (1 - d / 130) * 0.45;
            if (mouse.has) {
              const mid = Math.hypot((a.x+b.x)/2 - mouse.x, (a.y+b.y)/2 - mouse.y);
              if (mid < 200) alpha += (1 - mid/200) * 0.5;
            }
            ctx.strokeStyle = `rgba(59,143,212,${Math.min(alpha,0.9).toFixed(3)})`;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
      }
      // link nodes directly to the cursor too
      if (mouse.has) {
        nodes.forEach(n => {
          const d = Math.hypot(n.x - mouse.x, n.y - mouse.y);
          if (d < 200) {
            ctx.strokeStyle = `rgba(86,168,230,${((1 - d/200)*0.7).toFixed(3)})`;
            ctx.lineWidth = 1.1;
            ctx.beginPath(); ctx.moveTo(n.x, n.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
          }
        });
      }

      // ── draw nodes (glowing) ──
      nodes.forEach(n => {
        const tw = 0.6 + 0.4 * Math.sin(n.tw);
        if (n.big) {
          ctx.beginPath(); ctx.arc(n.x, n.y, n.r * 3.4, 0, Math.PI*2);
          ctx.fillStyle = `rgba(59,143,212,${(0.18*tw).toFixed(3)})`; ctx.fill();
        }
        ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, Math.PI*2);
        ctx.fillStyle = `rgba(${n.big?'150,200,240':'214,226,242'},${(0.9*tw).toFixed(3)})`;
        ctx.fill();
      });

      // ── flight arc trace ──
      if (arcP < 1) arcP += (1 - arcP) * 0.02 + 0.003;
      const steps = 120, lit = Math.floor(steps * Math.min(arcP, 1));
      ctx.lineWidth = 1.6; ctx.lineCap = 'round';
      for (let i = 0; i < lit; i++) {
        const u0=i/steps,u1=(i+1)/steps;
        const x0=bez(u0,arc.x0,arc.cx,arc.x1), y0=bez(u0,arc.y0,arc.cy,arc.y1);
        const x1=bez(u1,arc.x0,arc.cx,arc.x1), y1=bez(u1,arc.y0,arc.cy,arc.y1);
        const fade=Math.sin((i/steps)*Math.PI);
        ctx.strokeStyle=`rgba(59,143,212,${(0.4*fade).toFixed(3)})`;
        ctx.beginPath(); ctx.moveTo(x0,y0); ctx.lineTo(x1,y1); ctx.stroke();
      }

      // ── planes + contrails ──
      if (arcP > 0.3) planes.forEach(p => {
        p.t += p.spd; if (p.t > 1.15) { p.t = -0.15; p.trail = []; }
        const u = Math.max(0, Math.min(1, p.t));
        const x = bez(u,arc.x0,arc.cx,arc.x1), y = bez(u,arc.y0,arc.cy,arc.y1) - 6;
        const u2 = Math.min(1, u+0.01);
        const nx = bez(u2,arc.x0,arc.cx,arc.x1), ny = bez(u2,arc.y0,arc.cy,arc.y1) - 6;
        const ang = Math.atan2(ny-y, nx-x);
        if (p.t>=0 && p.t<=1) p.trail.push({x,y,life:1});
        for (let i=p.trail.length-1;i>=0;i--){ const c=p.trail[i]; c.life-=0.01;
          if(c.life<=0){p.trail.splice(i,1);continue;}
          ctx.beginPath(); ctx.arc(c.x,c.y,(2.4*c.life+0.5)*p.size,0,Math.PI*2);
          ctx.fillStyle=`rgba(198,210,226,${(0.28*c.life).toFixed(3)})`; ctx.fill(); }
        if (p.t>=0 && p.t<=1){ const s=8*p.size;
          ctx.save(); ctx.translate(x,y); ctx.rotate(ang);
          ctx.shadowColor='rgba(59,143,212,0.8)'; ctx.shadowBlur=12;
          ctx.fillStyle='#DDE6F2'; ctx.beginPath();
          ctx.moveTo(s,0); ctx.lineTo(-s*0.57,s*0.46); ctx.lineTo(-s*0.21,0); ctx.lineTo(-s*0.57,-s*0.46);
          ctx.closePath(); ctx.fill();
          ctx.shadowBlur=0; ctx.fillStyle='#3B8FD4';
          ctx.beginPath(); ctx.arc(s*0.3,0,1.4*p.size,0,Math.PI*2); ctx.fill();
          ctx.restore(); }
      });

      // ── shooting stars ──
      spawnShooter();
      for (let i=shooters.length-1;i>=0;i--){ const sh=shooters[i];
        sh.x+=sh.vx; sh.y+=sh.vy; sh.life-=0.018;
        if(sh.life<=0||sh.x<-260||sh.x>W+260){shooters.splice(i,1);continue;}
        const h=Math.hypot(sh.vx,sh.vy);
        const tx=sh.x - sh.vx/h*sh.len, ty=sh.y - sh.vy/h*sh.len;
        const g=ctx.createLinearGradient(sh.x,sh.y,tx,ty);
        g.addColorStop(0,`rgba(237,242,248,${(1*sh.life).toFixed(3)})`);
        g.addColorStop(0.4,`rgba(86,168,230,${(0.6*sh.life).toFixed(3)})`);
        g.addColorStop(1,'rgba(86,168,230,0)');
        ctx.strokeStyle=g; ctx.lineWidth=2.2; ctx.lineCap='round';
        ctx.beginPath(); ctx.moveTo(sh.x,sh.y); ctx.lineTo(tx,ty); ctx.stroke();
        ctx.beginPath(); ctx.arc(sh.x,sh.y,2.2,0,Math.PI*2);
        ctx.fillStyle=`rgba(255,255,255,${sh.life.toFixed(3)})`; ctx.fill();
      }

      requestAnimationFrame(render);
    }

    addEventListener('mousemove', e => { mouse.x=e.clientX; mouse.y=e.clientY; mouse.has=true; });
    addEventListener('mouseleave', () => { mouse.has=false; });
    addEventListener('touchmove', e => { if(e.touches[0]){ mouse.x=e.touches[0].clientX; mouse.y=e.touches[0].clientY; mouse.has=true; } }, {passive:true});
    addEventListener('touchend', () => { mouse.has=false; });
    addEventListener('resize', init);
    init(); render();
  }

  // headline reveal
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
    Array.from(headline.querySelectorAll('.word')).forEach((el,i)=> setTimeout(()=>el.classList.add('visible'),500+i*90));
  }

  // forms (email notify only — contact form handled on the contact page)
  const nb=document.getElementById('notify-btn'), ei=document.getElementById('email-input'),
        er=document.getElementById('email-row'), sm=document.getElementById('success-msg');
  if(nb&&ei){ const go=()=>{ if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ei.value.trim())){ ei.style.outline='2px solid #3B8FD4'; ei.focus(); setTimeout(()=>ei.style.outline='',1200); return; }
    if(er) er.style.display='none'; if(sm) sm.style.display='block'; };
    nb.addEventListener('click',go); ei.addEventListener('keydown',e=>{ if(e.key==='Enter') go(); }); }
});

document.addEventListener('DOMContentLoaded', function() {
  var page = document.body.dataset.page || 'index';
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var glowDiv = document.createElement('div');
  glowDiv.className = 'cursor-glow';
  document.body.appendChild(glowDiv);
  document.addEventListener('mousemove', function(e) {
    document.documentElement.style.setProperty('--mx', e.clientX + 'px');
    document.documentElement.style.setProperty('--my', e.clientY + 'px');
  });

  var container = document.getElementById('scene-container');
  if (container && typeof THREE !== 'undefined') initScene();

  function initScene() {
    try {
      var renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.5;
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      container.appendChild(renderer.domElement);

      var scene = new THREE.Scene();
      scene.background = new THREE.Color(0x13110F);
      scene.fog = new THREE.FogExp2(0x13110F, 0.018);

      var camera = new THREE.PerspectiveCamera(38, window.innerWidth / window.innerHeight, 0.1, 120);
      if (page === 'about') camera.position.set(3, 2, 10);
      else if (page === 'contact') camera.position.set(-3, 1.5, 9);
      else camera.position.set(0, 2, 11);
      camera.lookAt(0, -1, 0);

      /* Environment */
      var pmrem = new THREE.PMREMGenerator(renderer);
      var envScene = new THREE.Scene();
      envScene.background = new THREE.Color(0x0A0908);
      [
        { p:[12,10,6], c:0xF0C060, s:4 }, { p:[-10,8,-8], c:0xE8AC50, s:3 },
        { p:[0,-6,14], c:0xC88A3C, s:2.5 }, { p:[-8,14,5], c:0xF8D878, s:3 },
        { p:[10,-6,-10], c:0x6A4420, s:3.5 }, { p:[5,4,-12], c:0xD08858, s:2 },
        { p:[-5,12,-4], c:0xE8AC50, s:2.5 }, { p:[8,-10,8], c:0xB87830, s:3 },
        { p:[0,2,10], c:0xF0D070, s:2.5 }
      ].forEach(function(l) {
        var m = new THREE.Mesh(new THREE.SphereGeometry(Math.max(0.01,l.s),8,8), new THREE.MeshBasicMaterial({color:l.c}));
        m.position.set(l.p[0],l.p[1],l.p[2]); envScene.add(m);
      });
      scene.environment = pmrem.fromScene(envScene, 0, 0.1, 100).texture;
      pmrem.dispose();

      /* Materials */
      var matStrata = [
        new THREE.MeshStandardMaterial({ color:0x2A2218, roughness:0.92, metalness:0.05 }),
        new THREE.MeshStandardMaterial({ color:0x1E1A14, roughness:0.95, metalness:0.03 }),
        new THREE.MeshStandardMaterial({ color:0x302618, roughness:0.88, metalness:0.08 }),
        new THREE.MeshStandardMaterial({ color:0x24201A, roughness:0.93, metalness:0.04 }),
        new THREE.MeshStandardMaterial({ color:0x2E2620, roughness:0.9, metalness:0.06 }),
        new THREE.MeshStandardMaterial({ color:0x1A1612, roughness:0.96, metalness:0.02 }),
      ];
      var matOreGold = new THREE.MeshStandardMaterial({ color:0xDAA850, metalness:0.92, roughness:0.1 });
      var matOreCopper = new THREE.MeshStandardMaterial({ color:0xD89060, metalness:0.9, roughness:0.14 });
      var matOreRed = new THREE.MeshStandardMaterial({ color:0x9B4A3A, metalness:0.5, roughness:0.6 });
      var matOreGreen = new THREE.MeshStandardMaterial({ color:0x5A7A4A, metalness:0.35, roughness:0.65 });
      var matVein = new THREE.MeshStandardMaterial({ color:0xDAA050, emissive:0xDAA050, emissiveIntensity:1.2, roughness:0.5, metalness:0.5 });
      var matVeinCopper = new THREE.MeshStandardMaterial({ color:0xD08858, emissive:0xD08858, emissiveIntensity:0.9, roughness:0.55, metalness:0.5 });
      var oreMats = [matOreGold, matOreCopper, matOreRed, matOreGreen];

      var mainGroup = new THREE.Group();
      scene.add(mainGroup);

      /* Build rock strata layers */
      var strataDefs = [
        { y:-5, h:1.8, color:0, w:40, d:20, rx:0, rz:0.02 },
        { y:-3.2, h:1.6, color:1, w:38, d:18, rx:0, rz:-0.015 },
        { y:-1.6, h:1.5, color:2, w:36, d:16, rx:0, rz:0.025 },
        { y:-0.1, h:1.4, color:3, w:34, d:15, rx:0, rz:-0.02 },
        { y:1.3, h:1.3, color:4, w:32, d:14, rx:0, rz:0.018 },
        { y:2.6, h:1.2, color:5, w:30, d:13, rx:0, rz:-0.012 },
        { y:3.8, h:1.0, color:0, w:28, d:12, rx:0, rz:0.022 },
      ];

      strataDefs.forEach(function(s) {
        var geo = new THREE.BoxGeometry(Math.max(0.01,s.w), Math.max(0.01,s.h), Math.max(0.01,s.d), 32, 4, 16);
        var pos = geo.attributes.position;
        for (var i = 0; i < pos.count; i++) {
          var x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
          var n = (Math.sin(x*0.8+z*0.6)*Math.cos(y*1.2+x*0.4)*Math.sin(z*0.9-y*0.7))*0.6;
          pos.setX(i, x + n);
          pos.setY(i, y + n * 0.3);
          pos.setZ(i, z + n * 0.8);
        }
        pos.needsUpdate = true; geo.computeVertexNormals();
        var mesh = new THREE.Mesh(geo, matStrata[s.color]);
        mesh.position.y = s.y;
        mesh.rotation.z = s.rz;
        mainGroup.add(mesh);
      });

      /* Ore deposits embedded in strata */
      var oreDefs = [
        { p:[-4,-4.2,2], s:[1.2,0.6,0.8], m:0, r:[0.3,0.2,0.4] },
        { p:[3,-2.5,-1], s:[0.9,0.5,0.7], m:1, r:[-0.2,0.3,0.1] },
        { p:[-2,-0.5,1.5], s:[1.0,0.55,0.65], m:0, r:[0.1,-0.15,0.3] },
        { p:[5,0.8,-2], s:[0.8,0.45,0.6], m:2, r:[-0.3,0.1,-0.2] },
        { p:[-5,1.5,0], s:[1.1,0.5,0.75], m:3, r:[0.2,0.25,-0.15] },
        { p:[2,2.8,1], s:[0.7,0.4,0.55], m:1, r:[-0.15,-0.2,0.35] },
        { p:[-3,3.5,-1.5], s:[0.9,0.5,0.6], m:0, r:[0.25,0.1,0.2] },
        { p:[6,-3.8,0.5], s:[0.85,0.48,0.7], m:2, r:[-0.1,0.3,-0.25] },
        { p:[-1,2.0,2.5], s:[0.75,0.42,0.58], m:3, r:[0.15,-0.25,0.1] },
        { p:[4,4.0,-0.5], s:[0.65,0.38,0.5], m:0, r:[-0.2,0.15,0.3] },
      ];

      oreDefs.forEach(function(o) {
        var geo = new THREE.DodecahedronGeometry(1, 1);
        var pos = geo.attributes.position;
        for (var i = 0; i < pos.count; i++) {
          pos.setX(i, pos.getX(i) + (Math.random()-0.5)*0.35);
          pos.setY(i, pos.getY(i) + (Math.random()-0.5)*0.25);
          pos.setZ(i, pos.getZ(i) + (Math.random()-0.5)*0.35);
        }
        pos.needsUpdate = true; geo.computeVertexNormals();
        var mesh = new THREE.Mesh(geo, oreMats[o.m]);
        mesh.position.set(o.p[0], o.p[1], o.p[2]);
        mesh.scale.set(o.s[0], o.s[1], o.s[2]);
        mesh.rotation.set(o.r[0], o.r[1], o.r[2]);
        mainGroup.add(mesh);
      });

      /* Metallic veins cutting through strata */
      var veinPaths = [
        [new THREE.Vector3(-12,-5,3), new THREE.Vector3(-6,-3.5,1), new THREE.Vector3(-1,-1.5,2), new THREE.Vector3(4,0.5,0.5), new THREE.Vector3(10,2.5,-1), new THREE.Vector3(14,4,-2)],
        [new THREE.Vector3(8,-4.5,-3), new THREE.Vector3(4,-2.8,-1.5), new THREE.Vector3(0,-0.8,-0.5), new THREE.Vector3(-4,1.2,1), new THREE.Vector3(-8,3,2.5)],
        [new THREE.Vector3(-3,-5.5,4), new THREE.Vector3(-1,-3,3), new THREE.Vector3(1,-0.5,2), new THREE.Vector3(3,2,1), new THREE.Vector3(5,3.8,0)],
        [new THREE.Vector3(6,-4,2), new THREE.Vector3(3,-2,3.5), new THREE.Vector3(0,0.5,2.5), new THREE.Vector3(-3,2.5,1.5)],
        [new THREE.Vector3(-8,-2,-2), new THREE.Vector3(-4,-0.5,-1), new THREE.Vector3(0,1.5,0), new THREE.Vector3(5,3.5,1)],
      ];

      veinPaths.forEach(function(pts, idx) {
        var curve = new THREE.CatmullRomCurve3(pts);
        var radius = 0.04 + Math.random() * 0.03;
        var geo = new THREE.TubeGeometry(curve, 60, Math.max(0.005, radius), 5, false);
        mainGroup.add(new THREE.Mesh(geo, idx % 2 === 0 ? matVein : matVeinCopper));
      });

      /* Scattered small rocks / debris */
      for (var i = 0; i < 30; i++) {
        var geo = new THREE.DodecahedronGeometry(Math.max(0.01, 0.08 + Math.random()*0.15), 0);
        var pos = geo.attributes.position;
        for (var j = 0; j < pos.count; j++) {
          pos.setX(j, pos.getX(j) + (Math.random()-0.5)*0.15);
          pos.setY(j, pos.getY(j) + (Math.random()-0.5)*0.1);
          pos.setZ(j, pos.getZ(j) + (Math.random()-0.5)*0.15);
        }
        pos.needsUpdate = true; geo.computeVertexNormals();
        var mesh = new THREE.Mesh(geo, matStrata[Math.floor(Math.random()*matStrata.length)]);
        mesh.position.set((Math.random()-0.5)*20, -6 + Math.random()*12, (Math.random()-0.5)*10);
        mesh.rotation.set(Math.random()*0.5, Math.random()*0.5, Math.random()*0.5);
        mainGroup.add(mesh);
      }

      /* Floating mineral dust particles */
      var pC = window.innerWidth < 768 ? 200 : 500;
      var pP = new Float32Array(pC * 3);
      var pS = new Float32Array(pC);
      var pSp = new Float32Array(pC);
      var pCol = new Float32Array(pC * 3);
      var cols = [
        new THREE.Color(0xF0C060), new THREE.Color(0xE8AC50),
        new THREE.Color(0xD08858), new THREE.Color(0xDAA850),
        new THREE.Color(0x9B4A3A), new THREE.Color(0x5A7A4A)
      ];

      for (var i = 0; i < pC; i++) {
        var th = Math.random()*Math.PI*2, ph = Math.acos(2*Math.random()-1), r = 1+Math.random()*18;
        pP[i*3] = r*Math.sin(ph)*Math.cos(th);
        pP[i*3+1] = r*Math.sin(ph)*Math.sin(th);
        pP[i*3+2] = r*Math.cos(ph);
        pS[i] = 0.01 + Math.random()*0.06;
        pSp[i] = 0.15 + Math.random()*0.7;
        var c = cols[Math.floor(Math.random()*cols.length)];
        pCol[i*3] = c.r; pCol[i*3+1] = c.g; pCol[i*3+2] = c.b;
      }
      var pGeo = new THREE.BufferGeometry();
      pGeo.setAttribute('position', new THREE.BufferAttribute(pP, 3));
      pGeo.setAttribute('aSize', new THREE.BufferAttribute(pS, 1));
      pGeo.setAttribute('aSpeed', new THREE.BufferAttribute(pSp, 1));
      pGeo.setAttribute('aColor', new THREE.BufferAttribute(pCol, 3));

      var pMat = new THREE.ShaderMaterial({
        uniforms: { uTime: { value: 0 } },
        vertexShader: [
          'attribute float aSize; attribute float aSpeed; attribute vec3 aColor;',
          'uniform float uTime; varying float vAlpha; varying vec3 vColor;',
          'void main(){',
          '  vColor = aColor;',
          '  vec3 p = position;',
          '  p.y += sin(uTime*0.1*aSpeed + position.x*0.3)*0.5;',
          '  p.x += cos(uTime*0.08*aSpeed + position.z*0.25)*0.4;',
          '  p.z += sin(uTime*0.06*aSpeed + position.y*0.2)*0.35;',
          '  vec4 mv = modelViewMatrix * vec4(p, 1.0);',
          '  gl_Position = projectionMatrix * mv;',
          '  gl_PointSize = aSize * (300.0 / -mv.z);',
          '  vAlpha = 0.3 + 0.7*(1.0 - clamp(length(position)/20.0, 0.0, 1.0));',
          '}'
        ].join('\n'),
        fragmentShader: [
          'varying float vAlpha; varying vec3 vColor;',
          'void main(){',
          '  float d = length(gl_PointCoord - 0.5);',
          '  if(d > 0.5) discard;',
          '  float a = smoothstep(0.5, 0.0, d) * vAlpha * 0.45;',
          '  gl_FragColor = vec4(vColor, a);',
          '}'
        ].join('\n'),
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending
      });
      scene.add(new THREE.Points(pGeo, pMat));

      /* Lighting */
      scene.add(new THREE.AmbientLight(0x3A2E20, 3.5));
      var dl = new THREE.DirectionalLight(0xF8D878, 5.5);
      dl.position.set(5, 12, 6); scene.add(dl);
      var pl1 = new THREE.PointLight(0xE8AC50, 45, 30); pl1.position.set(-4, 3, 5); scene.add(pl1);
      var pl2 = new THREE.PointLight(0xD89060, 35, 28); pl2.position.set(5, -2, -3); scene.add(pl2);
      var pl3 = new THREE.PointLight(0xF0C060, 25, 25); pl3.position.set(0, 5, -4); scene.add(pl3);
      var rim = new THREE.DirectionalLight(0xDAA850, 4); rim.position.set(-4, 4, -8); scene.add(rim);
      var front = new THREE.PointLight(0xF0D870, 18, 20); front.position.set(0, 1, 8); scene.add(front);
      var sl = new THREE.SpotLight(0xF8D878, 25, 40, Math.PI/6, 0.5, 1);
      sl.position.set(0, 14, 4); sl.target.position.set(0, -2, 0);
      scene.add(sl); scene.add(sl.target);

      /* Mouse */
      var mouseX = 0, mouseY = 0, smX = 0, smY = 0;
      window.addEventListener('mousemove', function(e) {
        mouseX = (e.clientX/window.innerWidth-0.5)*2;
        mouseY = (e.clientY/window.innerHeight-0.5)*2;
      });
      window.addEventListener('touchmove', function(e) {
        if(e.touches[0]){ mouseX=(e.touches[0].clientX/window.innerWidth-0.5)*2; mouseY=(e.touches[0].clientY/window.innerHeight-0.5)*2; }
      }, { passive: true });
      window.addEventListener('resize', function() {
        camera.aspect = window.innerWidth/window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      });

      /* Animate */
      var time = 0;
      function animate() {
        requestAnimationFrame(animate);
        time += 0.016;

        smX += (mouseX - smX) * 0.012;
        smY += (mouseY - smY) * 0.012;
        var bx = page === 'about' ? 3 : page === 'contact' ? -3 : 0;
        var by = page === 'about' ? 2 : 2;
        camera.position.x = bx + smX * 1.5;
        camera.position.y = by - smY * 0.8;
        camera.lookAt(0, -1, 0);

        if (!reducedMotion) mainGroup.rotation.y += 0.0004;

        pMat.uniforms.uTime.value = time;

        pl1.intensity = 45 + Math.sin(time*0.5)*10;
        pl2.intensity = 35 + Math.cos(time*0.4)*8;
        pl3.intensity = 25 + Math.sin(time*0.7+1)*6;
        matVein.emissiveIntensity = 1.0 + Math.sin(time*0.4)*0.5;
        matVeinCopper.emissiveIntensity = 0.7 + Math.cos(time*0.5)*0.35;

        renderer.render(scene, camera);
      }
      if (!reducedMotion) animate();
      else renderer.render(scene, camera);
    } catch (err) { console.warn('XEMMIC 3D scene error:', err); }
  }

  /* Headline reveal */
  if (page === 'index') {
    var headline = document.getElementById('headline');
    if (headline) {
      (function split(node) {
        if (node.nodeType === 3) {
          var parts = node.textContent.split(/(\s+)/);
          var frag = document.createDocumentFragment();
          parts.forEach(function(p) {
            if (/\s+/.test(p)) frag.appendChild(document.createTextNode(p));
            else if (p.length) { var s = document.createElement('span'); s.className='word'; s.textContent=p; frag.appendChild(s); }
          });
          node.parentNode.replaceChild(frag, node);
        } else if (node.nodeType === 1) Array.from(node.childNodes).forEach(split);
      })(headline);
      headline.querySelectorAll('.word').forEach(function(el, i) {
        setTimeout(function() { el.classList.add('visible'); }, 1800 + i * 150);
      });
    }
  }

  /* Email */
  if (page === 'index') {
    var btn = document.getElementById('notify-btn');
    var inp = document.getElementById('email-input');
    if (btn && inp) {
      function submit() {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inp.value.trim())) {
          inp.style.outline='2px solid var(--bronze)'; inp.focus();
          setTimeout(function(){inp.style.outline='';},1400); return;
        }
        var row=document.getElementById('email-row'), label=document.querySelector('.email-label'),
            priv=document.querySelector('.privacy'), msg=document.getElementById('success-msg'),
            csBlock=document.querySelector('.coming-soon-block');
        if(row) row.style.display='none'; if(label) label.style.display='none';
        if(priv) priv.style.display='none'; if(csBlock) csBlock.style.display='none';
        if(msg) msg.style.display='block';
      }
      btn.addEventListener('click', submit);
      inp.addEventListener('keydown', function(e){ if(e.key==='Enter') submit(); });
    }
  }

  /* Contact form */
  if (page === 'contact') {
    var form = document.getElementById('contact-form');
    var successEl = document.getElementById('form-success');
    if (form) {
      form.addEventListener('submit', function(e) {
        e.preventDefault(); var valid = true;
        form.querySelectorAll('input[required], textarea[required], select[required]').forEach(function(inp) {
          if (!inp.value.trim()) { inp.style.outline='2px solid var(--bronze)'; setTimeout(function(){inp.style.outline='';},1400); valid=false; }
        });
        var em = form.querySelector('input[type="email"]');
        if (em && em.value.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em.value.trim())) {
          em.style.outline='2px solid var(--bronze)'; setTimeout(function(){em.style.outline='';},1400); valid=false;
        }
        if (!valid) return;
        form.style.display='none'; if(successEl) successEl.style.display='block';
      });
    }
  }
});
import * as THREE from 'three';

/* ============================================================
   PRELOADER
   ============================================================ */
(function(){
  const loader=document.getElementById('loader');
  const count=document.getElementById('loaderCount');
  const bar=document.getElementById('loaderBar');
  document.body.classList.add('locked');
  let p=0;
  setTimeout(()=>loader.classList.add('go'),120);
  const t=setInterval(()=>{
    p+=Math.random()*14+5;
    if(p>=100){p=100;clearInterval(t);setTimeout(finish,420);}
    count.textContent=Math.floor(p);
    bar.style.width=p+'%';
  },120);
  function finish(){
    loader.classList.add('done');
    document.body.classList.remove('locked');
    document.body.setAttribute('aria-busy', 'false');
    setTimeout(()=>{loader.style.display='none';startReveal();},1000);
  }
})();

function startReveal(){
  document.getElementById('hero').classList.add('go');
  document.querySelectorAll('#hero .reveal').forEach((el,i)=>{
    setTimeout(()=>el.classList.add('in'),300+i*120);
  });
}

/* ============================================================
   INTERACTIVE 3D PARTICLE GLOBE (Three.js)
   ============================================================ */
(function(){
  const canvas = document.getElementById('particleCanvas');
  if(!canvas) return;
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const parent = canvas.parentElement;
  
  // Scene, Camera, Renderer
  const scene = new THREE.Scene();
  
  // Perspective Camera
  const camera = new THREE.PerspectiveCamera(45, parent.clientWidth / parent.clientHeight, 1, 1000);
  camera.position.z = 280;

  const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    alpha: true,
    antialias: true
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(parent.clientWidth, parent.clientHeight);

  // Globe Group to hold all parts
  const globeGroup = new THREE.Group();
  scene.add(globeGroup);

  const globeRadius = 90;

  // 1. Uniform Particle Sphere using Fibonacci Algorithm
  const particlesCount = 1200;
  const positions = new Float32Array(particlesCount * 3);
  const colors = new Float32Array(particlesCount * 3);
  
  const phi = Math.PI * (Math.sqrt(5) - 1); // Golden ratio angle

  for (let i = 0; i < particlesCount; i++) {
    const y = 1 - (i / (particlesCount - 1)) * 2; // from 1 to -1
    const radiusAtY = Math.sqrt(1 - y * y);
    const theta = phi * i;

    const x = Math.cos(theta) * radiusAtY * globeRadius;
    const z = Math.sin(theta) * radiusAtY * globeRadius;
    const targetY = y * globeRadius;

    positions[i * 3] = x;
    positions[i * 3 + 1] = targetY;
    positions[i * 3 + 2] = z;

    // Color gradient from Accent orange (#ff5e3a) to Indigo/Purple (#9c27b0)
    const mix = (y + 1) / 2; // 0 to 1
    // Orange: rgb(255, 94, 58) -> 1.0, 0.37, 0.23
    // Purple: rgb(156, 39, 176) -> 0.61, 0.15, 0.69
    colors[i * 3] = 1.0 * (1 - mix) + 0.61 * mix;
    colors[i * 3 + 1] = 0.37 * (1 - mix) + 0.15 * mix;
    colors[i * 3 + 2] = 0.23 * (1 - mix) + 0.69 * mix;
  }

  const pGeometry = new THREE.BufferGeometry();
  pGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  pGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  // Dynamic Glow texture using Canvas
  function createGlowTexture() {
    const texCanvas = document.createElement('canvas');
    texCanvas.width = 16;
    texCanvas.height = 16;
    const ctx = texCanvas.getContext('2d');
    const grad = ctx.createRadialGradient(8, 8, 0, 8, 8, 8);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(0.3, 'rgba(255, 255, 255, 0.8)');
    grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 16, 16);
    return new THREE.CanvasTexture(texCanvas);
  }

  const pMaterial = new THREE.PointsMaterial({
    size: 2.8,
    map: createGlowTexture(),
    vertexColors: true,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });

  const globeParticles = new THREE.Points(pGeometry, pMaterial);
  globeGroup.add(globeParticles);

  // 2. Techy Wireframe Sphere inside the Globe
  const wireGeometry = new THREE.SphereGeometry(globeRadius - 2, 18, 18);
  const wireMaterial = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    wireframe: true,
    transparent: true,
    opacity: 0.04,
    depthWrite: false
  });
  const wireGlobe = new THREE.Mesh(wireGeometry, wireMaterial);
  globeGroup.add(wireGlobe);

  // 3. Arched Network Connections
  const connectionsGroup = new THREE.Group();
  globeGroup.add(connectionsGroup);

  const pulses = [];
  const arcCount = 10;

  // Function to create a 3D arc between two vector points on the sphere
  function createArc(pointA, pointB) {
    const mid = new THREE.Vector3().addVectors(pointA, pointB).multiplyScalar(0.5);
    const dist = pointA.distanceTo(pointB);
    // Push mid point outwards from the sphere center to make a beautiful bezier arc
    mid.normalize().multiplyScalar(globeRadius + dist * 0.28);

    const curve = new THREE.QuadraticBezierCurve3(pointA, mid, pointB);
    const points = curve.getPoints(30);
    const lineGeom = new THREE.BufferGeometry().setFromPoints(points);

    // Subtle connection line
    const lineMat = new THREE.LineBasicMaterial({
      color: 0xff5e3a,
      transparent: true,
      opacity: 0.25,
      blending: THREE.AdditiveBlending
    });
    const line = new THREE.Line(lineGeom, lineMat);
    connectionsGroup.add(line);

    // Glowing travelling pulse
    const pulseGeom = new THREE.SphereGeometry(1.2, 8, 8);
    const pulseMat = new THREE.MeshBasicMaterial({
      color: 0xff5e3a,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending
    });
    const pulseMesh = new THREE.Mesh(pulseGeom, pulseMat);
    scene.add(pulseMesh); // Add to scene directly to handle local rotation position later

    pulses.push({
      curve: curve,
      progress: Math.random(),
      speed: 0.004 + Math.random() * 0.005,
      mesh: pulseMesh
    });
  }

  // Generate random coordinate pairs on the globe for connections
  function getRandomSphericalPoint(radius) {
    const u = Math.random();
    const v = Math.random();
    const theta = u * 2.0 * Math.PI;
    const phi = Math.acos(2.0 * v - 1.0);
    const x = radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.sin(phi) * Math.sin(theta);
    const z = radius * Math.cos(phi);
    return new THREE.Vector3(x, y, z);
  }

  for (let i = 0; i < arcCount; i++) {
    const p1 = getRandomSphericalPoint(globeRadius);
    const p2 = getRandomSphericalPoint(globeRadius);
    // Make sure they aren't too close or exactly opposite
    if (p1.distanceTo(p2) > 40 && p1.distanceTo(p2) < globeRadius * 1.8) {
      createArc(p1, p2);
    }
  }

  // 4. Interactivity (Drag & Mouse Tilt Parallax)
  let isDragging = false;
  let prevMousePos = { x: 0, y: 0 };
  let targetRotation = { x: 0.2, y: 0 };
  let currentRotation = { x: 0.2, y: 0 };
  let velocity = { x: 0.002, y: 0.002 };
  let tilt = { x: 0, y: 0 };

  // Track canvas client rect for mouse coordinate mapping
  let canvasRect = canvas.getBoundingClientRect();

  canvas.style.cursor = 'grab';

  canvas.addEventListener('mousedown', e => {
    isDragging = true;
    canvas.style.cursor = 'grabbing';
    prevMousePos = { x: e.clientX, y: e.clientY };
  });

  window.addEventListener('mousemove', e => {
    if (!isDragging) {
      // Parallax rotation based on cursor hover position relative to globe center
      const x = e.clientX - (canvasRect.left + canvasRect.width / 2);
      const y = e.clientY - (canvasRect.top + canvasRect.height / 2);
      tilt.y = (x / window.innerWidth) * 0.35;
      tilt.x = (y / window.innerHeight) * 0.35;
      return;
    }

    const deltaMove = {
      x: e.clientX - prevMousePos.x,
      y: e.clientY - prevMousePos.y
    };

    targetRotation.y += deltaMove.x * 0.004;
    targetRotation.x += deltaMove.y * 0.004;

    velocity.y = deltaMove.x * 0.004;
    velocity.x = deltaMove.y * 0.004;

    prevMousePos = { x: e.clientX, y: e.clientY };
  });

  window.addEventListener('mouseup', () => {
    if (isDragging) {
      isDragging = false;
      canvas.style.cursor = 'grab';
    }
  });

  // Track window resize
  function resize() {
    const parentWidth = parent.clientWidth;
    const parentHeight = parent.clientHeight;
    camera.aspect = parentWidth / parentHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(parentWidth, parentHeight);
    canvasRect = canvas.getBoundingClientRect();
  }
  window.addEventListener('resize', resize);
  window.addEventListener('scroll', () => {
    canvasRect = canvas.getBoundingClientRect();
  });

  // 5. Animation Loop
  function animate() {
    requestAnimationFrame(animate);

    if (!isDragging) {
      // Slow auto rotation combined with user-drag velocity decay
      targetRotation.y += 0.0012 + velocity.y;
      targetRotation.x += velocity.x;

      velocity.y *= 0.93;
      velocity.x *= 0.93;
    }

    // Smooth Interpolation (Lerp) for Rotation
    currentRotation.x += (targetRotation.x - currentRotation.x) * 0.08;
    currentRotation.y += (targetRotation.y - currentRotation.y) * 0.08;

    globeGroup.rotation.x = currentRotation.x;
    globeGroup.rotation.y = currentRotation.y;

    // Apply interactive hover tilt parallax
    scene.rotation.x += (tilt.x - scene.rotation.x) * 0.05;
    scene.rotation.y += (tilt.y - scene.rotation.y) * 0.05;

    // Update glowing network connection pulses
    pulses.forEach(p => {
      p.progress += p.speed;
      if (p.progress > 1) {
        p.progress = 0;
      }
      // Get point along bezier curve in local space
      const localPos = p.curve.getPointAt(p.progress);
      // Transform local coordinate to match rotating globe
      const globalPos = localPos.clone().applyMatrix4(globeGroup.matrixWorld);
      p.mesh.position.copy(globalPos);
    });

    renderer.render(scene, camera);
  }

  // Initialize
  resize();
  animate();
})();

/* ============================================================
   CURSOR
   ============================================================ */
(function(){
  if(window.matchMedia('(pointer:coarse)').matches || window.matchMedia('(prefers-reduced-motion: reduce)').matches){
    document.body.style.cursor='auto';
    document.querySelectorAll('.cursor-ring,.cursor-dot').forEach(e=>e.remove());
    return;
  }
  const ring=document.querySelector('.cursor-ring');
  const dot=document.querySelector('.cursor-dot');
  if(!ring||!dot)return;
  let mx=0,my=0,rx=0,ry=0;
  document.addEventListener('mousemove',e=>{
    mx=e.clientX;my=e.clientY;
    dot.style.transform='translate3d('+mx+'px,'+my+'px,0)';
    ring.classList.add('vis');dot.classList.add('vis');
  });
  document.addEventListener('mouseleave',()=>{ring.classList.remove('vis');dot.classList.remove('vis');});
  document.addEventListener('mouseenter',()=>{ring.classList.add('vis');dot.classList.add('vis');});
  (function loop(){
    rx+=(mx-rx)*0.18;ry+=(my-ry)*0.18;
    ring.style.transform='translate3d('+rx+'px,'+ry+'px,0)';
    requestAnimationFrame(loop);
  })();
  const hov='a,button,input,textarea,.svc,.wcard,.exp-card,.channel,.stat-cell,.proc-step,[data-magnetic]';
  function bindHovers(){
    document.querySelectorAll(hov).forEach(el=>{
      if(el.dataset.cbound)return;el.dataset.cbound=1;
      el.addEventListener('mouseenter',()=>{ring.classList.add('big');dot.classList.add('big');});
      el.addEventListener('mouseleave',()=>{ring.classList.remove('big');dot.classList.remove('big');});
    });
  }
  bindHovers();
  setTimeout(bindHovers,1200);
})();

/* ============================================================
   MAGNETIC
   ============================================================ */
(function(){
  if(window.matchMedia('(pointer:coarse)').matches || window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  document.querySelectorAll('.magnetic,[data-magnetic]').forEach(el=>{
    const str=0.4;
    el.addEventListener('mousemove',e=>{
      const r=el.getBoundingClientRect();
      el.style.transform=`translate(${(e.clientX-r.left-r.width/2)*str}px,${(e.clientY-r.top-r.height/2)*str}px)`;
    });
    el.addEventListener('mouseleave',()=>el.style.transform='');
  });
})();

/* ============================================================
   TEXT SPLIT (word reveal)
   ============================================================ */
(function(){
  document.querySelectorAll('[data-split]').forEach(el=>{
    const html=el.innerHTML;
    el.classList.add('split');
    const tokens=html.match(/<[^>]+>|[^<]+/g)||[];
    let wi=0;
    el.innerHTML=tokens.map(tok=>{
      if(tok.startsWith('<'))return tok;
      return tok.split(/(\s+)/).map(part=>{
        if(/^\s+$/.test(part))return part;
        if(part.trim()==='')return '';
        return `<span class="w"><i style="transition-delay:${wi++*0.05}s">${part}</i></span>`;
      }).join('');
    }).join('');
  });
})();

/* ============================================================
   REVEAL OBSERVER + SKILL BARS + COUNTERS + PORTRAIT + FOOTER
   ============================================================ */
(function(){
  const io=new IntersectionObserver((entries)=>{
    entries.forEach(en=>{
      if(en.isIntersecting){
        en.target.classList.add('in');
        if(en.target.classList.contains('split')||en.target.querySelector?.('.split')){
          en.target.classList.add('in');
          en.target.querySelectorAll('.split').forEach(s=>s.classList.add('in'));
        }
        if(en.target.classList.contains('exp-card')){
          const bar=en.target.querySelector('.exp-bar i');
          if(bar&&en.target.dataset.pct)bar.style.width=en.target.dataset.pct+'%';
        }
        en.target.querySelectorAll('[data-count]').forEach(animateCount);
        io.unobserve(en.target);
      }
    });
  },{threshold:0.15});
  document.querySelectorAll('.reveal').forEach(el=>io.observe(el));
  document.querySelectorAll('[data-split]').forEach(el=>io.observe(el));
  document.querySelectorAll('.exp-card').forEach(el=>io.observe(el));
  const portrait=document.getElementById('portrait');
  if(portrait){io.observe(portrait);portrait.classList.add('portrait');}
  const po=new IntersectionObserver(e=>{e.forEach(x=>{if(x.isIntersecting){x.target.classList.add('in');po.unobserve(x.target);}})},{threshold:0.2});
  if(portrait)po.observe(portrait);
  const foot=document.getElementById('footMega');
  if(foot){const fo=new IntersectionObserver(e=>{e.forEach(x=>{if(x.isIntersecting){x.target.classList.add('in');fo.unobserve(x.target);}})},{threshold:0.3});fo.observe(foot);}
})();

function animateCount(el){
  if(el.dataset.done)return;el.dataset.done=1;
  const target=parseFloat(el.dataset.count);
  const dec=parseInt(el.dataset.decimal||'0');
  const dur=1700,start=performance.now();
  function step(now){
    const t=Math.min(1,(now-start)/dur);
    const e=1-Math.pow(1-t,3);
    const v=target*e;
    el.textContent=dec?v.toFixed(dec):Math.floor(v);
    if(t<1)requestAnimationFrame(step);
    else el.textContent=dec?target.toFixed(dec):target;
  }
  requestAnimationFrame(step);
}

/* ============================================================
   SCROLL: progress, to-top
   ============================================================ */
(function(){
  const prog=document.getElementById('progress');
  const toTop=document.getElementById('toTop');
  let ticking=false;
  function onScroll(){
    const st=window.pageYOffset;
    const h=document.documentElement.scrollHeight-window.innerHeight;
    prog.style.width=(st/h*100)+'%';
    toTop.classList.toggle('show',st>700);
    updateWork();
    if(!ticking){ticking=true;requestAnimationFrame(()=>{ticking=false;});}
  }
  window.addEventListener('scroll',onScroll,{passive:true});
  window.addEventListener('resize',setupWork);
  onScroll();
})();

/* ============================================================
   EXP CARD GLOW FOLLOW
   ============================================================ */
(function(){
  document.querySelectorAll('.exp-card').forEach(card=>{
    card.addEventListener('mousemove',e=>{
      const r=card.getBoundingClientRect();
      card.style.setProperty('--mx',(e.clientX-r.left)+'px');
      card.style.setProperty('--my',(e.clientY-r.top)+'px');
    });
  });
})();

/* ============================================================
   MARQUEE BUILD
   ============================================================ */
(function(){
  const m=document.getElementById('marquee');
  const items=['Flutter','Dart','Animation','UI / UX','MVVM','MVC','BLoC','Riverpod','RESTful APIs','Firebase','Push Notifications','CI/CD Pipelines','UML','Custom Packages','Git'];
  const html=`<div class="m-item">${items.map(i=>`${i} <span class="dot">●</span>`).join(' ')}</div>`;
  m.innerHTML=html+html;
})();

/* ============================================================
   HORIZONTAL WORK SECTION
   ============================================================ */
function setupWork(){
  const work=document.querySelector('.work');
  const track=document.getElementById('workTrack');
  const prog=document.getElementById('workProg');
  if(!work||!track)return;
  if(window.innerWidth<=820){work.style.height='';track.style.transform='';if(prog)prog.style.width='100%';return;}
  const overflow=Math.max(0,track.scrollWidth-window.innerWidth+(window.innerWidth*0.05));
  work.style.height=(window.innerHeight+overflow)+'px';
  work.dataset.overflow=overflow;
  updateWork();
}

function updateWork(){
  const work=document.querySelector('.work');
  const track=document.getElementById('workTrack');
  const prog=document.getElementById('workProg');
  if(!work||!track)return;
  if(window.innerWidth<=820)return;
  const overflow=parseFloat(work.dataset.overflow||'0');
  if(overflow<=0)return;
  const r=work.getBoundingClientRect();
  const p=Math.min(1,Math.max(0,-r.top/overflow));
  track.style.transform=`translate3d(${-p*overflow}px,0,0)`;
  if(prog)prog.style.width=(p*100)+'%';
}

setupWork();

/* ============================================================
   MOBILE MENU
   ============================================================ */
(function(){
  const btn=document.getElementById('menuToggle');
  const menu=document.getElementById('navMenu');
  btn.addEventListener('click',()=>{
    const open = menu.classList.toggle('open');
    btn.setAttribute('aria-expanded', open);
  });
  menu.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{
    menu.classList.remove('open');
    btn.setAttribute('aria-expanded', 'false');
  }));
})();

/* ============================================================
   CONTACT FORM
   ============================================================ */
(function(){
  const f=document.getElementById('contactForm');
  f.addEventListener('submit',e=>{
    e.preventDefault();
    const btn=f.querySelector('button');
    const orig=btn.innerHTML;
    btn.innerHTML='Message sent ✓';
    btn.style.background='var(--accent)';
    btn.style.color='#fff';
    setTimeout(()=>{btn.innerHTML=orig;btn.style.background='';btn.style.color='';f.reset();},2600);
  });
})();

/* ============================================================
   LOCAL STORAGE — SKILLS PERSISTENCE + EDIT
   ============================================================ */
(function(){
  const STORAGE_KEY = 'portfolio_skills';
  const cards = document.querySelectorAll('.exp-card');
  function loadFromStorage(){
    const saved = localStorage.getItem(STORAGE_KEY);
    if(!saved) return null;
    try{ return JSON.parse(saved); }catch(e){ return null; }
  }
  function saveToStorage(data){
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }
  function getDefaultData(){
    return Array.from(cards).map(card => ({
      name: card.querySelector('h3').textContent,
      pct: parseInt(card.dataset.pct)
    }));
  }
  function applyData(data){
    cards.forEach((card, i) => {
      if(data[i]){
        card.dataset.pct = data[i].pct;
        const pctLabel = card.querySelector('.exp-pct b');
        if(pctLabel) pctLabel.textContent = data[i].pct + '%';
        const bar = card.querySelector('.exp-bar i');
        if(bar && card.classList.contains('in')) bar.style.width = data[i].pct + '%';
      }
    });
  }
  function makeEditable(card){
    const pctLabel = card.querySelector('.exp-pct b');
    if(!pctLabel || pctLabel.dataset.editable) return;
    pctLabel.dataset.editable = '1';
    pctLabel.style.cursor = 'text';
    pctLabel.title = 'Click to edit';
    pctLabel.addEventListener('click', function(e){
      e.stopPropagation();
      const current = parseInt(this.textContent) || 0;
      const input = document.createElement('input');
      input.type = 'number';
      input.min = 0;
      input.max = 100;
      input.value = current;
      input.style.cssText = 'width:48px;padding:2px 4px;background:var(--surface);border:1px solid var(--accent);border-radius:4px;color:var(--text);font-family:var(--display);font-size:inherit;text-align:center;outline:none';
      this.replaceWith(input);
      input.focus();
      input.select();
      function save(){
        const val = Math.min(100, Math.max(0, parseInt(input.value) || 0));
        input.replaceWith(pctLabel);
        pctLabel.textContent = val + '%';
        card.dataset.pct = val;
        const bar = card.querySelector('.exp-bar i');
        if(bar && card.classList.contains('in')) bar.style.width = val + '%';
        const expBar = card.querySelector('.exp-bar');
        if(expBar) expBar.setAttribute('aria-valuenow', val);
        const data = loadFromStorage() || getDefaultData();
        const idx = Array.from(cards).indexOf(card);
        if(data[idx]) data[idx].pct = val;
        saveToStorage(data);
      }
      input.addEventListener('blur', save);
      input.addEventListener('keydown', function(ev){
        if(ev.key === 'Enter'){ ev.preventDefault(); save(); }
        if(ev.key === 'Escape'){ ev.preventDefault(); input.replaceWith(pctLabel); pctLabel.textContent = current + '%'; }
      });
    });
  }
  const savedData = loadFromStorage();
  if(savedData && savedData.length === cards.length){
    applyData(savedData);
  } else {
    saveToStorage(getDefaultData());
  }
  cards.forEach(makeEditable);
})();
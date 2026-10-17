/* Studio3D: the procedural demo headphones used by the landing-page versions (needs three.js r128 as window.THREE). */
(function(){
  var T = window.THREE;
  if (!T) { window.Studio3D = null; return; }

  // Lighting rooms, approximating a few of the plugin's presets. Panel: [w, h, x, y, z, faces, intensity, color]
  var ENVS = {
    studio: { room:'#1c1c20', exposure:1.05, panels:[[7,2.4,0,4.9,.5,'top',5,'#ffffff'],[2.6,5,-4.9,.8,1,'left',3.2,'#ffffff'],[2,5,4.9,.4,-1,'right',1.8,'#ffffff'],[5,1.6,0,.2,4.9,'front',1.2,'#ffffff']] },
    city: { room:'#2b2e35', exposure:1, panels:[[9,9,0,4.9,0,'top',1.5,'#dfe7ef'],[1.2,1.8,-4.9,.6,-2,'left',2.2,'#e9f0ff'],[1.2,1.8,-4.9,.6,0,'left',2.2,'#e9f0ff'],[1.2,1.8,-4.9,.6,2,'left',2.2,'#fff1d9'],[1.2,1.8,-4.9,2.8,0,'left',1.6,'#e9f0ff'],[1.2,1.8,-2,.6,-4.9,'back',2,'#e9f0ff'],[1.2,1.8,2,.6,-4.9,'back',2,'#fff1d9'],[1.2,1.8,4.9,1.4,1,'right',1.4,'#dfe7ef']] },
    dawn: { room:'#1f1d26', exposure:1.05, panels:[[6,1.6,0,-.2,4.9,'front',2.4,'#ffb3c1'],[7,3,0,4.9,0,'top',2.2,'#cfe0ff'],[2,4,-4.9,1,0,'left',1.4,'#ffd6a8']] },
    sunset: { room:'#24161c', exposure:1, panels:[[6,2.2,-4.9,.2,0,'left',4.5,'#ff9a55'],[8,8,0,4.9,0,'top',.9,'#7c8fd6'],[3,3,4.9,1,0,'right',.6,'#ff7a6a'],[4,1.2,0,0,4.9,'front',1,'#ffb27a']] },
    night: { room:'#06080e', exposure:.95, panels:[[3,1.5,0,4.9,1,'top',2.4,'#9ab8ff'],[1.2,2.5,4.9,.6,.5,'right',2,'#ffcf8a'],[5,1,0,0,4.9,'front',.35,'#7f96c9']] },
    warehouse: { room:'#2a2622', exposure:1.1, panels:[[1,8,-3,4.9,0,'top',4,'#fff6e6'],[1,8,-1,4.9,0,'top',4,'#fff6e6'],[1,8,1,4.9,0,'top',4,'#fff6e6'],[1,8,3,4.9,0,'top',4,'#fff6e6'],[2,6,-4.9,1,0,'left',1.2,'#ffe2b8']] }
  };
  var FACE = { top:[Math.PI/2,0], left:[0,Math.PI/2], right:[0,-Math.PI/2], back:[0,0], front:[0,Math.PI] };

  function lin(hex){ return new T.Color(hex).convertSRGBToLinear(); }
  function luma(hex){ var c = new T.Color(hex); return .2126*c.r + .7152*c.g + .0722*c.b; }
  var clamp = function(v,a,b){ return Math.max(a, Math.min(b, v)); };

  window.Studio3D = function(canvas, o){
    o = o || {};
    var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    var renderer;
    try { renderer = new T.WebGLRenderer({ canvas:canvas, antialias:true, alpha:true }); } catch (e){ return null; }
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    renderer.outputEncoding = T.sRGBEncoding;
    renderer.toneMapping = T.ACESFilmicToneMapping;

    var scene = new T.Scene(), camera = new T.PerspectiveCamera(30, 1, .1, 100);
    var pm = new T.PMREMGenerator(renderer), envCache = {};
    function envTex(name){
      if (envCache[name]) return envCache[name];
      var d = ENVS[name] || ENVS.studio, s = new T.Scene();
      s.add(new T.Mesh(new T.BoxGeometry(10,10,10), new T.MeshBasicMaterial({ color:new T.Color(d.room), side:T.BackSide })));
      d.panels.forEach(function(p){
        var c = new T.Color(p[7]).multiplyScalar(p[6]);
        var m = new T.Mesh(new T.PlaneGeometry(p[0], p[1]), new T.MeshBasicMaterial({ color:c, side:T.DoubleSide }));
        m.position.set(p[2], p[3], p[4]); m.rotation.set(FACE[p[5]][0], FACE[p[5]][1], 0); s.add(m);
      });
      return (envCache[name] = pm.fromScene(s, .04).texture);
    }
    var envName = o.env || 'studio';
    scene.environment = envTex(envName);
    renderer.toneMappingExposure = ENVS[envName].exposure;

    var key = new T.DirectionalLight(0xffffff, 1.1); key.position.set(3,5,4); scene.add(key);
    var rim = new T.DirectionalLight(0x9fc0ff, .6); rim.position.set(-4,2,-3); scene.add(rim);

    var colors = { cup:'#e3dccf', band:'#f1ede6', cushion:'#ece7df' };
    var mats = {
      cup: new T.MeshPhysicalMaterial({ color:lin(colors.cup), metalness:.72, roughness:.3, clearcoat:.35, clearcoatRoughness:.35 }),
      steel: new T.MeshStandardMaterial({ color:lin('#e4e4e8'), metalness:1, roughness:.16 }),
      band: new T.MeshStandardMaterial({ color:lin(colors.band), metalness:0, roughness:.62 }),
      cushion: new T.MeshStandardMaterial({ color:lin(colors.cushion), metalness:0, roughness:.95 }),
      inner: new T.MeshStandardMaterial({ color:lin('#2a2a2e'), roughness:1 })
    };
    var target = { cup:lin(colors.cup), band:lin(colors.band), cushion:lin(colors.cushion) };

    var root = new T.Group(), inner = new T.Group(); inner.position.y = -.71; root.add(inner); scene.add(root);
    var parts = {}, trims = [];

    var prof = [];
    for (var i = 0; i <= 40; i++){
      var a = -Math.PI/2 + Math.PI*i/40, ca = Math.cos(a), sa = Math.sin(a);
      prof.push(new T.Vector2(.001 + .62*Math.pow(Math.abs(ca), .42), .21*Math.sign(sa)*Math.pow(Math.abs(sa), .42)));
    }
    var cupGeo = new T.LatheGeometry(prof, 72), cushGeo = new T.TorusGeometry(.43, .13, 28, 72);

    var dc = document.createElement('canvas'); dc.width = dc.height = 512;
    var dctx = dc.getContext('2d'), dtex = new T.CanvasTexture(dc); dtex.encoding = T.sRGBEncoding; dtex.anisotropy = 4;
    var text = '';

    [-1, 1].forEach(function(s){
      var g = new T.Group(); g.position.x = s*.98;
      var cup = new T.Mesh(cupGeo, mats.cup); cup.rotation.z = Math.PI/2; g.add(cup);
      var cush = new T.Group();
      var torus = new T.Mesh(cushGeo, mats.cushion); torus.rotation.y = Math.PI/2; cush.add(torus);
      var cloth = new T.Mesh(new T.CircleGeometry(.44, 48), mats.inner); cloth.rotation.y = -s*Math.PI/2; cloth.position.x = s*.04; cush.add(cloth);
      cush.position.x = -s*.27; g.add(cush);
      var yoke = new T.Mesh(new T.TorusGeometry(.7, .03, 12, 64, Math.PI), mats.steel); yoke.rotation.y = Math.PI/2; g.add(yoke);
      [-.7, .7].forEach(function(z){ var pin = new T.Mesh(new T.CylinderGeometry(.06,.06,.07,24), mats.steel); pin.rotation.x = Math.PI/2; pin.position.z = z; g.add(pin); });
      var slider = new T.Mesh(new T.BoxGeometry(.05,.56,.15), mats.steel); slider.position.y = .97; g.add(slider);
      var trim = new T.Mesh(new T.TorusGeometry(.5, .014, 10, 72), mats.steel); trim.rotation.y = Math.PI/2; trim.position.x = s*.2; g.add(trim); trims.push(trim);
      if (s === 1){
        var decal = new T.Mesh(new T.CircleGeometry(.36, 48), new T.MeshStandardMaterial({ map:dtex, transparent:true, metalness:.4, roughness:.45, polygonOffset:true, polygonOffsetFactor:-2 }));
        decal.rotation.y = Math.PI/2; decal.position.x = .214; g.add(decal);
      }
      inner.add(g);
      parts[s < 0 ? 'cupL' : 'cupR'] = g; parts[s < 0 ? 'cushL' : 'cushR'] = cush;
    });

    var head = new T.Group();
    function arc(rx, ry, t0, t1){
      var pts = [];
      for (var i = 0; i <= 48; i++){ var t = t0 + (t1 - t0)*i/48; pts.push(new T.Vector3(rx*Math.cos(t), 1.22 + ry*Math.sin(t), 0)); }
      return new T.CatmullRomCurve3(pts);
    }
    var band = new T.Mesh(new T.TubeGeometry(arc(.98,.84,0,Math.PI), 140, .075, 20), mats.band); band.scale.z = 2; head.add(band);
    var strip = new T.Mesh(new T.TubeGeometry(arc(1.05,.91,.06,Math.PI-.06), 140, .02, 10), mats.steel); strip.scale.z = 4.5; head.add(strip);
    inner.add(head); parts.head = head;

    var sc = document.createElement('canvas'); sc.width = sc.height = 256;
    var sg = sc.getContext('2d'), grd = sg.createRadialGradient(128,128,0,128,128,128);
    grd.addColorStop(0, 'rgba(0,0,0,' + (o.shadow || .55) + ')'); grd.addColorStop(.6, 'rgba(0,0,0,.16)'); grd.addColorStop(1, 'rgba(0,0,0,0)');
    sg.fillStyle = grd; sg.fillRect(0,0,256,256);
    var shadow = new T.Mesh(new T.PlaneGeometry(3.6, 1.6), new T.MeshBasicMaterial({ map:new T.CanvasTexture(sc), transparent:true, depthWrite:false }));
    shadow.rotation.x = -Math.PI/2; scene.add(shadow);

    function drawText(){
      var s = dc.width; dctx.clearRect(0,0,s,s);
      if (text){
        var l = luma(colors.cup);
        dctx.fillStyle = l > .55 ? 'rgba(70,62,50,.78)' : 'rgba(255,255,255,.92)';
        var size = text.length > 2 ? 150 : 190;
        dctx.font = '600 ' + size + 'px "Hanken Grotesk", system-ui, Helvetica, Arial, sans-serif';
        dctx.textAlign = 'center'; dctx.textBaseline = 'middle';
        dctx.fillText(text, s/2, s/2 + 8);
      }
      dtex.needsUpdate = true;
    }
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(drawText);

    // anchors for hotspots and labels: inner-local point + outward normal
    var ANCHORS = {
      engrave: function(){ return [new T.Vector3(parts.cupR.position.x + .22, 0, 0), new T.Vector3(1,0,0)]; },
      cupR: function(){ return [new T.Vector3(parts.cupR.position.x + .22, .42, 0), new T.Vector3(1,0,0)]; },
      cushL: function(){ return [new T.Vector3(parts.cupL.position.x + parts.cushL.position.x - .1, -.3, .3), new T.Vector3(0,0,1)]; },
      head: function(){ return [new T.Vector3(.35, 2.02 + parts.head.position.y, .18), new T.Vector3(0,.5,1).normalize()]; },
      yokeL: function(){ return [new T.Vector3(parts.cupL.position.x - .15, .82, 0), new T.Vector3(0,0,1)]; },
      slider: function(){ return [new T.Vector3(parts.cupR.position.x, 1.05, .1), new T.Vector3(0,0,1)]; }
    };

    var view = { yaw:o.yaw || -.5, pitch:.06, zoom:1, explode:0 };
    var cur = { yaw:view.yaw - 2.2, pitch:.06, zoom:1, explode:0 };
    var tilt = { x:0, y:0 }, curTilt = { x:0, y:0 };
    var spin = o.autoSpin !== false, lastTouch = -1e9, vel = 0, drag = null;

    if (o.drag !== false){
      canvas.style.touchAction = 'pan-y';
      canvas.style.cursor = 'grab';
      canvas.addEventListener('pointerdown', function(e){
        drag = { x:e.clientX, y:e.clientY, yaw:view.yaw, pitch:view.pitch, t:performance.now() };
        canvas.setPointerCapture(e.pointerId); canvas.style.cursor = 'grabbing'; lastTouch = performance.now();
        if (o.onInteract) o.onInteract();
      });
      canvas.addEventListener('pointermove', function(e){
        if (!drag) return;
        var dx = e.clientX - drag.x, dy = e.clientY - drag.y;
        var ny = drag.yaw + dx*.009; vel = (ny - view.yaw); view.yaw = ny;
        if (e.pointerType !== 'touch') view.pitch = clamp(drag.pitch + dy*.004, -.25, .55);
        lastTouch = performance.now();
      });
      var end = function(){ drag = null; canvas.style.cursor = 'grab'; };
      canvas.addEventListener('pointerup', end); canvas.addEventListener('pointercancel', end);
      canvas.addEventListener('keydown', function(e){
        if (e.key === 'ArrowLeft') view.yaw -= .25; else if (e.key === 'ArrowRight') view.yaw += .25;
        else if (e.key === '+' || e.key === '=') view.zoom = clamp(view.zoom - .1, .6, 1.5);
        else if (e.key === '-') view.zoom = clamp(view.zoom + .1, .6, 1.5);
        else return;
        lastTouch = performance.now(); e.preventDefault();
      });
      if (!canvas.hasAttribute('tabindex')) canvas.setAttribute('tabindex', '0');
    }
    if (o.pointerTilt && !reduce){
      addEventListener('pointermove', function(e){ tilt.x = (e.clientX / innerWidth - .5); tilt.y = (e.clientY / innerHeight - .5); }, { passive:true });
    }

    var w = 0, h = 0, running = false, last = 0, t0 = performance.now(), frameHooks = [];
    function resize(){
      var r = canvas.getBoundingClientRect();
      if (!r.width || !r.height || (r.width === w && r.height === h)) return;
      w = r.width; h = r.height; renderer.setSize(w, h, false);
      camera.aspect = w / h; camera.updateProjectionMatrix();
    }
    function frame(now){
      if (!running) return;
      requestAnimationFrame(frame);
      var dt = Math.min(.05, (now - (last || now)) / 1000); last = now;
      resize(); if (!w) return;
      var k = reduce ? 1 : 1 - Math.exp(-dt*6);
      if (!drag && !reduce){
        if (Math.abs(vel) > .0005){ view.yaw += vel; vel *= .92; }
        if (spin && now - lastTouch > 3500) view.yaw += dt*.25;
      }
      cur.yaw += (view.yaw - cur.yaw)*k; cur.pitch += (view.pitch - cur.pitch)*k;
      cur.zoom += (view.zoom - cur.zoom)*k; cur.explode += (view.explode - cur.explode)*k;
      curTilt.x += (tilt.x - curTilt.x)*k*.6; curTilt.y += (tilt.y - curTilt.y)*k*.6;

      var e = cur.explode;
      parts.cupL.position.x = -.98 - .55*e; parts.cupR.position.x = .98 + .55*e;
      parts.cushL.position.x = .27 + .42*e; parts.cushR.position.x = -.27 - .42*e;
      parts.head.position.y = .5*e;

      var ip = reduce ? 1 : clamp((now - t0) / 1600, 0, 1), ie = 1 - Math.pow(1 - ip, 3);
      root.rotation.y = cur.yaw + curTilt.x*.7;
      root.rotation.x = cur.pitch + curTilt.y*.25 + (reduce ? 0 : Math.sin(now/2200)*.015);
      root.scale.setScalar(.85 + .15*ie);
      root.position.y = (reduce ? 0 : Math.sin(now/1600)*.025) - (1 - ie)*.3;
      shadow.position.y = root.position.y - 1.36*root.scale.x; shadow.material.opacity = ie; shadow.scale.setScalar(1 + e*.5);

      var fovV = 30*Math.PI/180, fovH = 2*Math.atan(Math.tan(fovV/2)*camera.aspect);
      var R = (1.62 + e*.62) * (o.fill ? 1/o.fill : 1.08);
      var dist = R / Math.sin(Math.min(fovV, fovH)/2) * cur.zoom;
      var off = o.offsetY || 0;
      camera.position.set(0, .35 + off, dist); camera.lookAt(0, off, 0);

      var kc = reduce ? 1 : 1 - Math.exp(-dt*6);
      mats.cup.color.lerp(target.cup, kc); mats.band.color.lerp(target.band, kc); mats.cushion.color.lerp(target.cushion, kc);

      renderer.render(scene, camera);
      for (var i = 0; i < frameHooks.length; i++) frameHooks[i](now);
    }
    function start(){ if (!running){ running = true; last = 0; requestAnimationFrame(frame); } }
    function stop(){ running = false; }
    if ('IntersectionObserver' in window){
      new IntersectionObserver(function(es){ es.forEach(function(en){ en.isIntersecting ? start() : stop(); }); }).observe(canvas);
    } else start();

    var tmpN = new T.Vector3(), tmpC = new T.Vector3();
    return {
      setColors: function(c){
        ['cup','band','cushion'].forEach(function(n){ if (c[n]){ colors[n] = c[n]; target[n] = lin(c[n]); } });
        if (c.cup) drawText();
      },
      setCushion: function(kind){ mats.cushion.roughness = kind === 'leather' ? .48 : .95; },
      setTrim: function(on){ trims.forEach(function(t){ t.visible = !!on; }); },
      setText: function(s){ text = String(s || '').slice(0, 3); drawText(); },
      setExplode: function(v){ view.explode = clamp(v, 0, 1); },
      setYaw: function(v){ view.yaw = v; lastTouch = performance.now(); },
      setSpin: function(on){ spin = !!on; },
      setEnv: function(name){
        if (!ENVS[name]) return;
        envName = name; scene.environment = envTex(name); renderer.toneMappingExposure = ENVS[name].exposure;
      },
      envs: Object.keys(ENVS),
      onFrame: function(fn){ frameHooks.push(fn); },
      project: function(name){
        var a = ANCHORS[name](), p = a[0], n = a[1];
        inner.localToWorld(p);
        tmpN.copy(n).applyQuaternion(root.quaternion);
        tmpC.copy(camera.position).sub(p).normalize();
        var facing = tmpN.dot(tmpC);
        p.project(camera);
        return { x:(p.x*.5 + .5)*w, y:(-p.y*.5 + .5)*h, facing:facing };
      },
      get explode(){ return cur.explode; }
    };
  };
})();

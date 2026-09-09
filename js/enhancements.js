(function(){
  const body = document.body;
  if (!body) return;
  const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Ambient gradient: reacts subtly to pointer and scroll position.
  const ambient = document.createElement('div');
  ambient.className = 'ambient-layer';
  ambient.setAttribute('aria-hidden','true');
  body.prepend(ambient);
  let pointerX = 50;
  const updateAmbient = () => {
    const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const progress = Math.min(1, Math.max(0, window.scrollY / max));
    const y = 18 + progress * 58;
    ambient.style.setProperty('--ambient-x', pointerX + '%');
    ambient.style.setProperty('--ambient-y', y + '%');
  };
  window.addEventListener('pointermove', e => {
    pointerX = Math.max(18, Math.min(82, (e.clientX / Math.max(1,window.innerWidth))*100));
    updateAmbient();
  }, {passive:true});
  window.addEventListener('scroll', updateAmbient, {passive:true});
  updateAmbient();

  // Generic reveal system. Anthropolo already owns a reveal system.
  if (!body.classList.contains('project-anthropolo') && !body.classList.contains('project-dark')) {
    const selectors = [
      '.hero > *', '.project', '.project-hero-grid > *', '.long-section > *',
      '.gullen-rule > *', '.six-rule > *', '.rigged-v2-section > *', '.nw-hero > *', '.nw-section-head', '.nw-project', '.nw-character'
    ];
    const targets = [...document.querySelectorAll(selectors.join(','))]
      .filter((el, i, arr) => arr.indexOf(el) === i);
    targets.forEach((el,i) => {
      el.classList.add('reveal-auto');
      el.style.setProperty('--reveal-delay', Math.min((i%4)*55,165)+'ms');
    });
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            io.unobserve(entry.target);
          }
        });
      }, {threshold:.08, rootMargin:'0px 0px -6% 0px'});
      targets.forEach(el => io.observe(el));
    } else targets.forEach(el => el.classList.add('is-visible'));
  }

  const observeOnce = (elements, className='is-active', threshold=.18) => {
    const list = [...elements];
    if (!list.length) return;
    if (!('IntersectionObserver' in window) || reduced) {
      list.forEach(el => el.classList.add(className));
      return;
    }
    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add(className);
          io.unobserve(entry.target);
        }
      });
    }, {threshold, rootMargin:'0px 0px -7% 0px'});
    list.forEach(el => io.observe(el));
  };

  // Project-specific motion: Khan-Bong — one-shot depth shift + breathing light.
  // The image movement triggers only the first time an image enters view,
  // then freezes in its final position instead of following every scroll.
  if (body.classList.contains('project-dark')) {
    const parallax = [...document.querySelectorAll('.cover-gif,.media-wide img,.media-two img')];
    parallax.forEach((el,i) => {
      el.classList.add('kb-parallax-once');
      el.style.setProperty('--kb-start-y', (i%2===0 ? '26px' : '-18px'));
    });
    document.querySelectorAll('img[src*="lanterns"]').forEach(img => img.classList.add('kb-breathe'));
    observeOnce(parallax,'kb-parallax-settle',.12);
  }

  // Gullen Theatre — editorial color wipes and sliding pink markers.
  if (body.classList.contains('project-gullen')) {
    const wipeTargets = document.querySelectorAll('.gullen-hero-image,.feature-photo,.gullen-gallery img,.interaction-media');
    wipeTargets.forEach((el,i)=>{
      const wrap = el.matches('img') ? el.parentElement : el;
      if (!wrap) return;
      wrap.classList.add('gullen-wipe');
      wrap.style.setProperty('--wipe-delay', ((i%3)*70)+'ms');
    });
    observeOnce(document.querySelectorAll('.gullen-wipe'),'wipe-on',.12);
    document.querySelectorAll('.gullen-section-label,.act-no').forEach((el,i)=>{
      el.classList.add('gullen-label-motion');
      el.style.setProperty('--label-delay',((i%4)*55)+'ms');
    });
    observeOnce(document.querySelectorAll('.gullen-label-motion'),'label-on',.15);
  }

  // 6 Mornings — blur to clarity + staggered memory panels.
  if (body.classList.contains('project-six')) {
    const memoryImgs = document.querySelectorAll('.six-door img,.six-diagram img,.six-curve-block img,.six-triptych img');
    memoryImgs.forEach((el,i)=>{
      el.classList.add('six-memory-reveal');
      el.style.setProperty('--memory-delay',((i%3)*110)+'ms');
    });
    observeOnce(memoryImgs,'memory-clear',.12);
    document.querySelectorAll('.six-triptych').forEach(group=>{
      [...group.children].forEach((fig,i)=>{
        fig.classList.add('six-memory-offset');
        fig.style.setProperty('--memory-x', ((i-1)*14)+'px');
      });
    });
    observeOnce(document.querySelectorAll('.six-memory-offset'),'memory-settle',.12);
  }

  // Rigged Champion — collage follows pointer, labels pop, panels gain playful momentum.
  if (body.classList.contains('project-rigged')) {
    const hero = document.querySelector('.rigged-v2-hero-collage');
    const inset = hero && hero.querySelector('.hero-inset');
    const stamp = hero && hero.querySelector('.hero-stamp');
    if (hero && !reduced) {
      hero.addEventListener('pointermove', e => {
        const r=hero.getBoundingClientRect();
        const nx=((e.clientX-r.left)/r.width-.5);
        const ny=((e.clientY-r.top)/r.height-.5);
        if(inset) inset.style.setProperty('--rigged-shift', `${(nx*10).toFixed(1)}px, ${(ny*7).toFixed(1)}px`);
        if(stamp) stamp.style.setProperty('--rigged-stamp-shift', `${(-nx*7).toFixed(1)}px, ${(-ny*5).toFixed(1)}px`);
      },{passive:true});
      hero.addEventListener('pointerleave',()=>{
        if(inset) inset.style.setProperty('--rigged-shift','0px, 0px');
        if(stamp) stamp.style.setProperty('--rigged-stamp-shift','0px, 0px');
      });
    }
    const pops=document.querySelectorAll('.rigged-v2-tag,.goal-banner,.compare-label,.rigged-v2-stat-grid .stat-card>span,.action-copy>span');
    pops.forEach((el,i)=>{el.classList.add('rigged-pop');el.style.setProperty('--pop-delay',((i%5)*55)+'ms')});
    observeOnce(pops,'pop-on',.18);


    // Juicy one-shot shake: cards burst with energy the first time they enter
    // the viewport, then remain completely stable afterwards.
    const juicy = [...document.querySelectorAll(
      '.rigged-v2-hero-collage .hero-main,.rigged-v2-hero-collage .hero-inset,.rigged-v2-hero-collage .hero-stamp,'+
      '.rigged-v2-compare article,.rigged-v2-stat-grid .stat-card,.action-panel'
    )];
    juicy.forEach((el,i)=>{
      el.classList.add('rigged-juice');
      el.style.setProperty('--juice-delay', ((i%4)*85)+'ms');
    });
    if (reduced) {
      juicy.forEach(el=>el.classList.add('juice-once-done'));
    } else if ('IntersectionObserver' in window) {
      const juiceObserver = new IntersectionObserver((entries,obs)=>{
        entries.forEach(entry=>{
          if(!entry.isIntersecting || entry.target.dataset.juiced==='1') return;
          const el=entry.target;
          el.dataset.juiced='1';
          el.classList.add('juice-once');
          const done=()=>{
            el.classList.remove('juice-once');
            el.classList.add('juice-once-done');
            el.removeEventListener('animationend',done);
          };
          el.addEventListener('animationend',done);
          obs.unobserve(el);
        });
      },{threshold:.08,rootMargin:'0px 0px -5% 0px'});
      juicy.forEach(el=>juiceObserver.observe(el));
    } else {
      juicy.forEach(el=>{
        el.dataset.juiced='1';
        el.classList.add('juice-once');
      });
    }
  }

  // Anthropolo keeps its original reveal system. Only the hero gets a
  // lightweight forest parallax and a separate fog layer, so Part 3/4
  // visibility is never tied to these effects.
  if (body.classList.contains('project-anthropolo')) {
    const hero = document.querySelector('.hero');
    if (hero) {
      const fog = document.createElement('div');
      fog.className = 'anthro-fog-layer';
      fog.setAttribute('aria-hidden','true');
      hero.appendChild(fog);

      if (!reduced) {
        let ticking = false;
        const updateForest = () => {
          ticking = false;
          const r = hero.getBoundingClientRect();
          if (r.bottom < 0 || r.top > window.innerHeight) return;
          const traveled = Math.min(window.innerHeight * 1.25, Math.max(0, -r.top));
          hero.style.setProperty('--forest-y', (traveled * 0.055).toFixed(1) + 'px');
        };
        const requestForestUpdate = () => {
          if (ticking) return;
          ticking = true;
          requestAnimationFrame(updateForest);
        };
        window.addEventListener('scroll', requestForestUpdate, {passive:true});
        window.addEventListener('resize', requestForestUpdate, {passive:true});
        updateForest();
      }
    }
  }

  // Responsive nav without changing the visual identity of each project.
  const navShell = body.classList.contains('project-anthropolo')
    ? document.querySelector('.top-nav')
    : document.querySelector('.site-header');
  const navInner = body.classList.contains('project-anthropolo')
    ? document.querySelector('.top-nav-inner')
    : document.querySelector('.nav');
  const links = navShell && navShell.querySelector('.nav-links');
  if (navShell && navInner && links) {
    const button = document.createElement('button');
    button.className = 'mobile-nav-toggle';
    button.type = 'button';
    button.setAttribute('aria-label','打开或关闭导航');
    button.setAttribute('aria-expanded','false');
    button.innerHTML = '<span></span><span></span><span></span>';
    navInner.insertBefore(button, links);
    const close = () => {navShell.classList.remove('nav-open');button.setAttribute('aria-expanded','false')};
    button.addEventListener('click', () => {
      const open = !navShell.classList.contains('nav-open');
      navShell.classList.toggle('nav-open', open);
      button.setAttribute('aria-expanded', open?'true':'false');
    });
    links.querySelectorAll('a,button').forEach(a => a.addEventListener('click', close));
    window.addEventListener('resize', () => {if (window.innerWidth > 1080) close()}, {passive:true});
  }
})();

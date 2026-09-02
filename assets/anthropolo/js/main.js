document.addEventListener("DOMContentLoaded", function () {
  const body = document.body;
  const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Opening fog is CSS-driven. Remove the state class after it completes so
  // the page settles into its normal state. Content remains usable if JS fails.
  if (body.classList.contains('anthro-opening')) {
    window.setTimeout(() => body.classList.remove('anthro-opening'), reduced ? 0 : 2700);
  }

  // Part 1 / Part 2 keep the original small reveal treatment.
  const items = [...document.querySelectorAll("#top .reveal, #overview .reveal")];
  const show = (el) => el.classList.add("is-visible");
  const revealInViewport = () => {
    const vh = window.innerHeight || document.documentElement.clientHeight;
    items.forEach(el => {
      if (el.classList.contains("is-visible")) return;
      const r = el.getBoundingClientRect();
      if (r.top < vh * 0.97 && r.bottom > 0) show(el);
    });
  };

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          show(entry.target);
          obs.unobserve(entry.target);
        }
      });
    }, {threshold:0, rootMargin:"0px 0px -4% 0px"});
    items.forEach(el => observer.observe(el));
  } else {
    items.forEach(show);
  }
  revealInViewport();

  // Section-level scroll unlocking. Baseline HTML is visible; we only add the
  // gated class when JS is alive, so a script/observer failure can never make
  // Part 3 or Part 4 disappear permanently.
  const sections = [...document.querySelectorAll('#overview > .wrap, #journey > .wrap, #iteration > .wrap')];
  if (!reduced && sections.length) {
    sections.forEach(el => el.classList.add('anthro-section-gated'));
    const unlock = (el) => {
      el.classList.add('is-unlocked');
      el.classList.remove('anthro-section-gated');
    };
    const unlockInViewport = () => {
      const vh = window.innerHeight || document.documentElement.clientHeight;
      sections.forEach(el => {
        if (el.classList.contains('is-unlocked')) return;
        const r = el.getBoundingClientRect();
        if (r.top < vh * .88 && r.bottom > 0) unlock(el);
      });
    };
    if ('IntersectionObserver' in window) {
      const sectionObserver = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            unlock(entry.target);
            obs.unobserve(entry.target);
          }
        });
      }, {threshold:0, rootMargin:'0px 0px -10% 0px'});
      sections.forEach(el => sectionObserver.observe(el));
    }
    unlockInViewport();
    let ticking=false;
    const check=()=>{
      if(ticking) return;
      ticking=true;
      requestAnimationFrame(()=>{ticking=false;revealInViewport();unlockInViewport();});
    };
    window.addEventListener('scroll',check,{passive:true});
    window.addEventListener('resize',check,{passive:true});
  }
});

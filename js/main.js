(function(){
 const body=document.body;
 const buttons=[...document.querySelectorAll('[data-set-lang]')];
 function setLang(lang){
   body.classList.toggle('lang-zh',lang==='zh');
   body.classList.toggle('lang-en',lang==='en');
   document.documentElement.lang=lang==='zh'?'zh-CN':'en';
   localStorage.setItem('portfolio-lang',lang);
   buttons.forEach(b=>b.classList.toggle('active',b.dataset.setLang===lang));
 }
 const stored=localStorage.getItem('portfolio-lang');
 setLang(stored==='en'?'en':'zh');
 buttons.forEach(b=>b.addEventListener('click',()=>setLang(b.dataset.setLang)));
})();

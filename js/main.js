document.documentElement.classList.add('js');
document.addEventListener('DOMContentLoaded',()=>{
  const els=document.querySelectorAll('.reveal');
  if(!('IntersectionObserver' in window)){els.forEach(el=>el.classList.add('in'))}
  else{const obs=new IntersectionObserver(entries=>{entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');obs.unobserve(e.target)}})},{threshold:.12,rootMargin:'0px 0px -6% 0px'});els.forEach(el=>obs.observe(el))}

  const navWrap=document.querySelector('nav.wrap'),navToggle=document.querySelector('.nav-toggle');
  const setMenu=open=>{if(!(navWrap instanceof HTMLElement)||!(navToggle instanceof HTMLButtonElement))return;navWrap.classList.toggle('nav-open',open);navToggle.setAttribute('aria-expanded',String(open));navToggle.setAttribute('aria-label',open?'Fechar menu':'Abrir menu')};
  if(navWrap instanceof HTMLElement&&navToggle instanceof HTMLButtonElement){
    navToggle.addEventListener('click',()=>setMenu(!navWrap.classList.contains('nav-open')));
    document.addEventListener('keydown',e=>{if(e.key==='Escape')setMenu(false)});
    window.addEventListener('resize',()=>{if(window.innerWidth>780)setMenu(false)});
    navWrap.querySelectorAll('.nav-links a').forEach(a=>a.addEventListener('click',()=>setMenu(false)));
  }

  const reducedMQ=window.matchMedia('(prefers-reduced-motion: reduce)'),isReduced=()=>reducedMQ.matches===true;
  const headerElSmooth=document.querySelector('header'),getHeaderOffset=()=>headerElSmooth instanceof HTMLElement?headerElSmooth.offsetHeight+14:92;
  const easeInOutSine=t=>-(Math.cos(Math.PI*t)-1)/2;
  let scrollRaf=0,wheelTarget=null,wheelRaf=0;
  const getMaxScroll=()=>Math.max(document.documentElement.scrollHeight-window.innerHeight,0);
  const clampScroll=y=>Math.min(Math.max(y,0),getMaxScroll());

  function stopWheelSmooth(){cancelAnimationFrame(wheelRaf);wheelRaf=0;wheelTarget=null}
  function smoothScrollTo(targetY){
    cancelAnimationFrame(scrollRaf);stopWheelSmooth();
    const startY=window.scrollY||window.pageYOffset,distance=targetY-startY;
    if(Math.abs(distance)<4){window.scrollTo(0,targetY);return 0}
    const adjusted=isReduced()?600:Math.min(1500,Math.max(1000,1000+(Math.abs(distance)/1600)*500));
    const startTime=performance.now();
    const step=now=>{const elapsed=now-startTime,progress=Math.min(elapsed/adjusted,1);window.scrollTo(0,startY+distance*easeInOutSine(progress));if(progress<1){scrollRaf=requestAnimationFrame(step)}else{scrollRaf=0;wheelTarget=null}};
    scrollRaf=requestAnimationFrame(step);return adjusted;
  }
  function wheelLoop(){const current=window.scrollY||window.pageYOffset,diff=wheelTarget-current;if(Math.abs(diff)<.5){window.scrollTo(0,wheelTarget);stopWheelSmooth();return}window.scrollTo(0,current+diff*.14);wheelRaf=requestAnimationFrame(wheelLoop)}

  if(!isReduced()){
    window.addEventListener('wheel',e=>{
      if(e.ctrlKey||(e.deltaY===0&&e.deltaX!==0))return;
      if(e.target instanceof Element&&e.target.closest('textarea, select'))return;
      if(getMaxScroll()<=0)return;e.preventDefault();cancelAnimationFrame(scrollRaf);
      let d=e.deltaY;if(e.deltaMode===1)d*=33;else if(e.deltaMode===2)d*=window.innerHeight;
      const base=wheelTarget===null?(window.scrollY||window.pageYOffset):wheelTarget;
      wheelTarget=clampScroll(base+d);if(!wheelRaf)wheelRaf=requestAnimationFrame(wheelLoop);
    },{passive:false});
    window.addEventListener('touchmove',()=>{cancelAnimationFrame(scrollRaf);stopWheelSmooth()},{passive:true});
  }

  document.querySelectorAll('a[href^="#"]').forEach(link=>{
    link.addEventListener('click',ev=>{
      const href=link.getAttribute('href');if(!href||href==='#')return;
      let target=null;try{target=document.querySelector(href)}catch(e){return}
      if(!(target instanceof HTMLElement))return;ev.preventDefault();setMenu(false);
      target.classList.add('in');target.querySelectorAll('.reveal').forEach(el=>el.classList.add('in'));
      const top=Math.max(target.getBoundingClientRect().top+window.scrollY-getHeaderOffset(),0);
      smoothScrollTo(top);try{history.replaceState(null,'',href)}catch(e){}
    });
  });

  const headerEl=document.querySelector('header');let ticking=false;
  const onScroll=()=>{if(headerEl instanceof HTMLElement)headerEl.classList.toggle('is-scrolled',window.scrollY>12);ticking=false};
  window.addEventListener('scroll',()=>{if(!ticking){ticking=true;requestAnimationFrame(onScroll)}},{passive:true});
  onScroll();

  const placeholder=label=>'data:image/svg+xml,'+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600"><rect width="100%" height="100%" fill="#2a2622"/><text x="50%" y="50%" fill="#a99e8c" font-family="sans-serif" font-size="22" text-anchor="middle">${label}</text></svg>`);
  document.querySelectorAll('img').forEach(img=>{
    img.addEventListener('error',()=>{if(img.dataset.fallbackApplied)return;img.dataset.fallbackApplied='1';img.classList.add('img-fallback');img.src=placeholder(img.alt?img.alt.slice(0,24):'imagem')},{once:true});
    if(img.complete&&img.naturalWidth===0&&img.src)img.dispatchEvent(new Event('error'));
  });

  const form=document.getElementById('booking-form'),msg=document.getElementById('form-msg');
  if(form instanceof HTMLFormElement){
    form.setAttribute('novalidate','novalidate');
    const numeroEstudio='5581984455351';
    const nomeInput=document.getElementById('nome'),whatsappInput=document.getElementById('whatsapp');
    const estiloSelect=document.getElementById('estilo'),tamanhoSelect=document.getElementById('tamanho');
    const localInput=document.getElementById('local'),mensagemInput=document.getElementById('mensagem'),lgpdInput=document.getElementById('lgpd');
    const setMsg=text=>{if(msg instanceof HTMLElement)msg.textContent=text};
    const markInvalid=(el,invalid)=>{if(el instanceof HTMLInputElement||el instanceof HTMLTextAreaElement||el instanceof HTMLSelectElement){if(invalid)el.setAttribute('aria-invalid','true');else el.removeAttribute('aria-invalid')}};

    if(whatsappInput instanceof HTMLInputElement){
      whatsappInput.addEventListener('input',()=>{
        markInvalid(whatsappInput,false);
        let d=whatsappInput.value.replace(/\D/g,'').slice(0,11);
        if(d.length>2){let out='('+d.slice(0,2)+') ';const rest=d.slice(2);if(rest.length>5)out+=rest.slice(0,5)+'-'+rest.slice(5);else out+=rest;whatsappInput.value=out}else whatsappInput.value=d;
      });
    }
    if(nomeInput instanceof HTMLElement)nomeInput.addEventListener('input',()=>markInvalid(nomeInput,false));

    form.addEventListener('submit',ev=>{
      ev.preventDefault();
      const nome=nomeInput instanceof HTMLInputElement?nomeInput.value.trim():'';
      const whatsapp=whatsappInput instanceof HTMLInputElement?whatsappInput.value.trim():'';
      const estilo=estiloSelect instanceof HTMLSelectElement?estiloSelect.selectedOptions[0].textContent.trim():'';
      const tamanho=tamanhoSelect instanceof HTMLSelectElement?tamanhoSelect.value:'';
      const local=localInput instanceof HTMLInputElement?localInput.value.trim():'';
      const mensagem=mensagemInput instanceof HTMLTextAreaElement?mensagemInput.value.trim():'';
      const lgpdOk=!(lgpdInput instanceof HTMLInputElement)||lgpdInput.checked;
      const digitos=whatsapp.replace(/\D/g,''),nomeOk=nome.length>=2,zapOk=digitos.length>=10;
      markInvalid(nomeInput,!nomeOk);markInvalid(whatsappInput,!zapOk);
      if(!nomeOk||!zapOk){setMsg(!nomeOk?'Confira o nome (mínimo 2 letras) para enviarmos o orçamento.':'Confira o WhatsApp com DDD (ex: (81) 98445-5351).');(!nomeOk?nomeInput:whatsappInput).focus();return}
      if(!lgpdOk){setMsg('Marque a autorização de contato (LGPD) para continuar.');lgpdInput.focus();return}
      const texto=`Olá! Sou ${nome} (${whatsapp}). Quero uma tattoo ${estilo}${tamanho?' · '+tamanho:''}${local?' em '+local:''}.${mensagem?' Ideia: '+mensagem:''}`;
      setMsg('Pedido pronto! Abrindo o WhatsApp…');
      window.open(`https://wa.me/${numeroEstudio}?text=${encodeURIComponent(texto)}`,'_blank','noopener');
    });
  }

  const lightbox=document.getElementById('lightbox');
  if(lightbox){
    const lbImg=lightbox.querySelector('img');
    document.querySelectorAll('.flash-item img, .stamp-card img, .artist img').forEach(img=>{
      img.style.cursor='zoom-in';
      img.addEventListener('click',()=>{
        lbImg.src=img.src;lbImg.alt=img.alt;
        lightbox.classList.add('open');
        lightbox.setAttribute('aria-hidden','false');
        document.body.style.overflow='hidden';
      });
    });
    const closeLightbox=()=>{
      lightbox.classList.remove('open');
      lightbox.setAttribute('aria-hidden','true');
      document.body.style.overflow='';
    };
    lightbox.addEventListener('click',e=>{if(e.target===lightbox||e.target===lbImg)closeLightbox()});
    document.addEventListener('keydown',e=>{if(e.key==='Escape'&&lightbox.classList.contains('open'))closeLightbox()});
  }
});

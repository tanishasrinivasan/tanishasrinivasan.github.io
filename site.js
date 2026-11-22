{
const still=matchMedia('(prefers-reduced-motion: reduce)').matches;

/* Los Angeles clock in the footer */
const clk=document.getElementById('clock');
if(clk){const f=new Intl.DateTimeFormat('en-US',{hour:'numeric',minute:'2-digit',timeZone:'America/Los_Angeles'});
  const tick=()=>{clk.textContent=f.format(new Date())};tick();setInterval(tick,15000)}

/* glow drifts a little with the cursor */
const glow=document.querySelector('.glow');
if(glow&&!still){const s=[...glow.children];
  addEventListener('pointermove',e=>{const x=e.clientX/innerWidth-.5,y=e.clientY/innerHeight-.5;
    s.forEach((el,i)=>{const k=(i+1)*14;el.style.transform=`translate(${x*k}px,${y*k}px)`})},{passive:true})}

/* tremor wave: shakes inside the filter box, calm outside it */
document.querySelectorAll('.wave path').forEach(p=>{
  const draw=t=>{let d='';for(let x=10;x<=410;x+=3){const inB=x>140&&x<280;const env=inB?Math.sin((x-140)/140*Math.PI):0;
      const y=130-Math.sin(x/11+t*3)*(inB?62*env:6)*(inB?1:1);d+=(x===10?'M':'L')+x+' '+y.toFixed(1)+' '}p.setAttribute('d',d)};
  draw(0);if(still)return;
  let on=false;const io=new IntersectionObserver(es=>{on=es[0].isIntersecting});io.observe(p);
  const loop=t=>{if(on)draw(t/1000);requestAnimationFrame(loop)};requestAnimationFrame(loop);
});

/* carousels: dots, arrows, swipe */
document.querySelectorAll('.car').forEach(car=>{
  const track=car.querySelector('.track');const slides=[...track.children];
  if(slides.length<2)return;
  const go=i=>track.scrollTo({left:i*track.clientWidth,behavior:still?'auto':'smooth'});
  const dots=document.createElement('div');dots.className='dots';
  slides.forEach((_,i)=>{const b=document.createElement('button');b.type='button';b.setAttribute('aria-label','Image '+(i+1));b.onclick=()=>go(i);dots.appendChild(b)});
  car.appendChild(dots);
  ['prev','next'].forEach(k=>{const b=document.createElement('button');b.type='button';b.className='arrow '+k;b.textContent=k==='prev'?'←':'→';
    b.setAttribute('aria-label',k==='prev'?'Previous image':'Next image');
    b.onclick=()=>{const i=Math.round(track.scrollLeft/track.clientWidth);go(Math.max(0,Math.min(slides.length-1,i+(k==='prev'?-1:1))))};car.appendChild(b)});
  const mark=()=>{const i=Math.round(track.scrollLeft/Math.max(1,track.clientWidth));[...dots.children].forEach((d,j)=>d.classList.toggle('on',j===i))};
  track.addEventListener('scroll',()=>requestAnimationFrame(mark),{passive:true});mark();
});

/* drawing pad */
const cv=document.getElementById('pad');
if(cv){
  const ctx=cv.getContext('2d');let color='#1c1b1a',drawing=false;const strokes=[];let cur=null;
  const line=s=>{ctx.strokeStyle=s.c;ctx.lineWidth=s.w;ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();s.p.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));if(s.p.length===1)ctx.lineTo(s.p[0][0]+.1,s.p[0][1]);ctx.stroke()};
  const redraw=()=>{ctx.clearRect(0,0,cv.width,cv.height);strokes.forEach(line)};
  const fit=()=>{const r=cv.getBoundingClientRect(),dpr=Math.min(2,devicePixelRatio||1);cv.width=r.width*dpr;cv.height=r.height*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);redraw()};
  const pos=e=>{const r=cv.getBoundingClientRect();return[e.clientX-r.left,e.clientY-r.top]};
  cv.addEventListener('pointerdown',e=>{drawing=true;cv.setPointerCapture(e.pointerId);cur={c:color,w:4,p:[pos(e)]};strokes.push(cur);line(cur)});
  cv.addEventListener('pointermove',e=>{if(!drawing)return;cur.p.push(pos(e));const n=cur.p.length;ctx.strokeStyle=cur.c;ctx.lineWidth=cur.w;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(...cur.p[n-2]);ctx.lineTo(...cur.p[n-1]);ctx.stroke()});
  const end=()=>{drawing=false};cv.addEventListener('pointerup',end);cv.addEventListener('pointercancel',end);
  document.querySelectorAll('.sw').forEach(b=>b.addEventListener('click',()=>{color=b.dataset.c;document.querySelectorAll('.sw').forEach(x=>x.classList.toggle('on',x===b))}));
  document.getElementById('undo').onclick=()=>{strokes.pop();redraw()};
  document.getElementById('clear').onclick=()=>{strokes.length=0;redraw()};
  document.getElementById('save').onclick=()=>{try{const a=document.createElement('a');a.download='doodle-for-tanisha.png';a.href=cv.toDataURL('image/png');a.click()}catch(e){}};
  new ResizeObserver(fit).observe(cv);
}
}

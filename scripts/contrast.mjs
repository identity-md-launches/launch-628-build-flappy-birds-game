// Runs inside a browser page. Includes the actual canvas pixels behind onboarding text.
export function measureContrast() {
  const rgb = s => (s.match(/[\d.]+/g) || []).map(Number);
  const luminance = a => a.slice(0, 3).map(v => { v /= 255; return v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; }).reduce((s,v,i) => s + v * [.2126,.7152,.0722][i], 0);
  const ratio = (a,b) => { const x=luminance(a), y=luminance(b); return (Math.max(x,y)+.05)/(Math.min(x,y)+.05); };
  return ['h1','.intro-copy','.board-heading p','.primary-button','input','.field-hint','.panel-copy','.panel-kicker','#username-form label','.field-error'].filter(sel=>document.querySelector(sel)?.textContent || sel==='input').map(selector=>{
    const el=document.querySelector(selector),style=getComputedStyle(el),foreground=rgb(style.color);
    let background,contrast;
    const ownBackground=rgb(style.backgroundColor);
    if (el.closest('#username-form') && !['BUTTON','INPUT'].includes(el.tagName) && ownBackground[3]===0) {
      const stage=document.querySelector('#stage'),canvas=document.querySelector('canvas'),context=canvas.getContext('2d');
      const box=el.getBoundingClientRect(),sr=stage.getBoundingClientRect(),overlay=rgb(getComputedStyle(document.querySelector('#overlay')).backgroundColor);
      contrast=99;
      for(let x=Math.max(0,Math.floor(box.left-sr.left));x<Math.min(sr.width,box.right-sr.left);x+=2)for(let y=Math.max(0,Math.floor(box.top-sr.top));y<Math.min(sr.height,box.bottom-sr.top);y+=2){
        let color=[...context.getImageData(Math.floor(x*canvas.width/sr.width),Math.floor(y*canvas.height/sr.height),1,1).data].slice(0,3);
        if(overlay[3])color=color.map((v,i)=>v*(1-overlay[3])+overlay[i]*overlay[3]);
        const r=ratio(foreground,color);if(r<contrast){contrast=r;background=color;}
      }
    } else {
      let node=el;
      while(node){const col=rgb(getComputedStyle(node).backgroundColor);if(col.length===3||col[3]===1){background=col;break}node=node.parentElement;}
      contrast=ratio(foreground,background);
    }
    return {selector,foreground,background,contrast:Number(contrast.toFixed(2))};
  });
}

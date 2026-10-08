(function(root){
 'use strict';
 const keys=['vehicles','speed','density','occupancy'];
 const labels=['Low','Moderate','High','Severe'];
 const limits=[600,100,200,100];
 const prototypes=[[75,60,15,12],[180,42,45,35],[340,24,90,65],[510,8,150,90]];
 const roads=['Central Junction','Station Road','Market Road'];
 const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
 function rng(seed=42){return()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
 const dist=(a,b)=>a.reduce((s,x,j)=>s+(x-b[j])**2,0);
 function validate(x){keys.forEach((k,j)=>{if(typeof x[k]!=='number'||!Number.isFinite(x[k])||x[k]<0||x[k]>limits[j])throw Error(k+' must be between 0 and '+limits[j]+'.');});if(!Number.isInteger(x.vehicles))throw Error('Vehicle count must be a whole number.');return x;}
 function synthetic(){const random=rng(314);const data=[];for(let day=0;day<7;day++)for(let minute=0;minute<1440;minute+=15)roads.forEach((location,r)=>{
  const h=minute/60;let s=.08+2.2*Math.exp(-(((h-9)/1.9)**2))+2.6*Math.exp(-(((h-18)/2.1)**2))+[.1,-.15,.35][r]+(random()-.5)*.7-(day>=5?.4:0);s=clamp(s,0,3);
  const lo=Math.floor(s),hi=Math.min(3,lo+1),f=s-lo;let vals=prototypes[lo].map((v,j)=>clamp(v*(1-f)+prototypes[hi][j]*f+(random()-.5)*[42,8,12,10][j],0,limits[j]));
  data.push({location,time:String(Math.floor(minute/60)).padStart(2,'0')+':'+String(minute%60).padStart(2,'0'),...Object.fromEntries(keys.map((k,j)=>[k,Math.round(vals[j]*10)/10])),vehicles:Math.round(vals[0])});
 });return data;}
 function fit(rows){if(rows.length<40||rows.length>5000)throw Error('Use 40–5,000 data rows.');rows.forEach(validate);const n=rows.length;
  const mean=keys.map(k=>rows.reduce((s,r)=>s+r[k],0)/n),std=keys.map((k,j)=>Math.sqrt(rows.reduce((s,r)=>s+(r[k]-mean[j])**2,0)/n)||1);
  const X=rows.map(r=>keys.map((k,j)=>(r[k]-mean[j])/std[j]));if(new Set(X.map(x=>JSON.stringify(x))).size<4)throw Error('At least four distinct observations are needed.');
  let best;
  for(let run=0;run<5;run++){
   const random=rng(42+run),centers=[X[Math.floor(random()*n)].slice()];
   while(centers.length<4){const ds=X.map(x=>Math.min(...centers.map(c=>dist(x,c)))),sum=ds.reduce((a,b)=>a+b,0);let t=random()*sum,index=n-1;for(let i=0;i<n;i++){t-=ds[i];if(t<=0){index=i;break;}}centers.push(X[index].slice());}
   let assignment=[],iterations=0;
   for(;iterations<100;iterations++){
    assignment=X.map(x=>centers.reduce((a,c,j)=>dist(x,c)<dist(x,centers[a])?j:a,0));
    const counts=[0,0,0,0],sums=Array.from({length:4},()=>[0,0,0,0]);X.forEach((x,i)=>{counts[assignment[i]]++;x.forEach((v,j)=>sums[assignment[i]][j]+=v);});
    let movement=0;for(let c=0;c<4;c++){const next=counts[c]?sums[c].map(v=>v/counts[c]):X[Math.floor(random()*n)].slice();movement+=dist(next,centers[c]);centers[c]=next;}if(movement<1e-8){iterations++;break;}
   }
   assignment=X.map(x=>centers.reduce((a,c,j)=>dist(x,c)<dist(x,centers[a])?j:a,0));const inertia=X.reduce((s,x,i)=>s+dist(x,centers[assignment[i]]),0);
   if(!best||inertia<best.inertia)best={centers,assignment,inertia,iterations};
  }
  const counts=best.centers.map((_,c)=>best.assignment.filter(a=>a===c).length);if(counts.some(c=>!c))throw Error('Could not form four populated clusters. Use more varied observations.');
  const order=best.centers.map((c,i)=>({i,score:c[0]-c[1]+c[2]+c[3]})).sort((a,b)=>a.score-b.score).map(c=>c.i);
  const quantiles=best.centers.map((c,i)=>{const ds=X.filter((_,j)=>best.assignment[j]===i).map(x=>Math.sqrt(dist(x,c))).sort((a,b)=>a-b);return Math.max(.5,ds[Math.floor((ds.length-1)*.975)]);});
  // Sampled silhouette in scaled four-dimensional feature space; not classification accuracy.
  const ids=Array.from({length:Math.min(160,n)},(_,i)=>Math.floor(i*n/Math.min(160,n)));
  let silhouette=0;for(const i of ids){const groups=[[],[],[],[]];for(const j of ids)if(i!==j)groups[best.assignment[j]].push(Math.sqrt(dist(X[i],X[j])));const own=groups[best.assignment[i]];if(!own.length)continue;const a=own.reduce((s,v)=>s+v,0)/own.length;const b=Math.min(...groups.filter((g,k)=>k!==best.assignment[i]&&g.length).map(g=>g.reduce((s,v)=>s+v,0)/g.length));silhouette+=Number.isFinite(b)?(b-a)/Math.max(a,b,1e-9):0;}
  return {...best,rows,mean,std,order,quantiles,counts,silhouette:silhouette/ids.length,rawCenters:best.centers.map(c=>c.map((v,j)=>v*std[j]+mean[j]))};
 }
 function predict(model,input){validate(input);const z=keys.map((k,j)=>(input[k]-model.mean[j])/model.std[j]);const distances=model.centers.map(c=>Math.sqrt(dist(z,c)));const cluster=distances.indexOf(Math.min(...distances));const rank=model.order.indexOf(cluster);return {cluster,rank,label:labels[rank],distance:distances[cluster],unusual:distances[cluster]>model.quantiles[cluster],distances};}
 function minuteOf(time){if(!/^\d{2}:\d{2}$/.test(time))throw Error('Time must use HH:mm.');const [h,m]=time.split(':').map(Number);if(h>23||m>59)throw Error('Time must use a valid 24-hour clock.');return h*60+m;}
 function baseline(rows,location,minute){const candidates=rows.filter(r=>r.location===location).map(r=>{const d=Math.abs(minuteOf(r.time)-minute);return {r,d:Math.min(d,1440-d)};}).filter(v=>v.d<=30);if(candidates.length<2)return null;return Object.fromEntries(keys.map(k=>[k,candidates.reduce((s,v)=>s+v.r[k]/(1+v.d),0)/candidates.reduce((s,v)=>s+1/(1+v.d),0)]));}
 function forecast(model,input,location,time,horizon){const minute=minuteOf(time);if(![15,30,60].includes(horizon))throw Error('Choose 15, 30 or 60 minutes.');const now=baseline(model.rows,location,minute),later=baseline(model.rows,location,(minute+horizon)%1440);if(!now||!later)return null;const projected=Object.fromEntries(keys.map((k,j)=>[k,clamp(input[k]+later[k]-now[k],0,limits[j])]));projected.vehicles=Math.round(projected.vehicles);return {...predict(model,projected),input:projected,time:String(Math.floor(((minute+horizon)%1440)/60)).padStart(2,'0')+':'+String((minute+horizon)%60).padStart(2,'0')};}
 function parseCSV(text){text=text.replace(/^\uFEFF/,'');const lines=[];let row=[],cell='',quoted=false;for(let i=0;i<text.length;i++){const ch=text[i];if(ch==='"'){if(quoted&&text[i+1]==='"'){cell+='"';i++;}else quoted=!quoted;}else if(ch===','&&!quoted){row.push(cell);cell='';}else if((ch==='\n'||ch==='\r')&&!quoted){if(ch==='\r'&&text[i+1]==='\n')i++;row.push(cell);if(row.some(v=>v.trim()))lines.push(row);row=[];cell='';}else cell+=ch;}if(quoted)throw Error('CSV contains an unclosed quote.');row.push(cell);if(row.some(v=>v.trim()))lines.push(row);const header=lines.shift()?.map(x=>x.trim().toLowerCase())||[];const required=['location','time',...keys];if(required.some(k=>!header.includes(k)))throw Error('CSV needs columns: '+required.join(', '));if(new Set(header).size!==header.length)throw Error('CSV has duplicate column names.');return lines.map((line,i)=>{if(line.length!==header.length)throw Error('Row '+(i+2)+': column count does not match.');const r=Object.fromEntries(header.map((k,j)=>[k,line[j].trim()]));try{if(!r.location||r.location.length>80)throw Error('Location must contain 1–80 characters.');minuteOf(r.time);keys.forEach(k=>{if(r[k]==='')throw Error(k+' is missing.');r[k]=Number(r[k]);});validate(r);}catch(e){throw Error('Row '+(i+2)+': '+e.message);}return r;});}
 function toCSV(rows){const quote=v=>'"'+String(v).replace(/"/g,'""')+'"';return ['location,time,'+keys.join(','),...rows.map(r=>[r.location,r.time,...keys.map(k=>r[k])].map(quote).join(','))].join('\r\n');}
 const api={keys,labels,limits,prototypes,roads,synthetic,fit,predict,forecast,parseCSV,toCSV,baseline,minuteOf};
 if(typeof module!=='undefined')module.exports=api;root.TrafficModel=api;
})(typeof globalThis!=='undefined'?globalThis:this);

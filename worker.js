const TIDE_URL = "https://www.tide-forecast.com/locations/Reykjavik-Iceland/tides/latest";
const NAUTHOLSVIK_URL = "https://nautholsvik.is/";

const html = `<!doctype html><html lang="is"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Sjósund Nauthólsvík</title>
<style>
:root{font-family:system-ui,-apple-system,Segoe UI,sans-serif;color:#f7fcff}
body{margin:0;min-height:100vh;background:radial-gradient(circle at 20% 0%,rgba(116,240,255,.35),transparent 34%),linear-gradient(180deg,#0a425a,#050f1b)}
.app{max-width:470px;margin:auto;padding:22px 16px 34px}.title{font-size:34px;line-height:1;font-weight:950;background:linear-gradient(90deg,#fff,#74f0ff,#ffd45e);-webkit-background-clip:text;color:transparent}
.sub{color:#b5ccd7;margin-top:6px}.card{margin-top:26px;border:1px solid rgba(255,255,255,.18);border-radius:32px;padding:18px;background:linear-gradient(135deg,rgba(53,201,255,.22),rgba(255,111,177,.12) 45%,rgba(255,212,94,.10));box-shadow:0 20px 40px rgba(0,0,0,.28)}
.toprow{display:flex;justify-content:space-between;gap:14px}.label{font-size:13px;color:#d8eef6;font-weight:750}.big{font-size:56px;font-weight:950;letter-spacing:-2px}.state{color:#70ffb0;font-weight:900;font-size:20px}
.next{text-align:right;min-width:116px;border-radius:22px;padding:12px;background:rgba(255,212,94,.13);border:1px solid rgba(255,212,94,.22)}.medium{font-size:32px;font-weight:950}
.pill{margin:14px 0 8px;padding:10px 13px;border-radius:18px;display:inline-flex;flex-direction:column;gap:3px;background:rgba(116,240,255,.13);border:1px solid rgba(116,240,255,.24);font-size:12px;font-weight:850}.pill .subline{color:#d8eef6}
.chart{margin-top:8px;border-radius:24px;padding:10px;background:rgba(3,17,29,.35);border:1px solid rgba(116,240,255,.18)}svg{width:100%;height:205px;display:block}
.grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-top:12px}.m{border-radius:23px;padding:14px 12px;min-height:112px;border:1px solid rgba(255,255,255,.16)}.m:nth-child(1){background:rgba(53,201,255,.22)}.m:nth-child(2){background:rgba(255,212,94,.20)}.m:nth-child(3){background:rgba(112,255,176,.18)}.val{font-size:30px;font-weight:950;margin-top:6px}.small{font-size:12px;color:#b5ccd7}.err{padding:18px;border-radius:18px;background:rgba(255,109,109,.12);border:1px solid rgba(255,109,109,.28);color:#ffdede}
</style></head><body><main class="app"><div class="title">Sjósund<br>Nauthólsvík</div><div class="sub">Flóð • fjara • sjávarhiti</div>
<section class="card"><div class="toprow"><div><div class="label">Flóðastaða núna</div><div class="big" id="h">—</div><div class="state" id="st">Sæki flóðagögn</div></div><div class="next"><div class="label">Næsta flóð/fjara</div><div class="medium" id="nt">—</div><div class="small" id="nh">—</div></div></div>
<div class="pill" id="td">Flóðagögn Reykjavík: —</div><div class="chart"><svg id="chart" viewBox="0 0 390 205"></svg></div>
<div class="pill" id="obs">Síðasta athugun Nauthólsvíkur: —</div><div class="grid"><div class="m"><div class="label">Sjávarhiti</div><div class="val" id="seaTempBox">—</div><div class="small">Nauthólsvík</div></div><div class="m"><div class="label">Lofthiti</div><div class="val" id="air">—</div><div class="small">Nauthólsvík</div></div><div class="m"><div class="label">Vindur</div><div class="val" id="wind">—</div><div class="small">síðasta athugun</div></div></div></section></main>
<script>
const $=id=>document.getElementById(id);
function min(t){let[a,b]=t.split(":").map(Number);return a*60+b}
function em(e){return typeof e.minute=="number"?e.minute:min(e.time)}
function fm(v){return v==null?"—":Number(v).toFixed(2).replace(".",",")+" m"}
function et(t){return t=="high"?"Flóð":"Fjara"}
function nowm(){let d=new Date;return d.getHours()*60+d.getMinutes()}
function dmin(m){m=((m%1440)+1440)%1440;return String(Math.floor(m/60)).padStart(2,"0")+":"+String(m%60).padStart(2,"0")}
function iceDate(s){let m=String(s||"").match(/^(\\d{4})-(\\d{2})-(\\d{2})$/);if(!m)return s||"—";let y=+m[1],mo=+m[2],da=+m[3],d=new Date(Date.UTC(y,mo-1,da));let w=["sunnudagur","mánudagur","þriðjudagur","miðvikudagur","fimmtudagur","föstudagur","laugardagur"],ms=["janúar","febrúar","mars","apríl","maí","júní","júlí","ágúst","september","október","nóvember","desember"];return w[d.getUTCDay()]+" "+da+". "+ms[mo-1]+" "+y}
function est(ev,m){ev=[...ev].sort((a,b)=>em(a)-em(b));let p,n;for(let i=0;i<ev.length-1;i++){if(m>=em(ev[i])&&m<=em(ev[i+1])){p=ev[i];n=ev[i+1];break}}if(!p||!n)return null;let r=Math.max(0,Math.min(1,(m-em(p))/(em(n)-em(p)))),s=(1-Math.cos(r*Math.PI))/2;return {height:+(p.height+(n.height-p.height)*s).toFixed(2),prev:p,next:n}}
function draw(events,calc){let svg=$("chart"),today=calc.filter(e=>em(e)<=1440),ee=est(calc,1440);if(ee)today.push({time:"24:00",minute:1440,height:ee.height,type:"x"});let cur=est(calc,nowm());let mn=Math.floor((Math.min(...today.map(e=>e.height),cur?cur.height:99)-.1)/.2)*.2,mx=Math.ceil((Math.max(...today.map(e=>e.height),cur?cur.height:-99)+.1)/.2)*.2;let W=390,H=205,L=42,R=12,T=16,B=38,pw=W-L-R,ph=H-T-B,x=m=>L+Math.max(0,Math.min(1440,m))/1440*pw,y=h=>T+(mx-h)/Math.max(.2,mx-mn)*ph;let pts=today.map(e=>[x(em(e)),y(e.height)]),path="M"+pts[0][0]+","+pts[0][1];for(let i=0;i<pts.length-1;i++){let[x1,y1]=pts[i],[x2,y2]=pts[i+1],mid=(x1+x2)/2;path+=" C"+mid+","+y1+" "+mid+","+y2+" "+x2+","+y2}let grid="";for(let v=mn;v<=mx+.001;v+=.2){v=+v.toFixed(1);grid+='<line x1="'+L+'" x2="'+(L+pw)+'" y1="'+y(v)+'" y2="'+y(v)+'" stroke="rgba(255,255,255,.11)"/><text x="4" y="'+(y(v)+4)+'" fill="#d8eef6" font-size="10">'+String(v.toFixed(1)).replace(".",",")+' m</text>'}for(let m=0;m<=1440;m+=180){let lab=m==1440?"24":String(Math.floor(m/60)).padStart(2,"0");grid+='<line x1="'+x(m)+'" x2="'+x(m)+'" y1="'+T+'" y2="'+(T+ph)+'" stroke="rgba(255,255,255,.08)"/><text x="'+(x(m)-7)+'" y="'+(H-8)+'" fill="#d8eef6" font-size="11">'+lab+'</text>'}let dots=events.map(e=>{let px=x(em(e)),py=y(e.height),c=e.type=="high"?"#ffd45e":"#74f0ff",ty=e.type=="high"?py-12:py+22,lx=Math.max(40,Math.min(px-24,325));return '<circle cx="'+px+'" cy="'+py+'" r="5.5" fill="'+c+'" stroke="white" stroke-width="1.5"/><text x="'+lx+'" y="'+ty+'" fill="#f7fcff" font-size="10" font-weight="700">'+e.time+'</text><text x="'+lx+'" y="'+(ty+12)+'" fill="#b5ccd7" font-size="10">'+String(e.height).replace(".",",")+' m</text>'}).join("");let now="";if(cur){let px=x(nowm()),py=y(cur.height);now='<line x1="'+px+'" x2="'+px+'" y1="'+T+'" y2="'+(T+ph)+'" stroke="#ff6fb1" stroke-width="2" stroke-dasharray="5 5"/><circle cx="'+px+'" cy="'+py+'" r="8" fill="#ff6fb1" stroke="white" stroke-width="2.5"/>'}svg.innerHTML='<defs><linearGradient id="seaGradient" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#74f0ff" stop-opacity=".62"/><stop offset="1" stop-color="#74f0ff" stop-opacity=".04"/></linearGradient></defs><rect x="'+L+'" y="'+T+'" width="'+pw+'" height="'+ph+'" rx="16" fill="rgba(255,255,255,.035)"/>'+grid+'<path d="'+path+' L'+(L+pw)+','+(T+ph)+' L'+L+','+(T+ph)+'Z" fill="url(#seaGradient)"/><path d="'+path+'" fill="none" stroke="#74f0ff" stroke-width="4" stroke-linecap="round"/>'+dots+now}
function renderTides(d){let ev=d.events,calc=d.calcEvents||ev,cur=est(calc,nowm()),next=[...calc].sort((a,b)=>em(a)-em(b)).find(e=>em(e)>=nowm());$("h").textContent=cur?fm(cur.height):"—";$("st").textContent=next?(next.type=="high"?"Hækkandi sjór":"Lækkandi sjór"):"—";$("nt").textContent=next?dmin(em(next)):"—";$("nh").textContent=next?et(next.type)+" • "+fm(next.height):"—";let n=new Date,tl=String(n.getHours()).padStart(2,"0")+":"+String(n.getMinutes()).padStart(2,"0");$("td").innerHTML="<span>Flóðagögn Reykjavík: "+iceDate(d.date)+"</span><span class='subline'>Núna "+tl+" • "+(cur?fm(cur.height):"—")+"</span>";draw(ev,calc)}
function noTides(){$("st").textContent="Vantar flóðagögn";$("chart").innerHTML='<foreignObject x="0" y="0" width="390" height="205"><div xmlns="http://www.w3.org/1999/xhtml" class="err">Náði ekki að sækja flóðagögn.</div></foreignObject>'}
function renderObs(d){
  const sea = d?.seaTemp ?? d?.sea_temperature ?? d?.sea ?? d?.sjavarhiti ?? d?.["Sjávarhiti"];
  const air = d?.airTemp ?? d?.air_temperature ?? d?.air ?? d?.lofthiti ?? d?.["Lofthiti"];
  const wind = d?.wind ?? d?.windSpeed ?? d?.vindur ?? d?.["Vindhraði"];
  $("seaTempBox").textContent = sea !== undefined && sea !== null && sea !== "" ? String(sea).replace(".",",")+"°" : "—";
  $("air").textContent = air !== undefined && air !== null && air !== "" ? String(air).replace(".",",")+"°" : "—";
  $("wind").textContent = wind !== undefined && wind !== null && wind !== "" ? String(wind).replace(".",",")+" m/s" : "—";
  $("obs").textContent="Síðasta athugun Nauthólsvíkur: "+(d?.updated||"—")+" • v30";
}
async function get(u){let r=await fetch(u+"?v=30&t="+Date.now(),{cache:"no-store"});if(!r.ok)throw Error(r.status);return r.json()}
(async()=>{try{renderTides(await get("/api/tides"))}catch(e){noTides()}try{renderObs(await get("/api/nautholsvik"))}catch(e){renderObs(null)}})();
</script></body></html>`;

function stripHtml(html) {
  return html.replace(/<script[\s\S]*?<\/script>/gi," ").replace(/<style[\s\S]*?<\/style>/gi," ").replace(/<[^>]+>/g," ").replace(/&nbsp;/g," ").replace(/&amp;/g,"&").replace(/\s+/g," ").trim();
}
function normalizeTime(time, ampm){let[h,m]=time.split(":").map(Number);let s=String(ampm).toUpperCase();if(s==="PM"&&h!==12)h+=12;if(s==="AM"&&h===12)h=0;return String(h).padStart(2,"0")+":"+String(m).padStart(2,"0")}
function timeToMinute(t){let[h,m]=t.split(":").map(Number);return h*60+m}
function isoToday(){let d=new Date();return d.getUTCFullYear()+"-"+String(d.getUTCMonth()+1).padStart(2,"0")+"-"+String(d.getUTCDate()).padStart(2,"0")}
function parseDate(s){let months={january:"01",february:"02",march:"03",april:"04",may:"05",june:"06",july:"07",august:"08",september:"09",october:"10",november:"11",december:"12"};let m=String(s||"").match(/(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/);return m?m[3]+"-"+(months[m[2].toLowerCase()]||"01")+"-"+String(+m[1]).padStart(2,"0"):isoToday()}
function json(obj,status=200){return new Response(JSON.stringify(obj,null,2),{status,headers:{"content-type":"application/json; charset=utf-8","cache-control":"no-store"}})}
function calcEventsFor(events){let out=events.map(e=>({...e,minute:timeToMinute(e.time)}));if(out.length>=4)out.push({...out[0],minute:out[0].minute+1440,nextDay:true});return out}
async function getTides(){
  let r=await fetch(TIDE_URL,{headers:{"user-agent":"Mozilla/5.0 SjosundWorker"},cf:{cacheTtl:0,cacheEverything:false}});
  if(!r.ok)throw Error("Tide-Forecast svaraði "+r.status);
  let text=stripHtml(await r.text());
  let dm=text.match(/Today's tide times for Reykjavik:\s*([A-Za-z]+day\s+\d{1,2}\s+[A-Za-z]+\s+\d{4})/i)||text.match(/today on\s+([A-Za-z]+day\s+\d{1,2}\s+[A-Za-z]+\s+\d{4})/i);
  let date=parseDate(dm?.[1]), rows=[], re=/(Low Tide|High Tide)\s+(\d{1,2}:\d{2})\s*(AM|PM)[\s\S]{0,180}?([0-9]+(?:\.[0-9]+)?)\s*m\b/gi, m;
  while((m=re.exec(text))!==null && rows.length<4){let time=normalizeTime(m[2],m[3]),height=Number(m[4]);if(height>=0&&height<=8)rows.push({type:m[1].toLowerCase().startsWith("high")?"high":"low",time,height,minute:timeToMinute(time)})}
  if(rows.length<4)throw Error("Fann ekki 4 flóðaviðburði");
  return {station:"Reykjavík",source:"Tide-Forecast",date,events:rows,calcEvents:calcEventsFor(rows)};
}
function valueBeforeLabel(text, label, unitPattern){
  const idx = text.toLowerCase().indexOf(label.toLowerCase());
  if (idx < 0) return null;
  const before = text.slice(Math.max(0, idx - 80), idx);
  const re = new RegExp("([0-9]+(?:[.,][0-9]+)?)\\s*" + unitPattern, "gi");
  let match, last = null;
  while ((match = re.exec(before)) !== null) last = match[1];
  return last;
}
function valueAfterLabel(text, label, unitPattern){
  const idx = text.toLowerCase().indexOf(label.toLowerCase());
  if (idx < 0) return null;
  const after = text.slice(idx, idx + 80);
  const re = new RegExp(label + "\\s*([0-9]+(?:[.,][0-9]+)?)\\s*" + unitPattern, "i");
  return (after.match(re) || [])[1] || null;
}
async function getObs(){
  let r=await fetch(NAUTHOLSVIK_URL,{headers:{"user-agent":"Mozilla/5.0 SjosundWorker"},cf:{cacheTtl:0,cacheEverything:false}});
  if(!r.ok)throw Error("Nauthólsvík svaraði "+r.status);
  let text=stripHtml(await r.text()), updated=((text.match(/Síðasta athugun:\s*([0-9./: ]+)/i)||[])[1]||"").trim()||null;
  const airTemp = valueBeforeLabel(text,"Lofthiti","°?C") || valueAfterLabel(text,"Lofthiti","°?C");
  const seaTemp = valueBeforeLabel(text,"Sjávarhiti","°?C") || valueAfterLabel(text,"Sjávarhiti","°?C");
  const wind = valueBeforeLabel(text,"Vindhraði","m\\/s") || valueAfterLabel(text,"Vindhraði","m\\/s");
  return {seaTemp,airTemp,wind,updated,source:"Nauthólsvík"};
}
export default {async fetch(request){let url=new URL(request.url);try{if(url.pathname==="/"||url.pathname==="/index.html")return new Response(html,{headers:{"content-type":"text/html; charset=utf-8","cache-control":"no-store"}});if(url.pathname==="/api/tides")return json(await getTides());if(url.pathname==="/api/nautholsvik")return json(await getObs());if(url.pathname==="/health")return json({ok:true});return json({error:"Not found"},404)}catch(e){return json({error:e.message},502)}}};

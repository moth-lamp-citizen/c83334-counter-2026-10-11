
import fs from "node:fs";
const OUT = "./";
const p1 = JSON.parse(fs.readFileSync(OUT + "post-580-page1.json", "utf8"));
const p2 = JSON.parse(fs.readFileSync(OUT + "post-580-page2.json", "utf8"));
const all = [...(p1.comments||[]), ...(p2.comments||[])];
const erp = all.filter(c => JSON.stringify(c.author||"").includes("erpin")).sort((a,b)=>a.id-b.id);
const ids = [102154,102336,102454,102613,102698,102776,102861,102936];
const posts = erp.filter(c => ids.includes(c.id));
console.log("posts (8):");
let prev = null;
const intervals2h = [];
for (const c of posts) {
  const t = Number(c.created_at);
  let gap = prev ? (t - prev)/1000 : null;
  if (gap !== null) (gap > 14000 ? null : intervals2h.push(gap));
  console.log("  c"+c.id, new Date(t).toISOString(), gap===null?"":("gap "+gap.toFixed(3)+" s = "+Math.floor(gap/3600)+"h"+Math.floor((gap%3600)/60)+"m"+(gap%60).toFixed(3)+"s"));
  prev = t;
}
const mean = intervals2h.reduce((a,b)=>a+b,0)/intervals2h.length;
const varS = intervals2h.reduce((a,b)=>a+(b-mean)**2,0)/(intervals2h.length-1);
console.log("2h intervals n="+intervals2h.length, "mean", mean.toFixed(3), "sd(sample)", Math.sqrt(varS).toFixed(3), "min", Math.min(...intervals2h).toFixed(3), "max", Math.max(...intervals2h).toFixed(3));
const fourh = (Date.parse("2026-10-11T10:14:45.285Z") - Date.parse("2026-10-11T06:13:39.464Z"))/1000;
console.log("4h gap", fourh.toFixed(3), "vs 2x mean residual", (fourh - 2*mean).toFixed(3));
const last = Date.parse("2026-10-11T22:17:43.051Z");
console.log("next predicted:", new Date(last + mean*1000).toISOString(), "(+ mean)");
console.log("next at +7200s:", new Date(last + 7200000).toISOString(), "| at +7230s:", new Date(last+7230000).toISOString());
// lags new three
const ev = JSON.parse(fs.readFileSync(OUT + "mod-events-2315Z.json","utf8"));
for (const e of ev.events||[]) {
  const m = String(e.detail||"").match(/collapsed comment (\d+)/);
  if (m && [102776,102861,102936].includes(Number(m[1]))) {
    const c = erp.find(x=>x.id===Number(m[1]));
    const lag = (Number(e.created_at) - Number(c.created_at))/1000;
    console.log("  e"+e.id, "c"+m[1], "posted", new Date(Number(c.created_at)).toISOString(), "collapsed", new Date(Number(e.created_at)).toISOString(), "lag", lag.toFixed(3));
  }
}

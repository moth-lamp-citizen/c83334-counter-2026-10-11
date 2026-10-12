import fs from "node:fs";
import { readFileSync } from "node:fs";
// Offline: the window calibration and the post enumeration, from saved pages and one changes page.
const p1 = JSON.parse(fs.readFileSync("post-580-page1.json", "utf8"));
const p2 = JSON.parse(fs.readFileSync("post-580-page2.json", "utf8"));
const rows = [...(p1.comments || []), ...(p2.comments || [])]
  .filter(c => JSON.stringify(c.author || "").includes("erpin"))
  .sort((a, b) => a.id - b.id);
const times = rows.map(c => Number(c.created_at));
const gaps = []; for (let i = 1; i < times.length; i++) gaps.push(times[i] - times[i - 1]);
const norm = gaps.filter(g => g < 10000000);
const mean = norm.reduce((s, g) => s + g, 0) / norm.length;
const nine = norm.slice(-9);
const m9 = nine.reduce((s, g) => s + g, 0) / nine.length;
const sd9 = Math.sqrt(nine.reduce((s, g) => s + (g - m9) ** 2, 0) / (nine.length - 1));
const sdAll = Math.sqrt(norm.reduce((s, g) => s + (g - mean) ** 2, 0) / (norm.length - 1));
console.log("stream mean", (mean / 1000).toFixed(3), "s; nine-gap mean", (m9 / 1000).toFixed(3), "s; difference", ((mean - m9) / 1000).toFixed(3), "s");
console.log("stream sd", (sdAll / 1000).toFixed(3), "s -> nine-gap SE", (sdAll / 3000).toFixed(3), "s | nine sd", (sd9 / 1000).toFixed(3), "s -> SE", (sd9 / 3000).toFixed(3), "s");
console.log("difference in stream-SE units", ((mean - m9) / (sdAll / 3)).toFixed(2), "| in nine-SE units", ((mean - m9) / (sd9 / 3)).toFixed(2));
for (const [name, ctr] of [["stream-mean scale", mean], ["nine-gap-mean scale", m9]]) {
  const dev = norm.map(g => g - ctr);
  const line = [30, 40, 45, 60].map(t => t + "s:" + dev.filter(d => Math.abs(d) > t * 1000).length).join(" ");
  console.log(name, "n=" + norm.length, line, "| range", (Math.min(...dev) / 1000).toFixed(1), "..", (Math.max(...dev) / 1000).toFixed(1), "s");
}
const tail = norm.map(g => g - mean).filter(d => d > 30000).map(d => (d / 1000).toFixed(1));
console.log("stream-scale tail > 30 s:", tail.length, JSON.stringify(tail));
const last = times[times.length - 1];
console.log("centre = last + nine-gap mean:", new Date(last + m9).toISOString(), "| last + stream mean:", new Date(last + mean).toISOString());
const ch = JSON.parse(readFileSync("changes-p0.json", "utf8"));
const posts = ch.posts || [];
const ids = posts.map(p => p.id).sort((a, b) => a - b);
console.log("window posts:", posts.length, "ids", ids[0] + ".." + ids[ids.length - 1], "dense", ids.every((v, i) => v === ids[0] + i), "changes has_more", ch.has_more);
for (const p of posts.filter(p => JSON.stringify(p.author || {}).includes("erpin"))) console.log("  erpin post", p.id, new Date(Number(p.created_at)).toISOString(), String(p.title).slice(0, 70));

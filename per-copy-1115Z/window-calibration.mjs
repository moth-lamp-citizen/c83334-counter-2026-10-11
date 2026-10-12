import fs from "node:fs";
// Offline: window calibration on both scales, and the post enumeration for the "second artifact" negative.
const p1 = JSON.parse(fs.readFileSync("post-580-page1.json", "utf8"));
const p2 = JSON.parse(fs.readFileSync("post-580-page2.json", "utf8"));
const rows = [...(p1.comments || []), ...(p2.comments || [])]
  .filter(c => JSON.stringify(c.author || "").includes("erpin"))
  .sort((a, b) => a.id - b.id);
const times = rows.map(c => Number(c.created_at));
const gaps = []; for (let i = 1; i < times.length; i++) gaps.push(times[i] - times[i - 1]);
const norm = gaps.filter(g => g < 10000000);
const mean = norm.reduce((s, g) => s + g, 0) / norm.length;
const ten = norm.slice(-10);
const m10 = ten.reduce((s, g) => s + g, 0) / ten.length;
console.log("stream mean", (mean / 1000).toFixed(3), "s; last-10 mean", (m10 / 1000).toFixed(3), "s; difference", ((mean - m10) / 1000).toFixed(3), "s");
for (const [name, ctr] of [["stream-mean scale", mean], ["last-10-mean scale", m10]]) {
  const d = norm.map(g => g - ctr);
  console.log(name, "n=" + norm.length, [30, 40, 45, 60].map(t => t + "s:" + d.filter(x => Math.abs(x) > t * 1000).length).join(" "), "| range", (Math.min(...d) / 1000).toFixed(1), "..", (Math.max(...d) / 1000).toFixed(1), "s");
}
const tail = norm.map(g => g - mean).filter(d => d > 30000).map(d => (d / 1000).toFixed(1));
console.log("stream-scale tail > 30 s:", tail.length, JSON.stringify(tail));
const last = times[times.length - 1];
console.log("centre = last + stream mean:", new Date(last + mean).toISOString(), "| last + last-10 mean:", new Date(last + m10).toISOString());
const ch = JSON.parse(fs.readFileSync("changes-p0.json", "utf8"));
const posts = ch.posts || [];
const ids = posts.map(p => p.id).sort((a, b) => a - b);
console.log("window posts:", posts.length, "ids", ids[0] + ".." + ids[ids.length - 1], "dense", ids.every((v, i) => v === ids[0] + i), "changes has_more", ch.has_more);
for (const p of posts.filter(p => JSON.stringify(p.author || {}).includes("erpin"))) console.log("  erpin post", p.id, new Date(Number(p.created_at)).toISOString(), String(p.title).slice(0, 70));
const pulse = JSON.parse(fs.readFileSync("pulse.json", "utf8"));
console.log("pulse board.latest_post_id", pulse.board.latest_post_id, "| posts end", ids[ids.length - 1], "| agree", pulse.board.latest_post_id === ids[ids.length - 1]);
